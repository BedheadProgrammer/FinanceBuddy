# FinanceBuddy - Options Price Calculator

A comprehensive options pricing calculator with AI-powered explanations, built with React frontend and Spring Boot backend.

## Project Structure

```
FinanceBuddy/
├── backend/                          # Spring Boot Backend
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/financebuddy/
│   │   │   │   ├── controller/       # REST Controllers
│   │   │   │   ├── service/          # Business Logic
│   │   │   │   ├── repository/      # Data Access Layer
│   │   │   │   ├── model/           # Entity/DTO Classes
│   │   │   │   ├── config/          # Configuration Classes
│   │   │   │   ├── util/            # Utility Classes
│   │   │   │   └── security/        # Security Configuration
│   │   │   └── resources/
│   │   │       ├── application.yml  # Application Configuration
│   │   │       └── static/          # Static Resources
│   │   └── test/
│   │       └── java/com/financebuddy/
│   ├── pom.xml                      # Maven Dependencies
│   └── Dockerfile                   # Docker Configuration
├── frontend/                        # React Frontend
│   ├── src/
│   │   ├── components/              # Reusable UI Components
│   │   ├── pages/                  # Main Application Pages
│   │   ├── services/               # API Communication
│   │   ├── utils/                  # Helper Functions
│   │   ├── hooks/                  # Custom React Hooks
│   │   └── styles/                 # CSS/SCSS Files
│   ├── public/                     # Static Assets
│   ├── package.json                # Node Dependencies
│   └── Dockerfile                  # Docker Configuration
├── database/                       # Database Scripts
│   ├── migrations/                 # SQL Migration Files
│   └── seeds/                     # Initial Data
├── docs/                          # Documentation
│   ├── API.md                     # API Documentation
│   ├── DEPLOYMENT.md              # Deployment Guide
│   └── CONTRIBUTING.md            # Contribution Guidelines
├── docker-compose.yml              # Docker Compose Configuration
├── .gitignore                     # Git Ignore Rules
└── README.md                      # This File
```

## Features

### Core Functionality
- **Options Pricing**: Black-Scholes model implementation
- **Greeks Calculation**: Delta, Gamma, Theta, Vega, Rho
- **Market Data Integration**: Real-time stock prices and rates
- **AI Explanations**: OpenAI-powered educational content
- **Portfolio Management**: Save and organize predictions

### Technical Stack
- **Frontend**: React 18, TypeScript, Material-UI
- **Backend**: Spring Boot 3, Java 17, JPA/Hibernate
- **Database**: PostgreSQL
- **APIs**: TwelveData (Market Data), OpenAI (AI Assistant)
- **Authentication**: JWT tokens
- **Deployment**: Docker, Cloud hosting

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Backend Setup
```bash
cd backend
./mvnw spring-boot:run
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
```bash
# Create database
createdb financebuddy

# Run migrations
./mvnw flyway:migrate
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

## Development

### Backend Development
- Use Spring Boot DevTools for hot reload
- Configure application.yml for local development
- Run tests with `./mvnw test`

### Frontend Development
- Use React development server
- Configure API endpoints in services
- Run tests with `npm test`

## Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Deployment
1. Build backend: `./mvnw clean package`
2. Build frontend: `npm run build`
3. Deploy to cloud platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Team

- Andrew Cart
- Taylor Clemmons  
- Shruti Pallissery
- Md Ubayeid Ullah
