import torch
from sentence_transformers import SentenceTransformer, util

def run_mutr_mutation_engine():
    # 1. MUTR 최적화 모델 로드 (KR-SBERT)
    model_id = "snunlp/KR-SBERT-V40K-klueNLI-augSTS"
    print(f"🔄 MUTR 변조 엔진 로드 중: {model_id}")
    
    try:
        model = SentenceTransformer(model_id)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model.to(device)
        print(f"✅ 로드 완료! (장치: {device})")
    except Exception as e:
        print(f"❌ 로드 실패: {e}")
        return

    # --- [핵심: MUTR 전용 캘리브레이션 함수] ---
    def get_calibrated_score(similarity):
        """
        AI의 엄격한 유사도(0.0~1.0)를 인간의 체감 거리에 맞춰 
        0.0(가까움) ~ 1.0(멂) 사이의 변조 점수로 변환합니다.
        """
        # A. 매우 밀접한 관계 (유사도 0.35 이상)
        if similarity >= 0.35:
            # 0.35~1.0 사이를 0.0~0.2 사이의 아주 가까운 거리로 매핑
            score = (1.0 - similarity) * (0.2 / 0.65)
            
        # B. 느슨한 연결 (유사도 0.15 ~ 0.35)
        elif similarity >= 0.15:
            # 0.15~0.35 사이를 0.3~0.7 사이의 중간 거리로 매핑
            score = 0.7 - (similarity - 0.15) * (0.4 / 0.2)
            
        # C. 파격적인 변이 (유사도 0.15 미만)
        else:
            # 0.15 미만은 거의 남남이므로 0.8~1.0 사이로 매핑
            score = 1.0 - max(0, similarity)
            
        return round(max(0.0, min(1.0, score)), 4)

    print("\n" + "="*60)
    print("🌌 MUTR 변조 점수 분석기 (보정 알고리즘 적용)")
    print("이 점수는 별의 '생성 거리'와 '크기'에 직접 영향을 미칩니다.")
    print("="*60)

    while True:
        parent_topic = input("\n📝 [부모 노드 요약 주제]: ").strip()
        if parent_topic.lower() in ['q', 'exit']: break
        
        current_text = input("✍️  [현재 노드 본문]: ").strip()
        if not current_text: continue

        try:
            # 문장 임베딩 및 유사도 계산
            embeddings = model.encode([parent_topic, current_text], convert_to_tensor=True)
            raw_sim = util.cos_sim(embeddings[0], embeddings[1]).item()
            
            # MUTR 보정 점수 산출
            final_score = get_calibrated_score(raw_sim)

            print("-" * 60)
            print(f"📊 AI 원본 유사도: {raw_sim:.4f}")
            print(f"🚀 [MUTR 변조 점수]: {final_score:.4f}")
            
            # 시각화 가이드
            if final_score < 0.25:
                print("💎 [스타일] 부모 별과 같은 성단(Cluster) 내에 밀접 배치")
            elif final_score < 0.7:
                print("🌟 [스타일] 새로운 궤도로 분화, 연결선이 길어짐")
            else:
                print("☄️ [스타일] 완전한 변이! 정원의 새로운 구역을 개척함")
            print("-" * 60)

        except Exception as e:
            print(f"❌ 계산 오류: {e}")

if __name__ == "__main__":
    run_mutr_mutation_engine()