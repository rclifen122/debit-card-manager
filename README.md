# Debit Card Manager

A simple and modern web application to help you manage your company's debit card balances and transactions with ease. This application supports both English and Vietnamese.

![Screenshot of Dashboard](https://i.imgur.com/your-dashboard-screenshot.png)

## ✨ Features

- **Multi-language Support:** Switch between English and Vietnamese.
- **Card Management:** Add and manage multiple debit cards.
- **Transaction Tracking:** Record income and expenses for each card.
- **Dashboard Overview:** Get a quick overview of your total balance and recent transactions.
- **Reports:** View monthly summaries and expense breakdowns by category.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.17.0 or later)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/debit-card-manager.git
   cd debit-card-manager
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Set up environment variables:**
   - Copy the `.env.example` file to a new file named `.env.local`.
     ```sh
     cp .env.example .env.local
     ```
   - Open `.env.local` and add your Supabase project URL and anon key:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     ```

4. **Run the development server:**
   ```sh
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📖 User Guide

### Switching Languages

You can switch between English (EN) and Vietnamese (VI) using the language switcher in the top-right corner of the header.

![Screenshot of Language Switcher](https://i.imgur.com/your-lang-switcher-screenshot.png)

### Adding a New Card

1. Navigate to the **Cards** page.
2. Fill in the "Add Card" form with the card's last 4 digits, a name for the card, and the department it belongs to.
3. Click the **Add Card** button.

![Screenshot of Adding a Card](https://i.imgur.com/your-add-card-screenshot.png)

### Recording a Transaction

1. From the dashboard, you can use the **Add Income** or **Record Expense** quick action buttons, or navigate to the **Transactions** page.
2. On the Transactions page, you can add a new income or expense transaction by filling out the form.

### Viewing Reports

1. Navigate to the **Reports** page.
2. You will see a monthly summary of your income and expenses, as well as a breakdown of expenses by category.
3. You can filter the reports by a date range.

![Screenshot of Reports Page](https://i.imgur.com/your-reports-screenshot.png)

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Supabase](https://supabase.io/) (PostgreSQL)
- **Internationalization:** [i18next](https://www.i18next.com/)