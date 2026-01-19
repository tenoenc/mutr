package com.teno.mutr.node.infra.grpc;

import com.teno.mutr.node.domain.dto.AnalysisResult;
import com.teno.mutr.node.infra.grpc.stubs.AnalysisRequest;
import com.teno.mutr.node.infra.grpc.stubs.AnalysisResponse;
import com.teno.mutr.node.infra.grpc.stubs.AnalysisServiceGrpc;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;

@Component
public class NodeAnalysisClient {

    @GrpcClient("mutr-ai-engine")
    private AnalysisServiceGrpc.AnalysisServiceBlockingStub analysisServiceStub;

    public AnalysisResult analyze(String content, String parentSummary, String fullContext) {
        // 1. gRPC 요청 객체 생성
        AnalysisRequest request = AnalysisRequest.newBuilder()
                .setContent(content)
                .setParentSummary(parentSummary != null ? parentSummary : "")
                .setFullContext(fullContext != null ? fullContext : "")
                .build();

        // 2. AI 엔진 호출
        AnalysisResponse response = analysisServiceStub.analyzeNode(request);

        // 3. 도메인에서 사용할 결과 객체로 변환
        return new AnalysisResult(
                response.getTopic(),
                response.getEmotion(),
                response.getConfidence(),
                response.getMutationScore()
        );
    }
}