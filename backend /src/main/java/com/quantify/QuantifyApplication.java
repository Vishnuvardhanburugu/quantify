package com.quantify;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@SpringBootApplication(exclude = {
    RedisAutoConfiguration.class,
    RedisRepositoriesAutoConfiguration.class
})
@EnableScheduling
@Slf4j
public class QuantifyApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuantifyApplication.class, args);
    }
    
    @PostConstruct
    public void init() {
        String port = System.getenv("PORT");
        if (port == null) port = "8080";
        log.info("===========================================");
        log.info("Quantify Trading Platform Starting...");
        log.info("Server Port: {}", port);
        log.info("===========================================");
    }
}
