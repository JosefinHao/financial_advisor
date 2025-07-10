import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Financial Advisor AI</h1>
          <p className="hero-subtitle">
            Your intelligent financial companion for planning, analysis, and guidance
          </p>
          <div className="hero-buttons">
            <Link to="/" className="btn btn-primary">
              Start Chat
            </Link>
            <Link to="/dashboard" className="btn btn-secondary">
              View Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>Key Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>AI Chat Assistant</h3>
            <p>Get personalized financial advice and answers to your questions through our intelligent AI assistant.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🧮</div>
            <h3>Financial Calculators</h3>
            <p>Calculate retirement savings, mortgage payments, and compound interest with detailed projections.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Document Analysis</h3>
            <p>Upload and analyze financial documents to extract insights and get personalized recommendations.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Financial Dashboard</h3>
            <p>Track your financial progress with comprehensive analytics and visualizations.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Goal Tracking</h3>
            <p>Set financial goals and track your progress towards achieving them.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📚</div>
            <h3>Financial Education</h3>
            <p>Access educational resources and learn about various financial topics.</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/" className="action-btn">
            <span className="action-icon">💬</span>
            <span>Start New Chat</span>
          </Link>
          
          <Link to="/retirement-calculator" className="action-btn">
            <span className="action-icon">🏖️</span>
            <span>Retirement Calculator</span>
          </Link>
          
          <Link to="/mortgage-calculator" className="action-btn">
            <span className="action-icon">🏠</span>
            <span>Mortgage Calculator</span>
          </Link>
          
          <Link to="/compound-interest-calculator" className="action-btn">
            <span className="action-icon">📈</span>
            <span>Compound Interest</span>
          </Link>
          
          <Link to="/upload-document" className="action-btn">
            <span className="action-icon">📄</span>
            <span>Upload Document</span>
          </Link>
          
          <Link to="/goals" className="action-btn">
            <span className="action-icon">🎯</span>
            <span>Set Goals</span>
          </Link>
        </div>
      </div>

      <div className="footer">
        <p>&copy; 2024 Financial Advisor AI. Built with React and Flask.</p>
      </div>
    </div>
  );
};

export default HomePage; 