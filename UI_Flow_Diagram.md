# FinanceBuddy Options Price Calculator - UI Flow Diagram

## User Interface Flow

```mermaid
graph TD
    A[Landing Page] --> B{User Authenticated?}
    B -->|No| C[Login/Register]
    B -->|Yes| D[Dashboard]
    
    C --> E[Authentication]
    E --> D
    
    D --> F[Quick Calculator]
    D --> G[Recent Predictions]
    D --> H[Market Data]
    
    F --> I[Options Calculator Page]
    I --> J[Input Parameters]
    J --> K[Market Data Integration]
    K --> L[Black-Scholes Calculation]
    L --> M[Results Display]
    M --> N[Greeks Visualization]
    N --> O[Save Prediction]
    
    O --> P[Portfolio Page]
    P --> Q[Saved Predictions List]
    Q --> R[Filter/Search]
    Q --> S[Export Data]
    Q --> T[Delete Prediction]
    
    M --> U[AI Assistant]
    U --> V[Chat Interface]
    V --> W[OpenAI Integration]
    W --> X[Educational Explanations]
    
    D --> Y[Settings Page]
    Y --> Z[User Profile]
    Y --> AA[API Configuration]
    Y --> BB[Display Preferences]
    Y --> CC[Data Management]
    
    style A fill:#e1f5fe
    style D fill:#f3e5f5
    style I fill:#e8f5e8
    style U fill:#fff3e0
    style P fill:#fce4ec
    style Y fill:#f1f8e9
```

## Component Architecture

```mermaid
graph LR
    subgraph "Frontend (React)"
        A[Landing Component]
        B[Dashboard Component]
        C[Calculator Component]
        D[Portfolio Component]
        E[AI Assistant Component]
        F[Settings Component]
    end
    
    subgraph "Backend (Spring Boot)"
        G[Auth Controller]
        H[Calculator Controller]
        I[Portfolio Controller]
        J[AI Controller]
        K[Settings Controller]
    end
    
    subgraph "External APIs"
        L[TwelveData API]
        M[OpenAI API]
    end
    
    subgraph "Database"
        N[Users Table]
        O[Predictions Table]
        P[Settings Table]
    end
    
    A --> G
    B --> H
    C --> H
    D --> I
    E --> J
    F --> K
    
    H --> L
    J --> M
    
    G --> N
    I --> O
    K --> P
```

## Screen Layouts

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 FinanceBuddy    [Dashboard] [Calculator] [Portfolio] [Settings] │
├─────────────────────────────────────────────────────────────┤
│ Welcome back, [User Name]!                                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                QUICK CALCULATOR                         │ │
│ │                                                         │ │
│ │ Symbol: [AAPL____] [Get Market Data]                   │ │
│ │                                                         │ │
│ │ Spot: [189.45] Strike: [190.00] Time: [0.25] Vol: [0.25] │ │
│ │                                                         │ │
│ │ [Calculate] [Save] [Explain]                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                RECENT PREDICTIONS                      │ │
│ │                                                         │ │
│ │ AAPL Call 190.00  [View] [Delete]                       │ │
│ │ MSFT Put 300.00   [View] [Delete]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Calculator Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 FinanceBuddy    [Dashboard] [Calculator] [Portfolio] [Settings] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                INPUT PARAMETERS                        │ │
│ │                                                         │ │
│ │ Symbol: [AAPL____] [Get Market Data] [Auto-fill]        │ │
│ │                                                         │ │
│ │ Spot: [189.45] Strike: [190.00] Time: [0.25] Vol: [0.25] │ │
│ │ Risk-Free: [0.0425] Dividend: [0.00] Type: [Call ▼]     │ │
│ │                                                         │ │
│ │ [Calculate] [Save] [Reset]                              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                CALCULATION RESULTS                      │ │
│ │                                                         │ │
│ │ Price: $3.42    Delta: 0.57    Gamma: 0.041            │ │
│ │ Theta: -0.045   Vega: 0.13     Rho: 0.09               │ │
│ │                                                         │ │
│ │ [Save] [Export] [Explain with AI]                      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### AI Assistant Layout
```
┌─────────────────────────────────────────────────────────────┐
│ 🏠 FinanceBuddy    [Dashboard] [Calculator] [Portfolio] [Settings] │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                AI EXPLANATION ASSISTANT                │ │
│ │                                                         │ │
│ │ 🤖 AI: "This AAPL call option costs about $3.42.       │ │
│ │      Here's what that means:                            │ │
│ │                                                         │ │
│ │      • If AAPL goes up by $1, you'd gain about $0.57    │ │
│ │      • Each day that passes, you lose about $0.045     │ │
│ │      • If volatility increases, the option becomes      │ │
│ │        more valuable (Vega = 0.13)                     │ │
│ │                                                         │ │
│ │      This is educational information only, not          │ │
│ │      financial advice."                                 │ │
│ │                                                         │ │
│ │ [Type your question...] [Send]                         │ │
│ │                                                         │ │
│ │ [Clear Chat] [Export] [New Explanation]                │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Mobile Responsive Design

### Mobile Navigation
```
┌─────────────────────────────────────────────────────────────┐
│ ☰ FinanceBuddy                    [👤] [⚙️]              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                QUICK CALCULATOR                         │ │
│ │                                                         │ │
│ │ Symbol: [AAPL____] [Get Data]                           │ │
│ │                                                         │ │
│ │ Spot: [189.45]    Strike: [190.00]                     │ │
│ │ Time: [0.25]      Vol: [0.25]                          │ │
│ │                                                         │ │
│ │ [Calculate] [Save] [Explain]                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                RESULTS (Mobile Cards)                    │ │
│ │                                                         │ │
│ │ Price: $3.42    Delta: 0.57                             │ │
│ │ Gamma: 0.041    Theta: -0.045                           │ │
│ │                                                         │ │
│ │ [View Details] [Save] [Explain]                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. **Authentication System**
- Secure login/registration
- JWT token-based sessions
- Password reset functionality

### 2. **Options Calculator**
- Real-time market data integration
- Black-Scholes pricing model
- Greeks calculation
- Implied volatility calculation

### 3. **AI Assistant**
- OpenAI GPT integration
- Context-aware explanations
- Educational content
- Safety guardrails

### 4. **Portfolio Management**
- Save and organize predictions
- Export/import functionality
- Search and filter capabilities

### 5. **Responsive Design**
- Mobile-first approach
- Touch-friendly interfaces
- Progressive Web App capabilities

## Technical Stack

### Frontend
- React with TypeScript
- Material-UI or Tailwind CSS
- Chart.js for visualization
- Axios for API calls

### Backend
- Spring Boot with Java
- JWT authentication
- PostgreSQL database
- RESTful API endpoints

### External Integrations
- TwelveData API for market data
- OpenAI API for explanations
- Cloud hosting (AWS/Azure/GCP)
