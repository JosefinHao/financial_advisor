from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import logging
import os
import openai
import json
import math
from sqlalchemy.orm import selectinload
import PyPDF2
from werkzeug.utils import secure_filename
import io
import base64

# Import your models and services
try:
    from app.models import SessionLocal, Conversation, Message
    from app.services.chat import get_chat_response
except ImportError as e:
    logging.error(f"Import error: {e}")
    # Fallback - you'll need to implement these if missing
    SessionLocal = None
    Conversation = None
    Message = None
    get_chat_response = None

# Setup
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Set OpenAI API key from environment variable
try:
    openai.api_key = os.getenv("OPENAI_API_KEY")
    if not openai.api_key:
        logging.warning("OPENAI_API_KEY environment variable not set")
except Exception as e:
    logging.error(f"Error setting OpenAI API key: {e}")

# Configuration
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "txt", "csv"}
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Financial Advisor System Prompt
FINANCIAL_ADVISOR_PROMPT = """You are Alex, a professional and knowledgeable financial advisor with over 15 years of experience. Your role is to provide personalized financial guidance, investment advice, and help users make informed decisions about their money.

Key responsibilities:
- Provide clear, actionable financial advice tailored to the user's situation
- Help with budgeting, saving strategies, investment planning, and debt management
- Explain complex financial concepts in simple terms
- Ask clarifying questions to better understand the user's financial goals and risk tolerance
- Offer multiple options and explain pros/cons of different financial strategies
- Stay current with market trends and economic conditions
- Help analyze financial documents and statements
- Provide goal tracking and progress monitoring advice

Important guidelines:
- Always emphasize that your advice is educational and users should consult with licensed professionals for major financial decisions
- Be empathetic and non-judgmental about financial mistakes or challenges
- Focus on long-term financial health and sustainable practices
- Ask about the user's age, income, goals, and risk tolerance when relevant
- Provide specific, actionable steps rather than generic advice
- Be honest about risks and potential downsides of any recommendations

Communication style:
- Professional yet approachable and friendly
- Use clear, jargon-free language
- Provide examples and analogies when explaining concepts
- Be encouraging and supportive while being realistic about challenges
"""


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def check_dependencies():
    """Check if required dependencies are available"""
    missing_deps = []

    if not SessionLocal:
        missing_deps.append("SessionLocal (database session)")
    if not Conversation:
        missing_deps.append("Conversation model")
    if not Message:
        missing_deps.append("Message model")
    if not openai.api_key:
        missing_deps.append("OpenAI API key")

    return missing_deps


@app.route("/ping", methods=["GET"])
def ping():
    missing_deps = check_dependencies()
    if missing_deps:
        return (
            jsonify(
                {
                    "status": "warning",
                    "message": f"Missing dependencies: {', '.join(missing_deps)}",
                }
            ),
            200,
        )
    return jsonify({"status": "ok"})


@app.route("/health", methods=["GET"])
def health():
    """Detailed health check"""
    health_status = {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "database": "unknown",
        "openai": "unknown",
        "issues": [],
    }

    # Check database
    if SessionLocal:
        try:
            session = SessionLocal()
            session.close()
            health_status["database"] = "connected"
        except Exception as e:
            health_status["database"] = "error"
            health_status["issues"].append(f"Database error: {str(e)}")
    else:
        health_status["database"] = "not_configured"
        health_status["issues"].append("Database models not imported")

    # Check OpenAI
    if openai.api_key:
        health_status["openai"] = "configured"
    else:
        health_status["openai"] = "not_configured"
        health_status["issues"].append("OpenAI API key not set")

    if health_status["issues"]:
        health_status["status"] = "degraded"

    return jsonify(health_status)


@app.route("/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        message = data.get("message")
        conversation_id = data.get("conversation_id")
        tags = data.get("tags", [])  # No automatic tags added

        if not message:
            return jsonify({"error": "No message provided"}), 400

        # Check if dependencies are available
        missing_deps = check_dependencies()
        if missing_deps:
            return (
                jsonify(
                    {
                        "error": "Service temporarily unavailable",
                        "details": f"Missing: {', '.join(missing_deps)}",
                    }
                ),
                503,
            )

        # Enhanced financial advisor response with context
        reply, new_conversation_id = get_financial_advisor_response(
            user_message=message, conversation_id=conversation_id, tags=tags
        )

        return jsonify(
            {
                "conversation_id": new_conversation_id,
                "reply": reply,
                "messages": [
                    {"role": "user", "content": message},
                    {"role": "assistant", "content": reply},
                ],
            }
        )
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        app.logger.error(f"Error in /chat: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


def get_financial_advisor_response(user_message, conversation_id=None, tags=None):
    """Enhanced chat response function specifically for financial advice"""
    if not SessionLocal or not Conversation or not Message:
        raise Exception("Database models not available")

    if not openai.api_key:
        raise Exception("OpenAI API key not configured")

    session = SessionLocal()
    try:
        # Get or create conversation
        if conversation_id:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                raise ValueError("Conversation not found")
        else:
            conversation = Conversation(
                title="Financial Consultation",
                tags=tags or [],  # No default tags
                created_at=datetime.now(),
            )
            session.add(conversation)
            session.flush()

        # Build conversation history with financial context
        messages = [{"role": "system", "content": FINANCIAL_ADVISOR_PROMPT}]

        # Add conversation history
        for msg in conversation.messages:
            messages.append({"role": msg.role, "content": msg.content})

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        # Get response from OpenAI with financial advisor context
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
            )
            assistant_reply = response.choices[0].message.content
        except Exception as e:
            app.logger.error(f"OpenAI API error: {e}")
            assistant_reply = "I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment."

        # Save messages to database
        user_msg = Message(
            conversation_id=conversation.id,
            role="user",
            content=user_message,
            timestamp=datetime.now(),
        )
        assistant_msg = Message(
            conversation_id=conversation.id,
            role="assistant",
            content=assistant_reply,
            timestamp=datetime.now(),
        )

        session.add(user_msg)
        session.add(assistant_msg)
        session.commit()

        return assistant_reply, conversation.id

    except Exception as e:
        session.rollback()
        raise e
    finally:
        session.close()


@app.route("/financial-profile", methods=["POST"])
def create_financial_profile():
    """Create a financial profile to personalize advice"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        conversation_id = data.get("conversation_id")

        profile_data = {
            "age": data.get("age"),
            "income": data.get("income"),
            "savings": data.get("savings"),
            "debt": data.get("debt"),
            "goals": data.get("goals", []),
            "risk_tolerance": data.get("risk_tolerance"),
            "investment_experience": data.get("investment_experience"),
        }

        # Validate required fields
        if not profile_data["age"] or not profile_data["income"]:
            return jsonify({"error": "Age and income are required"}), 400

        # Create a structured profile message
        profile_message = f"""
        Financial Profile Update:
        - Age: {profile_data['age']}
        - Annual Income: ${profile_data['income']:,} 
        - Current Savings: ${profile_data['savings'] or 0:,}
        - Current Debt: ${profile_data['debt'] or 0:,}
        - Financial Goals: {', '.join(profile_data['goals']) if profile_data['goals'] else 'Not specified'}
        - Risk Tolerance: {profile_data['risk_tolerance'] or 'Not specified'}
        - Investment Experience: {profile_data['investment_experience'] or 'Not specified'}
        
        Please provide personalized financial recommendations based on this profile.
        """

        reply, cid = get_financial_advisor_response(
            user_message=profile_message,
            conversation_id=conversation_id,
            tags=["financial-profile", "personalized-advice"],
        )

        return jsonify({"conversation_id": cid, "reply": reply, "profile_saved": True})
    except Exception as e:
        app.logger.error(f"Error creating financial profile: {e}")
        return jsonify({"error": "Failed to create profile", "details": str(e)}), 500


@app.route("/market-update", methods=["GET"])
def get_market_update():
    """Get current market insights and how they might affect financial planning"""
    try:
        if not openai.api_key:
            return jsonify({"error": "Market update service unavailable"}), 503

        market_prompt = """Provide a brief market update focusing on:
        1. Current major market trends
        2. How these trends might affect personal financial planning
        3. Any actionable advice for retail investors
        Keep it concise and practical for someone managing their personal finances."""

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": FINANCIAL_ADVISOR_PROMPT},
                {"role": "user", "content": market_prompt},
            ],
            temperature=0.3,
            max_tokens=500,
        )

        return jsonify(
            {
                "market_update": response.choices[0].message.content,
                "timestamp": datetime.now().isoformat(),
            }
        )
    except Exception as e:
        app.logger.error(f"Error getting market update: {e}")
        return jsonify({"error": "Failed to get market update", "details": str(e)}), 500


# ===============================
# FINANCIAL CALCULATORS (with better error handling)
# ===============================


@app.route("/calculators/retirement", methods=["POST"])
def retirement_calculator():
    """Calculate retirement savings projections"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        current_age = data.get("current_age")
        retirement_age = data.get("retirement_age", 65)
        current_savings = data.get("current_savings", 0)
        monthly_contribution = data.get("monthly_contribution", 0)
        annual_return = data.get("annual_return", 0.07)  # 7% default

        # Validation
        if not current_age or current_age <= 0:
            return jsonify({"error": "Valid current age is required"}), 400
        if retirement_age <= current_age:
            return (
                jsonify({"error": "Retirement age must be greater than current age"}),
                400,
            )
        if current_savings < 0 or monthly_contribution < 0:
            return (
                jsonify({"error": "Savings and contributions cannot be negative"}),
                400,
            )
        if annual_return < 0 or annual_return > 1:
            return jsonify({"error": "Annual return must be between 0 and 100%"}), 400

        years_to_retirement = retirement_age - current_age
        monthly_return = annual_return / 12
        total_months = years_to_retirement * 12

        # Future Value of current savings
        fv_current = current_savings * ((1 + annual_return) ** years_to_retirement)

        # Future Value of monthly contributions (annuity)
        if monthly_contribution > 0 and monthly_return > 0:
            fv_contributions = monthly_contribution * (
                ((1 + monthly_return) ** total_months - 1) / monthly_return
            )
        else:
            fv_contributions = monthly_contribution * total_months

        total_retirement_savings = fv_current + fv_contributions

        # 4% withdrawal rule for annual retirement income
        annual_retirement_income = total_retirement_savings * 0.04
        monthly_retirement_income = annual_retirement_income / 12

        result = {
            "years_to_retirement": years_to_retirement,
            "total_retirement_savings": round(total_retirement_savings, 2),
            "annual_retirement_income": round(annual_retirement_income, 2),
            "monthly_retirement_income": round(monthly_retirement_income, 2),
            "total_contributions": round(monthly_contribution * total_months, 2),
            "growth_from_current_savings": round(fv_current, 2),
            "growth_from_contributions": round(fv_contributions, 2),
        }

        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Error in retirement calculator: {e}")
        return jsonify({"error": "Calculation failed", "details": str(e)}), 500


@app.route("/calculators/mortgage", methods=["POST"])
def mortgage_calculator():
    """Calculate mortgage payments and amortization"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        loan_amount = data.get("loan_amount")
        interest_rate = data.get("interest_rate")  # Annual rate as percentage
        loan_term_years = data.get("loan_term_years", 30)

        # Validation
        if not loan_amount or loan_amount <= 0:
            return jsonify({"error": "Valid loan amount is required"}), 400
        if interest_rate is None or interest_rate < 0:
            return jsonify({"error": "Valid interest rate is required"}), 400
        if not loan_term_years or loan_term_years <= 0:
            return jsonify({"error": "Valid loan term is required"}), 400

        # Convert to monthly values
        monthly_rate = (interest_rate / 100) / 12
        num_payments = loan_term_years * 12

        # Monthly payment calculation
        if monthly_rate > 0:
            monthly_payment = (
                loan_amount
                * (monthly_rate * (1 + monthly_rate) ** num_payments)
                / ((1 + monthly_rate) ** num_payments - 1)
            )
        else:
            monthly_payment = loan_amount / num_payments

        total_paid = monthly_payment * num_payments
        total_interest = total_paid - loan_amount

        result = {
            "monthly_payment": round(monthly_payment, 2),
            "total_interest": round(total_interest, 2),
            "total_paid": round(total_paid, 2),
            "loan_amount": loan_amount,
            "interest_rate": interest_rate,
            "loan_term_years": loan_term_years,
        }

        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Error in mortgage calculator: {e}")
        return jsonify({"error": "Calculation failed", "details": str(e)}), 500


@app.route("/calculators/compound-interest", methods=["POST"])
def compound_interest_calculator():
    """Calculate compound interest growth"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        principal = data.get("principal")
        annual_rate = data.get("annual_rate")  # As percentage
        years = data.get("years")
        monthly_contribution = data.get("monthly_contribution", 0)
        compound_frequency = data.get("compound_frequency", 12)  # Monthly by default

        # Validation
        if not principal or principal <= 0:
            return jsonify({"error": "Valid principal amount is required"}), 400
        if annual_rate is None or annual_rate < 0:
            return jsonify({"error": "Valid annual rate is required"}), 400
        if not years or years <= 0:
            return jsonify({"error": "Valid number of years is required"}), 400
        if monthly_contribution < 0:
            return jsonify({"error": "Monthly contribution cannot be negative"}), 400

        rate = annual_rate / 100

        # Compound interest on principal
        final_principal = principal * (1 + rate / compound_frequency) ** (
            compound_frequency * years
        )

        # Future value of monthly contributions
        if monthly_contribution > 0:
            monthly_rate = rate / 12
            total_months = years * 12
            if monthly_rate > 0:
                fv_contributions = monthly_contribution * (
                    ((1 + monthly_rate) ** total_months - 1) / monthly_rate
                )
            else:
                fv_contributions = monthly_contribution * total_months
        else:
            fv_contributions = 0

        total_amount = final_principal + fv_contributions
        total_contributions = monthly_contribution * years * 12
        total_interest = total_amount - principal - total_contributions

        result = {
            "final_amount": round(total_amount, 2),
            "total_interest_earned": round(total_interest, 2),
            "principal": principal,
            "total_contributions": round(total_contributions, 2),
            "years": years,
            "annual_rate": annual_rate,
        }

        return jsonify(result)

    except Exception as e:
        app.logger.error(f"Error in compound interest calculator: {e}")
        return jsonify({"error": "Calculation failed", "details": str(e)}), 500


# ===============================
# GOALS AND REMINDERS (with better error handling)
# ===============================


@app.route("/goals", methods=["POST"])
def create_goal():
    """Create a new financial goal"""
    try:
        if not SessionLocal or not Conversation:
            return jsonify({"error": "Database service unavailable"}), 503

        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        goal_data = {
            "name": data.get("name"),
            "target_amount": data.get("target_amount"),
            "current_amount": data.get("current_amount", 0),
            "target_date": data.get("target_date"),
            "monthly_contribution": data.get("monthly_contribution", 0),
            "priority": data.get("priority", "medium"),
            "category": data.get("category", "general"),
            "created_at": datetime.now().isoformat(),
        }

        # Validation
        if not goal_data["name"]:
            return jsonify({"error": "Goal name is required"}), 400
        if not goal_data["target_amount"] or goal_data["target_amount"] <= 0:
            return jsonify({"error": "Valid target amount is required"}), 400
        if not goal_data["target_date"]:
            return jsonify({"error": "Target date is required"}), 400
        if goal_data["current_amount"] < 0 or goal_data["monthly_contribution"] < 0:
            return jsonify({"error": "Amounts cannot be negative"}), 400

        # Calculate progress and projections
        progress_percentage = (
            goal_data["current_amount"] / goal_data["target_amount"]
        ) * 100
        remaining_amount = goal_data["target_amount"] - goal_data["current_amount"]

        # Calculate months to target date
        try:
            target_date = datetime.fromisoformat(
                goal_data["target_date"].replace("Z", "+00:00")
            )
            months_remaining = max(1, (target_date - datetime.now()).days / 30.44)
        except ValueError:
            return jsonify({"error": "Invalid target date format"}), 400

        # Calculate required monthly savings
        required_monthly = (
            remaining_amount / months_remaining if months_remaining > 0 else 0
        )

        goal_data.update(
            {
                "id": abs(
                    hash(goal_data["name"] + str(datetime.now()))
                ),  # Simple ID generation
                "progress_percentage": round(progress_percentage, 2),
                "remaining_amount": remaining_amount,
                "months_remaining": round(months_remaining, 1),
                "required_monthly_saving": round(required_monthly, 2),
                "on_track": goal_data["monthly_contribution"] >= required_monthly,
            }
        )

        # Store in database
        session = SessionLocal()
        try:
            conversation = Conversation(
                title=f"Goal: {goal_data['name']}",
                tags=["financial-goal", goal_data["category"]],
                created_at=datetime.now(),
                metadata=json.dumps(goal_data),
            )
            session.add(conversation)
            session.commit()
            goal_data["conversation_id"] = conversation.id
        finally:
            session.close()

        return jsonify(goal_data)

    except Exception as e:
        app.logger.error(f"Error creating goal: {e}")
        return jsonify({"error": "Failed to create goal", "details": str(e)}), 500


@app.route("/goals", methods=["GET"])
def get_goals():
    """Get all financial goals"""
    try:
        if not SessionLocal or not Conversation:
            return jsonify({"error": "Database service unavailable"}), 503

        session = SessionLocal()
        try:
            goal_conversations = (
                session.query(Conversation)
                .filter(Conversation.tags.ilike("%financial-goal%"))
                .all()
            )

            goals = []
            for conv in goal_conversations:
                if conv.metadata:
                    try:
                        goal_data = json.loads(conv.metadata)
                        goal_data["conversation_id"] = conv.id
                        goals.append(goal_data)
                    except json.JSONDecodeError as e:
                        app.logger.warning(
                            f"Invalid goal metadata for conversation {conv.id}: {e}"
                        )
                        continue

            return jsonify(goals)

        finally:
            session.close()

    except Exception as e:
        app.logger.error(f"Error getting goals: {e}")
        return jsonify({"error": "Failed to retrieve goals", "details": str(e)}), 500


# ===============================
# EXISTING ROUTES (with better error handling)
# ===============================
@app.route("/conversations", methods=["POST"])
def create_conversation():
    """Create a new conversation"""
    try:
        if not SessionLocal or not Conversation:
            return jsonify({"error": "Database service unavailable"}), 503

        data = request.get_json()
        if not data:
            data = {}  # Allow empty requests for new conversations

        title = data.get("title", "New Financial Consultation")
        tags = data.get("tags", [])

        # Validate tags if provided
        if tags and not isinstance(tags, list):
            return jsonify({"error": "Tags must be a list"}), 400

        # Clean up tags - remove empty strings and whitespace
        tags_clean = (
            [tag.strip() for tag in tags if tag and tag.strip()] if tags else []
        )

        session = SessionLocal()
        try:
            # Create new conversation
            new_conversation = Conversation(
                title=title, tags=tags_clean, created_at=datetime.now()
            )

            session.add(new_conversation)
            session.commit()

            # Return the created conversation
            response_data = {
                "id": new_conversation.id,
                "title": new_conversation.title,
                "created_at": new_conversation.created_at.isoformat(),
                "tags": new_conversation.tags or [],
                "messages": [],  # New conversation has no messages yet
            }

            return jsonify(response_data), 201

        except Exception as e:
            session.rollback()
            app.logger.error(f"Database error creating conversation: {e}")
            return (
                jsonify(
                    {
                        "error": "Failed to create conversation in database",
                        "details": str(e),
                    }
                ),
                500,
            )
        finally:
            session.close()

    except Exception as e:
        app.logger.error(f"Error creating conversation: {e}")
        return (
            jsonify({"error": "Failed to create conversation", "details": str(e)}),
            500,
        )


@app.route("/conversations", methods=["GET"])
def get_conversations():
    try:
        if not SessionLocal or not Conversation:
            return jsonify({"error": "Database service unavailable"}), 503

        tag_filter = request.args.get("tag")
        page = int(request.args.get("page", 1))
        limit = min(
            int(request.args.get("limit", 20)), 100
        )  # Cap limit to prevent abuse
        offset = (page - 1) * limit

        session = SessionLocal()
        try:
            query = session.query(Conversation).options(
                selectinload(Conversation.messages)
            )

            if tag_filter:
                query = query.filter(Conversation.tags.ilike(f"%{tag_filter.lower()}%"))

            conversations = (
                query.order_by(Conversation.created_at.desc())
                .offset(offset)
                .limit(limit)
                .all()
            )

            return jsonify(
                [
                    {
                        "id": c.id,
                        "title": c.title or "Consultation",
                        "created_at": c.created_at.isoformat(),
                        "tags": c.tags if c.tags else [],  # No default tags
                        "messages": [
                            {
                                "role": m.role,
                                "content": m.content,
                                "timestamp": m.timestamp.isoformat(),
                            }
                            for m in sorted(c.messages, key=lambda m: m.timestamp)
                        ],
                    }
                    for c in conversations
                ]
            )
        finally:
            session.close()
    except Exception as e:
        app.logger.error(f"Error getting conversations: {e}")
        return (
            jsonify({"error": "Failed to retrieve conversations", "details": str(e)}),
            500,
        )


@app.route("/conversations/<int:cid>", methods=["GET"])
def get_conversation(cid):
    try:
        if not SessionLocal or not Conversation:
            return jsonify({"error": "Database service unavailable"}), 503

        session = SessionLocal()
        try:
            # UPDATED: Use session.get() instead of session.query().get()
            conversation = session.get(Conversation, cid)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404

            # Load messages relationship explicitly if needed
            messages = (
                session.query(Message)
                .filter(Message.conversation_id == cid)
                .order_by(Message.timestamp)
                .all()
            )

            return jsonify(
                {
                    "id": conversation.id,
                    "title": conversation.title or "Consultation",
                    "created_at": conversation.created_at.isoformat(),
                    "tags": conversation.tags or [],
                    "messages": [
                        {
                            "role": m.role,
                            "content": m.content,
                            "timestamp": m.timestamp.isoformat(),
                        }
                        for m in messages
                    ],
                }
            )
        finally:
            session.close()
    except Exception as e:
        app.logger.error(f"Error getting conversation {cid}: {e}")
        return (
            jsonify({"error": "Failed to retrieve conversation", "details": str(e)}),
            500,
        )


@app.route("/conversations/<int:cid>/rename", methods=["POST"])
def rename_conversation(cid):
    session = SessionLocal()
    try:
        data = request.json
        title = data.get("title")
        # UPDATED: Use session.get() instead of session.get()
        conversation = session.get(Conversation, cid)
        if conversation and title:
            conversation.title = title
            session.commit()
            return jsonify({"status": "success"})
        return jsonify({"error": "Invalid input"}), 400
    except Exception as e:
        session.rollback()
        app.logger.error(f"Error renaming conversation: {e}")
        return jsonify({"error": "Failed to rename conversation"}), 500
    finally:
        session.close()


@app.route("/conversations/<int:cid>/tags", methods=["PATCH"])
def update_tags(cid):
    session = SessionLocal()
    try:
        data = request.get_json()
        tags = data.get("tags", [])

        if not isinstance(tags, list):
            return jsonify({"error": "Tags must be a list"}), 400

        # Clean up tags
        tags_clean = [tag.strip() for tag in tags if tag.strip()]

        # UPDATED: Use session.get() instead of session.get()
        conversation = session.get(Conversation, cid)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404

        conversation.tags = tags_clean
        session.commit()

        return jsonify({"success": True, "tags": conversation.tags})
    except Exception as e:
        session.rollback()
        app.logger.error(f"Error updating tags: {e}")
        return jsonify({"error": "Failed to update tags"}), 500
    finally:
        session.close()


@app.route("/conversations/<int:cid>", methods=["DELETE"])
def delete_conversation(cid):
    session = SessionLocal()
    try:
        # UPDATED: Use session.get() instead of session.get()
        conversation = session.get(Conversation, cid)
        if conversation:
            session.delete(conversation)
            session.commit()
            return jsonify({"status": "deleted"})
        return jsonify({"error": "Not found"}), 404
    except Exception as e:
        session.rollback()
        app.logger.error(f"Error deleting conversation: {e}")
        return jsonify({"error": "Failed to delete conversation"}), 500
    finally:
        session.close()


@app.route("/search")
def search():
    query = request.args.get("q", "")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    offset = (page - 1) * limit

    session = SessionLocal()
    try:
        if not query:
            conversations = (
                session.query(Conversation)
                .order_by(Conversation.created_at.desc())
                .offset(offset)
                .limit(limit)
                .all()
            )
        else:
            conversations = (
                session.query(Conversation)
                .join(Message)
                .filter(Message.content.ilike(f"%{query}%"))
                .distinct()
                .order_by(Conversation.created_at.desc())
                .offset(offset)
                .limit(limit)
                .all()
            )

        return jsonify(
            [
                {
                    "id": c.id,
                    "title": c.title or "Untitled",
                    "created_at": c.created_at.isoformat(),
                    "tags": c.tags or [],
                }
                for c in conversations
            ]
        )
    finally:
        session.close()


@app.route("/conversations/<int:conversation_id>/auto_rename", methods=["POST"])
def auto_rename_conversation(conversation_id):
    session = SessionLocal()
    try:
        # Check if dependencies are available
        if not SessionLocal or not Conversation or not Message:
            return jsonify({"error": "Database service unavailable"}), 503
            
        if not openai.api_key:
            return jsonify({"error": "OpenAI service unavailable"}), 503

        # Get the conversation
        conversation = session.get(Conversation, conversation_id)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404

        # Get messages explicitly (don't rely on lazy loading)
        messages = session.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.timestamp).all()
        
        if not messages:
            return jsonify({"error": "No messages found to generate title from"}), 400
        
        # Build conversation history
        history_parts = []
        for msg in messages:
            # Skip system messages for title generation
            if msg.role != "system":
                history_parts.append(f"{msg.role}: {msg.content}")
        
        if not history_parts:
            return jsonify({"error": "No user/assistant messages found"}), 400
            
        history_text = "\n".join(history_parts)
        # Limit to reasonable size for API
        short_history = history_text[:1500]  # Reduced from 2000 to be safer
        
        app.logger.info(f"Generating title for conversation {conversation_id} with {len(messages)} messages")
        app.logger.debug(f"History preview: {short_history[:200]}...")

        # Generate title using OpenAI
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that creates short, descriptive titles for financial advisor conversations. Create a SINGLE concise title (3-6 words) that captures the main topic or question discussed. Do not create lists, numbered items, or multiple titles. Return only one short phrase."
                    },
                    {
                        "role": "user", 
                        "content": f"Create a short title for this financial conversation:\n\n{short_history}"
                    }
                ],
                temperature=0.3,  # Lower temperature for more consistent titles
                max_tokens=50,    # Limit tokens since we just want a title
            )
            
            title = response.choices[0].message.content.strip()
            
            # Clean up the title (remove quotes if present)
            title = title.strip('"\'')
            
            # Ensure title isn't too long
            if len(title) > 100:
                title = title[:97] + "..."
                
        except openai.OpenAIError as e:
            app.logger.error(f"OpenAI API error: {e}")
            return jsonify({"error": "Failed to generate title", "details": str(e)}), 500
        except Exception as e:
            app.logger.error(f"Unexpected error calling OpenAI: {e}")
            return jsonify({"error": "Failed to generate title", "details": str(e)}), 500

        # Update conversation title
        old_title = conversation.title
        conversation.title = title
        session.commit()
        
        app.logger.info(f"Successfully renamed conversation {conversation_id} from '{old_title}' to '{title}'")
        
        return jsonify({
            "success": True, 
            "title": title,
            "old_title": old_title,
            "message_count": len(messages)
        })
        
    except Exception as e:
        session.rollback()
        app.logger.error(f"Error auto-renaming conversation {conversation_id}: {e}")
        return jsonify({"error": "Failed to auto-rename conversation", "details": str(e)}), 500
    finally:
        session.close()


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(error):
    app.logger.error(f"Internal server error: {error}")
    return jsonify({"error": "Internal server error"}), 500


@app.errorhandler(Exception)
def handle_unexpected_error(e):
    app.logger.error(f"Unhandled error: {e}")
    return jsonify({"error": "Internal server error", "details": str(e)}), 500


if __name__ == "__main__":
    # Check dependencies on startup
    missing_deps = check_dependencies()
    if missing_deps:
        print(f"WARNING: Missing dependencies: {', '.join(missing_deps)}")
        print("Some features may not work properly.")

    app.run(debug=True)
