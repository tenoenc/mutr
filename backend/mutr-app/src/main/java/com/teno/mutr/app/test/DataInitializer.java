package com.teno.mutr.app.test;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.domain.repository.UserRepository;
import com.teno.mutr.node.domain.vo.Coordinate;
import com.teno.mutr.node.domain.vo.MutationInfo;
import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.repository.NodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final NodeRepository nodeRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        User admin = User.builder()
                .nickname("Admin")
                .email("admin@mutr.com")
                .oauthId("google_123")
                .provider("google")
                .build();
        userRepository.save(admin);

        Node rootNode = Node.builder()
                .user(admin)
                .content("이것은 우주의 첫 번째 속삭임입니다.")
                .coordinate(Coordinate.zero())
                .mutationInfo(MutationInfo.origin())
                .isAiGenerated(false)
                .build();
        nodeRepository.save(rootNode);
    }
}