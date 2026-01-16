package com.teno.mutr.node.domain.repository;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.entity.QNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@RequiredArgsConstructor
public class NodeRepositoryCustomImpl implements NodeRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<Node> searchGalaxy(Long rootId, String keyword) {
        QNode node = QNode.node;

        return queryFactory
                .selectFrom(node)
                .where(
                        node.rootId.eq(rootId),
                        keyword != null ? node.content.contains(keyword) : null
                )
                .orderBy(node.createdAt.asc())
                .fetch();
    }
}
