from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models import SessionLocal, Conversation, Message

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route("/dashboard", methods=["GET"])
def get_dashboard_data():
    """Get dashboard overview data"""
    try:
        session = SessionLocal()
        
        # Get current date and 7 days ago
        now = datetime.now()
        seven_days_ago = now - timedelta(days=7)
        
        # Get conversations count
        total_conversations = session.query(Conversation).count()
        conversations_7_days = session.query(Conversation).filter(
            Conversation.created_at >= seven_days_ago
        ).count()
        
        # Get messages count
        total_messages = session.query(Message).count()
        messages_7_days = session.query(Message).filter(
            Message.timestamp >= seven_days_ago
        ).count()
        
        # Mock data for features not yet implemented
        mock_data = {
            "goals": {
                "total": 5,
                "on_track": 3,
                "total_target_amount": 50000,
                "average_progress": 65.2
            },
            "reminders": {
                "upcoming_7_days": 3,
                "overdue": 1,
                "total_active": 8
            },
            "recent_activity": {
                "conversations_7_days": conversations_7_days,
                "messages_7_days": messages_7_days,
                "documents_uploaded": 2
            },
            "recent_goals": [
                {
                    "id": 1,
                    "name": "Emergency Fund",
                    "category": "Savings",
                    "progress_percentage": 75.0,
                    "deadline": (now + timedelta(days=30)).isoformat()
                },
                {
                    "id": 2,
                    "name": "Vacation Fund",
                    "category": "Travel",
                    "progress_percentage": 45.0,
                    "deadline": (now + timedelta(days=90)).isoformat()
                },
                {
                    "id": 3,
                    "name": "Home Down Payment",
                    "category": "Housing",
                    "progress_percentage": 25.0,
                    "deadline": (now + timedelta(days=365)).isoformat()
                }
            ],
            "upcoming_reminders": [
                {
                    "id": 1,
                    "title": "Pay Credit Card Bill",
                    "description": "Due date for Chase credit card payment",
                    "reminder_datetime": (now + timedelta(days=2)).isoformat(),
                    "type": "Payment",
                    "priority": "High"
                },
                {
                    "id": 2,
                    "title": "Review Investment Portfolio",
                    "description": "Monthly portfolio review and rebalancing",
                    "reminder_datetime": (now + timedelta(days=5)).isoformat(),
                    "type": "Review",
                    "priority": "Medium"
                },
                {
                    "id": 3,
                    "title": "Tax Filing Deadline",
                    "description": "Submit quarterly tax payment",
                    "reminder_datetime": (now + timedelta(days=7)).isoformat(),
                    "type": "Tax",
                    "priority": "High"
                }
            ]
        }
        
        return jsonify(mock_data)
        
    except Exception as e:
        return jsonify({
            "error": "Failed to fetch dashboard data",
            "message": str(e)
        }), 500
        
    finally:
        session.close() 