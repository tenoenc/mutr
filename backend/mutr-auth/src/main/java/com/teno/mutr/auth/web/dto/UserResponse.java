package com.teno.mutr.auth.web.dto;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.domain.entity.UserRole;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {
    private String nickname;
    private String email;
    private String role;
    private String provider;
    private boolean isMember;

    public static UserResponse from(User user) {
        return UserResponse.builder()
                .nickname(user.getNickname())
                .email(user.getEmail())
                .role(user.getRole().name())
                .provider(user.getProvider())
                .isMember(UserRole.ROLE_USER.equals(user.getRole()))
                .build();
    }
}
