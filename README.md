 🧭 Campus Navigation System

### 🚀 Full-Stack Web Application (React.js + Node.js + Express + MongoDB)

A **smart campus navigation system** that helps users find optimal routes within a college campus — complete with **GPS integration, real-time heatmaps, admin management, and authentication**.


Built with scalability, performance, and modern design principles in mind.
## 🧩 Overview

This project provides an interactive web-based **campus map** that allows:
- 🧍 **Users** (students/visitors) to find the shortest route between buildings.
- 🧑‍💼 **Admins** to manage map data (nodes, paths, buildings) and simulate conditions.
- 🔐 **Secure authentication** system with role-based access control (Admin/User).
- 🗺️ **Real-time GPS tracking** and map heatmaps for visual analytics.

It behaves very similar to **Google Maps**, but optimized for **closed environments** like university campuses.

---

## ✨ Features

### 🔑 Authentication & Authorization
- JWT-based login/register system.
- Role-based access control (`admin`, `user`).
- Protected routes on both client and server.
- First-time registration lockout after admin creation.

### 🧭 Campus Map
- Interactive campus map using **React Leaflet**.
- Nodes (buildings/locations) and edges (paths) dynamically loaded from the backend.
- Route visualization using **Dijkstra’s shortest path algorithm**.
- Dynamic **heatmap** visualization for path congestion.

### 📍 GPS Integration
- Uses device geolocation to simulate “current location”.
- Automatically finds nearest node or edge and routes from there.
- Live tracking toggle (`Track`, `Follow`, `Center`) for movement simulation.

### 🧰 Admin Dashboard
- Add/edit/delete **Nodes** and **Edges** visually.
- Toggle edges as “blocked” (for testing or maintenance).
- View live simulation of route traffic.
- Heatmap to visualize path congestion.
- Integrated **Edge/Node editing modals** with clean UI.

### 🧑‍💻 User Page
- Simple interface for normal users:
  - Select destination and start route.
  - View route details (distance, waypoints, coordinates).
  - Toggle GPS tracking and heatmap.
- Securely separated from admin functionalities.

### 🧠 Algorithm
- Shortest path determined via **Dijkstra’s Algorithm** implemented server-side.
- Supports:
  - Bidirectional edges.
  - Blocked path avoidance.
  - Distance-based weighting.
  - Snapping GPS coordinates to nearest node or path projection.

### 🔐 Security & Hardening
- Uses `helmet` for secure HTTP headers.
- Rate limiting on auth routes (via `express-rate-limit`).
- Input validation & sanitization for all endpoints.
- JWT expiry + 401 for invalid tokens.
- HTTPS ready for production deployment.
- `.env` protected and replaced with `.env.example`.

---

## 🏗️ Tech Stack

| Layer | Technology Used |
|-------|------------------|
| Frontend | React.js, Vite, Tailwind CSS, Leaflet.js |
| Backend | Node.js, Express.js |
| Database | MongoDB (Atlas) |
| Auth | JWT (JSON Web Token) |
| Map Rendering | React Leaflet + OpenStreetMap |
| Deployment | Render (Backend) + Vercel/Netlify (Frontend) |

---

## 🧱 Folder Structure

campus_navigation/
├── campus-navigation-frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── context/
│ │ ├── pages/
│ │ ├── lib/
│ │ └── styles/
│ ├── public/
│ ├── package.json
│ └── vite.config.js
│
└── campus-navigation-backend/
├── src/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── services/
│ ├── config/
│ ├── app.js
│ └── server.js
├── package.json
└── .env.example

yaml
Copy code

---

Deployment:
 Live Frontend: https://campus-navigation-2edm.onrender.com
 Backend API:https://campus-navigation-backend-4h26.onrender.com

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/campus-navigation.git
cd campus-navigation
2️⃣ Setup the Backend
bash
Copy code
cd campus-navigation-backend
npm install
Create your .env file using .env.example as reference:

bash
Copy code
MONGODB_URI=your_mongodb_uri_here
PORT=3000
NODE_ENV=production
DB_NAME=campus_navigation
JWT_SECRET=your_strong_jwt_secret_here
Start the backend server:

bash
Copy code
npm start
3️⃣ Setup the Frontend
bash
Copy code
cd ../campus-navigation-frontend
npm install
npm run dev
The frontend will start on http://localhost:5173
and automatically connect to your backend.

🔒 Environment Variables (.env.example)
bash
Copy code
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/
PORT=3000
NODE_ENV=development
DB_NAME=campus_navigation
JWT_SECRET=super_secret_jwt_key_here
