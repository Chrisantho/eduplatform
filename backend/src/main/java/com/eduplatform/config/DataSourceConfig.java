package com.eduplatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.jdbc.DataSourceBuilder;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            throw new RuntimeException("DATABASE_URL environment variable is not set");
        }

        try {
            String cleanUrl = databaseUrl;
            if (cleanUrl.startsWith("jdbc:")) {
                cleanUrl = cleanUrl.substring(5);
            }
            if (cleanUrl.startsWith("postgresql://")) {
                cleanUrl = cleanUrl.replaceFirst("postgresql://", "postgres://");
            }

            URI uri = new URI(cleanUrl);
            String host = uri.getHost();
            int port = uri.getPort();
            String path = uri.getPath();
            String query = uri.getQuery();

            String jdbcUrl = "jdbc:postgresql://" + host;
            if (port > 0) {
                jdbcUrl += ":" + port;
            }
            jdbcUrl += path;
            if (query != null && !query.isEmpty()) {
                jdbcUrl += "?" + query;
            }

            String username = null;
            String password = null;
            String userInfo = uri.getUserInfo();
            if (userInfo != null) {
                String[] parts = userInfo.split(":", 2);
                username = parts[0];
                if (parts.length > 1) {
                    password = parts[1];
                }
            }

            DataSourceBuilder<?> builder = DataSourceBuilder.create()
                    .url(jdbcUrl)
                    .driverClassName("org.postgresql.Driver");

            if (username != null) builder.username(username);
            if (password != null) builder.password(password);

            return builder.build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse DATABASE_URL: " + e.getMessage(), e);
        }
    }
}
