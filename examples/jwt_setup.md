# JWT Authentication Setup Guide

## Overview
This guide explains how to set up and test JWT authentication with PostgREST and PostgreSQL.

## Prerequisites
- Docker and Docker Compose
- Angular CLI (for frontend testing)

## Setup Steps

### 1. Database and PostgREST Setup
The system uses Docker Compose to set up:
- PostgreSQL database
- PostgREST API server
- JWT authentication

Key configuration in `docker-compose.yml`:
```yaml
PGRST_JWT_SECRET: "reallyreallyreallyreallyverysafesecret"
PGRST_JWT_SECRET_IS_BASE64: "false"
PGRST_JWT_AUD: "localparts"
```

### 2. Database Schema
The database is initialized with:
- JWT extension
- API schema
- User and test tables
- Row Level Security (RLS) policies
- JWT verification functions

### 3. Testing the Setup

#### 3.1 Generate a Test JWT Token
Use the following payload structure:
```json
{
  "sub": "user-uuid",
  "role": "authenticated",
  "email": "test@example.com"
}
```

#### 3.2 Test Endpoints
1. Get JWT Settings:
```bash
curl http://localhost:3000/jwt_settings
```

2. Test Data Update:
```bash
curl -X POST http://localhost:3000/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "test data"}'
```

### 4. Troubleshooting
If you encounter "invalid signature" errors:
1. Verify the JWT secret matches between frontend and backend
2. Check the JWT payload structure
3. Use the `decode_jwt` function to verify token contents:
```sql
SELECT decode_jwt('your-token-here');
```

## Common Issues
1. Invalid Signature: Ensure JWT secret matches in all configurations
2. RLS Policy Violations: Check user permissions and JWT claims
3. CORS Issues: Verify PGRST_CORS_ORIGINS setting

## Security Notes
- Never expose JWT secrets in production
- Use HTTPS in production
- Regularly rotate JWT secrets
- Implement proper token expiration 