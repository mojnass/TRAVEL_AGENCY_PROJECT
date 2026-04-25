import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plane, Hotel, Utensils, Ticket, Sparkles, Users,
  ChevronRight, ArrowRight, Search, MapPin, Calendar,
  Star, Shield, Clock, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTab, setSearchTab] = useState('flights');
  const [searchInput, setSearchInput] = useState('');

  const handleQuickSearch = (e) => {
    e.preventDefault();
    navigate('/search');
  };

  const searchTabs = [
    { id: 'flights',      label: 'Flights',     icon: Plane },
    { id: 'hotels',       label: 'Hotels',      icon: Hotel },
    { id: 'restaurants',  label: 'Restaurants', icon: Utensils },
    { id: 'attractions',  label: 'Attractions', icon: Ticket },
    { id: 'spa',          label: 'Spa',         icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-slate-900">Patronus</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#services" className="hover:text-slate-900 transition">Services</a>
            <a href="#bundles"  className="hover:text-slate-900 transition">Bundles</a>
            <a href="#why"      className="hover:text-slate-900 transition">Why Us</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-700 hover:text-slate-900 font-medium text-sm transition">
                  Dashboard
                </Link>
                <Link
                  to="/dashboard/profile"
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-medium transition"
                >
                  Profile
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-slate-700 hover:text-slate-900 font-medium text-sm transition">
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white pt-20 pb-32 relative overflow-hidden">
        {/* decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-5 rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-sm mb-6 backdrop-blur-sm">
              <Globe className="w-4 h-4" />
              <span>Your Complete Travel Management System</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              Travel Smarter,<br />
              <span className="text-blue-200">Book Everything</span>
            </h1>
            <p className="text-xl text-blue-100">
              Flights, hotels, restaurants, attractions and spa — all in one place.
              Build custom bundles or pick curated packages.
            </p>
          </div>

          {/* ── Search Widget ── */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* tabs */}
            <div className="flex overflow-x-auto border-b border-slate-100">
              {searchTabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setSearchTab(id)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition flex-1 justify-center ${
                    searchTab === id
                      ? 'border-blue-600 text-blue-600 bg-blue-50'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
            {/* quick search form */}
            <form onSubmit={handleQuickSearch} className="p-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="md:col-span-1 relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={searchTab === 'flights' ? 'From — city or airport' : 'Destination city'}
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                {searchTab === 'flights' && (
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="To — city or airport"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                )}
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="md:col-span-3 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                >
                  <Search className="w-5 h-5" />
                  Search {searchTabs.find(t => t.id === searchTab)?.label}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section className="bg-slate-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '50K+', label: 'Flights Available' },
              { value: '10K+', label: 'Hotels Worldwide' },
              { value: '25K+', label: 'Happy Travelers' },
              { value: '99.9%', label: 'Booking Uptime' },
            ].map(stat => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-blue-400">{stat.value}</div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-xl text-slate-600">Manage all your travel needs in one powerful platform</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={Plane}
              title="Flight Search"
              description="Search flights by route, date, and passenger count. Real-time pricing and availability from major airlines."
              color="blue"
              onClick={() => navigate('/search?type=flights')}
            />
            <ServiceCard
              icon={Hotel}
              title="Hotel Booking"
              description="Find hotels by location, dates, and guest count. Filter by amenities, price range, and guest ratings."
              color="indigo"
              onClick={() => navigate('/search?type=hotels')}
            />
            <ServiceCard
              icon={Utensils}
              title="Restaurant Reservations"
              description="Discover restaurants by cuisine, price tier and dietary needs. Book a table with real-time slot availability."
              color="orange"
              onClick={() => navigate('/search?type=restaurants')}
            />
            <ServiceCard
              icon={Ticket}
              title="Attractions"
              description="Purchase tickets to museums, landmarks, and activities. Advance booking with QR-code entry."
              color="green"
              onClick={() => navigate('/search?type=attractions')}
            />
            <ServiceCard
              icon={Sparkles}
              title="Spa & Wellness"
              description="Book spa treatments, hammams, and wellness retreats. Choose your service, date, and therapist preference."
              color="purple"
              onClick={() => navigate('/search?type=spa')}
            />
            <ServiceCard
              icon={Users}
              title="Travel Bundles"
              description="Curated packages or build-your-own bundles with auto-applied discounts up to 15% for 5+ items."
              color="teal"
              featured
              onClick={() => navigate('/search?type=bundles')}
            />
          </div>
        </div>
      </section>

      {/* ── Bundle highlight ── */}
      <section id="bundles" className="bg-gradient-to-br from-indigo-50 to-blue-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1 text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Flagship Feature
              </div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                Build Your Own<br />
                <span className="text-blue-600">Trip Bundle</span>
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Select a flight, hotel, restaurants, attractions, and spa — our system automatically
                applies a bundle discount as you add more items. Save up to 15% on 5+ item bundles.
              </p>
              <div className="space-y-4">
                {[
                  { items: '3 items', discount: '5% discount', color: 'text-blue-600' },
                  { items: '4 items', discount: '10% discount', color: 'text-indigo-600' },
                  { items: '5+ items', discount: '15% discount', color: 'text-purple-600' },
                ].map(tier => (
                  <div key={tier.items} className="flex items-center gap-4 bg-white rounded-xl p-4 shadow-sm border border-slate-100">
                    <div className={`text-2xl font-bold ${tier.color} w-20`}>{tier.discount}</div>
                    <div className="text-slate-600 text-sm">{tier.items} combined in one bundle</div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/search')}
                className="mt-8 inline-flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
              >
                Start Building <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-slate-100">
                <div className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wide">Bundle Preview</div>
                {[
                  { icon: Plane,    label: 'BEY → CDG Flight',   price: '$420', done: true },
                  { icon: Hotel,    label: 'Hotel Le Marais',     price: '$280', done: true },
                  { icon: Utensils, label: 'Café de Flore',       price: '$85',  done: true },
                  { icon: Ticket,   label: 'Louvre Museum',       price: '$22',  done: false },
                  { icon: Sparkles, label: 'Spa du Soleil',       price: '$120', done: false },
                ].map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${item.done ? 'bg-slate-50' : 'bg-blue-50 border border-blue-100'}`}>
                    <item.icon className={`w-5 h-5 ${item.done ? 'text-slate-500' : 'text-blue-600'}`} />
                    <span className="flex-1 text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.price}</span>
                    {!item.done && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">add</span>}
                  </div>
                ))}
                <div className="border-t border-slate-200 mt-4 pt-4">
                  <div className="flex justify-between text-sm text-slate-500 mb-1">
                    <span>Subtotal</span><span>$927</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600 mb-2 font-medium">
                    <span>Bundle discount (10%)</span><span>-$92.70</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-slate-900">
                    <span>Total</span><span>$834.30</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section id="why" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Why Choose Patronus?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: 'Secure Payments', desc: 'PCI-compliant processing with Visa, Mastercard, and Amex. All transactions are encrypted.' },
              { icon: Clock,  title: 'Real-Time Booking', desc: 'Live availability checks across all services. Seat holds, slot locks, and instant confirmations.' },
              { icon: Star,   title: 'All-in-One Platform', desc: 'No more switching between apps. Flights, hotels, restaurants — managed from one dashboard.' },
            ].map(item => (
              <div key={item.title} className="text-center p-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-6">
                  <item.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of travelers using Patronus for smarter trip planning.
          </p>
          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-slate-50 transition"
              >
                Create Free Account <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Log In
              </Link>
            </div>
          ) : (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Go to Dashboard <ArrowRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Plane className="w-6 h-6 text-blue-400" />
                <span className="text-white font-bold text-lg">Patronus</span>
              </div>
              <p className="text-sm">Your complete travel management system. Plan everything, save more.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Flights</a></li>
                <li><a href="#" className="hover:text-white transition">Hotels</a></li>
                <li><a href="#" className="hover:text-white transition">Restaurants</a></li>
                <li><a href="#" className="hover:text-white transition">Bundles</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Patronus Systems. All rights reserved. — LAU CSC 490</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const colorMap = {
  blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'hover:border-blue-200' },
  indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'hover:border-indigo-200' },
  orange: { bg: 'bg-orange-50', icon: 'text-orange-500', border: 'hover:border-orange-200' },
  green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'hover:border-green-200' },
  purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'hover:border-purple-200' },
  teal:   { bg: 'bg-teal-50',   icon: 'text-teal-600',   border: 'hover:border-teal-200' },
};

const ServiceCard = ({ icon: Icon, title, description, color = 'blue', featured, onClick }) => {
  const c = colorMap[color];
  return (
    <div
      onClick={onClick}
      className={`p-8 border border-slate-200 rounded-2xl ${c.border} hover:shadow-lg transition cursor-pointer relative ${featured ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
    >
      {featured && (
        <span className="absolute top-4 right-4 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
          Popular
        </span>
      )}
      <div className={`inline-flex items-center justify-center w-14 h-14 ${c.bg} rounded-xl mb-6`}>
        <Icon className={`w-7 h-7 ${c.icon}`} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
};

export default HomePage;
