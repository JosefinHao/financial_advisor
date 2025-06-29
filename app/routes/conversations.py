from flask import Blueprint, request, jsonify
import logging
from datetime import datetime
from openai import OpenAI
import os

from app.models import Conversation, Message
from app.utils.error_handlers import (
    handle_api_error, 
    create_error_response, 
    APIError, 
    NotFoundError, 
    ValidationError,
    ErrorType, 
    ErrorSeverity
)
from app.utils.database import get_db_session
from app.services.chat import get_chat_response
from app.utils import validate_json_data

# Create blueprint
conversations_bp = Blueprint('conversations', __name__)

@conversations_bp.route("/conversations", methods=["POST"])
def create_conversation():
    """Create a new conversation"""
    try:
        data = validate_json_data(request)
        title = data.get("title", "New Conversation").strip()
        
        if not title:
            validation_error = ValidationError(
                "Title is required",
                field="title"
            )
            return create_error_response(validation_error)
        
        with get_db_session() as session:
            conversation = Conversation(
                title=title,
                created_at=datetime.utcnow(),
                tags=[]
            )
            session.add(conversation)
            session.commit()
            
            return jsonify({
                "id": conversation.id,
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "tags": conversation.tags
            }), 201
            
    except Exception as e:
        return handle_api_error(e, "Failed to create conversation")

@conversations_bp.route("/conversations", methods=["GET"])
def get_conversations():
    """Get all conversations"""
    try:
        with get_db_session() as session:
            conversations = session.query(Conversation).order_by(Conversation.created_at.desc()).all()
            
            return jsonify([{
                "id": conv.id,
                "title": conv.title,
                "created_at": conv.created_at.isoformat(),
                "tags": conv.tags
            } for conv in conversations])
            
    except Exception as e:
        return handle_api_error(e, "Failed to fetch conversations")

@conversations_bp.route("/conversations/<int:conversation_id>", methods=["GET"])
def get_conversation(conversation_id):
    """Get a specific conversation with its messages"""
    try:
        with get_db_session() as session:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                not_found_error = NotFoundError(
                    "Conversation not found",
                    resource_type="conversation"
                )
                return create_error_response(not_found_error)
            
            messages = session.query(Message).filter_by(conversation_id=conversation_id).order_by(Message.timestamp).all()
            
            return jsonify({
                "id": conversation.id,
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "tags": conversation.tags,
                "messages": [{
                    "id": msg.id,
                    "role": msg.role,
                    "content": msg.content,
                    "timestamp": msg.timestamp.isoformat()
                } for msg in messages]
            })
            
    except Exception as e:
        return handle_api_error(e, "Failed to fetch conversation")

@conversations_bp.route("/conversations/<int:conversation_id>", methods=["POST"])
def send_message(conversation_id):
    """Send a message to a conversation"""
    try:
        data = validate_json_data(request)
        message_content = data.get("message", "").strip()
        
        if not message_content:
            validation_error = ValidationError(
                "Message content is required",
                field="message"
            )
            return create_error_response(validation_error)
        
        with get_db_session() as session:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                not_found_error = NotFoundError(
                    "Conversation not found",
                    resource_type="conversation"
                )
                return create_error_response(not_found_error)
            
            # Get AI response using the service
            try:
                ai_response, _ = get_chat_response(message_content, conversation_id)
                
                return jsonify({
                    "reply": ai_response,
                    "conversation_id": conversation_id
                })
                
            except Exception as ai_error:
                logging.error(f"AI response error: {ai_error}")
                api_error = APIError(
                    "Failed to get AI response",
                    error_type=ErrorType.EXTERNAL_SERVICE_ERROR,
                    severity=ErrorSeverity.MEDIUM
                )
                return create_error_response(api_error)
            
    except Exception as e:
        return handle_api_error(e, "Failed to send message")

@conversations_bp.route("/conversations/<int:conversation_id>/rename", methods=["POST"])
def rename_conversation(conversation_id):
    """Rename a conversation"""
    try:
        data = validate_json_data(request)
        new_title = data.get("title", "").strip()
        
        if not new_title:
            validation_error = ValidationError(
                "Title is required",
                field="title"
            )
            return create_error_response(validation_error)
        
        with get_db_session() as session:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                not_found_error = NotFoundError(
                    "Conversation not found",
                    resource_type="conversation"
                )
                return create_error_response(not_found_error)
            
            conversation.title = new_title
            
            return jsonify({
                "id": conversation.id,
                "title": conversation.title,
                "message": "Conversation renamed successfully"
            })
            
    except Exception as e:
        return handle_api_error(e, "Failed to rename conversation")

@conversations_bp.route("/conversations/<int:conversation_id>/auto_rename", methods=["POST"])
def auto_rename_conversation(conversation_id):
    """Auto-rename conversation based on content"""
    try:
        with get_db_session() as session:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                not_found_error = NotFoundError(
                    "Conversation not found",
                    resource_type="conversation"
                )
                return create_error_response(not_found_error)
            
            # Get recent messages for context
            recent_messages = session.query(Message).filter_by(
                conversation_id=conversation_id
            ).order_by(Message.timestamp.desc()).limit(5).all()
            
            if not recent_messages:
                validation_error = ValidationError(
                    "No messages found",
                    field="messages"
                )
                return create_error_response(validation_error)

            # Create context for AI to generate title
            context = "\n".join([str(msg.content) for msg in reversed(recent_messages)])
            prompt = f"Based on this conversation, generate a short, descriptive title (max 50 characters):\n\n{context}"
            
            try:
                client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=20
                )
                message_content = response.choices[0].message.content if response.choices and response.choices[0].message.content else ""
                new_title = message_content.strip().strip('"').strip("'")
                if len(new_title) > 50:
                    new_title = new_title[:50]

                # Update the conversation title
                conversation.title = new_title
                session.commit()
                
                return jsonify({
                    "id": conversation.id,
                    "title": conversation.title,
                    "message": "Conversation auto-renamed successfully"
                })
                
            except Exception as ai_error:
                logging.error(f"AI auto-rename error: {ai_error}")
                api_error = APIError(
                    "Failed to auto-rename conversation",
                    error_type=ErrorType.EXTERNAL_SERVICE_ERROR,
                    severity=ErrorSeverity.MEDIUM
                )
                return create_error_response(api_error)
            
    except Exception as e:
        return handle_api_error(e, "Failed to auto-rename conversation")

@conversations_bp.route("/conversations/<int:conversation_id>/tags", methods=["PATCH"])
def update_tags(conversation_id):
    """Update conversation tags"""
    try:
        data = validate_json_data(request)
        tags = data.get("tags", [])
        
        if not isinstance(tags, list):
            validation_error = ValidationError(
                "Tags must be a list",
                field="tags"
            )
            return create_error_response(validation_error)
        
        with get_db_session() as session:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                not_found_error = NotFoundError(
                    "Conversation not found",
                    resource_type="conversation"
                )
                return create_error_response(not_found_error)
            
            conversation.tags = tags
            
            return jsonify({
                "id": conversation.id,
                "tags": conversation.tags,
                "message": "Tags updated successfully"
            })
            
    except Exception as e:
        return handle_api_error(e, "Failed to update tags")

@conversations_bp.route("/conversations/<int:conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """Delete a conversation and all its messages"""
    try:
        with get_db_session() as session:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                not_found_error = NotFoundError(
                    "Conversation not found",
                    resource_type="conversation"
                )
                return create_error_response(not_found_error)
            
            session.delete(conversation)
            
            return jsonify({
                "message": "Conversation deleted successfully",
                "deleted_id": conversation_id
            })
            
    except Exception as e:
        return handle_api_error(e, "Failed to delete conversation") 