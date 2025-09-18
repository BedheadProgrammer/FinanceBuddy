# FinanceBuddy Project Structure

## Overview
This document outlines the complete project structure for the FinanceBuddy Options Price Calculator application.

## Directory Structure

```
FinanceBuddy/
├── backend/                          # Spring Boot Backend Application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/financebuddy/
│   │   │   │   ├── controller/       # REST API Controllers
│   │   │   │   │   ├── AuthController.java
│   │   │   │   │   ├── CalculatorController.java
│   │   │   │   │   ├── MarketDataController.java
│   │   │   │   │   ├── PortfolioController.java
│   │   │   │   │   └── AIController.java
│   │   │   │   ├── service/          # Business Logic Services
│   │   │   │   │   ├── AuthService.java
│   │   │   │   │   ├── CalculatorService.java
│   │   │   │   │   ├── MarketDataService.java
│   │   │   │   │   ├── PortfolioService.java
│   │   │   │   │   └── AIService.java
│   │   │   │   ├── repository/       # Data Access Layer
│   │   │   │   │   ├── UserRepository.java
│   │   │   │   │   └── PredictionRunRepository.java
│   │   │   │   ├── model/            # Entity and DTO Classes
│   │   │   │   │   ├── User.java
│   │   │   │   │   ├── PredictionRun.java
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── LoginRequest.java
│   │   │   │   │   │   ├── RegisterRequest.java
│   │   │   │   │   │   ├── CalculationRequest.java
│   │   │   │   │   │   └── CalculationResponse.java
│   │   │   │   ├── config/           # Configuration Classes
│   │   │   │   │   ├── SecurityConfig.java
│   │   │   │   │   ├── JwtConfig.java
│   │   │   │   │   └── WebConfig.java
│   │   │   │   ├── util/             # Utility Classes
│   │   │   │   │   ├── JwtUtil.java
│   │   │   │   │   ├── BlackScholesCalculator.java
│   │   │   │   │   └── GreeksCalculator.java
│   │   │   │   └── security/         # Security Components
│   │   │   │       ├── JwtAuthenticationFilter.java
│   │   │   │       └── JwtAuthenticationEntryPoint.java
│   │   │   └── resources/
│   │   │       ├── application.yml   # Application Configuration
│   │   │       └── db/migration/     # Database Migration Scripts
│   │   └── test/
│   │       └── java/com/financebuddy/
│   │           ├── controller/       # Controller Tests
│   │           ├── service/         # Service Tests
│   │           └── integration/      # Integration Tests
│   ├── pom.xml                      # Maven Dependencies
│   └── Dockerfile                   # Docker Configuration
├── frontend/                        # React Frontend Application
│   ├── src/
│   │   ├── components/              # Reusable UI Components
│   │   │   ├── common/              # Common Components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── LoadingSpinner.tsx
│   │   │   ├── calculator/          # Calculator Components
│   │   │   │   ├── CalculatorForm.tsx
│   │   │   │   ├── ResultsDisplay.tsx
│   │   │   │   ├── GreeksChart.tsx
│   │   │   │   └── MarketDataInput.tsx
│   │   │   ├── portfolio/           # Portfolio Components
│   │   │   │   ├── PredictionList.tsx
│   │   │   │   ├── PredictionCard.tsx
│   │   │   │   └── FilterControls.tsx
│   │   │   └── ai/                  # AI Assistant Components
│   │   │       ├── ChatInterface.tsx
│   │   │       ├── MessageBubble.tsx
│   │   │       └── ExplanationCard.tsx
│   │   ├── pages/                   # Main Application Pages
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CalculatorPage.tsx
│   │   │   ├── PortfolioPage.tsx
│   │   │   ├── AIPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── services/                # API Communication
│   │   │   ├── api.ts               # Base API Configuration
│   │   │   ├── authService.ts       # Authentication API
│   │   │   ├── calculatorService.ts # Calculator API
│   │   │   ├── marketDataService.ts # Market Data API
│   │   │   ├── portfolioService.ts  # Portfolio API
│   │   │   └── aiService.ts         # AI Assistant API
│   │   ├── hooks/                   # Custom React Hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useCalculator.ts
│   │   │   ├── usePortfolio.ts
│   │   │   └── useAI.ts
│   │   ├── utils/                   # Helper Functions
│   │   │   ├── constants.ts
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── calculations.ts
│   │   ├── styles/                  # CSS/SCSS Files
│   │   │   ├── globals.css
│   │   │   ├── components.css
│   │   │   └── themes.css
│   │   ├── types/                   # TypeScript Type Definitions
│   │   │   ├── auth.ts
│   │   │   ├── calculator.ts
│   │   │   ├── portfolio.ts
│   │   │   └── api.ts
│   │   ├── App.tsx                   # Main App Component
│   │   ├── index.tsx                # Application Entry Point
│   │   └── router.tsx               # Routing Configuration
│   ├── public/                      # Static Assets
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── package.json                 # Node Dependencies
│   ├── tsconfig.json               # TypeScript Configuration
│   └── Dockerfile                  # Docker Configuration
├── database/                        # Database Scripts and Migrations
│   ├── migrations/                 # SQL Migration Files
│   │   ├── V1__Create_users_table.sql
│   │   ├── V2__Create_prediction_runs_table.sql
│   │   └── V3__Create_audit_logs_table.sql
│   └── seeds/                      # Initial Data Scripts
│       └── initial_data.sql
├── docs/                           # Documentation
│   ├── API.md                      # API Documentation
│   ├── DEPLOYMENT.md               # Deployment Guide
│   ├── CONTRIBUTING.md             # Contribution Guidelines
│   └── ARCHITECTURE.md             # System Architecture
├── scripts/                        # Build and Deployment Scripts
│   ├── build.sh                    # Build Script
│   ├── deploy.sh                   # Deployment Script
│   └── setup.sh                    # Setup Script
├── docker-compose.yml              # Docker Compose Configuration
├── .gitignore                      # Git Ignore Rules
├── .env.example                    # Environment Variables Example
└── README.md                       # Project Documentation
```

## Key Components

### Backend (Spring Boot)
- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic
- **Repositories**: Data access layer with JPA
- **Models**: Entity classes and DTOs
- **Security**: JWT authentication and authorization
- **Configuration**: Application and database settings

### Frontend (React)
- **Components**: Reusable UI components organized by feature
- **Pages**: Main application pages and routing
- **Services**: API communication layer
- **Hooks**: Custom React hooks for state management
- **Utils**: Helper functions and utilities
- **Types**: TypeScript type definitions

### Database
- **Migrations**: Version-controlled database schema changes
- **Seeds**: Initial data for development and testing
- **Indexes**: Performance optimization for queries

## Development Workflow

### 1. Backend Development
```bash
cd backend
./mvnw spring-boot:run
```

### 2. Frontend Development
```bash
cd frontend
npm install
npm start
```

### 3. Database Setup
```bash
# Create database
createdb financebuddy

# Run migrations
./mvnw flyway:migrate
```

### 4. Docker Development
```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### Calculator
- `POST /api/calculator/price` - Calculate option price
- `GET /api/calculator/greeks` - Get Greeks for option

### Market Data
- `GET /api/market/price/{symbol}` - Get current stock price
- `GET /api/market/rates` - Get risk-free rates

### Portfolio
- `GET /api/portfolio/predictions` - Get user predictions
- `POST /api/portfolio/save` - Save prediction
- `DELETE /api/portfolio/{id}` - Delete prediction

### AI Assistant
- `POST /api/ai/explain` - Get AI explanation
- `POST /api/ai/chat` - Chat with AI assistant

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: PostgreSQL 15
- **Security**: Spring Security + JWT
- **Build Tool**: Maven
- **Testing**: JUnit 5, Mockito

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **UI Library**: Material-UI
- **State Management**: React Query
- **Charts**: Chart.js
- **Build Tool**: Create React App

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Database Migrations**: Flyway
- **Version Control**: Git

## Next Steps

1. **Implement Core Services**: Start with CalculatorService and MarketDataService
2. **Create API Controllers**: Build REST endpoints for all features
3. **Develop Frontend Components**: Build React components for UI
4. **Add Authentication**: Implement JWT-based auth system
5. **Integrate External APIs**: Connect to TwelveData and OpenAI
6. **Add Testing**: Write unit and integration tests
7. **Deploy**: Set up production deployment pipeline
