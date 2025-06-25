from flask import Blueprint, jsonify
from app.utils.error_handlers import handle_api_error

# Create blueprint for education routes
education_bp = Blueprint('education', __name__)

@education_bp.route("/education/topics/<topic_id>", methods=["GET"])
def get_topic_content(topic_id):
    """Get educational content for a specific topic"""
    try:
        # Fallback content for different topics
        fallback_content = {
            'budgeting': """
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
            """,
            'emergency-fund': """
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
            """,
            'debt-management': """
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
            """,
            'investing-101': """
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
            """
        }
        
        content = fallback_content.get(topic_id, f"# {topic_id.title()}\n\nContent coming soon...")
        
        return jsonify({
            "topic_id": topic_id,
            "content": content
        })
        
    except Exception as e:
        return handle_api_error(e, "Failed to get topic content") 