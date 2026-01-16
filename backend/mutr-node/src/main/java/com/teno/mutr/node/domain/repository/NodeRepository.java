package com.teno.mutr.node.domain.repository;

import com.teno.mutr.node.domain.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeRepository extends JpaRepository<Node, Long> {

    // 특정 루트 노드에 속한 모든 노드들(전체 계보)을 조회
    // rootId 역정규화 덕분에 단일 인덱스 스캔으로 빠르게 처리
    List<Node> findAllByRootIdOrderByCreatedAtAsc(Long rootId);

    // 특정 부모 노드의 직계 자식들만 조회
    List<Node> findAllByParentIdOrderByCreatedAtAsc(Long parentId);

    // 특정 유저가 작성한 모든 노드 조회
    List<Node> findAllByUserIdOrderByCreatedAtAsc(Long userId);
}
