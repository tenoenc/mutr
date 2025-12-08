package com.teno.mutr.node.service;

import com.teno.mutr.ai.domain.AnalysisResult;
import com.teno.mutr.ai.service.AiAnalysisService;
import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.event.NodeCreateEvent;
import com.teno.mutr.node.domain.repository.NodeRepository;
import com.teno.mutr.node.domain.vo.Emotion;
import com.teno.mutr.node.domain.vo.MutationInfo;
import com.teno.mutr.node.web.dto.NodeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class NodeAnalysisListener {
    private final AiAnalysisService aiAnalysisService;
    private final NodeRepository nodeRepository;
    private final RedisAnalysisCoordinator coordinator;
    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @EventListener
    @Transactional
    public void handleNodeCreated(NodeCreateEvent event) {
        // 분석 시작 등록 (자식 노드가 생길 경우 자신을 기다리게 함)
        coordinator.start(event.nodeId());

        // 부모가 준비되었는지 확인 후 처리 혹은 대기
        if (coordinator.isReady(event.parentId(), event.parentTopic())) {
            processAnalysis(event);
        } else {
            coordinator.hold(event.parentId(), event);
        }
    }

    private void processAnalysis(NodeCreateEvent event) {
        try {
            // 1. 이벤트에 부모 토픽이 없으면 준비된 부모로부터 토픽 조회
            String parentTopic = event.parentTopic();
            if ((parentTopic == null || parentTopic.isBlank() && event.parentId() != null)) {
                parentTopic = nodeRepository.findById(event.parentId()).map(Node::getTopic).orElse("");
            }

            // 2. AI 분석 수행 (부모 토픽 전달 보장)
            AnalysisResult result = aiAnalysisService.analyze(
                    event.content(), parentTopic, event.baselineTopic(), event.fullContext()
            );

            // 3. 노드 정체성 확정 및 저장
            Node node = nodeRepository.findById(event.nodeId()).orElseThrow();
            node.defineIdentity(
                    result.topic(),
                    MutationInfo.mutate(result.mutationScore()),
                    Emotion.from(result.emotion()),
                    result.confidence()
            );
            nodeRepository.save(node);

            // 4. 현재 트랜잭션이 커밋된 직후에만 실시간 알림 전송이 실행되도록 예약
            if (TransactionSynchronizationManager.isActualTransactionActive()) {
                // 안전하게 커밋 기다리기
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        messagingTemplate.convertAndSend("/topic/galaxy/public", NodeResponse.from(node));
                    }
                });
            } else {
                // 혹시나 트랜잭션이 없으면 즉시 발송
                messagingTemplate.convertAndSend("/topic/galaxy/public", NodeResponse.from(node));
            }

        } catch (Exception e) {
            log.error("분석 실패 [노드: {}]: {}", event.nodeId(), e.getMessage());
        } finally {
            // 성공/실패 여부와 상관없이 자신을 기다리는 자식들을 해제 (Deadlock 방지)
            List<NodeCreateEvent> children = coordinator.complete((event.nodeId()));
            if (children != null) {
                children.forEach(this::processAnalysis);
            }
        }
    }
}
