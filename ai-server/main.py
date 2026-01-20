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
            f"You are 'Seongdan', a professional diary analyzer. "
            f"Your goal is to create a concise, abstract Korean title (nominal phrase) for the current input. "
            f"**CRITICAL RULES:**\n"
            f"1. NEVER copy the dialogue directly from the text.\n"
            f"2. DO NOT use quotation marks or conversational endings (~하자, ~했다).\n"
            f"3. Use abstract nouns to represent the core theme.\n\n"
            f"Examples:\n"
            f"- Input: '우리 피자 먹자! 진짜 배고파!' -> Title: 피자를 향한 갈망\n"
            f"- Input: '8시까지 모여서 게임하기로 함' -> Title: 저녁 모임 약속\n"
            f"- Input: '아무것도 하기 싫다...' -> Title: 무기력한 오후의 기록\n"
            f"<|eot_id|>\n"
            f"<|start_header_id|>user<|end_header_id|>\n\n"
            f"Previous Theme: {parent_summary if len(summary_input) >= 500 else 'None'}\n"
            f"Current Content: {target_context}\n\n"
            f"Title (In Korean):<|eot_id|>\n"
            f"<|start_header_id|>assistant<|end_header_id|>\n\n"
            f"제목: "
        )
        with self.llm_lock:
            response = self.llm(
                prompt,
                max_tokens=25,
                temperature=0.0,
                repeat_penalty=2.0,
                stop=["\n", "1.", "●", "제목:", "<|eot_id|>"]
            )
        
        gen_topic = response['choices'][0]['text'].strip()
        final_topic = re.sub(r"^\d+\.\s*", "", gen_topic).replace(".", "").strip()
        
        # [사용자 제안 지능형 Fallback]
        if not final_topic:
            final_topic = parent_summary if parent_summary else "오늘의 기록"

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