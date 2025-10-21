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

    /**
     * 현재 위치를 기준으로 최대 확산각 85도 안에서 무작위 좌표를 계산하여 반환합니다.
     * 제곱근을 취하여 사야각의 가장 자리가 더 잘 나오도록 합니다.
     */
    public Coordinate calculateFrontRandomPointOnSphere(double radius, double dirX, double dirY, double dirZ) {
        // 1. 입력받은 방향 벡터 정규화
        double length = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        double dx = dirX / length;
        double dy = dirY / length;
        double dz = dirZ / length;

        // 2. 직교 기저(U, V) 생성 (바라보는 방향에 수직인 평면 구성)
        double tempX = (Math.abs(dx) > 0.9) ? 0 : 1;
        double tempY = (Math.abs(dx) > 0.9) ? 1 : 0;
        double tempZ = 0;

        // 수직 벡터 U 계산
        double ux = dy * tempZ - dz * tempY;
        double uy = dz * tempX - dx * tempZ;
        double uz = dx * tempY - dy * tempX;
        double uLen = Math.sqrt(ux * ux + uy * uy + uz * uz);
        ux /= uLen; uy /= uLen; uz /= uLen;

        // 수직 벡터 V 계산
        double vx = dy * uz - dz * uy;
        double vy = dz * ux - dx * uz;
        double vz = dx * uy - dy * ux;

        // 3. 변이(Mutation) 특성을 반영한 각도 계산
        double spreadAngle = Math.toRadians(85); // 최대 확산 각도 85도 설정

        // 확률 편향: Math.random()에 제곱근을 취하여 1.0(가장자리)에 가까운 값이 더 자주 나오게 함
        // 지수(0.5 ~ 0.7)를 조절하여 사이드에 몰리는 정도를 커스터마이징할 수 있습니다.
        double biasedRandom = Math.pow(Math.random(), 0.6);
        double alpha = biasedRandom * spreadAngle;

        double cosAlpha = Math.cos(alpha);
        double sinAlpha = Math.sin(alpha);
        double beta = Math.random() * 2 * Math.PI; // 축 주위 회전각 (360도 전체)

        // 4. 최종 방향 벡터 합성
        double targetX = dx * cosAlpha + (ux * Math.cos(beta) + vx * Math.sin(beta)) * sinAlpha;
        double targetY = dy * cosAlpha + (uy * Math.cos(beta) + vy * Math.sin(beta)) * sinAlpha;
        double targetZ = dz * cosAlpha + (uz * Math.cos(beta) + vz * Math.sin(beta)) * sinAlpha;

        // 5. 결과 좌표 산출 및 반올림
        double nextX = this.x + (radius * targetX);
        double nextY = this.y + (radius * targetY);
        double nextZ = this.z + (radius * targetZ);

        return Coordinate.of(
                Math.round(nextX * 100) / 100.0,
                Math.round(nextY * 100) / 100.0,
                Math.round(nextZ * 100) / 100.0
        );
    }
}
