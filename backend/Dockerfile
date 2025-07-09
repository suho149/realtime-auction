# backend/Dockerfile

# Stage 1: Build the application
FROM openjdk:17-jdk-slim AS builder
WORKDIR /workspace/app

COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
RUN ./gradlew build -x test
# RUN ./gradlew dependencies # Layer Caching을 위해 이렇게 분리할 수도 있음

# Stage 2: Create the final image
FROM openjdk:17-jre-slim
WORKDIR /app

# Copy the built JAR from the builder stage
COPY --from=builder /workspace/app/build/libs/*.jar app.jar

ENTRYPOINT ["java", "-jar", "app.jar"]