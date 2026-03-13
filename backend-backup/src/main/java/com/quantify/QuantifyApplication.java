package com.quantify;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class QuantifyApplication {

    public static void main(String[] args) {
        SpringApplication.run(QuantifyApplication.class, args);
    }
}
