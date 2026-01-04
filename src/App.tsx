import React, { useState, useEffect } from 'react';
import { Design5Story } from './components/designs/Design5Story';
import { AdminPanel } from './components/AdminPanel';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Settings, Lock, X } from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';
import { getBlogPosts, verifyAdminPassword } from './components/api';

export default function App() {
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [hasNewKidMessages, setHasNewKidMessages] = useState(false);
  const [lastViewedKidMessageId, setLastViewedKidMessageId] = useState<string | null>(
    localStorage.getItem('lastViewedKidMessageId')
  );

  // Check for new kid messages
  useEffect(() => {
    const checkForNewKidMessages = async () => {
      const posts = await getBlogPosts();
      const kidPosts = posts.filter(post => post.type === 'kid_post');

      if (kidPosts.length > 0) {
        const latestKidPost = kidPosts[0];
        if (lastViewedKidMessageId !== latestKidPost.id) {
          setHasNewKidMessages(true);
        } else {
          setHasNewKidMessages(false);
        }
      }
    };

    checkForNewKidMessages();
    const interval = setInterval(checkForNewKidMessages, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [lastViewedKidMessageId]);

  // Mark kid messages as viewed when entering admin panel
  useEffect(() => {
    if (showAdmin && isAuthenticated) {
      const markAsViewed = async () => {
        const posts = await getBlogPosts();
        const kidPosts = posts.filter(post => post.type === 'kid_post');
        if (kidPosts.length > 0) {
          const latestKidPost = kidPosts[0];
          setLastViewedKidMessageId(latestKidPost.id);
          localStorage.setItem('lastViewedKidMessageId', latestKidPost.id);
          setHasNewKidMessages(false);
        }
      };
      markAsViewed();
    }
  }, [showAdmin, isAuthenticated]);

  const handleAdminClick = () => {
    if (isAuthenticated) {
      setShowAdmin(!showAdmin);
    } else {
      setShowPasswordPrompt(true);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = await verifyAdminPassword(passwordInput);

    if (isValid) {
      setIsAuthenticated(true);
      setShowAdmin(true);
      setShowPasswordPrompt(false);
      setPasswordInput('');
      toast.success('Admin access granted');
    } else {
      toast.error('Incorrect password');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowAdmin(false);
    toast.info('Logged out of admin');
  };

  return (
    <div className="relative h-screen">
      <Toaster />

      {/* Password prompt modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-slate-900">Admin Access</h2>
              </div>
              <button
                onClick={() => {
                  setShowPasswordPrompt(false);
                  setPasswordInput('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm text-slate-700 mb-2">
                  Enter Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••"
                  className="text-center text-2xl tracking-widest"
                  autoFocus
                  maxLength={4}
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                <Lock className="w-4 h-4 mr-2" />
                Unlock Admin
              </Button>
            </form>

            <p className="text-xs text-slate-500 text-center mt-4">
              This protects the admin panel from accidental changes
            </p>
          </div>
        </div>
      )}

      {/* Main view */}
      <div className="h-full">
        {showAdmin ? (
          <AdminPanel onLogout={handleLogout} />
        ) : (
          <Design5Story
            onAdminClick={handleAdminClick}
            hasNewKidMessages={hasNewKidMessages}
            showAdminButton={!showAdmin}
          />
        )}
      </div>
    </div>
  );
}