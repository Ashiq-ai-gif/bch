# Deployment Guide

Follow these steps to deploy your application to Vercel.

## 1. Vercel Deployment

1.  Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
2.  Import the repository: `Ashiq-ai-gif/bch`.
3.  In the **Configure Project** section:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `./` (default)
    *   **Build Command**: `npm run build` (default) or `bun run build`
    *   **Output Directory**: `dist` (default)
    *   **Install Command**: `npm install` (default) or `bun install`

## 2. Environment Variables

You must configure the following Environment Variables in Vercel **BEFORE** clicking Deploy (or add them in Settings later and redeploy).

| Variable Name | Description | Value (Copy from your local .env) |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Check your `.env` file | `https://weruhmrdtlsrbzlwnakz.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Check your `.env` file | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (copy full key) |

## 3. Supabase Edge Functions (AI Features)

Your project uses Supabase Edge Functions for AI analysis (`ai-analysis` function).

1.  Go to your Supabase Dashboard -> **Edge Functions**.
2.  Ensure you have deployed the functions:
    ```bash
    supabase functions deploy ai-analysis --no-verify-jwt
    ```
3.  Set the secrets for the function:
    ```bash
    supabase secrets set GEMINI_API_KEY="your-gemini-api-key"
    ```
    *(Note: The code currently defaults to a hardcoded key if not found, but it's best practice to set it properly.)*

## 4. Database & Migrations

Ensure your Supabase database is up to date with the migrations in `supabase/migrations`.
If you haven't applied them:
```bash
supabase db push
```
