import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NetWorthPage.css';
import { generateGradient } from '../utils/gradientUtils';
import DualColorPicker from '../ui/DualColorPicker';

const NetWorthPage = ({ formData, results, loading, error, updateState }) => {
  const navigate = useNavigate();
  const [showResults, setShowResults] = useState(false);
  const [customColor, setCustomColor] = useState('#88DDC1');
  const [customColor2, setCustomColor2] = useState('#D86F6F');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [trendPeriod, setTrendPeriod] = useState('6'); // '6' for 6 months, '12' for 12 months
  const [savedNetWorth, setSavedNetWorth] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showHousingFields, setShowHousingFields] = useState(false);
  const [showRentalFields, setShowRentalFields] = useState(false);
  const [numberOfHouses, setNumberOfHouses] = useState(1);

  useEffect(() => {
    const savedColor = localStorage.getItem('networthColor');
    const savedColor2 = localStorage.getItem('networthColor2');
    
    // Only use saved colors if they are valid hex color strings
    if (savedColor && savedColor.match(/^#[0-9A-F]{6}$/i)) {
      setCustomColor(savedColor);
    }
    if (savedColor2 && savedColor2.match(/^#[0-9A-F]{6}$/i)) {
      setCustomColor2(savedColor2);
    }
  }, []);

  // Load saved net worth data
  useEffect(() => {
    const savedData = localStorage.getItem('savedNetWorth');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setSavedNetWorth(parsedData);
      } catch (error) {
        console.error('Error loading saved net worth:', error);
      }
    }
  }, []);

  // Show results when they become available
  useEffect(() => {
    if (results) {
      setShowResults(true);
    }
  }, [results]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    updateState({
      formData: {
        ...formData,
      [name]: parseFloat(value) || 0
      }
    });
  };

  // Helper function to display empty string instead of 0 in input fields
  const getInputValue = (value) => {
    return value === 0 ? '' : value.toString();
  };

  const handleColorChange = (color) => {
    setCustomColor(color);
    localStorage.setItem('networthColor', color);
  };

  const handleColor2Change = (color) => {
    setCustomColor2(color);
    localStorage.setItem('networthColor2', color);
  };

  const handleHousingCheckboxChange = (e) => {
    setShowHousingFields(e.target.checked);
    if (!e.target.checked) {
      // Clear housing-related fields when unchecked
      updateState({
        formData: {
          ...formData,
          primary_residence: 0,
          mortgage: 0,
          home_equity_loan: 0
        }
      });
      setNumberOfHouses(1);
    }
  };

  const handleNumberOfHousesChange = (e) => {
    const count = parseInt(e.target.value) || 1;
    setNumberOfHouses(Math.max(1, Math.min(count, 10))); // Limit to 1-10 houses
    
    // Update houses array to match the new count
    const newHouses = [];
    for (let i = 0; i < count; i++) {
      newHouses.push(formData.houses[i] || { value: 0, mortgage: 0, equity_loan: 0 });
    }
    
    updateState({
      formData: {
        ...formData,
        houses: newHouses
      }
    });
  };

  const handleHouseDataChange = (index, field, value) => {
    const newHouses = [...formData.houses];
    newHouses[index] = {
      ...newHouses[index],
      [field]: parseFloat(value) || 0
    };
    
    updateState({
      formData: {
        ...formData,
        houses: newHouses
      }
    });
  };

  const handleRentalCheckboxChange = (e) => {
    setShowRentalFields(e.target.checked);
    if (!e.target.checked) {
      // Clear rental-related fields when unchecked
      updateState({
        formData: {
          ...formData,
          rental_properties: 0,
          rental_mortgages: 0
        }
      });
    }
  };

  const resetForm = () => {
    setShowHousingFields(false);
    setShowRentalFields(false);
    setNumberOfHouses(1);
    updateState({
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
      }
    });
  };

  const gradientStyle = generateGradient(customColor, customColor2);

  const calculateNetWorth = () => {
    updateState({ loading: true, error: '' });
    
    // Calculate house totals from the houses array
    const totalHouseValues = formData.houses.reduce((sum, house) => sum + (house.value || 0), 0);
    const totalHouseMortgages = formData.houses.reduce((sum, house) => sum + (house.mortgage || 0), 0);
    const totalHouseEquityLoans = formData.houses.reduce((sum, house) => sum + (house.equity_loan || 0), 0);
    
    // Calculate totals
    const totalAssets = 
      formData.cash_savings + 
      formData.checking_accounts + 
      formData.savings_accounts + 
      formData.investment_accounts + 
      formData.retirement_accounts + 
      formData.real_estate + 
      totalHouseValues + 
      formData.rental_properties + 
      formData.vehicles + 
      formData.other_assets;

    const totalLiabilities = 
      formData.credit_cards + 
      formData.student_loans + 
      formData.car_loans + 
      totalHouseMortgages + 
      totalHouseEquityLoans + 
      formData.rental_mortgages + 
      formData.personal_loans + 
      formData.other_debt;

    const netWorth = totalAssets - totalLiabilities;

    // Create breakdown data
    const assetsBreakdown = [
      { name: 'Cash & Savings', amount: formData.cash_savings + formData.checking_accounts + formData.savings_accounts, percentage: totalAssets > 0 ? ((formData.cash_savings + formData.checking_accounts + formData.savings_accounts) / totalAssets * 100) : 0 },
      { name: 'Investment Accounts', amount: formData.investment_accounts, percentage: totalAssets > 0 ? (formData.investment_accounts / totalAssets * 100) : 0 },
      { name: 'Retirement Accounts', amount: formData.retirement_accounts, percentage: totalAssets > 0 ? (formData.retirement_accounts / totalAssets * 100) : 0 },
      { name: 'Houses', amount: totalHouseValues, percentage: totalAssets > 0 ? (totalHouseValues / totalAssets * 100) : 0 },
      { name: 'Rental Properties', amount: formData.rental_properties, percentage: totalAssets > 0 ? (formData.rental_properties / totalAssets * 100) : 0 },
      { name: 'Other Real Estate', amount: formData.real_estate, percentage: totalAssets > 0 ? (formData.real_estate / totalAssets * 100) : 0 },
      { name: 'Vehicles', amount: formData.vehicles, percentage: totalAssets > 0 ? (formData.vehicles / totalAssets * 100) : 0 },
      { name: 'Other Assets', amount: formData.other_assets, percentage: totalAssets > 0 ? (formData.other_assets / totalAssets * 100) : 0 }
    ].filter(item => item.amount > 0);

    const liabilitiesBreakdown = [
      { name: 'House Mortgages', amount: totalHouseMortgages, percentage: totalLiabilities > 0 ? (totalHouseMortgages / totalLiabilities * 100) : 0 },
      { name: 'Home Equity Loans', amount: totalHouseEquityLoans, percentage: totalLiabilities > 0 ? (totalHouseEquityLoans / totalLiabilities * 100) : 0 },
      { name: 'Rental Mortgages', amount: formData.rental_mortgages, percentage: totalLiabilities > 0 ? (formData.rental_mortgages / totalLiabilities * 100) : 0 },
      { name: 'Credit Cards', amount: formData.credit_cards, percentage: totalLiabilities > 0 ? (formData.credit_cards / totalLiabilities * 100) : 0 },
      { name: 'Student Loans', amount: formData.student_loans, percentage: totalLiabilities > 0 ? (formData.student_loans / totalLiabilities * 100) : 0 },
      { name: 'Car Loans', amount: formData.car_loans, percentage: totalLiabilities > 0 ? (formData.car_loans / totalLiabilities * 100) : 0 },
      { name: 'Personal Loans', amount: formData.personal_loans, percentage: totalLiabilities > 0 ? (formData.personal_loans / totalLiabilities * 100) : 0 },
      { name: 'Other Debt', amount: formData.other_debt, percentage: totalLiabilities > 0 ? (formData.other_debt / totalLiabilities * 100) : 0 }
    ].filter(item => item.amount > 0);

    // Generate insights
    const insights = [];
    
    if (netWorth > 0) {
      insights.push({
        type: 'positive',
        title: 'Positive Net Worth',
        description: `Great job! Your net worth is ${formatCurrency(netWorth)}. You're building wealth effectively.`
      });
    } else {
      insights.push({
        type: 'warning',
        title: 'Negative Net Worth',
        description: `Your net worth is ${formatCurrency(Math.abs(netWorth))} in the negative. Focus on debt reduction and building assets.`
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

    // Housing-specific insights
    if (totalHouseValues > 0 && totalHouseMortgages > 0) {
      const homeEquity = totalHouseValues - totalHouseMortgages - totalHouseEquityLoans;
      const equityPercentage = (homeEquity / totalHouseValues) * 100;
      
      if (equityPercentage < 20) {
        insights.push({
          type: 'warning',
          title: 'Low Home Equity',
          description: `Your home equity is ${equityPercentage.toFixed(1)}%. Consider building equity before taking on additional home debt.`
        });
      } else if (equityPercentage > 50) {
        insights.push({
          type: 'positive',
          title: 'Strong Home Equity',
          description: `Great job! You have ${equityPercentage.toFixed(1)}% equity in your homes, providing a solid financial foundation.`
        });
      }
    }

    if (totalHouseEquityLoans > 0) {
      insights.push({
        type: 'info',
        title: 'Home Equity Loans',
        description: 'Monitor your home equity loan balances. Consider paying them down to maintain home equity.'
      });
    }

    if (formData.rental_properties > 0 && formData.rental_mortgages > 0) {
      const rentalEquity = formData.rental_properties - formData.rental_mortgages;
      if (rentalEquity < 0) {
        insights.push({
          type: 'warning',
          title: 'Rental Property Debt',
          description: 'Your rental properties have negative equity. Review your rental strategy and property values.'
        });
      } else {
        insights.push({
          type: 'positive',
          title: 'Rental Property Equity',
          description: `Your rental properties have ${formatCurrency(rentalEquity)} in equity, contributing to your net worth.`
        });
      }
    }

    if (totalHouseValues + formData.rental_properties > totalAssets * 0.7) {
      insights.push({
        type: 'info',
        title: 'Real Estate Concentration',
        description: 'Real estate represents a large portion of your assets. Consider diversifying your portfolio.'
      });
    }

    // Mock monthly trends (in real app, this would be historical data)
    const monthlyTrends6 = [
      { month: 'Jan', netWorth: netWorth * 0.95 },
      { month: 'Feb', netWorth: netWorth * 0.97 },
      { month: 'Mar', netWorth: netWorth * 0.98 },
      { month: 'Apr', netWorth: netWorth * 0.99 },
      { month: 'May', netWorth: netWorth * 1.01 },
      { month: 'Jun', netWorth: netWorth }
    ];

    const monthlyTrends12 = [
      { month: 'Jan', netWorth: netWorth * 0.92 },
      { month: 'Feb', netWorth: netWorth * 0.94 },
      { month: 'Mar', netWorth: netWorth * 0.96 },
      { month: 'Apr', netWorth: netWorth * 0.97 },
      { month: 'May', netWorth: netWorth * 0.98 },
      { month: 'Jun', netWorth: netWorth * 0.99 },
      { month: 'Jul', netWorth: netWorth * 1.00 },
      { month: 'Aug', netWorth: netWorth * 1.01 },
      { month: 'Sep', netWorth: netWorth * 1.02 },
      { month: 'Oct', netWorth: netWorth * 1.01 },
      { month: 'Nov', netWorth: netWorth * 1.00 },
      { month: 'Dec', netWorth: netWorth }
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
      monthlyTrends6,
      monthlyTrends12,
      insights
    };

    setTimeout(() => {
      updateState({ results: resultData, loading: false });
    }, 1000);
  };

  const saveNetWorth = async () => {
    if (!results) {
      return; // Can't save if no results
    }

    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      // In a real app, this would send data to the backend
      // For now, we'll simulate saving to localStorage
      const netWorthData = {
        ...results,
        savedAt: new Date().toISOString(),
        formData: { ...formData } // Save the input data as well
      };

      // Save to localStorage (in real app, this would be a database)
      localStorage.setItem('savedNetWorth', JSON.stringify(netWorthData));
      
      setSavedNetWorth(netWorthData);
      setSaveSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('Error saving net worth:', error);
    } finally {
      setSaveLoading(false);
    }
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
      <div className="calculator-header" style={{ background: gradientStyle, color: '#fff', position: 'relative' }}>
        <h2>Net Worth Calculator</h2>
        <p>Calculate and track your net worth by entering your assets and liabilities</p>
        
        <DualColorPicker
          color1={customColor}
          color2={customColor2}
          onColor1Change={handleColorChange}
          onColor2Change={handleColor2Change}
          storageKey1="networthColor"
          storageKey2="networthColor2"
          defaultColor1="#88DDC1"
          defaultColor2="#D86F6F"
        />
      </div>

      <div className={`calculator-container ${showResults ? 'has-results' : ''}`}>
        {/* Input Section */}
        <div className="input-section">
          <div className="input-header">
          <h3>Enter Your Financial Information</h3>
            <button 
              className="reset-btn"
              onClick={resetForm}
              title="Reset all fields to zero"
            >
              Reset
            </button>
          </div>
          
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
                  value={getInputValue(formData.cash_savings)}
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
                  value={getInputValue(formData.checking_accounts)}
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
                  value={getInputValue(formData.savings_accounts)}
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
                  value={getInputValue(formData.investment_accounts)}
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
                  value={getInputValue(formData.retirement_accounts)}
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
                  value={getInputValue(formData.real_estate)}
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
                  value={getInputValue(formData.vehicles)}
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
                  value={getInputValue(formData.other_assets)}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Housing Checkbox */}
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showHousingFields}
                  onChange={handleHousingCheckboxChange}
                />
                <span>I own one or more houses</span>
              </label>
            </div>

            {/* Housing Fields - Only show if checkbox is checked */}
            {showHousingFields && (
              <div className="housing-fields">
                <div className="form-group number-of-houses">
                  <label htmlFor="number_of_houses">Number of Houses</label>
                  <input
                    type="number"
                    id="number_of_houses"
                    value={numberOfHouses}
                    onChange={handleNumberOfHousesChange}
                    min="1"
                    max="10"
                    step="1"
                  />
                </div>
                
                {Array.from({ length: numberOfHouses }, (_, index) => (
                  <div key={index} className="house-group">
                    <h5 className="house-title">House {index + 1}</h5>
                    <div className="form-grid">
                      <div className="form-group">
                        <label htmlFor={`house_${index}_value`}>House Value</label>
                        <input
                          type="number"
                          id={`house_${index}_value`}
                          value={getInputValue(formData.houses[index]?.value || 0)}
                          onChange={(e) => handleHouseDataChange(index, 'value', e.target.value)}
                          min="0"
                          step="1000"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`house_${index}_mortgage`} title="The remaining amount you owe on your original home purchase loan. This is your primary mortgage that you got when you first bought your house.">
                          Mortgage Balance
                        </label>
                        <input
                          type="number"
                          id={`house_${index}_mortgage`}
                          value={getInputValue(formData.houses[index]?.mortgage || 0)}
                          onChange={(e) => handleHouseDataChange(index, 'mortgage', e.target.value)}
                          min="0"
                          step="1000"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`house_${index}_equity_loan`} title="A second loan taken out against the equity you've built in your home. Used for renovations, debt consolidation, or other expenses.">
                          Home Equity Loan
                        </label>
                        <input
                          type="number"
                          id={`house_${index}_equity_loan`}
                          value={getInputValue(formData.houses[index]?.equity_loan || 0)}
                          onChange={(e) => handleHouseDataChange(index, 'equity_loan', e.target.value)}
                          min="0"
                          step="1000"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rental Properties Checkbox */}
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showRentalFields}
                  onChange={handleRentalCheckboxChange}
                />
                <span>I own rental properties</span>
              </label>
            </div>

            {/* Rental Fields - Only show if checkbox is checked */}
            {showRentalFields && (
              <div className="form-grid rental-fields">
                <div className="form-group">
                  <label htmlFor="rental_properties">Rental Properties Value</label>
                  <input
                    type="number"
                    id="rental_properties"
                    name="rental_properties"
                    value={getInputValue(formData.rental_properties)}
                    onChange={(e) => handleHouseDataChange(1, 'value', e.target.value)}
                    min="0"
                    step="1000"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="rental_mortgages">Rental Mortgages</label>
                  <input
                    type="number"
                    id="rental_mortgages"
                    name="rental_mortgages"
                    value={getInputValue(formData.rental_mortgages)}
                    onChange={(e) => handleHouseDataChange(1, 'mortgage', e.target.value)}
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
            )}
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
                  value={getInputValue(formData.credit_cards)}
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
                  value={getInputValue(formData.student_loans)}
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
                  value={getInputValue(formData.car_loans)}
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
                  value={getInputValue(formData.personal_loans)}
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
                  value={getInputValue(formData.other_debt)}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>
            </div>

            {/* Rental-related liabilities - Only show if rental checkbox is checked */}
            {showRentalFields && (
              <div className="form-grid rental-liabilities">
                <div className="form-group">
                  <label htmlFor="rental_mortgages">Rental Mortgages</label>
                  <input
                    type="number"
                    id="rental_mortgages"
                    name="rental_mortgages"
                    value={getInputValue(formData.rental_mortgages)}
                    onChange={handleInputChange}
                    min="0"
                    step="1000"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            className="calculate-btn"
            style={{ background: gradientStyle, color: '#fff', border: 'none' }}
            onClick={calculateNetWorth}
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Net Worth'}
          </button>

          {showResults && results && (
            <button
              className="save-btn"
              onClick={saveNetWorth}
              disabled={saveLoading}
            >
              {saveLoading ? 'Saving...' : 'Save Net Worth'}
            </button>
          )}

          {saveSuccess && (
            <div className="save-success">
              ✅ Net worth data saved successfully! You can now track your progress over time.
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Results Section */}
        <div className={`results-section ${showResults && results ? 'visible' : 'hidden'}`}>
          {showResults && results ? (
            <>
              <h3>Your Net Worth Analysis</h3>
              
              {/* Main Net Worth Card */}
              <div className="net-worth-card">
                <div className="net-worth-header">
                  <h2>Current Net Worth</h2>
                  <div className="net-worth-amount">{formatCurrency(results.currentNetWorth)}</div>
                  <div className={`net-worth-change ${results.currentNetWorth >= 0 ? 'positive' : 'negative'}`}>
                    {results.currentNetWorth >= 0 ? 'Positive Net Worth' : 'Negative Net Worth'}
                  </div>
                </div>
              </div>

              {/* Assets and Liabilities Grid */}
              <div className="assets-liabilities-grid">
                {/* Assets Section */}
                <div className="section-card">
                  <h4 className="section-title">📈 Assets Breakdown</h4>
                  <div className="total-summary assets">
                    <span className="total-label">Total Assets</span>
                    <span className="total-amount">{formatCurrency(results.totalAssets)}</span>
                  </div>
                  <div className="breakdown-list">
                    {results.assets.breakdown.map((item, index) => (
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
                  <div className="total-summary liabilities">
                    <span className="total-label">Total Liabilities</span>
                    <span className="total-amount">{formatCurrency(results.totalLiabilities)}</span>
                  </div>
                  <div className="breakdown-list">
                    {results.liabilities.breakdown.map((item, index) => (
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
                <div className="trends-header">
                  <h4 className="section-title">📊 Net Worth Trend</h4>
                  <div className="trend-toggle">
                    <button 
                      className={`toggle-btn ${trendPeriod === '6' ? 'active' : ''}`}
                      onClick={() => setTrendPeriod('6')}
                    >
                      6 Months
                    </button>
                    <button 
                      className={`toggle-btn ${trendPeriod === '12' ? 'active' : ''}`}
                      onClick={() => setTrendPeriod('12')}
                    >
                      12 Months
                    </button>
                  </div>
                </div>
                <div className="trends-chart">
                  <div className="chart-container">
                    {(trendPeriod === '6' ? results.monthlyTrends6 : results.monthlyTrends12).map((month, index) => (
                      <div key={index} className="chart-bar">
                        <div className="bar-label">{month.month}</div>
                        <div className="bar-container">
                          <div 
                            className="bar-fill" 
                            style={{ height: `${Math.max((month.netWorth / Math.max(...(trendPeriod === '6' ? results.monthlyTrends6 : results.monthlyTrends12).map(m => m.netWorth))) * 100, 5)}%` }}
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
                  {results.insights.map((insight, index) => (
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
                  Set Financial Goals
                </button>
                <button onClick={() => navigate('/chat')} className="action-btn success">
                  Get Financial Advice
                </button>
                <button onClick={() => navigate('/calculators/retirement')} className="action-btn info">
                  Retirement Calculator
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