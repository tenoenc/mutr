package com.teno.mutr.node.service;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.repository.NodeRepository;
import com.teno.mutr.node.domain.service.NodeDomainService;
import com.teno.mutr.node.domain.vo.Coordinate;
import com.teno.mutr.node.domain.vo.MutationInfo;
import com.teno.mutr.node.web.dto.NodeCreateRequest;
import com.teno.mutr.node.web.dto.NodeResponse;
import com.teno.mutr.node.web.dto.NodeVizResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NodeService {
    private final NodeRepository nodeRepository;
    private final NodeDomainService nodeDomainService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * 새로운 속삭임(Node)을 은하계에 생성합니다.
     */
    @Transactional
    public NodeResponse createNode(User user, NodeCreateRequest request) {
        // 데이터 준비 (외부 의존성 - DB)
        Node parent = request.parentId() == null ? null :
                nodeRepository.findById(request.parentId())
                        .orElseThrow(() -> new IllegalArgumentException("부모 노드가 없습니다."));

        // 핵심 비즈니스 로직 위임 (도메인 서비스 호출)
        Coordinate position = nodeDomainService.determinePosition(parent);

        Node node = Node.builder()
                .content(request.content())
                .user(user)
                .parent(parent)
                .coordinate(position)
                .mutationInfo(MutationInfo.origin())
                .build();

        // 도메인 객체 생성 및 상태 변경
        node.inheritRootFrom(parent);
        Node savedNode = nodeRepository.save(node);

        if (savedNode.getRootId() == null) {
            savedNode.initRootAsSelf();
        }

        NodeResponse response = NodeResponse.from(savedNode);

        // 실시간 브로드 캐스팅
        broadcastToGalaxy(response);

        // 결과를 DTO로 변환하여 응답
        return response;
    }

    /**
     * 특정 은하계의 전체 계보(Lineage)를 조회합니다.
     */
    public List<NodeResponse> getLineage(Long rootId) {
        List<Node> nodes = nodeRepository.findAllByRootIdOrderByCreatedAtAsc(rootId);

        if (nodes.isEmpty()) {
            throw new IllegalArgumentException("존재하지 않는 은하계이거나 노드가 없습니다.");
        }

        return nodes.stream()
                .map(NodeResponse::from)
                .collect(Collectors.toList());
    }

    /**
     * 3D 시각화를 위한 경량 스타맵(Viz) 데이터를 조회합니다.
     */
    public List<NodeVizResponse> getGalaxyVizData(Long rootId) {
        return nodeRepository.findAllByRootIdOrderByCreatedAtAsc(rootId).stream()
                .map(NodeVizResponse::from)
                .collect(Collectors.toList());
    }

    private void broadcastToGalaxy(NodeResponse response) {
        String destination = "/topic/galaxy/" + response.getRootId();
        messagingTemplate.convertAndSend(destination, response);
    }
}
