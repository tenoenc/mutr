package com.teno.mutr.node.domain.repository;

import com.teno.mutr.node.domain.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeRepository extends JpaRepository<Node, Long> {

    @Query("SELECT n FROM Node n WHERE n.coordinate.x BETWEEN :x - :range AND :x + :range " +
            "AND n.coordinate.y BETWEEN :y - :range AND :y + :range " +
            "AND n.coordinate.z BETWEEN :z - :range AND :z + :range")
    List<Node> findNearbyNodes(Double x, Double y, Double z, Double range);

    @Query(value = """
        WITH RECURSIVE Ancestors AS (
            SELECT id, parent_id, content, created_at
            FROM nodes
            WHERE id = :parentId
            UNION ALL
            SELECT n.id, n.parent_id, n.content, n.created_at
            FROM nodes n
            INNER JOIN Ancestors a ON n.id = a.parent_id
        )
        SELECT content FROM Ancestors ORDER BY created_at ASC
        """, nativeQuery = true)
    List<String> findAncestorContents(@Param("parentId") Long parentId);
}
