import os
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI
from app.models import SessionLocal, Conversation, Message
from typing import Optional, List, Tuple

# Load environment variables
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

def get_chat_response(
    user_message: str, conversation_id: Optional[int] = None, tags: Optional[List[str]] = None
) -> Tuple[str, int]:
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
            conversation_id = conversation.id
        else:
            conversation = session.query(Conversation).get(conversation_id)
            if not conversation:
                raise ValueError("Invalid conversation ID")

        # Store user message
        user_msg = Message(
            conversation_id=conversation_id, role="user", content=user_message
        )
        session.add(user_msg)
        session.commit()

        # Get full message history
        history = (
            session.query(Message)
            .filter_by(conversation_id=conversation_id)
            .order_by(Message.timestamp)
            .all()
        )
        
        # Build message payload with system prompt
        message_payload = [
            {"role": "system", "content": FINANCIAL_ADVISOR_PROMPT}
        ]
        
        # Add conversation history
        for msg in history:
            message_payload.append({"role": msg.role, "content": str(msg.content)})

        # Get assistant response from OpenAI
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=message_payload,
            max_tokens=1000,
            temperature=0.7
        )

        assistant_msg = response.choices[0].message.content

        # Store assistant response
        assistant = Message(
            conversation_id=conversation_id, role="assistant", content=assistant_msg
        )
        session.add(assistant)
        session.commit()

        return assistant_msg, conversation_id

    finally:
        session.close()
