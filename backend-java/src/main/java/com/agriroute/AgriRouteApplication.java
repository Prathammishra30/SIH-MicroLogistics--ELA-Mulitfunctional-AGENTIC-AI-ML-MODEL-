package com.agriroute;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.transaction.annotation.EnableTransactionManagement;

@SpringBootApplication(scanBasePackages = "com.agriroute")
@EnableJpaRepositories(basePackages = "com.agriroute.repository")
@EnableTransactionManagement
public class AgriRouteApplication {
    public static void main(String[] args) {
        SpringApplication.run(AgriRouteApplication.class, args);
    }
}