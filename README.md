# Event Management REST API
A complete Event Management REST API built with Node.js, Express, and PostgreSQL, allowing users to create events, register, cancel, and view event statistics.

# Features
Create and manage users and events
Event registration and cancellation
Enforce capacity limits and prevent duplicate registrations
Disallow registrations for past events
List upcoming events sorted by date and location
Event statistics (registrations, remaining capacity, percentage used)
Input validation and meaningful error messages

# TECH STACK
| Layer              | Technology         |
| ------------------ | ------------------ |
| Backend Framework  | Express.js         |
| Database           | PostgreSQL         |
| Database Client    | pg (node-postgres) |
| Validation         | express-validator  |
| UUID Generation    | uuid               |
| Environment Config | dotenv             |


event-management-api/
│
├── src/
│   ├── routes/
│   │   └── events.js
│   ├── utils/
│   │   └── validators.js
│   ├── db.js
│   └── app.js
│
├── .env
├── package.json
└── README.md

# Setup Instructions
## 1.Clone and Install
git clone https://github.com/yokeshr21/event-management-api.git
cd event-management-api
npm install

## 2.Configure Environment

Create a .env file in the root:

PORT=3000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=event_management
DB_PASSWORD=1648
DB_PORT=5432

## 3.Set Up Database

### Connect to PostgreSQL (e.g. via psql):

CREATE DATABASE event_management;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  event_datetime TIMESTAMP NOT NULL,
  location TEXT NOT NULL,
  capacity INT CHECK (capacity > 0 AND capacity <= 1000)
);

CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  registered_at TIMESTAMP DEFAULT now(),
  UNIQUE (event_id, user_id)
);

## 4.Run Server
npm run dev


Server starts at:
http://localhost:3000

# API Endpoints

## Create User

POST /api/users

Request Body:

{
  "name": "John Doe",
  "email": "john@example.com"
}


Response:

{
  "message": "User created",
  "id": "f6e1a4d6-2a6c-4b55-a6a9-64c45b6b831f"
}


## Create Event

POST /api/events

Request Body:

{
  "title": "Tech Conference",
  "event_datetime": "2025-12-15T09:30:00Z",
  "location": "Chennai",
  "capacity": 500
}


Response:

{
  "message": "Event created",
  "id": "b51a673f-833f-4d9b-a128-5ea54d6d1ac3"
}

## Get Event Details

GET /api/events/:eventId

Response:

{
  "id": "b51a673f-833f-4d9b-a128-5ea54d6d1ac3",
  "title": "Tech Conference",
  "event_datetime": "2025-12-15T09:30:00Z",
  "location": "Chennai",
  "capacity": 500,
  "registered_users": [
    {
      "id": "f6e1a4d6-2a6c-4b55-a6a9-64c45b6b831f",
      "name": "John Doe",
      "email": "john@example.com",
      "registered_at": "2025-10-16T08:30:00Z"
    }
  ]
}

## Register for Event

POST /api/events/:eventId/register

Request Body:

{
  "userId": "f6e1a4d6-2a6c-4b55-a6a9-64c45b6b831f"
}


Errors Handled:

Event full
Already registered
Past event
User not found

## Cancel Registration

DELETE /api/events/:eventId/cancel

Request Body:

{
  "userId": "f6e1a4d6-2a6c-4b55-a6a9-64c45b6b831f"
}


Response:

{
  "message": "Registration cancelled successfully"
}

## List Upcoming Events

GET /api/events/upcoming

Response:

[
  {
    "id": "1",
    "title": "Event A",
    "event_datetime": "2025-12-10T09:00:00Z",
    "location": "Bangalore"
  },
  {
    "id": "2",
    "title": "Event B",
    "event_datetime": "2025-12-10T09:00:00Z",
    "location": "Chennai"
  }
]

## Event Stats

GET /api/events/:eventId/stats

Response:

{
  "event_id": "b51a673f-833f-4d9b-a128-5ea54d6d1ac3",
  "total_registrations": 120,
  "remaining_capacity": 380,
  "percentage_used": "24.00%"
}

# Business Rules
Capacity is limited between 1 and 1000
Duplicate registrations are not allowed
Cannot register for past events
All input data is validated
Meaningful HTTP status codes and error messages are returned

# Future Improvements
JWT-based authentication
Transactions for concurrent registrations
Pagination for event listings
Unit and integration tests
