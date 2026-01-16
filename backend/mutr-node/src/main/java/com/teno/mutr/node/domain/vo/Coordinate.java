package com.teno.mutr.node.domain.vo;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(staticName = "of")
public class Coordinate {

    @Column(name = "x_coord")
    private Double x;

    @Column(name = "y_coord")
    private Double y;

    @Column(name = "z_coord")
    private Double z;

    public static Coordinate zero() {
        return new Coordinate(0.0, 0.0, 0.0);
    }

    /**
     * 현재 위치를 기준으로 특정 거리만큼 떨어진 무작위 구면 좌표를 계산하여 반환합니다.
     */
    public Coordinate calculateRandomPointOnSphere(double radius) {
        double theta = Math.random() * 2 * Math.PI; // 0 ~ 360도
        double phi = Math.acos(2 * Math.random() - 1); // 고도각

        double nextX = this.x + (radius * Math.sin(phi) * Math.cos(theta));
        double nextY = this.y + (radius * Math.sin(phi) * Math.sin(theta));
        double nextZ = this.z + (radius * Math.cos(phi));

        return Coordinate.of(
                Math.round(nextX * 100) / 100.0,
                Math.round(nextY * 100) / 100.0,
                Math.round(nextZ * 100) / 100.0
        );
    }
}
