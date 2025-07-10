import React, { useState, useEffect } from 'react';
import './CompoundInterestCalculator.css';
import { generateGradient } from '../utils/gradientUtils';
import DualColorPicker from '../ui/DualColorPicker';
import { getApiUrl } from '../config';
import MarkdownMessage from '../ui/MarkdownMessage';

const CompoundInterestCalculator = ({ formData, results, loading, error, updateState }) => {
  const [showAllYears, setShowAllYears] = useState(false);
  const [customColor, setCustomColor] = useState('#696F6F');
  const [customColor2, setCustomColor2] = useState('#628ECB');

  useEffect(() => {
    const savedColor = localStorage.getItem('compoundColor');
    const savedColor2 = localStorage.getItem('compoundColor2');
    
    // Only use saved colors if they are valid hex color strings
    if (savedColor && savedColor.match(/^#[0-9A-F]{6}$/i)) {
      setCustomColor(savedColor);
    }
    if (savedColor2 && savedColor2.match(/^#[0-9A-F]{6}$/i)) {
      setCustomColor2(savedColor2);
    }
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
    localStorage.setItem('compoundColor', color);
  };

  const handleColor2Change = (color) => {
    setCustomColor2(color);
    localStorage.setItem('compoundColor2', color);
  };

  const gradientStyle = generateGradient(customColor, customColor2);

  const calculateCompoundInterest = async () => {
    updateState({ loading: true, error: '' });
    
    try {
      // Map frontend field names to backend API field names
      const apiData = {
        principal: formData.initial_investment,
        interest_rate: formData.annual_interest_rate,
        time_period: formData.investment_period_years,
        compounding_frequency: formData.compounding_frequency,
        monthly_contribution: formData.monthly_contribution,
        tax_rate: formData.tax_rate,
        inflation_rate: formData.inflation_rate,
        contribution_increase_rate: formData.contribution_increase_rate
      };

      const response = await fetch(getApiUrl('/calculators/compound-interest'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData),
      });

      const data = await response.json();
      
      if (response.ok) {
        updateState({ results: data, loading: false });
        setShowAllYears(false); // Reset to show first 10 years when new calculation is done
      } else {
        updateState({ 
          error: data.error || 'Failed to calculate compound interest',
          loading: false 
        });
      }
    } catch (err) {
      updateState({ 
        error: 'Failed to connect to the server. Please try again.',
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
    return `${value.toFixed(2)}%`;
  };

  const toggleYearlyProjections = () => {
    setShowAllYears(!showAllYears);
  };

  return (
    <div className="compound-interest-calculator">
      <div className="compound-header calculator-header" style={{ background: gradientStyle, color: '#fff', position: 'relative' }}>
        <h2>Compound Interest Calculator</h2>
        <p>See how your money grows over time with compound interest</p>
        
        <DualColorPicker
          color1={customColor}
          color2={customColor2}
          onColor1Change={handleColorChange}
          onColor2Change={handleColor2Change}
          storageKey1="compoundColor"
          storageKey2="compoundColor2"
          defaultColor1="#696F6F"
          defaultColor2="#628ECB"
        />
      </div>

      <div className={`calculator-container ${results ? 'has-results' : ''}`}>
        {/* Input Form */}
        <div className="input-section">
          <h3>Your Investment Details</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="initial_investment">Initial Investment</label>
              <input
                type="number"
                id="initial_investment"
                name="initial_investment"
                value={formData.initial_investment}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>

            <div className="form-group">
              <label htmlFor="monthly_contribution">Monthly Contribution</label>
              <input
                type="number"
                id="monthly_contribution"
                name="monthly_contribution"
                value={formData.monthly_contribution}
                onChange={handleInputChange}
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="annual_interest_rate">Annual Interest Rate (%)</label>
              <input
                type="number"
                id="annual_interest_rate"
                name="annual_interest_rate"
                value={formData.annual_interest_rate}
                onChange={handleInputChange}
                min="0"
                max="50"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="compounding_frequency">Compounding Frequency</label>
              <select
                id="compounding_frequency"
                name="compounding_frequency"
                value={formData.compounding_frequency}
                onChange={handleInputChange}
              >
                <option value="annually">Annually</option>
                <option value="semiannually">Semi-annually</option>
                <option value="quarterly">Quarterly</option>
                <option value="monthly">Monthly</option>
                <option value="daily">Daily</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="investment_period_years">Investment Period (Years)</label>
              <input
                type="number"
                id="investment_period_years"
                name="investment_period_years"
                value={formData.investment_period_years}
                onChange={handleInputChange}
                min="1"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tax_rate">Tax Rate (%)</label>
              <input
                type="number"
                id="tax_rate"
                name="tax_rate"
                value={formData.tax_rate}
                onChange={handleInputChange}
                min="0"
                max="50"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="inflation_rate">Inflation Rate (%)</label>
              <input
                type="number"
                id="inflation_rate"
                name="inflation_rate"
                value={formData.inflation_rate}
                onChange={handleInputChange}
                min="0"
                max="20"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contribution_increase_rate">Annual Contribution Increase (%)</label>
              <input
                type="number"
                id="contribution_increase_rate"
                name="contribution_increase_rate"
                value={formData.contribution_increase_rate}
                onChange={handleInputChange}
                min="0"
                max="20"
                step="0.1"
              />
            </div>
          </div>

          <button
            className="compound-calc-btn calculate-btn"
            style={{ background: gradientStyle, color: '#fff', border: 'none' }}
            onClick={calculateCompoundInterest}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Growth Projection'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Results Section */}
        {results && (
          <div className="results-section">
            <h3>Your Investment Growth Projection</h3>
            
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Final Balance</h4>
                <div className="amount">{formatCurrency(results.final_amount)}</div>
                <p>After {formData.investment_period_years} years</p>
              </div>
              
              <div className="summary-card">
                <h4>Total Contributions</h4>
                <div className="amount">{formatCurrency(results.total_contributions)}</div>
                <p>Principal you invested</p>
              </div>
              
              <div className="summary-card">
                <h4>Interest Earned</h4>
                <div className="amount">{formatCurrency(results.interest_earned)}</div>
                <p>Compound interest growth</p>
              </div>
              
              <div className="summary-card">
                <h4>Real Rate</h4>
                <div className="amount">{formatPercentage(results.real_rate)}</div>
                <p>After inflation & taxes</p>
              </div>
            </div>

            {/* Inflation Analysis */}
            {results.inflation_rate > 0 && (
              <div className="inflation-analysis">
                <h4>📊 Inflation Impact Analysis</h4>
                <div className="analysis-grid">
                  <div className="analysis-item">
                    <span>Nominal Final Balance:</span>
                    <span>{formatCurrency(results.final_amount)}</span>
                  </div>
                  <div className="analysis-item">
                    <span>Inflation-Adjusted Balance:</span>
                    <span>{formatCurrency(results.inflation_adjusted_balance)}</span>
                  </div>
                  <div className="analysis-item">
                    <span>Purchasing Power Loss:</span>
                    <span className="negative">{formatCurrency(results.purchasing_power_loss)}</span>
                  </div>
                  <div className="analysis-item">
                    <span>Effective Rate (After Tax):</span>
                    <span>{formatPercentage(results.effective_rate)}</span>
                  </div>
                  <div className="analysis-item">
                    <span>Real Rate (After Inflation):</span>
                    <span>{formatPercentage(results.real_rate)}</span>
                  </div>
                  <div className="analysis-item">
                    <span>Inflation Rate:</span>
                    <span>{formatPercentage(results.inflation_rate)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Growth Analysis */}
            <div className="growth-analysis">
              <h4>📈 Growth Analysis</h4>
              <div className="analysis-grid">
                <div className="analysis-item">
                  <span>Initial Investment:</span>
                  <span>{formatCurrency(results.principal)}</span>
                </div>
                <div className="analysis-item">
                  <span>Monthly Contribution:</span>
                  <span>{formatCurrency(results.monthly_contribution)}</span>
                </div>
                <div className="analysis-item">
                  <span>Total Contributions:</span>
                  <span>{formatCurrency(results.total_contributions)}</span>
                </div>
                <div className="analysis-item">
                  <span>Interest Earned:</span>
                  <span>{formatCurrency(results.interest_earned)}</span>
                </div>
                <div className="analysis-item">
                  <span>Nominal Interest Rate:</span>
                  <span>{formatPercentage(results.interest_rate)}</span>
                </div>
                <div className="analysis-item">
                  <span>Tax Rate:</span>
                  <span>{formatPercentage(results.tax_rate)}</span>
                </div>
                <div className="analysis-item">
                  <span>Time Period:</span>
                  <span>{results.time_period} years</span>
                </div>
                <div className="analysis-item">
                  <span>Compounding Frequency:</span>
                  <span>{results.compounding_frequency}</span>
                </div>
              </div>
            </div>

            {/* Yearly Projections */}
            {results.yearly_projections && results.yearly_projections.length > 0 && (
              <div className="yearly-projections">
                <h4>📈 Yearly Growth Projection</h4>
                <div className="projections-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Balance</th>
                        <th>Contributions</th>
                        <th>Interest</th>
                        <th>Monthly Contrib.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.yearly_projections.slice(0, showAllYears ? results.yearly_projections.length : 10).map((projection, index) => (
                        <tr key={index}>
                          <td>{projection.year}</td>
                          <td>{formatCurrency(projection.balance)}</td>
                          <td>{formatCurrency(projection.contributions)}</td>
                          <td>{formatCurrency(projection.interest)}</td>
                          <td>{formatCurrency(projection.monthly_contribution)}</td>
                        </tr>
                      ))}
                      {results.yearly_projections.length > 10 && !showAllYears && (
                        <tr>
                          <td colSpan="5" className="more-data">
                            <button 
                              className="expand-years-btn" 
                              onClick={toggleYearlyProjections}
                            >
                              ... and {results.yearly_projections.length - 10} more years (click to expand)
                            </button>
                          </td>
                        </tr>
                      )}
                      {results.yearly_projections.length > 10 && showAllYears && (
                        <tr>
                          <td colSpan="5" className="more-data">
                            <button 
                              className="collapse-years-btn" 
                              onClick={toggleYearlyProjections}
                            >
                              Show fewer years
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Insights */}
            {results.insights && results.insights.length > 0 && (
              <div className="insights-section">
                <h4>💡 Insights & Recommendations</h4>
                <div className="insights-list">
                  {results.insights.map((insight, index) => (
                    <div key={index} className={`insight-item ${insight.type}`}>
                      <h5>{insight.title}</h5>
                      <MarkdownMessage content={insight.message} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comparison Scenarios */}
            {results.comparison_scenarios && results.comparison_scenarios.length > 0 && (
              <div className="comparison-scenarios">
                <h4>🔄 Comparison Scenarios</h4>
                <div className="scenarios-grid">
                  {results.comparison_scenarios.map((scenario, index) => (
                    <div key={index} className="scenario-card">
                      <h5>{scenario.name}</h5>
                      <div className="scenario-amount">
                        {formatCurrency(scenario.final_balance)}
                      </div>
                      <p>{scenario.description}</p>
                      <div className="scenario-difference">
                        Difference: {formatCurrency(scenario.difference)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompoundInterestCalculator; 