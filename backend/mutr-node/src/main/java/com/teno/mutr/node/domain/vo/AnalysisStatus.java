package com.teno.mutr.node.domain.vo;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum AnalysisStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED;
}
