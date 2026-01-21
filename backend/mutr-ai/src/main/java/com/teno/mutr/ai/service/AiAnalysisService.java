package com.teno.mutr.ai.service;

import com.teno.mutr.ai.domain.AnalysisResult;
import com.teno.mutr.ai.infra.GrpcAiClient;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiAnalysisService {
    private final GrpcAiClient grpcAiClient;

    public AnalysisResult analyze(String content, String parentTopic, String baselineTopic, String fullContext) {
        return grpcAiClient.call(content, parentTopic, baselineTopic, fullContext);
    }
}
