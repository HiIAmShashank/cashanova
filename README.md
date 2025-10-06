# Cashanova - Personal Finance & Budgeting Application

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-38bdf8?style=flat-square&logo=tailwind-css)

A modern, full-stack personal finance management application built with Next.js, React, TypeScript, and Supabase. Track your expenses, set budgets, achieve savings goals, and take control of your financial future.

---

## Features

### Financial Management
- **Transaction Tracking**: Create, edit, delete, and categorize all your transactions
- **Budget Management**: Set monthly budgets with real-time progress tracking and alerts
- **Savings Goals**: Define financial goals with target amounts and deadlines
- **Category Management**: Organize expenses with custom and system categories

### Data & Analytics
- **Dashboard Overview**: Visual summary of your financial health
- **Transaction History**: Sortable, filterable table with pagination
- **Budget Progress**: Visual indicators showing spending vs. limits
- **Goal Tracking**: Progress bars and projections for savings goals

### Import & Export
- **CSV Import**: Bulk import transactions from bank statements
- **Sample Templates**: Download example CSV for guidance
- **Data Preview**: Review and edit before importing
- **Validation**: Client-side validation with helpful error messages

### Security & Authentication
- **Supabase Auth**: Secure email/password authentication
- **Row Level Security**: Database-level security for all user data
- **Password Reset**: Secure password recovery via email
- **Session Management**: Persistent, secure user sessions

### Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode Ready**: Built-in support for dark theme
- **Accessible**: WCAG 2.1 Level AA compliant
- **Loading States**: Skeleton loaders and progress indicators
- **Toast Notifications**: Real-time feedback for all actions

---

## Quick Start

### Prerequisites

- **Node.js** 20 LTS or higher
- **npm** or **yarn**
- **Supabase Account** (free tier available)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/cashanova.git
   cd cashanova
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   
   Create `.env.local` in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   **Where to find these values:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to Settings → API
   - Copy the values from the "Project API keys" section

4. **Set up the database**:
   
   Run the SQL migrations in your Supabase SQL Editor:
   ```bash
   # Copy the contents of supabase/migrations/*.sql files
   # Execute them in order in Supabase SQL Editor
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - Sign up for a new account
   - Start tracking your finances!

---

## Tech Stack

### Frontend
- **Next.js 15.5** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.3+** - Type safety
- **Tailwind CSS 4.1** - Styling with @theme
- **shadcn/ui** - Component library
- **Radix UI** - Accessible primitives
- **Lucide React** - Icon library

### Backend
- **Next.js Server Actions** - Server-side logic
- **Supabase** - Database and authentication
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Data security

### Tools & Libraries
- **Zod** - Schema validation
- **TanStack Table v8** - Advanced table features
- **PapaParse** - CSV parsing
- **date-fns** - Date utilities
- **Sonner** - Toast notifications

---

## Performance

### Build Size
- **First Load JS**: ~102 kB (optimized)
- **Import Page**: 1.92 kB (88% reduction via code-splitting)
- **Transactions Page**: 20.5 kB

### Optimizations
- Dynamic imports for heavy components
- React.memo for expensive renders
- Shared Intl formatters
- Image optimization
- Compression enabled
- Web Vitals monitoring

---

## Accessibility

Cashanova is built to be accessible to all users:

- **WCAG 2.1 Level AA** compliance
- **Keyboard navigation** support throughout
- **Screen reader** friendly with proper ARIA labels
- **Focus indicators** on all interactive elements
- **Skip navigation** link for keyboard users
- **Semantic HTML** with proper landmarks
- **Color contrast** ratios meet standards
- **Responsive design** for all screen sizes

---

## Scripts

```bash
# Development
npm run dev          # Start dev server at localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint
```

---

**Built with Next.js and Supabase**

Start your financial journey today with Cashanova!
