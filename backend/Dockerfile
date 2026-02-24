# Build stage: Use Maven with Java 21 to compile
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Build the JAR without running tests
RUN mvn clean package -DskipTests

# Runtime stage: Use your required JDK 27 image
FROM openjdk:27-ea-8-jdk-slim-trixie
WORKDIR /app

# Copy the JAR from the build stage
COPY --from=build /app/target/eduplatform-backend-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]