package com.teno.mutr.app.infra;

import com.teno.mutr.auth.domain.repository.UserRepository;
import com.teno.mutr.auth.infra.guest.GuestAuthenticationFilter;
import com.teno.mutr.auth.infra.jwt.JwtAuthenticationFilter;
import com.teno.mutr.auth.infra.jwt.TokenProvider;
import com.teno.mutr.auth.service.CustomOAuth2UserService;
import com.teno.mutr.auth.web.handler.OAuth2SuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

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

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // CORS 설정 활성화 및 소스 연결
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable) // API 중심이므로 CSRF 비활성화
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 세션 미사용
                .authorizeHttpRequests(auth -> auth
                        // 웹 소켓 핸드쉐이크 엔드포인트 허용
                        // SockJS를 사용하면 /ws-mutr/info 등 하위 경로가 생기므로 /**를 붙임
                        .requestMatchers("/ws-mutr/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/v1/nodes/viz").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/guest").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/login/**", "/oauth2/**", "/error").permitAll()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService) // 사용자 정보 처리 로직 등록
                        )
                        .successHandler(oAuth2SuccessHandler)
                )
                .addFilterBefore(new JwtAuthenticationFilter(tokenProvider), UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(new GuestAuthenticationFilter(userRepository), JwtAuthenticationFilter.class);

        return http.build();
    }

    // CORS 정책 정의
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // 프론트엔드 Vite 서버 주소 허용
        configuration.setAllowedOrigins(List.of(frontendUrl));
        // 모든 HTTP 메서드 허용 (GET, POST, PUT, DELETE 등)
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // 모든 헤더 허용 (Authorization, Content-Type 등)
        configuration.setAllowedHeaders(List.of("*"));
        // 쿠키나 인증 헤더 허용
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
