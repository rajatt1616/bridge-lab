# BridgeLab Web — Deployment & Viva Notes

## Deploy
```
mvn clean package
java -jar target/bridgelab-1.0.0.jar
```
Or Docker:
```
FROM eclipse-temurin:17-jdk
COPY target/bridgelab-1.0.0.jar /app/app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```
Free hosts: Render, Railway (Spring Boot works out of the box).

## Viva Additions for Web Version
- Why REST + DTO: separates domain from transport; controllers never contain physics.
- Dependency Injection: `@SpringBootApplication`, `@RestController`, `@GetMapping`.
- Why no React: the spec requires a simple demonstration; vanilla JS keeps focus on OOP.
- Same OOP grading applies: model is unchanged; only UI/controller layer changed.
