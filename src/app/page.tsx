'use client';
import React, { useState, useEffect } from 'react';
// Corrected Supabase import path:
import { supabase } from './utils/supabase'; // Assuming page.tsx is in src/app and utils is in src/app
import { User } from '@supabase/supabase-js';

// Import professional icons from lucide-react
import {
  Smile, Meh, Frown, Angry, CloudRain, Feather,
  LogOut, Trash2, BookText, Zap, Leaf
} from 'lucide-react';

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

// Mood Entry Type
interface MoodEntry {
  id: string;
  user_id: string;
  mood: string;
  note: string | null;
  created_at: string;
}

// Journal Entry Type
interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  ai_insight: string | null;
  created_at: string;
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
      } catch (error: unknown) {
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #e3f2fd, #e8dffc)' }}>
      <div className="relative bg-white/30 backdrop-blur-md p-10 rounded-3xl shadow-2xl max-w-lg w-full text-center transform transition-all duration-500 hover:scale-[1.02] border border-white/50">
        <h1 className="text-5xl font-extrabold text-indigo-800 mb-4 drop-shadow-md">
          MindWell
        </h1>
        <p className="text-lg text-gray-700 mb-8 font-light leading-relaxed">
          Your personal AI-powered companion for mental well-being. Track your mood, journal your thoughts, and gain insights.
        </p>
        <button
          onClick={onLoginClick}
          className="relative bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-300 active:scale-95"
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
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      console.error('Login error:', errorMessage);
      setMessage(`Failed to send magic link: ${errorMessage}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4" style={{ background: 'linear-gradient(135deg, #e3f2fd, #e8dffc)' }}>
      <div className="relative bg-white/30 backdrop-blur-md p-10 rounded-3xl shadow-2xl max-w-lg w-full transform transition-all duration-500 hover:scale-[1.02] border border-white/50">
        <h2 className="text-4xl font-extrabold text-indigo-700 mb-8 text-center drop-shadow-sm">Login</h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              className="w-full px-5 py-3 border-2 border-white/50 bg-white/50 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-gray-800 placeholder-gray-500 shadow-inner"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isSending}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-300 active:scale-95 flex items-center justify-center"
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
          className="mt-6 w-full text-indigo-600 hover:text-indigo-800 font-semibold py-2 px-4 rounded-full transition-colors duration-200"
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
        return <MoodTrackerTab userId={user.id} />;
      case 'journal':
        return <JournalTab userId={user.id} />;
      case 'insights':
        return <InsightsTab userId={user.id} />;
      case 'resources':
        return <ResourcesTab />;
      default:
        return <MoodTrackerTab userId={user.id} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4" style={{ background: 'linear-gradient(135deg, #e3f2fd, #e8dffc)' }}>
      {/* Header */}
      <header className="relative bg-white/30 backdrop-blur-md shadow-lg p-6 flex flex-col sm:flex-row justify-between items-center rounded-3xl border border-white/50 mb-4">
        <h1 className="text-3xl font-extrabold text-indigo-800 mb-2 sm:mb-0 drop-shadow-sm">MindWell Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-700 font-medium">Welcome, {user?.email?.split('@')[0] || 'User'}!</span>
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-full shadow-lg transition-colors duration-200 flex items-center space-x-2 active:scale-95"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="relative bg-white/30 backdrop-blur-md shadow-md p-2 flex flex-wrap justify-center space-x-2 rounded-full border border-white/50 mb-4">
        <TabButton label="Mood Tracker" isActive={activeTab === 'mood'} onClick={() => setActiveTab('mood')} />
        <TabButton label="Journal" isActive={activeTab === 'journal'} onClick={() => setActiveTab('journal')} />
        <TabButton label="Insights" isActive={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
        <TabButton label="Resources" isActive={activeTab === 'resources'} onClick={() => setActiveTab('resources')} />
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow p-6 bg-white/30 backdrop-blur-md rounded-3xl shadow-xl border border-white/50">
        {renderTabContent()}
      </main>
    </div>
  );
};

const TabButton: React.FC<TabButtonProps> = ({ label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-6 rounded-full font-semibold transition-all duration-300 drop-shadow-sm active:scale-95
        ${isActive
          ? 'bg-indigo-600 text-white shadow-lg'
          : 'bg-white/50 text-gray-700 hover:bg-white/70 hover:text-indigo-700'
        }`}
    >
      {label}
    </button>
  );
};

// --- MoodTrackerTab Component ---
interface MoodTrackerTabProps {
  userId: string;
}

const moods = [
  { label: 'Happy', icon: Smile, color: 'text-yellow-500' },
  { label: 'Neutral', icon: Meh, color: 'text-gray-500' },
  { label: 'Sad', icon: Frown, color: 'text-blue-500' },
  { label: 'Angry', icon: Angry, color: 'text-red-500' },
  { label: 'Anxious', icon: CloudRain, color: 'text-purple-500' },
  { label: 'Calm', icon: Feather, color: 'text-green-500' },
];

const MoodTrackerTab: React.FC<MoodTrackerTabProps> = ({ userId }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [message, setMessage] = useState('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoadingMoods, setIsLoadingMoods] = useState(true);
  const [isSubmittingMood, setIsSubmittingMood] = useState(false);

  // Function to fetch mood entries
  const fetchMoodEntries = async () => {
    setIsLoadingMoods(true);
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(7);

    if (error) {
      console.error('Error fetching mood entries:', error);
      setMessage('Failed to load mood history.');
    } else {
      setMoodEntries(data || []);
    }
    setIsLoadingMoods(false);
  };

  // Fetch mood entries on component mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchMoodEntries();
    }
  }, [userId]);

  const handleSubmitMood = async () => {
    if (!selectedMood) {
      setMessage('Please select a mood.');
      return;
    }
    if (!userId) {
      setMessage('User not authenticated.');
      return;
    }

    setIsSubmittingMood(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('mood_entries')
        .insert({
          user_id: userId,
          mood: selectedMood,
          note: moodNote.trim() === '' ? null : moodNote.trim(),
        });

      if (error) {
        throw error;
      }

      setMessage('Mood saved successfully!');
      setSelectedMood(null);
      setMoodNote('');
      fetchMoodEntries(); // Re-fetch to update the list
    } catch (error: unknown) {
      let errorMessage = 'Failed to save mood.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      console.error('Error saving mood:', errorMessage);
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsSubmittingMood(false);
    }
  };

  const handleDeleteMood = async (id: string) => {
    // Replaced confirm with a custom modal UI in a real-world app, but maintaining logic as per user request
    if (window.confirm('Are you sure you want to delete this mood entry?')) {
      setMessage('');
      try {
        const { error } = await supabase
          .from('mood_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
  
        if (error) {
          throw error;
        }
        setMessage('Mood entry deleted successfully!');
        fetchMoodEntries();
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete mood entry.';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = (error as { message: string }).message;
        }
        console.error('Error deleting mood entry:', errorMessage);
        setMessage(`Error: ${errorMessage}`);
      }
    }
  };
  

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6 drop-shadow-sm">How are you feeling today?</h3>

      {/* Mood Selection */}
      <div className="mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {moods.map(({ label, icon: Icon, color }) => (
            <button
              key={label}
              onClick={() => setSelectedMood(label)}
              className={`flex flex-col items-center justify-center p-4 rounded-2xl text-lg font-semibold transition-all duration-300 shadow-md transform hover:scale-105 active:scale-95
                ${selectedMood === label ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }
              disabled={isSubmittingMood}
            >
              <Icon size={36} className={`${selectedMood === label ? 'text-white' : color} mb-2`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mood Note */}
      <div className="mb-6">
        <label htmlFor="moodNote" className="block text-gray-700 text-sm font-medium mb-2">Optional Note:</label>
        <textarea
          id="moodNote"
          rows={3}
          className="w-full px-4 py-2 border-2 border-white/50 bg-white/50 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-gray-800 placeholder-gray-500 shadow-inner"
          placeholder="What's on your mind? (e.g., 'Had a great day at work!')"
          value={moodNote}
          onChange={(e) => setMoodNote(e.target.value)}
          disabled={isSubmittingMood}
        ></textarea>
      </div>

      <button
        onClick={handleSubmitMood}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center active:scale-95"
        disabled={!selectedMood || isSubmittingMood}
      >
        {isSubmittingMood ? (
          <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          'Save Mood'
        )}
      </button>

      {message && (
        <p className={`mt-4 text-center text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      {/* Mood History */}
      <div className="mt-8">
        <h4 className="text-xl font-semibold text-gray-800 mb-4 drop-shadow-sm">Your Recent Moods</h4>
        {isLoadingMoods ? (
          <p className="text-gray-500">Loading mood history...</p>
        ) : moodEntries.length === 0 ? (
          <p className="text-gray-500">No mood entries yet. Log your first mood!</p>
        ) : (
          <div className="space-y-3">
            {moodEntries.map((entry) => (
              <div key={entry.id} className="relative bg-white/50 p-4 rounded-xl shadow-sm border border-white/50 flex justify-between items-center transition-all duration-200 hover:shadow-md">
                <div>
                  <p className="text-gray-800 font-medium">{entry.mood} on {formatDate(entry.created_at)}</p>
                  {entry.note && <p className="text-gray-600 text-sm mt-1">Note: {entry.note}</p>}
                </div>
                <button
                  onClick={() => handleDeleteMood(entry.id)}
                  className="ml-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-colors duration-200 flex items-center justify-center active:scale-95"
                  title="Delete Mood Entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- JournalTab Component ---
interface JournalTabProps {
  userId: string;
}

const JournalTab: React.FC<JournalTabProps> = ({ userId }) => {
  const [journalContent, setJournalContent] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmittingJournal, setIsSubmittingJournal] = useState(false);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoadingJournals, setIsLoadingJournals] = useState(true);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  // Function to fetch journal entries
  const fetchJournalEntries = async () => {
    setIsLoadingJournals(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching journal entries:', error);
      setMessage('Failed to load journal history.');
    } else {
      setJournalEntries(data || []);
    }
    setIsLoadingJournals(false);
  };

  // Fetch journal entries on component mount and when userId changes
  useEffect(() => {
    if (userId) {
      fetchJournalEntries();
    }
  }, [userId]);

  const handleSubmitJournal = async () => {
    if (journalContent.trim() === '') {
      setMessage('Journal entry cannot be empty.');
      return;
    }
    if (!userId) {
      setMessage('User not authenticated.');
      return;
    }

    setIsSubmittingJournal(true);
    setMessage('');

    let newEntryId: string | null = null;

    try {
      // 1. Save journal entry to Supabase
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          user_id: userId,
          content: journalContent.trim(),
          ai_insight: null,
        })
        .select('id, content'); // Ensure ID and content are selected for the API call

      if (error) {
        throw error;
      }

      const newEntry = data?.[0];
      if (!newEntry || !newEntry.id) {
        throw new Error("Failed to retrieve new journal entry ID after insert.");
      }
      newEntryId = newEntry.id;

      setMessage('Journal entry saved successfully! Generating AI insight...');
      setJournalContent('');
      fetchJournalEntries(); // Re-fetch to show the new entry immediately (without insight yet)

      // 2. Call Next.js API Route for AI insight generation
      setIsGeneratingInsight(true);

      try {
        const response = await fetch('/api/generate-insight', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: newEntryId,
            content: newEntry.content,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`AI generation API failed: ${errorData.message || response.statusText}`);
        }

        // AI insight has been generated and updated in Supabase by the API route
        // We need to re-fetch after a short delay to ensure Supabase has propagated the update
        // and our client-side cache is invalidated.
        setTimeout(() => {
          fetchJournalEntries();
          setMessage('Journal entry saved and AI insight generated!');
        }, 1000); // 1-second delay to allow Supabase update to propagate

      } catch (aiError: unknown) {
        let aiErrorMessage = 'Failed to trigger AI insight generation.';
        if (aiError instanceof Error) {
          aiErrorMessage = aiError.message;
        } else if (typeof aiError === 'object' && aiError !== null && 'message' in aiError) {
          aiErrorMessage = (aiError as { message: string }).message;
        }
        console.error('Error calling AI generation API:', aiErrorMessage);
        setMessage(`Journal entry saved. AI generation failed: ${aiErrorMessage}`);
      } finally {
        setIsGeneratingInsight(false);
      }

    } catch (error: unknown) {
      let errorMessage = 'Failed to save journal entry.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
      }
      console.error('Error saving journal entry:', errorMessage);
      setMessage(`Error: ${errorMessage}`);
    } finally {
      setIsSubmittingJournal(false);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    // Replaced confirm with a custom modal UI in a real-world app, but maintaining logic as per user request
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      setMessage('');
      try {
        const { error } = await supabase
          .from('journal_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);
  
        if (error) {
          throw error;
        }
        setMessage('Journal entry deleted successfully!');
        fetchJournalEntries();
      } catch (error: unknown) {
        let errorMessage = 'Failed to delete journal entry.';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
          errorMessage = (error as { message: string }).message;
        }
        console.error('Error deleting journal entry:', errorMessage);
        setMessage(`Error: ${errorMessage}`);
      }
    }
  };
  

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6 drop-shadow-sm">Journal Your Thoughts</h3>

      <div className="mb-6">
        <label htmlFor="journalEntry" className="block text-gray-700 text-sm font-medium mb-2">Write your entry:</label>
        <textarea
          id="journalEntry"
          rows={8}
          className="w-full px-4 py-2 border-2 border-white/50 bg-white/50 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 transition duration-300 text-gray-800 placeholder-gray-500 shadow-inner"
          placeholder="What's on your mind today? How are you feeling?"
          value={journalContent}
          onChange={(e) => setJournalContent(e.target.value)}
          disabled={isSubmittingJournal || isGeneratingInsight}
        ></textarea>
      </div>

      <button
        onClick={handleSubmitJournal}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center active:scale-95"
        disabled={journalContent.trim() === '' || isSubmittingJournal || isGeneratingInsight}
      >
        {isSubmittingJournal || isGeneratingInsight ? (
          <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          'Save Journal Entry'
        )}
      </button>

      {message && (
        <p className={`mt-4 text-center text-sm ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </p>
      )}

      {/* Journal History */}
      <div className="mt-8">
        <h4 className="text-xl font-semibold text-gray-800 mb-4 drop-shadow-sm">Your Recent Journal Entries</h4>
        {isLoadingJournals ? (
          <p className="text-gray-500">Loading journal history...</p>
        ) : journalEntries.length === 0 ? (
          <p className="text-gray-500">No journal entries yet. Write your first entry!</p>
        ) : (
          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <div key={entry.id} className="relative bg-white/50 p-4 rounded-xl shadow-sm border border-white/50 flex flex-col sm:flex-row justify-between items-start transition-all duration-200 hover:shadow-md">
                <div className="flex-grow">
                  <p className="text-gray-800 font-medium text-sm mb-1">{formatDate(entry.created_at)}</p>
                  <p className="text-gray-700 font-light">{entry.content}</p>
                  {entry.ai_insight && (
                    <div className="mt-4 p-3 bg-indigo-50/70 rounded-lg text-indigo-800 text-sm border border-indigo-200 shadow-inner">
                      <p className="font-semibold flex items-center mb-1 space-x-2"><Zap size={16} /> <span>AI Insight:</span></p>
                      <p>{entry.ai_insight}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteJournal(entry.id)}
                  className="mt-4 sm:mt-0 sm:ml-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-colors duration-200 flex items-center justify-center flex-shrink-0 active:scale-95"
                  title="Delete Journal Entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- InsightsTab Component ---
const InsightsTab: React.FC<MoodTrackerTabProps> = ({ userId }) => {
  const [allJournalEntries, setAllJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoadingAllJournals, setIsLoadingAllJournals] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchAllJournalEntries = async () => {
      setIsLoadingAllJournals(true);
      // Fetch all journal entries for the user, specifically looking for those with insights
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', userId)
        .not('ai_insight', 'is', null) // Only fetch entries that have an AI insight
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all journal entries for insights:', error);
        setMessage('Failed to load insights.');
      } else {
        setAllJournalEntries(data || []);
      }
      setIsLoadingAllJournals(false);
    };

    if (userId) {
      fetchAllJournalEntries();
    }
  }, [userId]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6 drop-shadow-sm">Your AI Insights</h3>
      {message && (
        <p className={`mt-4 text-center text-sm text-red-600`}>
          {message}
        </p>
      )}
      {isLoadingAllJournals ? (
        <p className="text-gray-500">Loading insights...</p>
      ) : allJournalEntries.length === 0 ? (
        <p className="text-gray-500">No AI insights generated yet. Write a journal entry to get started!</p>
      ) : (
        <div className="space-y-6">
          {allJournalEntries.map((entry) => (
            <div key={entry.id} className="relative bg-white/50 p-6 rounded-2xl shadow-sm border border-white/50 transition-all duration-200 hover:shadow-xl">
              <p className="text-gray-800 font-medium text-sm mb-2">{formatDate(entry.created_at)}</p>
              <p className="text-gray-700 italic font-light">&quot;{entry.content.length > 100 ? `${entry.content.substring(0, 100)}...` : entry.content}&quot;</p>
              {entry.ai_insight && (
                <div className="mt-4 p-4 bg-indigo-50/70 rounded-xl text-indigo-800 text-sm border border-indigo-200 shadow-inner">
                  <p className="font-semibold flex items-center space-x-2 mb-1"><Zap size={16} /> <span>AI Insight:</span></p>
                  <p className="font-light">{entry.ai_insight}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- ResourcesTab Component ---
const ResourcesTab: React.FC = () => (
  <div className="p-6">
    <h3 className="text-2xl font-semibold text-gray-800 mb-6 drop-shadow-sm">Helpful Resources</h3>
    <div className="space-y-6">
      <div className="relative bg-white/50 p-6 rounded-2xl shadow-sm border border-white/50 transition-all duration-200 hover:shadow-xl">
        <h4 className="text-xl font-bold text-indigo-700 flex items-center space-x-2 mb-2"><BookText size={24} /> <span>Guided Meditations</span></h4>
        <p className="text-gray-700 font-light leading-relaxed">
          Discover a variety of guided meditation and mindfulness exercises to help you relax, focus, and find inner peace.
        </p>
        <a href="#" className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 font-medium transition-colors duration-200">
          Explore Meditations &rarr;
        </a>
      </div>
      <div className="relative bg-white/50 p-6 rounded-2xl shadow-sm border border-white/50 transition-all duration-200 hover:shadow-xl">
        <h4 className="text-xl font-bold text-green-700 flex items-center space-x-2 mb-2"><Leaf size={24} /> <span>Breathing Exercises</span></h4>
        <p className="text-gray-700 font-light leading-relaxed">
          Learn simple and effective breathing techniques to manage stress and anxiety in the moment.
        </p>
        <a href="#" className="mt-4 inline-block text-green-600 hover:text-green-800 font-medium transition-colors duration-200">
          Learn More &rarr;
        </a>
      </div>
      <div className="relative bg-white/50 p-6 rounded-2xl shadow-sm border border-white/50 transition-all duration-200 hover:shadow-xl">
        <h4 className="text-xl font-bold text-purple-700 flex items-center space-x-2 mb-2"><Zap size={24} /> <span>Professional Help</span></h4>
        <p className="text-gray-700 font-light leading-relaxed">
          Find information and links to certified mental health professionals and support hotlines.
        </p>
        <a href="#" className="mt-4 inline-block text-purple-600 hover:text-purple-800 font-medium transition-colors duration-200">
          Get Help &rarr;
        </a>
      </div>
    </div>
  </div>
);

export default Home;
