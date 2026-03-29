# TrendCart

TrendCart is a full-stack web application that brings together three user flows in one project:

- product shopping
- food ordering
- movie ticket booking

It is built with Node.js, Express, MySQL, session-based authentication, and Razorpay payment integration.

## Features

- User registration and login with name, email, and password
- Product catalog with categories, search, cart, and checkout
- Food ordering flow with hotel-based menus
- Movie booking with seat selection and seat locking
- Razorpay payment integration
- Admin dashboard with CRUD tools and analytics
- Order tracking and movie ticket history

## Tech Stack

- Node.js
- Express
- MySQL
- HTML, CSS, JavaScript
- Razorpay

## Project Structure

```text
.
├── Assests/
│   ├── Foods/
│   ├── movies/
│   ├── products/
│   └── api.js
├── data/
│   └── catalog.js
├── uploads/
├── server.js
├── index.html
├── Product.html
├── Food.html
├── Movies.html
├── Payment.html
├── Admin.html
└── README.md
```

## Run Locally

### 1. Clone the repository

```powershell
git clone https://github.com/ss6988893-alt/trendcart.git
cd trendcart
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Create the environment file

```powershell
Copy-Item .env.example .env
```

Then update `.env` with your own values.

Example:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=trendcart
SESSION_SECRET=replace_with_a_long_random_secret
APP_BASE_URL=http://localhost:5000
ADMIN_NAME=TrendCart Admin
ADMIN_EMAIL=admin@trendcart.com
ADMIN_PASSWORD=Admin@123
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 4. Make sure MySQL is running

The app creates the database, tables, seed data, and default admin account automatically on startup.

### 5. Start the server

```powershell
npm start
```

If port `5000` is already used on your machine, run on another port:

```powershell
$env:PORT=5050
node server.js
```

### 6. Open the app

- Home: `http://localhost:5000`
- Products: `http://localhost:5000/Product.html`
- Food: `http://localhost:5000/Food.html`
- Movies: `http://localhost:5000/Movies.html`

## Default Admin

If you keep the default admin values:

- Email: `admin@trendcart.com`
- Password: `Admin@123`

Change these before real deployment.

## Payment Notes

- Razorpay is the only payment option in this project.
- Use Razorpay **test keys** for safe local testing.
- If you use **live keys**, real money can be charged.

## Deployment

This repository includes deployment config for:

- Railway: `railway.json`
- Render: `render.yaml`

The app needs:

- a running Node.js server
- a MySQL database
- valid environment variables

GitHub Pages alone cannot run this project because it requires a backend and database.

## Main Pages

- `index.html` - landing page
- `Product.html` - product catalog
- `Food.html` - food ordering
- `Movies.html` - movie booking
- `Payment.html` - Razorpay checkout
- `Admin.html` - admin dashboard

## Repository

- GitHub: https://github.com/ss6988893-alt/trendcart

