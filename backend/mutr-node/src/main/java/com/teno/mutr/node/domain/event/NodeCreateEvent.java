package com.teno.mutr.node.domain.event;

public record NodeCreateEvent(
        Long nodeId,
        Long parentId,
        String content,
        String parentTopic,
        String baselineTopic,
        String fullContext
) {
}