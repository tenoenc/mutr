package com.teno.mutr.node.service;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.repository.NodeRepository;
import com.teno.mutr.node.domain.service.NodeDomainService;
import com.teno.mutr.node.domain.vo.Coordinate;
import com.teno.mutr.node.domain.vo.MutationInfo;
import com.teno.mutr.node.web.dto.NodeCreateRequest;
import com.teno.mutr.node.web.dto.NodeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NodeService {
    private final NodeRepository nodeRepository;
    private final NodeDomainService nodeDomainService;

    @Transactional
    public NodeResponse createNode(User user, NodeCreateRequest request) {
        // 데이터 준비 (외부 의존성 - DB)
        Node parent = request.parentId() == null ? null :
                nodeRepository.findById(request.parentId())
                        .orElseThrow(() -> new IllegalArgumentException("부모 노드 없음"));

        // 핵심 비즈니스 로직 위임 (도메인 서비스 호출)
        Coordinate newCoordinate = nodeDomainService.calculateNewCoordinate(parent);

        Node node = Node.builder()
                .content(request.content())
                .user(user)
                .parent(parent)
                .coordinate(newCoordinate)
                .mutationInfo(MutationInfo.origin())
                .build();

        // 도메인 객체 생성 및 상태 변경
        node.setRootFromParent(parent);
        Node savedNode = nodeRepository.save(node);

        if (savedNode.getRootId() == null) {
            savedNode.setSelfAsRoot();
        }

        // 결과를 DTO로 변환하여 응답
        return NodeResponse.from(savedNode);
    }
}
