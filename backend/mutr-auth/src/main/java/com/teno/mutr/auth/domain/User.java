package com.teno.mutr.auth.domain;

import com.teno.mutr.core.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String oauthId;

    @Column(nullable = false, length = 50)
    private String nickname;

    private String email;

    @Column(nullable = false)
    private String role = "ROLE_GUEST";

    private String provider;

    private LocalDateTime lastLoginAt;

    @Builder
    public User(String oauthId, String nickname, String email, String role, String provider) {
        this.oauthId = oauthId;
        this.nickname = nickname;
        this.email = email;
        this.role = (role != null) ? role : "ROLE_GUEST";
        this.provider = provider;
    }

    public void recordLogin() {
        this.lastLoginAt = LocalDateTime.now();
    }

    public void updateNickname(String newNickname) {
        this.nickname = newNickname;
    }
}
