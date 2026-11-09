# API

This document describes the API endpoints, request formats, response
structures, and authentication requirements provided by the project.

## Features

* Authentication
* User Management
* ...

## API Reference

### Authentication

#### `/login`

Authenticate a user and establish an authenticated session.

**Method:** `POST`

**Endpoint:** `/login`

**Authentication:** Not required

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | User's email address |
| `password` | `string` | Yes | User's password |

**Response:**

**Success (`200 OK`):**

```json
{
    "message": "Login successful",
    "token": "<access_token>",
    "user": {
        "id": "<user_id>",
        "email": "<email>"
    }
}
```

**Error Responses:**

| Status Code | Description |
|-------------|-------------|
| `400 Bad Request` | Invalid request body |
| `401 Unauthorized` | Invalid credentials |
| `500 Internal Server Error` | Unexpected server error |

#### `/signup`

Register a new user account.

**Method:** `POST`

**Endpoint:** `/signup`

**Authentication:** Not required

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | `string` | Yes | User's email address |
| `password` | `string` | Yes | User's password |
| `username` | `string` | Yes | User's display name |

**Response:**

**Success (`201 Created`):**

```json
{
    "message": "Account created successfully",
    "user": {
        "id": "<user_id>",
        "email": "<email>",
        "username": "<username>"
    }
}
```

**Error Responses:**

| Status Code | Description |
|-------------|-------------|
| `400 Bad Request` | Invalid request body |
| `409 Conflict` | Email or username already exists |
| `500 Internal Server Error` | Unexpected server error |

## Endpoint Template

Use the following template when documenting additional endpoints.

### `<Feature Name>`

#### `<Endpoint>`

Briefly describe the purpose of this endpoint.

**Method:** `<HTTP_METHOD>`

**Endpoint:** `/path`

**Authentication:** `<Required / Not required>`

**Request Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `<field>` | `<type>` | `<Yes / No>` | `<Description>` |

**Request Body:**

```json
{
    "<field>": "<value>"
}
```

**Response:**

**Success (`<STATUS_CODE>`):**

```json
{
    "<field>": "<value>"
}
```

**Error Responses:**

| Status Code | Description |
|-------------|-------------|
| `<STATUS_CODE>` | `<Description>` |

**Notes:**

* Additional constraints
* Validation rules
* Related endpoints
