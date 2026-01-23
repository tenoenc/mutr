package com.teno.mutr.node.service;

import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.event.NodeCreateEvent;
import com.teno.mutr.node.domain.repository.AnalysisContextProjection;
import com.teno.mutr.node.domain.repository.NodeRepository;
import com.teno.mutr.node.domain.vo.AnalysisStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class AnalysisRecoveryService {
    private final NodeRepository nodeRepository;
    private final ApplicationEventPublisher eventPublisher;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void recoverUnfinishedTasks() {
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
