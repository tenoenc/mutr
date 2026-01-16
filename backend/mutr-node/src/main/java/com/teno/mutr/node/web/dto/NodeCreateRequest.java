package com.teno.mutr.node.web.dto;

public record NodeCreateRequest(
        Long parentId,
        String content
) {}
