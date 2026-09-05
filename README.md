# 🌸 Floral K — Luxury Flower Shop E-Commerce & POS Web Application

> **Floral K** is an eye-catching, high-converting flower shop e-commerce platform and complete Point-of-Sale (POS) web application designed to capture customer attention immediately and streamline the full florist operational cycle across **Customer**, **Admin / Florist & POS**, **Owner**, and **Super Admin** roles.

---

## 🌟 Key Highlights & Attention-Maximizing Features

1. **30-Second Quick-Buy Concierge**:
   - Customers don't linger for long without immediate clarity. The homepage features a 3-step decision concierge: *Select Occasion &rarr; Target Budget &rarr; Delivery Timing* with 1-click matching to eliminate purchase hesitation.
2. **High-Impact Visual Aesthetic**:
   - Deep emerald (`#0F382A`), warm blush petals (`#E8927C`), gold accents (`#D4AF37`), luxury serif typography (*Playfair Display*) and romantic script calligraphy (*Alex Brush*).
3. **Complimentary Handwritten Gift Card Note with Live Script Preview**:
   - Customers compose personalized messages with an instant gold-ink calligraphy card preview.
4. **Fast-Buy Slide-Out Express Bag & Checkout**:
   - Slide-over drawer with free shipping progress bar, delivery slot selector, coupon engine (`FLORAL10`), and confetti celebration upon ordering.
5. **Real-Time Live Order Tracking (`/track`)**:
   - Public tracking endpoint and visual timeline: *Order Placed &rarr; Florist Arranging &rarr; Ready for Dispatch &rarr; Out for Courier Delivery &rarr; Delivered*.
6. **Complete Counter POS Terminal (`/pos`)**:
   - Touch-friendly register, rapid barcode/SKU scan, cash tender calculator with change due computation, and **printable thermal receipt slip**.
   - Cash register session controls (open/close register with float discrepancy reporting).
7. **Florist Studio Kanban Fulfillment Board (`/orders`)**:
   - Visual pipeline with 1-click status advancement and printable florist assembly work orders.
8. **Owner Executive Dashboard (`/owner`)**:
   - Financial KPIs (Gross Revenue, Total Orders, Average Order Value, Gross Profit & Profit Margin %).
   - Sales breakdown by channel (Web vs POS) and best-selling bouquet leaderboard.
   - Promotional discount code manager.
9. **Super Admin Platform Portal (`/superadmin`)**:
   - User directory with 1-click role promotions/demotions.
   - Global parameters editor (tax rate, delivery fees, thresholds).
   - Immutable security audit activity trail.
10. **Interactive System Role Simulator**:
    - Sticky top toolbar allowing instant 1-click switching between Customer, Admin/POS, Owner, and Super Admin roles.

---

## 🔑 Demo Accounts & Pre-Seeded Roles

All demo accounts are pre-seeded in the database and available for instant 1-click login on the web app:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Super Admin** | Elena Vance | `superadmin@floralk.com` | `SuperAdmin123!` |
| **Owner** | Klara Kensington | `owner@floralk.com` | `Owner123!` |
| **Admin / Florist / POS** | Liam Rivera | `admin@floralk.com` | `Admin123!` |
| **Customer** | Sophia Miller | `customer@example.com` | `Customer123!` |

---

## 🏗️ Architecture & Tech Stack

- **Backend**:
  - Node.js & Express with TypeScript
  - SQLite database (`better-sqlite3`) with WAL mode and atomic transactions
  - JWT Authentication & Role-Based Access Control (RBAC)
  - Jest & Supertest automated test suite (29/29 passing tests)
- **Frontend**:
  - React 19 with TypeScript & Vite
  - Tailwind CSS v4
  - Lucide React luxury icons
  - Canvas-Confetti micro-interactions

---

## 🚀 Running the Project

### 1. Backend Server
```powershell
cd "C:\Users\Mark Wilson\.gemini\antigravity\scratch\floral-k\server"
npm run build
npm start
# Server listens on http://localhost:5000
```

### 2. Automated Tests (Backend)
```powershell
cd "C:\Users\Mark Wilson\.gemini\antigravity\scratch\floral-k\server"
npm test
```
*Executes all 5 test suites covering Auth & RBAC, Catalog, Web Checkout, POS Transactions, and Analytics.*

### 3. Frontend Web Application
```powershell
cd "C:\Users\Mark Wilson\.gemini\antigravity\scratch\floral-k\client"
npm run dev
# Frontend runs on http://localhost:5173
```
