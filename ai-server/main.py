import os
import torch
import torch.nn.functional as F
import re
import grpc
import numpy as np
import threading
from concurrent import futures
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer, util
from llama_cpp import Llama
from huggingface_hub import hf_hub_download

import mutr_analysis_pb2
import mutr_analysis_pb2_grpc

server_port = int(os.getenv("AI_SERVER_PORT", "50051"))
n_gpu_layers = int(os.getenv("n_gpu_layers", "0"))
n_threads = int(os.getenv("n_threads", "6"))

class MUTRModelEngine:
    def __init__(self):
        self.device = torch.device("cpu")

        # 1. 한국어 특화 모델 로드 (Bllossom Llama-3.2-3B)
        # 외국어 유출 문제를 근본적으로 해결하고 자연스러운 한국어 생성을 지원합니다.
        self.llm = Llama(
            model_path=model_path,
            n_ctx=1024, 
            n_threads=n_threads,
            n_gpu_layers=n_gpu_layers,
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
        print(f"✅ MUTR Bllossom 엔진 로드 완료 (한국어 최적화 버전)")

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
    
    def get_final_topic(self, gen_topic, baseline_topic):
        """
        Bllossom 모델 출력에 맞춰 간소화된 텍스트 정제 로직
        """
        # 불필요한 서술어 및 특수문자 제거
        step1 = re.sub(r"^\d+\.\s*", "", gen_topic)
        step1 = step1.replace("'", "").replace("\"", "")
        step1 = step1.replace(".", "").replace("제목:", "").replace("제목", "").strip()
        
        # 최종 Fallback: 생성 실패 시 이전 요약 유지
        if not step1:
            final_topic = baseline_topic if baseline_topic else "오늘의 기록"
        else:
            final_topic = step1

        return final_topic

    def analyze(self, content, parent_topic, baseline_topic, full_context):
        # [STEP 1] 감정 분석
        sent_inputs = self.sent_tokenizer(content, return_tensors="pt", truncation=True, max_length=512).to(self.device)
        with torch.no_grad():
            sent_outputs = self.sent_model(**sent_inputs)
            sent_probs = F.softmax(sent_outputs.logits, dim=-1)
            conf, pred = torch.max(sent_probs, dim=-1)
            raw_emotion = self.sent_model.config.id2label[pred.item()]
            emotion_label = self.emotion_map.get(raw_emotion, raw_emotion)

        # [STEP 2] 주제 추출 (한국어 프롬프트 고도화)
        # 모델의 모국어인 한국어로 지시하여 더 정확한 결과물을 유도합니다.
        prompt = (
            f"<|start_header_id|>system<|end_header_id|>\n\n"
            f"당신은 기록의 흐름을 분석하는 서사 전문가 '성단'입니다. "
            f"제공된 '과거 기준'과 '최근 서사 흐름'을 대조하여, 이 이야기가 현재 어떤 상태에 도달했는지 포착해 제목을 지어주세요.\n\n"
            f"**분석 전략:**\n"
            f"1. 반드시 한국어로만 답변하세요.\n"
            f"2. 최근 서사 흐름이 전체 서사에서 갖는 '최종적인 의미'를 제목에 반영하세요.\n"
            f"3. 과거의 주제에서 얼마나 멀어졌는지, 혹은 어떻게 이어지는지를 고려하세요.\n"
            f"4. 명사형으로 20자 내외로 간결하게 작성하세요.<|eot_id|>\n"
            f"<|start_header_id|>user<|end_header_id|>\n\n"
            f"● 과거 기준 (Baseline): {baseline_topic}\n\n"
            f"● 최근 서사 흐름 (Flow):\n"
            f"{full_context}\n\n"
            f"지시: 과거로부터 이어진 서사가 현재의 흐름 끝에서 어떤 모습으로 변모했는지 한글 제목으로 생성하세요.<|eot_id|>\n"
            f"<|start_header_id|>assistant<|end_header_id|>\n\n"
            f"제목: "
        )
        
        with self.llm_lock:
            response = self.llm(
                prompt,
                max_tokens=30,
                temperature=0.0,
                repeat_penalty=1.2,   # 한국어 반복 방지 및 일관성 강화
                top_p=0.9,
                top_k=40,
                stop=["\n", "제목:", "<|eot_id|>"]
            )
        
        gen_topic = response['choices'][0]['text'].strip()
        final_topic = self.get_final_topic(gen_topic, baseline_topic)

        # [STEP 3] 변조 점수 계산
        mutation_score = 0.0
        if parent_topic and parent_topic.strip():
            embeddings = self.mut_model.encode([parent_topic, content], convert_to_tensor=True)
            raw_sim = util.cos_sim(embeddings[0], embeddings[1]).item()
            mutation_score = self._calibrate_mutation(raw_sim)

        return final_topic, emotion_label, float(conf.item()), float(mutation_score)

class MUTRAnalysisServicer(mutr_analysis_pb2_grpc.AnalysisServiceServicer):
    def __init__(self):
        self.engine = MUTRModelEngine()

    def AnalyzeNode(self, request, context):
        topic, emotion, conf, mut = self.engine.analyze(
            request.content, request.parent_topic, request.baseline_topic, request.full_context
        )
        return mutr_analysis_pb2.AnalysisResponse(
            topic=topic, emotion=emotion, confidence=conf, mutation_score=mut
        )

def download_model():
    # 1. 설정 (사용하려는 모델에 맞춰 수정하세요)
    repo_id = "Bllossom/llama-3.2-Korean-Bllossom-3B-gguf-Q4_K_M"
    filename = "llama-3.2-Korean-Bllossom-3B-gguf-Q4_K_M.gguf"
    local_dir = "./models"

    # 2. 경로 확인 및 생성
    if not os.path.exists(local_dir):
        os.makedirs(local_dir)

    target_path = os.path.join(local_dir, filename)

    # 3. 파일 존재 여부 확인 후 다운로드
    if not os.path.exists(target_path):
        print(f"🚀 모델을 찾을 수 없습니다. 다운로드를 시작합니다: {filename}")
        path = hf_hub_download(
            repo_id=repo_id,
            filename=filename,
            local_dir=local_dir
        )
        print(f"✅ 다운로드 완료: {path}")
    else:
        print(f"📦 이미 모델이 존재합니다: {target_path}")

    return target_path

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    mutr_analysis_pb2_grpc.add_AnalysisServiceServicer_to_server(MUTRAnalysisServicer(), server)
    server.add_insecure_port(f"[::]:{server_port}")
    print(f"🚀 MUTR Bllossom AI Engine started on port {server_port}")
    server.start()
    server.wait_for_termination()

if __name__ == "__main__":
    model_path = download_model()
    serve()