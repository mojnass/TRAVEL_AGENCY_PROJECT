import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { SearchPage } from './pages/SearchPage';
import { AdminPage } from './pages/AdminPage';
import { BundleViewPage } from './pages/BundleViewPage';
import { ItineraryPage } from './pages/ItineraryPage';
import { HotelsPage } from './pages/HotelsPage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { AttractionsPage } from './pages/AttractionsPage';
import { SpaPage } from './pages/SpaPage';
import { FlightsPage } from './pages/FlightsPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/bundle/:shareableLink" element={<BundleViewPage />} />

            {/* Jad Al Btaddini — Hotels, Restaurants, Attractions, Spa */}
            <Route path="/flights" element={<FlightsPage />} />
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/restaurants" element={<RestaurantsPage />} />
            <Route path="/attractions" element={<AttractionsPage />} />
            <Route path="/spa" element={<SpaPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/itineraries"
              element={
                <ProtectedRoute>
                  <ItineraryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/booking-confirmation/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingConfirmationPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
