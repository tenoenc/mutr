package com.teno.mutr.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;

@SpringBootApplication(
        scanBasePackages = "com.teno.mutr",
        exclude = {DataSourceAutoConfiguration.class} // DB 자동 설정 끄기
)
public class MutrAppApplication {

	public static void main(String[] args) {
		SpringApplication.run(MutrAppApplication.class, args);
	}

}
