'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabase';
import { User } from '@supabase/supabase-js';

// --- Type Definitions ---

type AppUser = User

interface LandingPageProps {
  onLoginClick: () => void;
}

interface LoginPageProps {
  onLoginSuccess: (user: AppUser) => void;
  onBackToLanding: () => void;
}

interface DashboardPageProps {
  user: AppUser;
  onLogout: () => void;
}

interface TabButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

// --- Main App Component (Home) ---
const Home = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'login' | 'dashboard'>('landing');
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase Auth Listener
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      try {
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              setUser(session.user as AppUser);
              setCurrentView('dashboard');
            } else {
              setUser(null);
              setCurrentView('landing');
            }
            setIsLoading(false);
          }
        );

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user as AppUser);
          setCurrentView('dashboard');
        } else {
          setUser(null);
          setCurrentView('landing');
        }
        setIsLoading(false);

        return () => {
          authListener.subscription.unsubscribe();
        };
      } catch (error: unknown) { // Changed from 'any' to 'unknown'
        console.error("Error initializing Supabase auth:", error);
        setCurrentView('landing');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const navigateTo = (view: 'landing' | 'login' | 'dashboard') => {
    setCurrentView(view);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
          <div className="text-2xl font-semibold text-gray-700">Loading...</div>
        </div>
      );
    }

    switch (currentView) {
      case 'landing':
        return (
          <LandingPage onLoginClick={() => navigateTo('login')} />
        );
      case 'login':
        return (
          <LoginPage onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            navigateTo('dashboard');
          }} onBackToLanding={() => navigateTo('landing')} />
        );
      case 'dashboard':
        if (!user) {
          navigateTo('landing');
          return null;
        }
        return (
          <DashboardPage user={user} onLogout={async () => {
            await supabase.auth.signOut();
          }} />
        );
      default:
        return (
          <LandingPage onLoginClick={() => navigateTo('login')} />
        );
    }
  };

  return (
    <div className="min-h-screen font-inter">
      {renderContent()}
    </div>
  );
};

// --- Component Implementations with Types ---

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center transform transition-all duration-300 hover:scale-105">
        <h1 className="text-4xl font-extrabold text-indigo-700 mb-4">
          MindWell
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your personal AI-powered companion for mental well-being. Track your mood, journal your thoughts, and gain insights.
        </p>
        <button
          onClick={onLoginClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onBackToLanding }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsSending(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({ email });

      if (error) {
        throw error;
      }

      setMessage('Magic link sent! Check your email to log in.');
    } catch (error: unknown) { // Changed to 'unknown'
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) { // Type guard for Error objects
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        // Fallback for objects that might have a message property but aren't Error instances
        errorMessage = (error as { message: string }).message;
      }
      console.error('Login error:', errorMessage);
      setMessage(`Failed to send magic link: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full transform transition-all duration-300 hover:scale-105">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSending}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center"
            disabled={isSending}
          >
            {isSending ? (
              <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Send Magic Link'
            )}
          </button>
        </form>
        {message && (
          <p className={`mt-4 text-center text-sm ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}
        <button
          onClick={onBackToLanding}
          className="mt-6 w-full text-indigo-600 hover:text-indigo-800 font-semibold py-2 px-4 rounded-xl transition-colors duration-200"
        >
          Back to Landing
        </button>
      </div>
    </div>
  );
};

const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'mood' | 'journal' | 'insights' | 'resources'>('mood');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'mood':
        return <MoodTrackerTab />;
      case 'journal':
        return <JournalTab />;
      case 'insights':
        return <InsightsTab />;
      case 'resources':
        return <ResourcesTab />;
      default:
        return <MoodTrackerTab />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center rounded-b-2xl">
        <h1 className="text-2xl font-bold text-indigo-700">MindWell Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Welcome, {user?.email || 'User'}!</span>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white shadow-sm p-2 flex justify-center space-x-4 rounded-t-2xl mt-4 mx-4">
        <TabButton label="Mood Tracker" isActive={activeTab === 'mood'} onClick={() => setActiveTab('mood')} />
        <TabButton label="Journal" isActive={activeTab === 'journal'} onClick={() => setActiveTab('journal')} />
        <TabButton label="Insights" isActive={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
        <TabButton label="Resources" isActive={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow p-4 bg-white rounded-b-2xl mx-4 mb-4 shadow-lg">
        {renderTabContent()}
      </main>
    </div>
  );
};

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-indigo-100 text-indigo-700 shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
      }`}
    >
      {label}
    </button>
  );
};

const MoodTrackerTab: React.FC = () => (
  <div className="p-6">
    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Track Your Mood</h3>
    <p className="text-gray-600">
      Here you will be able to select your mood for the day and see your mood history.
    </p>
    {/* Mood selection UI will go here */}
  </div>
);

const JournalTab: React.FC = () => (
  <div className="p-6">
    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Journal Your Thoughts</h3>
    <p className="text-gray-600">
      Write down your thoughts and feelings. AI insights will be generated from your entries.
    </p>
    {/* Journal input form will go here */}
  </div>
);

const InsightsTab: React.FC = () => (
  <div className="p-6">
    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Your AI Insights</h3>
    <p className="text-gray-600">
      This section will display personalized insights and suggestions based on your mood and journal entries.
    </p>
    {/* AI insights display will go here */}
  </div>
);

const ResourcesTab: React.FC = () => (
  <div className="p-6">
    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Helpful Resources</h3>
    <p className="text-gray-600">
      Find articles, exercises, and external links to support your mental well-being.
    </p>
    {/* List of resources will go here */}
  </div>
);

export default Home;
