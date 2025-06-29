import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import DocumentUpload from './pages/DocumentUpload';
import RemindersPage from './pages/RemindersPage';
import DashboardPage from './pages/DashboardPage';
import NetWorthPage from './pages/NetWorthPage';
import RetirementCalculator from './pages/RetirementCalculator';
import MortgageCalculator from './pages/MortgageCalculator';
import CompoundInterestCalculator from './pages/CompoundInterestCalculator';
import GoalsPage from './pages/GoalsPage';

// Custom hook for managing input focus
function useInputFocus() {
  const inputRef = useRef(null);
  
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  const focusInputDelayed = (delay = 100) => {
    setTimeout(focusInput, delay);
  };
  
  return { inputRef, focusInput, focusInputDelayed };
}

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
    },
    netWorth: {
      formData: {
        // Assets
        cash_savings: 0,
        checking_accounts: 0,
        savings_accounts: 0,
        investment_accounts: 0,
        retirement_accounts: 0,
        real_estate: 0,
        primary_residence: 0,
        rental_properties: 0,
        vehicles: 0,
        other_assets: 0,
        
        // Liabilities
        credit_cards: 0,
        student_loans: 0,
        car_loans: 0,
        mortgage: 0,
        home_equity_loan: 0,
        rental_mortgages: 0,
        personal_loans: 0,
        other_debt: 0,
        
        // Multiple houses support
        houses: [{
          value: 0,
          mortgage: 0,
          equity_loan: 0
        }]
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

function NetWorthPageWrapper() {
  const { calculatorStates, updateCalculatorState } = useCalculatorState();
  return (
    <NetWorthPage 
      formData={calculatorStates.netWorth.formData}
      results={calculatorStates.netWorth.results}
      loading={calculatorStates.netWorth.loading}
      error={calculatorStates.netWorth.error}
      updateState={(updates) => updateCalculatorState('netWorth', updates)}
    />
  );
}

function parseMarkdown(text) {
  if (typeof text !== 'string') return '';
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
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false);

  const chatEndRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { inputRef: messageInputRef, focusInput, focusInputDelayed } = useInputFocus();

  useEffect(() => {
    refreshConversations();
  }, []);

  // Load conversation when selectedConversationId changes
  useEffect(() => {
    if (selectedConversationId) {
      loadConversation(selectedConversationId);
    } else {
      // Clear chat history when no conversation is selected
      setChatHistory([]);
      setTagsArray([]);
    }
  }, [selectedConversationId]);

  // Auto-scroll only when shouldAutoScroll is true
  useEffect(() => {
    if (chatEndRef.current && shouldAutoScroll) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setShouldAutoScroll(false); // Reset after scrolling
    }
  }, [chatHistory, shouldAutoScroll]);

  // Keyboard shortcut to focus input (Ctrl+L or Cmd+L)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        focusInput();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusInput]);

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
      // Ensure data is always an array
      const conversationsArray = Array.isArray(data) ? data : [];
      setConversations(conversationsArray);

      // Only set to first conversation if we don't have a selection AND we're not preserving
      if (!selectedConversationId && !preserveSelection && conversationsArray.length > 0) {
        setSelectedConversationId(conversationsArray[0].id);
      }
      
      // If we're preserving selection, make sure the selected conversation still exists
      if (preserveSelection && selectedConversationId) {
        const conversationExists = conversationsArray.some(conv => conv.id === selectedConversationId);
        if (!conversationExists) {
          setSelectedConversationId(null);
          setChatHistory([]);
          setTagsArray([]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
      // Set conversations to empty array on error
      setConversations([]);
    }
  };

  const loadConversation = async (id) => {
    if (!id) return;
    
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/v1/conversations/${id}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setChatHistory(data.messages || []);
      setTagsArray(data.tags || []);
      setNewTag('');
      setTagSaved(false);
    } catch (err) {
      console.error("Failed to load conversation:", err);
      // Clear the chat history on error
      setChatHistory([]);
      setTagsArray([]);
    }
  };

  const sendMessage = async () => {
    if (!userMessage.trim() || !selectedConversationId) return;
    const newMsg = { role: 'user', content: userMessage.trim() };
    setChatHistory(prev => [...prev, newMsg]);
    setUserMessage('');
    setLoading(true);
    
    // Always auto-scroll to show the new user message
    setTimeout(() => {
      setShouldAutoScroll(true);
    }, 0);

    try {
      const res = await fetch(`http://127.0.0.1:5000/api/v1/conversations/${selectedConversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.trim() }),
      });
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.reply }]);
      
      // Always auto-scroll to show the AI response
      setTimeout(() => {
        setShouldAutoScroll(true);
      }, 0);
    } catch (err) {
      console.error("Failed to send message:", err);
      setChatHistory(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get reply.' }]);
      
      // Always auto-scroll to show the error message
      setTimeout(() => {
        setShouldAutoScroll(true);
      }, 0);
    } finally {
      setLoading(false);
      // Only focus input after sending a message
      focusInputDelayed(100);
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
    // Ensure conversations is always an array
    if (!Array.isArray(conversations)) {
      return [];
    }
    
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
    // Prevent unnecessary state updates if already selected
    if (selectedConversationId === conversationId) {
      return;
    }
    
    // Set the selected conversation immediately
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
        <h2>Financial Education</h2>
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

  // Goal Tracking Component - Now imported from separate file

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
            <li>
              <Link to="/">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
                <span>Chat</span>
              </Link>
            </li>
            <li>
              <Link to="/calculators/retirement">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                  <line x1="8" y1="6" x2="16" y2="6"/>
                  <line x1="8" y1="10" x2="10" y2="10"/>
                  <line x1="12" y1="10" x2="14" y2="10"/>
                  <line x1="8" y1="14" x2="10" y2="14"/>
                  <line x1="12" y1="14" x2="14" y2="14"/>
                  <line x1="8" y1="18" x2="10" y2="18"/>
                  <line x1="12" y1="18" x2="14" y2="18"/>
                </svg>
                <span>Retirement Calculator</span>
              </Link>
            </li>
            <li>
              <Link to="/calculators/mortgage">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9,22 9,12 15,12 15,22"/>
                </svg>
                <span>Mortgage Calculator</span>
              </Link>
            </li>
            <li>
              <Link to="/calculators/compound-interest">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 21V3"/>
                  <path d="M3 21h18"/>
                  <path d="M3 20l2-1 2-1 2-1 2-2 2-2 2-2 2-3 2-3"/>
                </svg>
                <span>Compound Interest Calculator</span>
              </Link>
            </li>
            <li>
              <Link to="/net-worth">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                </svg>
                <span>Net Worth</span>
              </Link>
            </li>
            <li>
              <Link to="/goals">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                  <line x1="4" y1="22" x2="4" y2="15"/>
                </svg>
                <span>Goal Tracking</span>
              </Link>
            </li>
            <li>
              <Link to="/upload-document">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10,9 9,9 8,9"/>
                </svg>
                <span>Document Upload</span>
              </Link>
            </li>
            <li>
              <Link to="/reminders">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                <span>Reminders</span>
              </Link>
            </li>
            <li>
              <Link to="/dashboard">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>Dashboard</span>
              </Link>
            </li>
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
              onClick={() => handleConversationClick(conv.id)}
              style={{ cursor: 'pointer' }}
            >
              <div>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"/>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                  </svg>
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
                <div className="tag-input-section">
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
                        e.stopPropagation();
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

                  {/* Current Tags Display (inline) */}
                  {tagsArray && tagsArray.length > 0 && (
                    <div className="current-tags-row">
                      <span className="current-tags-label">Current tags:</span>
                      <div className="current-tags-list">
                        {tagsArray.map((tag, index) => (
                          <span key={`current-tag-${index}`} className="current-tag-badge">
                            {tag}
                            <button
                              type="button"
                              className="current-tag-delete"
                              onClick={() => removeTag(selectedConversationId, tag)}
                              title="Remove tag"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Input Area */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  sendMessage();
                }}
                className="message-input-container"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                <textarea
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  rows={2}
                  className={`message-textarea ${isInputFocused ? 'focused' : ''}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      e.stopPropagation();
                      sendMessage();
                    }
                  }}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  placeholder="Type your message here and press Enter"
                  disabled={loading}
                  ref={messageInputRef}
                />
                <button
                  type="submit"
                  disabled={loading || !userMessage.trim()}
                  className="send-button"
                >
                  {loading ? '...' : 'Send'}
                </button>
              </form>
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
          <Route path="/net-worth" element={<NetWorthPageWrapper />} />

          {/* Redirect unknown routes to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BackToTopButton />
      </div>
    </div>
  );
}

function BackToTopButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShow(window.scrollY > 120);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const handleClick = () => {
    // Always scroll to top of current page
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return show ? (
    <button className="back-to-top-btn" onClick={handleClick} title="Back to top">
      ⬆ Back to Top
    </button>
  ) : null;
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