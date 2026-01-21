FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /app

COPY backend/gradlew .
COPY backend/gradle gradle
COPY backend/build.gradle .
COPY backend/settings.gradle .

COPY proto/ ./proto/

COPY backend/mutr-app mutr-app
COPY backend/mutr-auth mutr-auth
COPY backend/mutr-core mutr-core
COPY backend/mutr-node mutr-node
COPY backend/mutr-ai mutr-ai

RUN chmod +x ./gradlew
RUN ./gradlew :mutr-app:build -x test

FROM eclipse-temurin:21-jre-jammy
WORKDIR /app
COPY --from=build /app/mutr-app/build/libs/*.jar app.jar

ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=prod", "app.jar"]