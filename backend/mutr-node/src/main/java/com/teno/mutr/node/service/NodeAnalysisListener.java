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
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class NodeAnalysisListener {
    private final AiAnalysisService aiAnalysisService;
    private final NodeRepository nodeRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AnalysisCoordinator coordinator;

    @Async
    @EventListener
    @Transactional
    public void handleNodeCreated(NodeCreateEvent event) {
        // 부모가 준비되었는지 확인 후 처리 혹은 대기
        if (coordinator.isReady(event.parentId())) {
            processAnalysis(event);
        } else {
            coordinator.hold(event.parentId(), event);
        }
    }

    private void processAnalysis(NodeCreateEvent event) {
        // 1. 최신 부모 토픽 조회 (부모가 막 분석을 끝냈으므로 DB에서 가져옴)
        String latestParentTopic = "";
        if (event.parentId() != null) {
            latestParentTopic = nodeRepository.findById(event.parentId())
                    .map(Node::getTopic).orElse("");
        }

        // 2. AI 분석 수행 (부모 토픽 전달 보장)
        AnalysisResult result = aiAnalysisService.analyze(
                event.content(), latestParentTopic, event.baselineTopic(), event.fullContext()
        );

        Emotion validatedEmotion = Emotion.from(result.emotion());

        // 3. 노드 정체성 확정 및 저장
        Node node = nodeRepository.findById(event.nodeId()).orElseThrow();
        node.defineIdentity(
                result.topic(),
                MutationInfo.mutate(result.mutationScore()),
                validatedEmotion,
                result.confidence()
        );
        nodeRepository.save(node);

        // 4. 실시간 알림 전송
        messagingTemplate.convertAndSend("/topic/galaxy/public", NodeResponse.from(node));

        // 5. 자신을 기다리는 자식들이 있다면 연쇄 실행
        List<NodeCreateEvent> waitingChildren = coordinator.complete(node.getId());
        if (waitingChildren != null) {
            waitingChildren.forEach(this::processAnalysis);
        }
    }
}
