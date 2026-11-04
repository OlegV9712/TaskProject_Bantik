FROM maven:3.9.3-eclipse-temurin-17 AS builder
WORKDIR /build
COPY pom.xml ./
COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:17-jdk
WORKDIR /app
COPY --from=builder /build/target/backend-0.0.1-SNAPSHOT.jar ./app.jar
EXPOSE 8081
CMD ["java","-jar","/app/app.jar"]
