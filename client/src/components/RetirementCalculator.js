import React, { useState } from 'react';
import './RetirementCalculator.css';

const RetirementCalculator = ({ formData, results, loading, error, updateState }) => {
  const [showAllYears, setShowAllYears] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateState({
      formData: {
        ...formData,
        [name]: parseFloat(value) || 0
      }
    });
  };

  const calculateRetirement = async () => {
    updateState({ loading: true, error: '' });
    
    try {
      const response = await fetch('http://127.0.0.1:5000/api/v1/calculators/retirement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        updateState({ results: data, loading: false });
        setShowAllYears(false); // Reset to show first 10 years when new calculation is done
      } else {
        updateState({ 
          error: data.error || 'Failed to calculate retirement projection',
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
    return `${value.toFixed(1)}%`;
  };

  const toggleYearlyProjections = () => {
    setShowAllYears(!showAllYears);
  };

  return (
    <div className="retirement-calculator">
      <div className="calculator-header">
        <h2>Retirement Calculator</h2>
        <p>Plan your retirement with comprehensive projections and analysis</p>
      </div>

      <div className={`calculator-container ${results ? 'has-results' : ''}`}>
        {/* Input Form */}
        <div className="input-section">
          <h3>Your Information</h3>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="current_age">Current Age</label>
              <input
                type="number"
                id="current_age"
                name="current_age"
                value={formData.current_age}
                onChange={handleInputChange}
                min="18"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="retirement_age">Retirement Age</label>
              <input
                type="number"
                id="retirement_age"
                name="retirement_age"
                value={formData.retirement_age}
                onChange={handleInputChange}
                min="40"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="current_savings">Current Savings</label>
              <input
                type="number"
                id="current_savings"
                name="current_savings"
                value={formData.current_savings}
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
              <label htmlFor="expected_return">Expected Annual Return (%)</label>
              <input
                type="number"
                id="expected_return"
                name="expected_return"
                value={formData.expected_return}
                onChange={handleInputChange}
                min="0"
                max="20"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="life_expectancy">Life Expectancy</label>
              <input
                type="number"
                id="life_expectancy"
                name="life_expectancy"
                value={formData.life_expectancy}
                onChange={handleInputChange}
                min="70"
                max="120"
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
                max="10"
                step="0.1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="social_security_income">Monthly Social Security</label>
              <input
                type="number"
                id="social_security_income"
                name="social_security_income"
                value={formData.social_security_income}
                onChange={handleInputChange}
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pension_income">Monthly Pension</label>
              <input
                type="number"
                id="pension_income"
                name="pension_income"
                value={formData.pension_income}
                onChange={handleInputChange}
                min="0"
                step="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="desired_retirement_income">Desired Annual Retirement Income</label>
              <input
                type="number"
                id="desired_retirement_income"
                name="desired_retirement_income"
                value={formData.desired_retirement_income}
                onChange={handleInputChange}
                min="0"
                step="1000"
              />
            </div>
          </div>

          <button 
            className="calculate-btn" 
            onClick={calculateRetirement}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Retirement Projection'}
          </button>

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Results Section */}
        {results && (
          <div className="results-section">
            <h3>Your Retirement Projection</h3>
            
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Projected Savings</h4>
                <div className="amount">{formatCurrency(results.projected_savings)}</div>
                <p>At retirement age {results.retirement_age}</p>
              </div>
              
              <div className="summary-card">
                <h4>Years to Retirement</h4>
                <div className="amount">{results.years_to_retirement}</div>
                <p>You have {results.years_to_retirement} years to save</p>
              </div>
              
              <div className="summary-card">
                <h4>Total Contributions</h4>
                <div className="amount">{formatCurrency(results.total_contributions)}</div>
                <p>Principal you'll contribute</p>
              </div>
              
              <div className="summary-card">
                <h4>Interest Earned</h4>
                <div className="amount">{formatCurrency(results.interest_earned)}</div>
                <p>Compound interest growth</p>
              </div>
            </div>

            {/* Savings Gap Analysis */}
            {results.savings_gap > 0 && (
              <div className="gap-analysis">
                <h4>⚠️ Savings Gap Detected</h4>
                <p>You need an additional <strong>{formatCurrency(results.savings_gap)}</strong> to meet your retirement income goal.</p>
                
                {results.catch_up_scenarios.length > 0 && (
                  <div className="catch-up-options">
                    <h5>Catch-up Options:</h5>
                    <ul>
                      {results.catch_up_scenarios.map((scenario, index) => (
                        <li key={index}>
                          <strong>{scenario.scenario}:</strong> {scenario.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Withdrawal Scenarios */}
            <div className="withdrawal-scenarios">
              <h4>Retirement Withdrawal Options</h4>
              <div className="scenarios-grid">
                {results.withdrawal_scenarios.map((scenario, index) => (
                  <div key={index} className="scenario-card">
                    <h5>{scenario.method}</h5>
                    <div className="withdrawal-amount">
                      {formatCurrency(scenario.annual_withdrawal)}/year
                    </div>
                    <div className="withdrawal-amount">
                      {formatCurrency(scenario.monthly_withdrawal)}/month
                    </div>
                    <p>{scenario.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Yearly Projections */}
            <div className="yearly-projections">
              <h4>Yearly Savings Projection</h4>
              <div className="projections-table">
                <table>
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Age</th>
                      <th>Balance</th>
                      <th>Contributions</th>
                      <th>Interest</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.yearly_projections.slice(0, showAllYears ? results.yearly_projections.length : 10).map((projection, index) => (
                      <tr key={index}>
                        <td>{projection.year}</td>
                        <td>{projection.age}</td>
                        <td>{formatCurrency(projection.balance)}</td>
                        <td>{formatCurrency(projection.contributions)}</td>
                        <td>{formatCurrency(projection.interest)}</td>
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

            {/* Recommendations */}
            {results.recommendations.length > 0 && (
              <div className="recommendations">
                <h4>💡 Recommendations</h4>
                <ul>
                  {results.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Additional Income Sources */}
            <div className="income-sources">
              <h4>Retirement Income Sources</h4>
              <div className="income-grid">
                <div className="income-item">
                  <span>Social Security:</span>
                  <span>{formatCurrency(results.social_security_income * 12)}/year</span>
                </div>
                <div className="income-item">
                  <span>Pension:</span>
                  <span>{formatCurrency(results.pension_income * 12)}/year</span>
                </div>
                <div className="income-item">
                  <span>Investment Withdrawals:</span>
                  <span>{formatCurrency(results.withdrawal_scenarios[0]?.annual_withdrawal || 0)}/year</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RetirementCalculator; 