import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DashboardPage.css';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/dashboard');
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

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-chat':
        navigate('/chat');
        break;
      case 'add-goal':
        navigate('/goals');
        break;
      case 'document-analysis':
        navigate('/upload-document');
        break;
      case 'set-reminder':
        navigate('/reminders');
        break;
      default:
        console.log(`Quick action: ${action}`);
    }
  };

  const handleGoalClick = (goalId) => {
    navigate('/goals');
  };

  const handleReminderClick = (reminderId) => {
    navigate('/reminders');
  };

  const handleStatCardClick = (statType) => {
    switch (statType) {
      case 'goals':
        navigate('/goals');
        break;
      case 'reminders':
        navigate('/reminders');
        break;
      case 'activity':
        navigate('/chat');
        break;
      case 'documents':
        navigate('/documents');
        break;
      default:
        console.log(`Stat card clicked: ${statType}`);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="header">
        <h2 className="title">Financial Dashboard</h2>
        <p className="subtitle">Your financial overview and quick insights</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-section">
        <h3 className="section-title">📈 Overview</h3>
        <div className="stats-grid">
          {/* Goals Overview */}
          <div className="stat-card clickable" onClick={() => handleStatCardClick('goals')}>
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <h4>Goals</h4>
              <div className="stat-numbers">
                <div className="stat-main">{dashboardData?.goals?.total || 0}</div>
                <div className="stat-sub">{dashboardData?.goals?.on_track || 0} on track</div>
              </div>
            </div>
          </div>

          {/* Reminders Overview */}
          <div className="stat-card clickable" onClick={() => handleStatCardClick('reminders')}>
            <div className="stat-icon">⏰</div>
            <div className="stat-content">
              <h4>Reminders</h4>
              <div className="stat-numbers">
                <div className="stat-main">{dashboardData?.reminders?.upcoming_7_days || 0}</div>
                <div className="stat-sub">{dashboardData?.reminders?.overdue || 0} overdue</div>
              </div>
            </div>
          </div>

          {/* Activity Overview */}
          <div className="stat-card clickable" onClick={() => handleStatCardClick('activity')}>
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <h4>Activity</h4>
              <div className="stat-numbers">
                <div className="stat-main">{dashboardData?.recent_activity?.conversations_7_days || 0}</div>
                <div className="stat-sub">{dashboardData?.recent_activity?.messages_7_days || 0} messages</div>
              </div>
            </div>
          </div>

          {/* Documents Overview */}
          <div className="stat-card clickable" onClick={() => handleStatCardClick('documents')}>
            <div className="stat-icon">📄</div>
            <div className="stat-content">
              <h4>Documents</h4>
              <div className="stat-numbers">
                <div className="stat-main">{dashboardData?.recent_activity?.documents_uploaded || 0}</div>
                <div className="stat-sub">uploaded</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="actions-section">
        <h3 className="section-title">⚡ Quick Actions</h3>
        <div className="actions-grid">
          <button 
            className="action-btn primary"
            onClick={() => handleQuickAction('new-chat')}
          >
            <div className="action-icon">💬</div>
            <span>New Chat</span>
          </button>
          <button 
            className="action-btn success"
            onClick={() => handleQuickAction('add-goal')}
          >
            <div className="action-icon">🎯</div>
            <span>Add Goal</span>
          </button>
          <button 
            className="action-btn info"
            onClick={() => handleQuickAction('document-analysis')}
          >
            <div className="action-icon">📄</div>
            <span>Document Analysis</span>
          </button>
          <button 
            className="action-btn warning"
            onClick={() => handleQuickAction('set-reminder')}
          >
            <div className="action-icon">⏰</div>
            <span>Set Reminder</span>
          </button>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="summary-section">
        <h3 className="section-title">💰 Financial Summary</h3>
        <div className="summary-grid">
          <div className="summary-card clickable" onClick={() => navigate('/net-worth')}>
            <div className="summary-icon">📈</div>
            <div className="summary-content">
              <h4>Net Worth</h4>
              <div className="summary-value">$125,450</div>
              <div className="summary-change positive">+$2,340 this month</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💳</div>
            <div className="summary-content">
              <h4>Monthly Savings</h4>
              <div className="summary-value">$1,850</div>
              <div className="summary-change positive">85% of target</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <h4>Investment Return</h4>
              <div className="summary-value">8.2%</div>
              <div className="summary-change positive">+1.3% vs last month</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">🏠</div>
            <div className="summary-content">
              <h4>Debt-to-Income</h4>
              <div className="summary-value">28%</div>
              <div className="summary-change negative">Target: 25%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="conversations-section">
        <h3 className="section-title">💬 Recent Conversations</h3>
        <div className="conversations-grid">
          <div className="conversation-card clickable" onClick={() => navigate('/chat')}>
            <div className="conversation-header">
              <h4>Retirement Planning Discussion</h4>
              <span className="conversation-date">2 hours ago</span>
            </div>
            <p className="conversation-preview">Discussed 401(k) allocation and Roth IRA contributions...</p>
            <div className="conversation-tags">
              <span className="tag">Retirement</span>
              <span className="tag">Investing</span>
            </div>
          </div>
          <div className="conversation-card clickable" onClick={() => navigate('/chat')}>
            <div className="conversation-header">
              <h4>Budget Review Session</h4>
              <span className="conversation-date">Yesterday</span>
            </div>
            <p className="conversation-preview">Analyzed monthly expenses and identified savings opportunities...</p>
            <div className="conversation-tags">
              <span className="tag">Budgeting</span>
              <span className="tag">Savings</span>
            </div>
          </div>
          <div className="conversation-card clickable" onClick={() => navigate('/chat')}>
            <div className="conversation-header">
              <h4>Tax Planning Questions</h4>
              <span className="conversation-date">3 days ago</span>
            </div>
            <p className="conversation-preview">Explored tax-efficient investment strategies and deductions...</p>
            <div className="conversation-tags">
              <span className="tag">Taxes</span>
              <span className="tag">Planning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Insights */}
      <div className="insights-section">
        <h3 className="section-title">💡 Quick Insights</h3>
        <div className="insights-grid">
          <div className="insight-card positive">
            <div className="insight-icon">✅</div>
            <div className="insight-content">
              <h4>Great Progress!</h4>
              <p>You're on track to reach your emergency fund goal 2 months early.</p>
            </div>
          </div>
          <div className="insight-card warning">
            <div className="insight-icon">⚠️</div>
            <div className="insight-content">
              <h4>Action Needed</h4>
              <p>Consider increasing your 401(k) contribution to maximize employer match.</p>
            </div>
          </div>
          <div className="insight-card info">
            <div className="insight-icon">💡</div>
            <div className="insight-content">
              <h4>Smart Move</h4>
              <p>Your diversified portfolio is performing well in current market conditions.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Goals */}
      {dashboardData?.recent_goals && dashboardData.recent_goals.length > 0 && (
        <div className="goals-section">
          <h3 className="section-title">🎯 Recent Goals</h3>
          <div className="goals-grid">
            {dashboardData.recent_goals.map((goal) => (
              <div key={goal.id} className="goal-card clickable" onClick={() => handleGoalClick(goal.id)}>
                <div className="goal-header">
                  <h4 className="goal-title">{goal.name}</h4>
                  <span className="goal-progress-text">{goal.progress_percentage.toFixed(1)}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                  ></div>
                </div>
                <div className="goal-meta">
                  <span className="goal-category">{goal.category}</span>
                  <span className="goal-deadline">{new Date(goal.deadline).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {dashboardData?.upcoming_reminders && dashboardData.upcoming_reminders.length > 0 && (
        <div className="reminders-section">
          <h3 className="section-title">⏰ Upcoming Reminders</h3>
          <div className="reminders-grid">
            {dashboardData.upcoming_reminders.map((reminder) => (
              <div key={reminder.id} className="reminder-card clickable" onClick={() => handleReminderClick(reminder.id)}>
                <div className="reminder-header">
                  <h4 className="reminder-title">{reminder.title}</h4>
                  <span className="reminder-date">{new Date(reminder.reminder_datetime).toLocaleDateString()}</span>
                </div>
                <p className="reminder-description">{reminder.description}</p>
                <div className="reminder-meta">
                  <span className="reminder-type">{reminder.type}</span>
                  <span className="reminder-priority">{reminder.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {(!dashboardData || Object.keys(dashboardData).length === 0) && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>Welcome to your Dashboard!</h3>
          <p>Start by adding some goals, setting reminders, or having a chat with your AI advisor.</p>
          <div className="empty-actions">
            <button 
              className="action-btn primary"
              onClick={() => handleQuickAction('new-chat')}
            >
              Start Chat
            </button>
            <button 
              className="action-btn success"
              onClick={() => handleQuickAction('add-goal')}
            >
              Add Goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;