package com.teno.mutr.node.service;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.event.NodeCreateEvent;
import com.teno.mutr.node.domain.repository.AnalysisContextProjection;
import com.teno.mutr.node.domain.repository.NodeRepository;
import com.teno.mutr.node.domain.service.NodeDomainService;
import com.teno.mutr.node.domain.vo.Coordinate;
import com.teno.mutr.node.domain.vo.MutationInfo;
import com.teno.mutr.node.web.dto.NodeCreateRequest;
import com.teno.mutr.node.web.dto.NodeResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NodeService {
    private final NodeRepository nodeRepository;
    private final NodeDomainService nodeDomainService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * 노드 생성
     */
    @Transactional
    public NodeResponse createNode(User user, NodeCreateRequest request) {
        // 1. 초기값 설정
        Node parent = null;
        final String baselineTopic;
        final String fullContext;

        // 2. 부모 노드 조회
        if (request.parentId() != null) {
            parent = nodeRepository.findById(request.parentId()).orElseThrow(() ->
                    new IllegalArgumentException("노드가 존재하지 않습니다."));
        }

        // 3. 좌표 결정
        Coordinate position = nodeDomainService.determinePosition(
                parent, request.x(), request.y(), request.z(),
                request.dirX(), request.dirY(), request.dirZ()
        );

        // 4. 노드 객체 생성
        Node node = Node.builder()
                .content(request.content())
                .user(user)
                .parent(parent)
                .coordinate(position)
                .mutationInfo(MutationInfo.origin())
                .build();

        // 5. DB 저장 및 RootId 계승 처리
        Node savedNode = nodeRepository.save(node);
        node.decideRootFrom(parent);

        // 6. 직계 계보(Context) 수집
        AnalysisContextProjection projection = nodeRepository.findAnalysisContext(savedNode.getId())
                .orElseThrow(() -> new IllegalArgumentException("노드가 존재하지 않습니다."));

        baselineTopic = projection.getBaselineTopic();
        fullContext = projection.getFullContext();

        // 7. AI 엔진 호출 (gRPC 통신)
        eventPublisher.publishEvent(new NodeCreateEvent(
                node.getId(),
                node.getParentId(),
                node.getContent(),
                node.getParentTopic(),
                baselineTopic,
                fullContext
        ));

        // 8. 실시간 브로드캐스팅 및 응답 반환
        NodeResponse response = NodeResponse.from(savedNode);
        broadcastToPublic(response);

        return response;
    }

    /**
     * 주변 노드 조회 (Spatial Query)
     */
    public List<NodeResponse> getNearbyNodes(Double x, Double y, Double z, Double range) {
        return nodeRepository.findNearbyNodes(x, y, z, range).stream()
                .map(NodeResponse::from)
                .toList();
    }

    /**
     * 모든 사용자가 듣고 있는 공용 채널로 전송
     * 프론트엔드는 이 채널을 구독하여 실시간으로 렌더링함
     */
    private void broadcastToPublic(NodeResponse response) {
        // 특정 rootId 채널이 아닌, 전체 공유 채널로 쏩니다.
        messagingTemplate.convertAndSend("/topic/galaxy/public", response);
    }

}
