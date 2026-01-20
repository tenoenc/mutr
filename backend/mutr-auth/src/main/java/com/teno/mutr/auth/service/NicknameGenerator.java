package com.teno.mutr.auth.service;

import java.util.List;
import java.util.Random;

public class NicknameGenerator {

    private static final List<String> ADJECTIVES = List.of(
            "따뜻한", "차가운", "부드러운", "단단한", "가벼운",
            "무거운", "선명한", "흐릿한", "은은한", "매끄러운",
            "신중한", "자유로운", "차분한", "유연한", "담백한",
            "성실한", "조용한", "활기찬", "진지한", "소박한"
    );

    private static final List<String> NOUNS = List.of(
            "나무", "조각", "바람", "물결", "그늘",
            "그림자", "안경", "시계", "연필", "의자",
            "흐름", "흔적", "기록", "소리", "시선",
            "온기", "여백", "풀잎", "구름", "등불"
    );

    private static final Random RANDOM = new Random();

    public static String generate() {
        String adjective = ADJECTIVES.get(RANDOM.nextInt(ADJECTIVES.size()));
        String noun = NOUNS.get(RANDOM.nextInt(NOUNS.size()));
        int number = RANDOM.nextInt(9000) + 1000;

        return String.format("%s_%s_%d", adjective, noun, number);
    }
}