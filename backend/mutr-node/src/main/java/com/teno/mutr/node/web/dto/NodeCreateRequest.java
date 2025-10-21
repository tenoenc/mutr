package com.teno.mutr.node.web.dto;

public record NodeCreateRequest(
        Long parentId,
        String content,
        Double x,
        Double y,
        Double z,
        Double dirX,
        Double dirY,
        Double dirZ
) {}
