# OAuth2, JWT Middleware, and RLS Demonstration

## Overview
This project demonstrates a complete implementation of:
- OAuth2 authentication flow
- JWT middleware for token transformation
- PostgreSQL Row-Level Security (RLS)
- PostgREST API with secure endpoints

## Architecture
The project consists of three main components:
1. **Frontend (Angular)**: Demonstrates OAuth2 authentication flow
2. **JWT Middleware**: Transforms OAuth2 tokens for PostgREST compatibility
3. **Backend (PostgreSQL + PostgREST)**: Implements RLS policies

## Project Structure
```
├── docs/           # Documentation and tutorials
├── db/            # Database initialization scripts
├── jwt-middleware/ # JWT transformation service
├── ClientApp/     # Angular frontend
└── docker-compose.yml
```

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js and npm (for frontend development)

### Setup
1. Clone the repository
2. Start the services:
```bash
docker-compose up -d
```

3. Available services:
- PostgreSQL: localhost:5432
- PostgREST: localhost:3000
- JWT Middleware: localhost:8000
- Frontend: localhost:4200

## Educational Components

### 1. OAuth2 Authentication
- Implementation of OAuth2 authorization code flow
- Token handling and refresh mechanisms
- Secure storage of tokens

### 2. JWT Middleware
- Token transformation between OAuth2 and PostgREST
- JWT validation and signing
- Security considerations and best practices

### 3. Row-Level Security
- PostgreSQL RLS policy implementation
- Role-based access control
- Multi-tenant data isolation

## Documentation
Detailed documentation can be found in the `docs/` directory:
1. [OAuth2 Implementation](./docs/oauth2.md)
2. [JWT Middleware Guide](./docs/jwt-middleware.md)
3. [RLS Configuration](./docs/rls.md)
4. [Security Best Practices](./docs/security.md)

## Testing
The project includes a comprehensive test suite that demonstrates:
- Authentication flow
- Token transformation
- RLS policy enforcement
- API endpoint security

## Contributing
Contributions are welcome! Please read our [Contributing Guidelines](./docs/contributing.md) before submitting changes.

## License
MIT License - See [LICENSE](./LICENSE) for details. 