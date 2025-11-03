import torch
import torch.nn.functional as F
import re
import grpc
import numpy as np
import time
import threading
from concurrent import futures
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer, util
from llama_cpp import Llama

import mutr_analysis_pb2
import mutr_analysis_pb2_grpc

class MUTRModelEngine:
    def __init__(self):
        self.device = torch.device("cpu")
        
        # 1. 주제 추출 (Llama-3.2-3B) - [KoBART 대체 및 고도화]
        self.llm = Llama(
            model_path="./models/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
            n_ctx=1024, 
            n_threads=6, 
            n_gpu_layers=18,
            n_batch=512,
            verbose=True
        )
        self.llm_lock = threading.Lock()
        
        # 2. 감정 분석 (RoBERTa)
        self.sent_tokenizer = AutoTokenizer.from_pretrained("Seonghaa/korean-emotion-classifier-roberta")
        self.sent_model = AutoModelForSequenceClassification.from_pretrained("Seonghaa/korean-emotion-classifier-roberta").to(self.device)
        
        # 3. 변조 분석 (KR-SBERT)
        self.mut_model = SentenceTransformer("snunlp/KR-SBERT-V40K-klueNLI-augSTS").to(self.device)

        self.sent_model.eval()
        print(f"✅ MUTR 고도화 엔진 로드 완료 (Llama 3.2 통합 버전)")

        self.emotion_map = {
            "기쁨": "joy", "당황": "embarrassed", "분노": "anger",
            "불안": "anxiety", "상처": "hurt", "슬픔": "sadness", "평온": "neutral"
        }

    def _calibrate_mutation(self, similarity):
        """유사도를 변조 점수로 보정"""
        if similarity >= 0.35: score = (1.0 - similarity) * (0.2 / 0.65)
        elif similarity >= 0.15: score = 0.7 - (similarity - 0.15) * (0.4 / 0.2)
        else: score = 1.0 - max(0, similarity)
        return round(max(0.0, min(1.0, score)), 4)
    
    import re

    def get_final_topic(self, gen_topic, parent_summary):
        """
        LLM이 생성한 제목(gen_topic)을 정제하여 최종 제목(final_topic)을 반환합니다.
        """
        # 1. 숫자 패턴(예: "1. 제목") 및 마침표 제거
        step1 = re.sub(r"^\d+\.\s*", "", gen_topic).replace(".", "").strip()
        
        # 2. 오염된 단어 필터링 (외국어가 포함된 어절 삭제)
        # 한글, 영문, 숫자, 공백이 아닌 문자가 하나라도 섞인 단어 덩어리를 통째로 제거
        pattern = r'\s?\S*[^가-힣a-zA-Z0-9\s]\S*'
        step2 = re.sub(pattern, '', step1).strip()
        
        # '제목:' 문구가 포함된 경우 제거
        step2 = step2.replace("제목", "").strip()

        # 3. 최종 Fallback
        # 필터링 후 결과가 비어있다면, LLM이 실패한 것으로 간주하고 이전 요약을 유지함
        if not step2:
            final_topic = parent_summary if parent_summary else "오늘의 기록"
        else:
            final_topic = step2

        # UI 가독성을 위한 최종 길이 제한
        return final_topic[:20]

    def analyze(self, content, parent_summary, full_context):
        # [STEP 1] 감정 분석
        sent_inputs = self.sent_tokenizer(content, return_tensors="pt", truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            sent_outputs = self.sent_model(**sent_inputs)
            sent_probs = F.softmax(sent_outputs.logits, dim=-1)
            conf, pred = torch.max(sent_probs, dim=-1)
            raw_emotion = self.sent_model.config.id2label[pred.item()]
            emotion_label = self.emotion_map.get(raw_emotion, raw_emotion)

        # [STEP 2] 주제 추출 (Llama 3.2 3B)
        summary_input = f"{full_context} {content}".strip()
        target_context = summary_input[-500:].strip() # 최신 500자 맥락

        prompt = (
            f"<|start_header_id|>system<|end_header_id|>\n\n"
            f"You are 'Seongdan', an expert in narrative evolution. "
            f"Your task is to detect the 'Mutation' in the user's life and create a Korean title.\n\n"
            f"**ANALYSIS STEPS:**\n"
            f"1. Compare the 'Past Summary' with the 'Current Entry'.\n"
            f"2. If the topic or emotion has changed (Mutation), create a title reflecting the **NEW** direction.\n"
            f"3. If it's a continuation, create a title that deepens the existing theme.\n\n"
            f"**STRICT RULES:**\n"
            f"- Use ONLY Korean (Hangul). No Thai, No Vietnamese.\n"
            f"- Output ONLY a nominal phrase (e.g., '갑작스러운 이별', '새로운 희망의 시작').<|eot_id|>\n"
            f"<|start_header_id|>user<|end_header_id|>\n\n"
            f"● Past Summary (The baseline): {parent_summary}\n"
            f"● Recent Context: {target_context}\n"
            f"● Current Entry (The latest change): {content}\n\n"
            f"Instruction: Observe the flow and generate a title that captures the current state of this narrative.<|eot_id|>\n"
            f"<|start_header_id|>assistant<|end_header_id|>\n\n"
            f"제목: "
        )
        with self.llm_lock:
            response = self.llm(
                prompt,
                max_tokens=30,
                temperature=0.0,      # 창의성보다는 정확도 우선
                repeat_penalty=1.1,   # 외국어 탈출 방지를 위해 낮게 설정
                top_p=0.9,            # 상위 확률 토큰 집중
                top_k=40,             # 후보군을 한국어 위주로 좁힘
                stop=["\n", "제목:", "<|eot_id|>"]
            )
        
        gen_topic = response['choices'][0]['text'].strip()
        final_topic = self.get_final_topic(gen_topic, parent_summary)

        # [STEP 3] 변조 점수 계산
        mutation_score = 0.0
        if parent_summary and parent_summary.strip():
            embeddings = self.mut_model.encode([parent_summary, content], convert_to_tensor=True)
            raw_sim = util.cos_sim(embeddings[0], embeddings[1]).item()
            mutation_score = self._calibrate_mutation(raw_sim)

        return final_topic, emotion_label, float(conf.item()), float(mutation_score)

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

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    mutr_analysis_pb2_grpc.add_AnalysisServiceServicer_to_server(MUTRAnalysisServicer(), server)
    server.add_insecure_port('[::]:50051')
    print("🚀 MUTR AI Engine (Verified) started on port 50051")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    serve()