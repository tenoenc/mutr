package com.teno.mutr.app.test;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.auth.domain.repository.UserRepository;
import com.teno.mutr.node.domain.entity.Node;
import com.teno.mutr.node.domain.repository.NodeRepository;
import com.teno.mutr.node.domain.vo.Coordinate;
import com.teno.mutr.node.domain.vo.MutationInfo;
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

        User admin = User.of("google_123", "admin@mutr.com", "Admin", "google");
        userRepository.save(admin);

        Node rootNode = Node.builder()
                .user(admin)
                .content("이것은 우주의 첫 번째 속삭임입니다.")
                .coordinate(Coordinate.zero())
                .mutationInfo(MutationInfo.origin())
                .build();
        nodeRepository.save(rootNode);
    }
}