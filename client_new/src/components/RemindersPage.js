import React, { useState, useEffect } from 'react';

const RemindersPage = () => {
  const [reminders, setReminders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminder_date: '',
    reminder_time: '',
    frequency: 'once',
    category: 'general',
    priority: 'medium'
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/reminders');
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      }
    } catch (err) {
      console.error('Error fetching reminders:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createReminder = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const reminderDateTime = new Date(`${formData.reminder_date}T${formData.reminder_time}`);

      const response = await fetch('http://127.0.0.1:5000/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          reminder_datetime: reminderDateTime.toISOString(),
          frequency: formData.frequency,
          category: formData.category,
          priority: formData.priority
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create reminder');
      }

      const newReminder = await response.json();
      setReminders(prev => [...prev, newReminder]);
      setFormData({
        title: '',
        description: '',
        reminder_date: '',
        reminder_time: '',
        frequency: 'once',
        category: 'general',
        priority: 'medium'
      });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteReminder = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:5000/reminders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReminders(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error('Error deleting reminder:', err);
    }
  };

  const markAsCompleted = async (id) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/reminders/${id}/complete`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setReminders(prev => prev.map(r =>
          r.id === id ? { ...r, completed: true } : r
        ));
      }
    } catch (err) {
      console.error('Error marking reminder as completed:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ff4444';
      case 'medium': return '#ffaa00';
      case 'low': return '#00aa00';
      default: return '#666';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'bill': return '💳';
      case 'investment': return '📈';
      case 'tax': return '📋';
      case 'insurance': return '🛡️';
      case 'savings': return '💰';
      default: return '📅';
    }
  };

  return (
    <div className="reminders-container">
      <div className="reminders-header">
        <h2>⏰ Financial Reminders</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="add-reminder-button"
        >
          {showForm ? 'Cancel' : '+ Add New Reminder'}
        </button>
      </div>

      {showForm && (
        <div className="reminder-form-container">
          <h3>Create New Reminder</h3>
          <form onSubmit={createReminder} className="reminder-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Pay credit card bill"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="general">General</option>
                  <option value="bill">Bill Payment</option>
                  <option value="investment">Investment</option>
                  <option value="tax">Tax Related</option>
                  <option value="insurance">Insurance</option>
                  <option value="savings">Savings</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Additional details about this reminder..."
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reminder_date">Date *</label>
                <input
                  type="date"
                  id="reminder_date"
                  name="reminder_date"
                  value={formData.reminder_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="reminder_time">Time *</label>
                <input
                  type="time"
                  id="reminder_time"
                  name="reminder_time"
                  value={formData.reminder_time}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="frequency">Frequency</label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                >
                  <option value="once">One Time</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="submit-reminder-button">
              {loading ? 'Creating...' : 'Create Reminder'}
            </button>
          </form>
        </div>
      )}

      <div className="reminders-list">
        {reminders.length === 0 ? (
          <div className="no-reminders">
            <p>No reminders set yet. Create your first financial reminder!</p>
          </div>
        ) : (
          reminders.map((reminder) => (
            <div key={reminder.id} className={`reminder-card ${reminder.completed ? 'completed' : ''}`}>
              <div className="reminder-header">
                <div className="reminder-title">
                  <span className="category-icon">{getCategoryIcon(reminder.category)}</span>
                  <h3>{reminder.title}</h3>
                </div>
                <div className="reminder-meta">
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(reminder.priority) }}
                  >
                    {reminder.priority}
                  </span>
                  <span className="frequency-badge">{reminder.frequency}</span>
                </div>
              </div>

              {reminder.description && (
                <p className="reminder-description">{reminder.description}</p>
              )}

              <div className="reminder-datetime">
                <span>📅 {new Date(reminder.reminder_datetime).toLocaleDateString()}</span>
                <span>🕐 {new Date(reminder.reminder_datetime).toLocaleTimeString()}</span>
              </div>

              <div className="reminder-actions">
                {!reminder.completed && (
                  <button
                    onClick={() => markAsCompleted(reminder.id)}
                    className="complete-button"
                  >
                    ✅ Mark Complete
                  </button>
                )}
                <button
                  onClick={() => deleteReminder(reminder.id)}
                  className="delete-button"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RemindersPage;