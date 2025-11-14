package com.teno.mutr.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

/** Modular Monolithic
 * Layered 아키텍처는 서비스 간 경계가 모호해질 수 있기 때문에 (높은 결합도)
 * Vertical Slice 아키텍처를 도입하여 도메인 간의 의존성을 Gradle 수준에서 강제로 제어한다.
 * 나중에 특정 기능만 떼어내어 MSA로 전환하기 훨씬 유리하다.
 */
@SpringBootApplication(scanBasePackages = "com.teno.mutr") // 모든 모듈의 빈(Service, Component 등) 스캔
@EntityScan(basePackages = "com.teno.mutr") // 모든 모듈의 @Entity 스캔
@EnableJpaRepositories(basePackages = "com.teno.mutr") // 모든 모듈의 Repository 스캔
public class MutrAppApplication {

	public static void main(String[] args) {
        SpringApplication.run(MutrAppApplication.class, args);
	}

}
