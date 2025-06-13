from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import logging
import os
import openai
from sqlalchemy.orm import selectinload

from app.models import SessionLocal, Conversation, Message
from app.services.chat import get_chat_response

# Setup
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# Set OpenAI API key from environment variable
openai.api_key = os.getenv("OPENAI_API_KEY")


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "ok"})


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message")
    conversation_id = data.get("conversation_id")
    tags = data.get("tags")

    if not message:
        return jsonify({"error": "No message provided"}), 400

    try:
        # Using chat.py
        reply, new_conversation_id = get_chat_response(
            user_message=message,
            conversation_id=conversation_id,
            tags=tags
        )

        return jsonify({
            "conversation_id": new_conversation_id,
            "reply": reply,
            "messages": [
                {"role": "user", "content": message},
                {"role": "assistant", "content": reply}
            ]
        })
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 404
    except Exception as e:
        app.logger.error(f"Error in /chat: {e}")
        return jsonify({"error": "Internal server error"}), 500


@app.route("/conversations", methods=["GET"])
def get_conversations():
    tag_filter = request.args.get("tag")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    offset = (page - 1) * limit

    session = SessionLocal()
    try:
        query = session.query(Conversation).options(selectinload(Conversation.messages))

        if tag_filter:
            query = query.filter(Conversation.tags.ilike(f"%{tag_filter.lower()}%"))


        conversations = query.order_by(Conversation.created_at.desc())\
            .offset(offset).limit(limit).all()

        return jsonify([
            {
                "id": c.id,
                "title": c.title or "Untitled",
                "created_at": c.created_at.isoformat(),
                "tags": c.tags if c.tags else [],
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
        ])
    finally:
        session.close()


@app.route("/conversations/<int:cid>", methods=["GET"])
def get_conversation(cid):
    session = SessionLocal()
    try:
        conversation = session.query(Conversation)\
            .options(selectinload(Conversation.messages))\
            .get(cid)
        if not conversation:
            return jsonify({"error": "Not found"}), 404

        return jsonify({
            "id": conversation.id,
            "title": conversation.title or "Untitled",
            "created_at": conversation.created_at.isoformat(),
            "tags": conversation.tags or [],
            "messages": [
                {
                    "role": m.role,
                    "content": m.content,
                    "timestamp": m.timestamp.isoformat(),
                }
                for m in conversation.messages
            ],
        })
    finally:
        session.close()


@app.route("/conversations/<int:cid>/rename", methods=["POST"])
def rename_conversation(cid):
    session = SessionLocal()
    try:
        data = request.json
        title = data.get("title")
        conversation = session.get(Conversation, cid)
        if conversation and title:
            conversation.title = title
            session.commit()
            return jsonify({"status": "success"})
        return jsonify({"error": "Invalid input"}), 400
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
        conversation = session.get(Conversation, cid)
        if conversation:
            session.delete(conversation)
            session.commit()
            return jsonify({"status": "deleted"})
        return jsonify({"error": "Not found"}), 404
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
            conversations = session.query(Conversation)\
                .order_by(Conversation.created_at.desc())\
                .offset(offset).limit(limit).all()
        else:
            conversations = (
                session.query(Conversation)
                .join(Message)
                .filter(Message.content.ilike(f"%{query}%"))
                .distinct()
                .order_by(Conversation.created_at.desc())
                .offset(offset).limit(limit)
                .all()
            )

        return jsonify([
            {
                "id": c.id,
                "title": c.title or "Untitled",
                "created_at": c.created_at.isoformat(),
                "tags": c.tags or [],
            }
            for c in conversations
        ])
    finally:
        session.close()


@app.route('/conversations/<int:conversation_id>/auto_rename', methods=['POST'])
def auto_rename_conversation(conversation_id):
    session = SessionLocal()
    try:
        conversation = session.get(Conversation, conversation_id)
        if not conversation:
            return jsonify({"error": "Conversation not found"}), 404

        messages = conversation.messages
        history_text = "\n".join([f"{m.role}: {m.content}" for m in messages])
        short_history = history_text[:2000]

        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Summarize this chat into a short, descriptive title (max 5 words)."},
                    {"role": "user", "content": short_history}
                ]
            )
            title = response.choices[0].message.content.strip()
        except Exception as e:
            return jsonify({"error": f"Failed to generate title: {str(e)}"}), 500

        conversation.title = title
        session.commit()
        return jsonify({"success": True, "title": title})
    finally:
        session.close()


@app.errorhandler(Exception)
def handle_unexpected_error(e):
    app.logger.error(f"Unhandled error: {e}")
    return jsonify({"error": "Internal server error"}), 500


if __name__ == "__main__":
    app.run(debug=True)
