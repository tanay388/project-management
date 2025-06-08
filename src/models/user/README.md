# User Module API Documentation

## Overview
This document provides integration guidelines for frontend developers to interact with the User Module APIs. The module handles user authentication, registration, profile management, and role-based access control.

## Authentication

### User Registration
```typescript
POST /user/signup
Content-Type: application/json

Body:
{
  "name": string (optional),
  "phone": string (optional),
  "email": string (required),
  "password": string (required, min length: 6),
  "birthDate": Date (optional),
  "gender": "Male" | "Female" | "Prefer not to say" (optional)
}
```

### User Login
```typescript
POST /user/login
Content-Type: application/json

Body:
{
  "username": string (email),
  "password": string,
  "oldToken": string (optional)
}

Response:
{
  "id": string,
  "name": string,
  "email": string,
  "role": UserRole,
  "token": string
}
```

### Google Login
```typescript
POST /user/google-login
Content-Type: application/json

Body:
{
  "token": string,
  "oldToken": string (optional)
}
```

## User Profile Management

### Get Current User Profile
```typescript
GET /user
Authorization: Bearer {token}

Response:
{
  "id": string,
  "name": string,
  "email": string,
  "phone": string,
  "photo": string,
  "role": UserRole,
  "birthDate": Date,
  "status": UserStatus,
  "department": Department,
  "designation": string,
  "employeeId": string
}
```

### Update Profile
```typescript
PATCH /user
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
{
  "name": string (optional),
  "phone": string (optional),
  "photo": File (optional),
  "birthDate": Date (optional),
  "gender": Gender (optional)
}
```

## Admin Operations

### Get Pending Users (Admin Only)
```typescript
GET /user/pending
Authorization: Bearer {token}

Response:
[
  {
    "id": string,
    "name": string,
    "email": string,
    "status": "pending",
    // ... other user fields
  }
]
```

### Update User Status (Admin Only)
```typescript
PATCH /user/:id/status
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "status": UserStatus,
  "role": UserRole (optional),
  "department": Department (optional),
  "designation": string (optional),
  "employeeId": string (optional)
}
```

## Enums

### UserRole
```typescript
enum UserRole {
  user = 'user',
  admin = 'admin',
  projectManager = 'project_manager',
  teamLead = 'team_lead',
  developer = 'developer',
  designer = 'designer',
  qa = 'qa'
}
```

### UserStatus
```typescript
enum UserStatus {
  pending = 'pending',
  active = 'active',
  inactive = 'inactive',
  rejected = 'rejected'
}
```

### Department
```typescript
enum Department {
  engineering = 'engineering',
  design = 'design',
  productManagement = 'product_management',
  qualityAssurance = 'quality_assurance',
  marketing = 'marketing',
  sales = 'sales',
  humanResources = 'human_resources'
}
```

## Integration Flow

1. **New User Registration**:
   - User registers through signup or Google login
   - Initial status is set to 'pending'
   - User can login but has limited access

2. **Admin Approval**:
   - Admin views pending users through GET /user/pending
   - Admin approves users by updating their status
   - Admin can assign roles, departments, and designations

3. **User Access**:
   - After approval, users can access features based on their role
   - Token must be included in all authenticated requests
   - Some routes are protected by role-based access control

## Error Handling

The API returns standard HTTP status codes:
- 400: Bad Request (invalid input)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 500: Internal Server Error

Error responses include a message field describing the error:
```typescript
{
  "statusCode": number,
  "message": string,
  "error": string
}
```

## Security Considerations

1. Always use HTTPS for API requests
2. Store JWT tokens securely
3. Include Authorization header in all authenticated requests
4. Handle token expiration and refresh flow
5. Validate user roles before showing restricted UI elements