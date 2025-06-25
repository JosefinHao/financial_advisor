import React, { useState, useEffect } from 'react';
import './RemindersPage.css';

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    dueDate: '',
    frequency: 'once',
    category: 'bills',
    priority: 'medium',
    status: 'pending'
  });

  // Sample data for demonstration
  useEffect(() => {
    const sampleReminders = [
      {
        id: 1,
        title: 'Car Insurance Payment',
        description: 'Monthly car insurance premium due',
        amount: 125.00,
        dueDate: '2024-01-15',
        frequency: 'monthly',
        category: 'insurance',
        priority: 'high',
        status: 'pending',
        createdAt: '2024-01-01'
      },
      {
        id: 2,
        title: 'Credit Card Payment',
        description: 'Visa credit card minimum payment',
        amount: 45.00,
        dueDate: '2024-01-20',
        frequency: 'monthly',
        category: 'credit',
        priority: 'high',
        status: 'pending',
        createdAt: '2024-01-02'
      },
      {
        id: 3,
        title: 'Electric Bill',
        description: 'Monthly electricity bill payment',
        amount: 85.50,
        dueDate: '2024-01-25',
        frequency: 'monthly',
        category: 'bills',
        priority: 'medium',
        status: 'pending',
        createdAt: '2024-01-03'
      },
      {
        id: 4,
        title: 'Investment Contribution',
        description: 'Monthly contribution to 401(k)',
        amount: 500.00,
        dueDate: '2024-01-31',
        frequency: 'monthly',
        category: 'investments',
        priority: 'medium',
        status: 'completed',
        createdAt: '2024-01-04'
      },
      {
        id: 5,
        title: 'Property Tax',
        description: 'Annual property tax payment',
        amount: 2400.00,
        dueDate: '2024-03-15',
        frequency: 'yearly',
        category: 'taxes',
        priority: 'high',
        status: 'pending',
        createdAt: '2024-01-05'
      }
    ];
    setReminders(sampleReminders);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingReminder) {
      // Update existing reminder
      setReminders(prev => prev.map(reminder => 
        reminder.id === editingReminder.id 
          ? { ...formData, id: reminder.id, createdAt: reminder.createdAt }
          : reminder
      ));
      setEditingReminder(null);
    } else {
      // Add new reminder
      const newReminder = {
        ...formData,
        id: Date.now(),
        createdAt: new Date().toISOString().split('T')[0]
      };
      setReminders(prev => [...prev, newReminder]);
    }
    
    resetForm();
    setShowAddForm(false);
  };

  const handleEdit = (reminder) => {
    setFormData(reminder);
    setEditingReminder(reminder);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id ? { ...reminder, status: newStatus } : reminder
    ));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      dueDate: '',
      frequency: 'once',
      category: 'bills',
      priority: 'medium',
      status: 'pending'
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'pending': return '#ffc107';
      case 'overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      bills: '💡',
      credit: '💳',
      insurance: '🛡️',
      investments: '📈',
      taxes: '📋',
      loans: '🏦',
      subscriptions: '📱',
      other: '📝'
    };
    return icons[category] || '📝';
  };

  const getFrequencyText = (frequency) => {
    const frequencies = {
      once: 'One-time',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    };
    return frequencies[frequency] || frequency;
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesFilter = filter === 'all' || reminder.status === filter;
    const matchesSearch = reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reminder.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getDaysUntilDue = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDueStatus = (dueDate, status) => {
    if (status === 'completed') return 'completed';
    const daysUntil = getDaysUntilDue(dueDate);
    if (daysUntil < 0) return 'overdue';
    if (daysUntil <= 3) return 'urgent';
    if (daysUntil <= 7) return 'soon';
    return 'upcoming';
  };

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    completed: reminders.filter(r => r.status === 'completed').length,
    overdue: reminders.filter(r => getDueStatus(r.dueDate, r.status) === 'overdue').length,
    totalAmount: reminders.reduce((sum, r) => sum + (r.amount || 0), 0)
  };

  return (
    <div className="reminders-page">
      <div className="reminders-header">
        <h2>⏰ Financial Reminders</h2>
        <p>Stay on top of your financial obligations with smart reminders and tracking</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Total Reminders</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{stats.overdue}</h3>
            <p>Overdue</p>
          </div>
        </div>
        <div className="stat-card total-amount">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>${stats.totalAmount.toLocaleString()}</h3>
            <p>Total Amount</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="reminders-controls">
        <div className="controls-left">
          <button 
            className="add-reminder-btn"
            onClick={() => {
              resetForm();
              setShowAddForm(true);
              setEditingReminder(null);
            }}
          >
            + Add Reminder
          </button>
        </div>
        
        <div className="controls-right">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search reminders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Reminders</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="form-overlay">
          <div className="form-modal">
            <div className="form-header">
              <h3>{editingReminder ? 'Edit Reminder' : 'Add New Reminder'}</h3>
              <button 
                className="close-btn"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingReminder(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="reminder-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="e.g., Car Insurance Payment"
                  />
                </div>
                
                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="bills">Bills</option>
                    <option value="credit">Credit Cards</option>
                    <option value="insurance">Insurance</option>
                    <option value="investments">Investments</option>
                    <option value="taxes">Taxes</option>
                    <option value="loans">Loans</option>
                    <option value="subscriptions">Subscriptions</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Frequency</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  >
                    <option value="once">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Add any additional details about this reminder..."
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowAddForm(false);
                  setEditingReminder(null);
                  resetForm();
                }}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingReminder ? 'Update Reminder' : 'Add Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminders List */}
      <div className="reminders-list">
        {filteredReminders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No reminders found</h3>
            <p>Create your first reminder to get started with financial tracking</p>
            <button 
              className="add-first-btn"
              onClick={() => {
                resetForm();
                setShowAddForm(true);
              }}
            >
              Add Your First Reminder
            </button>
          </div>
        ) : (
          filteredReminders.map(reminder => {
            const dueStatus = getDueStatus(reminder.dueDate, reminder.status);
            const daysUntil = getDaysUntilDue(reminder.dueDate);
            
            return (
              <div key={reminder.id} className={`reminder-card ${dueStatus}`}>
                <div className="reminder-header">
                  <div className="reminder-icon">
                    {getCategoryIcon(reminder.category)}
                  </div>
                  <div className="reminder-info">
                    <h4>{reminder.title}</h4>
                    <p>{reminder.description}</p>
                    <div className="reminder-meta">
                      <span className="category">{reminder.category}</span>
                      <span className="frequency">{getFrequencyText(reminder.frequency)}</span>
                    </div>
                  </div>
                  <div className="reminder-amount">
                    {reminder.amount && <span>${reminder.amount.toLocaleString()}</span>}
                  </div>
                </div>
                
                <div className="reminder-details">
                  <div className="detail-item">
                    <span className="label">Due Date:</span>
                    <span className="value">{new Date(reminder.dueDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="label">Status:</span>
                    <span className={`status-badge ${reminder.status}`}>
                      {reminder.status}
                    </span>
                  </div>
                  
                  <div className="detail-item">
                    <span className="label">Priority:</span>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(reminder.priority) }}
                    >
                      {reminder.priority}
                    </span>
                  </div>
                  
                  {dueStatus !== 'completed' && (
                    <div className="detail-item">
                      <span className="label">Time Left:</span>
                      <span className={`time-left ${dueStatus}`}>
                        {dueStatus === 'overdue' 
                          ? `${Math.abs(daysUntil)} days overdue`
                          : `${daysUntil} days left`
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="reminder-actions">
                  {reminder.status !== 'completed' && (
                    <button
                      className="complete-btn"
                      onClick={() => handleStatusChange(reminder.id, 'completed')}
                    >
                      Mark Complete
                    </button>
                  )}
                  
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(reminder)}
                  >
                    Edit
                  </button>
                  
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(reminder.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RemindersPage;