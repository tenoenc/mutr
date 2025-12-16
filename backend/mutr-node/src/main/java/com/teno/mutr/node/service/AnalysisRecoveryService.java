package com.teno.mutr.node.service;

import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.event.NodeCreateEvent;
import com.teno.mutr.node.domain.repository.AnalysisContextProjection;
import com.teno.mutr.node.domain.repository.NodeRepository;
import com.teno.mutr.node.domain.vo.AnalysisStatus;
import io.grpc.health.v1.HealthCheckRequest;
import io.grpc.health.v1.HealthCheckResponse;
import io.grpc.health.v1.HealthGrpc;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Component
@Slf4j
@RequiredArgsConstructor
public class AnalysisRecoveryService {
    private final NodeRepository nodeRepository;
    private final HealthGrpc.HealthBlockingStub healthStub;
    private final ApplicationEventPublisher eventPublisher;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        CompletableFuture.runAsync(this::waitForAiServerAndRecover);
    }

    private void waitForAiServerAndRecover() {
        log.info(">>> AI 서버 헬스체크 시작...");
        int attempts = 0;

        while (attempts < 30) {
            try {
                HealthCheckRequest request = HealthCheckRequest.newBuilder().setService("").build();
                HealthCheckResponse response = healthStub.check(request);

                if (response.getStatus() == HealthCheckResponse.ServingStatus.SERVING) {
                    log.info(">>> AI 서버 준비 완료. 복구 작업을 시작합니다.");
                    performRecovery();
                    return;
                }
            } catch (Exception e) {
                log.warn(">>> AI 서버가 아직 응답하지 않습니다. (시도 {}/30)", attempts + 1);
            }

            try {
                Thread.sleep(10000);
                attempts++;
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                return;
            }
        }
        log.error(">>> AI 서버 헬스체크 타임아웃. 복구 작업에 실패했습니다.");
    }

    private void performRecovery() {
        log.info(">>> 서버 재시작에 따른 미완료 분석 작업 복구 시작");
        List<Node> unfinishedNodes = nodeRepository.findAllByAnalysisStatusIn(
                List.of(AnalysisStatus.PENDING, AnalysisStatus.PROCESSING)
        );

        if (unfinishedNodes.isEmpty()) {
            log.info(">>> 복구할 작업이 없습니다.");
            return;
        }

        for (Node node : unfinishedNodes) {
            log.info(">>> 노드 {} 분석 재시동 발행", node.getId());

            AnalysisContextProjection projection = nodeRepository.findAnalysisContext(node.getId())
                    .orElseThrow(() -> new IllegalArgumentException("노드가 존재하지 않습니다."));

            eventPublisher.publishEvent(new NodeCreateEvent(
                    node.getId(),
                    node.getParentId(),
                    node.getContent(),
                    node.getParentTopic(),
                    projection.getBaselineTopic(),
                    projection.getFullContext()
            ));
        }
        log.info(">>> 총 {}건의 작업 복구 요청 완료", unfinishedNodes.size());
    }
}
