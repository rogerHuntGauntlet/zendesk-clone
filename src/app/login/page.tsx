'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';
  const supabase = createClientComponentClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Successful login, redirect to the original destination
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-white/80">Sign in to continue to your portal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="you@company.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center space-y-4">
        <Link
          href="/"
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          ← Back to Portal Selection
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <Suspense fallback={
        <div className="bg-white/10 backdrop-blur-sm p-8 rounded-xl w-full max-w-md">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-white/10 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
} 