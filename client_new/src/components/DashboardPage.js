import React, { useState, useEffect } from 'react';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-lg">
        <div className="text-gray-600 text-lg">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-red-50 rounded-lg">
        <div className="text-red-600 text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">📊 Financial Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {/* Goals Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">🎯 Goals Overview</h3>
          {dashboardData?.goals ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{dashboardData.goals.total}</div>
                <div className="text-sm text-gray-500">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{dashboardData.goals.on_track}</div>
                <div className="text-sm text-gray-500">On Track</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{formatCurrency(dashboardData.goals.total_target_amount)}</div>
                <div className="text-sm text-gray-500">Total Target</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{dashboardData.goals.average_progress.toFixed(1)}%</div>
                <div className="text-sm text-gray-500">Avg Progress</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No goals data available</p>
          )}
        </div>

        {/* Reminders Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">⏰ Upcoming Reminders</h3>
          {dashboardData?.reminders ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{dashboardData.reminders.upcoming_7_days}</div>
                <div className="text-sm text-gray-500">Next 7 Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{dashboardData.reminders.overdue}</div>
                <div className="text-sm text-gray-500">Overdue</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{dashboardData.reminders.total_active}</div>
                <div className="text-sm text-gray-500">Active</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No reminders data available</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">💬 Recent Activity</h3>
          {dashboardData?.recent_activity ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{dashboardData.recent_activity.conversations_7_days}</div>
                <div className="text-sm text-gray-500">Conversations (7d)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{dashboardData.recent_activity.messages_7_days}</div>
                <div className="text-sm text-gray-500">Messages (7d)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{dashboardData.recent_activity.documents_uploaded}</div>
                <div className="text-sm text-gray-500">Documents</div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No activity data available</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
              💬 Start New Chat
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors">
              🎯 Add Goal
            </button>
            <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition-colors">
              ⏰ Set Reminder
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors">
              🧮 Calculate
            </button>
          </div>
        </div>
      </div>

      {/* Recent Goals */}
      {dashboardData?.recent_goals && dashboardData.recent_goals.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Recent Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.recent_goals.map((goal) => (
              <div key={goal.id} className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-medium text-gray-800 mb-2">{goal.name}</h4>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{goal.progress_percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {dashboardData?.upcoming_reminders && dashboardData.upcoming_reminders.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Upcoming Reminders</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.upcoming_reminders.map((reminder) => (
              <div key={reminder.id} className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="font-medium text-gray-800 mb-1">{reminder.title}</h4>
                <p className="text-sm text-gray-600">{new Date(reminder.reminder_datetime).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;