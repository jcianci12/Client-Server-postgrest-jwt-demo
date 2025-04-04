# API Design

## Base URL
`/api/v1`

## Authentication
Authentication is handled via JWT tokens from Authentik. All protected endpoints require a valid JWT token in the Authorization header.

## Security Features
- Row Level Security (RLS) enabled
- Users can only see and modify their own records
- New users are automatically created on first insert
- Authentication via JWT tokens from Authentik

## Test Endpoints

### Test Table Structure
Table for testing RLS:
- `id`: Serial
- `user_id`: Text (references users.id)
- `value`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Testing Authentication and RLS

1. Get a JWT token from Authentik
2. Test with curl:
```bash
# Set your JWT token
export JWT="your-jwt-token"

# Insert a test value
curl http://localhost:3000/test \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"value": "test value"}'

# Retrieve your values
curl http://localhost:3000/test \
  -H "Authorization: Bearer $JWT"
```

## Core Endpoints

### Users
Endpoint: `/users`

Operations:
- GET: Retrieve user profile
- PATCH: Update user profile
- POST: Create new user (automatic via authentication)

### Part Listings
Endpoint: `/part_listings`

Operations:
- GET: List/search parts
- POST: Create new listing
- PATCH: Update listing
- DELETE: Remove listing

For detailed request/response schemas, see [Data Models](./data-models.md).

## Endpoints

### Authentication
```
POST /auth/register
POST /auth/login
POST /auth/refresh-token
```

### Users
```
GET /users/me
PUT /users/me
GET /users/:id
PUT /users/:id/location
```

### Part Listings
```
GET /listings
  Query params:
    - lat: number
    - lng: number
    - radius: number (km)
    - category?: string
    - make?: string
    - model?: string
    - year?: number
    - min_price?: number
    - max_price?: number
    - condition?: string
    - page?: number
    - limit?: number

POST /listings
GET /listings/:id
PUT /listings/:id
DELETE /listings/:id
POST /listings/:id/images
DELETE /listings/:id/images/:imageId
```

### Messages
```
GET /messages
POST /messages
GET /messages/:id
PUT /messages/:id/read
```

## Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}
```

## Error Codes
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 422: Validation Error
- 500: Internal Server Error

## Rate Limiting
- 100 requests per minute per IP
- 1000 requests per hour per user 