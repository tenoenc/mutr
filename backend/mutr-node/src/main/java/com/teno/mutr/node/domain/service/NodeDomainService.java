package com.teno.mutr.node.domain.service;

import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.vo.Coordinate;
import org.springframework.stereotype.Component;

import java.util.Random;

@Component
public class NodeDomainService {

    private static final double DEFAULT_GALAXY_RADIUS = 15.0;

    public Coordinate determinePosition(Node parent) {
        if (parent == null) {
            return Coordinate.of(
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 5
            );
        }

        Coordinate parentCoord = parent.getCoordinate();

        // TODO: 나중에 변이 점수에 따라 radius를 조절하면 변이가 심할수록 멀리 떨어지는 연출 가능
        return parentCoord.calculateRandomPointOnSphere(DEFAULT_GALAXY_RADIUS);
    }
}
