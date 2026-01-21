package dev.gustavorosa.cpsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.Collections;

@Configuration
public class WebConfig {

    @Bean
    public CorsFilter corsFilter() {
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        final CorsConfiguration config = new CorsConfiguration();
        
        config.setAllowCredentials(true);
        // Suporta localhost, 127.0.0.1 e IPs da rede local (192.168.x.x)
        config.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:[*]",
            "http://127.0.0.1:[*]",
            "http://192.168.*:[*]"
        ));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "OPTIONS", "DELETE", "PATCH"));
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}

