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

The repo also includes `railway.json` so Railway can use the app start command and health check automatically.

## Render deployment

1. Push the project to GitHub.
2. Create a new Blueprint in Render using this repository.
3. Render will read `render.yaml` and create the Node web service.
4. Provide these environment variables for the web service:
   - `APP_BASE_URL`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`

Render will use `/api/health` for the health check path.

## Vercel deployment

1. Push the project to GitHub.
2. Open Vercel and import the GitHub repo.
3. Select the `master` branch.
4. Keep the detected Node.js setup.
5. Set these environment variables in Vercel:
   - `NODE_ENV=production`
   - `SESSION_SECRET`
   - `APP_BASE_URL=https://your-vercel-app.vercel.app`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
6. Deploy the project.
7. Open `/api/health` on the Vercel URL to confirm the API can reach MySQL.

The project includes:

- `api/index.js` for Vercel's serverless API entry.
- `vercel.json` to route `/api/*` requests to the Express app.
- `npm run vercel-build` to copy the HTML pages and assets into `public/` for Vercel static hosting.

Important Vercel notes:

- `DB_HOST` must be an online MySQL host. Your PC's `localhost` MySQL will not work on Vercel.
- Admin image uploads that write to `uploads/` are not permanent on serverless hosting. For production, move uploads to Vercel Blob or another object storage provider.
- Serverless sessions can be less stable than a traditional always-running server. For production, use a persistent session store.

## Production notes

- Use a strong `SESSION_SECRET`.
- Replace the default admin credentials.
- Use your deployed HTTPS URL for `APP_BASE_URL`.
- Keep `.env` out of git.
