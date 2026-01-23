package com.teno.mutr.node.service;

import com.teno.mutr.node.domain.event.NodeCreateEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RedisAnalysisCoordinator {
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String ACTIVE_SET = "analysis:active";
    private static final String WAITING_PREFIX = "analysis:waiting:";

    public boolean isReady(Long parentId, String parentTopicHint) {
        if (parentId == null) return true;
        // 1. 이벤트가 힌트가 있다면 즉시 통과 (읽기/쓰기 최고 성능)
        if (parentTopicHint != null && !parentTopicHint.isBlank()) return true;
        // 2. Redis에 부모가 분석 중으로 등록되어 있지 않다면 통과 (정합성)
        Boolean isProcessing = redisTemplate.opsForSet().isMember(ACTIVE_SET, parentId.toString());
        return !Boolean.TRUE.equals(isProcessing);
    }

    public void start(Long nodeId) {
        redisTemplate.opsForSet().add(ACTIVE_SET, nodeId.toString());
    }

    public void hold(Long parentId, NodeCreateEvent event) {
        String key = WAITING_PREFIX + parentId;
        redisTemplate.opsForList().rightPush(key, event);
        redisTemplate.expire(key, 1, TimeUnit.HOURS);
    }

    public List<NodeCreateEvent> complete(Long nodeId) {
        redisTemplate.opsForSet().remove(ACTIVE_SET, nodeId.toString());
        String key = WAITING_PREFIX + nodeId;
        List<Object> objects = redisTemplate.opsForList().range(key, 0, -1);
        redisTemplate.delete(key);

        List<NodeCreateEvent> waitingChildren = new ArrayList<>();
        if (objects != null) {
            for (Object object : objects) {
                waitingChildren.add((NodeCreateEvent) object);
            }
        }
        return waitingChildren;
    }
}
