package com.teno.mutr.node.domain.service;

import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.vo.Coordinate;
import org.springframework.stereotype.Component;

@Component
public class NodeDomainService {

    private static final double DEFAULT_GALAXY_RADIUS = 15.0;

    public Coordinate determinePosition(Node parent, Double reqX, Double reqY, Double reqZ, Double reqDirX,
                                        Double reqDirY, Double reqDirZ) {
        if (parent == null) {
            return Coordinate.of(reqX, reqY, reqZ);
        }

        Coordinate parentCoord = parent.getCoordinate();

        if (reqDirX != null && reqDirY != null && reqDirZ != null) {
            return parentCoord.calculateFrontRandomPointOnSphere(DEFAULT_GALAXY_RADIUS, reqDirX, reqDirY, reqDirZ);
        } else {
            return parentCoord.calculateRandomPointOnSphere(DEFAULT_GALAXY_RADIUS);
        }
    }
}
