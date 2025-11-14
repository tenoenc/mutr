package com.teno.mutr.auth.service;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.domain.repository.UserRepository;
import com.teno.mutr.auth.web.dto.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = new DefaultOAuth2UserService();
        OAuth2User oAuth2User = delegate.loadUser(userRequest);

        // 서비스 이름 (google, kakao 등)
        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        // 소셜 로그인 고유 키 필드명
        String userNameAttributeName = userRequest.getClientRegistration()
                .getProviderDetails().getUserInfoEndpoint().getUserNameAttributeName();

        Map<String, Object> attributes = oAuth2User.getAttributes();

        // 유저 정보 추출 및 저장/업데이트
        String email = null;
//        String nickname = null;
        String oauthId = null;

        if ("google".equals(registrationId)) {
            email = (String) attributes.get("email");
//            nickname = (String) attributes.get("name");
            oauthId = registrationId + "_" + attributes.get("sub");
        } else if ("kakao".equals(registrationId)) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> kakaoProfile = (Map<String, Object>) kakaoAccount.get("profile");

            email = (String) kakaoAccount.get("email");
//            nickname = (String) kakaoProfile.get("nickname");
            oauthId = registrationId + "_" + attributes.get(userNameAttributeName);
        }

        User user = saveOrUpdate(oauthId, email, registrationId);

        return new CustomUserDetails(user, attributes);
    }

    private User saveOrUpdate(String oauthId, String email, String provider) {
        User user = userRepository.findByOauthId(oauthId).orElseGet(() -> {
            String nickname;
            do {
                nickname = NicknameGenerator.generate();
            } while (userRepository.existsByNickname(nickname));
            return User.of(oauthId, email, nickname, provider);
        });

        return userRepository.save(user);
    }

}
