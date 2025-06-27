import React, { useState, useEffect } from 'react';
import './MortgageCalculator.css';

const MortgageCalculator = ({ formData, results, loading, error, updateState }) => {
  const [customColor, setCustomColor] = useState('#f59e42');
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('mortgageColor');
    if (saved) setCustomColor(saved);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateState({
      formData: {
        ...formData,
        [name]: parseFloat(value) || 0
      }
    });
  };

  const handleColorChange = (color) => {
    setCustomColor(color);
    localStorage.setItem('mortgageColor', color);
  };

  const calculateMortgage = async () => {
    updateState({ loading: true, error: '' });

    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/calculators/mortgage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        updateState({ results: data, loading: false });
      } else {
        updateState({ 
          error: data.error || 'Failed to calculate mortgage',
          loading: false 
        });
      }
    } catch (err) {
      updateState({ 
        error: 'Failed to connect to server',
        loading: false 
      });
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

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="mortgage-calculator">
      <div className="mortgage-header calculator-header" style={{ background: customColor, color: '#fff', position: 'relative' }}>
        <h2>Mortgage Calculator</h2>
        <p>Estimate your mortgage payments and costs</p>
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

      <div className={`calculator-container ${results ? 'has-results' : ''}`}>
        {/* Input Form */}
        <div className="input-section">
          <h3>Your Information</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="loan_amount">Loan Amount</label>
              <input
                type="number"
                id="loan_amount"
                name="loan_amount"
                value={formData.loan_amount}
                onChange={handleInputChange}
                min="10000"
                step="1000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="interest_rate">Interest Rate (%)</label>
              <input
                type="number"
                id="interest_rate"
                name="interest_rate"
                value={formData.interest_rate}
                onChange={handleInputChange}
                min="0"
                max="20"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="loan_term_years">Loan Term (Years)</label>
              <input
                type="number"
                id="loan_term_years"
                name="loan_term_years"
                value={formData.loan_term_years}
                onChange={handleInputChange}
                min="1"
                max="50"
              />
            </div>

            <div className="form-group">
              <label htmlFor="down_payment">Down Payment</label>
              <input
                type="number"
                id="down_payment"
                name="down_payment"
                value={formData.down_payment}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="property_tax">Annual Property Tax</label>
              <input
                type="number"
                id="property_tax"
                name="property_tax"
                value={formData.property_tax}
                onChange={handleInputChange}
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="insurance">Annual Insurance</label>
              <input
                type="number"
                id="insurance"
                name="insurance"
                value={formData.insurance}
                onChange={handleInputChange}
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pmi_rate">PMI Rate (%)</label>
              <input
                type="number"
                id="pmi_rate"
                name="pmi_rate"
                value={formData.pmi_rate}
                onChange={handleInputChange}
                min="0"
                max="2"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="annual_income">Annual Income</label>
              <input
                type="number"
                id="annual_income"
                name="annual_income"
                value={formData.annual_income}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>
          </div>

          <button
            className="mortgage-calc-btn calculate-btn"
            style={{ background: customColor, color: '#fff', border: 'none' }}
            onClick={calculateMortgage}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Mortgage Projection'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Results Section */}
        {results && (
          <div className="results-section">
            <h3>Your Mortgage Analysis</h3>
            
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Monthly Payment</h4>
                <div className="amount">{formatCurrency(results.monthly_payment)}</div>
                <p>Principal & Interest</p>
              </div>
              
              <div className="summary-card">
                <h4>Total Monthly</h4>
                <div className="amount">{formatCurrency(results.total_monthly_payment)}</div>
                <p>Including taxes & insurance</p>
              </div>
              
              <div className="summary-card">
                <h4>Total Interest</h4>
                <div className="amount">{formatCurrency(results.total_interest)}</div>
                <p>Over {results.loan_summary.loan_term_years} years</p>
              </div>
              
              <div className="summary-card">
                <h4>Total Cost</h4>
                <div className="amount">{formatCurrency(results.total_cost)}</div>
                <p>Including down payment</p>
              </div>
            </div>

            {/* Loan Details */}
            <div className="loan-details">
              <h4>Loan Breakdown</h4>
              <div className="details-grid">
                <div className="detail-item">
                  <span>Principal Amount:</span>
                  <span>{formatCurrency(results.principal)}</span>
                </div>
                <div className="detail-item">
                  <span>Down Payment:</span>
                  <span>{formatCurrency(results.loan_summary.down_payment)} ({formatPercentage(results.down_payment_percentage)})</span>
                </div>
                <div className="detail-item">
                  <span>Interest Rate:</span>
                  <span>{formatPercentage(results.loan_summary.interest_rate)}</span>
                </div>
                <div className="detail-item">
                  <span>Loan Term:</span>
                  <span>{results.loan_summary.loan_term_years} years</span>
                </div>
                {results.pmi_monthly > 0 && (
                  <div className="detail-item">
                    <span>Monthly PMI:</span>
                    <span>{formatCurrency(results.pmi_monthly)}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span>Annual Property Tax:</span>
                  <span>{formatCurrency(results.loan_summary.property_tax_annual)}</span>
                </div>
                <div className="detail-item">
                  <span>Annual Insurance:</span>
                  <span>{formatCurrency(results.loan_summary.insurance_annual)}</span>
                </div>
              </div>
            </div>

            {/* Insights */}
            {results.insights && results.insights.length > 0 && (
              <div className="insights-section">
                <h4>💡 Insights & Recommendations</h4>
                <div className="insights-list">
                  {results.insights.map((insight, index) => (
                    <div key={index} className={`insight-item ${insight.type}`}>
                      <h5>{insight.title}</h5>
                      <p>{insight.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amortization Schedule */}
            {results.amortization_schedule && results.amortization_schedule.length > 0 && (
              <div className="amortization-section">
                <h4>📊 Amortization Schedule</h4>
                <div className="amortization-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Beginning Balance</th>
                        <th>Principal Paid</th>
                        <th>Interest Paid</th>
                        <th>Ending Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.amortization_schedule.map((year, index) => (
                        <tr key={index}>
                          <td>{year.year}</td>
                          <td>{formatCurrency(year.beginning_balance)}</td>
                          <td>{formatCurrency(year.principal_paid)}</td>
                          <td>{formatCurrency(year.interest_paid)}</td>
                          <td>{formatCurrency(year.ending_balance)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MortgageCalculator; 