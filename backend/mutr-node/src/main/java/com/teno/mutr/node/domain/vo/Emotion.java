package com.teno.mutr.node.domain.vo;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum Emotion {
    JOY("joy"),
    NEUTRAL("neutral"),
    SADNESS("sadness"),
    ANGER("anger"),
    ANXIETY("anxiety"),
    EMBARRASSED("embarrassed"),
    HURT("hurt");

    private final String key;

    public static Emotion from(String value) {
        return Arrays.stream(Emotion.values())
                .filter(e -> e.key.equalsIgnoreCase(value.trim()))
                .findFirst()
                .orElse(NEUTRAL);
    }
}
