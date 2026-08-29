# AgriRoute — Intelligence Platform

AgriRoute is an integrated agricultural intelligence and micro-logistics platform designed to connect **Farmers**, **Commercial Buyers**, and **Rural Transporters** in a synchronized ecosystem.

---

## 🏗️ Architecture Overview

```
Frontend (React 19 + TypeScript + Vite + TailwindCSS v4)
         │
         ▼ (HTTP REST)
Backend (Node.js + Express 5 + TypeScript + TSX)
         │
         ▼ (Prisma ORM 6)
Database (PostgreSQL)
```

---

## 📁 Project Structure

```
SIH-MicroLogistics/
├── src/                         # React Frontend (Phases 1–3C)
│   ├── components/              # Shared & dashboard components
│   ├── context/                 # SharedContext (Global state & sync)
│   ├── data/                    # Mock data & types
│   ├── pages/                   # Role dashboards & workflows
│   │   ├── auth/                # Role authentications
│   │   └── dashboards/          # Farmer, Buyer, Transporter pages
│   ├── App.tsx                  # Application routing
│   └── main.tsx                 # Frontend entry point
├── server/                      # Express Backend (Phase 4A)
│   ├── src/
│   │   ├── config/              # Environment (env.ts) & Prisma (prisma.ts)
│   │   ├── middleware/          # Logger, 404 handler, Error handler
│   │   ├── modules/             # Health check & future domain modules
│   │   ├── routes/              # Central API router (/api)
│   │   ├── utils/               # Standardized response formatters
│   │   ├── app.ts               # Express application configuration
│   │   └── server.ts            # Server entry point & lifecycle
│   └── tsconfig.json            # Server TypeScript configuration
├── prisma/
│   └── schema.prisma            # Prisma schema (PostgreSQL + User/Role)
├── .env.example                 # Template for environment configuration
├── package.json                 # Unified npm workspace scripts
└── README.md
```

---

## 🚀 Getting Started

### 1. Environment Setup
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```

Configure your local settings in `.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ruralflow_db?schema=public"
```

### 2. Available Scripts

#### Frontend (React + Vite)
- `npm run dev`: Starts the Vite development server on `http://localhost:5173`.
- `npm run build`: Type-checks and builds the production frontend bundle into `dist/`.
- `npm run preview`: Previews the built frontend production bundle.
- `npm run lint`: Runs ESLint across all frontend and backend source files.

#### Backend (Express + TypeScript)
- `npm run server:dev`: Starts the Express development server with live watch mode on `http://localhost:5000`.
- `npm run server:build`: Compiles backend TypeScript files into `server/dist/`.
- `npm run server:start`: Runs the compiled backend server using Node.js.

#### Database & Prisma ORM
- `npm run prisma:validate`: Validates the Prisma schema.
- `npm run prisma:generate`: Generates the Prisma Client.
- `npm run prisma:migrate`: Runs Prisma migrations against the configured PostgreSQL database.
- `npm run prisma:studio`: Opens the Prisma Studio GUI for database exploration.

---

## 🩺 Backend Health Check Endpoint

- **Endpoint**: `GET /api/health`
- **Response**:
```json
{
  "success": true,
  "message": "RuralFlow API is running",
  "data": {
    "status": "healthy",
    "version": "1.0.0",
    "environment": "development",
    "database": {
      "connected": false,
      "message": "Can't reach database server at localhost:5432"
    },
    "uptime": 12.04
  },
  "timestamp": "2026-08-23T07:42:10.058Z"
}
```
*(Note: Database status reports connection availability gracefully without crashing the server if PostgreSQL is offline during development).*
