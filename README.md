# Patronus Travel Agency

A modern, full-featured travel booking web application built with React, Vite, and Supabase.

## Features

- **Flight Search & Booking** - Search flights between destinations (Dubai, Paris, Beirut) with seat selection and payment
- **Hotel Search & Booking** - Find and book hotels with real-time availability
- **Restaurant Reservations** - Browse restaurants by cuisine and location
- **Attractions & Tours** - Discover and book local attractions
- **Spa & Wellness** - Book spa treatments and wellness services
- **Travel Bundles** - Pre-packaged deals with discounts (Dubai Luxury, Paris Romance, Beirut Discovery)
- **Shopping Cart** - Add multiple items and checkout together
- **User Dashboard** - View bookings, notifications, itineraries, and manage profile
- **PDF E-Tickets** - Generate and download tickets for flights and services

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **State Management:** React Context (Auth, Cart)
- **Routing:** React Router v6
- **Storage:** LocalStorage for client-side persistence (bookings, notifications, bundles)

## Quick Start

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your Supabase credentials to `.env`
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173)

## Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

The application uses Supabase with the following tables:
- `hotels` - Hotel listings with rooms and amenities
- `restaurants` - Restaurant listings with cuisine types
- `spa_services` - Spa venues and services
- `attractions` - Tourist attractions and tours
- `airports` - Airport data for flight search

**Note:** Bookings, notifications, and bundles are stored in browser LocalStorage for demo purposes (no backend API required).

## Available Destinations

Currently supported cities with complete data:
- **Dubai, UAE** (DXB) - Hotels, restaurants, spa, attractions, flights
- **Paris, France** (CDG) - Hotels, restaurants, spa, attractions, flights
- **Beirut, Lebanon** (BEY) - Hotels, restaurants, spa, attractions, flights

## Project Structure

```
src/
├── components/           # React components
│   ├── SearchComponent.jsx
│   ├── ResultsDisplay.jsx
│   ├── FlightBookingModal.jsx
│   ├── CartComponent.jsx
│   └── ...
├── pages/               # Route pages
│   ├── HomePage.jsx
│   ├── SearchPage.jsx
│   ├── DashboardPage.jsx
│   └── ...
├── lib/                 # Service libraries
│   ├── supabase.js
│   ├── hotelService.js
│   ├── flightService.js
│   ├── bookingService.js
│   └── ...
├── context/             # React contexts
│   ├── AuthContext.jsx
│   └── CartContext.jsx
├── data/                # Static data
│   └── airports.js
└── App.jsx              # Main app component
```

## Key Features Explained

### Flight Booking Flow
1. Search flights between available airports
2. Select flight from results
3. Enter passenger details
4. Choose seat from interactive seat map
5. Add extras (checked bag, premium meal)
6. Enter payment details
7. Download e-ticket PDF

### Travel Bundles
Pre-configured packages with automatic discounts:
- **Dubai Luxury Experience** - 5-star hotel + fine dining + spa + VIP attractions
- **Paris Romance Package** - Boutique hotel + candlelit dinner + Seine cruise
- **Beirut Discovery** - Cultural exploration with authentic Lebanese experiences

### Dashboard
User dashboard includes:
- Booking history with status tracking
- Real-time notifications
- Saved itineraries/bundles
- Profile management
- Return home navigation

## Mock Data & Testing

All services work without a backend API:
- **Flights** - Mock flight generation with realistic pricing
- **Bookings** - Stored in LocalStorage
- **Notifications** - Client-side notification system
- **Bundles** - Pre-defined sample packages

### Test Payment Card
Use this test card for payments:
- **Card:** `4111111111111111` (Visa)
- **Expiry:** Any future date (MM/YY format)
- **CVV:** Any 3 digits

To test payment failure, use: `4000000000000002`

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Adding New Destinations

To add a new city:
1. Add city data to `src/data/airports.js`
2. Add destination to Supabase tables (hotels, restaurants, etc.)
3. Update flight routes in `flightService.js`

## License

MIT License - feel free to use for personal or commercial projects.

## Author

Built with modern web technologies for a seamless travel booking experience.
