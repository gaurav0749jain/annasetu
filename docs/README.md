# 🍱 AnnaSetu — Food Waste Management Platform

> **"Anna" (food) + "Setu" (bridge)** — Bridging surplus food with genuine need across India

A full-stack MERN application that connects food donors (households, restaurants, wedding/party organizers) with receivers (NGOs, shelters) via volunteers, powered by real-time communication and Gemini AI.

---

## 🚀 Live Demo

- **Frontend:** https://annasetu.vercel.app
- **Backend API:** https://annasetu-api.onrender.com
- **GitHub:** https://github.com/gaurav0749jain/annasetu

---

## ✨ Features

### Core Features

- 🔐 JWT Authentication with Email OTP verification
- 👥 4 User Roles — Donor, Receiver (NGO), Volunteer, Admin
- 🍱 Food Listings — Create, browse, filter, claim, delete
- 🎉 Event Listings — Special form for weddings, parties, functions
- 📦 Pickup Workflow — 5-stage lifecycle with real-time tracking
- 🗺️ Interactive Map — Leaflet + OpenStreetMap, no API key needed
- 💬 3-way Real-time Chat — Donor ↔ Receiver ↔ Volunteer
- 🔔 Live Notifications — Socket.io powered instant alerts
- 📸 Image Upload — Cloudinary CDN storage

### AI Features (Gemini 2.5 Flash — Free)

- ✨ Listing Auto-fill — AI generates description from food name
- 📸 Image Recognition — Detects food type, quantity, freshness
- 🛡️ Food Safety Predictor — Estimates safe consumption window
- 🎯 Smart Matching — AI ranks best receivers for each listing
- 💬 AI Chatbot — In-app assistant for all user roles
- 📊 Impact Report — Personalized monthly impact story

### Dashboards

- Donor Dashboard — My listings, confirm/reject claims, AI report
- Receiver Dashboard — Claims, status tracker, map shortcut
- Volunteer Dashboard — Available pickups, start/deliver buttons
- Admin Panel — Analytics, user management, Recharts charts

---

## 🛠️ Tech Stack

| Layer           | Technology                                 |
| --------------- | ------------------------------------------ |
| Frontend        | React (Vite) + Tailwind CSS + React Router |
| Maps            | Leaflet + React-Leaflet + OpenStreetMap    |
| Real-time       | Socket.io                                  |
| Backend         | Node.js + Express                          |
| Database        | MongoDB (Mongoose)                         |
| Auth            | JWT + bcrypt                               |
| AI              | Google Gemini 2.5 Flash API                |
| File Upload     | Multer + Cloudinary                        |
| Email           | Nodemailer + Gmail SMTP                    |
| Frontend Deploy | Vercel (free)                              |
| Backend Deploy  | Render (free)                              |

---

## 📦 Installation & Setup

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (free)
- Cloudinary account (free)
- Google AI Studio API key (free)
- Gmail account with App Password

### 1. Clone the repository

```bash
git clone https://github.com/gaurav0749jain/annasetu.git
cd annasetu
```

### 2. Backend setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

```bash
npm run dev
```

### 3. Frontend setup

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`

---

## 👤 Test Accounts (create these to test)

| Role      | How to register                                               |
| --------- | ------------------------------------------------------------- |
| Donor     | Register → Select "Donor" → Any donor type                    |
| Receiver  | Register → Select "Receiver" → Set isApproved:true in MongoDB |
| Volunteer | Register → Select "Volunteer"                                 |
| Admin     | Set role:"admin" in MongoDB directly                          |

---

## 🌐 API Endpoints

| Method | Endpoint                | Description           |
| ------ | ----------------------- | --------------------- |
| POST   | /api/auth/register      | Register new user     |
| POST   | /api/auth/verify-otp    | Verify email OTP      |
| POST   | /api/auth/login         | Login                 |
| GET    | /api/auth/me            | Get current user      |
| GET    | /api/listings           | Browse listings       |
| POST   | /api/listings           | Create listing        |
| PUT    | /api/listings/:id/claim | Claim a listing       |
| GET    | /api/listings/nearby    | Nearby listings (geo) |
| GET    | /api/pickups/my         | My pickups            |
| PUT    | /api/pickups/:id/status | Update pickup status  |
| GET    | /api/messages/:roomId   | Get chat messages     |
| POST   | /api/ai/autofill        | AI listing auto-fill  |
| POST   | /api/ai/analyze-image   | AI image recognition  |
| POST   | /api/ai/safety          | Food safety check     |
| POST   | /api/ai/chat            | AI chatbot            |
| GET    | /api/ai/report          | Monthly impact report |
| GET    | /api/admin/stats        | Platform analytics    |

---

## 📱 Pages

| Route           | Page           | Access     |
| --------------- | -------------- | ---------- |
| /               | Home           | Public     |
| /listings       | Browse Food    | Public     |
| /map            | Map View       | Public     |
| /leaderboard    | Top Donors     | Public     |
| /food-safety    | Safety Checker | Public     |
| /register       | Register       | Public     |
| /login          | Login          | Public     |
| /dashboard      | Dashboard      | Protected  |
| /create-listing | Create Listing | Donor only |
| /chat/:roomId   | Chat           | Protected  |
| /profile        | Profile        | Protected  |
| /admin          | Admin Panel    | Admin only |

---

## 👨‍💻 Team

Built as a college project demonstrating full-stack development with:

- MERN Stack (MongoDB, Express, React, Node.js)
- Real-time features (Socket.io)
- AI Integration (Google Gemini)
- Cloud services (Cloudinary, MongoDB Atlas)
- Free deployment (Vercel + Render)

---

## 📄 License

MIT License — Free to use for educational purposes.

---

_Made with ❤️ for a waste-free India 🇮🇳_
