package br.com.linhafina;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = {UserDetailsServiceAutoConfiguration.class})
public class LinhaFinaApplication {

    public static void main(String[] args) {
        SpringApplication.run(LinhaFinaApplication.class, args);
    }
}
