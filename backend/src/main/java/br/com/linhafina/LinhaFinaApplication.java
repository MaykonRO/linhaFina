package br.com.linhafina;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class LinhaFinaApplication {

    public static void main(String[] args) {
        // Diagnostico de deploy sem imprimir credenciais.
        System.out.println("[config] DB_URL=" + System.getenv().getOrDefault("DB_URL", "padrao-local"));
        System.out.println("[config] PORT=" + System.getenv().getOrDefault("PORT", "8080")
                + " CORS=" + System.getenv().getOrDefault("APP_CORS_ORIGINS", "localhost")
                + " COOKIE_SECURE=" + System.getenv().getOrDefault("COOKIE_SECURE", "false"));
        SpringApplication.run(LinhaFinaApplication.class, args);
    }
}
