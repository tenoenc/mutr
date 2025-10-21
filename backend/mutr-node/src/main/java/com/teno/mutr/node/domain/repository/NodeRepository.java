package com.teno.mutr.node.domain.repository;

import com.teno.mutr.node.domain.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeRepository extends JpaRepository<Node, Long> {

    @Query("SELECT n FROM Node n WHERE n.coordinate.x BETWEEN :x - :range AND :x + :range " +
            "AND n.coordinate.y BETWEEN :y - :range AND :y + :range " +
            "AND n.coordinate.z BETWEEN :z - :range AND :z + :range")
    List<Node> findNearbyNodes(Double x, Double y, Double z, Double range);
}
