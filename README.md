# 🎬 Movie API

A RESTful API built with **Node.js**, **Express.js**, and **MongoDB** that allows users to access information about movies, directors, and genres. Users can register, update their profiles, and manage their list of favorite movies.

---

## 📌 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## 📖 Overview

This API powers a full-stack movie application. It serves JSON data over HTTP and interacts with a MongoDB database. It supports:

- User authentication & authorization
- Full CRUD for user profiles
- Retrieval of movie, director, and genre data
- Secure password hashing and validation

---

## 🧰 Tech Stack

- Node.js
- Express.js
- MongoDB (with Mongoose ODM)
- JSON Web Tokens (JWT) for auth
- bcrypt for password hashing
- CORS middleware
- Morgan for logging
- Postman for testing

---

## 🚀 Features

- Public routes to fetch all movies, directors, and genres
- Authenticated routes for:
  - Creating/updating/deleting a user
  - Adding/removing movies from favorites
- Token-based user authentication using JWT
- Secure password hashing with bcrypt
- Structured route architecture
- Modular controllers and middleware

---

## 📡 API Endpoints

> All endpoints return JSON.

### Public Routes

| Method | Endpoint           | Description                   |
| ------ | ------------------ | ----------------------------- |
| GET    | `/movies`          | Returns list of all movies    |
| GET    | `/movies/:title`   | Returns movie by title        |
| GET    | `/genres/:name`    | Returns genre info by name    |
| GET    | `/directors/:name` | Returns director info by name |

### Authenticated Routes

| Method | Endpoint                      | Description                 |
| ------ | ----------------------------- | --------------------------- |
| POST   | `/users/register`             | Register new user           |
| POST   | `/login`                      | Login and return JWT        |
| GET    | `/users/:username`            | Get user details            |
| PUT    | `/users/:username`            | Update user profile         |
| POST   | `/users/:username/movies/:id` | Add movie to favorites      |
| DELETE | `/users/:username/movies/:id` | Remove movie from favorites |
| DELETE | `/users/:username`            | Delete user account         |

---

## 📦 Getting Started

# Clone the repo

git clone https://github.com/darunbjork/movie_api.git
cd movie_api

# Install dependencies

npm install

# Start development server

npm run dev
🔐 Environment Variables

Create a .env file with the following keys:

PORT=3000
DB_URI=mongodb://localhost:27017/moviesdb
JWT_SECRET=yourSuperSecretKey
🧪 Testing

Use Postman to test endpoints locally.

Include the JWT in the Authorization header as Bearer TOKEN
Example test cases:
Register a new user
Login to receive token
Get all movies
Add a movie to favorites
🚀 Deployment

You can deploy to:

Render
Heroku
Railway
Example deploy command for Heroku:

heroku create movie-api-darun
heroku config:set JWT_SECRET=yourSuperSecretKey
git push heroku main
🤝 Contributing

Contributions are welcome!

Fork the repo
Create a feature branch: git checkout -b feature/your-feature
Commit changes: git commit -m 'feat: your feature'
Push to branch: git push origin feature/your-feature
Open a pull request
📄 License

MIT License

📬 Contact

Author: Darun Bjork
GitHub: @darunbjork
LinkedIn: Darun on LinkedIn
