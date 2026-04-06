import React from 'react';
import { Link } from 'react-router-dom';
import { Plane, Hotel, Users, Utensils, Ticket, Sparkles, ChevronRight, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <Plane className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-slate-900">Patronus</h1>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-slate-700 hover:text-slate-900 font-medium">
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
                <Link to="/login" className="text-slate-700 hover:text-slate-900 font-medium">
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

      <section className="bg-gradient-to-b from-slate-50 to-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl font-bold text-slate-900 mb-6">
                Your Complete Travel <span className="text-blue-600">Management System</span>
              </h2>
              <p className="text-xl text-slate-600 mb-8">
                Book flights, hotels, restaurants, attractions, and spa services. Create custom travel bundles or discover curated packages.
              </p>
              <div className="flex gap-4">
                {!user ? (
                  <>
                    <Link
                      to="/register"
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
                    >
                      Get Started <ArrowRight className="w-5 h-5" />
                    </Link>
                    <Link
                      to="/login"
                      className="px-8 py-3 border-2 border-slate-300 text-slate-900 rounded-lg font-semibold hover:border-slate-400 transition"
                    >
                      Log In
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/dashboard"
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition"
                  >
                    Go to Dashboard <ArrowRight className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-3xl transform -rotate-3"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <FeatureCard icon={Plane} label="Flights" />
                  <FeatureCard icon={Hotel} label="Hotels" />
                  <FeatureCard icon={Utensils} label="Restaurants" />
                  <FeatureCard icon={Ticket} label="Attractions" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need</h3>
            <p className="text-xl text-slate-600">Manage all your travel needs in one powerful platform</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <ServiceCard
              icon={Plane}
              title="Flight Search"
              description="Search and book flights from multiple airlines with real-time pricing and seat selection."
            />
            <ServiceCard
              icon={Hotel}
              title="Hotel Bookings"
              description="Browse and reserve hotels worldwide with detailed information and instant confirmation."
            />
            <ServiceCard
              icon={Utensils}
              title="Restaurant Reservations"
              description="Discover and book restaurants, from casual dining to fine dining experiences."
            />
            <ServiceCard
              icon={Ticket}
              title="Attractions"
              description="Purchase tickets to museums, landmarks, and activities at your destination."
            />
            <ServiceCard
              icon={Sparkles}
              title="Spa & Wellness"
              description="Book spa treatments and wellness services to relax during your travels."
            />
            <ServiceCard
              icon={Users}
              title="Travel Bundles"
              description="Create custom bundles or book pre-curated travel packages with special discounts."
            />
          </div>
        </div>
      </section>

      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-4xl font-bold mb-6">Ready to Start Your Journey?</h3>
          <p className="text-xl mb-8 opacity-90">Join thousands of travelers using Patronus for their travel planning</p>
          {!user && (
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-slate-50 transition"
            >
              Create Free Account <ChevronRight className="w-5 h-5" />
            </Link>
          )}
        </div>
      </section>

      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold mb-4">Patronus</h4>
              <p className="text-sm">Your complete travel management system.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Flights</a></li>
                <li><a href="#" className="hover:text-white">Hotels</a></li>
                <li><a href="#" className="hover:text-white">Bundles</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Privacy</a></li>
                <li><a href="#" className="hover:text-white">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2026 Patronus Systems. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, label }) => (
  <div className="flex flex-col items-center justify-center p-6 rounded-xl bg-slate-50 hover:bg-blue-50 transition">
    <Icon className="w-8 h-8 text-blue-600 mb-2" />
    <p className="font-medium text-slate-900">{label}</p>
  </div>
);

const ServiceCard = ({ icon: Icon, title, description }) => (
  <div className="p-8 border border-slate-200 rounded-2xl hover:shadow-lg hover:border-blue-200 transition">
    <Icon className="w-12 h-12 text-blue-600 mb-4" />
    <h4 className="text-xl font-bold text-slate-900 mb-3">{title}</h4>
    <p className="text-slate-600">{description}</p>
  </div>
);
