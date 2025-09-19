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
    subgraph "Frontend "
        A[Landing Component]
        B[Dashboard Component]
        C[Calculator Component]
        D[Portfolio Component]
        E[AI Assistant Component]
        F[Settings Component]
    end

    subgraph "Backend (Django)"
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

## Key Features

### 1. **Authentication System**
- Secure login/registration
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

## Technical Stack

### Frontend
- React with TypeScript
- Material-UI or Tailwind CSS
- Chart.js for visualization

### Backend
- Django with Python
- PostgreSQL database

### External Integrations
- TwelveData API for market data
- OpenAI API for explanations

