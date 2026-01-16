package com.teno.mutr.node.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(staticName = "of")
public class MutationInfo {

    @Column(name = "mutation_filter")
    private String filter; // 변이 필터 이름 (원본은 "origin")

    @Column(name = "mutation_score")
    private Double score; // AI 변이 점수 (0.0 ~ 1.0)
    
    public static MutationInfo origin() {
        return new MutationInfo("ORIGIN", 0.0);
    }

    public static MutationInfo mutate(String filter, double score) {
        return MutationInfo.of(filter, score);
    }

    // 변조 점수가 특정 임계치를 넘었는지 확인
    public boolean isHighlyMutated(double threshold) {
        return this.score >= threshold;
    }
}
