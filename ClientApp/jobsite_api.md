# Jobsite API Documentation

This document outlines the API endpoints available for managing jobsites in the WorkSiteDiary application.

## Base URL

All endpoints are relative to the base API URL: `/jobsite`

## Authentication

All endpoints require authentication. Include a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Data Models

### JobsiteStatus Enum

Possible values for jobsite status:
- `active` - Jobsite is currently active
- `inactive` - Jobsite is temporarily inactive
- `completed` - Jobsite work has been completed

### JobsiteResponse

This is the data structure returned by most jobsite endpoints:

```typescript
interface JobsiteResponse {
  id: number;
  name: string;
  address: string;
  status: "active" | "inactive" | "completed";
  company_id: number;
  qr_code_id: string;
  qr_code_generated_at: string; // ISO 8601 datetime format
  created_at: string; // ISO 8601 datetime format
  updated_at: string; // ISO 8601 datetime format
}
```

### DeliveryResponse

This is the data structure returned for delivery-related endpoints:

```typescript
interface DeliveryResponse {
  id: number;
  company_name: string;
  item: string;
  qty: number;
  notes: string | null;
  jobsite_id: number;
  created_at: string; // ISO 8601 datetime format
  updated_at: string | null; // ISO 8601 datetime format
}
```

## Endpoints

### Get All Jobsites

Retrieves all jobsites for the current user's company.

- **URL**: `GET /jobsite`
- **Auth Required**: Yes
- **Response**: Array of `JobsiteResponse` objects
- **Error Responses**:
  - `400 Bad Request` - No current company selected

### Create Jobsite

Creates a new jobsite.

- **URL**: `POST /jobsite/`
- **Auth Required**: Yes
- **Request Body**:
  ```typescript
  {
    name: string;
    address: string;
    status: "active" | "inactive" | "completed";
  }
  ```
- **Response**: `JobsiteResponse` object
- **Error Responses**:
  - `400 Bad Request` - No current company selected or failed to create jobsite

### Get Jobsite by ID

Retrieves a specific jobsite by ID.

- **URL**: `GET /jobsite/{jobsite_id}`
- **Auth Required**: Yes
- **URL Parameters**:
  - `jobsite_id` (integer) - ID of the jobsite to retrieve
- **Response**: `JobsiteResponse` object
- **Error Responses**:
  - `404 Not Found` - Jobsite not found
  - `403 Forbidden` - User does not have access to this jobsite

### Update Jobsite

Updates an existing jobsite.

- **URL**: `PUT /jobsite/{jobsite_id}`
- **Auth Required**: Yes (requires system_admin role)
- **URL Parameters**:
  - `jobsite_id` (integer) - ID of the jobsite to update
- **Request Body**:
  ```typescript
  {
    name?: string;
    address?: string;
    status?: "active" | "inactive" | "completed";
  }
  ```
  Note: All fields are optional. Only provided fields will be updated.
- **Response**: Updated `JobsiteResponse` object
- **Error Responses**:
  - `404 Not Found` - Jobsite not found
  - `403 Forbidden` - User does not have required permissions
  - `400 Bad Request` - Failed to update jobsite

### Delete Jobsite

Deletes a jobsite.

- **URL**: `DELETE /jobsite/{jobsite_id}`
- **Auth Required**: Yes (requires system_admin role)
- **URL Parameters**:
  - `jobsite_id` (integer) - ID of the jobsite to delete
- **Response**: `204 No Content` on success
- **Error Responses**:
  - `404 Not Found` - Jobsite not found
  - `403 Forbidden` - User does not have required permissions
  - `400 Bad Request` - Failed to delete jobsite

### Get Deliveries by Jobsite

Retrieves all deliveries for a specific jobsite.

- **URL**: `GET /jobsite/{jobsite_id}/deliveries/`
- **Auth Required**: Yes
- **URL Parameters**:
  - `jobsite_id` (integer) - ID of the jobsite
- **Response**: Array of `DeliveryResponse` objects
- **Error Responses**:
  - `404 Not Found` - Jobsite not found
  - `403 Forbidden` - User does not have access to this jobsite

### Get Jobsite QR Code Data

Retrieves QR code data for a jobsite.

- **URL**: `GET /jobsite/{jobsite_id}/qr-code`
- **Auth Required**: Yes
- **URL Parameters**:
  - `jobsite_id` (integer) - ID of the jobsite
- **Response**: `JobsiteResponse` object
- **Error Responses**:
  - `404 Not Found` - Jobsite not found
  - `403 Forbidden` - User does not have access to this jobsite

### Get Jobsite QR Code Image

Retrieves a QR code image for a jobsite.

- **URL**: `GET /jobsite/{jobsite_id}/qr-code/image`
- **Auth Required**: Yes
- **URL Parameters**:
  - `jobsite_id` (integer) - ID of the jobsite
- **Response**: PNG image (Content-Type: image/png)
- **Error Responses**:
  - `404 Not Found` - Jobsite not found
  - `403 Forbidden` - User does not have access to this jobsite

### Regenerate QR Code

Regenerates the QR code for a jobsite.

- **URL**: `POST /jobsite/{jobsite_id}/qr-code/regenerate`
- **Auth Required**: Yes (requires system_admin role)
- **URL Parameters**:
  - `jobsite_id` (integer) - ID of the jobsite
- **Response**: Updated `JobsiteResponse` object
- **Error Responses**:
  - `404 Not Found` - Jobsite not found
  - `403 Forbidden` - User does not have required permissions

## Error Handling

All endpoints may return the following errors:
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Unexpected server error

## Notes for Frontend Implementation

1. Always check for the current company selection before making requests
2. Handle authentication token expiration and refresh
3. Implement proper error handling for all API responses
4. For QR code image, you can directly use the image URL in an `<img>` tag
5. The jobsite status should be displayed using appropriate UI elements based on the status value
6. Admin-only features (update, delete, regenerate QR code) should be conditionally rendered based on user role 