import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Plane, Hotel, Utensils, Ticket, Sparkles, ClipboardList } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');

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

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 mb-8">
          <div className="flex overflow-x-auto border-b border-slate-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
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
                </button>
              );
            })}
          </div>

          <div className="p-8">
            <div className="text-center py-12">
              <ClipboardList className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No bookings yet</h3>
              <p className="text-slate-600 mb-6">Start booking your travels to see them here</p>
              <button
                onClick={() => navigate('/search')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                <Plane className="w-5 h-5" />
                Book a Trip
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <StatCard label="Total Bookings" value="0" />
          <StatCard label="Upcoming Trips" value="0" />
          <StatCard label="Total Spent" value="$0.00" />
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-white rounded-lg p-6 border border-slate-200">
    <p className="text-sm text-slate-600 mb-2">{label}</p>
    <p className="text-3xl font-bold text-slate-900">{value}</p>
  </div>
);
