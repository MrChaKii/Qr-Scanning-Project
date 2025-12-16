# API Routes Documentation

## Authentication Routes (`authRoutes.js`)

Base path: `/api/auth` (or as configured in server.js)

### Public Routes

#### Login
- **Endpoint**: `POST /login`
- **Description**: Authenticates a user and returns a JWT token
- **Authentication**: Not required
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: JWT token and user information

---

### Protected Routes (Admin Only)

All routes below require:
- Valid JWT token in Authorization header: `Bearer <token>`
- User role: `admin`

#### Create User
- **Endpoint**: `POST /users`
- **Description**: Creates a new user account
- **Authentication**: Required (Admin only)
- **Request Body**:
  ```json
  {
    "email": "newuser@example.com",
    "password": "password123",
    "role": "user"
  }
  ```

#### Get All Users
- **Endpoint**: `GET /users`
- **Description**: Retrieves a list of all users
- **Authentication**: Required (Admin only)
- **Response**: Array of user objects

#### Update User
- **Endpoint**: `PUT /users/:id`
- **Description**: Updates an existing user's information
- **Authentication**: Required (Admin only)
- **URL Parameters**: 
  - `id`: User ID
- **Request Body**:
  ```json
  {
    "email": "updated@example.com",
    "role": "admin"
  }
  ```

#### Delete User
- **Endpoint**: `DELETE /users/:id`
- **Description**: Deletes a user account
- **Authentication**: Required (Admin only)
- **URL Parameters**: 
  - `id`: User ID

---

## Authentication

### JWT Token
Include the JWT token in the Authorization header for protected routes:
```
Authorization: Bearer <your-jwt-token>
```

### Roles
- `user`: Standard user access
- `admin`: Administrative access (required for user management)

---

## Error Responses

All endpoints may return the following error responses:

- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error
