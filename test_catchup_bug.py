#!/usr/bin/env python3
"""
Test to demonstrate the catch-up scenario calculation bug
"""

import math

def test_catchup_bug():
    """Test the catch-up scenario calculation with different monthly contributions"""
    
    # Base parameters
    current_age = 33
    retirement_age = 65
    current_savings = 350000
    expected_return = 0.05  # 5%
    years_to_retirement = retirement_age - current_age
    monthly_return = (1 + expected_return) ** (1/12) - 1
    inflation_rate = 0.025  # 2.5%
    social_security_income = 2000  # monthly
    pension_income = 0  # monthly
    desired_retirement_income = 120000  # annual
    
    # Calculate inflation-adjusted income (using corrected formula)
    inflation_adjusted_income = (social_security_income + pension_income) * (1 + inflation_rate) ** years_to_retirement
    
    print("=== Testing Catch-up Scenario Bug ===")
    print(f"Inflation-adjusted income: ${inflation_adjusted_income:.2f}")
    
    # Test different monthly contributions
    test_contributions = [1000, 1100, 1200, 1300]
    
    for monthly_contribution in test_contributions:
        print(f"\n--- Monthly Contribution: ${monthly_contribution} ---")
        
        # Calculate future value
        future_value = current_savings * (1 + expected_return) ** years_to_retirement
        future_value += monthly_contribution * ((1 + monthly_return) ** (years_to_retirement * 12) - 1) / monthly_return
        
        # Calculate savings gap
        savings_gap = desired_retirement_income - inflation_adjusted_income - (future_value * 0.04)
        
        print(f"Future value: ${future_value:,.2f}")
        print(f"Savings gap: ${savings_gap:,.2f}")
        
        if savings_gap > 0:
            # Calculate additional monthly savings needed
            additional_monthly_savings = savings_gap / ((1 + monthly_return) ** (years_to_retirement * 12) - 1) * monthly_return
            
            print(f"Additional monthly savings needed: ${additional_monthly_savings:.2f}")
            print(f"New total monthly savings: ${monthly_contribution + additional_monthly_savings:.2f}")
            
            # Verify the calculation
            test_future_value = additional_monthly_savings * ((1 + monthly_return) ** (years_to_retirement * 12) - 1) / monthly_return
            print(f"Future value of additional savings: ${test_future_value:.2f}")
            print(f"Should equal savings gap: ${savings_gap:.2f}")
            
            if abs(test_future_value - savings_gap) < 1:
                print("✅ Calculation is mathematically correct")
            else:
                print("❌ Calculation error detected")
        else:
            print("✅ No savings gap - goal achieved!")

def test_alternative_approach():
    """Test an alternative approach to calculate additional savings needed"""
    
    print("\n=== Alternative Approach ===")
    
    # Base parameters
    current_age = 33
    retirement_age = 65
    current_savings = 350000
    expected_return = 0.05  # 5%
    years_to_retirement = retirement_age - current_age
    monthly_return = (1 + expected_return) ** (1/12) - 1
    inflation_rate = 0.025  # 2.5%
    social_security_income = 2000  # monthly
    pension_income = 0  # monthly
    desired_retirement_income = 120000  # annual
    
    # Calculate inflation-adjusted income
    inflation_adjusted_income = (social_security_income + pension_income) * (1 + inflation_rate) ** years_to_retirement
    
    # Calculate required future value to meet income goal
    required_income_from_savings = desired_retirement_income - (inflation_adjusted_income * 12)
    required_future_value = required_income_from_savings / 0.04  # 4% withdrawal rule
    
    print(f"Required income from savings: ${required_income_from_savings:.2f}")
    print(f"Required future value: ${required_future_value:.2f}")
    
    # Test different monthly contributions
    test_contributions = [1000, 1100, 1200, 1300]
    
    for monthly_contribution in test_contributions:
        print(f"\n--- Monthly Contribution: ${monthly_contribution} ---")
        
        # Calculate current future value
        future_value = current_savings * (1 + expected_return) ** years_to_retirement
        future_value += monthly_contribution * ((1 + monthly_return) ** (years_to_retirement * 12) - 1) / monthly_return
        
        # Calculate shortfall
        shortfall = required_future_value - future_value
        
        print(f"Current future value: ${future_value:,.2f}")
        print(f"Shortfall: ${shortfall:,.2f}")
        
        if shortfall > 0:
            # Calculate additional monthly contribution needed
            # Use the annuity formula to solve for PMT
            # FV = PMT * ((1 + r)^n - 1) / r
            # PMT = FV * r / ((1 + r)^n - 1)
            additional_monthly = shortfall * monthly_return / ((1 + monthly_return) ** (years_to_retirement * 12) - 1)
            
            print(f"Additional monthly contribution needed: ${additional_monthly:.2f}")
            print(f"New total monthly contribution: ${monthly_contribution + additional_monthly:.2f}")
            
            # Verify
            new_future_value = current_savings * (1 + expected_return) ** years_to_retirement
            new_future_value += (monthly_contribution + additional_monthly) * ((1 + monthly_return) ** (years_to_retirement * 12) - 1) / monthly_return
            
            print(f"New future value: ${new_future_value:,.2f}")
            print(f"Difference from required: ${new_future_value - required_future_value:.2f}")
        else:
            print("✅ Goal achieved!")

if __name__ == "__main__":
    test_catchup_bug()
    test_alternative_approach() 