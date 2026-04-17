package com.assetguardian.backend.config;

import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .httpBasic(Customizer.withDefaults())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/auth/me").authenticated()
                .requestMatchers(HttpMethod.GET, "/api/v1/**").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/v1/assets").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.PUT, "/api/v1/assets/*").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/assets/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/assets/*/link").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/v1/assets/*/unlink").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/v1/assets/*/transfer").hasAnyRole("ADMIN", "OPERATOR")
                .requestMatchers(HttpMethod.POST, "/api/v1/departments").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/departments/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/departments/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/spaces").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/spaces/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/spaces/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/employees").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/employees/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/employees/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/v1/stations").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/stations/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/stations/*/responsible").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/v1/stations/*").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/v1/layouts/*").hasRole("ADMIN")
                .anyRequest().authenticated()
            );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(
        PasswordEncoder passwordEncoder,
        @Value("${app.security.admin-username:admin}") String adminUsername,
        @Value("${app.security.admin-password:admin123}") String adminPassword,
        @Value("${app.security.operator-username:operadora}") String operatorUsername,
        @Value("${app.security.operator-password:operadora123}") String operatorPassword
    ) {
        UserDetails admin = User.builder()
            .username(adminUsername)
            .password(passwordEncoder.encode(adminPassword))
            .roles("ADMIN")
            .build();

        UserDetails operator = User.builder()
            .username(operatorUsername)
            .password(passwordEncoder.encode(operatorPassword))
            .roles("OPERATOR")
            .build();

        return new InMemoryUserDetailsManager(List.of(admin, operator));
    }
}
