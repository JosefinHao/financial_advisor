from flask import Blueprint, request, jsonify
import math
import logging
from app.utils.error_handlers import handle_api_error, validate_json_data

# Create blueprint for calculator routes
calculators_bp = Blueprint('calculators', __name__)

@calculators_bp.route("/calculators/retirement", methods=["POST"])
def retirement_calculator():
    """Calculate comprehensive retirement savings projection"""
    try:
        data = validate_json_data(request)
        
        # Validate required fields
        required_fields = ["current_age", "retirement_age", "current_savings", "monthly_contribution", "expected_return"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Extract and validate data
        current_age = float(data["current_age"])
        retirement_age = float(data["retirement_age"])
        current_savings = float(data["current_savings"])
        monthly_contribution = float(data["monthly_contribution"])
        expected_return = float(data["expected_return"]) / 100  # Convert percentage to decimal
        
        # Optional fields with defaults
        life_expectancy = float(data.get("life_expectancy", 85))
        inflation_rate = float(data.get("inflation_rate", 2.5)) / 100
        social_security_income = float(data.get("social_security_income", 0))
        pension_income = float(data.get("pension_income", 0))
        desired_retirement_income = float(data.get("desired_retirement_income", 0))
        
        # Validate input ranges
        if current_age < 18 or current_age > 100:
            return jsonify({"error": "Current age must be between 18 and 100"}), 400
        if retirement_age <= current_age or retirement_age > 100:
            return jsonify({"error": "Retirement age must be greater than current age and less than 100"}), 400
        if current_savings < 0:
            return jsonify({"error": "Current savings cannot be negative"}), 400
        if monthly_contribution < 0:
            return jsonify({"error": "Monthly contribution cannot be negative"}), 400
        if expected_return < 0 or expected_return > 1:
            return jsonify({"error": "Expected return must be between 0% and 100%"}), 400
        if life_expectancy < retirement_age or life_expectancy > 120:
            return jsonify({"error": "Life expectancy must be greater than retirement age and less than 120"}), 400
        
        # Calculate years to retirement
        years_to_retirement = retirement_age - current_age
        years_in_retirement = life_expectancy - retirement_age
        
        # Calculate monthly return rate
        monthly_return = (1 + expected_return) ** (1/12) - 1
        
        # Calculate future value at retirement
        future_value = current_savings * (1 + expected_return) ** years_to_retirement
        future_value += monthly_contribution * ((1 + monthly_return) ** (years_to_retirement * 12) - 1) / monthly_return
        
        # Calculate total contributions
        total_contributions = current_savings + (monthly_contribution * 12 * years_to_retirement)
        
        # Calculate interest earned
        interest_earned = future_value - total_contributions
        
        # Calculate retirement income needs
        if desired_retirement_income > 0:
            # Adjust for inflation
            inflation_adjusted_income = desired_retirement_income * (1 + inflation_rate) ** years_to_retirement
            total_retirement_income_needed = inflation_adjusted_income * years_in_retirement
            additional_income_needed = total_retirement_income_needed - (social_security_income + pension_income) * years_in_retirement
            savings_gap = additional_income_needed - future_value
        else:
            inflation_adjusted_income = 0
            total_retirement_income_needed = 0
            additional_income_needed = 0
            savings_gap = 0
        
        # Generate yearly projections
        yearly_projections = []
        current_balance = current_savings
        
        for year in range(int(years_to_retirement) + 1):
            yearly_projections.append({
                "year": year,
                "age": current_age + year,
                "balance": round(current_balance, 2),
                "contributions": round(current_savings + (monthly_contribution * 12 * year), 2),
                "interest": round(current_balance - (current_savings + (monthly_contribution * 12 * year)), 2)
            })
            current_balance = current_balance * (1 + expected_return) + (monthly_contribution * 12)
        
        # Calculate retirement withdrawal scenarios
        withdrawal_scenarios = []
        if future_value > 0:
            # 4% rule (traditional)
            withdrawal_4_percent = future_value * 0.04
            withdrawal_scenarios.append({
                "method": "4% Rule (Traditional)",
                "annual_withdrawal": round(withdrawal_4_percent, 2),
                "monthly_withdrawal": round(withdrawal_4_percent / 12, 2),
                "description": "Withdraw 4% annually, adjusted for inflation"
            })
            
            # 3% rule (conservative)
            withdrawal_3_percent = future_value * 0.03
            withdrawal_scenarios.append({
                "method": "3% Rule (Conservative)",
                "annual_withdrawal": round(withdrawal_3_percent, 2),
                "monthly_withdrawal": round(withdrawal_3_percent / 12, 2),
                "description": "Withdraw 3% annually for more conservative approach"
            })
            
            # 5% rule (aggressive)
            withdrawal_5_percent = future_value * 0.05
            withdrawal_scenarios.append({
                "method": "5% Rule (Aggressive)",
                "annual_withdrawal": round(withdrawal_5_percent, 2),
                "monthly_withdrawal": round(withdrawal_5_percent / 12, 2),
                "description": "Withdraw 5% annually, higher risk of depletion"
            })
        
        # Calculate catch-up scenarios
        catch_up_scenarios = []
        if savings_gap > 0:
            # Calculate additional monthly contribution needed
            additional_monthly = (savings_gap / ((1 + monthly_return) ** (years_to_retirement * 12) - 1)) * monthly_return
            catch_up_scenarios.append({
                "scenario": "Additional Monthly Contribution",
                "amount": round(additional_monthly, 2),
                "description": f"Additional ${round(additional_monthly, 2)}/month needed to meet retirement goal"
            })
            
            # Calculate working longer
            if years_to_retirement < 20:  # Only suggest if not too close to retirement
                extra_years_needed = 2  # Suggest working 2 more years
                new_future_value = current_savings * (1 + expected_return) ** (years_to_retirement + extra_years_needed)
                new_future_value += (monthly_contribution + additional_monthly) * ((1 + monthly_return) ** ((years_to_retirement + extra_years_needed) * 12) - 1) / monthly_return
                catch_up_scenarios.append({
                    "scenario": "Work Longer",
                    "amount": extra_years_needed,
                    "description": f"Work {extra_years_needed} more years to increase savings"
                })
        
        # Generate recommendations
        recommendations = []
        if future_value < 1000000:
            recommendations.append("Consider increasing your monthly contributions to build a larger nest egg")
        if expected_return > 0.08:
            recommendations.append("Your expected return is optimistic. Consider a more conservative estimate")
        if years_to_retirement < 10:
            recommendations.append("You're close to retirement. Focus on preserving capital and reducing risk")
        if monthly_contribution < 500:
            recommendations.append("Consider increasing your monthly contribution to accelerate wealth building")
        if savings_gap > 0:
            recommendations.append("You may need to save more or work longer to meet your retirement income goals")
        
        return jsonify({
            "current_age": current_age,
            "retirement_age": retirement_age,
            "life_expectancy": life_expectancy,
            "years_to_retirement": years_to_retirement,
            "years_in_retirement": years_in_retirement,
            "current_savings": current_savings,
            "monthly_contribution": monthly_contribution,
            "expected_return": expected_return * 100,
            "inflation_rate": inflation_rate * 100,
            "projected_savings": round(future_value, 2),
            "total_contributions": round(total_contributions, 2),
            "interest_earned": round(interest_earned, 2),
            "social_security_income": social_security_income,
            "pension_income": pension_income,
            "desired_retirement_income": desired_retirement_income,
            "inflation_adjusted_income": round(inflation_adjusted_income, 2),
            "savings_gap": round(savings_gap, 2),
            "yearly_projections": yearly_projections,
            "withdrawal_scenarios": withdrawal_scenarios,
            "catch_up_scenarios": catch_up_scenarios,
            "recommendations": recommendations
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid numeric value: {str(e)}"}), 400
    except Exception as e:
        return handle_api_error(e, "Failed to calculate retirement projection")

@calculators_bp.route("/calculators/mortgage", methods=["POST"])
def mortgage_calculator():
    """Calculate mortgage payments and provide detailed analysis"""
    try:
        data = validate_json_data(request)
        
        # Extract and validate input parameters
        loan_amount = float(data.get("loan_amount", 0))
        interest_rate = float(data.get("interest_rate", 0))
        loan_term_years = int(data.get("loan_term_years", 30))
        down_payment = float(data.get("down_payment", 0))
        property_tax = float(data.get("property_tax", 0))
        insurance = float(data.get("insurance", 0))
        pmi_rate = float(data.get("pmi_rate", 0))
        
        # Validate inputs
        if loan_amount <= 0:
            return jsonify({"error": "Loan amount must be greater than 0"}), 400
        if interest_rate < 0 or interest_rate > 20:
            return jsonify({"error": "Interest rate must be between 0 and 20%"}), 400
        if loan_term_years <= 0 or loan_term_years > 50:
            return jsonify({"error": "Loan term must be between 1 and 50 years"}), 400
        if down_payment < 0 or down_payment >= loan_amount:
            return jsonify({"error": "Down payment must be between 0 and loan amount"}), 400
        
        # Calculate principal (loan amount minus down payment)
        principal = loan_amount - down_payment
        down_payment_percentage = (down_payment / loan_amount) * 100
        
        # Monthly interest rate
        monthly_rate = interest_rate / 100 / 12
        total_payments = loan_term_years * 12
        
        # Calculate monthly mortgage payment (P&I)
        if monthly_rate == 0:
            monthly_payment = principal / total_payments
        else:
            monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** total_payments) / ((1 + monthly_rate) ** total_payments - 1)
        
        # Calculate PMI if down payment is less than 20%
        pmi_monthly = 0
        if down_payment_percentage < 20:
            pmi_monthly = (principal * pmi_rate / 100) / 12
        
        # Calculate total monthly payment
        total_monthly_payment = monthly_payment + (property_tax / 12) + (insurance / 12) + pmi_monthly
        
        # Calculate total payments and interest
        total_payments_amount = total_monthly_payment * total_payments
        total_interest = (monthly_payment * total_payments) - principal
        total_cost = total_payments_amount + down_payment
        
        # Generate amortization schedule (first 5 years and last 5 years)
        amortization_schedule = []
        
        # First 5 years
        remaining_balance = principal
        for year in range(1, min(6, loan_term_years + 1)):
            year_data = {
                "year": year,
                "beginning_balance": round(remaining_balance, 2),
                "total_payment": round(monthly_payment * 12, 2),
                "principal_paid": 0,
                "interest_paid": 0,
                "ending_balance": 0
            }
            
            for month in range(12):
                interest_payment = remaining_balance * monthly_rate
                principal_payment = monthly_payment - interest_payment
                remaining_balance -= principal_payment
                
                year_data["principal_paid"] += principal_payment
                year_data["interest_paid"] += interest_payment
            
            year_data["ending_balance"] = round(remaining_balance, 2)
            year_data["principal_paid"] = round(year_data["principal_paid"], 2)
            year_data["interest_paid"] = round(year_data["interest_paid"], 2)
            amortization_schedule.append(year_data)
        
        # Last 5 years (if loan term > 10 years)
        if loan_term_years > 10:
            # Reset for last 5 years calculation
            remaining_balance = principal
            for year in range(1, loan_term_years - 4):
                for month in range(12):
                    interest_payment = remaining_balance * monthly_rate
                    principal_payment = monthly_payment - interest_payment
                    remaining_balance -= principal_payment
            
            # Now calculate last 5 years
            for year in range(loan_term_years - 4, loan_term_years + 1):
                year_data = {
                    "year": year,
                    "beginning_balance": round(remaining_balance, 2),
                    "total_payment": round(monthly_payment * 12, 2),
                    "principal_paid": 0,
                    "interest_paid": 0,
                    "ending_balance": 0
                }
                
                for month in range(12):
                    interest_payment = remaining_balance * monthly_rate
                    principal_payment = monthly_payment - interest_payment
                    remaining_balance -= principal_payment
                    
                    year_data["principal_paid"] += principal_payment
                    year_data["interest_paid"] += interest_payment
                
                year_data["ending_balance"] = round(remaining_balance, 2)
                year_data["principal_paid"] = round(year_data["principal_paid"], 2)
                year_data["interest_paid"] = round(year_data["interest_paid"], 2)
                amortization_schedule.append(year_data)
        
        # Generate insights and recommendations
        insights = []
        
        # Down payment analysis
        if down_payment_percentage < 20:
            insights.append({
                "type": "warning",
                "title": "Low Down Payment",
                "message": f"Your {down_payment_percentage:.1f}% down payment is below the recommended 20%. You'll pay PMI of ${pmi_monthly:.2f}/month until you reach 20% equity."
            })
        elif down_payment_percentage >= 20:
            insights.append({
                "type": "success",
                "title": "Good Down Payment",
                "message": f"Your {down_payment_percentage:.1f}% down payment is excellent! You avoid PMI and have better loan terms."
            })
        
        # Interest rate analysis
        if interest_rate > 6:
            insights.append({
                "type": "warning",
                "title": "High Interest Rate",
                "message": f"Your {interest_rate}% interest rate is relatively high. Consider improving your credit score or shopping around for better rates."
            })
        elif interest_rate < 4:
            insights.append({
                "type": "success",
                "title": "Great Interest Rate",
                "message": f"Your {interest_rate}% interest rate is excellent! You're getting very favorable terms."
            })
        
        # Loan term analysis
        if loan_term_years == 30:
            insights.append({
                "type": "info",
                "title": "30-Year Fixed Rate",
                "message": "Standard 30-year term provides lower monthly payments but higher total interest. Consider a 15-year term if you can afford higher payments."
            })
        elif loan_term_years == 15:
            insights.append({
                "type": "success",
                "title": "15-Year Fixed Rate",
                "message": "Great choice! 15-year terms typically have lower interest rates and save significantly on total interest."
            })
        
        # Payment affordability check
        debt_to_income_ratio = (total_monthly_payment * 12) / (data.get("annual_income", 100000)) * 100
        if debt_to_income_ratio > 43:
            insights.append({
                "type": "warning",
                "title": "High Debt-to-Income Ratio",
                "message": f"Your mortgage payment represents {debt_to_income_ratio:.1f}% of your income, which is above the recommended 43% maximum."
            })
        elif debt_to_income_ratio <= 28:
            insights.append({
                "type": "success",
                "title": "Good Debt-to-Income Ratio",
                "message": f"Your mortgage payment represents {debt_to_income_ratio:.1f}% of your income, which is well within recommended limits."
            })
        
        # Refinancing opportunities
        if interest_rate > 5 and loan_term_years > 10:
            insights.append({
                "type": "info",
                "title": "Refinancing Opportunity",
                "message": "Consider refinancing if rates drop below your current rate. This could save thousands in interest over the loan term."
            })
        
        return jsonify({
            "monthly_payment": round(monthly_payment, 2),
            "total_monthly_payment": round(total_monthly_payment, 2),
            "total_interest": round(total_interest, 2),
            "total_payments": round(total_payments_amount, 2),
            "total_cost": round(total_cost, 2),
            "principal": round(principal, 2),
            "down_payment_percentage": round(down_payment_percentage, 1),
            "pmi_monthly": round(pmi_monthly, 2),
            "amortization_schedule": amortization_schedule,
            "insights": insights,
            "loan_summary": {
                "loan_amount": loan_amount,
                "down_payment": down_payment,
                "interest_rate": interest_rate,
                "loan_term_years": loan_term_years,
                "property_tax_annual": property_tax,
                "insurance_annual": insurance
            }
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid input value: {str(e)}"}), 400
    except Exception as e:
        return handle_api_error(e, "Failed to calculate mortgage")

@calculators_bp.route("/calculators/compound-interest", methods=["POST"])
def compound_interest_calculator():
    """Calculate comprehensive compound interest growth with inflation, taxes, and contributions"""
    try:
        data = validate_json_data(request)
        
        # Extract and validate data
        principal = float(data.get("principal", 0))
        interest_rate = float(data.get("interest_rate", 0)) / 100  # Convert percentage to decimal
        time_period = float(data.get("time_period", 0))
        compounding_frequency = data.get("compounding_frequency", "monthly").lower()
        monthly_contribution = float(data.get("monthly_contribution", 0))
        tax_rate = float(data.get("tax_rate", 0)) / 100  # Convert percentage to decimal
        inflation_rate = float(data.get("inflation_rate", 0)) / 100  # Convert percentage to decimal
        contribution_increase_rate = float(data.get("contribution_increase_rate", 0)) / 100  # Convert percentage to decimal
        
        # Validate input ranges
        if principal < 0:
            return jsonify({"error": "Principal amount cannot be negative"}), 400
        if interest_rate < 0 or interest_rate > 1:
            return jsonify({"error": "Interest rate must be between 0% and 100%"}), 400
        if time_period <= 0:
            return jsonify({"error": "Time period must be positive"}), 400
        if monthly_contribution < 0:
            return jsonify({"error": "Monthly contribution cannot be negative"}), 400
        if tax_rate < 0 or tax_rate > 1:
            return jsonify({"error": "Tax rate must be between 0% and 100%"}), 400
        if inflation_rate < 0 or inflation_rate > 1:
            return jsonify({"error": "Inflation rate must be between 0% and 100%"}), 400
        if contribution_increase_rate < 0 or contribution_increase_rate > 1:
            return jsonify({"error": "Contribution increase rate must be between 0% and 100%"}), 400
        
        # Define compounding frequencies
        frequency_map = {
            "annually": 1,
            "semiannually": 2,
            "quarterly": 4,
            "monthly": 12,
            "weekly": 52,
            "daily": 365,
            "continuously": float('inf')
        }
        
        if compounding_frequency not in frequency_map:
            return jsonify({"error": "Invalid compounding frequency. Use: annually, semiannually, quarterly, monthly, weekly, daily, or continuously"}), 400
        
        n = frequency_map[compounding_frequency]
        
        # Calculate effective annual rate after taxes
        effective_rate = interest_rate * (1 - tax_rate)
        
        # Calculate real rate (nominal rate minus inflation)
        real_rate = effective_rate - inflation_rate
        
        # Calculate compound interest with monthly contributions
        current_balance = principal
        total_contributions = principal
        total_interest_earned = 0
        yearly_projections = []
        
        for year in range(int(time_period) + 1):
            # Calculate monthly contribution for this year (with annual increase)
            current_monthly_contribution = monthly_contribution * (1 + contribution_increase_rate) ** year
            
            # Calculate year-end balance
            if n == float('inf'):  # Continuous compounding
                # For continuous compounding with monthly contributions, we use a simplified approach
                year_balance = current_balance * math.exp(effective_rate)
                year_balance += current_monthly_contribution * 12 * math.exp(effective_rate * 0.5)  # Mid-year contribution
            else:
                # Calculate compound interest on current balance
                year_balance = current_balance * (1 + effective_rate / n) ** n
                
                # Add monthly contributions with compound interest
                if current_monthly_contribution > 0:
                    monthly_rate = effective_rate / 12
                    if monthly_rate > 0:
                        year_balance += current_monthly_contribution * ((1 + monthly_rate) ** 12 - 1) / monthly_rate
                    else:
                        year_balance += current_monthly_contribution * 12
            
            # Calculate interest earned this year
            year_contributions = current_monthly_contribution * 12
            year_interest = year_balance - current_balance - year_contributions
            
            # Update totals
            total_contributions += year_contributions
            total_interest_earned += year_interest
            
            yearly_projections.append({
                "year": year,
                "balance": round(year_balance, 2),
                "contributions": round(total_contributions, 2),
                "interest": round(total_interest_earned, 2),
                "monthly_contribution": round(current_monthly_contribution, 2)
            })
            
            current_balance = year_balance
        
        # Calculate inflation-adjusted values
        inflation_adjusted_balance = current_balance / (1 + inflation_rate) ** time_period
        inflation_adjusted_contributions = total_contributions / (1 + inflation_rate) ** time_period
        inflation_adjusted_interest = total_interest_earned / (1 + inflation_rate) ** time_period
        
        # Calculate purchasing power analysis
        purchasing_power_loss = current_balance - inflation_adjusted_balance
        
        # Generate insights
        insights = []
        
        if real_rate < 0:
            insights.append({
                "type": "warning",
                "title": "Negative Real Return",
                "message": f"After inflation ({inflation_rate*100:.1f}%) and taxes ({tax_rate*100:.1f}%), your real return is {real_rate*100:.1f}%. Consider higher-yield investments."
            })
        elif real_rate < 0.02:
            insights.append({
                "type": "info",
                "title": "Low Real Return",
                "message": f"Your real return after inflation and taxes is {real_rate*100:.1f}%. Consider more aggressive investments for better growth."
            })
        else:
            insights.append({
                "type": "success",
                "title": "Good Real Return",
                "message": f"Your real return after inflation and taxes is {real_rate*100:.1f}%. This should provide solid long-term growth."
            })
        
        if inflation_rate > 0.03:
            insights.append({
                "type": "warning",
                "title": "High Inflation Impact",
                "message": f"High inflation ({inflation_rate*100:.1f}%) significantly reduces your purchasing power. Consider inflation-protected investments."
            })
        
        if tax_rate > 0.25:
            insights.append({
                "type": "info",
                "title": "High Tax Impact",
                "message": f"High taxes ({tax_rate*100:.1f}%) reduce your returns. Consider tax-advantaged accounts like IRAs or 401(k)s."
            })
        
        if contribution_increase_rate > 0:
            insights.append({
                "type": "success",
                "title": "Increasing Contributions",
                "message": f"Great strategy! Increasing contributions by {contribution_increase_rate*100:.1f}% annually will significantly boost your final balance."
            })
        
        return jsonify({
            "principal": principal,
            "interest_rate": interest_rate * 100,
            "time_period": time_period,
            "compounding_frequency": compounding_frequency,
            "monthly_contribution": monthly_contribution,
            "tax_rate": tax_rate * 100,
            "inflation_rate": inflation_rate * 100,
            "contribution_increase_rate": contribution_increase_rate * 100,
            "final_amount": round(current_balance, 2),
            "total_contributions": round(total_contributions, 2),
            "interest_earned": round(total_interest_earned, 2),
            "effective_rate": round(effective_rate * 100, 2),
            "real_rate": round(real_rate * 100, 2),
            "inflation_adjusted_balance": round(inflation_adjusted_balance, 2),
            "inflation_adjusted_contributions": round(inflation_adjusted_contributions, 2),
            "inflation_adjusted_interest": round(inflation_adjusted_interest, 2),
            "purchasing_power_loss": round(purchasing_power_loss, 2),
            "yearly_projections": yearly_projections,
            "insights": insights
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid numeric value: {str(e)}"}), 400
    except Exception as e:
        return handle_api_error(e, "Failed to calculate compound interest") 