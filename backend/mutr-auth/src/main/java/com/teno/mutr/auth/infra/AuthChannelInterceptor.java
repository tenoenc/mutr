package com.teno.mutr.auth.infra;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.domain.repository.UserRepository;
import com.teno.mutr.auth.infra.jwt.TokenProvider;
import com.teno.mutr.auth.web.dto.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@RequiredArgsConstructor
public class AuthChannelInterceptor implements ChannelInterceptor {
    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String memberToken = accessor.getFirstNativeHeader("Authorization");
            String guestToken = accessor.getFirstNativeHeader("X-Guest-Token");

            Authentication authentication;

            // 연결 시점에만 인증 수행
            if (StringUtils.hasText(memberToken) && memberToken.startsWith("Bearer ")) {
                // 회원 토큰 검증
                String jwt = memberToken.substring(7);
                authentication = tokenProvider.getAuthentication(jwt);
            } else if (StringUtils.hasText(guestToken)) {
                // 익명 토큰 검증
                User user = userRepository.findByGuestToken(guestToken).orElseThrow(() ->
                        new UsernameNotFoundException("유저를 찾을 수 없습니다."));
                CustomUserDetails userDetails = new CustomUserDetails(user, null);
                authentication = new UsernamePasswordAuthenticationToken(userDetails, null,
                        userDetails.getAuthorities());
            } else {
                throw new MessageDeliveryException("인증 정보가 없습니다.");
            }
            
            // 웹소켓 세션 내부에 인증 정부 주입
            accessor.setUser(authentication);
        }
        return message;
    }
}
