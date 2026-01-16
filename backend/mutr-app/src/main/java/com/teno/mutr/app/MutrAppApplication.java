package com.teno.mutr.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = "com.teno.mutr") // 모든 모듈의 빈(Service, Component 등) 스캔
@EntityScan(basePackages = "com.teno.mutr") // 모든 모듈의 @Entity 스캔
@EnableJpaRepositories(basePackages = "com.teno.mutr") // 모든 모듈의 Repository 스캔
public class MutrAppApplication {

	public static void main(String[] args) {
        SpringApplication.run(MutrAppApplication.class, args);
	}

}
