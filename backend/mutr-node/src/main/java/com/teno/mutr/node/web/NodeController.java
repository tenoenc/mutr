package com.teno.mutr.node.web;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.domain.repository.UserRepository;
import com.teno.mutr.auth.web.CurrentUser;
import com.teno.mutr.core.web.ApiResponse;
import com.teno.mutr.node.service.NodeService;
import com.teno.mutr.node.web.dto.NodeCreateRequest;
import com.teno.mutr.node.web.dto.NodeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/nodes")
public class NodeController {

    private final NodeService nodeService;
    private final UserRepository userRepository;

    /**
     * 새로운 별을 생성하여 은하계에 추가합니다.
     */
    @PostMapping
    public ApiResponse<NodeResponse> createNode(
            @CurrentUser User user,
            @RequestBody NodeCreateRequest request
    ) {
        if (user == null) {
            user = userRepository.findById(1L)
                    .orElseThrow(() -> new IllegalArgumentException("테스트용 유저가 없습니다."));
//            throw new IllegalArgumentException("로그인이 필요한 서비스입니다.");
        }

        NodeResponse response = nodeService.createNode(user, request);
        return ApiResponse.ok("별이 우주에 전달되었습니다.", response);
    }

    /**
     * 현재 위치로부터 특정 범위만큼 인접한 별들을 조회합니다.
     */
    @GetMapping("/viz")
    public ApiResponse<List<NodeResponse>> getNearbyNodes(
            @RequestParam Double x,
            @RequestParam Double y,
            @RequestParam Double z,
            @RequestParam(defaultValue = "200.0") Double range // 탐색 반경
    ) {
        List<NodeResponse> nodes = nodeService.getNearbyNodes(x, y, z, range);
        return ApiResponse.ok("주변 별들이 보입니다.", nodes);
    }
}
