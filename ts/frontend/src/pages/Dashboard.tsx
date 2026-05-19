// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { navigate } from '../utils/navigation';
import { setAccessToken } from '../utils/fetcher';

export default function Dashboard() {
  const [user, setUser] = useState<{username: string, email: string | null} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newEmail, setNewEmail] = useState('');
  const [updateMessage, setUpdateMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const result = await api.users.getMe();
      if (result.success && result.data) {
        setUser(result.data);
      } else {
        setAccessToken(null)
        navigate('/');
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await api.auth.logout();
    setAccessToken(null)
    navigate('/');
  };

  const handleUpdateEmail = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUpdating(true);
    setUpdateMessage('');

    try {
      // Menggunakan api.js bukan fetcher manual
      const result = await api.users.updateEmail({ email: newEmail });

      if (result.success) {
        setUpdateMessage('[SUCCESS] ' + result.message);
        setNewEmail('');
      } else {
        setUpdateMessage('[ERROR] ' + (result.message || 'Failed to update email.'));
      }
    } catch (err) {
      setUpdateMessage('[ERROR] Network Error.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="p-8 text-sm bg-[var(--background)] text-[var(--foreground)]">Loading Dashboard...</div>;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-[var(--background)] text-[var(--foreground)] min-h-screen">
      
      {/* Header Dashboard */}
      <div className="flex justify-between items-center border-b border-[var(--foreground)] pb-4 mb-8">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <button 
          onClick={handleLogout} 
          className="border border-[var(--foreground)] bg-[var(--background)] text-[var(--foreground)] px-4 py-1.5 text-sm font-bold hover:bg-[var(--foreground)] hover:text-[var(--background)] transition-colors"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* User Profile Card */}
        <section className="border border-[var(--foreground)] p-6 bg-[var(--background)]">
          <h2 className="text-sm font-bold uppercase mb-4 border-b border-[var(--foreground)] pb-2">
            User Profile
          </h2>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <span>Username</span>
              <span className="font-bold">{user.username}</span>
            </div>
            <div className="flex justify-between">
              <span>Email</span>
              <span className="font-bold">{user.email || 'Not Set'}</span>
            </div>
          </div>
        </section>

        {/* Update Email Card */}
        <section className="border border-[var(--foreground)] p-6 bg-[var(--background)]">
          <h2 className="text-sm font-bold uppercase mb-4 border-b border-[var(--foreground)] pb-2">
            Update Email
          </h2>
          <form onSubmit={handleUpdateEmail} className="flex flex-col gap-3">
            <input 
              type="email" 
              placeholder="Enter new email..." 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
              className="w-full border border-[var(--foreground)] p-2 text-sm bg-[var(--background)] text-[var(--foreground)] outline-none"
            />
            <button 
              type="submit" 
              disabled={isUpdating}
              className="bg-[var(--foreground)] text-[var(--background)] py-2.5 text-sm font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {isUpdating ? 'Sending...' : 'Update Email'}
            </button>
          </form>
          {updateMessage && (
            <p className="mt-3 text-xs font-bold uppercase">
              {updateMessage}
            </p>
          )}
        </section>

      </div>
    </div>
  );
}