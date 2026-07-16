# Website Defacement Detection & Vulnerability Assessment Platform

A production-ready MVP for a 6-hour hackathon project. This platform allows security professionals and website administrators to monitor websites for unauthorized content changes (defacement), run automated security checks on response headers, and generate AI-powered vulnerability recommendations using Gemini.

## Features
- **User Authentication**: Secure Login, Registration, and Session management via Supabase.
- **Website Management**: CRUD interface to register, modify, and delete monitored websites.
- **Website Scanning Engine**:
  - Fetches HTML contents, status codes, response times, and HTTP response headers.
- **Defacement Detection**:
  - Title and HTML content comparison.
  - Identification of added/removed elements and suspicious text (e.g. keywords like "hacked by", "pwned").
  - Rich side-by-side diff viewer.
- **Vulnerability Checks**:
  - Validates HTTPS, HSTS, Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, and Permissions-Policy headers.
  - Computes a quantitative risk score.
- **AI Analysis**:
  - Integrates Gemini API to analyze headers, content, and scans for context-aware security insights, risk mitigation advice, and rating justification.
- **Alerting & Notification**:
  - Generates instant alerts for defacement detection, critical vulnerabilities (Risk > 70), missing HTTPS, or missing security headers.
- **Audit Logs**:
  - Logs critical actions (website management, scans, logins) for compliance and security audit trails.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS v3, React Router, Axios, Supabase Client JS.
- **Backend**: Node.js, Express, Axios, Cheerio (for HTML parsing), Helmet (security), Express Rate Limit, Express Validator.
- **Database**: Supabase (PostgreSQL with RLS policy protection).
- **AI Integration**: Gemini Pro API.

## Project Structure
- `/backend`: Node.js Express server.
- `/frontend`: React client with Vite.
- `/db_schema.sql`: Database schema definition.

## Setup Instructions

### 1. Database Setup
1. Create a project in [Supabase](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and paste the contents of `db_schema.sql`. Run the query to initialize the tables, indexes, and RLS policies.

### 2. Backend Setup
1. Navigate to `/backend`.
2. Copy `.env.example` to `.env` and fill in:
   - `PORT=5000`
   - `SUPABASE_URL=...`
   - `SUPABASE_SERVICE_ROLE_KEY=...` (found in Project Settings -> API)
   - `GEMINI_API_KEY=...`
3. Run `npm install` to install backend dependencies.
4. Start the server with `npm run dev` (or `node server.js`).

### 3. Frontend Setup
1. Navigate to `/frontend`.
2. Copy `.env.example` to `.env` and fill in:
   - `VITE_SUPABASE_URL=...`
   - `VITE_SUPABASE_ANON_KEY=...` (found in Project Settings -> API -> anon public)
   - `VITE_API_URL=http://localhost:5000/api`
3. Run `npm install` to install frontend dependencies.
4. Start the developer server with `npm run dev`.
