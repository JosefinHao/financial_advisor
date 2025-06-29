import os
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from app.db import SessionLocal
from app.models_base import Conversation, Message
from typing import Optional, List, Tuple, Dict, Any

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Base Financial Advisor System Prompt
BASE_FINANCIAL_ADVISOR_PROMPT = """You are Alex, a professional and knowledgeable financial advisor with over 15 years of experience. Your role is to provide personalized financial guidance, investment advice, and help users make informed decisions about their money.

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
- Respond in the same language as the user's message
"""

def get_chat_response(
    user_message: str, conversation_id = None, tags = None
) -> tuple[str, int]:
    session = SessionLocal()

    try:
        # Create new conversation if not provided
        if not conversation_id:
            conversation = Conversation(
                title=user_message[:50], tags=tags or []  # Set tags if provided
            )
            session.add(conversation)
            session.commit()
            session.refresh(conversation)
            conversation_id = getattr(conversation, "id", None)
        else:
            conversation = session.get(Conversation, conversation_id)
            if not conversation:
                raise ValueError("Invalid conversation ID")

        # Ensure conversation_id is int and not None
        if conversation_id is None:
            raise ValueError("conversation_id is None after creation")
        conversation_id_int = int(conversation_id)

        # Store user message
        user_msg = Message(
            conversation_id=conversation_id_int, role="user", content=str(user_message)
        )
        session.add(user_msg)
        session.commit()

        # Get full message history
        history = (
            session.query(Message)
            .filter_by(conversation_id=conversation_id_int)
            .order_by(Message.timestamp)
            .all()
        )
        
        # Build message payload with system prompt
        message_payload: List[Dict[str, str]] = [
            {"role": "system", "content": BASE_FINANCIAL_ADVISOR_PROMPT}
        ]
        
        # Add conversation history
        for msg in history:
            message_payload.append({"role": str(msg.role), "content": str(msg.content)})

        # Get assistant response from OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=message_payload,  # type: ignore
            max_tokens=1000,
            temperature=0.7
        )
        print('DEBUG: client.chat.completions.create response type:', type(response))
        assistant_msg = response.choices[0].message.content if response.choices and response.choices[0].message.content else ""

        # Store assistant response
        assistant = Message(
            conversation_id=conversation_id_int, role="assistant", content=assistant_msg
        )
        session.add(assistant)
        session.commit()

        return str(assistant_msg), conversation_id_int

    finally:
        session.close()
