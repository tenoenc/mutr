import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch.nn.functional as F

def run_pure_sentiment_analysis():
    # 1. 모델 및 토크나이저 로드 (MUTR 전용 감정 분류 모델)
    model_id = "Seonghaa/korean-emotion-classifier-roberta"
    print(f"🔄 감정 분석 모델 로드 중: {model_id}")
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_id)
        model = AutoModelForSequenceClassification.from_pretrained(model_id)
        
        # GPU 사용 가능 시 GPU로 이동
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model.to(device)
        model.eval()
        print(f"✅ 로드 완료! (접속 장치: {device})")
    except Exception as e:
        print(f"❌ 모델 로드 실패: {e}")
        return

    print("\n" + "="*50)
    print("✨ MUTR 순수 감정 분석 테스트")
    print("작성한 글의 감정만 독립적으로 분석합니다. (종료: q)")
    print("="*50)

    while True:
        # 2. 분석할 문장 입력
        user_input = input("\n✍️  [분석할 문장]: ").strip()
        
        if user_input.lower() in ['q', 'exit', 'quit']:
            print("👋 테스트를 종료합니다.")
            break
        if not user_input:
            continue

        try:
            # 3. 토크나이징 (단일 문장 처리)
            inputs = tokenizer(
                user_input, 
                return_tensors="pt", 
                truncation=True, 
                max_length=512
            ).to(device)

            # 4. 모델 추론
            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits
                
                # 결과값을 확률(0.0~1.0)로 변환
                probs = F.softmax(logits, dim=-1)
                confidence, predicted_idx = torch.max(probs, dim=-1)

            # 5. 결과 매핑 및 출력
            label = model.config.id2label[predicted_idx.item()]
            
            print("-" * 50)
            print(f"🔍 분석된 감정: {label}")
            print(f"📈 예측 신뢰도: {confidence.item() * 100:.2f}%")
            print("-" * 50)

        except Exception as e:
            print(f"❌ 분석 오류 발생: {e}")

if __name__ == "__main__":
    run_pure_sentiment_analysis()