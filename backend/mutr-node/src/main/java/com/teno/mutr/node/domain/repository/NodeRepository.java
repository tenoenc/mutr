package com.teno.mutr.node.domain.repository;

import com.teno.mutr.node.domain.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NodeRepository extends JpaRepository<Node, Long> {

    @Query("SELECT n FROM Node n WHERE n.coordinate.x BETWEEN :x - :range AND :x + :range " +
            "AND n.coordinate.y BETWEEN :y - :range AND :y + :range " +
            "AND n.coordinate.z BETWEEN :z - :range AND :z + :range")
    List<Node> findNearbyNodes(Double x, Double y, Double z, Double range);

    @Query(value = """
        WITH RECURSIVE node_trace AS (
            SELECT id, parent_id, content, created_at, LENGTH(content) as r_len
            FROM nodes WHERE id = :nodeId
            UNION ALL
            SELECT n.id, n.parent_id, n.content, n.created_at, nt.r_len + LENGTH(n.content)
            FROM nodes n JOIN node_trace nt ON n.id = nt.parent_id
            WHERE nt.r_len < 500
        )
        SELECT
            STRING_AGG(content, '\\n' ORDER BY created_at ASC) as fullContext,
            (SELECT topic FROM nodes WHERE id = (SELECT parent_id FROM node_trace ORDER BY r_len DESC LIMIT 1)) as baselineTopic
        FROM node_trace
       """, nativeQuery = true)
    Optional<AnalysisContextProjection> findAnalysisContext(@Param("nodeId") Long nodeId);
}
