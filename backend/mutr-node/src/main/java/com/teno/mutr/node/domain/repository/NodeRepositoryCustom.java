package com.teno.mutr.node.domain.repository;

import com.teno.mutr.node.domain.entity.Node;

import java.util.List;

public interface NodeRepositoryCustom {
    List<Node> searchGalaxy(Long rootId, String keyword);
}
