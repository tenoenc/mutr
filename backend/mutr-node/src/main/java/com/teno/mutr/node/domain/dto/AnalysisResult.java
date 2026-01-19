package com.teno.mutr.node.domain.dto;

public record AnalysisResult(
        String topic,
        String emotion,
        double confidence,
        double mutationScore
) { }