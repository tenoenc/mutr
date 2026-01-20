package com.teno.mutr.node.infra.config;

import com.teno.mutr.auth.infra.AuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AuthChannelInterceptor authChannelInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 메시지를 구독하는 경로 (은하계 전체 알림용)
        config.enableSimpleBroker("/topic");
        // 메시지를 보낼 때 사용하는 prefix
        config.setApplicationDestinationPrefixes("/app");

    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 클라이언트가 연결할 엔드포인트
        registry.addEndpoint("/ws-mutr")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authChannelInterceptor);
    }
}
