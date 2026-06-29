FROM maven:3.9.11-eclipse-temurin-17-alpine AS build

WORKDIR /app
COPY pom.xml ./
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-alpine

RUN addgroup -S satbuddy && adduser -S satbuddy -G satbuddy
WORKDIR /app
COPY --from=build /app/target/sale-0.0.1-SNAPSHOT.jar app.jar
RUN mkdir -p /app/logs && chown -R satbuddy:satbuddy /app

ENV PORT=8080
EXPOSE 8080
USER satbuddy

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
