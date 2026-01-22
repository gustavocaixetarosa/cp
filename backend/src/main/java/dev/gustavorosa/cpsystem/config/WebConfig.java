package dev.gustavorosa.cpsystem.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class WebConfig {

    @Bean
    public CorsFilter corsFilter() {
        final UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        final CorsConfiguration config = new CorsConfiguration();
        
        config.setAllowCredentials(true);
        
        // Obter origins permitidos de variável de ambiente
        String allowedOriginsEnv = System.getenv().getOrDefault(
            "ALLOWED_ORIGINS",
            "http://localhost:3000,http://localhost,http://127.0.0.1:3000"
        );
        
        // Converter string separada por vírgula em lista
        List<String> allowedOrigins = Arrays.stream(allowedOriginsEnv.split(","))
            .map(String::trim)
            .collect(Collectors.toList());
        
        // Adicionar padrões para desenvolvimento local (suporte a qualquer porta)
        config.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:[*]",
            "http://127.0.0.1:[*]",
            "http://192.168.*:[*]",
            "https://localhost:[*]",
            "https://127.0.0.1:[*]"
        ));
        
        // Adicionar origins específicos da variável de ambiente (produção)
        config.setAllowedOrigins(allowedOrigins);
        
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "OPTIONS", "DELETE", "PATCH"));
        
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}

