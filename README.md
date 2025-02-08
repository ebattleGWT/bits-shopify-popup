# Shopify Popup App

A powerful and flexible Shopify app for creating, managing, and analyzing customizable popups for your store. Built with Remix, Prisma, and Shopify's App Bridge.

## Features

### Popup Management
- Create and manage multiple popups
- Rich customization options:
  - Position (Top, Bottom, Left, Right, Center)
  - Theme (Light, Dark, Custom)
  - Animation effects (Fade, Slide, Bounce)
  - Scheduling with start/end dates
  - Display frequency (Always, Once, Daily, Weekly)
  - Delay timing

### Advanced Targeting
- Device-based targeting (Mobile, Desktop, Tablet)
- Page-specific targeting
- Geographic targeting by country
- Custom scheduling and timing

### Analytics Dashboard
- Real-time performance metrics
  - Impressions
  - Clicks
  - Conversions
  - Close rates
- Performance over time charts
- Device breakdown
- Geographic insights
- Page performance analysis
- Recent events tracking

### Technical Features
- Automatic script installation
- Background health checks
- Webhook management
- Event tracking and analytics
- Secure session handling

## Tech Stack

- **Frontend**: React, Remix, Polaris (Shopify's design system)
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Prisma ORM
- **Analytics**: React Google Charts
- **Development**: TypeScript, ESLint

## Prerequisites

- Node.js (v16 or later)
- PostgreSQL database
- Shopify Partner account
- Shopify development store

## Environment Setup

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/popup_db"
SHOPIFY_API_KEY="your_api_key"
SHOPIFY_API_SECRET="your_api_secret"
SCOPES="write_script_tags,read_script_tags"
APP_URL="https://your-app-url.com"
CRON_SECRET="your_cron_secret"
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/bits-shopify-popup.git
cd bits-shopify-popup
```

2. Install dependencies:
```bash
npm install
```

3. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

4. Start the development server:
```bash
npm run dev
```

## Development Guidelines

### File Structure
- `/app/routes/` - All app routes and API endpoints
- `/app/services/` - Business logic and services
- `/prisma/` - Database schema and migrations
- `/public/` - Static assets

### Key Components
- `app.popups.$id.tsx` - Popup edit interface
- `api.script.tsx` - Client-side popup script
- `api.events.tsx` - Event tracking endpoint
- `api.analytics.tsx` - Analytics data endpoint

### Adding New Features
1. Update Prisma schema if needed
2. Create/modify routes in `/app/routes/`
3. Add business logic in `/app/services/`
4. Update client script in `api.script.tsx` if needed

### Testing
1. Run linting:
```bash
npm run lint
```

2. Test in development store:
```bash
npm run dev
```

### Deployment
1. Build the app:
```bash
npm run build
```

2. Deploy to your hosting platform
3. Set up environment variables
4. Run database migrations

## Maintenance

### Background Tasks
The app includes automatic maintenance tasks:
- Script installation verification
- Webhook registration checks
- Session cleanup

### Monitoring
Monitor the following:
- Script installation status
- Webhook registration status
- Database performance
- Event tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT

## Support

For support, please [create an issue](https://github.com/ebattleGWT/bits-shopify-popup/issues) or contact [emmanuel@battleitsolutions.com].
