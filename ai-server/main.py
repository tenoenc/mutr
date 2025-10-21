import torch
import torch.nn.functional as F
import re
import grpc
import numpy as np
from concurrent import futures
from transformers import AutoTokenizer, AutoModelForSequenceClassification, BartForConditionalGeneration, GPT2LMHeadModel, PreTrainedTokenizerFast
from sentence_transformers import SentenceTransformer, util
from kobart import get_kobart_tokenizer

# gRPC 생성 파일
import mutr_analysis_pb2
import mutr_analysis_pb2_grpc

class MUTRModelEngine:
    """MUTR AI 모델들을 관리하고 고도화된 가드레일 로직을 수행하는 엔진"""
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # 1. 주제 추출 (KoBART-title)
        self.kb_tokenizer = get_kobart_tokenizer()
        self.kb_model = BartForConditionalGeneration.from_pretrained("EbanLee/kobart-title").to(self.device)
        
        # 2. 감정 분석 (RoBERTa)
        self.sent_tokenizer = AutoTokenizer.from_pretrained("Seonghaa/korean-emotion-classifier-roberta")
        self.sent_model = AutoModelForSequenceClassification.from_pretrained("Seonghaa/korean-emotion-classifier-roberta").to(self.device)
        
        # 3. 변조 및 의미 유사도 분석 (KR-SBERT)
        self.mut_model = SentenceTransformer("snunlp/KR-SBERT-V40K-klueNLI-augSTS").to(self.device)

        # 4. 품질 검증 가드레일 (KoGPT2)
        self.ppl_tokenizer = PreTrainedTokenizerFast.from_pretrained("skt/kogpt2-base-v2")
        self.ppl_model = GPT2LMHeadModel.from_pretrained("skt/kogpt2-base-v2").to(self.device)
        
        self.kb_model.eval()
        self.sent_model.eval()
        self.ppl_model.eval()
        print(f"✅ MUTR 고도화 엔진 로드 완료 ({self.device})")

    def _calculate_ppl(self, text):
        """문장의 자연스러움(Perplexity) 계산"""
        if not text or len(text.strip()) < 1: return 999999
        encodings = self.ppl_tokenizer(text, return_tensors="pt")
        input_ids = encodings.input_ids.to(self.device)
        with torch.no_grad():
            outputs = self.ppl_model(input_ids, labels=input_ids)
            ppl = np.exp(outputs.loss.item())
        return ppl if not (np.isnan(ppl) or np.isinf(ppl)) else 999999

    def _validate_by_ai(self, content, generated, ppl_score, sim_score):
        """
        [AI 수치 기반 엄격한 품질 검증]
        1. 의미 유사도: 초단문 입력 시 기준 상향 (0.65) 하여 환각 차단
        2. 가변 PPL: 15자 미만 핵심 요약 보호 (임계값 완화)
        3. 반복성: 10자 이상 문장에서 문자 반복률 검사
        """
        # (1) 동적 유사도 임계값: 입력이 짧을수록 더 엄격하게 검증 (환각 방어)
        sim_threshold = 0.65 if len(content) <= 5 else 0.38
        if sim_score < sim_threshold:
            return False, "SEMANTIC_MISMATCH"
        
        # (2) 가변 PPL 임계값: 짧은 핵심 요약(요가, 졸업식 등)의 과잉 진압 방지
        ppl_threshold = 100000 if len(generated.replace(" ", "")) < 15 else 350
        if ppl_score > ppl_threshold:
            return False, "UNNATURAL_PPL"
            
        # (3) 반복성 검사 보정: 공백/기호 제외, 10자 이상에서만 작동
        if len(generated) > 10:
            pure_gen = re.sub(r"[^\w]", "", generated) 
            if len(pure_gen) > 0:
                for char in set(pure_gen):
                    if pure_gen.count(char) / len(pure_gen) > 0.35:
                        return False, "REPETITIVE_ARTIFACT"

        return True, "PASS"

    def _format_clean(self, text):
        """뉴스 필터링이 아닌 출력 '형식' 정제 (대괄호 제거)"""
        return re.sub(r"\[.*?\]", "", text).strip()

    def _calibrate_mutation(self, similarity):
        """유사도를 MUTR 변조 점수(0~1)로 보정"""
        if similarity >= 0.35: score = (1.0 - similarity) * (0.2 / 0.65)
        elif similarity >= 0.15: score = 0.7 - (similarity - 0.15) * (0.4 / 0.2)
        else: score = 1.0 - max(0, similarity)
        return round(max(0.0, min(1.0, score)), 4)

    def analyze(self, content, parent_summary, full_context):
        # STEP 1. 감정 분석 (현재 노드 글 단독)
        sent_inputs = self.sent_tokenizer(content, return_tensors="pt", truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            sent_outputs = self.sent_model(**sent_inputs)
            sent_probs = F.softmax(sent_outputs.logits, dim=-1)
            conf, pred = torch.max(sent_probs, dim=-1)
            emotion_label = self.sent_model.config.id2label[pred.item()]

        # STEP 2. 주제 추출 (전체 맥락 + 현재 글)
        summary_input = f"{full_context} {content}".strip()
        kb_inputs = self.kb_tokenizer(summary_input, return_tensors="pt", truncation=True, max_length=1024).to(self.device)
        with torch.no_grad():
            summary_ids = self.kb_model.generate(
                input_ids=kb_inputs['input_ids'], max_length=40, num_beams=4,
                repetition_penalty=4.5, no_repeat_ngram_size=2
            )
        generated_raw = self.kb_tokenizer.decode(summary_ids[0], skip_special_tokens=True).strip()
        cleaned_topic = self._format_clean(generated_raw)

        # STEP 3. AI 기반 가드레일 검증
        ppl = self._calculate_ppl(cleaned_topic)
        # 현재 노드 내용과 요약문의 의미 유사도 측정
        sim_val = util.cos_sim(self.mut_model.encode(content), self.mut_model.encode(cleaned_topic)).item()
        
        is_pass, _ = self._validate_by_ai(content, cleaned_topic, ppl, sim_val)
        # 품질 미달 시 원문 앞부분으로 안전하게 Fallback
        final_topic = cleaned_topic if is_pass else content[:15].strip() + "..."

        # STEP 4. 변조 점수 계산 (이전 요약 vs 현재 글)
        mutation_score = 0.0
        if parent_summary and parent_summary.strip():
            embeddings = self.mut_model.encode([parent_summary, content], convert_to_tensor=True)
            raw_sim = util.cos_sim(embeddings[0], embeddings[1]).item()
            mutation_score = self._calibrate_mutation(raw_sim)

        return final_topic, emotion_label, float(conf.item()), float(mutation_score)

# --- [gRPC 서비스 정의] ---
class MUTRAnalysisServicer(mutr_analysis_pb2_grpc.AnalysisServiceServicer):
    def __init__(self):
        self.engine = MUTRModelEngine()

    def AnalyzeNode(self, request, context):
        topic, emotion, conf, mut = self.engine.analyze(
            request.content, request.parent_summary, request.full_context
        )
        return mutr_analysis_pb2.AnalysisResponse(
            topic=topic, emotion=emotion, confidence=conf, mutation_score=mut
        )

# --- [서버 실행부] ---
def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    mutr_analysis_pb2_grpc.add_AnalysisServiceServicer_to_server(MUTRAnalysisServicer(), server)
    server.add_insecure_port('[::]:50051')
    print("🚀 MUTR AI-Guardrail Engine started on port 50051")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    serve()