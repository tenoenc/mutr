package com.teno.mutr.app.infra;

import com.teno.mutr.auth.infra.jwt.JwtAuthenticationFilter;
import com.teno.mutr.auth.infra.jwt.TokenProvider;
import com.teno.mutr.auth.service.CustomOAuth2UserService;
import com.teno.mutr.auth.web.handler.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/** JWT (Stateless)
 * Session/Cookie 인증 방식은 서버 메모리나 Redis에 유저 상태를 저장하는 방식이다.
 * MUTR은 프론트엔드가 별도 서버로 분리되거나 모바일 앱이 추가될 가능성이 높기 때문에
 * 세션 공유 설정이 까다로운 Session/Cookie 보다는,
 * 어떤 클라이언트와도 HTTP 헤더만으로 안전하게 통신 가능한 JWT를 선택했다. (높은 확장성)
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final TokenProvider tokenProvider;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable) // API 중심이므로 CSRF 비활성화
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 세션 미사용
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/", "/login/**", "/oauth2/**").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService) // 사용자 정보 처리 로직 등록
                        )
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(new JwtAuthenticationFilter(tokenProvider), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
