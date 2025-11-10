package com.teno.mutr.auth.domain.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum UserRole {
    ROLE_USER("일반 사용자"),
    ROLE_GUEST("익명 사용자");

    private final String description;
}
