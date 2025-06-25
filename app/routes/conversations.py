from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from app.models import SessionLocal, Conversation, Message
from app.services.chat import get_chat_response
from app.utils.error_handlers import handle_api_error, validate_json_data

# Create blueprint for conversation routes
conversations_bp = Blueprint('conversations', __name__)

@conversations_bp.route("/conversations", methods=["POST"])
def create_conversation():
    """Create a new conversation"""
    try:
        data = validate_json_data(request)
        title = data.get("title", "New Chat")
        
        session = SessionLocal()
        try:
            conversation = Conversation(title=title)
            session.add(conversation)
            session.commit()
            session.refresh(conversation)
            
            return jsonify({
                "id": conversation.id,
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "tags": conversation.tags or []
            }), 201
        finally:
            session.close()
            
    except Exception as e:
        return handle_api_error(e, "Failed to create conversation")

@conversations_bp.route("/conversations", methods=["GET"])
def get_conversations():
    """Get all conversations with optional search"""
    try:
        search_query = request.args.get("q", "").strip()
        
        session = SessionLocal()
        try:
            query = session.query(Conversation)
            
            if search_query:
                # Search in title and tags
                query = query.filter(
                    Conversation.title.ilike(f"%{search_query}%") |
                    Conversation.tags.any(lambda tag: search_query.lower() in tag.lower())
                )
            
            conversations = query.order_by(Conversation.created_at.desc()).all()
            
            return jsonify([{
                "id": conv.id,
                "title": conv.title,
                "created_at": conv.created_at.isoformat(),
                "tags": conv.tags or [],
                "message_count": len(conv.messages)
            } for conv in conversations])
        finally:
            session.close()
            
    except Exception as e:
        return handle_api_error(e, "Failed to fetch conversations")

@conversations_bp.route("/conversations/<int:conversation_id>", methods=["GET"])
def get_conversation(conversation_id):
    """Get a specific conversation with its messages"""
    try:
        session = SessionLocal()
        try:
            conversation = session.query(Conversation).get(conversation_id)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
            
            messages = session.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
            
            return jsonify({
                "id": conversation.id,
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "tags": conversation.tags or [],
                "messages": [{
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat()
                } for msg in messages]
            })
        finally:
            session.close()
            
    except Exception as e:
        return handle_api_error(e, "Failed to fetch conversation")

@conversations_bp.route("/conversations/<int:conversation_id>", methods=["POST"])
def send_message(conversation_id):
    """Send a message to a conversation"""
    try:
        data = validate_json_data(request)
        message_content = data.get("message", "").strip()
        
        if not message_content:
            return jsonify({"error": "Message content is required"}), 400
        
        session = SessionLocal()
        try:
            conversation = session.query(Conversation).get(conversation_id)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
            
            # Get AI response using the service
            try:
                ai_response, _ = get_chat_response(message_content, conversation_id)
                
                return jsonify({
                    "reply": ai_response,
                    "conversation_id": conversation_id
                })
                
            except Exception as ai_error:
                logging.error(f"AI response error: {ai_error}")
                return jsonify({"error": "Failed to get AI response"}), 500
                
        finally:
            session.close()
            
    except Exception as e:
        return handle_api_error(e, "Failed to send message")

@conversations_bp.route("/conversations/<int:conversation_id>/rename", methods=["POST"])
def rename_conversation(conversation_id):
    """Rename a conversation"""
    try:
        data = validate_json_data(request)
        new_title = data.get("title", "").strip()
        
        if not new_title:
            return jsonify({"error": "Title is required"}), 400
        
        session = SessionLocal()
        try:
            conversation = session.query(Conversation).get(conversation_id)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
            
            conversation.title = new_title
            session.commit()
            
            return jsonify({
                "id": conversation.id,
                "title": conversation.title,
                "message": "Conversation renamed successfully"
            })
        finally:
            session.close()
            
    except Exception as e:
        return handle_api_error(e, "Failed to rename conversation")

@conversations_bp.route("/conversations/<int:conversation_id>/auto_rename", methods=["POST"])
def auto_rename_conversation(conversation_id):
    """Auto-rename conversation based on content"""
    try:
        session = SessionLocal()
        try:
            conversation = session.query(Conversation).get(conversation_id)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
            
            # Get recent messages for context
            recent_messages = session.query(Message).filter_by(
                conversation_id=conversation_id
            ).order_by(Message.timestamp.desc()).limit(5).all()
            
            if not recent_messages:
                return jsonify({"error": "No messages found"}), 400

            # Create context for AI to generate title
            context = "\n".join([str(msg.content) for msg in reversed(recent_messages)])
            prompt = f"Based on this conversation, generate a short, descriptive title (max 50 characters):\n\n{context}"
            
            try:
                from openai import OpenAI
                import os
                
                client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=20
                )

                message_content = response.choices[0].message.content if response.choices and response.choices[0].message and response.choices[0].message.content else ""
                new_title = message_content.strip().strip('"').strip("'")
                if len(new_title) > 50:
                    new_title = new_title[:47] + "..."

                conversation.title = new_title
                session.commit()
                
                return jsonify({
                    "id": conversation.id,
                    "title": conversation.title,
                    "message": "Conversation auto-renamed successfully"
                })
                
            except Exception as ai_error:
                logging.error(f"AI auto-rename error: {ai_error}")
                return jsonify({"error": "Failed to auto-rename conversation"}), 500
                
        finally:
            session.close()
            
    except Exception as e:
        return handle_api_error(e, "Failed to auto-rename conversation")

@conversations_bp.route("/conversations/<int:conversation_id>/tags", methods=["PATCH"])
def update_tags(conversation_id):
    """Update conversation tags"""
    try:
        data = validate_json_data(request)
        tags = data.get("tags", [])
        
        if not isinstance(tags, list):
            return jsonify({"error": "Tags must be a list"}), 400
        
        session = SessionLocal()
        try:
            conversation = session.query(Conversation).get(conversation_id)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
            
            conversation.tags = tags
            session.commit()
            
            return jsonify({
                "id": conversation.id,
                "tags": conversation.tags,
                "message": "Tags updated successfully"
            })
        finally:
            session.close()
            
    except Exception as e:
        return handle_api_error(e, "Failed to update tags")

@conversations_bp.route("/conversations/<int:conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """Delete a conversation"""
    try:
        session = SessionLocal()
        try:
            conversation = session.query(Conversation).get(conversation_id)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
            
            session.delete(conversation)
            session.commit()
            
            return jsonify({"message": "Conversation deleted successfully"})
        finally:
            session.close()
            
    except Exception as e:
        return handle_api_error(e, "Failed to delete conversation") 