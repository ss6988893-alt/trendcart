# TrendCart

TrendCart is a full-stack shopping, food ordering, and movie booking project built with:

- Node.js
- Express
- MySQL
- Razorpay

## Run From GitHub On Your PC

### 1. Clone the repository

```powershell
git clone https://github.com/ss6988893-alt/trendcart.git
cd trendcart
```

### 2. Install dependencies

```powershell
npm install
```

### 3. Create your `.env` file

Copy `.env.example` to `.env`.

In PowerShell:

```powershell
Copy-Item .env.example .env
```

Then open `.env` and update these values:

```env
PORT=5000
NODE_ENV=development
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

## 4. Make sure MySQL is running

This project needs a local MySQL server.

The app will automatically:

- create the `trendcart` database if needed
- create the required tables
- seed the product, food, and movie data
- ensure an admin account exists

## 5. Start the app

```powershell
npm start
```

Or for watch mode:

```powershell
npm run dev
```

## 6. Open the app

Open:

[http://localhost:5000](http://localhost:5000)

## Default admin login

If you keep the default admin values from `.env.example`, use:

- Email: `admin@trendcart.com`
- Password: `Admin@123`

Change these before using the app in production.

## Important notes

- GitHub Pages cannot run this project because it needs a Node.js backend and MySQL.
- Razorpay should use test keys for safe local testing.
- The `uploads/` folder is runtime-generated and ignored by git.

## Scripts

- `npm start` - start the server
- `npm run dev` - start the server in watch mode

## Node version

Recommended:

- Node.js `20` to `25`
