package com.teno.mutr.node.web;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.web.CurrentUser;
import com.teno.mutr.core.web.ApiResponse;
import com.teno.mutr.node.service.NodeService;
import com.teno.mutr.node.web.dto.NodeCreateRequest;
import com.teno.mutr.node.web.dto.NodeResponse;
import com.teno.mutr.node.web.dto.NodeVizResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/nodes")
public class NodeController {

    private final NodeService nodeService;

    /**
     * 새로운 속삭임을 생성하여 은하계에 추가합니다.
     */
    @PostMapping
    public ApiResponse<NodeResponse> createNode(
            @CurrentUser User user,
            @RequestBody NodeCreateRequest request
    ) {
        if (user == null) {
            throw new IllegalArgumentException("로그인이 필요한 서비스입니다.");
        }

        NodeResponse response = nodeService.createNode(user, request);
        return ApiResponse.ok("속삭임이 우주에 전달되었습니다.", response);
    }

    /**
     * 은하계의 전체 계보를 조회합니다.
     */
    @GetMapping("/lineage/{rootId}")
    public ApiResponse<List<NodeResponse>> getLineage(@PathVariable Long rootId) {
        List<NodeResponse> response = nodeService.getLineage(rootId);
        return ApiResponse.ok("은하계 데이터를 성공적으로 불러왔습니다.", response);
    }

    /**
     * 3D 시각화용 경량 데이터를 조회합니다.
     */
    @GetMapping("/galaxy/{rootId}/viz")
    public ApiResponse<List<NodeVizResponse>> getGalaxyViz(@PathVariable Long rootId) {
        List<NodeVizResponse> vizData = nodeService.getGalaxyVizData(rootId);
        return ApiResponse.ok("시각화 데이터를 성공적으로 로드했습니다.", vizData);
    }
}
