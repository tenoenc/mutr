package com.teno.mutr.node.web.dto;

import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.vo.Coordinate;
import com.teno.mutr.node.domain.vo.MutationInfo;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NodeVizResponse {
    private Long id;
    private Long parentId;
    private double x;
    private double y;
    private double z;

    private String filter; // 어떤 필터가 적용되었는가 (색상/스타일 결정)
    private double mutationScore; // 변이의 강도가 얼마인가 (크기/밝기 결정)

    public static NodeVizResponse from(Node node) {
        Coordinate coord = node.getCoordinate();
        MutationInfo info = node.getMutationInfo();
        return NodeVizResponse.builder()
                .id(node.getId())
                .parentId(node.getParentId())
                .x(coord.getX())
                .y(coord.getY())
                .z(coord.getZ())
                .filter(info.getFilter())
                .mutationScore(info.getScore())
                .build();
    }
}
