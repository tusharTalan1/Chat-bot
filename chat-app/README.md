# Chat App API Documentation

This document lists all the available REST API endpoints for the Chat App, along with their required parameters, request bodies, and expected responses. This is useful for testing the API via tools like Postman, Insomnia, or cURL.

---

## Base URL
All API endpoints are relative to the server's base URL:
`http://localhost:5000`

---

## 1. User Registration

Register a new user account in the system.

- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Headers**: 
  - `Content-Type: application/json`

### Request Body (JSON)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `username` | String | Yes | Minimum 3 characters, max 30. |
| `email` | String | Yes | Valid email format, unique across users. |
| `password` | String | Yes | Plain text password (will be hashed). |

**Example Request:**
```json
{
  "username": "johndoe",
  "email": "johndoe@example.com",
  "password": "secretpassword"
}
```

### Response
- **Success (201 Created)**: Returns user details along with a JWT token.
- **Error (400 Bad Request)**: Missing fields or user already exists.

**Example Success Response:**
```json
{
  "_id": "60d0fe4f5311236168a109ca",
  "username": "johndoe",
  "email": "johndoe@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. User Login

Authenticate an existing user and get a JSON Web Token (JWT).

- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Headers**: 
  - `Content-Type: application/json`

### Request Body (JSON)
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `email` | String | Yes | The user's registered email address. |
| `password` | String | Yes | The user's password. |

**Example Request:**
```json
{
  "email": "johndoe@example.com",
  "password": "secretpassword"
}
```

### Response
- **Success (200 OK)**: Returns user details along with a JWT token.
- **Error (401 Unauthorized)**: Invalid email or password.

**Example Success Response:**
```json
{
  "_id": "60d0fe4f5311236168a109ca",
  "username": "johndoe",
  "email": "johndoe@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 3. WebSocket Connection

Real-time chat functionality is handled via Socket.IO, not standard HTTP endpoints.

- **URL**: `ws://localhost:5000`
- **Authentication**: Requires a JWT token passed during the connection handshake.

