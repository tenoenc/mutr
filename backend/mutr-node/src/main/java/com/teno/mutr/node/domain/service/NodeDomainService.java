package com.teno.mutr.node.domain.service;

import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.vo.Coordinate;
import org.springframework.stereotype.Component;

import java.util.Random;

@Component
public class NodeDomainService {
    private final Random random = new Random();

    public Coordinate calculateNewCoordinate(Node parent) {
        if (parent == null) return Coordinate.zero();

        // 부모 좌표 기준 랜덤 오프셋 기준
        double offsetX = (random.nextDouble() - 0.5) * 2.0;
        double offsetY = (random.nextDouble() - 0.5) * 2.0;
        double offsetZ = (random.nextDouble() - 0.5) * 2.0;

        return Coordinate.of(
                parent.getCoordinate().getX() + offsetX,
                parent.getCoordinate().getY() + offsetY,
                parent.getCoordinate().getZ() + offsetZ
        );
    }
}
