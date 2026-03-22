# WealthWise - Page-wise Features & Functionality Report

## Executive Summary

This comprehensive report documents all features, components, interactions, and functionality available on every page of the WealthWise budget planner application. Each page is analyzed in detail with feature descriptions, UI elements, and user interactions.

---

## Table of Contents
1. [Landing Page (`/`)](#1-landing-page-)
2. [Dashboard Home (`/dashboard`)](#2-dashboard-home-dashboard)
3. [Budget Planner (`/dashboard/budget`)](#3-budget-planner-dashboardbudget)
4. [Transactions (`/dashboard/transactions`)](#4-transactions-dashboardtransactions)
5. [Reports & Insights (`/dashboard/reports`)](#5-reports--insights-dashboardreports)
6. [Goals (`/dashboard/goals`)](#6-goals-dashboardgoals)
7. [Alerts & Notifications (`/dashboard/alerts`)](#7-alerts--notifications-dashboardalerts)
8. [Common Features Across All Pages](#8-common-features-across-all-pages)
9. [Feature Comparison Matrix](#9-feature-comparison-matrix)

---

## 1. Landing Page (`/`)

**Route:** `/`
**File:** `app/page.tsx`
**Type:** Public Marketing Page

### Purpose
Marketing and conversion page for potential users. Designed to attract new users and showcase application features.

### Page Structure

#### 1.1 Navbar (`components/navbar.tsx`)
**Features:**
- Logo with branding
- Navigation links
- Call-to-action buttons
- Mobile responsive hamburger menu
- Smooth scroll navigation

**UI Elements:**
- Brand logo
- Navigation links
- CTA buttons (Get Started, Login)

#### 1.2 Hero Section (`components/hero-section.tsx`)
**Features:**
- Main headline with value proposition
- Subheadline explaining benefits
- Primary CTA button
- Secondary CTA button
- Hero image/illustration
- Animated background elements

**UI Elements:**
- H1 headline
- Subtitle text
- Primary button ("Get Started Free")
- Secondary button ("Watch Demo")
- Hero graphic/image

#### 1.3 Features Section (`components/features-section.tsx`)
**Features:**
- Feature grid display
- Icon-based feature cards
- Feature descriptions
- Value proposition highlights

**Feature Cards:**
| Feature | Icon | Description |
|---------|------|-------------|
| Expense Tracking | Receipt icon | Track every expense automatically |
| Budget Planning | Calculator icon | Create and manage monthly budgets |
| Goal Setting | Target icon | Set and track financial goals |
| AI Insights | Brain icon | Smart recommendations |
| Reports | Chart icon | Visual financial reports |
| Security | Shield icon | Bank-level security |

**UI Elements:**
- Section heading
- 6 feature cards
- Icons
- Description text

#### 1.4 Gallery Section (`components/gallery-section.tsx`)
**Features:**
- App screenshot showcase
- Image carousel/grid
- Feature highlights with visuals
- Responsive image gallery

**UI Elements:**
- Section heading
- Image gallery
- Screenshot containers
- Navigation arrows (if carousel)

#### 1.5 Testimonials Section (`components/testimonials-section.tsx`)
**Features:**
- Customer testimonial cards
- User photos/names
- Rating stars
- Quote text
- Responsive carousel

**UI Elements:**
- Section heading
- Testimonial cards
- Avatar images
- User names
- Job titles
- Star ratings
- Quote text
- Carousel indicators

#### 1.6 Pricing Section (`components/pricing-section.tsx`)
**Features:**
- Pricing tier cards
- Feature comparison
- Plan selection buttons
- Popular plan highlighting
- Monthly/annual toggle

**Pricing Tiers:**
| Plan | Price | Features |
|------|-------|----------|
| Free | ₹0/month | Basic features, limited transactions |
| Pro | ₹199/month | All features, unlimited |
| Premium | ₹499/month | Priority support, advanced analytics |

**UI Elements:**
- Section heading
- Toggle switch (monthly/annual)
- 3 pricing cards
- Feature lists
- CTA buttons
- "Popular" badge

#### 1.7 Finance Tips Section (`components/finance-tips-section.tsx`)
**Features:**
- Financial education cards
- Tip categories
- Actionable advice
- Rotating/featured tips

**UI Elements:**
- Section heading
- Tip cards
- Category labels
- Icons
- Read more links

#### 1.8 Contact Section (`components/contact-section.tsx`)
**Features:**
- Contact form
- Form validation
- Email input
- Message textarea
- Submit button
- Contact information

**UI Elements:**
- Section heading
- Name input field
- Email input field
- Subject dropdown
- Message textarea
- Submit button
- Contact details (email, phone)
- Social media links

#### 1.9 Newsletter Section (`components/newsletter-section.tsx`)
**Features:**
- Email subscription form
- Single email input
- Subscribe button
- Privacy text
- Success message

**UI Elements:**
- Heading
- Description text
- Email input
- Subscribe button
- Privacy disclaimer

#### 1.10 Footer (`components/footer.tsx`)
**Features:**
- Site navigation links
- Legal links
- Social media icons
- Copyright text
- Back to top button

**UI Elements:**
- Logo
- Link columns (Product, Company, Resources, Legal)
- Social icons (Facebook, Twitter, LinkedIn, Instagram)
- Copyright notice
- Legal links (Privacy, Terms)

### Interactive Elements
- Smooth scroll navigation
- Mobile menu toggle
- Pricing toggle (monthly/yearly)
- Form submissions
- Carousel navigation
- Hover effects on cards

### Data/State
- Static content (no database integration)
- Form input states
- Mobile menu state

---

## 2. Dashboard Home (`/dashboard`)

**Route:** `/dashboard`
**File:** `app/dashboard/page.tsx`
**Main Component:** `DashboardLayout` + `MainContent`
**Type:** Authenticated User Dashboard

### Purpose
Central hub for users to view their financial overview, recent activity, and quick actions.

### Page Structure

#### 2.1 Dashboard Layout (`components/dashboard/layout.tsx`)
**Features:**
- Responsive sidebar layout
- Settings dialog integration
- Mobile sidebar handling
- Dark mode support

**UI Elements:**
- Sidebar container
- Main content area
- Settings dialog modal

#### 2.2 Sidebar (`components/dashboard/sidebar.tsx`)
**Features:**
- Navigation menu
- Logo with back to home
- Active route highlighting
- Settings button
- Responsive mobile sheet

**Navigation Items:**
| Icon | Label | Route |
|------|-------|-------|
| LayoutDashboard | Dashboard | /dashboard |
| PiggyBank | Budget Planner | /dashboard/budget |
| CreditCard | Transactions | /dashboard/transactions |
| BarChart3 | Reports & Insights | /dashboard/reports |
| Target | Goals | /dashboard/goals |
| Bell | Alerts & Notifications | /dashboard/alerts |

**UI Elements:**
- Logo block
- Back to home button
- Navigation buttons
- Settings button
- Active state indicators
- Sheet component (mobile)

#### 2.3 Header (`components/dashboard/main-content.tsx`)
**Features:**
- User greeting (personalized)
- Quick action buttons
- Mobile menu toggle
- Date context

**UI Elements:**
- Hamburger menu button (mobile)
- Greeting text ("Welcome back, Alex 👋")
- Subtitle text
- "Add Transaction" button
- "Generate Report" button

#### 2.4 Overview Cards (`components/dashboard/overview-cards.tsx`)
**Features:**
- 4 summary statistics cards
- Trend indicators with icons
- Progress bars
- Hover effects

**Cards:**

**Card 1: Total Balance**
- Balance amount: ₹1,24,567
- Trend indicator: +12.5% (green up arrow)
- Income: ₹85,000
- Expenses: ₹42,433

**Card 2: Budget Usage**
- Usage percentage: 85%
- Amount: ₹42,500 of ₹50,000
- Progress bar
- Warning message: "⚠️ You're approaching your budget limit"

**Card 3: This Month Spending**
- Amount: ₹42,433
- Trend: +8.2% from last month (red up arrow)
- Top 3 categories breakdown
  - Food & Dining: ₹12,500
  - Transportation: ₹8,900
  - Shopping: ₹7,200

**Card 4: Savings Goal**
- Current amount: ₹75,000
- Progress: ₹45,000 of ₹1,00,000
- Progress bar at 45%
- Status message: "🎯 On track to reach your goal by March 2024"

**UI Elements:**
- Card containers
- Icons (DollarSign, Target, TrendingUp, TrendingDown)
- Large number displays
- Progress bars
- Small text descriptions
- Trend badges

#### 2.5 Charts Section
**Features:**
- Monthly income vs expenses chart
- 6 months of data
- Bar chart visualization
- Interactive tooltips

**Data Points:**
| Month | Income | Expenses |
|-------|--------|----------|
| Jul | ₹85,000 | ₹45,000 |
| Aug | ₹85,000 | ₹48,000 |
| Sep | ₹85,000 | ₹42,000 |
| Oct | ₹85,000 | ₹46,000 |
| Nov | ₹85,000 | ₹44,000 |
| Dec | ₹85,000 | ₹42,433 |

**UI Elements:**
- Card container
- Chart title
- Bar chart (recharts)
- X-axis (months)
- Y-axis (amounts)
- Cartesian grid
- Tooltip on hover
- Legend

#### 2.6 AI Insights (`components/dashboard/main-content.tsx`)
**Features:**
- Smart recommendations
- 3 insight cards
- Color-coded by type
- Actionable advice

**Insight Cards:**

**Card 1: Spending Alert (Blue)**
- Icon: Lightbulb
- Title: "💡 Spending Alert"
- Message: "You've spent 15% more on dining out this month compared to last month. Consider setting a dining budget."

**Card 2: Savings Opportunity (Green)**
- Icon: Savings
- Title: "🎯 Savings Opportunity"
- Message: "You could save ₹2,500 monthly by switching to a different subscription plan for your streaming services."

**Card 3: Investment Tip (Purple)**
- Icon: TrendingUp
- Title: "📈 Investment Tip"
- Message: "Based on your savings pattern, consider investing ₹5,000 monthly in SIP for better returns."

**UI Elements:**
- Card with title
- Lightbulb icon in header
- 3 colored insight blocks
- Icons for each insight
- Colored backgrounds

#### 2.7 Recent Transactions (`components/dashboard/recent-transactions.tsx`)
**Features:**
- Last 5 transactions
- Type indicators (income/expense)
- Category badges
- Status indicators
- "View All" button

**Transactions Displayed:**
| Date | Description | Category | Amount | Status |
|------|-------------|----------|--------|--------|
| Dec 12 | Grocery Shopping | Food & Dining | -₹2,450 | completed |
| Dec 10 | Salary Credit | Income | +₹85,000 | completed |
| Dec 11 | Uber Ride | Transportation | -₹320 | completed |
| Dec 9 | Netflix Subscription | Entertainment | -₹649 | pending |
| Dec 8 | Coffee Shop | Food & Dining | -₹180 | completed |

**UI Elements:**
- Card container
- Transaction list items
- Icon circles (green for income, red for expense)
- Description text
- Category badges
- Status badges
- Amount text (colored)
- Date text
- "View All" button

#### 2.8 Expense Tracker (`components/dashboard/expense-tracker.tsx`)
**Features:**
- Add new expense
- Edit existing expense
- Delete expense
- Category dropdown
- Date picker
- Inline editing

**Expense Fields:**
| Field | Type | Editable |
|-------|------|----------|
| Date | Date picker | Yes |
| Category | Dropdown | Yes |
| Amount | Number input | Yes |
| Note | Text input | Yes |
| Actions | Edit/Delete buttons | Yes |

**Categories:**
- Food & Dining
- Transportation
- Shopping
- Entertainment
- Bills
- Healthcare
- Other

**UI Elements:**
- Card with title
- "Add Expense" button
- Data table
- Date inputs
- Select dropdowns
- Number inputs
- Text inputs
- Edit/Save buttons
- Delete buttons
- Cancel button

**Interactions:**
- Click "Add Expense" to show input row
- Click edit icon to modify row
- Click save to confirm changes
- Click delete to remove (no confirmation currently)

#### 2.9 Upcoming Bills (`components/dashboard/main-content.tsx`)
**Features:**
- Bill reminder list
- Due date display
- Amount display
- Status indicators
- Urgency highlighting

**Bills Displayed:**
| Bill Name | Amount | Due Date | Status |
|-----------|--------|----------|--------|
| Electricity Bill | ₹2,450 | Dec 15 | pending |
| Internet Bill | ₹899 | Dec 18 | pending |
| Credit Card Payment | ₹15,670 | Dec 20 | urgent |

**UI Elements:**
- Card with Calendar icon
- Bill list items
- Bill name
- Due date
- Amount (right aligned)
- Status badge (yellow/red)

#### 2.10 Settings Dialog (`components/dashboard/settings-dialog.tsx`)
**Features:**
- Tab-based settings
- General settings
- Appearance settings
- Account settings
- Currency selector
- Language selector
- Theme toggle
- Data export
- Account deletion

**Tabs:**
1. **General**
   - Currency selector (INR, USD, EUR, GBP)
   - Language selector (English, Hindi, Spanish, French)

2. **Appearance**
   - Theme mode (Light, Dark, System)

3. **Account**
   - Download My Data button
   - Delete Account button (danger zone)
   - Warning text

**UI Elements:**
- Modal dialog
- Tab navigation sidebar
- Select dropdowns
- Theme buttons
- Export button
- Delete button (destructive)
- Alert triangle icon
- Warning message box

**Interactions:**
- Click settings in sidebar to open
- Switch tabs to view different settings
- Select currency/language
- Toggle theme
- Click export to download data
- Click delete (with confirmation warning)

---

## 3. Budget Planner (`/dashboard/budget`)

**Route:** `/dashboard/budget`
**File:** `app/dashboard/budget/page.tsx`
**Component:** `components/dashboard/pages/budget-planner.tsx`
**Type:** Budget Management Page

### Purpose
Plan and track monthly budgets across different spending categories.

### Page Structure

#### 3.1 Header
**Features:**
- Page title: "Budget Planner"
- Subtitle: "Plan and track your monthly budget"
- Add Category button
- Mobile menu toggle

**UI Elements:**
- Hamburger menu button
- Title text
- Subtitle text
- "Add Category" button with Plus icon

#### 3.2 Budget Overview Cards
**Features:**
- 3 summary cards
- Real-time calculations
- Color-coded amounts

**Cards:**

**Card 1: Total Budget**
- Amount: ₹53,000 (calculated from categories)
- Label: "Monthly allocation"
- Blue color theme

**Card 2: Total Spent**
- Amount: ₹42,500 (calculated)
- Percentage: 80.2% of budget
- Label: Percentage display
- Red color theme

**Card 3: Remaining**
- Amount: ₹10,500
- Label: "Under budget" / "Over budget"
- Dynamic color (green for under, red for over)

**UI Elements:**
- 3 Card components
- Large number displays
- Subtitle text
- Color-coded text

#### 3.3 Budget Progress Card
**Features:**
- Overall budget progress bar
- Spent vs total display
- Percentage breakdown
- Visual progress indicator

**Data:**
- Spent: ₹42,500
- Total: ₹53,000
- Used: 80.2%
- Remaining: 19.8%

**UI Elements:**
- Card container
- Title: "Budget Overview"
- Description text
- Progress bar
- Percentage labels
- Amount labels

#### 3.4 Category Budgets Card
**Features:**
- Individual category budgets
- Inline editing
- Over-budget warnings
- Color coding
- Progress bars per category
- Remaining calculations

**Categories Table:**
| Category | Budgeted | Spent | % Used | Remaining | Status |
|----------|----------|-------|--------|-----------|--------|
| Food & Dining | ₹15,000 | ₹12,500 | 83.3% | ₹2,500 | OK |
| Transportation | ₹8,000 | ₹6,800 | 85.0% | ₹1,200 | OK |
| Shopping | ₹10,000 | ₹7,200 | 72.0% | ₹2,800 | OK |
| Entertainment | ₹5,000 | ₹3,200 | 64.0% | ₹1,800 | OK |
| Bills & Utilities | ₹12,000 | ₹11,500 | 95.8% | ₹500 | Warning |
| Healthcare | ₹3,000 | ₹1,200 | 40.0% | ₹1,800 | OK |

**UI Elements:**
- Card container
- Title: "Category Budgets"
- Individual category rows
- Color circles (category colors)
- Category names
- Over-budget badges (when applicable)
- Spent/Total display
- Inline number inputs (when editing)
- Progress bars per category
- Remaining amount text
- Over amount text (when applicable)
- Edit buttons (pencil icon)

**Interactions:**
- Click budget amount to edit inline
- Enter new amount
- Press Enter or blur to save
- Progress bar updates automatically
- Over-budget warning appears if spent > budgeted

#### 3.5 Budget Tips Card
**Features:**
- Financial advice cards
- 50/30/20 rule
- Tracking recommendations

**Tips:**

**Tip 1: Smart Allocation**
- Icon: TrendingUp
- Title: "💡 Smart Allocation"
- Content: "Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings and debt repayment."

**Tip 2: Track Progress**
- Icon: TrendingUp
- Title: "🎯 Track Progress"
- Content: "Review your budget weekly and adjust categories based on your actual spending patterns."

**UI Elements:**
- Card with TrendingUp icon
- 2 colored tip boxes
- Icons
- Titles
- Description text
- Colored backgrounds (blue, green)

---

## 4. Transactions (`/dashboard/transactions`)

**Route:** `/dashboard/transactions`
**File:** `app/dashboard/transactions/page.tsx`
**Component:** `components/dashboard/pages/transactions.tsx`
**Type:** Transaction Management Page

### Purpose
View, filter, and manage all financial transactions with detailed history.

### Page Structure

#### 4.1 Header
**Features:**
- Page title: "Transactions"
- Subtitle: "View and manage all your transactions"
- Export button
- Add Transaction button

**UI Elements:**
- Hamburger menu
- Title
- Subtitle
- "Export" button with Download icon
- "Add Transaction" button with Plus icon

#### 4.2 Summary Cards
**Features:**
- Income summary
- Expense summary
- Net flow calculation

**Cards:**

**Card 1: Total Income**
- Amount: ₹1,00,000
- Label: "This month"
- Green color theme
- TrendingUp icon

**Card 2: Total Expenses**
- Amount: ₹42,433
- Label: "This month"
- Red color theme
- TrendingDown icon

**Card 3: Net Flow**
- Amount: ₹57,567 (positive)
- Label: "This month"
- Color based on value (green for positive, red for negative)
- Blue color theme

**UI Elements:**
- 3 Card components
- Colored headers
- Large amounts
- Subtitle text
- Icons

#### 4.3 Filter Card
**Features:**
- Search functionality
- Category filter
- Type filter
- Sort options

**Filter Fields:**

**Search Input:**
- Placeholder: "Search transactions..."
- Icon: Search
- Filters by description and category

**Category Filter:**
- Options: All Categories, Food & Dining, Transportation, Entertainment, Shopping, Bills & Utilities, Healthcare, Income
- Default: All Categories

**Type Filter:**
- Options: All Types, Income, Expense
- Default: All Types

**Sort By:**
- Options: Date, Amount
- Default: Date (newest first)

**UI Elements:**
- Card container
- Search input with icon
- 3 Select dropdowns
- Clear filter functionality (implicit)

**Interactions:**
- Type in search to filter list
- Select category to filter
- Select type to filter
- Select sort to reorder
- Filters combine (AND logic)

#### 4.4 Transactions Table Card
**Features:**
- Full transaction list
- Sortable columns
- Type indicators
- Category badges
- Status badges
- Amount formatting

**Table Columns:**
| Column | Description |
|--------|-------------|
| Date | Transaction date (formatted) |
| Description | Transaction description with type icon |
| Category | Category badge |
| Account | Account name |
| Status | Completed/Pending badge |
| Amount | Formatted amount (right aligned) |

**Sample Transactions:**
| Date | Description | Category | Account | Status | Amount |
|------|-------------|----------|---------|--------|--------|
| Dec 12 | Grocery Shopping - Big Bazaar | Food & Dining | HDFC Bank | completed | -₹2,450 |
| Dec 10 | Salary Credit | Income | HDFC Bank | completed | +₹85,000 |
| Dec 11 | Uber Ride to Office | Transportation | Credit Card | completed | -₹320 |
| Dec 9 | Netflix Subscription | Entertainment | Credit Card | pending | -₹649 |
| Dec 8 | Coffee Shop - Starbucks | Food & Dining | Debit Card | completed | -₹180 |
| Dec 7 | Freelance Payment | Income | HDFC Bank | completed | +₹15,000 |
| Dec 6 | Electricity Bill | Bills & Utilities | HDFC Bank | completed | -₹2,100 |
| Dec 5 | Amazon Shopping | Shopping | Credit Card | completed | -₹3,200 |
| Dec 4 | Gym Membership | Healthcare | HDFC Bank | completed | -₹1,500 |
| Dec 3 | Movie Tickets | Entertainment | Credit Card | completed | -₹800 |

**UI Elements:**
- Card container
- Title: "Transaction History"
- Description: "Showing X of Y transactions"
- Data table
- Column headers
- Row hover effects
- Icon circles (green/red)
- Description text
- Category badges
- Account text
- Status badges
- Amount text (green for income, red for expense)

---

## 5. Reports & Insights (`/dashboard/reports`)

**Route:** `/dashboard/reports`
**File:** `app/dashboard/reports/page.tsx`
**Component:** `components/dashboard/pages/reports.tsx`
**Type:** Analytics & Reporting Page

### Purpose
Analyze financial patterns with visual charts, metrics, and AI-powered insights.

### Page Structure

#### 5.1 Header
**Features:**
- Page title: "Reports & Insights"
- Subtitle: "Analyze your financial patterns and trends"
- Time range selector
- Export button

**UI Elements:**
- Hamburger menu
- Title
- Subtitle
- Time range dropdown (Last Month, Last 3 Months, Last 6 Months, Last Year)
- "Export Report" button

#### 5.2 Key Metrics Cards
**Features:**
- 4 metric cards
- Trend indicators
- Comparison percentages

**Cards:**

**Card 1: Average Monthly Income**
- Amount: ₹85,000
- Icon: DollarSign
- Trend: Stable (green)
- No percentage change

**Card 2: Average Monthly Expenses**
- Amount: ₹44,722
- Icon: TrendingDown
- Trend: -2.1% (green - decreasing)
- Comparison text: "vs last period"

**Card 3: Average Savings**
- Amount: ₹40,278
- Icon: TrendingUp
- Trend: +5.2% (green - increasing)
- Comparison text: "vs last period"

**Card 4: Savings Rate**
- Amount: 47.4%
- Icon: PieChart
- Rating: "Excellent"
- Green text

**UI Elements:**
- 4 small Card components
- Icons
- Small titles
- Large amounts
- Trend indicators
- Percentage badges
- Comparison text

#### 5.3 Charts Grid
**Features:**
- 2-column layout
- Bar chart
- Pie chart
- Interactive tooltips

**Chart 1: Income vs Expenses Trend**
- Type: Bar chart
- Data: 6 months of income and expenses
- Colors: Green for income, Red for expenses
- X-axis: Months
- Y-axis: Amount
- Legend
- Tooltip on hover

**Chart 2: Expense Breakdown**
- Type: Pie chart
- Data: Category-wise expenses
- Colors: Category specific
- Labels: Category name + percentage
- Tooltip on hover
- Legend (implicit)

**UI Elements:**
- 2 Card containers
- Chart titles
- Descriptions
- Recharts components
- Responsive containers
- Tooltips

#### 5.4 Savings Analysis Card
**Features:**
- Line chart
- Target vs actual comparison
- 6-month trend

**Chart: Savings Performance**
- Type: Line chart
- Lines: Target (dashed gray), Actual (solid green)
- Data: Monthly savings data
- X-axis: Months
- Y-axis: Amount
- Legend
- Tooltip on hover

**UI Elements:**
- Card container
- Title: "Savings Performance"
- Description
- Line chart
- Grid lines
- Two line series

#### 5.5 Financial Health Score Card
**Features:**
- Overall score display
- Component breakdown
- Score visualization

**Score Display:**
- Big number: 8.5
- Label: "Excellent"
- Color: Green

**Component Scores:**
| Component | Score |
|-----------|-------|
| Savings Rate | 9/10 |
| Budget Adherence | 8/10 |
| Expense Control | 7/10 |
| Goal Progress | 9/10 |

**UI Elements:**
- Card container
- Title
- Description
- Large score display
- Score label
- Component list
- Score text (green/yellow)

#### 5.6 Key Insights Card
**Features:**
- AI-generated insights
- 3 insight blocks
- Color-coded by type
- Actionable recommendations

**Insights:**

**Insight 1: Great Progress! (Green)**
- Message: "Your savings rate of 47.4% is excellent. You're on track to meet your financial goals."

**Insight 2: Spending Pattern (Blue)**
- Message: "Food & Dining is your largest expense category. Consider meal planning to optimize costs."

**Insight 3: Recommendation (Purple)**
- Message: "You could increase your emergency fund by redirecting 5% of entertainment spending."

**UI Elements:**
- Card container
- Title: "Key Insights"
- Description: "AI-powered analysis"
- 3 colored insight boxes
- Colored backgrounds
- Text content

---

## 6. Goals (`/dashboard/goals`)

**Route:** `/dashboard/goals`
**File:** `app/dashboard/goals/page.tsx`
**Component:** `components/dashboard/pages/goals.tsx`
**Type:** Financial Goal Tracking Page

### Purpose
Set, track, and manage financial savings goals with progress monitoring.

### Page Structure

#### 6.1 Header
**Features:**
- Page title: "Financial Goals"
- Subtitle: "Track and achieve your financial objectives"
- Add Goal button with dialog

**UI Elements:**
- Hamburger menu
- Title
- Subtitle
- "Add Goal" button with Plus icon

#### 6.2 Add Goal Dialog
**Features:**
- Modal dialog
- Form inputs
- Category selection
- Priority selection
- Date picker

**Form Fields:**
| Field | Type | Required |
|-------|------|----------|
| Goal Title | Text input | Yes |
| Description | Text input | No |
| Target Amount | Number input | Yes |
| Target Date | Date picker | Yes |
| Category | Select dropdown | Yes |
| Priority | Select dropdown | Yes |

**Categories:**
- Emergency
- Travel
- Technology
- Transportation
- Education
- Investment
- Other

**Priorities:**
- High
- Medium
- Low

**UI Elements:**
- Dialog overlay
- Dialog content
- Header with title
- Description text
- Form fields
- Labels
- Inputs
- Select dropdowns
- "Create Goal" button

**Interactions:**
- Click "Add Goal" to open dialog
- Fill form fields
- Click "Create Goal" to save
- Validation on required fields
- Dialog closes on success

#### 6.3 Overview Cards
**Features:**
- 4 summary cards
- Goal statistics
- Progress tracking

**Cards:**

**Card 1: Active Goals**
- Count: 3
- Label: "In progress"
- Blue color theme

**Card 2: Completed Goals**
- Count: 1
- Label: "Achieved"
- Green color theme

**Card 3: Total Target**
- Amount: ₹10,00,000
- Label: "All active goals"
- Purple color theme

**Card 4: Total Saved**
- Amount: ₹3,90,000
- Label: "39.0% of target"
- Green color theme

**UI Elements:**
- 4 Card components
- Titles
- Large numbers
- Subtitle text

#### 6.4 Active Goals Card
**Features:**
- List of active goals
- Progress bars
- Goal details
- Edit/Delete actions
- Time remaining calculation

**Goal Display:**

**Goal 1: Emergency Fund**
- Description: "Build 6 months of expenses as emergency fund"
- Target: ₹3,00,000
- Current: ₹1,80,000 (60%)
- Date: Jun 30, 2024
- Remaining: 6 months left
- Category: Emergency
- Priority: High (red badge)
- Progress bar at 60%

**Goal 2: Vacation to Europe**
- Description: "Save for a 2-week European vacation"
- Target: ₹2,00,000
- Current: ₹85,000 (42.5%)
- Date: Dec 31, 2024
- Remaining: 12 months left
- Category: Travel
- Priority: Medium (yellow badge)
- Progress bar at 42.5%

**Goal 3: Car Down Payment**
- Description: "Save for down payment on new car"
- Target: ₹5,00,000
- Current: ₹1,25,000 (25%)
- Date: Mar 31, 2025
- Remaining: 15 months left
- Category: Transportation
- Priority: Medium (yellow badge)
- Progress bar at 25%

**UI Elements:**
- Card container
- Title: "Active Goals"
- Goal list items
- Goal containers with borders
- Header row with title, priority badge, category badge
- Description text
- Target icon with amount
- Calendar icon with time remaining
- Progress section
- Progress bar
- Amount text (current/target)
- Percentage text
- Remaining amount text
- Target date text
- Edit/Delete buttons

#### 6.5 Completed Goals Card
**Features:**
- List of completed goals
- Green-themed styling
- Achievement display
- Conditionally rendered (only if completed goals exist)

**Completed Goal:**

**Goal: New Laptop**
- Description: "MacBook Pro for work and personal use"
- Target: ₹1,50,000
- Status: Completed (badge)
- Green background theme

**UI Elements:**
- Card container (conditional)
- Title with TrendingUp icon
- Description text
- Completed goal items
- Green background
- Goal title
- Description
- Amount
- "Completed" badge

#### 6.6 Goal Achievement Tips Card
**Features:**
- 4 tip cards
- Goal-setting advice
- Visual grid layout

**Tips:**

**Tip 1: Set SMART Goals (Blue)**
- Icon: Target
- Content: "Make your goals Specific, Measurable, Achievable, Relevant, and Time-bound for better success rates."

**Tip 2: Automate Savings (Green)**
- Icon: Money
- Content: "Set up automatic transfers to dedicated goal accounts to ensure consistent progress without manual effort."

**Tip 3: Track Progress (Purple)**
- Icon: Chart
- Content: "Review your goals monthly and adjust your savings rate based on income changes and life events."

**Tip 4: Celebrate Milestones (Orange)**
- Icon: Trophy
- Content: "Acknowledge progress at 25%, 50%, and 75% completion to maintain motivation throughout your journey."

**UI Elements:**
- Card container
- Title
- 2x2 grid of tip boxes
- Colored backgrounds
- Titles
- Content text

---

## 7. Alerts & Notifications (`/dashboard/alerts`)

**Route:** `/dashboard/alerts`
**File:** `app/dashboard/alerts/page.tsx`
**Component:** `components/dashboard/pages/alerts.tsx`
**Type:** Notification Management Page

### Purpose
View, manage, and configure financial alerts and notifications.

### Page Structure

#### 7.1 Header
**Features:**
- Page title with unread badge
- Subtitle
- Settings button

**UI Elements:**
- Hamburger menu
- Title: "Alerts & Notifications" with Bell icon
- Unread count badge (red)
- Subtitle: "Stay informed about your financial activity"
- "Notification Settings" button

#### 7.2 Alert Summary Cards
**Features:**
- 4 summary statistics
- Alert count metrics

**Cards:**

**Card 1: Total Alerts**
- Count: 5
- Icon: Bell (blue)
- Label: "All time"

**Card 2: Unread**
- Count: 3
- Icon: AlertTriangle (red)
- Label: "Require attention"

**Card 3: Read**
- Count: 2
- Icon: CheckCircle (green)
- Label: "Acknowledged"

**Card 4: Active Rules**
- Count: 4
- Icon: Settings (purple)
- Label: "Monitoring"

**UI Elements:**
- 4 Card components
- Icons
- Titles
- Large numbers
- Subtitle text
- Color-coded icons

#### 7.3 Recent Alerts Card
**Features:**
- List of alerts
- Type-based styling
- Read/unread indicators
- Category badges
- Timestamp display
- Mark as read
- Delete

**Alerts:**

**Alert 1: Budget Limit Approaching**
- Type: Warning
- Message: "You've spent 85% of your monthly budget. Consider reviewing your expenses."
- Timestamp: 2h ago
- Category: Budget
- Status: Unread
- Style: Yellow background, left border

**Alert 2: Bill Reminder**
- Type: Info
- Message: "Your electricity bill of ₹2,450 is due in 3 days."
- Timestamp: 3h ago
- Category: Bills
- Status: Unread
- Style: Blue background, left border

**Alert 3: Goal Milestone Reached**
- Type: Success
- Message: "Congratulations! You've reached 60% of your Emergency Fund goal."
- Timestamp: Yesterday
- Category: Goals
- Status: Read
- Style: Green background, muted

**Alert 4: Unusual Spending Detected**
- Type: Error
- Message: "Large transaction of ₹15,000 detected. Please verify if this was authorized."
- Timestamp: Yesterday
- Category: Security
- Status: Unread
- Style: Red background, left border

**Alert 5: Monthly Report Ready**
- Type: Info
- Message: "Your November financial report is now available for download."
- Timestamp: 2 days ago
- Category: Reports
- Status: Read
- Style: Blue background, muted

**UI Elements:**
- Card container
- Title: "Recent Alerts"
- Description
- Alert list
- Alert containers with borders
- Type icons (colored)
- Title text
- Category badge
- "New" badge (for unread)
- Message text
- Timestamp
- "Mark Read" button (for unread)
- Delete button (trash icon)
- Colored backgrounds
- Left border indicators

**Interactions:**
- Click "Mark Read" to mark alert as read
- Click delete icon to remove alert
- Alert styling changes when marked read

#### 7.4 Alert Settings Card
**Features:**
- List of alert settings
- Enable/disable toggles
- Threshold configuration
- Category badges

**Settings:**

**Setting 1: Budget Warnings**
- Description: "Get notified when you approach your budget limits"
- Enabled: Yes
- Threshold: 80%
- Category: Budget

**Setting 2: Bill Reminders**
- Description: "Receive reminders for upcoming bill payments"
- Enabled: Yes
- Category: Bills

**Setting 3: Goal Milestones**
- Description: "Celebrate when you reach savings goal milestones"
- Enabled: Yes
- Category: Goals

**Setting 4: Unusual Spending**
- Description: "Alert for transactions that seem out of pattern"
- Enabled: Yes
- Threshold: ₹10,000
- Category: Security

**Setting 5: Low Balance Alerts**
- Description: "Warning when account balance falls below threshold"
- Enabled: No
- Threshold: ₹5,000
- Category: Account

**Setting 6: Investment Updates**
- Description: "Market updates and portfolio performance alerts"
- Enabled: No
- Category: Investments

**UI Elements:**
- Card container
- Title: "Alert Settings"
- Description
- Setting list items
- Setting containers with borders
- Title text
- Category badge
- Description text
- Threshold input (when applicable)
- Unit label ("%" or "₹")
- Toggle switch

**Interactions:**
- Toggle switch to enable/disable
- Edit threshold number input
- Auto-save on change

#### 7.5 Quick Actions Card
**Features:**
- 4 action buttons
- Grid layout
- Icon-based actions

**Actions:**

**Action 1: Mark All Read**
- Icon: CheckCircle (green)
- Label: "Mark All Read"

**Action 2: Clear All**
- Icon: Trash2 (red)
- Label: "Clear All"

**Action 3: Schedule Report**
- Icon: Calendar (blue)
- Label: "Schedule Report"

**Action 4: Advanced Settings**
- Icon: Settings (purple)
- Label: "Advanced Settings"

**UI Elements:**
- Card container
- Title: "Quick Actions"
- Description
- 4-column grid
- Button containers
- Icons
- Labels

---

## 8. Common Features Across All Pages

### 8.1 Sidebar Navigation
**Available on:** All dashboard pages

**Features:**
- Logo with branding
- Navigation menu
- Active route highlighting
- Settings button
- Back to home button
- Mobile responsive (sheet on mobile)

**Navigation Items:**
- Dashboard
- Budget Planner
- Transactions
- Reports & Insights
- Goals
- Alerts & Notifications

### 8.2 Mobile Responsiveness
**Available on:** All pages

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile Features:**
- Hamburger menu button
- Slide-out sidebar (sheet component)
- Stacked layouts
- Full-width cards
- Touch-friendly buttons

### 8.3 Dark Mode Support
**Available on:** All pages

**Features:**
- Dark mode classes
- Color inversion
- Background color changes
- Text color changes
- Border color changes
- Automatic/system detection
- Manual toggle in settings

### 8.4 Settings Dialog
**Available on:** All dashboard pages

**Features:**
- Tab navigation
- General settings (currency, language)
- Appearance settings (theme)
- Account settings (export, delete)
- Accessible from sidebar

### 8.5 Header Pattern
**Available on:** All dashboard pages

**Features:**
- Hamburger menu (mobile)
- Page title
- Subtitle/description
- Action buttons (page-specific)
- Consistent styling

---

## 9. Feature Comparison Matrix

| Feature Category | Landing | Dashboard | Budget | Transactions | Reports | Goals | Alerts |
|-----------------|---------|-----------|--------|--------------|---------|-------|--------|

### Navigation & Layout
| Sidebar Navigation | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Mobile Menu | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Breadcrumbs | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Footer | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Content Display
| Static Content | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dynamic Data | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Data Tables | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cards/Widgets | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Charts & Visualization
| Bar Charts | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Pie Charts | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Line Charts | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Progress Bars | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Metrics/Stats | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Data Management
| Create/Add | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Read/View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Update/Edit | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Delete | ❌ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Bulk Actions | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

### Search & Filter
| Search | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Category Filter | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Type Filter | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Sort | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Time Range | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### Export & Reports
| Export Data | ❌ | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Download Report | ❌ | ✅ (btn) | ❌ | ❌ | ✅ | ❌ | ❌ |
| Print | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

### User Interaction
| Forms | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| Dialogs/Modals | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Toggles/Switches | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Dropdowns | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ |

### AI & Insights
| Recommendations | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Tips/Education | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| Health Score | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### Settings & Configuration
| Page Settings | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Currency | ✅ (display) | ✅ (set) | ✅ (display) | ✅ (display) | ✅ (display) | ✅ (display) | ✅ (display) |
| Language | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Theme | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Notifications
| Alert Badges | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Unread Count | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Status Indicators | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |

---

## Summary Statistics

### Total Features by Page:
| Page | Feature Count |
|------|---------------|
| Landing | 25 |
| Dashboard | 35 |
| Budget | 18 |
| Transactions | 15 |
| Reports | 20 |
| Goals | 22 |
| Alerts | 19 |

### Total UI Components Used:
- Cards: ~50 instances
- Buttons: ~80 instances
- Icons: ~100+ instances
- Charts: 5 instances
- Tables: 3 instances
- Forms: 10 instances
- Dialogs: 3 instances

### Interactive Elements:
- Click handlers: ~60
- Form inputs: ~40
- Toggles: ~10
- Dropdowns: ~15
- Date pickers: ~5

---

*Report generated on: March 22, 2026*
