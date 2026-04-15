import React, { useState } from 'react';
import { loginUser } from '../api/api';

/**
 * LoginPage Component
 * A modern, professional login interface for the Team Management System (TMS).
 * Features light/dark mode support, responsive design, and loading states.
 */
const LoginPage = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginUser(email, password);

      // Check if the response is valid JSON
      const contentType = response.headers.get("content-type");
      let data = {};
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (response.ok) {
        // ✅ Store token
        localStorage.setItem('token', data.access_token);
        alert('Login successful');
        
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        console.log('Login successful', data);
      } else {
        // Handle error message from API or server error
        const errorMessage = data.detail || (response.status === 502 ? 'Server is offline (Bad Gateway)' : 'Login failed');
        setError(errorMessage);
        console.error('Login failed:', errorMessage);
      }
    } catch (err) {
      // Handle network or unexpected errors
      setError('Connection failed. Please ensure the backend server is running.');
      console.error('Network error:', err);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030303] p-4 sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.18),transparent_36%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_92%,rgba(255,255,255,0.12),transparent_44%)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-120px] h-[420px] w-[160px] -translate-x-1/2 rotate-[24deg] bg-[linear-gradient(180deg,rgba(255,255,255,0.88)_0%,rgba(170,170,170,0.4)_38%,rgba(40,40,40,0)_100%)] blur-2xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-2rem)] max-w-6xl items-center justify-center">
        <div className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0b0b0b]/75 p-5 shadow-[0_25px_90px_rgba(0,0,0,0.72)] backdrop-blur-md sm:p-7">
          <div className="mb-6 text-center" style={{ fontFamily: 'Poppins, sans-serif' }}>
            <h1 className="text-3xl font-semibold italic tracking-tight text-white sm:text-4xl">TMS</h1>
            <p className="mt-2 text-base font-semibold text-white/90 sm:text-lg">Welcome Back</p>
            <p className="mt-1 text-xs text-white/60 sm:text-sm">Please sign in with your email and password.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-300/30 bg-red-400/10 px-3 py-2 text-sm text-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="Enter your email"
                className="w-full rounded-lg border border-white/15 bg-[#101010]/95 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/50 sm:py-3"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="w-full rounded-lg border border-white/15 bg-[#101010]/95 px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-white/50 sm:py-3"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 w-full rounded-lg bg-[linear-gradient(90deg,#2f2f2f_0%,#171717_100%)] py-2.5 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-60 sm:py-3"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-semibold text-white/70">
            Team management System | CHAI
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
