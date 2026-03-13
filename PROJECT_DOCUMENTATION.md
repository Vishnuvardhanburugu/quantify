# Quantify Trading Platform - Project Documentation

## 🚀 Overview
**Quantify** is an AI-powered quantitative trading platform designed to help retail traders track their performance, analyze their trading psychology, and make data-driven decisions. Unlike traditional platforms, Quantify integrates a local LLM (LLaMA 3) to provide personalized insights based on your actual trading history.

---

## 🛠️ Key Functionalities

### 1. 📊 Smart Dashboard
The command center of your trading activity.
- **Real-time Stats**: Track total portfolio value, invested amount, and current P&L.
- **Performance Metrics**: View your "Win Rate" calculated from historical trades.
- **Market Movers**: Instant view of NSE Top Gainers and Losers.
- **AI Sidebar**: Quick access to AI-generated trading nudges.

### 2. 📁 Portfolio Management
A comprehensive view of your long-term and short-term holdings.
- **Real-time Tracking**: Stock prices are automatically updated using Yahoo Finance API.
- **P&L Breakdown**: individual profit/loss tracking for every stock in your portfolio.
- **Sector Analysis**: Visualization of how your money is distributed across different sectors (IT, Banking, etc.).

### 3. 📈 Trade Journaling
Log every move to understand your trading behavior.
- **Trade Logging**: Supports BUY and SELL orders with entry price and quantity.
- **Sentiment Tracking**: Record your "Sentiment" (Bullish/Bearish) for every trade to identify emotional patterns.
- **Historical Analysis**: Full history of executed trades with timestamped P&L records.

### 4. 🤖 AI Trading Assistant (Quantify AI)
A personalized AI mentor powered by **Ollama (LLaMA 3)**.
- **Personalized Context**: The AI knows your portfolio, your win rate, and your risk appetite.
- **Pattern Detection**: Alerts you if it detects "Panic Selling" (selling at a loss frequently) or "Over-trading" (too many trades in a week).
- **Risk Profiling**: Provides advice tailored to your profile (Conservative, Moderate, Aggressive).
- **Local & Private**: All AI processing happens on your machine via Ollama.

### 5. 📱 Live Market Watch
Keep an eye on the pulse of the Indian Market.
- **NSE Live Prices**: Real-time data for major indices and stocks.
- **Auto-Refresh**: Data refreshes every 30 seconds to keep you updated during market hours.

### 6. 🔐 Secure Authentication
- **JWT-based Security**: Industrial-standard token-based authentication.
- **Profile Persistence**: Your data is securely stored and uniquely associated with your account.

---

## 👤 "Zerodha Console" Inspired Profile Concept

To enhance the professional feel of the platform, we propose a **Profile & Console** section inspired by Zerodha's clean and data-centric design.

### 📍 Concept: The Quantify "Console"
Similar to Zerodha's back-office, this section would serve as the "Account Management" hub.

#### **1. Account Overview (The "Funds" View)**
- **Equity Segment**: Total balance, available margin, and used margin.
- **Commodity/Derivative Segments**: Separate toggles to view segment-specific capital.
- **Bank Accounts**: Linked bank details for seamless (simulated) fund transfers.

#### **2. User Profile (The "Personal" View)**
- **Personal Details**: Name, Email, Mobile, and **PAN Number** (masked).
- **Demat ID**: Your unique 16-digit BO ID for transparency.
- **Nominee Management**: Ability to see/add nominees to the account.

#### **3. Security & Settings**
- **2FA / App Code**: Integration of a Time-based One Time Password (TOTP) setting.
- **Active Sessions**: View and revoke access from other devices/locations.
- **Theme Settings**: Toggle between "Quantify Dark" and "Clean White" modes.

#### **4. The "Nudge" System (Powered by AI)**
- **Zerodha-style Warnings**: Just as Zerodha warns about illiquid stocks, Quantify AI will "Nudge" you inside the trade form if a trade deviates too far from your established risk profile.

---

## 🏗️ Technical Architecture
- **Backend**: Spring Boot 3.2, Java 17, JPA/Hibernate.
- **Frontend**: React 18, Redux Toolkit (State Management), TailwindCSS (Styling).
- **AI Engine**: Ollama (LLaMA 3) via REST API.
- **Data Source**: Yahoo Finance (Live Stock Prices).
- **Database**: PostgreSQL (Production) / H2 (Development).

---

## 📈 Future Roadmap
1. **Backtesting Engine**: Allow users to test strategies against 5-year historical data.
2. **Webhooks**: Integration with TradingView for automated trade logging.
3. **Tax P&L Reports**: One-click download of tax-ready profit and loss statements.
