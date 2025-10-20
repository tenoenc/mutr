package com.teno.mutr.node.web;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.web.CurrentUser;
import com.teno.mutr.core.web.ApiResponse;
import com.teno.mutr.node.service.NodeService;
import com.teno.mutr.node.web.dto.NodeCreateRequest;
import com.teno.mutr.node.web.dto.NodeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/nodes")
public class NodeController {

    private final NodeService nodeService;

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
}
