# Gym Booking System

A modern, full-stack application for managing gym classes, schedules, and bookings. Built with Spring Boot, Angular, and Keycloak for authentication.

Note on collaboration: This project is a cooperative work between the repository owner (Dimitris) and an AI programming assistant (GitHub Copilot). Many design decisions, refactors, and implementations were developed interactively.

## Features

- 🔐 Secure authentication and authorization with Keycloak
- 👥 User role management (Admin, Trainer, Member)
- 📅 Class scheduling and management
- 📋 Class booking system
- 📊 Real-time availability tracking
- 🎨 Modern, responsive UI with Angular Material
 - 🧰 Fully Dockerized local stack (Postgres, Keycloak, Backend, Frontend)
 - 🔁 Flyway-managed schema and seed data
 - 🛡️ Token-to-role normalization with legacy role support during transition

## Tech Stack

### Backend
- Java 21
- Spring Boot
- Spring Security
- Spring Data JPA
- PostgreSQL
- Flyway for database migrations
- Maven
 - Optional: Spring Boot Actuator (health) and Lombok (planned for refactor branch)

### Frontend
- Angular (Latest)
- Angular Material
- RxJS
- TypeScript
- date-fns
 - Modern theme with light/dark mode toggle

### Infrastructure
- Docker & Docker Compose
- Keycloak
- Nginx
- PostgreSQL

## Prerequisites

- Docker and Docker Compose
- Java 21 (for local development)
- Node.js 20+ (for local development)
- Maven (for local development)

## Quick Start

### Running with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/gym-booking.git
   cd gym-booking
   ```

2. Start the application using Docker Compose:
   ```bash
   docker compose up -d
   ```

3. Access the applications:
   - Frontend: http://localhost
   - Keycloak Admin Console: http://localhost:8180 (realm import auto-applied)
   - Backend API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html

### Local Development Setup (optional)

1. Start PostgreSQL and Keycloak using Docker Compose:
   ```bash
   docker compose up -d postgres keycloak
   ```

2. Configure the backend:
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. Configure the frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Initial Configuration

### Keycloak Setup

1. Access Keycloak Admin Console at http://localhost:8180
2. Login with:
   - Username: admin
   - Password: admin
3. A realm export is imported automatically on first Keycloak start from `keycloak/realms`. If configuring manually:
4. Create client: 'gym-booking-client'
5. Configure client:
   - Access Type: public
   - Valid Redirect URIs: http://localhost/*
   - Web Origins: *

### Roles
The canonical application roles are:
   - ADMIN
   - TRAINER
   - MEMBER

For backward compatibility, legacy roles INSTRUCTOR → TRAINER and ATHLETE → MEMBER are normalized by the backend security layer.

### Create Test Users
1. Create users and assign roles for testing
2. Default password for test accounts: 'password'
3. You can also promote a MEMBER to TRAINER from the Admin area in the UI.

## Project Structure

```
gym-booking/
├── backend/                 # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/      # Java source files
│   │   │   └── resources/ # Application properties and migrations
│   │   └── test/          # Test files
│   ├── Dockerfile
│   └── pom.xml
├── frontend/               # Angular application
│   ├── src/
│   │   ├── app/          # Application source
│   │   ├── assets/       # Static assets
│   │   └── environments/ # Environment configurations
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml     # Docker composition
```

## API Documentation

The API documentation is available through Swagger UI at http://localhost:8080/swagger-ui.html when running the backend.

## Available Endpoints

### Classes
- GET /api/classes - List all gym classes
- POST /api/classes - Create a new class (Admin/Trainer)
- PUT /api/classes/{id} - Update a class (Admin/Trainer)
- DELETE /api/classes/{id} - Delete a class (Admin)

### Class Types
- GET /api/class-types - List all class types
- GET /api/class-types/active - List active class types
- POST /api/class-types - Create (Admin/Trainer)
- PUT /api/class-types/{id} - Update (Admin/Trainer)
- DELETE /api/class-types/{id} - Delete (Admin/Trainer; blocked if referenced)

### Bookings
- GET /api/bookings - List user's bookings
- POST /api/bookings - Create a booking
- DELETE /api/bookings/{id} - Cancel a booking

## Security

- JWT-based authentication using Keycloak
- Role-based access control with on-the-fly normalization of legacy roles
- Secure password handling
- CORS configuration
- HTTPS support in production

## Development

### Backend Development

```bash
cd backend
./mvnw spring-boot:run
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

### Running Tests

Backend tests:
```bash
cd backend
./mvnw test
```

Frontend tests:
```bash
cd frontend
npm test
```

## Current Status and Roadmap

Recent highlights:
- Consolidated role model to ADMIN, TRAINER, MEMBER; legacy INSTRUCTOR/ATHLETE still recognized and normalized.
- Added Admin promotion flow (Member → Trainer).
- Dockerized local stack (frontend, backend, db, keycloak).
- UI shell modernization: new header/footer, hero landing, dark/light theme.
- Fixed trainer Management access and member History access issues.

Upcoming refactor branch (planned):
- Rename `instructorId` → `trainerId` across backend/DB/frontend with a Flyway migration.
- Introduce Lombok to reduce boilerplate in DTOs/entities.
- Add Spring Boot Actuator for health endpoints and observability.
- Standardize dialog styles and add a centralized toast/notification system.
- Strengthen tests and linting in containerized CI.

## Deployment

1. Build the images:
   ```bash
   docker-compose build
   ```

2. Deploy the stack:
   ```bash
   docker-compose up -d
   ```

3. Scale if needed:
   ```bash
   docker-compose up -d --scale backend=2
   ```

## Environment Variables

### Backend
- `SPRING_DATASOURCE_URL`: Database URL
- `SPRING_DATASOURCE_USERNAME`: Database username
- `SPRING_DATASOURCE_PASSWORD`: Database password
- `KEYCLOAK_AUTH_SERVER_URL`: Keycloak server URL
- `KEYCLOAK_REALM`: Keycloak realm name
- `KEYCLOAK_RESOURCE`: Keycloak client ID

### Frontend
- `API_URL`: Backend API URL
- `KEYCLOAK_URL`: Keycloak server URL

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- Spring Boot team for the excellent framework
- Angular team for the powerful frontend framework
- Keycloak team for the robust authentication solution
- All contributors and users of this project

---

Made with ❤️ by Dimitris & GitHub Copilot