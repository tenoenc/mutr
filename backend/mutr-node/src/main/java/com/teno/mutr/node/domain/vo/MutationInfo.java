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
    private String filter; // 변이 필터 이름

    @Column(name = "mutation_score")
    private Double score; // AI 변이 점수
    
    public static MutationInfo origin() {
        return new MutationInfo("ORIGIN", 0.0);
    }

    public static MutationInfo mutate(double score) {
        String filter;

        if (score < 0.25) {
            filter = "CLUSTER";   // 밀접 배치 성단
        } else if (score < 0.7) {
            filter = "EVOLUTION"; // 새로운 궤도로 분화
        } else {
            filter = "MUTATION";  // 완전한 변이
        }

        return MutationInfo.of(filter, score);
    }
}
