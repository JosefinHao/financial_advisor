import os
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from app.models import SessionLocal, Conversation, Message

# Load environment variables
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def get_chat_response(user_message: str, conversation_id: int = None):
    session = SessionLocal()

    # Create a new conversation if none provided
    if not conversation_id:
        conversation = Conversation(title=user_message[:50])  # Set first message as title (truncate to 50 chars)
        session.add(conversation)
        session.commit()
    else:
        conversation = session.query(Conversation).get(conversation_id)
        if not conversation:
            raise ValueError("Invalid conversation ID")

    # Store the user message
    user_msg = Message(
        conversation_id=conversation.id, role="user", content=user_message
    )
    session.add(user_msg)

    # Gather all previous messages
    history = (
        session.query(Message)
        .filter_by(conversation_id=conversation.id)
        .order_by(Message.timestamp)
        .all()
    )
    message_payload = [{"role": msg.role, "content": msg.content} for msg in history]

    # Call OpenAI
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=message_payload,
    )

    assistant_msg = response.choices[0].message.content

    # Store assistant reply
    assistant = Message(
        conversation_id=conversation.id, role="assistant", content=assistant_msg
    )
    session.add(assistant)
    session.commit()

    return assistant_msg, conversation.id
