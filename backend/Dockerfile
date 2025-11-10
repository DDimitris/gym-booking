FROM eclipse-temurin:21-jdk-alpine as build
WORKDIR /workspace/app

# Copy maven wrapper and configuration first
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Convert line endings and make mvnw executable
RUN chmod +x mvnw && \
    sed -i 's/\r$//' mvnw

# Download dependencies first (this layer will be cached)
RUN ./mvnw dependency:go-offline

# Copy source code
COPY src src/

# Build the application
RUN ./mvnw clean package -DskipTests
RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

FROM eclipse-temurin:21-jre-alpine
# Install curl for healthchecks
RUN apk add --no-cache curl
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/target/dependency
COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app
ENTRYPOINT ["java","-cp","app:app/lib/*","com.gym.booking.GymBookingApplication"]