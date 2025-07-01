from flask import Blueprint, request, jsonify, Response, stream_template
import logging
from datetime import datetime
from openai import OpenAI
import os
import json
import openai

from app.models import Conversation, Message
from app.db import SessionLocal
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
from app.services.chat import get_chat_response, get_chat_response_stream
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
            
            result = []
            for conv in conversations:
                # Count messages for this conversation
                message_count = session.query(Message).filter_by(conversation_id=conv.id).count()
                
                result.append({
                    "id": conv.id,
                    "title": conv.title,
                    "created_at": conv.created_at.isoformat(),
                    "tags": conv.tags,
                    "message_count": message_count
                })
            
            return jsonify(result)
            
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

@conversations_bp.route("/conversations/<int:conversation_id>/stream", methods=["POST"])
def send_message_stream(conversation_id):
    """Send a message to a conversation with streaming response"""
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
        
        def generate():
            try:
                # Stream the AI response
                for chunk in get_chat_response_stream(message_content, conversation_id):
                    # Send each chunk as a Server-Sent Event
                    yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                
                # Send end signal
                yield f"data: {json.dumps({'end': True, 'conversation_id': conversation_id})}\n\n"
                
            except Exception as ai_error:
                logging.error(f"AI streaming error: {ai_error}")
                error_data = {
                    'error': 'Failed to get AI response',
                    'details': str(ai_error)
                }
                yield f"data: {json.dumps(error_data)}\n\n"
        
        return Response(
            generate(),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        )
            
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
    """Auto-rename conversation based on content using AI"""
    try:
        with get_db_session() as session:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                not_found_error = NotFoundError(
                    "Conversation not found",
                    resource_type="conversation"
                )
                return create_error_response(not_found_error)
            
            # Get all messages in the conversation
            messages = session.query(Message).filter_by(
                conversation_id=conversation_id
            ).order_by(Message.timestamp).all()
            
            if len(messages) == 0:
                return jsonify({
                    "message": "No messages found to rename conversation"
                })
            
            # Create a summary of the conversation for AI to generate a title
            conversation_summary = ""
            for msg in messages:
                role = "User" if str(msg.role) == "user" else "Assistant"
                conversation_summary += f"{role}: {msg.content}\n"
            
            # Use AI to generate a better title
            title_prompt = f"""Based on this conversation, generate a concise, descriptive title (maximum 60 characters) that captures the main topic or question being discussed. Return only the title, nothing else.

Conversation:
{conversation_summary}

Title:"""
            
            try:
                # Get AI-generated title
                title_response = openai.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful assistant that generates concise, descriptive titles for conversations. Return only the title, no additional text."},
                        {"role": "user", "content": title_prompt}
                    ],
                    max_tokens=20,
                    temperature=0.5
                )
                title_content = title_response.choices[0].message.content
                if title_content:
                    new_title = title_content.strip().strip('"\'').strip()
                    if len(new_title) > 60:
                        new_title = new_title[:57] + "..."
                    setattr(conversation, 'title', new_title)
                    session.commit()
                    return jsonify({
                        "id": conversation.id,
                        "title": conversation.title,
                        "message": "Conversation auto-renamed successfully using AI"
                    })
                else:
                    raise Exception("AI returned empty title")
            except Exception as ai_error:
                # Fallback to original method if AI fails
                print(f"AI title generation failed, using fallback: {ai_error}")
                first_user_message = next((m for m in messages if str(m.role) == "user"), None)
                if first_user_message:
                    fallback_title = first_user_message.content[:60]
                    setattr(conversation, 'title', fallback_title)
                    session.commit()
                    return jsonify({
                        "id": conversation.id,
                        "title": conversation.title,
                        "message": "Conversation auto-renamed using fallback method"
                    })
                else:
                    return jsonify({
                        "message": "No user message found to rename conversation"
                    })
    except Exception as e:
        api_error = APIError(str(e))
        return create_error_response(api_error)

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
            
            # Use setattr to properly assign to SQLAlchemy column
            setattr(conversation, 'tags', list(tags))
            session.commit()
            
            return jsonify({
                "id": conversation.id,
                "tags": conversation.tags,
                "message": "Tags updated successfully"
            })
            
    except Exception as e:
        return handle_api_error(e, "Failed to update tags")

@conversations_bp.route("/conversations/<int:conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """Delete a conversation"""
    try:
        with get_db_session() as session:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                not_found_error = NotFoundError(
                    "Conversation not found",
                    resource_type="conversation"
                )
                return create_error_response(not_found_error)
            
            # Delete all messages in the conversation first
            session.query(Message).filter_by(conversation_id=conversation_id).delete()
            
            # Delete the conversation
            session.delete(conversation)
            session.commit()
            
            return jsonify({
                "message": "Conversation deleted successfully"
            })
            
    except Exception as e:
        return handle_api_error(e, "Failed to delete conversation") 