package com.teno.mutr.core.domain;

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

    public double distanceTo(Coordinate other) {
        return Math.sqrt(
                Math.pow(this.x - other.x, 2) +
                        Math.pow(this.y - other.y, 2) +
                        Math.pow(this.z - other.z, 2)
        );
    }
}
