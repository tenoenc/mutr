package com.teno.mutr.auth.web.dto;

import com.teno.mutr.auth.domain.entity.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Getter
public class CustomUserDetails implements OAuth2User {

    private final User user;
    private final Map<String, Object> attributes;

    public CustomUserDetails(User user, Map<String, Object> attributes) {
        this.user = user;
        this.attributes = attributes;
    }

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(new SimpleGrantedAuthority(user.getRole().name()));
    }

    @Override
    public String getName() {
        if (user.getOauthId() != null) {
            return user.getOauthId();
        }

        if (user.getGuestToken() != null) {
            return user.getGuestToken();
        }

        return "anonymous" + UUID.randomUUID().toString().substring(0, 8);
    }
}
