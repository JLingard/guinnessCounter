# Tap Counter

A mobile-first React application for logging repeated tap events. Designed for one-handed use with optimistic UI updates and graceful error handling.

## Features

- **First-visit onboarding**: Users enter their name (stored in localStorage)
- **Full-screen tap button**: Large, accessible tap target for easy one-handed use
- **Optimistic updates**: Counter increments immediately for responsive feel
- **Error recovery**: Automatic rollback on network failure with retry hints
- **Demo mode**: Works without a backend for testing

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd tap-counter

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Configuration

Create a `.env.local` file in the project root:

```env
# API endpoint for logging tap events
# POST requests will be sent with JSON body: { "name": "<user name>" }
# Leave empty for demo mode
VITE_API_ENDPOINT=https://your-api-endpoint.com/events
```

If no endpoint is configured, the app runs in demo mode with simulated network delays.

## API Contract

The app sends POST requests to the configured endpoint:

```
POST {VITE_API_ENDPOINT}
Content-Type: application/json

{
  "name": "John"
}
```

Expected response: `200 OK` (response body is ignored)

## Development

```bash
# Start dev server with hot reload
npm run dev

# Type checking
npm run build

# Preview production build
npm run preview
```

## Deployment

### GitHub Pages

1. Update `vite.config.ts`:
   ```ts
   export default defineConfig({
     base: '/your-repo-name/',
     plugins: [react()],
   })
   ```

2. Build and deploy:
   ```bash
   npm run build
   # Deploy the 'dist' folder to GitHub Pages
   ```

3. Or use GitHub Actions:
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to GitHub Pages
   on:
     push:
       branches: [main]
   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
         - run: npm ci
         - run: npm run build
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./dist
   ```

### Netlify

1. Connect your repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_ENDPOINT`

Or use the Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

## Project Structure

```
src/
├── main.tsx              # App entry point
├── App.tsx               # Root component with routing logic
├── index.css             # Global styles and CSS variables
├── vite-env.d.ts         # TypeScript env declarations
└── components/
    ├── NameEntry.tsx     # First-visit name input screen
    ├── NameEntry.module.css
    ├── CounterButton.tsx # Main tap counter screen
    └── CounterButton.module.css
```

## Tech Stack

- React 18 with TypeScript
- Vite
- CSS Modules
- No external UI libraries

## License

MIT
