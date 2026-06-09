import React, { useEffect, useState } from 'react';
import { Mail, Sparkles, LogIn, UserPlus, KeyRound, User } from 'lucide-react';

type AuthMode = 'oauth' | 'login' | 'signup';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('oauth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refresh_token');
    const userJson = params.get('user');

    if (token && userJson) {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
      localStorage.setItem('user', decodeURIComponent(userJson));
      window.location.href = '/';
    }
  }, []);

  const handleGoogleLogin = () => {
    // Redirect to NestJS backend OAuth endpoint
    window.location.href = 'http://localhost:3000/auth/google';
  };

  const handleSimulateLogin = () => {
    // Local developer override bypass to explore dashboard offline
    localStorage.setItem('token', 'simulated-dev-jwt');
    localStorage.setItem('refresh_token', 'simulated-dev-refresh-token');
    localStorage.setItem('user', JSON.stringify({
      name: 'Atul Raina',
      email: 'atul@example.com',
      avatar: ''
    }));
    window.location.href = '/';
  };

  const handleManualAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = mode === 'login' ? 'http://localhost:3000/auth/login' : 'http://localhost:3000/auth/signup';
    const body = mode === 'login' ? { email, password } : { email, password, name };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed. Please check credentials.');
      }

      // Save tokens and profile
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || 'Network error connecting to authentication server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />

      <div className="w-full max-w-md bg-card border border-border rounded-3xl p-8 relative shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header logo */}
        <div className="flex flex-col items-center text-center space-y-2.5">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Welcome to JAIP</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Job Application Intelligence Platform
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 bg-muted/30 p-1.5 rounded-xl border border-border/40 text-xs font-semibold">
          <button
            onClick={() => { setMode('oauth'); setError(null); }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${mode === 'oauth' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Google
          </button>
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${mode === 'login' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            className={`py-2 rounded-lg transition-all cursor-pointer ${mode === 'signup' ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Sign Up
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive font-medium leading-relaxed">
            {error}
          </div>
        )}

        {/* Mode 1: Google OAuth */}
        {mode === 'oauth' && (
          <div className="space-y-6">
            <div className="space-y-3.5 text-xs text-muted-foreground bg-muted/20 p-4 rounded-2xl border border-border/30">
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>**Automatic Syncing**: Connects to your Gmail inbox to identify application milestones.</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p>**Structured Analysis**: Automatically logs active timeline events in PostgreSQL.</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground px-5 py-3 rounded-2xl text-sm font-semibold hover:opacity-90 cursor-pointer shadow-md shadow-primary/10 transition-all duration-200"
              >
                <LogIn className="h-4.5 w-4.5" />
                <span>Sign in with Google</span>
              </button>
              
              <button
                onClick={handleSimulateLogin}
                className="w-full flex items-center justify-center px-5 py-2.5 text-xs font-medium border border-border text-muted-foreground hover:bg-muted hover:text-foreground rounded-xl transition cursor-pointer"
              >
                Bypass & Simulate Offline Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Mode 2: Manual Login / Signup */}
        {(mode === 'login' || mode === 'signup') && (
          <form onSubmit={handleManualAuth} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Atul Raina"
                  className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5" /> Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-2xl text-xs font-semibold hover:opacity-90 cursor-pointer shadow-md shadow-primary/10 transition-all duration-200 mt-6"
            >
              {loading ? (
                <span>Processing...</span>
              ) : mode === 'login' ? (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Sign In</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
