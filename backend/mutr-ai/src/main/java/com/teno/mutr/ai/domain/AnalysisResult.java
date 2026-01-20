package com.teno.mutr.ai.domain;

public record AnalysisResult(
        String topic,
        String emotion,
        double confidence,
        double mutationScore
) { }