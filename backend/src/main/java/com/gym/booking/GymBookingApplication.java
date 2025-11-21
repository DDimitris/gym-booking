package com.gym.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.TimeZone;

@SpringBootApplication
public class GymBookingApplication {
    public static void main(String[] args) {
        // Set application default timezone from environment (fallback to Europe/Athens)
        String tz = System.getenv().getOrDefault("APP_TIMEZONE", "Europe/Athens");
        TimeZone.setDefault(TimeZone.getTimeZone(tz));
        System.setProperty("user.timezone", tz);

        SpringApplication.run(GymBookingApplication.class, args);
    }
}