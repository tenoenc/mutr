package com.teno.mutr.node.domain.event;

public record NodeCreateEvent(
        Long nodeId,
        String content,
        String parentSummary,
        String fullContext
) {
}
