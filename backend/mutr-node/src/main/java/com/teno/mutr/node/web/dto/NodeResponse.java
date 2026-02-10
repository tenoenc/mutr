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
    private String topic;
    private String emotion;
    private String mutationFilter;
    private Double mutationScore;
    private Double x;
    private Double y;
    private Double z;
    private Long parentId;
    private Long rootId;
    private LocalDateTime cratedAt;
    private String analysisStatus;

    public static NodeResponse from(Node node) {
        return NodeResponse.builder()
                .id(node.getId())
                .content(node.getContent())
                .emotion(node.getEmotion().getKey())
                .authorNickname(node.getUser().getNickname())
                .topic(node.getTopic())
                .mutationFilter(node.getMutationInfo().getFilter())
                .mutationScore(node.getMutationInfo().getScore())
                .x(node.getCoordinate().getX())
                .y(node.getCoordinate().getY())
                .z(node.getCoordinate().getZ())
                .parentId(node.getParentId())
                .rootId(node.getRootId())
                .cratedAt(node.getCreatedAt())
                .analysisStatus(node.getAnalysisStatus().name())
                .build();
    }
}
