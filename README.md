# Quantify Trading Platform

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=for-the-badge&logo=spring-boot" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-4169E1?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/LLaMA_3-Ollama-FF6B6B?style=for-the-badge" />
</div>

<p align="center">
  <strong>AI-Powered Quantitative Trading Platform</strong><br>
  Your personal trading assistant that learns your style and helps you make smarter decisions.
</p>

---

## ✨ Features

### 📊 Portfolio Management
- Track your stock holdings with real-time prices
- View invested value, current value, and P&L
- Automatic price updates from Yahoo Finance

### 📈 Trade Logging
- Log BUY/SELL trades with sentiment tracking
- Track win rate and trading statistics
- Analyze trading patterns over time

### 🤖 AI Trading Assistant
- Personalized advice based on YOUR trading history
- Analyzes your risk profile and patterns
- Powered by LLaMA 3 via Ollama

### 📱 Market Watch
- Live NSE stock prices
- Top gainers and losers
- Auto-refresh every 30 seconds

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Redux Toolkit, TailwindCSS |
| **Backend** | Spring Boot 3.2, Java 17 |
| **Database** | PostgreSQL (H2 for dev) |
| **AI Engine** | LLaMA 3 via Ollama |
| **Market Data** | Yahoo Finance API |
| **Auth** | JWT + Spring Security |

---

## 🚀 Quick Start

### Prerequisites
- Java 17+ (`brew install openjdk@17` or `sudo apt install openjdk-17-jdk`)
- Node.js 18+ (`brew install node` or via nvm)
- Ollama (optional, for AI): `curl -fsSL https://ollama.com/install.sh | sh`

### 1. Clone & Setup

```bash
git clone <your-repo>
cd quantify_trading_platform
```

### 2. Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend starts at `http://localhost:8080` with H2 in-memory database.

**Demo credentials**: `demo@trading.com` / `demo123`

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at `http://localhost:5173`

### 4. Start AI (Optional)

```bash
ollama pull llama3
ollama serve
```

Ollama runs at `http://localhost:11434`

---

## 🐳 Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up -d
```

---

## 📁 Project Structure

```
quantify_trading_platform/
├── backend/                    # Spring Boot API
│   ├── src/main/java/com/quantify/
│   │   ├── config/            # Security, Redis, WebSocket
│   │   ├── controller/        # REST endpoints
│   │   ├── model/             # JPA entities
│   │   ├── repository/        # Data access
│   │   ├── security/          # JWT auth
│   │   └── service/           # Business logic
│   ├── pom.xml
│   └── Dockerfile
│
└── frontend/                   # React SPA
    ├── src/
    │   ├── components/        # Layout, ProtectedRoute
    │   ├── pages/             # Dashboard, Portfolio, etc.
    │   ├── services/          # API clients
    │   └── store/             # Redux slices
    ├── package.json
    └── vercel.json
```

---

## 🔌 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | No | Create account |
| `/api/auth/login` | POST | No | Login |
| `/api/portfolio` | GET | Yes | Get holdings |
| `/api/portfolio` | POST | Yes | Add holding |
| `/api/trades` | GET | Yes | Trade history |
| `/api/trades` | POST | Yes | Log trade |
| `/api/chat` | POST | Yes | AI chat |
| `/api/market` | GET | No | Market data |

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy to Vercel
vercel --prod
```

Set environment variable:
- `VITE_API_URL` = Your backend URL

### Backend → Render

1. Connect your GitHub repo to Render
2. Select Docker environment
3. Set environment variables:
   - `DATABASE_URL` (from Render PostgreSQL)
   - `JWT_SECRET` (generate secure key)
   - `CORS_ORIGINS` (your frontend URL)
   - `OLLAMA_BASE_URL` (if using external Ollama)

---

## ⚙️ Environment Variables

### Backend

```env
DATABASE_URL=jdbc:postgresql://localhost:5432/quantify
JWT_SECRET=your-secure-jwt-secret-key
CORS_ORIGINS=http://localhost:5173
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### Frontend

```env
VITE_API_URL=http://localhost:8080
```

---

## 🎯 Key Features Explained

### AI Personalization

The AI assistant analyzes:
- **Trading history** (last 90 days)
- **Win rate** and P&L trends
- **Risk profile** (Conservative/Moderate/Aggressive)
- **Top traded symbols**
- **Portfolio composition**

This context is sent with every chat message to provide personalized advice.

### Market Data

- Fetches real-time data from Yahoo Finance
- 15 major NSE stocks tracked
- Automatic caching to prevent rate limiting
- Falls back to simulated data if API fails

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Team

- **B Vishnu Vardhan** (22U61A0510)
- **S Ramana** (22U61A0543)
- **O Karthik** (22U61A0533)
- **P Sai Kumar Goud** (22U61A0515)

**Guide**: Mrs. Lakshmi Lavanya  
**HOD**: Mrs. Noore Ilahi

---

<p align="center">
  Made with ❤️ for smarter trading
</p>
