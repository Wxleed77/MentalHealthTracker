'use client';
import React, { useState, useEffect } from 'react';
// Corrected Supabase import path:
import { supabase } from './utils/supabase'; // Assuming page.tsx is in src/app and utils is in src/app
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

// --- MoodTrackerTab Component ---
interface MoodTrackerTabProps {
  userId: string;
}

const MoodTrackerTab: React.FC<MoodTrackerTabProps> = ({ userId }) => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodNote, setMoodNote] = useState('');
  const [message, setMessage] = useState('');
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [isLoadingMoods, setIsLoadingMoods] = useState(true);
  const [isSubmittingMood, setIsSubmittingMood] = useState(false);

  const moods = ['😊 Happy', '😐 Neutral', '😔 Sad', '😠 Angry', '😟 Anxious', '😌 Calm'];

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
    if (!confirm('Are you sure you want to delete this mood entry?')) {
      return;
    }

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
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Track Your Mood</h3>

      {/* Mood Selection */}
      <div className="mb-6">
        <p className="text-gray-700 font-medium mb-3">How are you feeling today?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {moods.map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`py-3 px-4 rounded-xl text-lg font-semibold transition-all duration-200 shadow-md
                ${selectedMood === mood ? 'bg-indigo-600 text-white transform scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
              }
              disabled={isSubmittingMood}
            >
              {mood}
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-gray-800 placeholder-gray-500"
          placeholder="What's on your mind? (e.g., 'Had a great day at work!')"
          value={moodNote}
          onChange={(e) => setMoodNote(e.target.value)}
          disabled={isSubmittingMood}
        ></textarea>
      </div>

      <button
        onClick={handleSubmitMood}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center"
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
        <h4 className="text-xl font-semibold text-gray-800 mb-3">Your Recent Moods</h4>
        {isLoadingMoods ? (
          <p className="text-gray-500">Loading mood history...</p>
        ) : moodEntries.length === 0 ? (
          <p className="text-gray-500">No mood entries yet. Log your first mood!</p>
        ) : (
          <div className="space-y-3">
            {moodEntries.map((entry) => (
              <div key={entry.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center">
                <div>
                  <p className="text-gray-800 font-medium">{entry.mood} on {formatDate(entry.created_at)}</p>
                  {entry.note && <p className="text-gray-600 text-sm mt-1">Note: {entry.note}</p>}
                </div>
                <button
                  onClick={() => handleDeleteMood(entry.id)}
                  className="ml-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-colors duration-200 flex items-center justify-center"
                  title="Delete Mood Entry"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 3a1 1 0 011-1h4a1 1 0 110 2H10a1 1 0 01-1-1zm-2 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
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
    if (!confirm('Are you sure you want to delete this journal entry?')) {
      return;
    }

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
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6">
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Journal Your Thoughts</h3>

      <div className="mb-6">
        <label htmlFor="journalEntry" className="block text-gray-700 text-sm font-medium mb-2">Write your entry:</label>
        <textarea
          id="journalEntry"
          rows={8}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 text-gray-800 placeholder-gray-500"
          placeholder="What's on your mind today? How are you feeling?"
          value={journalContent}
          onChange={(e) => setJournalContent(e.target.value)}
          disabled={isSubmittingJournal || isGeneratingInsight}
        ></textarea>
      </div>

      <button
        onClick={handleSubmitJournal}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-indigo-300 flex items-center justify-center"
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
        <h4 className="text-xl font-semibold text-gray-800 mb-3">Your Recent Journal Entries</h4>
        {isLoadingJournals ? (
          <p className="text-gray-500">Loading journal history...</p>
        ) : journalEntries.length === 0 ? (
          <p className="text-gray-500">No journal entries yet. Write your first entry!</p>
        ) : (
          <div className="space-y-4">
            {journalEntries.map((entry) => (
              <div key={entry.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start">
                <div>
                  <p className="text-gray-800 font-medium text-sm mb-1">{formatDate(entry.created_at)}</p>
                  <p className="text-gray-700">{entry.content}</p>
                  {entry.ai_insight && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-md text-blue-800 text-sm border border-blue-200">
                      <p className="font-semibold">AI Insight:</p>
                      <p>{entry.ai_insight}</p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteJournal(entry.id)}
                  className="ml-4 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-md transition-colors duration-200 flex items-center justify-center flex-shrink-0"
                  title="Delete Journal Entry"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm2 3a1 1 0 011-1h4a1 1 0 110 2H10a1 1 0 01-1-1zm-2 3a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
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
      <h3 className="text-2xl font-semibold text-gray-800 mb-4">Your AI Insights</h3>
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
        <div className="space-y-4">
          {allJournalEntries.map((entry) => (
            <div key={entry.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-800 font-medium text-sm mb-1">{formatDate(entry.created_at)}</p>
              <p className="text-gray-700 italic">&quot;{entry.content.substring(0, 100)}...&quot;</p> {/* Show snippet of original entry */}
              {entry.ai_insight && (
                <div className="mt-2 p-3 bg-blue-50 rounded-md text-blue-800 text-sm border border-blue-200">
                  <p className="font-semibold">AI Insight:</p>
                  <p>{entry.ai_insight}</p>
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
    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Helpful Resources</h3>
    <p className="text-gray-600">
      Find articles, exercises, and external links to support your mental well-being.
    </p>
    {/* List of resources will go here */}
  </div>
);

export default Home;
