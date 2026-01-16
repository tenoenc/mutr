package com.teno.mutr.auth.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// JWT 토큰 내 유저 ID를 바로 객체로 바꿔줌
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@AuthenticationPrincipal(expression = "#this instanceof T(com.teno.mutr.auth.web.dto.CustomUserDetails) ? user : null")
public @interface CurrentUser {
}
