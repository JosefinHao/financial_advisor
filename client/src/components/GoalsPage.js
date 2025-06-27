import React, { useState, useEffect } from 'react';
import './GoalsPage.css';

function GoalsPage() {
  const [goals, setGoals] = useState([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUpdateProgressModal, setShowUpdateProgressModal] = useState(false);
  const [goalToUpdate, setGoalToUpdate] = useState(null);
  const [progressValue, setProgressValue] = useState('');
  const [filter, setFilter] = useState('all');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'savings',
    targetAmount: '',
    targetDate: '',
    priority: 'medium'
  });

  // Sample goals data
  const sampleGoals = [
    {
      id: 1,
      title: 'Emergency Fund',
      description: 'Build 6 months of expenses',
      category: 'savings',
      targetAmount: 15000,
      currentAmount: 8500,
      targetDate: '2024-12-31',
      priority: 'high',
      status: 'active',
      createdAt: '2024-01-15'
    },
    {
      id: 2,
      title: 'Vacation Fund',
      description: 'Save for summer vacation',
      category: 'travel',
      targetAmount: 5000,
      currentAmount: 3200,
      targetDate: '2024-06-30',
      priority: 'medium',
      status: 'active',
      createdAt: '2024-02-01'
    },
    {
      id: 3,
      title: 'New Car Down Payment',
      description: 'Save 20% down payment for new car',
      category: 'vehicle',
      targetAmount: 8000,
      currentAmount: 8000,
      targetDate: '2024-03-15',
      priority: 'high',
      status: 'completed',
      createdAt: '2023-11-01'
    }
  ];

  useEffect(() => {
    setGoals(sampleGoals);
  }, []);

  const categories = [
    { id: 'savings', name: 'Savings', icon: '💰', color: '#4CAF50' },
    { id: 'travel', name: 'Travel', icon: '✈️', color: '#2196F3' },
    { id: 'vehicle', name: 'Vehicle', icon: '🚗', color: '#FF9800' },
    { id: 'home', name: 'Home', icon: '🏠', color: '#9C27B0' },
    { id: 'education', name: 'Education', icon: '🎓', color: '#607D8B' },
    { id: 'retirement', name: 'Retirement', icon: '🌅', color: '#795548' },
    { id: 'business', name: 'Business', icon: '💼', color: '#E91E63' },
    { id: 'other', name: 'Other', icon: '📌', color: '#757575' }
  ];

  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || categories[categories.length - 1];
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (targetDate) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'paused': return '#FF9800';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.title.trim() || !newGoal.targetAmount || !newGoal.targetDate) {
      alert('Please fill in all required fields');
      return;
    }
    if (editingGoal) {
      // Edit mode
      setGoals(prev => prev.map(goal =>
        goal.id === editingGoal.id
          ? { ...goal, ...newGoal, targetAmount: parseFloat(newGoal.targetAmount) }
          : goal
      ));
      setEditingGoal(null);
      setShowEditModal(false);
    } else {
      // Add mode
      const goal = {
        id: Date.now(),
        title: newGoal.title.trim(),
        description: newGoal.description.trim(),
        category: newGoal.category,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: 0,
        targetDate: newGoal.targetDate,
        priority: newGoal.priority,
        status: 'active',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setGoals(prev => [...prev, goal]);
      setShowAddGoal(false);
    }
    setNewGoal({
      title: '',
      description: '',
      category: 'savings',
      targetAmount: '',
      targetDate: '',
      priority: 'medium'
    });
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetAmount: goal.targetAmount,
      targetDate: goal.targetDate,
      priority: goal.priority
    });
    setShowEditModal(true);
  };

  const handleUpdateProgress = (goal) => {
    setGoalToUpdate(goal);
    setProgressValue(goal.currentAmount);
    setShowUpdateProgressModal(true);
  };

  const handleProgressSubmit = (e) => {
    e.preventDefault();
    if (progressValue === '' || isNaN(progressValue)) {
      alert('Please enter a valid amount');
      return;
    }
    setGoals(prev => prev.map(goal =>
      goal.id === goalToUpdate.id
        ? { ...goal, currentAmount: Math.max(0, Math.min(parseFloat(progressValue), goal.targetAmount)) }
        : goal
    ));
    setShowUpdateProgressModal(false);
    setGoalToUpdate(null);
    setProgressValue('');
  };

  const handleDeleteGoal = (goalId) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
    }
  };

  const handleCancelAdd = () => {
    setShowAddGoal(false);
    setShowEditModal(false);
    setEditingGoal(null);
    setNewGoal({
      title: '',
      description: '',
      category: 'savings',
      targetAmount: '',
      targetDate: '',
      priority: 'medium'
    });
  };

  const filteredGoals = goals.filter(goal => {
    if (filter === 'all') return true;
    if (filter === 'active') return goal.status === 'active';
    if (filter === 'completed') return goal.status === 'completed';
    return goal.category === filter;
  });

  const totalGoals = goals.length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  const showGoalModal = showAddGoal || showEditModal;
  const isEditMode = !!editingGoal;

  return (
    <div className="goals-container">
      <div className="goals-header">
        <h2>Goal Tracking</h2>
        <p>Set financial targets, track your progress, and achieve your dreams.</p>
      </div>

      {/* Stats Overview */}
      <div className="goals-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '10px' }}>
        <div className="stat-card" style={{ background: 'var(--card-bg)', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '45px' }}>
          <div className="stat-icon" style={{ fontSize: '1.1rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius: '50%', color: 'white', flexShrink: 0 }}>📊</div>
          <div className="stat-content">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 3px 0', lineHeight: 1 }}>{totalGoals}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0, fontWeight: 500, lineHeight: 1 }}>Total Goals</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'var(--card-bg)', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '45px' }}>
          <div className="stat-icon" style={{ fontSize: '1.1rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius: '50%', color: 'white', flexShrink: 0 }}>🚀</div>
          <div className="stat-content">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 3px 0', lineHeight: 1 }}>{activeGoals}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0, fontWeight: 500, lineHeight: 1 }}>Active Goals</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'var(--card-bg)', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '45px' }}>
          <div className="stat-icon" style={{ fontSize: '1.1rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius: '50%', color: 'white', flexShrink: 0 }}>✅</div>
          <div className="stat-content">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 3px 0', lineHeight: 1 }}>{completedGoals}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0, fontWeight: 500, lineHeight: 1 }}>Completed</p>
          </div>
        </div>
        <div className="stat-card" style={{ background: 'var(--card-bg)', borderRadius: '8px', padding: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px', minHeight: '45px' }}>
          <div className="stat-icon" style={{ fontSize: '1.1rem', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', borderRadius: '50%', color: 'white', flexShrink: 0 }}>💰</div>
          <div className="stat-content">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 3px 0', lineHeight: 1 }}>${totalCurrentAmount.toLocaleString()}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0, fontWeight: 500, lineHeight: 1 }}>Total Saved</p>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="overall-progress" style={{ background: 'var(--card-bg)', borderRadius: 'var(--radius)', padding: '12px', boxShadow: 'var(--shadow)', marginBottom: '20px' }}>
        <div className="progress-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Overall Progress</h3>
          <span className="progress-percentage" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(74, 144, 226, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>{overallProgress.toFixed(1)}%</span>
        </div>
        <div className="progress-bar" style={{ width: '100%', height: '8px', background: '#f0f0f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '6px' }}>
          <div 
            className="progress-fill" 
            style={{ 
              width: `${overallProgress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-dark) 100%)',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }}
          ></div>
        </div>
        <div className="progress-details" style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-light)', fontWeight: 500 }}>
          <span>${totalCurrentAmount.toLocaleString()} of ${totalTargetAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="goals-controls">
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Goals
          </button>
          <button 
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Completed
          </button>
          {categories.map(category => (
            <button 
              key={category.id}
              className={`filter-btn ${filter === category.id ? 'active' : ''}`}
              onClick={() => setFilter(category.id)}
              style={{ '--category-color': category.color }}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
        <button 
          className="add-goal-btn"
          onClick={() => setShowAddGoal(true)}
        >
          + Add New Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="goals-list">
        {filteredGoals.length === 0 ? (
          <div className="no-goals">
            <div className="no-goals-icon">🎯</div>
            <h3>No goals found</h3>
            <p>Create your first financial goal to get started!</p>
            <button 
              className="add-goal-btn"
              onClick={() => setShowAddGoal(true)}
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          filteredGoals.map(goal => {
            const category = getCategoryInfo(goal.category);
            const progress = getProgressPercentage(goal.currentAmount, goal.targetAmount);
            const daysRemaining = getDaysRemaining(goal.targetDate);
            
            return (
              <div key={goal.id} className={`goal-card ${goal.status}`}>
                <div className="goal-header">
                  <div className="goal-title-section">
                    <div 
                      className="category-badge"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.icon}
                    </div>
                    <div className="goal-info">
                      <h3>{goal.title}</h3>
                      <p>{goal.description}</p>
                    </div>
                  </div>
                  <div className="goal-actions">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(goal.priority) }}
                    >
                      {goal.priority}
                    </span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(goal.status) }}
                    >
                      {goal.status}
                    </span>
                  </div>
                </div>

                <div className="goal-progress">
                  <div className="progress-info">
                    <span className="amount">${goal.currentAmount.toLocaleString()}</span>
                    <span className="separator">/</span>
                    <span className="target">${goal.targetAmount.toLocaleString()}</span>
                    <span className="percentage">({progress.toFixed(1)}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: category.color
                      }}
                    ></div>
                  </div>
                </div>

                <div className="goal-details">
                  <div className="detail-item">
                    <span className="label">Target Date:</span>
                    <span className="value">{new Date(goal.targetDate).toLocaleDateString()}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Days Remaining:</span>
                    <span className={`value ${daysRemaining < 0 ? 'overdue' : daysRemaining < 30 ? 'urgent' : ''}`}>
                      {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days`}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Monthly Target:</span>
                    <span className="value">
                      ${Math.ceil((goal.targetAmount - goal.currentAmount) / Math.max(1, Math.ceil(daysRemaining / 30))).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="goal-actions-bottom">
                  <button className="action-btn edit-btn" onClick={() => handleEditGoal(goal)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                  </button>
                  <button className="action-btn update-btn" onClick={() => handleUpdateProgress(goal)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                    </svg>
                    Update Progress
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteGoal(goal.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18"/>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)' }}>{isEditMode ? 'Edit Goal' : 'Add New Goal'}</h3>
              <button 
                onClick={handleCancelAdd}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-light)',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAddGoal(); }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                  Goal Title *
                </label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Emergency Fund"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                  Description
                </label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of your goal"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                  Category
                </label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                  Target Amount ($) *
                </label>
                <input
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                  Target Date *
                </label>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                  Priority
                </label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCancelAdd}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  {isEditMode ? 'Save Changes' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Progress Modal */}
      {showUpdateProgressModal && goalToUpdate && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>Update Progress</h3>
              <button 
                onClick={() => setShowUpdateProgressModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-light)',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleProgressSubmit}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text)' }}>
                  Current Amount Saved ($)
                </label>
                <input
                  type="number"
                  value={progressValue}
                  onChange={e => setProgressValue(e.target.value)}
                  min="0"
                  max={goalToUpdate.targetAmount}
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    background: 'var(--bg)',
                    color: 'var(--text)'
                  }}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowUpdateProgressModal(false)}
                  style={{
                    padding: '10px 20px',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    background: 'var(--bg)',
                    color: 'var(--text)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '6px',
                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalsPage; 