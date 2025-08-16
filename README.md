# Vehicle Booking System

A full-stack web application for managing vehicle bookings with real-time tracking capabilities.

## Features

- User authentication (login/register)
- Real-time vehicle tracking
- Interactive map interface using Leaflet
- Booking management
- Vehicle and driver management
- Responsive design

## Tech Stack

### Frontend
- React 19
- React Router v7
- Vite (Build tool)
- Axios (HTTP client)
- React Leaflet (Maps)
- Socket.IO Client (Real-time updates)

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose ODM)
- Socket.IO (Real-time communication)
- JWT (Authentication)
- Bcrypt (Password hashing)

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd booking-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `booking-backend` directory and add your environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=5000
   ```

4. Seed the database (optional):
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd booking
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
web_major/
├── booking/                  # Frontend (React)
│   ├── public/
│   ├── src/
│   │   ├── assets/          # Static assets
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React context providers
│   │   └── ...
│   └── package.json
│
└── booking-backend/          # Backend (Node.js/Express)
    ├── src/
    │   ├── controllers/     # Route controllers
    │   ├── models/         # Database models
    │   ├── routes/         # API routes
    │   ├── middleware/     # Express middleware
    │   ├── seed.js         # Database seeder
    │   └── index.js        # Entry point
    └── package.json
```

## Available Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run seed` - Seed the database with sample data

## Environment Variables

### Backend
- `PORT` - Port to run the server on (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret for JWT token signing

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


