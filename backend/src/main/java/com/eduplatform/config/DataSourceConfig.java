package com.eduplatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.jdbc.DataSourceBuilder;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    @Bean
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isEmpty()) {
            throw new RuntimeException("DATABASE_URL environment variable is not set");
        }

        String jdbcUrl = databaseUrl;
        if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
            jdbcUrl = databaseUrl.replaceFirst("postgres(ql)?://", "jdbc:postgresql://");
        } else if (!databaseUrl.startsWith("jdbc:")) {
            jdbcUrl = "jdbc:postgresql://" + databaseUrl;
        }

        return DataSourceBuilder.create()
                .url(jdbcUrl)
                .driverClassName("org.postgresql.Driver")
                .build();
    }
}
