package com.teno.mutr.node.domain;

import com.teno.mutr.auth.domain.User;
import com.teno.mutr.core.domain.BaseTimeEntity;
import com.teno.mutr.core.domain.Coordinate;
import com.teno.mutr.core.domain.MutationInfo;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "nodes", indexes = {
        @Index(name = "idx_nodes_parent", columnList = "parent_id"),
        @Index(name = "idx_nodes_root", columnList = "root_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Node extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Node parent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "root_id")
    private Node root;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Embedded
    private MutationInfo mutationInfo;

    @Embedded
    private Coordinate coordinate;

    private Integer reactionCount = 0;

    private Boolean isAiGenerated = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata = new HashMap<>();

    @Builder
    public Node(Node parent, Node root, User user, String content, MutationInfo mutationInfo, Coordinate coordinate,
                Boolean isAiGenerated) {
        this.parent = parent;
        // 부모가 있으면 부모의 root를, 없으면 부모 자신이 root가 됨 (최상위 노드면 null)
        this.root = (parent != null) ? (parent.getRoot() != null ? parent.getRoot() : parent) : null;
        this.user = user;
        this.content = content;
        this.mutationInfo = mutationInfo;
        this.coordinate = coordinate;
        this.isAiGenerated = isAiGenerated;
    }

    public void incrementReactionCount() {
        this.reactionCount++;
    }
}
