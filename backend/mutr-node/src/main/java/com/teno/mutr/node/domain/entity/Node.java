package com.teno.mutr.node.domain.entity;

import com.teno.mutr.auth.domain.entity.User;
import com.teno.mutr.core.domain.BaseTimeEntity;
import com.teno.mutr.node.domain.vo.Coordinate;
import com.teno.mutr.node.domain.vo.Emotion;
import com.teno.mutr.node.domain.vo.MutationInfo;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "nodes", indexes = {
        @Index(name = "idx_nodes_parent", columnList = "parent_id"),
        @Index(name = "idx_nodes_root", columnList = "root_id"),
        @Index(name = "idx_nodes_user", columnList = "user_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Node extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String topic;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Node parent;

    /** 객체 -> ID
     * 객체는 트리 시각화 시 수천 개의 노드를 한 번에 로딩하여 N+1 등의 문제로 성능 저하를 일으킬 수 있지만,
     * ID는 DB 인덱스 스캔만으로 전체 계보를 O(1)에 가깝게 조회할 수 있다.
     */
    @Column(name = "root_id")
    private Long rootId;

    @Embedded
    private MutationInfo mutationInfo;

    @Embedded
    private Coordinate coordinate;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    @Builder.Default
    private Map<String, Object> metadata = new HashMap<>();

    public Long getParentId() {
        return this.parent != null ? this.parent.getId() : null;
    }

    /** Anemic Model -> Rich Model
     * Anemic Model은 엔티티는 데이터만 담고, 모든 로직은 서비스에서 처리하는 절차지향적 방식이고,
     * Rich Model은 엔티티와 VO가 스스로의 상태를 변경하는 메서드를 가지는 객체지향적 방식이다.
     * 서비스에 로직이 몰리면 코드가 비대해지고 유지보수가 힘들어지기 때문에
     * Rich를 택함으로써 객체 스스로가 자신의 데이터 무결성을 책임지게 하고, 비즈니스 규칙을 테스트하기 훨씬 쉬워진다.
     */

    public void decideRootFrom(Node parent) {
        if (parent != null) {
            this.rootId = (parent.getRootId() != null) ? parent.getRootId() : parent.getId();
        } else {
            this.rootId = this.id;
        }
    }

    public void defineIdentity(String topic, MutationInfo mutationInfo, Emotion emotion, Double confidence) {
        this.topic = topic;
        this.mutationInfo = mutationInfo;
        this.metadata.put("emotion", emotion.getKey());
        this.metadata.put("confidence", String.valueOf(confidence));
    }

    public Emotion getEmotion() {
        String emotionKey = (String) this.metadata.getOrDefault("emotion", "neutral");
        return Emotion.from(emotionKey);
    }

}
