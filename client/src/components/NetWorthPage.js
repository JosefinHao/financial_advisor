import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NetWorthPage.css';

const NetWorthPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [netWorthData, setNetWorthData] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [customColor, setCustomColor] = useState('#667eea');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Form data state
  const [formData, setFormData] = useState({
    // Assets
    cash_savings: 0,
    checking_accounts: 0,
    savings_accounts: 0,
    investment_accounts: 0,
    retirement_accounts: 0,
    real_estate: 0,
    vehicles: 0,
    other_assets: 0,
    
    // Liabilities
    credit_cards: 0,
    student_loans: 0,
    car_loans: 0,
    mortgage: 0,
    personal_loans: 0,
    other_debt: 0
  });

  useEffect(() => {
    const saved = localStorage.getItem('networthColor');
    if (saved) setCustomColor(saved);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleColorChange = (color) => {
    setCustomColor(color);
    localStorage.setItem('networthColor', color);
  };

  const calculateNetWorth = () => {
    setLoading(true);
    
    // Calculate totals
    const totalAssets = 
      formData.cash_savings + 
      formData.checking_accounts + 
      formData.savings_accounts + 
      formData.investment_accounts + 
      formData.retirement_accounts + 
      formData.real_estate + 
      formData.vehicles + 
      formData.other_assets;

    const totalLiabilities = 
      formData.credit_cards + 
      formData.student_loans + 
      formData.car_loans + 
      formData.mortgage + 
      formData.personal_loans + 
      formData.other_debt;

    const netWorth = totalAssets - totalLiabilities;

    // Create breakdown data
    const assetsBreakdown = [
      { name: 'Cash & Savings', amount: formData.cash_savings + formData.checking_accounts + formData.savings_accounts, percentage: totalAssets > 0 ? ((formData.cash_savings + formData.checking_accounts + formData.savings_accounts) / totalAssets * 100) : 0 },
      { name: 'Investment Accounts', amount: formData.investment_accounts, percentage: totalAssets > 0 ? (formData.investment_accounts / totalAssets * 100) : 0 },
      { name: 'Retirement Accounts', amount: formData.retirement_accounts, percentage: totalAssets > 0 ? (formData.retirement_accounts / totalAssets * 100) : 0 },
      { name: 'Real Estate', amount: formData.real_estate, percentage: totalAssets > 0 ? (formData.real_estate / totalAssets * 100) : 0 },
      { name: 'Vehicles', amount: formData.vehicles, percentage: totalAssets > 0 ? (formData.vehicles / totalAssets * 100) : 0 },
      { name: 'Other Assets', amount: formData.other_assets, percentage: totalAssets > 0 ? (formData.other_assets / totalAssets * 100) : 0 }
    ].filter(item => item.amount > 0);

    const liabilitiesBreakdown = [
      { name: 'Credit Cards', amount: formData.credit_cards, percentage: totalLiabilities > 0 ? (formData.credit_cards / totalLiabilities * 100) : 0 },
      { name: 'Student Loans', amount: formData.student_loans, percentage: totalLiabilities > 0 ? (formData.student_loans / totalLiabilities * 100) : 0 },
      { name: 'Car Loans', amount: formData.car_loans, percentage: totalLiabilities > 0 ? (formData.car_loans / totalLiabilities * 100) : 0 },
      { name: 'Mortgage', amount: formData.mortgage, percentage: totalLiabilities > 0 ? (formData.mortgage / totalLiabilities * 100) : 0 },
      { name: 'Personal Loans', amount: formData.personal_loans, percentage: totalLiabilities > 0 ? (formData.personal_loans / totalLiabilities * 100) : 0 },
      { name: 'Other Debt', amount: formData.other_debt, percentage: totalLiabilities > 0 ? (formData.other_debt / totalLiabilities * 100) : 0 }
    ].filter(item => item.amount > 0);

    // Generate insights
    const insights = [];
    
    if (netWorth > 0) {
      insights.push({
        type: 'positive',
        title: 'Positive Net Worth',
        description: `Great job! Your net worth is $${formatCurrency(netWorth)}. You're building wealth effectively.`
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Negative Net Worth',
        description: `Your net worth is $${formatCurrency(Math.abs(netWorth))} in the negative. Focus on debt reduction and building assets.`
      });
    }

    if (formData.credit_cards > 0 && formData.credit_cards > totalAssets * 0.1) {
      insights.push({
        type: 'warning',
        title: 'High Credit Card Debt',
        description: 'Credit card debt represents a significant portion of your liabilities. Consider paying down high-interest debt first.'
      });
    }

    if (formData.cash_savings + formData.checking_accounts + formData.savings_accounts < totalAssets * 0.1) {
      insights.push({
        type: 'info',
        title: 'Low Cash Reserves',
        description: 'Consider building up your emergency fund to cover 3-6 months of expenses.'
      });
    }

    if (formData.retirement_accounts > 0 && formData.retirement_accounts < totalAssets * 0.15) {
      insights.push({
        type: 'info',
        title: 'Retirement Savings',
        description: 'Consider increasing your retirement contributions to ensure long-term financial security.'
      });
    }

    // Mock monthly trends (in real app, this would be historical data)
    const monthlyTrends = [
      { month: 'Jan', netWorth: netWorth * 0.95 },
      { month: 'Feb', netWorth: netWorth * 0.97 },
      { month: 'Mar', netWorth: netWorth * 0.98 },
      { month: 'Apr', netWorth: netWorth * 0.99 },
      { month: 'May', netWorth: netWorth * 1.01 },
      { month: 'Jun', netWorth: netWorth }
    ];

    const resultData = {
      currentNetWorth: netWorth,
      totalAssets,
      totalLiabilities,
      assets: {
        total: totalAssets,
        breakdown: assetsBreakdown
      },
      liabilities: {
        total: totalLiabilities,
        breakdown: liabilitiesBreakdown
      },
      monthlyTrends,
      insights
    };

    setTimeout(() => {
      setNetWorthData(resultData);
      setShowResults(true);
      setLoading(false);
    }, 1000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="net-worth-calculator">
      {/* Header */}
      <div className="calculator-header" style={{ background: customColor, color: '#fff', position: 'relative' }}>
        <h2>Net Worth Calculator</h2>
        <p>Calculate and track your net worth by entering your assets and liabilities</p>
        <span
          className="color-palette-btn"
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: '#fff',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '50%',
            zIndex: 2,
            cursor: 'pointer',
            overflow: 'hidden'
          }}
        >
          🎨
          <input
            type="color"
            value={customColor}
            onChange={e => handleColorChange(e.target.value)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              border: 'none',
              background: 'none',
              zIndex: 3
            }}
            title="Pick a color for the header and button"
          />
        </span>
      </div>

      <div className={`calculator-container ${showResults ? 'has-results' : ''}`}>
        {/* Input Section */}
        <div className="input-section">
          <h3>Enter Your Financial Information</h3>
          
          {/* Assets Section */}
          <div className="form-section">
            <h4>💰 Assets</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="cash_savings">Cash on Hand</label>
                <input
                  type="number"
                  id="cash_savings"
                  name="cash_savings"
                  value={formData.cash_savings}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>
              <div className="form-group">
                <label htmlFor="checking_accounts">Checking Accounts</label>
                <input
                  type="number"
                  id="checking_accounts"
                  name="checking_accounts"
                  value={formData.checking_accounts}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>
              <div className="form-group">
                <label htmlFor="savings_accounts">Savings Accounts</label>
                <input
                  type="number"
                  id="savings_accounts"
                  name="savings_accounts"
                  value={formData.savings_accounts}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>
              <div className="form-group">
                <label htmlFor="investment_accounts">Investment Accounts</label>
                <input
                  type="number"
                  id="investment_accounts"
                  name="investment_accounts"
                  value={formData.investment_accounts}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="retirement_accounts">Retirement Accounts</label>
                <input
                  type="number"
                  id="retirement_accounts"
                  name="retirement_accounts"
                  value={formData.retirement_accounts}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="real_estate">Real Estate Value</label>
                <input
                  type="number"
                  id="real_estate"
                  name="real_estate"
                  value={formData.real_estate}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="vehicles">Vehicle Values</label>
                <input
                  type="number"
                  id="vehicles"
                  name="vehicles"
                  value={formData.vehicles}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="other_assets">Other Assets</label>
                <input
                  type="number"
                  id="other_assets"
                  name="other_assets"
                  value={formData.other_assets}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>

          {/* Liabilities Section */}
          <div className="form-section">
            <h4>📉 Liabilities</h4>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="credit_cards">Credit Card Debt</label>
                <input
                  type="number"
                  id="credit_cards"
                  name="credit_cards"
                  value={formData.credit_cards}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>
              <div className="form-group">
                <label htmlFor="student_loans">Student Loans</label>
                <input
                  type="number"
                  id="student_loans"
                  name="student_loans"
                  value={formData.student_loans}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="car_loans">Car Loans</label>
                <input
                  type="number"
                  id="car_loans"
                  name="car_loans"
                  value={formData.car_loans}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="mortgage">Mortgage Balance</label>
                <input
                  type="number"
                  id="mortgage"
                  name="mortgage"
                  value={formData.mortgage}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="personal_loans">Personal Loans</label>
                <input
                  type="number"
                  id="personal_loans"
                  name="personal_loans"
                  value={formData.personal_loans}
                  onChange={handleInputChange}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="other_debt">Other Debt</label>
                <input
                  type="number"
                  id="other_debt"
                  name="other_debt"
                  value={formData.other_debt}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>
            </div>
          </div>

          <button
            className="calculate-btn"
            style={{ background: customColor, color: '#fff', border: 'none' }}
            onClick={calculateNetWorth}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Net Worth'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Results Section */}
        <div className={`results-section ${showResults && netWorthData ? 'visible' : 'hidden'}`}>
          {showResults && netWorthData ? (
            <>
              <h3>Your Net Worth Analysis</h3>
              
              {/* Main Net Worth Card */}
              <div className="net-worth-card">
                <div className="net-worth-header">
                  <h2>Current Net Worth</h2>
                  <div className="net-worth-amount">{formatCurrency(netWorthData.currentNetWorth)}</div>
                  <div className={`net-worth-change ${netWorthData.currentNetWorth >= 0 ? 'positive' : 'negative'}`}>
                    {netWorthData.currentNetWorth >= 0 ? 'Positive Net Worth' : 'Negative Net Worth'}
                  </div>
                </div>
                <div className="net-worth-breakdown">
                  <div className="breakdown-item assets">
                    <span className="label">Total Assets</span>
                    <span className="amount">{formatCurrency(netWorthData.totalAssets)}</span>
                  </div>
                  <div className="breakdown-item liabilities">
                    <span className="label">Total Liabilities</span>
                    <span className="amount">{formatCurrency(netWorthData.totalLiabilities)}</span>
                  </div>
                </div>
              </div>

              {/* Assets and Liabilities Grid */}
              <div className="assets-liabilities-grid">
                {/* Assets Section */}
                <div className="section-card">
                  <h4 className="section-title">📈 Assets Breakdown</h4>
                  <div className="breakdown-list">
                    {netWorthData.assets.breakdown.map((item, index) => (
                      <div key={index} className="breakdown-item">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-percentage">{item.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="item-amount">{formatCurrency(item.amount)}</div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill assets-fill" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Liabilities Section */}
                <div className="section-card">
                  <h4 className="section-title">📉 Liabilities Breakdown</h4>
                  <div className="breakdown-list">
                    {netWorthData.liabilities.breakdown.map((item, index) => (
                      <div key={index} className="breakdown-item">
                        <div className="item-info">
                          <span className="item-name">{item.name}</span>
                          <span className="item-percentage">{item.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="item-amount">{formatCurrency(item.amount)}</div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill liabilities-fill" 
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Monthly Trends */}
              <div className="section-card">
                <h4 className="section-title">📊 6-Month Net Worth Trend</h4>
                <div className="trends-chart">
                  <div className="chart-container">
                    {netWorthData.monthlyTrends.map((month, index) => (
                      <div key={index} className="chart-bar">
                        <div className="bar-label">{month.month}</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ height: `${Math.max((month.netWorth / Math.max(...netWorthData.monthlyTrends.map(m => m.netWorth))) * 100, 5)}%` }}
                          ></div>
                        </div>
                        <div className="bar-value">{formatCurrency(month.netWorth)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Insights */}
              <div className="section-card">
                <h4 className="section-title">💡 Financial Insights</h4>
                <div className="insights-grid">
                  {netWorthData.insights.map((insight, index) => (
                    <div key={index} className={`insight-card ${insight.type}`}>
                      <div className="insight-icon">
                        {insight.type === 'positive' && '✅'}
                        {insight.type === 'warning' && '⚠️'}
                        {insight.type === 'info' && 'ℹ️'}
                      </div>
                      <div className="insight-content">
                        <h4>{insight.title}</h4>
                        <p>{insight.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="action-buttons">
                <button onClick={() => navigate('/goals')} className="action-btn primary">
                  📋 Set Financial Goals
                </button>
                <button onClick={() => navigate('/chat')} className="action-btn success">
                  💬 Get Financial Advice
                </button>
                <button onClick={() => navigate('/calculators/retirement')} className="action-btn info">
                  🧮 Retirement Calculator
                </button>
              </div>
            </>
          ) : (
            <div className="placeholder-content">
              <h3>Net Worth Results</h3>
              <p>Enter your financial information and click "Calculate Net Worth" to see your results here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetWorthPage; 