import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiDelete, apiGet, apiPost, apiPut } from '../lib/api';
import {
  Users, TrendingUp, DollarSign, AlertCircle,
  Loader, Search, CheckCircle, XCircle, Shield,
  BarChart2, Package, LogOut, RefreshCw, Plus, Save, Trash2
} from 'lucide-react';

const catalogSchemas = {
  flights: {
    label: 'Flights',
    endpoint: '/api/flights',
    idField: 'offer_id',
    fields: ['airline_code', 'flight_number', 'origin', 'destination', 'price', 'duration_minutes', 'stops', 'cabin_class', 'availability'],
    defaults: { cabin_class: 'economy', stops: 0, availability: 20, currency: 'USD' },
  },
  hotels: {
    label: 'Hotels',
    endpoint: '/api/hotels',
    idField: 'hotel_id',
    fields: ['name', 'city', 'country', 'star_rating', 'price_per_night', 'description'],
    defaults: { country: 'Lebanon', star_rating: 4 },
  },
  restaurants: {
    label: 'Restaurants',
    endpoint: '/api/restaurants',
    idField: 'restaurant_id',
    fields: ['name', 'city', 'cuisine_type', 'price_tier', 'rating'],
    defaults: { price_tier: '$$', rating: 4.5 },
  },
  attractions: {
    label: 'Attractions',
    endpoint: '/api/attractions',
    idField: 'attraction_id',
    fields: ['name', 'city', 'category', 'rating', 'price', 'requires_advance_booking'],
    defaults: { rating: 4.5, requires_advance_booking: true },
  },
  spa: {
    label: 'Spa',
    endpoint: '/api/spa',
    idField: 'spa_id',
    fields: ['name', 'city', 'type', 'rating', 'price'],
    defaults: { rating: 4.6, type: 'Wellness' },
  },
  bundles: {
    label: 'Bundles',
    endpoint: '/api/bundles',
    idField: 'bundle_id',
    fields: ['name', 'destination', 'status', 'total_original_price', 'discounted_price', 'description'],
    defaults: { status: 'published' },
  },
};

const catalogTableMap = {
  flights: 'flight_offers',
  hotels: 'hotels',
  restaurants: 'restaurants',
  attractions: 'attractions',
  spa: 'spa_venues',
  bundles: 'bundles',
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Admin Page
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const AdminPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('analytics');
  const [users, setUsers]         = useState([]);
  const [bookings, setBookings]   = useState([]);
  const [records, setRecords]     = useState([]);
  const [activeCatalog, setActiveCatalog] = useState('flights');
  const [catalogForm, setCatalogForm] = useState(catalogSchemas.flights.defaults);
  const [editingRecord, setEditingRecord] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError]         = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect non-admins
  useEffect(() => {
    if (user && !user.roles?.includes('ADMIN')) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const [usersData, recordsData] = await Promise.all([
        apiGet('/api/admin/users'),
        apiGet('/api/admin/records'),
      ]);
      const bookingsData = recordsData.filter((record) => record._table === 'bookings');
      setUsers(usersData || []);
      setRecords(recordsData || []);
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
    (u.fullName || u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSuspend = async (userId, isSuspended) => {
    setUsers(prev => prev.map(u => (u.id || u.user_id) === userId ? { ...u, is_suspended: !isSuspended } : u));
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics',  icon: BarChart2 },
    { id: 'users',     label: 'Users',       icon: Users },
    { id: 'bookings',  label: 'Bookings',    icon: Package },
    { id: 'catalog',   label: 'Catalog',     icon: Plus },
  ];

  const handleCatalogChange = (catalogKey) => {
    setActiveCatalog(catalogKey);
    setEditingRecord(null);
    setCatalogForm(catalogSchemas[catalogKey].defaults);
  };

  const handleEditRecord = (record) => {
    const schema = catalogSchemas[activeCatalog];
    setEditingRecord(record);
    setCatalogForm({
      ...schema.defaults,
      ...Object.fromEntries(schema.fields.map((field) => [field, record[field] ?? ''])),
    });
  };

  const handleResetForm = () => {
    setEditingRecord(null);
    setCatalogForm(catalogSchemas[activeCatalog].defaults);
  };

  const handleSaveCatalog = async (event) => {
    event.preventDefault();
    const schema = catalogSchemas[activeCatalog];
    setIsSaving(true);
    setError('');

    try {
      const payload = Object.fromEntries(
        Object.entries(catalogForm).map(([key, value]) => {
          if (value === 'true') return [key, true];
          if (value === 'false') return [key, false];
          if (value !== '' && !Number.isNaN(Number(value)) && ['price', 'price_per_night', 'rating', 'star_rating', 'duration_minutes', 'stops', 'availability', 'total_original_price', 'discounted_price'].includes(key)) {
            return [key, Number(value)];
          }
          return [key, value];
        })
      );

      if (editingRecord) {
        await apiPut(`${schema.endpoint}/${editingRecord[schema.idField]}`, payload);
      } else {
        await apiPost(schema.endpoint, payload);
      }

      await loadData();
      handleResetForm();
    } catch (err) {
      setError(err.message || 'Failed to save catalog item');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (record) => {
    const schema = catalogSchemas[activeCatalog];
    if (!window.confirm(`Delete ${record.name || record.flight_number || 'this item'}?`)) return;

    setIsSaving(true);
    try {
      await apiDelete(`${schema.endpoint}/${record[schema.idField]}`);
      await loadData();
      if (editingRecord?.[schema.idField] === record[schema.idField]) {
        handleResetForm();
      }
    } catch (err) {
      setError(err.message || 'Failed to delete catalog item');
    } finally {
      setIsSaving(false);
    }
  };

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
                        <tr key={u.id || u.user_id} className="hover:bg-slate-50 transition">
                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900">{u.fullName || u.full_name || '-'}</div>
                          </td>
                          <td className="px-5 py-4 text-slate-600">{u.email}</td>
                          <td className="px-5 py-4 text-slate-500">
                            {u.createdAt || u.created_at ? new Date(u.createdAt || u.created_at).toLocaleDateString() : '-'}
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
                              onClick={() => handleSuspend(u.id || u.user_id, u.is_suspended)}
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

            {activeTab === 'catalog' && (
              <CatalogPanel
                activeCatalog={activeCatalog}
                catalogForm={catalogForm}
                editingRecord={editingRecord}
                isSaving={isSaving}
                records={records.filter((record) => record._table === catalogTableMap[activeCatalog])}
                onCatalogChange={handleCatalogChange}
                onDeleteRecord={handleDeleteRecord}
                onEditRecord={handleEditRecord}
                onFormChange={setCatalogForm}
                onResetForm={handleResetForm}
                onSave={handleSaveCatalog}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const CatalogPanel = ({
  activeCatalog,
  catalogForm,
  editingRecord,
  isSaving,
  records,
  onCatalogChange,
  onDeleteRecord,
  onEditRecord,
  onFormChange,
  onResetForm,
  onSave,
}) => {
  const schema = catalogSchemas[activeCatalog];

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-wrap gap-2 mb-5">
          {Object.entries(catalogSchemas).map(([key, item]) => (
            <button
              key={key}
              onClick={() => onCatalogChange(key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeCatalog === key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">
              {editingRecord ? 'Edit Item' : 'New Item'}
            </h2>
            {editingRecord && (
              <button type="button" onClick={onResetForm} className="text-sm text-blue-600 hover:text-blue-800">
                New
              </button>
            )}
          </div>

          {schema.fields.map((field) => (
            <label key={field} className="block text-sm font-medium text-slate-700">
              {field.replaceAll('_', ' ')}
              {field === 'description' ? (
                <textarea
                  value={catalogForm[field] || ''}
                  onChange={(event) => onFormChange((current) => ({ ...current, [field]: event.target.value }))}
                  rows={3}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              ) : field === 'requires_advance_booking' ? (
                <select
                  value={String(catalogForm[field] ?? true)}
                  onChange={(event) => onFormChange((current) => ({ ...current, [field]: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="true">Required</option>
                  <option value="false">Optional</option>
                </select>
              ) : (
                <input
                  value={catalogForm[field] || ''}
                  onChange={(event) => onFormChange((current) => ({ ...current, [field]: event.target.value }))}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              )}
            </label>
          ))}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isSaving ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editingRecord ? 'Save Changes' : 'Create Item'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900">{schema.label} Catalog</h2>
            <p className="text-sm text-slate-500">{records.length} records</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {schema.fields.slice(0, 5).map((field) => (
                  <th key={field} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {field.replaceAll('_', ' ')}
                  </th>
                ))}
                <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={schema.fields.slice(0, 5).length + 1} className="text-center py-12 text-slate-400">
                    No records yet
                  </td>
                </tr>
              ) : records.map((record) => (
                <tr key={record[schema.idField]} className="hover:bg-slate-50 transition">
                  {schema.fields.slice(0, 5).map((field) => (
                    <td key={field} className="px-5 py-4 text-slate-700 max-w-[14rem] truncate">
                      {String(record[field] ?? '-')}
                    </td>
                  ))}
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEditRecord(record)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => onDeleteRecord(record)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
