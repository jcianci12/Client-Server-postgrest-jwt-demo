# Security Considerations

## Authentication
- JWT-based authentication (oauth2 + oidc-ts client side lib)
- public client so pkce 
- Token expiration: 24 hours
- Refresh token rotation
- Single sign on oauth2

### PostgREST JWT Requirements
- Required JWT Claims:
  - `sub`: User ID (from Authentik)
  - `role`: Set to 'authenticated'
  - `aud`: Set to 'localparts'
- Required Headers:
  - `Authorization: Bearer <token>`
  - `X-User-Role: authenticated`
  - `X-JWT-Aud: localparts`
  - `Prefer: return=representation`

### OAUTH details
Root URL for auth server: https://authentik.tekonline.com.au
dev url: http://localhost:4200
prod url: https://localparts.tekonline.com.au
Client ID
    2IMb22Ysgo9cnfjX3wrHmvidZRZrtAtbfrEEdzJp
Redirect URIs
        strict: http://localhost:4200

### Authentication Flow
1. Client initiates login with Authentik using oidc-client-ts
2. oidc-client-ts handles PKCE flow automatically:
   - Generates code verifier and challenge
   - Sends authorization request with PKCE parameters
3. Authentik validates PKCE and returns authorization code
4. oidc-client-ts exchanges code for tokens
5. Client receives JWT token from Authentik
6. Client sends token to JWT Middleware for transformation:
   - Middleware verifies token using Authentik's JWKS
   - Middleware adds required claims (role, aud)
   - Middleware re-signs token with Postgrest secret
7. Client receives transformed token from middleware
8. Client adds required headers for PostgREST:
   - Authorization: Bearer <transformed-token>
   - X-User-Role: authenticated
   - X-JWT-Aud: localparts
9. PostgREST validates JWT and enforces RLS policies

### JWT Middleware Configuration
- Endpoint: http://localhost:8000
- Routes:
  - POST /transform-token: Transforms Authentik JWT to Postgrest format
  - GET /health: Health check endpoint
  - GET /test-connection: Tests connection to Postgrest
- Environment Variables:
  - POSTGREST_URL: URL of Postgrest service
  - POSTGREST_JWT_SECRET: Secret for signing Postgrest tokens
  - AUTHENTIK_URL: URL of Authentik server

Endpoint 	URL
Authorization 	/application/o/authorize/
Token 	/application/o/token/
User Info 	/application/o/userinfo/
Token Revoke 	/application/o/revoke/
End Session 	/application/o/localparts/end-session/
JWKS 	/application/o/localparts/jwks/
OpenID Configuration 	/application/o/localparts/.well-known/openid-configuration

## Data Protection
- HTTPS only
- Input validation and sanitization
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- JWT token validation and signature verification

## User Privacy
- Location data precision control
- User data encryption at rest
- RLS policies for data access control

## API Security
- Rate limiting
- Request validation
- API key for external services
- CORS configuration
- JWT-based authentication for all protected endpoints

## Image Security
- File type validation
- Size limits
- Malware scanning
- Secure storage