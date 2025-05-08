# Degion.xyz - Legion ICO Performance Tracker

This project tracks the performance of Legion ICO tokens, providing up-to-date information on token prices, ROI, and other key metrics.

## Features

- Track live token prices for launched tokens
- View historical ICO data
- Community sentiment tracking
- Discussion forums for each token
- Daily updates from Legion API

## API Integration

The site uses a Supabase Edge Function to fetch data from Legion's API daily. This ensures that the information stays up-to-date with minimal manual intervention.

### Setting up Legion API Integration

To enable the Legion API integration, you'll need to:

1. Obtain a Legion bearer token by:
   - Logging into Legion.cc
   - Opening Developer Tools in Chrome (Ctrl+Shift+I)
   - Going to the Network tab and filtering for "round"
   - Finding the Authorization header in any request
   
2. Add the token to Supabase:
   - Go to your Supabase project settings
   - Navigate to "API" > "Auth"
   - Add a new secret: `LEGION_BEARER_TOKEN` with your token value
   - Add another secret: `LEGION_ADMIN_KEY` with a secure random string (for admin access)

3. Deploy the edge function:
   - Supabase automatically deploys edge functions
   - Test by visiting: `https://[your-project-ref].supabase.co/functions/v1/fetch-legion-data?admin_key=[your-admin-key]`

4. Set up a daily cron job using a service like cron-job.org to call the edge function endpoint

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Technologies Used

- React + TypeScript
- Tailwind CSS
- Supabase for backend
- Vite for development