from flask import Blueprint, request, jsonify
import math
import logging
from app.utils.error_handlers import handle_api_error, validate_json_data

# Create blueprint for calculator routes
calculators_bp = Blueprint('calculators', __name__)

@calculators_bp.route("/calculators/retirement", methods=["POST"])
def retirement_calculator():
    """Calculate retirement savings projection"""
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
        
        # Calculate years to retirement
        years_to_retirement = retirement_age - current_age
        
        # Calculate monthly return rate
        monthly_return = (1 + expected_return) ** (1/12) - 1
        
        # Calculate future value
        future_value = current_savings * (1 + expected_return) ** years_to_retirement
        future_value += monthly_contribution * ((1 + monthly_return) ** (years_to_retirement * 12) - 1) / monthly_return
        
        # Calculate total contributions
        total_contributions = current_savings + (monthly_contribution * 12 * years_to_retirement)
        
        # Calculate interest earned
        interest_earned = future_value - total_contributions
        
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
        
        return jsonify({
            "current_age": current_age,
            "retirement_age": retirement_age,
            "years_to_retirement": years_to_retirement,
            "current_savings": current_savings,
            "monthly_contribution": monthly_contribution,
            "expected_return": expected_return * 100,
            "projected_savings": round(future_value, 2),
            "total_contributions": round(total_contributions, 2),
            "interest_earned": round(interest_earned, 2),
            "yearly_projections": yearly_projections
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid numeric value: {str(e)}"}), 400
    except Exception as e:
        return handle_api_error(e, "Failed to calculate retirement projection")

@calculators_bp.route("/calculators/mortgage", methods=["POST"])
def mortgage_calculator():
    """Calculate mortgage payments and amortization"""
    try:
        data = validate_json_data(request)
        
        # Validate required fields
        required_fields = ["loan_amount", "interest_rate", "loan_term"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Extract and validate data
        loan_amount = float(data["loan_amount"])
        interest_rate = float(data["interest_rate"]) / 100  # Convert percentage to decimal
        loan_term = int(data["loan_term"])
        
        # Validate input ranges
        if loan_amount <= 0:
            return jsonify({"error": "Loan amount must be positive"}), 400
        if interest_rate < 0 or interest_rate > 1:
            return jsonify({"error": "Interest rate must be between 0% and 100%"}), 400
        if loan_term <= 0 or loan_term > 50:
            return jsonify({"error": "Loan term must be between 1 and 50 years"}), 400
        
        # Calculate monthly interest rate
        monthly_rate = interest_rate / 12
        
        # Calculate number of payments
        num_payments = loan_term * 12
        
        # Calculate monthly payment using mortgage formula
        if monthly_rate == 0:
            monthly_payment = loan_amount / num_payments
        else:
            monthly_payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** num_payments) / ((1 + monthly_rate) ** num_payments - 1)
        
        # Calculate total payment and interest
        total_payment = monthly_payment * num_payments
        total_interest = total_payment - loan_amount
        
        # Generate amortization schedule
        amortization_schedule = []
        remaining_balance = loan_amount
        
        for payment_num in range(1, min(num_payments + 1, 361)):  # Limit to 30 years for performance
            interest_payment = remaining_balance * monthly_rate
            principal_payment = monthly_payment - interest_payment
            remaining_balance -= principal_payment
            
            amortization_schedule.append({
                "payment_number": payment_num,
                "payment": round(monthly_payment, 2),
                "principal": round(principal_payment, 2),
                "interest": round(interest_payment, 2),
                "remaining_balance": round(max(0, remaining_balance), 2)
            })
            
            if remaining_balance <= 0:
                break
        
        return jsonify({
            "loan_amount": loan_amount,
            "interest_rate": interest_rate * 100,
            "loan_term": loan_term,
            "monthly_payment": round(monthly_payment, 2),
            "total_payment": round(total_payment, 2),
            "total_interest": round(total_interest, 2),
            "amortization_schedule": amortization_schedule
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid numeric value: {str(e)}"}), 400
    except Exception as e:
        return handle_api_error(e, "Failed to calculate mortgage")

@calculators_bp.route("/calculators/compound-interest", methods=["POST"])
def compound_interest_calculator():
    """Calculate compound interest growth"""
    try:
        data = validate_json_data(request)
        
        # Validate required fields
        required_fields = ["principal", "interest_rate", "time_period", "compounding_frequency"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Extract and validate data
        principal = float(data["principal"])
        interest_rate = float(data["interest_rate"]) / 100  # Convert percentage to decimal
        time_period = float(data["time_period"])
        compounding_frequency = data["compounding_frequency"].lower()
        
        # Validate input ranges
        if principal <= 0:
            return jsonify({"error": "Principal amount must be positive"}), 400
        if interest_rate < 0 or interest_rate > 1:
            return jsonify({"error": "Interest rate must be between 0% and 100%"}), 400
        if time_period <= 0:
            return jsonify({"error": "Time period must be positive"}), 400
        
        # Define compounding frequencies
        frequency_map = {
            "annually": 1,
            "semi-annually": 2,
            "quarterly": 4,
            "monthly": 12,
            "weekly": 52,
            "daily": 365,
            "continuously": float('inf')
        }
        
        if compounding_frequency not in frequency_map:
            return jsonify({"error": "Invalid compounding frequency. Use: annually, semi-annually, quarterly, monthly, weekly, daily, or continuously"}), 400
        
        n = frequency_map[compounding_frequency]
        
        # Calculate compound interest
        if n == float('inf'):  # Continuous compounding
            amount = principal * math.exp(interest_rate * time_period)
        else:
            amount = principal * (1 + interest_rate / n) ** (n * time_period)
        
        interest_earned = amount - principal
        
        # Generate yearly projections
        yearly_projections = []
        for year in range(int(time_period) + 1):
            if n == float('inf'):
                year_amount = principal * math.exp(interest_rate * year)
            else:
                year_amount = principal * (1 + interest_rate / n) ** (n * year)
            
            yearly_projections.append({
                "year": year,
                "amount": round(year_amount, 2),
                "interest_earned": round(year_amount - principal, 2)
            })
        
        return jsonify({
            "principal": principal,
            "interest_rate": interest_rate * 100,
            "time_period": time_period,
            "compounding_frequency": compounding_frequency,
            "final_amount": round(amount, 2),
            "interest_earned": round(interest_earned, 2),
            "yearly_projections": yearly_projections
        })
        
    except ValueError as e:
        return jsonify({"error": f"Invalid numeric value: {str(e)}"}), 400
    except Exception as e:
        return handle_api_error(e, "Failed to calculate compound interest") 