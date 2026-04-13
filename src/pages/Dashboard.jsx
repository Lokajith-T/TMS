import React from 'react';

const Dashboard = ({ onLogout }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#121212] p-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">You are not logged in</h2>
        <p className="text-gray-500 mb-6">Please sign in to access your dashboard.</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
        >
          Go to Login
        </button>
      </div>
    );
  }

  let user;
  try {
    const payload = token.split('.')[1];
    user = JSON.parse(atob(payload));
  } catch (err) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#121212] p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Invalid Session</h2>
        <p className="text-gray-500 mb-6">Your session has expired or is invalid. Please sign in again.</p>
        <button 
          onClick={() => { localStorage.removeItem('token'); window.location.reload(); }} 
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
        >
          Sign In Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] transition-colors duration-300">
      {/* Navigation */}
      <nav className="bg-white dark:bg-[#1c1c1c] border-b border-gray-200 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">TMS Dashboard</h1>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block">{user.role}</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Welcome, <span className="font-semibold">{user.email}</span>
              </span>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                if (onLogout) onLogout();
                else window.location.reload();
              }}
              className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-white dark:bg-[#1c1c1c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-sm text-gray-500">Active Tasks</p>
            <h2 className="text-3xl font-bold text-blue-600">12</h2>
          </div>
          <div className="bg-white dark:bg-[#1c1c1c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-sm text-gray-500">Team Members</p>
            <h2 className="text-3xl font-bold text-purple-600">8</h2>
          </div>
          <div className="bg-white dark:bg-[#1c1c1c] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-sm text-gray-500">Project Progress</p>
            <h2 className="text-3xl font-bold text-green-600">84%</h2>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white dark:bg-[#1c1c1c] p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-lg">
          <h3 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Recent Activity</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-4 bg-gray-50 dark:bg-[#252525] rounded-xl border border-gray-100 dark:border-gray-700/50">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Task updated: "UI Refactor"</p>
                  <p className="text-sm text-gray-500">2 hours ago</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
