package com.teno.mutr.auth.service;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GuestUserService {
    private final UserRepository userRepository;

    @Transactional
    public User registerNewGuest() {
        String nickname;
        do {
            nickname = NicknameGenerator.generate();
        } while (userRepository.existsByNickname(nickname));

        String guestToken = UUID.randomUUID().toString();
        User guest = User.guestOf(nickname, guestToken);

        return userRepository.save(guest);
    }
}
