package com.teno.mutr.node.domain.entity;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.core.domain.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "node_reactions", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"node_id", "user_id", "reaction_type"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NodeReaction extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private Node node;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "reaction_type", nullable = false)
    private String type;

    @Builder
    public NodeReaction(Long id, Node node, User user, String type) {
        this.id = id;
        this.node = node;
        this.user = user;
        this.type = type;
    }
}
