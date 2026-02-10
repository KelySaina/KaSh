# KaSh - Money Management App

A comprehensive money management application with OAuth 2.0 authentication via Konnect Service.

## Features

- 💰 **Multi-Account Management** - Track multiple bank accounts, cash, credit cards
- 📊 **Income & Expense Tracking** - Record all transactions with categories
- 🎯 **Budget Planning** - Set monthly budgets and track spending
- 🔄 **Recurring Transactions** - Automate recurring income/expenses
- 📈 **Reports & Analytics** - Visualize spending patterns and trends
- 🏷️ **Categories & Tags** - Organize transactions efficiently
- 🔐 **Secure Authentication** - OAuth 2.0 via Konnect Service

## Tech Stack

- **Backend**: Node.js, Express, MySQL
- **Frontend**: React, React Router, Recharts
- **Authentication**: OAuth 2.0 (Konnect Service)
- **Database**: MySQL 8.0

## Quick Start

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Update `.env` with your Konnect Service credentials.

### 3. Setup Database

```bash
# Run migrations
npm run migrate

# Seed sample data (optional)
npm run seed
```

### 4. Register App with Konnect Service

1. Go to http://localhost:3000/admin
2. Create OAuth client with:
   - Name: KaSh Money Management
   - Redirect URI: http://localhost:4000/auth/callback
3. Copy client_id and client_secret to `.env`

### 5. Start Development

```bash
# Start both backend and frontend
npm run dev

# Or separately:
npm run server  # Backend on :4000
npm run client  # Frontend on :3001
```

Access the app at http://localhost:3001

## Project Structure

```
KaSh/
├── server/
│   ├── server.js              # Express server
│   ├── config/
│   │   └── database.js        # MySQL connection
│   ├── controllers/
│   │   ├── authController.js  # OAuth integration
│   │   ├── accountController.js
│   │   ├── transactionController.js
│   │   ├── budgetController.js
│   │   └── reportController.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── accounts.js
│   │   ├── transactions.js
│   │   ├── budgets.js
│   │   └── reports.js
│   ├── middleware/
│   │   └── auth.js            # Token verification
│   └── database/
│       ├── migrate.js
│       └── seed.js
└── client/
    ├── public/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    └── package.json
```

## API Endpoints

### Authentication
- `GET /auth/login` - Redirect to Konnect Service
- `GET /auth/callback` - OAuth callback
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Budgets
- `GET /api/budgets` - List budgets
- `POST /api/budgets` - Create budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

### Reports
- `GET /api/reports/summary` - Financial summary
- `GET /api/reports/spending-by-category` - Category breakdown
- `GET /api/reports/income-vs-expense` - Income vs expense trends
- `GET /api/reports/budget-progress` - Budget progress

## License

MIT
