package com.teno.mutr.auth.web;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.web.dto.UserResponse;
import com.teno.mutr.core.web.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    @GetMapping("/me")
    public ApiResponse<UserResponse> getMyInfo(@CurrentUser User user) {
        return ApiResponse.ok(UserResponse.from(user));
    }
}
