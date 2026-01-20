package com.teno.mutr.auth.domain.entity;

import com.teno.mutr.core.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_guest_token", columnList = "guest_token"),
        @Index(name = "idx_users_nickname", columnList = "nickname")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String oauthId;

    @Column(unique = true, name = "guest_token")
    private String guestToken;

    @Column(nullable = false, length = 50)
    private String nickname;

    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    private String provider;

    private LocalDateTime lastLoginAt;

    @Builder
    public User(String oauthId, String guestToken, String nickname, String email, UserRole role, String provider) {
        this.oauthId = oauthId;
        this.nickname = nickname;
        this.guestToken = guestToken;
        this.email = email;
        this.role = role;
        this.provider = provider;
    }

    public static User of(String oauthId, String email, String nickname, String provider) {
        return builder()
                .oauthId(oauthId)
                .email(email)
                .nickname(nickname)
                .role(UserRole.ROLE_USER)
                .provider(provider)
                .build();
    }

    public static User guestOf(String nickname, String guestToken) {
        return User.builder()
                .nickname(nickname)
                .guestToken(guestToken)
                .role(UserRole.ROLE_GUEST)
                .build();
    }

    public void onLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void updateNickname(String newNickname) {
        this.nickname = newNickname;
    }
}
