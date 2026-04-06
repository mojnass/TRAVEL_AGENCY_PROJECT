import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Plane, Hotel, Utensils, Ticket, Sparkles, ClipboardList, Loader, AlertCircle, X } from 'lucide-react';
import { bookingService } from '../lib/bookingService';
import { notificationService } from '../lib/notificationService';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [bookings, setBookings] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingStates, setCancellingStates] = useState({});

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        setError('');
        
        // Load user bookings
        const userBookings = await bookingService.getUserBookings(user.id);
        setBookings(userBookings || []);
        
        // Load unread notifications count
        const unreadNotifications = await notificationService.getUnreadCount(user.id);
        setUnreadCount(unreadNotifications);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const handleCancelBooking = async (bookingId) => {
    setCancellingStates(prev => ({ ...prev, [bookingId]: true }));
    
    try {
      // Cancel the booking
      await bookingService.cancelBooking(bookingId, user.id);
      
      // Send cancellation notification
      await notificationService.sendBookingCancellation(user.id, bookingId);
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.booking_id === bookingId 
          ? { ...booking, status: 'cancelled' }
          : booking
      ));
      
      // Update unread notifications
      const newUnreadCount = await notificationService.getUnreadCount(user.id);
      setUnreadCount(newUnreadCount);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to cancel booking');
    } finally {
      setCancellingStates(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const tabs = [
    { id: 'all', label: 'All Bookings', icon: ClipboardList },
    { id: 'flights', label: 'Flights', icon: Plane },
    { id: 'hotels', label: 'Hotels', icon: Hotel },
    { id: 'restaurants', label: 'Restaurants', icon: Utensils },
    { id: 'attractions', label: 'Attractions', icon: Ticket },
    { id: 'spa', label: 'Spa', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Patronus</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{user?.email}</span>
            </div>
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <User className="w-6 h-6 text-slate-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-100 rounded-lg transition text-red-600"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">My Bookings</h2>
          <p className="text-slate-600">Manage and view all your travel bookings</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-slate-600">Loading your bookings...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
              <div className="flex overflow-x-auto border-b border-slate-200">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const bookingCount = activeTab === 'all' 
                    ? bookings.length 
                    : bookings.filter(b => b.booking_type === tab.id.slice(0, -1)).length;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-6 py-4 font-medium text-sm flex items-center gap-2 whitespace-nowrap border-b-2 transition ${
                        activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {bookingCount > 0 && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                      {bookingCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-8">
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No bookings yet</h3>
                <p className="text-slate-600 mb-6">Start booking your travels to see them here</p>
                <button
                  onClick={() => navigate('/')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  <Plane className="w-5 h-5" />
                  Explore Services
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings
                  .filter(booking => 
                    activeTab === 'all' || 
                    booking.booking_type === activeTab.slice(0, -1)
                  )
                  .map(booking => (
                    <BookingCard 
                      key={booking.booking_id} 
                      booking={booking} 
                      onCancel={handleCancelBooking}
                    />
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <StatCard label="Total Bookings" value={bookings.length} />
          <StatCard 
            label="Upcoming Trips" 
            value={bookings.filter(b => 
              new Date(b.start_date) >= new Date() && 
              b.status !== 'cancelled'
            ).length} 
          />
          <StatCard 
            label="Unread Notifications" 
            value={unreadCount} 
          />
        </div>
          </>
        )}
      </div>
    </div>
  );
};

const BookingCard = ({ booking, onCancel }) => {
  const getBookingIcon = (type) => {
    const icons = {
      flight: Plane,
      hotel: Hotel,
      restaurant: Utensils,
      attraction: Ticket,
      spa: Sparkles
    };
    const Icon = icons[type] || ClipboardList;
    return <Icon className="w-5 h-5" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-50',
      confirmed: 'text-green-600 bg-green-50',
      cancelled: 'text-red-600 bg-red-50',
      completed: 'text-blue-600 bg-blue-50'
    };
    return colors[status] || colors.pending;
  };

  const isCancellable = booking.status !== 'cancelled' && booking.status !== 'completed';

  return (
    <div className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getBookingIcon(booking.booking_type)}
          <div>
            <h4 className="font-semibold text-slate-900 capitalize">
              {booking.booking_type} Booking
            </h4>
            <p className="text-sm text-slate-600">
              {new Date(booking.start_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
          {booking.status}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold text-slate-900">
          ${booking.total_price}
        </p>
        <div className="flex items-center gap-2">
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
            View Details
          </button>
          {isCancellable && (
            <button
              onClick={() => onCancel(booking.booking_id)}
              disabled={cancellingStates[booking.booking_id]}
              className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center gap-1"
            >
              {cancellingStates[booking.booking_id] ? (
                <>
                  <Loader className="w-3 h-3 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="w-3 h-3" />
                  Cancel
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
    <p className="text-sm text-slate-600 mb-2">{label}</p>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
  </div>
);

export default DashboardPage;
