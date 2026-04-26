import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  LogOut, User, Plane, Hotel, Utensils, Ticket, Sparkles,
  ClipboardList, Loader, AlertCircle, X, Bell, BellOff,
  CheckCircle, Clock, XCircle, ChevronRight, RefreshCw,
  DollarSign, Calendar, Package
} from 'lucide-react';
import { bookingService } from '../lib/bookingService';
import { notificationService } from '../lib/notificationService';

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab]           = useState('all');
  const [bookings, setBookings]             = useState([]);
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const [isLoading, setIsLoading]           = useState(true);
  const [error, setError]                   = useState('');
  const [cancellingStates, setCancellingStates] = useState({});
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeView, setActiveView]         = useState('bookings'); // bookings | notifications

  // ── Load data ──────────────────────────────
  const loadDashboardData = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      setError('');
      const [userBookings, userNotifications, unread] = await Promise.all([
        bookingService.getUserBookings(user.id),
        notificationService.getUserNotifications(user.id, { limit: 20 }),
        notificationService.getUnreadCount(user.id),
      ]);
      setBookings(userBookings     || []);
      setNotifications(userNotifications || []);
      setUnreadCount(unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDashboardData(); }, [loadDashboardData]);

  // ── Actions ───────────────────────────────
  const handleCancelBooking = async (bookingId) => {
    setCancellingStates(prev => ({ ...prev, [bookingId]: true }));
    try {
      await bookingService.cancelBooking(bookingId, user.id);
      await notificationService.sendBookingCancellation(user.id, bookingId);
      setBookings(prev =>
        prev.map(b => b.booking_id === bookingId ? { ...b, status: 'cancelled' } : b)
      );
      setUnreadCount(await notificationService.getUnreadCount(user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel booking');
    } finally {
      setCancellingStates(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleMarkRead = async (notificationId) => {
    await notificationService.markAsRead(notificationId);
    setNotifications(prev =>
      prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(user.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // ── Derived stats ─────────────────────────
  // Ensure bookings is always an array
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const totalSpent   = safeBookings.reduce((s, b) => s + (parseFloat(b.total_price) || 0), 0);
  const upcoming     = safeBookings.filter(b => new Date(b.start_date) >= new Date() && b.status !== 'cancelled');
  const confirmed    = safeBookings.filter(b => b.status === 'confirmed');

  const tabs = [
    { id: 'all',         label: 'All',         icon: ClipboardList },
    { id: 'flights',     label: 'Flights',      icon: Plane },
    { id: 'hotels',      label: 'Hotels',       icon: Hotel },
    { id: 'restaurants', label: 'Restaurants',  icon: Utensils },
    { id: 'attractions', label: 'Attractions',  icon: Ticket },
    { id: 'spa',         label: 'Spa',          icon: Sparkles },
  ];

  const filteredBookings = activeTab === 'all'
    ? safeBookings
    : safeBookings.filter(b => b.booking_type === activeTab.replace(/s$/, ''));

  // ─────────────────────────────────────────
  return (
    <div className="dashboard-sky min-h-screen">
      <DashboardBackdrop />

      {/* ── Navbar ── */}
      <nav className="glass-surface border-b border-white/70 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Plane className="w-7 h-7 text-blue-600" />
            <span className="text-xl font-bold text-slate-900">Patronus</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Itineraries Link */}
            <Link
              to="/dashboard/itineraries"
              className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
            >
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Itineraries</span>
            </Link>
            
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setActiveView('notifications'); }}
                className="relative p-2 hover:bg-slate-100 rounded-lg transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>

            <span className="text-sm text-slate-500 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={() => navigate('/dashboard/profile')}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <User className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg transition text-red-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Dashboard</h1>
            <p className="text-slate-500 mt-1">
              Welcome back, {user?.fullName || user?.email?.split('@')[0]}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-slate-500">Loading your dashboard...</p>
          </div>
        ) : (
          <>
            {/* ── Stats ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={ClipboardList} label="Total Bookings"  value={safeBookings.length}                        color="blue" />
              <StatCard icon={Calendar}      label="Upcoming Trips"  value={upcoming.length}                        color="green" />
              <StatCard icon={CheckCircle}   label="Confirmed"       value={confirmed.length}                       color="indigo" />
              <StatCard icon={DollarSign}    label="Total Spent"     value={`$${totalSpent.toFixed(0)}`}            color="purple" />
            </div>

            {/* ── View toggle ── */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveView('bookings')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeView === 'bookings'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveView('notifications')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  activeView === 'notifications'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Notifications
                {unreadCount > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeView === 'notifications' ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                  }`}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            {/* ── BOOKINGS VIEW ── */}
            {activeView === 'bookings' && (
              <div className="glass-surface rounded-3xl shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] border border-white/80">
                {/* Tabs */}
                <div className="flex overflow-x-auto border-b border-slate-100">
                  {tabs.map(({ id, label, icon: Icon }) => {
                    const count = id === 'all'
                      ? safeBookings.length
                      : safeBookings.filter(b => b.booking_type === id.replace(/s$/, '')).length;
                    return (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                          activeTab === id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                        {count > 0 && (
                          <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-6">
                  {filteredBookings.length === 0 ? (
                    <EmptyState navigate={navigate} />
                  ) : (
                    <div className="space-y-4">
                      {filteredBookings.map(booking => (
                        <BookingCard
                          key={booking.booking_id}
                          booking={booking}
                          onCancel={handleCancelBooking}
                          cancellingStates={cancellingStates}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS VIEW ── */}
            {activeView === 'notifications' && (
              <div className="glass-surface rounded-3xl shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] border border-white/80">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Notifications</h2>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-16">
                    <BellOff className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map(n => (
                      <NotificationRow
                        key={n.notification_id}
                        notification={n}
                        onMarkRead={handleMarkRead}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const iconMap = {
  flight:     Plane,
  hotel:      Hotel,
  restaurant: Utensils,
  attraction: Ticket,
  spa:        Sparkles,
};

const statusConfig = {
  pending:   { label: 'Pending',   bg: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: Clock },
  confirmed: { label: 'Confirmed', bg: 'bg-green-50 text-green-700 border-green-200',    icon: CheckCircle },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle },
  completed: { label: 'Completed', bg: 'bg-blue-50 text-blue-700 border-blue-200',       icon: CheckCircle },
};

const BookingCard = ({ booking, onCancel, cancellingStates }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon   = iconMap[booking.booking_type] || ClipboardList;
  const status = statusConfig[booking.status] || statusConfig.pending;
  const StatusIcon = status.icon;
  const isCancellable = booking.status !== 'cancelled' && booking.status !== 'completed';

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition">
      {/* Card header */}
      <div className="flex items-center gap-4 p-5">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-semibold text-slate-900 capitalize">{booking.booking_type} Booking</h4>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${status.bg}`}>
              <StatusIcon className="w-3 h-3" />
              {status.label}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {booking.start_date
              ? new Date(booking.start_date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
              : 'Date TBD'}
            {booking.booking_id && <span className="ml-2 text-slate-400">#{booking.booking_id.slice(0, 8)}</span>}
          </p>
        </div>

        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold text-slate-900">${parseFloat(booking.total_price || 0).toFixed(2)}</p>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 ml-auto"
          >
            {expanded ? 'Less' : 'Details'}
            <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          {/* Status history timeline */}
          {booking.booking_status_history?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Status History</p>
              <div className="space-y-2">
                {booking.booking_status_history.slice().reverse().map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="capitalize font-medium text-slate-700">{h.status}</span>
                    <span className="text-slate-400 text-xs">
                      {new Date(h.changed_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Passengers */}
          {booking.booking_passengers?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Passengers</p>
              <div className="space-y-1">
                {booking.booking_passengers.map((p, i) => (
                  <p key={i} className="text-sm text-slate-700">
                    {p.first_name} {p.last_name} — <span className="text-slate-400">{p.nationality}</span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-2">
            {isCancellable && (
              <button
                onClick={() => onCancel(booking.booking_id)}
                disabled={cancellingStates[booking.booking_id]}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
              >
                {cancellingStates[booking.booking_id] ? (
                  <><Loader className="w-3.5 h-3.5 animate-spin" /> Cancelling...</>
                ) : (
                  <><X className="w-3.5 h-3.5" /> Cancel Booking</>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const NotificationRow = ({ notification, onMarkRead }) => {
  const typeIcon = {
    booking_confirmation: CheckCircle,
    booking_cancellation: XCircle,
    payment_confirmation:  DollarSign,
    general:              Bell,
  };
  const Icon = typeIcon[notification.type] || Bell;

  return (
    <div
      className={`flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition cursor-pointer ${
        !notification.is_read ? 'bg-blue-50/40' : ''
      }`}
      onClick={() => !notification.is_read && onMarkRead(notification.notification_id)}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
        !notification.is_read ? 'bg-blue-100' : 'bg-slate-100'
      }`}>
        <Icon className={`w-4 h-4 ${!notification.is_read ? 'text-blue-600' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.is_read ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
          {notification.title}
        </p>
        {notification.content && (
          <p className="text-sm text-slate-500 mt-0.5">{notification.content}</p>
        )}
        <p className="text-xs text-slate-400 mt-1">
          {new Date(notification.created_at).toLocaleString()}
        </p>
      </div>
      {!notification.is_read && (
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="glass-surface rounded-2xl border border-white/80 p-5 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.45)]">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
};

const DashboardBackdrop = () => (
  <div className="dashboard-motion-layer" aria-hidden="true">
    <div className="dashboard-cloud top-20 -left-24 h-12 w-28 opacity-70 [animation-duration:28s]" />
    <div className="dashboard-cloud top-44 -left-40 h-16 w-36 opacity-60 [animation-duration:34s]" />
    <div className="dashboard-cloud top-72 -left-52 h-10 w-24 opacity-50 [animation-duration:24s]" />

    <div className="dashboard-line dashboard-line-left top-28 w-[38vw]" />
    <div className="dashboard-line dashboard-line-right top-44 w-[34vw] [animation-delay:0.8s]" />
    <div className="dashboard-line dashboard-line-left top-[32rem] w-[28vw] [animation-delay:1.4s]" />

    <div className="dashboard-plane-trail hidden md:block" />
    <Plane className="dashboard-plane-launch hidden md:block h-8 w-8" strokeWidth={1.8} />
  </div>
);

const EmptyState = ({ navigate }) => (
  <div className="text-center py-16">
    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Package className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">No bookings found</h3>
    <p className="text-slate-500 mb-6">Start exploring to make your first booking.</p>
    <button
      onClick={() => navigate('/')}
      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
    >
      <Plane className="w-4 h-4" />
      Explore Services
    </button>
  </div>
);

export default DashboardPage;
