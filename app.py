from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import openai

from app.models import SessionLocal, Conversation, Message

app = Flask(__name__)
CORS(app)


# --- Routes ---
@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message = data["message"]
    conversation_id = data.get("conversation_id")

    session = SessionLocal()

    try:
        if conversation_id:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                return jsonify({"error": "Conversation not found"}), 404
        else:
            conversation = Conversation(title=message[:20])
            session.add(conversation)
            session.commit()

        user_msg = Message(
            conversation_id=conversation.id, role="user", content=message
        )
        session.add(user_msg)

        # Simulate or call ChatGPT here
        assistant_response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": m.role, "content": m.content} for m in conversation.messages
            ]
            + [{"role": "user", "content": message}],
        )
        reply = assistant_response.choices[0].message.content

        assistant_msg = Message(
            conversation_id=conversation.id, role="assistant", content=reply
        )
        session.add(assistant_msg)
        session.commit()

        return jsonify({"conversation_id": conversation.id, "reply": reply})
    finally:
        session.close()


@app.route("/conversations", methods=["GET"])
def get_conversations():
    session = SessionLocal()
    try:
        conversations = (
            session.query(Conversation)
            .order_by(Conversation.created_at.desc())
            .all()
        )
        return jsonify([
            {
                "id": c.id,
                "title": c.title or "Untitled",
                "created_at": c.created_at.isoformat(),
                "messages": [
                    {
                        "role": m.role,
                        "content": m.content,
                        "timestamp": m.timestamp.isoformat()
                    }
                    for m in c.messages
                ]
            }
            for c in conversations
        ])
    finally:
        session.close()



@app.route("/conversations/<int:cid>", methods=["GET"])
def get_conversation(cid):
    session = SessionLocal()
    try:
        conversation = session.query(Conversation).get(cid)
        if not conversation:
            return jsonify({"error": "Not found"}), 404
        return jsonify(
            {
                "id": conversation.id,
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "messages": [
                    {
                        "role": m.role,
                        "content": m.content,
                        "timestamp": m.timestamp.isoformat(),
                    }
                    for m in conversation.messages
                ],
            }
        )
    finally:
        session.close()


@app.route("/conversations/<int:cid>/rename", methods=["POST"])
def rename_conversation(cid):
    session = SessionLocal()
    try:
        data = request.json
        title = data.get("title")
        conversation = session.query(Conversation).get(cid)
        if conversation and title:
            conversation.title = title
            session.commit()
            return jsonify({"status": "success"})
        return jsonify({"error": "Invalid input"}), 400
    finally:
        session.close()


@app.route("/conversations/<int:cid>", methods=["DELETE"])
def delete_conversation(cid):
    session = SessionLocal()
    try:
        conversation = session.query(Conversation).get(cid)
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
    session = SessionLocal()
    try:
        if not query:
            conversations = (
                session.query(Conversation)
                .order_by(Conversation.created_at.desc())
                .all()
            )
        else:
            conversations = (
                session.query(Conversation)
                .join(Message)
                .filter(Message.content.ilike(f"%{query}%"))
                .distinct()
                .order_by(Conversation.created_at.desc())
                .all()
            )

        return jsonify(
            [
                {
                    "id": c.id,
                    "title": c.title or "Untitled",
                    "created_at": c.created_at.isoformat(),
                }
                for c in conversations
            ]
        )
    finally:
        session.close()


@app.route('/conversations/<int:conversation_id>/auto_rename', methods=['POST'])
def auto_rename_conversation(conversation_id):
    conversation = Conversation.query.get_or_404(conversation_id)
    messages = conversation.messages

    # Combine messages into one text block
    history_text = "\n".join([f"{m.role}: {m.content}" for m in messages])

    # Truncate or clean up if needed
    short_history = history_text[:2000]

    # Use GPT to generate title
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Summarize this chat into a short, descriptive title (max 6 words)."},
                {"role": "user", "content": short_history}
            ]
        )
        title = response['choices'][0]['message']['content'].strip()
    except Exception as e:
        return jsonify({"error": f"Failed to generate title: {str(e)}"}), 500

    conversation.title = title
    db.session.commit()
    return jsonify({"success": True, "title": title})


if __name__ == "__main__":
    app.run(debug=True)
