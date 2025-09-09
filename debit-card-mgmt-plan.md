# Company Debit Card Management App - Development Plan

## Project Overview
A web application for managing company debit cards used for client/partner entertainment expenses (dinners, tours, etc.). The app tracks money transfers from the Accounts department and all card expenses.

## Tech Stack
- **Frontend**: Next.js with React
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Supabase)
- **Deployment**: Vercel
- **Version Control**: GitHub
- **Authentication**: None (public access via link)

---

## Phase 1: Project Setup & Infrastructure (Days 1-2)

### Step 1.1: Initialize Project
- Create new Next.js project with TypeScript
  ```bash
  npx create-next-app@latest debit-card-manager --typescript --tailwind --app
  ```
- Initialize Git repository and connect to GitHub
- Configure `.gitignore` for environment variables

### Step 1.2: Setup Supabase
- Create Supabase project
- Design initial database schema:
  ```sql
  -- Cards table
  cards (
    id UUID PRIMARY KEY,
    card_number VARCHAR(4), -- last 4 digits only
    card_name VARCHAR(255),
    department VARCHAR(255),
    current_balance DECIMAL(10,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
  )
  
  -- Transactions table
  transactions (
    id UUID PRIMARY KEY,
    card_id UUID REFERENCES cards(id),
    type ENUM('credit', 'debit'),
    amount DECIMAL(10,2),
    description TEXT,
    category VARCHAR(100),
    vendor_name VARCHAR(255),
    client_partner_name VARCHAR(255),
    transaction_date TIMESTAMP,
    created_by VARCHAR(255),
    created_at TIMESTAMP
  )
  
  -- Balance history table
  balance_snapshots (
    id UUID PRIMARY KEY,
    card_id UUID REFERENCES cards(id),
    balance DECIMAL(10,2),
    snapshot_date DATE,
    created_at TIMESTAMP
  )
  ```

### Step 1.3: Configure Vercel Deployment
- Connect GitHub repository to Vercel
- Set up environment variables in Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Configure automatic deployments from main branch

---

## Phase 2: Core Backend Functions (Days 3-5)

### Step 2.1: Database Connection Layer
- Install Supabase client: `npm install @supabase/supabase-js`
- Create database utility functions in `/lib/supabase.ts`
- Implement connection pooling and error handling

### Step 2.2: API Routes Development
Create API endpoints in `/app/api/`:

- **Cards Management**
  - `GET /api/cards` - List all cards
  - `POST /api/cards` - Create new card
  - `PUT /api/cards/[id]` - Update card details
  - `DELETE /api/cards/[id]` - Remove card

- **Transaction Management**
  - `GET /api/transactions` - List transactions with filters
  - `POST /api/transactions` - Record new transaction
  - `PUT /api/transactions/[id]` - Update transaction
  - `DELETE /api/transactions/[id]` - Delete transaction

- **Reporting**
  - `GET /api/reports/balance` - Current balance summary
  - `GET /api/reports/expenses` - Expense breakdown by category
  - `GET /api/reports/monthly` - Monthly transaction summary

### Step 2.3: Business Logic Layer
- Implement automatic balance calculation after each transaction
- Create validation rules for transactions
- Add transaction categorization logic
- Implement data sanitization for all inputs

---

## Phase 3: Frontend Development (Days 6-10)

### Step 3.1: Layout & Navigation
- Create responsive layout component with Tailwind
- Build navigation header with sections:
  - Dashboard
  - Cards Management
  - Add Transaction
  - Transaction History
  - Reports
- Implement mobile-responsive menu

### Step 3.2: Dashboard Page
Create main dashboard (`/app/page.tsx`) featuring:
- Total balance across all cards
- Recent transactions list (last 10)
- Quick action buttons:
  - Add Income (from Accounts dept)
  - Record Expense
- Mini charts showing:
  - Balance trend (last 30 days)
  - Expense breakdown by category

### Step 3.3: Cards Management Interface
Create `/app/cards/page.tsx`:
- Card listing with current balances
- Add new card modal
- Edit/Delete card functionality
- Card detail view showing transaction history

### Step 3.4: Transaction Management
Create `/app/transactions/page.tsx`:
- **Add Transaction Form** with fields:
  - Transaction type (Income/Expense)
  - Amount
  - Card selection
  - Description
  - Category (dropdown)
  - Client/Partner name
  - Date
  - Vendor (for expenses)
- **Transaction List** with:
  - Sortable columns
  - Filter by date range
  - Filter by card
  - Filter by type
  - Search functionality
  - Pagination

### Step 3.5: Reporting Dashboard
Create `/app/reports/page.tsx`:
- Monthly expense summary
- Category-wise breakdown
- Department-wise card usage
- Export to CSV functionality
- Date range selector
- Visual charts using Chart.js or Recharts

---

## Phase 4: User Interface Polish (Days 11-12)

### Step 4.1: UI Components
Build reusable components:
- Card component for displaying card info
- Transaction row component
- Modal component for forms
- Alert/Toast notifications
- Loading spinners
- Empty state designs

### Step 4.2: Styling & UX
- Implement consistent color scheme
- Add hover effects and transitions
- Create form validation with error messages
- Add confirmation dialogs for delete actions
- Implement success/error notifications
- Add keyboard shortcuts for common actions

### Step 4.3: Responsive Design
- Test and optimize for mobile devices
- Ensure tables are scrollable on mobile
- Create mobile-friendly forms
- Optimize touch targets for mobile

---

## Phase 5: Advanced Features (Days 13-14)

### Step 5.1: Enhanced Functionality
- Real-time balance updates using Supabase subscriptions
- Bulk transaction import via CSV
- Transaction templates for recurring expenses
- Quick expense entry with preset amounts
- Auto-save draft transactions

### Step 5.2: Data Visualization
- Implement charts using Recharts:
  - Line chart for balance trends
  - Pie chart for expense categories
  - Bar chart for monthly comparisons
- Add data export options (PDF, Excel)

### Step 5.3: Search & Filters
- Advanced search with multiple criteria
- Saved filter presets
- Quick date range selections (Today, This Week, This Month)
- Auto-complete for vendor and client names

---

## Phase 6: Testing & Optimization (Days 15-16)

### Step 6.1: Testing
- Unit tests for API endpoints
- Integration tests for database operations
- UI testing for critical user flows
- Performance testing with large datasets
- Cross-browser compatibility testing

### Step 6.2: Performance Optimization
- Implement data pagination
- Add database indexes for common queries
- Optimize bundle size
- Implement lazy loading for components
- Add caching for frequently accessed data

### Step 6.3: Error Handling
- Comprehensive error logging
- User-friendly error messages
- Fallback UI for failed data loads
- Offline functionality indication
- Data validation on both client and server

---

## Phase 7: Deployment & Documentation (Day 17)

### Step 7.1: Production Deployment
- Final testing in staging environment
- Database migration scripts
- Environment variable configuration
- Deploy to Vercel production
- Configure custom domain (if needed)

### Step 7.2: Documentation
- Create README with:
  - Setup instructions
  - Environment variable requirements
  - Database schema documentation
  - API endpoint documentation
- User guide for common operations
- Troubleshooting guide

### Step 7.3: Monitoring Setup
- Configure error tracking (e.g., Sentry)
- Set up performance monitoring
- Create database backup schedule
- Implement activity logging

---

## Security Considerations

Since there's no authentication, implement these security measures:

1. **URL Security**
   - Use unguessable URL slug as basic protection
   - Implement rate limiting on API endpoints
   - Add CORS configuration

2. **Data Protection**
   - Never store full card numbers
   - Sanitize all user inputs
   - Implement SQL injection prevention
   - Add XSS protection headers

3. **Access Control**
   - Consider adding optional password protection
   - Implement IP whitelist (if needed)
   - Add audit trail for all operations

---

## File Structure

```
debit-card-manager/
├── app/
│   ├── api/
│   │   ├── cards/
│   │   ├── transactions/
│   │   └── reports/
│   ├── cards/
│   │   └── page.tsx
│   ├── transactions/
│   │   └── page.tsx
│   ├── reports/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── cards/
│   ├── transactions/
│   └── reports/
├── lib/
│   ├── supabase.ts
│   ├── utils.ts
│   └── types.ts
├── public/
├── styles/
│   └── globals.css
├── .env.local
├── next.config.js
├── package.json
└── README.md
```

---

## Estimated Timeline

- **Total Duration**: 17 working days
- **MVP (Basic Functionality)**: 10 days
- **Full Feature Set**: 14 days
- **Production Ready**: 17 days

## Next Steps

1. Set up GitHub repository
2. Initialize Next.js project with TypeScript and Tailwind
3. Create Supabase account and design database
4. Start with Phase 1 setup tasks
5. Implement core features incrementally
6. Test thoroughly before deployment

## Success Metrics

- All transactions recorded accurately
- Real-time balance updates
- Load time under 2 seconds
- Mobile-responsive design
- Zero data loss incidents
- Easy expense entry (< 30 seconds per transaction)