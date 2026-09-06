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
    - Sticky top toolbar allowing instant 1-click switching between Customer, Admin/POS, Owner, and Super Admin roles without logging in and out.

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
  - Jest & Supertest automated test suite
- **Frontend**:
  - React 19 with TypeScript & Vite
  - Tailwind CSS v4
  - Lucide React luxury icons
  - Canvas-Confetti micro-interactions

---

## 📋 Prerequisites

Before running this project on a new PC, make sure you have installed:

1. **[Git](https://git-scm.com/)**
   - Verify with: `git --version`
2. **[Node.js](https://nodejs.org/) (LTS recommended: v18, v20, or v22)** and **npm**
   - Verify with: `node -v` and `npm -v`
   - *Tip*: Using a Node.js LTS release ensures pre-compiled binaries for SQLite (`better-sqlite3`) install immediately without needing Python or C++ compiler toolchains.
3. **[Visual Studio Code](https://code.visualstudio.com/)**

---

## 🚀 Getting Started (VS Code Terminal Setup)

Follow these step-by-step instructions to clone and run the application using the integrated terminal in Visual Studio Code.

### Step 1: Clone the Repository

Open your terminal or command prompt and clone the repository:

```bash
git clone https://github.com/markwlsn/Floral-K.git
cd Floral-K
```

### Step 2: Open in Visual Studio Code

Open the project folder inside VS Code:

```bash
code .
```
*(Alternatively: Launch VS Code, click **File > Open Folder...**, and select the cloned `Floral-K` folder).*

---

### Step 3: Open the Integrated Terminal in VS Code

Inside VS Code, open the integrated terminal:
- Shortcut: Press ``Ctrl + ` `` (backtick) or `Ctrl + ~`
- Or via menu: Click **Terminal > New Terminal** in the top menu bar.

---

### Step 4: Install Dependencies

The project contains two packages: `server` (backend API) and `client` (frontend React app). You must install dependencies for both:

#### 1. Install Backend Dependencies
In the VS Code terminal, run:
```bash
cd server
npm install
cd ..
```

#### 2. Install Frontend Dependencies
In the same terminal, run:
```bash
cd client
npm install
cd ..
```

> **Note on Database**: You do **not** need to install or configure any separate database server (such as MySQL or PostgreSQL). The SQLite database (`floral_k.sqlite`) is created and pre-seeded automatically with demo accounts, sample bouquets, and shop settings when the server starts!

---

### Step 5: Run the Project (Dual / Split Terminal)

Because the project runs a backend API server and a frontend development server concurrently, the best workflow in VS Code is to use **Split Terminals**:

1. In VS Code's terminal panel, click the **Split Terminal** icon (or press `Ctrl + Shift + 5` on Windows/Linux, `Cmd + \` on macOS).
2. You will now have two terminals side-by-side.

#### In Terminal 1 (Backend Server):
```bash
cd server
npm run dev
```
- The backend API will start on **`http://localhost:5000`**
- Health check: `http://localhost:5000/api/health`

#### In Terminal 2 (Frontend Client):
```bash
cd client
npm run dev
```
- The frontend will start on **`http://localhost:5173`**
- Vite automatically proxies `/api` calls to `http://localhost:5000`.

---

### Step 6: View the Application

Open your browser and navigate to:
👉 **[http://localhost:5173](http://localhost:5173)**

- You can browse the catalog and place orders immediately as a guest or customer.
- Use the **sticky role switcher bar** at the very top of the page to switch to **Admin / Florist & POS**, **Owner**, or **Super Admin** with a single click, or log in manually using the [demo credentials](#-demo-accounts--pre-seeded-roles).

---

## 🧪 Running Automated Tests

Both backend and frontend include test suites.

### Backend Tests (Jest & Supertest)
Runs 5 test suites covering Auth & RBAC, Catalog, Web Checkout, POS Transactions, and Analytics:
```bash
cd server
npm test
```

### Frontend Tests (Vitest)
```bash
cd client
npm test
```

---

## 📦 Production Build

To build and run the production bundles:

### Build Backend
```bash
cd server
npm run build
npm start
```

### Build Frontend
```bash
cd client
npm run build
npm run preview
```

---

## 📁 Project Directory Structure

```text
Floral-K/
├── client/                 # Frontend React 19 + TypeScript + Vite Application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # UI components, modals, navigation, cart, POS, role simulator
│   │   ├── context/        # Auth & Cart State Providers
│   │   ├── pages/          # Home, Shop, POS, Tracking, Dashboard, Admin views
│   │   ├── services/       # API client calls
│   │   └── types/          # Shared TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts      # Vite configuration & backend proxy
│
├── server/                 # Backend Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── controllers/    # Request handlers (auth, products, orders, pos, etc.)
│   │   ├── db/             # SQLite connection & database seeder
│   │   ├── middleware/     # JWT authentication & RBAC middleware
│   │   ├── routes/         # Express routing definitions
│   │   ├── app.ts          # Express application setup
│   │   └── index.ts        # Server entry point & DB bootstrap
│   ├── tests/              # Jest test suites
│   ├── package.json
│   └── tsconfig.json
│
└── README.md               # Project documentation & setup instructions
```

---

## 🛠️ Common Troubleshooting

### 1. `npm : File ... cannot be loaded because running scripts is disabled on this system` (Windows PowerShell)
- **Cause**: Windows PowerShell restricts running scripts by default.
- **Solution**: Run this command once in your PowerShell or VS Code terminal:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
  ```
  Or, click the dropdown arrow next to the `+` icon in the VS Code terminal panel and switch your shell to **Command Prompt (cmd)** or **Git Bash**.

### 2. `better-sqlite3` installation error during `npm install`
- **Cause**: You may be using a cutting-edge or non-LTS Node.js version where prebuilt binaries have not yet been released.
- **Solution**: Switch to an **LTS release of Node.js** (such as Node 20 LTS or Node 22 LTS). Prebuilt binaries will install automatically without requiring Microsoft Visual Studio C++ build tools.

### 3. Port `5000` or `5173` is already in use
- **Backend (Port 5000)**: Change the port by creating a `.env` file in the `server/` directory:
  ```env
  PORT=5001
  ```
  *(If you change this, also update `target` in `client/vite.config.ts` to match).*
- **Frontend (Port 5173)**: Vite will automatically offer or select the next available port (e.g., `5174`).

### 4. API calls fail with Network Error / CORS
- Verify that the backend server in `server/` is running and healthy at `http://localhost:5000/api/health` before browsing the frontend.

---

## 📄 License

This project is licensed under the [ISC License](LICENSE).

