from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func
from app.models_base import Conversation, Message
from app.utils.database import get_db_session
from app.utils.error_handlers import handle_api_error

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route("/dashboard/stats", methods=["GET"])
def get_dashboard_stats():
    """Get dashboard statistics"""
    try:
        with get_db_session() as session:
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
            
            # Get recent activity
            recent_activity = []
            recent_conversations = session.query(Conversation).order_by(
                Conversation.created_at.desc()
            ).limit(5).all()
            
            for conv in recent_conversations:
                recent_activity.append({
                    "type": "conversation",
                    "id": conv.id,
                    "title": conv.title,
                    "timestamp": conv.created_at.isoformat()
                })
            
            return jsonify({
                "total_conversations": total_conversations,
                "total_messages": total_messages,
                "recent_activity": recent_activity
            })
            
    except Exception as e:
        return handle_api_error(e, "Failed to fetch dashboard stats")

@dashboard_bp.route("/dashboard/analytics", methods=["GET"])
def get_conversation_analytics():
    """Get conversation analytics"""
    try:
        with get_db_session() as session:
            # Get current date and 6 months ago
            now = datetime.now()
            six_months_ago = now - timedelta(days=180)
            
            # Get conversations by month (last 6 months)
            conversations_by_month = []
            for i in range(6):
                month_start = (now - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
                
                count = session.query(Conversation).filter(
                    Conversation.created_at >= month_start,
                    Conversation.created_at <= month_end
                ).count()
                
                conversations_by_month.append({
                    "month": month_start.strftime("%Y-%m"),
                    "count": count
                })
            
            # Get messages by month (last 6 months)
            messages_by_month = []
            for i in range(6):
                month_start = (now - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
                month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
                
                count = session.query(Message).filter(
                    Message.timestamp >= month_start,
                    Message.timestamp <= month_end
                ).count()
                
                messages_by_month.append({
                    "month": month_start.strftime("%Y-%m"),
                    "count": count
                })
            
            # Mock popular topics (in a real app, this would analyze message content)
            popular_topics = [
                {"topic": "Retirement Planning", "count": 15},
                {"topic": "Investment Advice", "count": 12},
                {"topic": "Budgeting", "count": 8},
                {"topic": "Tax Planning", "count": 6},
                {"topic": "Debt Management", "count": 4}
            ]
            
            return jsonify({
                "conversations_by_month": conversations_by_month,
                "messages_by_month": messages_by_month,
                "popular_topics": popular_topics
            })
            
    except Exception as e:
        return handle_api_error(e, "Failed to fetch conversation analytics")

@dashboard_bp.route("/dashboard", methods=["GET"])
def get_dashboard_data():
    """Get dashboard overview data"""
    try:
        with get_db_session() as session:
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
        return handle_api_error(e, "Failed to fetch dashboard data") 