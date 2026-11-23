# Build do backend Java 21 sem depender de instalacao local do Maven.
FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /app
COPY backend/pom.xml backend/pom.xml
RUN mvn -B -ntp -f backend/pom.xml dependency:go-offline
COPY backend/src backend/src
RUN mvn -B -ntp -DskipTests -f backend/pom.xml clean package

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/backend/target/linha-fina-1.0.0.jar app.jar
ENV PORT=8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
