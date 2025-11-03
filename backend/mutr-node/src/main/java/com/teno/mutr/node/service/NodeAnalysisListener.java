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

@Component
@RequiredArgsConstructor
public class NodeAnalysisListener {
    private final AiAnalysisService aiAnalysisService;
    private final NodeRepository nodeRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Async
    @EventListener
    @Transactional
    public void handleNodeCreated(NodeCreateEvent event) {
        // 1. AI 분석 수행
        AnalysisResult result = aiAnalysisService.analyze(event.content(), event.parentSummary(),
                event.fullContext());

        // 2. 타입 변환 (안정성 확보)
        Emotion validatedEmotion = Emotion.from(result.emotion());

        // 3. 정체성 확정
        Node node = nodeRepository.findById(event.nodeId()).orElseThrow();
        node.defineIdentity(
                result.topic(),
                MutationInfo.mutate(result.mutationScore()),
                validatedEmotion,
                result.confidence()
        );

        // 4. 완성된 노드 알림 전송
        messagingTemplate.convertAndSend("/topic/galaxy/public", NodeResponse.from(node));
    }
}
