package com.teno.mutr.node.service;

import com.teno.mutr.node.domain.event.NodeCreateEvent;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class AnalysisCoordinator {
    // Key: 부모 노드 ID, Value: 부모의 분석 완료를 기다리는 자식 노드 이벤트들
    private final Map<Long, List<NodeCreateEvent>> waitingQueue = new ConcurrentHashMap<>();

    // 분석이 성공적으로 끝난 노드 ID를 추적
    private final Set<Long> completeNodes = Collections.newSetFromMap(new ConcurrentHashMap<>());

    // 자식을 대기열에 추가
    public void hold(Long parentId, NodeCreateEvent event) {
        waitingQueue.computeIfAbsent(parentId, k -> new CopyOnWriteArrayList<>()).add(event);
    }

    // 부모의 준비 상태 확인
    public boolean isReady(Long parentId) {
        if (parentId == null) return true;
        return completeNodes.contains(parentId);
    }

    // 분석 완료 처리 및 대기 중인 자식 목록 반환
    public List<NodeCreateEvent> complete(Long nodeId) {
        completeNodes.add(nodeId);
        return waitingQueue.remove(nodeId);
    }
}
