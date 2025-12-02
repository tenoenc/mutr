package com.teno.mutr.app;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

public class SimpleAppTest {

    @Test
    @DisplayName("기본 산술 연산 테스트 (CI 확인용)")
    void testSimpleAddition() {
        // given
        int a = 1;
        int b = 1;

        // when
        int result = a + b;

        // then
        assertEquals(2, result, "1 + 1은 2여야 합니다.");
    }
}
