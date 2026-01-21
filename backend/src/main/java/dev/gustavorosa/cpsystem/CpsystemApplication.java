package dev.gustavorosa.cpsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@SpringBootApplication
public class CpsystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(CpsystemApplication.class, args);
	}

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/**")
						// Aceitar requisições do desenvolvimento local e do Docker/Nginx
						.allowedOrigins(
								"http://localhost:3000",      // Desenvolvimento local (Next.js dev server)
								"http://localhost",            // Produção Docker (via Nginx)
								"http://localhost:80"          // Explicitamente com porta
						)
						.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
						.allowedHeaders("*")
						.allowCredentials(true);
			}
		};
	}

}
