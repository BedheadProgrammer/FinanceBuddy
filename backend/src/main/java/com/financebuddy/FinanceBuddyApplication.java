package com.financebuddy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class FinanceBuddyApplication {

    public static void main(String[] args) {
        SpringApplication.run(FinanceBuddyApplication.class, args);
    }
}
