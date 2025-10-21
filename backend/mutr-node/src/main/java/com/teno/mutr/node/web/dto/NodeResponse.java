package com.teno.mutr.node.web.dto;

import com.teno.mutr.node.domain.entity.Node;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NodeResponse {
    private Long id;
    private String content;
    private String authorNickname;
    private Double x;
    private Double y;
    private Double z;
    private String filter;
    private Double score;
    private Long parentId;
    private Long rootId;
    private LocalDateTime cratedAt;

    public static NodeResponse from(Node node) {
        return NodeResponse.builder()
                .id(node.getId())
                .content(node.getContent())
                .authorNickname(node.getUser().getNickname())
                .x(node.getCoordinate().getX())
                .y(node.getCoordinate().getY())
                .z(node.getCoordinate().getZ())
                .filter(node.getMutationInfo().getFilter())
                .score(node.getMutationInfo().getScore())
                .parentId(node.getParentId())
                .rootId(node.getRootId())
                .cratedAt(node.getCreatedAt())
                .build();
    }
}
