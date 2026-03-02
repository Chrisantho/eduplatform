# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy only pom first for caching
COPY backend/pom.xml ./

# Download dependencies first to leverage Docker cache
RUN mvn dependency:go-offline -B

# Copy the rest of the source code
COPY backend/src ./src

# Build the JAR without running tests
RUN mvn clean package -DskipTests

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Copy the JAR from the build stage
COPY --from=build /app/target/eduplatform-backend-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]