# Deploy TrendCart

## GitHub

1. Create an empty GitHub repository.
2. Push this project to that repository.

## Railway

This project is prepared for Railway deployment.

### Web service

1. Create a new Railway project.
2. Add a service from the GitHub repository.
3. Railway should detect the Node app and run `npm start`.

### MySQL service

1. In the same Railway project, add a MySQL database service.
2. Railway provides these variables to the app service:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`
3. The backend already supports those variables.

### Public URL

1. Generate a Railway public domain for the web service.
2. The app can use `RAILWAY_PUBLIC_DOMAIN` automatically for QR ticket links.

## Razorpay

After deployment, use the Railway public URL for Razorpay onboarding.

Then set these variables in Railway or local `.env`:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

## Local secrets

Do not commit `.env`.
