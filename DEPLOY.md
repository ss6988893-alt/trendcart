# Deploy TrendCart

## Local run

1. Copy `.env.example` to `.env`.
2. Set your MySQL and Razorpay values.
3. Start the app with:

```bash
npm start
```

4. Open `http://localhost:5000`.

## Required environment variables

- `PORT`
- `NODE_ENV`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `SESSION_SECRET`
- `APP_BASE_URL`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Default admin bootstrap

On startup, the app ensures an admin account exists. You can control it with:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

If you do not override them, the fallback admin is:

- email: `admin@trendcart.com`
- password: `Admin@123`

Change these values before production deployment.

## Railway deployment

1. Push the project to GitHub.
2. Create a Railway project and add the GitHub repo as a service.
3. Add a MySQL service in the same Railway project.
4. Set these app variables in Railway:
   - `NODE_ENV=production`
   - `SESSION_SECRET`
   - `APP_BASE_URL`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
5. Railway MySQL variables are also supported automatically:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

The app already exposes `/api/health` for a simple deployment smoke check.

## Production notes

- Use a strong `SESSION_SECRET`.
- Replace the default admin credentials.
- Use your deployed HTTPS URL for `APP_BASE_URL`.
- Keep `.env` out of git.
