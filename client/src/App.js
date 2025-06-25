import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import DocumentUpload from './components/DocumentUpload';
import RemindersPage from './components/RemindersPage';
import DashboardPage from './components/DashboardPage';
import RetirementCalculator from './components/RetirementCalculator';
import MortgageCalculator from './components/MortgageCalculator';
import CompoundInterestCalculator from './components/CompoundInterestCalculator';

// Calculator State Context
const CalculatorStateContext = createContext();

function CalculatorStateProvider({ children }) {
  const [calculatorStates, setCalculatorStates] = useState({
    retirement: {
      formData: {
        current_age: 30,
        retirement_age: 65,
        current_savings: 50000,
        monthly_contribution: 1000,
        expected_return: 7,
        life_expectancy: 85,
        inflation_rate: 2.5,
        social_security_income: 2000,
        pension_income: 0,
        desired_retirement_income: 80000
      },
      results: null,
      loading: false,
      error: ''
    },
    mortgage: {
      formData: {
        loan_amount: 300000,
        interest_rate: 4.5,
        loan_term_years: 30,
        down_payment: 60000,
        property_tax: 3600,
        insurance: 1200,
        pmi_rate: 0.5,
        annual_income: 80000
      },
      results: null,
      loading: false,
      error: ''
    },
    compoundInterest: {
      formData: {
        initial_investment: 10000,
        monthly_contribution: 500,
        annual_interest_rate: 7,
        compounding_frequency: 'monthly',
        investment_period_years: 20,
        tax_rate: 15,
        inflation_rate: 2.5,
        contribution_increase_rate: 3
      },
      results: null,
      loading: false,
      error: ''
    }
  });

  // Load states from localStorage on mount
  useEffect(() => {
    const savedStates = localStorage.getItem('calculatorStates');
    if (savedStates) {
      try {
        const parsedStates = JSON.parse(savedStates);
        setCalculatorStates(prev => ({ ...prev, ...parsedStates }));
      } catch (error) {
        console.error('Error loading calculator states:', error);
      }
    }
  }, []);

  // Save states to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('calculatorStates', JSON.stringify(calculatorStates));
  }, [calculatorStates]);

  const updateCalculatorState = (calculatorType, updates) => {
    setCalculatorStates(prev => ({
      ...prev,
      [calculatorType]: {
        ...prev[calculatorType],
        ...updates
      }
    }));
  };

  const value = {
    calculatorStates,
    updateCalculatorState
  };

  return (
    <CalculatorStateContext.Provider value={value}>
      {children}
    </CalculatorStateContext.Provider>
  );
}

function useCalculatorState() {
  const context = useContext(CalculatorStateContext);
  if (!context) {
    throw new Error('useCalculatorState must be used within a CalculatorStateProvider');
  }
  return context;
}

// Wrapper components for calculators with persistent state
function RetirementCalculatorWrapper() {
  const { calculatorStates, updateCalculatorState } = useCalculatorState();
  return (
    <RetirementCalculator 
      formData={calculatorStates.retirement.formData}
      results={calculatorStates.retirement.results}
      loading={calculatorStates.retirement.loading}
      error={calculatorStates.retirement.error}
      updateState={(updates) => updateCalculatorState('retirement', updates)}
    />
  );
}

function MortgageCalculatorWrapper() {
  const { calculatorStates, updateCalculatorState } = useCalculatorState();
  return (
    <MortgageCalculator 
      formData={calculatorStates.mortgage.formData}
      results={calculatorStates.mortgage.results}
      loading={calculatorStates.mortgage.loading}
      error={calculatorStates.mortgage.error}
      updateState={(updates) => updateCalculatorState('mortgage', updates)}
    />
  );
}

function CompoundInterestCalculatorWrapper() {
  const { calculatorStates, updateCalculatorState } = useCalculatorState();
  return (
    <CompoundInterestCalculator 
      formData={calculatorStates.compoundInterest.formData}
      results={calculatorStates.compoundInterest.results}
      loading={calculatorStates.compoundInterest.loading}
      error={calculatorStates.compoundInterest.error}
      updateState={(updates) => updateCalculatorState('compoundInterest', updates)}
    />
  );
}

function parseMarkdown(text) {
  // Escape HTML first
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Handle code blocks (```...```)
  html = html.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang ? ` class="language-${lang}"` : '';
    return `<pre><code${language}>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered lists
  html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<TEMP_UL_ITEM>$1</TEMP_UL_ITEM>');
  html = html.replace(/(<TEMP_UL_ITEM>.*?<\/TEMP_UL_ITEM>(\n<TEMP_UL_ITEM>.*?<\/TEMP_UL_ITEM>)*)/gs, (match) => {
    const items = match.replace(/<TEMP_UL_ITEM>/g, '<li>').replace(/<\/TEMP_UL_ITEM>/g, '</li>');
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '<TEMP_OL_ITEM>$2</TEMP_OL_ITEM>');
  html = html.replace(/(<TEMP_OL_ITEM>.*?<\/TEMP_OL_ITEM>(\n<TEMP_OL_ITEM>.*?<\/TEMP_OL_ITEM>)*)/gs, (match) => {
    const items = match.replace(/<TEMP_OL_ITEM>/g, '<li>').replace(/<\/TEMP_OL_ITEM>/g, '</li>');
    return `<ol>${items}</ol>`;
  });

  // Clean up newlines within lists (remove all newlines inside list structures)
  html = html.replace(/(<ul>)\n+/g, '$1');
  html = html.replace(/\n+(<\/ul>)/g, '$1');
  html = html.replace(/(<ol>)\n+/g, '$1');
  html = html.replace(/\n+(<\/ol>)/g, '$1');
  html = html.replace(/(<\/li>)\n+(<li>)/g, '$1$2');

  // Replace multiple consecutive newlines with double newlines (for paragraph separation)
  html = html.replace(/\n{3,}/g, '\n\n');

  // Convert remaining single newlines to <br/> tags, but preserve double newlines for paragraph breaks
  html = html.replace(/\n\n/g, '<PARAGRAPH_BREAK>');
  html = html.replace(/\n/g, '<br/>');
  html = html.replace(/<PARAGRAPH_BREAK>/g, '<br/><br/>');

  // Clean up any extra <br/> tags around lists
  html = html.replace(/<br\/?>\s*(<[uo]l>)/g, '$1');
  html = html.replace(/(<\/[uo]l>)\s*<br\/?>/g, '$1');
  // Multiple spaces
  html = html.replace(/ {2,}/g, (spaces) => '&nbsp;'.repeat(spaces.length));

  return html;
}

function AppContent() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tagsArray, setTagsArray] = useState([]);
  const [tagSaved, setTagSaved] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [isResizing, setIsResizing] = useState(false);

  const chatEndRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    refreshConversations();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      loadConversation(selectedConversationId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  // Enhanced sidebar resizing functionality
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      e.preventDefault();

      // Calculate new width based on mouse position
      const newWidth = e.clientX;

      // Constrain width within bounds
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = (e) => {
      if (isResizing) {
        e.preventDefault();
        setIsResizing(false);
      }
    };

    // Add event listeners when resizing starts
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Prevent text selection and change cursor globally during resize
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      // Prevent pointer events on iframe or other elements that might interfere
      document.body.style.pointerEvents = 'none';
      if (sidebarRef.current) {
        sidebarRef.current.style.pointerEvents = 'auto';
      }
    }

    // Cleanup function below
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.pointerEvents = '';
      if (sidebarRef.current) {
        sidebarRef.current.style.pointerEvents = '';
      }
    };
  }, [isResizing]);

  const refreshConversations = async (preserveSelection = false) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/v1/conversations');
      const data = await res.json();
      setConversations(data);

      // Only set to first conversation if we don't have a selection AND we're not preserving
      if (!selectedConversationId && !preserveSelection && data.length > 0) {
        setSelectedConversationId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    }
  };

  const loadConversation = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/v1/conversations/${id}`);
      const data = await res.json();
      setChatHistory(data.messages || []);
      setTagsArray(data.tags || []);
      setNewTag('');
      setTagSaved(false);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || !selectedConversationId) return;
    const newMsg = { role: 'user', content: userMessage.trim() };
    setChatHistory(prev => [...prev, newMsg]);
    setUserMessage('');
    setLoading(true);

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/v1/conversations/${selectedConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.trim() }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error("Failed to send message:", err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get reply.' }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/v1/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Chat' }),
      });
      const newConv = await res.json();
      await refreshConversations();
      setSelectedConversationId(newConv.id);

      // Navigate to the chat page
      navigate('/');
    } catch (err) {
      console.error("Failed to start new chat:", err);
    }
  };

  // Enhanced search function to filter conversations
  const filterConversations = (conversations, query) => {
    if (!query.trim()) return conversations;

    const searchTerm = query.toLowerCase();
    return conversations.filter(conv => {
      // Search in title
      const titleMatch = conv.title && conv.title.toLowerCase().includes(searchTerm);

      // Search in tags
      const tagMatch = conv.tags && conv.tags.some(tag =>
        tag.toLowerCase().includes(searchTerm)
      );

      // Search in message content (if available)
      const contentMatch = conv.messages && conv.messages.some(msg =>
        msg.content && msg.content.toLowerCase().includes(searchTerm)
      );

      return titleMatch || tagMatch || contentMatch;
    });
  };

  const searchConversations = (query) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
  };

  const handleRename = async (id) => {
    const newTitle = prompt('Enter new title for the conversation:');
    if (!newTitle) return;
    try {
      await fetch(`http://127.0.0.1:5000/api/v1/conversations/${id}/rename`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });
      await refreshConversations(true); // Preserve selection when renaming
    } catch (err) {
      console.error("Failed to rename conversation:", err);
    }
  };

  const handleAutoRename = async (id) => {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/v1/conversations/${id}/auto_rename`, {
        method: 'POST',
      });
      const data = await res.json();
      await refreshConversations(true); // Preserve selection when auto-renaming
    } catch (err) {
      console.error("Failed to auto rename conversation:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await fetch(`http://127.0.0.1:5000/api/v1/conversations/${id}`, {
        method: 'DELETE',
      });
      await refreshConversations();
      if (id === selectedConversationId) {
        setSelectedConversationId(null);
        setChatHistory([]);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const addTag = async () => {
    if (!newTag.trim() || !selectedConversationId) return;
    const updatedTags = [...tagsArray, newTag.trim()];
    try {
      await fetch(`http://127.0.0.1:5000/api/v1/conversations/${selectedConversationId}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      });

      // Update the conversation directly in state while preserving order
      setConversations(prevConversations => {
        const updatedConversations = prevConversations.map(c =>
          c.id === selectedConversationId
            ? { ...c, tags: updatedTags }
            : c
        );
        return updatedConversations;
      });

      setTagsArray(updatedTags);
      setNewTag('');
      setTagSaved(true);
    } catch (err) {
      console.error("Failed to add tag:", err);
    }
  };

  // Helper function to remove tag without jumping to different conversation
  const removeTag = async (conversationId, tagToRemove) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    const updatedTags = conversation.tags.filter(t => t !== tagToRemove);

    try {
      await fetch(`http://127.0.0.1:5000/api/v1/conversations/${conversationId}/tags`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: updatedTags }),
      });

      // Update the conversation directly in state while preserving order
      setConversations(prevConversations => {
        const updatedConversations = prevConversations.map(c =>
          c.id === conversationId
            ? { ...c, tags: updatedTags }
            : c
        );
        return updatedConversations;
      });

      // Update tags array if this is the selected conversation
      if (conversationId === selectedConversationId) {
        setTagsArray(updatedTags);
      }
    } catch (err) {
      console.error("Failed to delete tag:", err);
    }
  };

  // Fixed function to handle conversation selection
  const handleConversationClick = (conversationId) => {
    setSelectedConversationId(conversationId);
    // Only navigate if we're not already on the chat page
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const renderMessageContent = (msg) => {
    const html = parseMarkdown(msg.content);

    if (!searchQuery) {
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = html.split(regex);

    return (
      <div>
        {parts.map((part, i) =>
          regex.test(part) ? <mark key={i}>{part}</mark> : <span key={i} dangerouslySetInnerHTML={{ __html: part }} />
        )}
      </div>
    );
  };

  // Get filtered conversations based on search query
  const filteredConversations = filterConversations(conversations, searchQuery);



  // Education Page Component
  function EducationPage() {
    const [topics, setTopics] = useState([]);
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const educationTopics = [
      {
        id: 'budgeting',
        title: 'Budgeting Basics',
        description: 'Learn how to create and maintain a personal budget',
        icon: '💰'
      },
      {
        id: 'emergency-fund',
        title: 'Emergency Fund',
        description: 'Building and maintaining your financial safety net',
        icon: '🛡️'
      },
      {
        id: 'debt-management',
        title: 'Debt Management',
        description: 'Strategies for paying off debt efficiently',
        icon: '💳'
      },
      {
        id: 'investing-101',
        title: 'Investing 101',
        description: 'Introduction to investing and building wealth',
        icon: '📈'
      },
      {
        id: 'retirement-planning',
        title: 'Retirement Planning',
        description: 'Planning for your golden years',
        icon: '🏖️'
      },
      {
        id: 'tax-basics',
        title: 'Tax Basics',
        description: 'Understanding taxes and optimization strategies',
        icon: '📋'
      },
      {
        id: 'insurance',
        title: 'Insurance Essentials',
        description: 'Protecting yourself and your assets',
        icon: '🛡️'
      },
      {
        id: 'credit-score',
        title: 'Credit Score & Reports',
        description: 'Understanding and improving your credit',
        icon: '📊'
      }
    ];

    useEffect(() => {
      setTopics(educationTopics);
    }, []);

    const loadTopicContent = async (topicId) => {
      setLoading(true);
      setError('');
      setSelectedTopic(topicId);

      try {
        const response = await fetch(`http://127.0.0.1:5000/api/v1/education/topics/${topicId}`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
        } else {
          // Fallback content if API doesn't exist
          const topic = educationTopics.find(t => t.id === topicId);
          setContent(generateFallbackContent(topic));
        }
      } catch (err) {
        // Fallback content if API call fails
        const topic = educationTopics.find(t => t.id === topicId);
        setContent(generateFallbackContent(topic));
      } finally {
        setLoading(false);
      }
    };

    const generateFallbackContent = (topic) => {
      const fallbackContent = {
        'budgeting': `
# Budgeting Basics

## What is a Budget?
A budget is a plan for how you'll spend your money each month. It helps you ensure you have enough money for the things you need and want.

## The 50/30/20 Rule
- **50%** for needs (rent, groceries, utilities)
- **30%** for wants (entertainment, dining out)
- **20%** for savings and debt payments

## Steps to Create a Budget
1. Calculate your monthly income
2. List all your expenses
3. Categorize expenses as needs vs wants
4. Assign dollar amounts to each category
5. Track your spending throughout the month
6. Adjust as needed

## Tips for Success
- Use budgeting apps or spreadsheets
- Review and adjust monthly
- Be realistic with your estimates
- Plan for unexpected expenses
      `,
        'emergency-fund': `
# Emergency Fund Essentials

## What is an Emergency Fund?
An emergency fund is money set aside for unexpected expenses or financial emergencies.

## How Much Should You Save?
- **Starter Emergency Fund**: $1,000
- **Full Emergency Fund**: 3-6 months of expenses
- **High-Risk Situations**: 6-12 months of expenses

## Where to Keep Your Emergency Fund
- High-yield savings account
- Money market account
- Short-term CDs
- Keep it separate from your checking account

## What Counts as an Emergency?
- Job loss
- Medical emergencies
- Major car repairs
- Home repairs
- Unexpected travel for family emergencies

## Building Your Fund
- Start small - even $25/month helps
- Use tax refunds and bonuses
- Sell items you don't need
- Take on temporary side work
      `,
        'debt-management': `
# Debt Management Strategies

## Types of Debt
- **Good Debt**: Mortgages, student loans, business loans
- **Bad Debt**: Credit cards, payday loans, car loans

## Debt Payoff Strategies

### Debt Snowball Method
1. List debts from smallest to largest balance
2. Pay minimums on all debts
3. Put extra money toward smallest debt
4. Once paid off, move to next smallest

### Debt Avalanche Method
1. List debts from highest to lowest interest rate
2. Pay minimums on all debts
3. Put extra money toward highest interest debt
4. Once paid off, move to next highest rate

## Tips for Success
- Stop using credit cards
- Create a realistic budget
- Consider debt consolidation
- Negotiate with creditors
- Consider professional help if overwhelmed
      `,
        'investing-101': `
# Investing 101

## Why Invest?
- Beat inflation
- Build wealth over time
- Compound growth
- Achieve financial goals

## Investment Types
- **Stocks**: Ownership in companies
- **Bonds**: Loans to governments/companies
- **Mutual Funds**: Diversified portfolios
- **ETFs**: Exchange-traded funds
- **Real Estate**: Property investments

## Risk vs Return
- Higher potential returns = Higher risk
- Diversification reduces risk
- Time horizon affects risk tolerance
- Don't invest money you'll need soon

## Getting Started
1. Emergency fund first
2. Pay off high-interest debt
3. Start with employer 401(k) match
4. Open investment account
5. Start with broad market funds
6. Increase contributions over time

## Key Principles
- Start early
- Invest regularly
- Stay diversified
- Don't try to time the market
- Keep costs low
      `
      };

      return fallbackContent[topic?.id] || `# ${topic?.title}\n\nContent coming soon...`;
    };

    return (
      <div className="education-container">
        <h2>📚 Financial Education</h2>
        <p>Learn essential financial concepts to improve your financial literacy and make better money decisions.</p>

        <div className="education-layout">
          {/* Topics Sidebar */}
          <div className="topics-sidebar">
            <h3>Topics</h3>
            <div className="topics-list">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className={`topic-item ${selectedTopic === topic.id ? 'active' : ''}`}
                  onClick={() => loadTopicContent(topic.id)}
                >
                  <span className="topic-icon">{topic.icon}</span>
                  <div className="topic-info">
                    <h4>{topic.title}</h4>
                    <p>{topic.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Area */}
          <div className="content-area">
            {loading ? (
              <div className="loading-message">Loading content...</div>
            ) : selectedTopic ? (
              <div className="topic-content">
                <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>').replace(/# (.*)/g, '<h1>$1</h1>').replace(/## (.*)/g, '<h2>$1</h2>').replace(/### (.*)/g, '<h3>$1</h3>') }} />
              </div>
            ) : (
              <div className="no-topic-selected">
                <h3>Select a topic to get started</h3>
                <p>Choose from the topics on the left to begin learning about important financial concepts.</p>
              </div>
            )}

            {error && (
              <div className="error-message">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  // Placeholder Components
  function GoalsPage() {
    return (
      <div>
        <h2>Goal Tracking System</h2>
        <p>Create financial targets, track progress, and get insights here.</p>
      </div>
    );
  }


  // function RemindersPage() {
  //   return (
  //     <div>
  //       <h2>Scheduled Reminders</h2>
  //       <p>Set, view, and manage financial reminders here.</p>
  //     </div>
  //   );
  // }

  // function DashboardPage() {
  //   return (
  //     <div>
  //       <h2>Dashboard & Analytics</h2>
  //       <p>Overview of your goals, reminders, spending analysis, and more.</p>
  //     </div>
  //   );
  // }

  // function EducationPage() {
  //   return (
  //     <div>
  //       <h2>Financial Education</h2>
  //       <p>Access learning modules and AI-generated financial education content.</p>
  //     </div>
  //   );
  // }




  return (
    <div className="app-container">
      {/* LEFT SIDEBAR - Navigation & Past Chats */}
      <div
        ref={sidebarRef}
        className="sidebar"
        style={{ width: `${sidebarWidth}px` }} // Keep dynamic width for resizing
      >
        {/* <h2>Financial Advisor</h2> */}
        <h2></h2>
        {/* Navigation Menu */}
        <nav>
          <ul>
            <li><Link to="/">💬 Chat</Link></li>
            <li><Link to="/calculators/retirement">🧮 Retirement Calculator</Link></li>
            <li><Link to="/calculators/mortgage">🧮 Mortgage Calculator</Link></li>
            <li><Link to="/calculators/compound-interest">🧮 Compound Interest Calculator</Link></li>
            <li><Link to="/goals">🎯 Goal Tracking</Link></li>
            <li><Link to="/upload-document">📄 Document Upload</Link></li>
            <li><Link to="/reminders">⏰ Reminders</Link></li>
            <li><Link to="/dashboard">📊 Dashboard</Link></li>
            <li><Link to="/education/topics">📚 Education</Link></li>
          </ul>
        </nav>

        <hr />

        {/* Past Chats Section */}
        <h3>Past Chats</h3>
        <button
          type="button"
          onClick={startNewChat}
          className="new-chat-button"
        >
          + New Chat
        </button>

        {/* Enhanced Search Input with Clear Button */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => searchConversations(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="search-clear-button"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Results Info */}
        {searchQuery && (
          <div className="search-info">
            {filteredConversations.length === 0 ? (
              <span>No conversations found</span>
            ) : (
              <span>
                {filteredConversations.length} of {conversations.length} conversations
              </span>
            )}
          </div>
        )}

        <ul className="conversation-list">
          {filteredConversations.map((conv) => (
            <li
              key={`conversation-${conv.id}`}
              className={`conversation-item ${conv.id === selectedConversationId ? 'active' : ''}`}
            >
              <div
                onClick={() => handleConversationClick(conv.id)}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  {highlightText(conv.title || 'Untitled', searchQuery)}
                </div>
                <small className="conversation-date">
                  {new Date(conv.created_at).toLocaleString()}
                </small>
                {conv.tags && conv.tags.length > 0 && (
                  <div className="tags">
                    {conv.tags.map((tag, index) => (
                      <span key={`tag-${conv.id}-${index}`} className="tag-badge" onClick={(e) => e.stopPropagation()}>
                        {highlightText(tag, searchQuery)}
                        <button
                          type="button"
                          className="delete-tag"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            removeTag(conv.id, tag);
                          }}
                          title="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="sidebar-actions">
                <button
                  type="button"
                  title="Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename(conv.id);
                  }}
                  className="sidebar-action-button"
                >
                  ✏️
                </button>
                <button
                  type="button"
                  title="Auto Rename"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAutoRename(conv.id);
                  }}
                  className="sidebar-action-button"
                >
                  ✨
                </button>
                <button
                  type="button"
                  title="Delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(conv.id);
                  }}
                  className="sidebar-action-button"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>

        {/* Resize Handle - Keep original functionality */}
        <div
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsResizing(true);
          }}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.target.style.backgroundColor = '#e3f2fd';
              e.target.style.borderRight = '2px solid #90caf9';
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderRight = '2px solid transparent';
            }
          }}
          title="Drag to resize sidebar"
        >
          <div className={`resize-indicator ${isResizing ? 'active' : ''}`} />
        </div>
      </div>

      {/* RIGHT SIDE - Main Content Area */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={
            <div className="chat-panel">
              <h1>Financial Advisor Chat</h1>

              {/* Chat History Display */}
              <div className="chat-box">
                {Array.isArray(chatHistory) && chatHistory.length > 0 ? (
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                      <div className="chat-message-header">
                        {msg.role === 'user' ? 'You:' : 'Advisor:'}
                      </div>
                      <div className="chat-message-content">
                        {renderMessageContent(msg)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p>No messages yet. Start the conversation!</p>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Tag Input Area */}
              <div className="tag-input-container">
                <input
                  type="text"
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => {
                    setNewTag(e.target.value);
                    setTagSaved(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="tag-input"
                />
                <button
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="add-tag-button"
                >
                  Add Tag
                </button>
                {tagSaved && <span className="tag-saved-message">Saved!</span>}
              </div>

              {/* Message Input Area */}
              <div className="message-input-container">
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  rows={2}
                  className="message-textarea"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type your message here and press Enter"
                  disabled={loading}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !userMessage.trim()}
                  className="send-button"
                >
                  {loading ? '...' : 'Send'}
                </button>
              </div>
            </div>
          } />

          {/* Other Routes */}
          <Route path="/calculators/retirement" element={<RetirementCalculatorWrapper />} />
          <Route path="/calculators/mortgage" element={<MortgageCalculatorWrapper />} />
          <Route path="/calculators/compound-interest" element={<CompoundInterestCalculatorWrapper />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/upload-document" element={<DocumentUpload />} />
          <Route path="/reminders" element={<RemindersPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/education/topics" element={<EducationPage />} />

          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <CalculatorStateProvider>
        <AppContent />
      </CalculatorStateProvider>
    </Router>
  );
}

export default App;