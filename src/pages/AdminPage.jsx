import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Users, TrendingUp, DollarSign, AlertCircle,
  Loader, Search, CheckCircle, XCircle, Shield,
  BarChart2, Package, LogOut, RefreshCw
} from 'lucide-react';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Admin Page
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const AdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [users, setUsers]         = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (user && user.user_metadata?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [{ data: usersData }, { data: bookingsData }] = await Promise.all([
        supabase.from('users').select('*').order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      ]);
      setUsers(usersData || []);
      setBookings(bookingsData || []);
    } catch (err) {
      setError(err.message || 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // â”€â”€ Derived analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalRevenue  = bookings.reduce((s, b) => s + (parseFloat(b.total_price) || 0), 0);
  const byType        = bookings.reduce((acc, b) => {
    acc[b.booking_type] = (acc[b.booking_type] || 0) + 1;
    return acc;
  }, {});
  const byStatus      = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  // Revenue by type
  const revenueByType = bookings.reduce((acc, b) => {
    acc[b.booking_type] = (acc[b.booking_type] || 0) + (parseFloat(b.total_price) || 0);
    return acc;
  }, {});

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuspend = async (userId, isSuspended) => {
    await supabase.from('users').update({ is_suspended: !isSuspended }).eq('user_id', userId);
    setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, is_suspended: !isSuspended } : u));
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics',  icon: BarChart2 },
    { id: 'users',     label: 'Users',       icon: Users },
    { id: 'bookings',  label: 'Bookings',    icon: Package },
  ];

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="bg-slate-900 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg">Patronus Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">{user?.email}</span>
            <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white transition">
              Dashboard
            </Link>
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-white transition text-slate-600"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <AdminStat icon={Users}      label="Total Users"     value={users.length}                    color="blue" />
          <AdminStat icon={Package}    label="Total Bookings"  value={bookings.length}                 color="indigo" />
          <AdminStat icon={DollarSign} label="Total Revenue"   value={`$${totalRevenue.toFixed(0)}`}  color="green" />
          <AdminStat icon={TrendingUp} label="Confirmed"        value={byStatus['confirmed'] || 0}     color="purple" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                activeTab === id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-24 gap-4">
            <Loader className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-slate-500">Loading admin data...</p>
          </div>
        ) : (
          <>
            {/* â”€â”€ ANALYTICS TAB â”€â”€ */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Bookings by service */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="font-semibold text-slate-900 mb-6">Bookings by Service Type</h2>
                  <div className="space-y-4">
                    {Object.entries(byType).map(([type, count]) => {
                      const pct = Math.round((count / bookings.length) * 100) || 0;
                      const colorMap = {
                        flight:     'bg-blue-500',
                        hotel:      'bg-indigo-500',
                        restaurant: 'bg-orange-500',
                        attraction: 'bg-green-500',
                        spa:        'bg-purple-500',
                        bundle:     'bg-teal-500',
                      };
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 capitalize font-medium">{type}</span>
                            <span className="text-slate-500">{count} ({pct}%)</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${colorMap[type] || 'bg-slate-400'}`}
                              style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(byType).length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-4">No booking data yet</p>
                    )}
                  </div>
                </div>

                {/* Revenue by type */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <h2 className="font-semibold text-slate-900 mb-6">Revenue by Service Type</h2>
                  <div className="space-y-4">
                    {Object.entries(revenueByType).map(([type, rev]) => {
                      const pct = Math.round((rev / totalRevenue) * 100) || 0;
                      return (
                        <div key={type}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-700 capitalize font-medium">{type}</span>
                            <span className="text-slate-500">${rev.toFixed(0)} ({pct}%)</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(revenueByType).length === 0 && (
                      <p className="text-slate-400 text-sm text-center py-4">No revenue data yet</p>
                    )}
                  </div>
                </div>

                {/* Booking status breakdown */}
                <div className="grid md:grid-cols-4 gap-4">
                  {['pending', 'confirmed', 'cancelled', 'completed'].map(status => {
                    const count = byStatus[status] || 0;
                    const statusColors = {
                      pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
                      confirmed: 'bg-green-50 text-green-700 border-green-200',
                      cancelled: 'bg-red-50 text-red-700 border-red-200',
                      completed: 'bg-blue-50 text-blue-700 border-blue-200',
                    };
                    return (
                      <div key={status} className={`rounded-xl border p-5 ${statusColors[status]}`}>
                        <p className="text-3xl font-bold">{count}</p>
                        <p className="text-sm font-medium mt-1 capitalize">{status}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* â”€â”€ USERS TAB â”€â”€ */}
            {activeTab === 'users' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <span className="text-sm text-slate-500">{filteredUsers.length} users</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {['Name', 'Email', 'Joined', 'Status', 'Actions'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400">
                            No users found
                          </td>
                        </tr>
                      ) : filteredUsers.map(u => (
                        <tr key={u.user_id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900">{u.full_name || 'â€”'}</div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{u.email}</td>
                          <td className="px-5 py-4 text-slate-500">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'â€”'}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              u.is_suspended
                                ? 'bg-red-50 text-red-700'
                                : 'bg-green-50 text-green-700'
                            }`}>
                              {u.is_suspended ? (
                                <><XCircle className="w-3 h-3" /> Suspended</>
                              ) : (
                                <><CheckCircle className="w-3 h-3" /> Active</>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => handleSuspend(u.user_id, u.is_suspended)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
                                u.is_suspended
                                  ? 'border-green-200 text-green-700 hover:bg-green-50'
                                  : 'border-red-200 text-red-600 hover:bg-red-50'
                              }`}
                            >
                              {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* â”€â”€ BOOKINGS TAB â”€â”€ */}
            {activeTab === 'bookings' && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <p className="text-sm text-slate-500">{bookings.length} total bookings</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        {['Booking ID', 'Type', 'Status', 'Start Date', 'Total', 'Created'].map(h => (
                          <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400">No bookings yet</td>
                        </tr>
                      ) : bookings.slice(0, 50).map(b => {
                        const statusColor = {
                          pending:   'bg-yellow-50 text-yellow-700',
                          confirmed: 'bg-green-50 text-green-700',
                          cancelled: 'bg-red-50 text-red-700',
                          completed: 'bg-blue-50 text-blue-700',
                        }[b.status] || 'bg-slate-50 text-slate-600';

                        return (
                          <tr key={b.booking_id} className="hover:bg-slate-50 transition">
                            <td className="px-5 py-4 font-mono text-xs text-slate-500">
                              #{b.booking_id?.slice(0, 8)}
                            </td>
                            <td className="px-5 py-4 capitalize font-medium text-slate-800">
                              {b.booking_type}
                            </td>
                            <td className="px-5 py-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor}`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              {b.start_date ? new Date(b.start_date).toLocaleDateString() : 'â€”'}
                            </td>
                            <td className="px-5 py-4 font-semibold text-slate-900">
                              ${parseFloat(b.total_price || 0).toFixed(2)}
                            </td>
                            <td className="px-5 py-4 text-slate-500">
                              {b.created_at ? new Date(b.created_at).toLocaleDateString() : 'â€”'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const AdminStat = ({ icon: Icon, label, value, color }) => {
  const colorMap = {
    blue:   'bg-blue-50 text-blue-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  );
};

export default AdminPage;
