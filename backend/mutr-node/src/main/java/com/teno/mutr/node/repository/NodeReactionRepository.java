package com.teno.mutr.node.repository;

import com.teno.mutr.auth.domain.User;
import com.teno.mutr.node.domain.Node;
import com.teno.mutr.node.domain.NodeReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NodeReactionRepository extends JpaRepository<NodeReaction, Long> {

    // 특정 유저가 특정 노드에 이미 반응 남겼는지 확인
    Optional<NodeReaction> findByNodeAndUserAndType(Node node, User user, String type);

    // 특정 노드의 특정 반응 개수 카운트
    long countByNodeIdAndType(Long nodeId, String type);
}
