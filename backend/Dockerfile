# ==============================================================================
# Campus Nexus — Production Multi-Stage Dockerfile for Spring Boot 3 / Java 21
# ==============================================================================
# Optimized for Render deployment, minimal image size, and fast boot times.
# ==============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build the Spring Boot application using Maven & Eclipse Temurin JDK 21
# -----------------------------------------------------------------------------
FROM maven:3.9.9-eclipse-temurin-21-jammy AS builder
WORKDIR /build

# Copy Maven project descriptor
COPY pom.xml .

# Pre-fetch project dependencies to leverage Docker layer caching
RUN mvn dependency:go-offline -B || true

# Copy application source tree
COPY src ./src

# Build production executable JAR (skipping unit tests as they run in CI)
RUN mvn clean package -DskipTests -B

# -----------------------------------------------------------------------------
# Stage 2: Production JRE 21 Runtime (Minimal footprint, non-root user)
# -----------------------------------------------------------------------------
FROM eclipse-temurin:21-jre-jammy AS runner
WORKDIR /app

# Security: Create a dedicated unprivileged system group and user
RUN addgroup --system spring && adduser --system --ingroup spring spring
USER spring:spring

# Copy the compiled Spring Boot executable JAR from builder stage
COPY --from=builder --chown=spring:spring /build/target/app.jar app.jar

# Render dynamically assigns PORT at runtime (Spring Boot reads ${PORT:8080})
ENV PORT=8080
EXPOSE 8080

# Production JVM execution options:
# - UseContainerSupport: respects cgroup CPU & memory quotas in cloud containers
# - MaxRAMPercentage: restricts heap allocation to 75% of container RAM (prevents OOM on 512MB free tier)
# - java.security.egd: non-blocking entropy source for fast SSL/JWT initialization
ENTRYPOINT ["sh", "-c", "java -XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom -jar app.jar"]
