import torch
import numpy as np
from transformers import GPT2LMHeadModel, PreTrainedTokenizerFast

class NaturalnessChecker:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        # 한국어 범용 언어 모델 (가장 유명하고 표준적임)
        self.model_name = "skt/kogpt2-base-v2"
        self.tokenizer = PreTrainedTokenizerFast.from_pretrained(self.model_name)
        self.model = GPT2LMHeadModel.from_pretrained(self.model_name).to(self.device)
        self.model.eval()

    def calculate_ppl(self, text):
        """문장의 Perplexity를 계산. 낮을수록 자연스러움."""
        encodings = self.tokenizer(text, return_tensors="pt")
        input_ids = encodings.input_ids.to(self.device)
        target_ids = input_ids.clone()

        with torch.no_grad():
            outputs = self.model(input_ids, labels=target_ids)
            log_likelihood = outputs.loss.item()
            
        return np.exp(log_likelihood) # PPL 값 반환

# --- 테스트 ---
checker = NaturalnessChecker()
samples = [
    "오늘 날씨가 좋아서 친구와 산책을 했다.",      # 자연스러움
    "오늘의 한성훈월 월 월",                    # 매우 이상함
    "삼성전자 주가가 오늘 큰 폭으로 올랐다.",       # 자연스러움
    "하이하이 하이 하이하이원하이"                # 반복/이상함
]

print(f"{'테스트 문장':<30} | {'PPL 점수'} | {'판정'}")
print("-" * 70)

for txt in samples:
    ppl = checker.calculate_ppl(txt)
    # 일반적인 문장은 PPL 10~80 사이, 이상한 문장은 200~1000 이상으로 튑니다.
    status = "PASS" if ppl < 150 else "FAIL (Weird)"
    print(f"{txt[:28]:<30} | {ppl:.2f} | {status}")