import os
from datetime import datetime
from dotenv import load_dotenv
import openai
from app.db import SessionLocal
from app.models import Conversation, Message
from typing import Optional, List, Tuple, Dict, Any, Generator
import re

# Load environment variables
load_dotenv()

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

def clean_ai_response(text: str) -> str:
    """Clean up excessive newlines and whitespace in AI response."""
    if not text:
        return text
    
    # print(f"CLEAN_AI_RESPONSE INPUT: {repr(text)}")  # DEBUG
    
    # Split into lines
    lines = text.split('\n')
    # print(f"SPLIT INTO LINES: {len(lines)} lines")  # DEBUG
    cleaned_lines = []
    
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:  # Skip empty lines
            # print(f"SKIPPING EMPTY LINE {i}")  # DEBUG
            continue
            
        # Check if this is a list item (starts with number + dot or bullet point)
        is_list_item = (re.match(r'^\d+\.', line) or 
                       re.match(r'^[-*+]\s', line) or
                       line.startswith('**') and '**' in line[2:])
        
        # Check if this line should start a new paragraph (like "Where:", "Note:", etc.)
        starts_new_paragraph = (line.lower().startswith(('where:', 'note:', 'therefore:', 'thus:', 'hence:', 'so:', 'then:')) or
                               line.startswith('**') and line.endswith('**'))
        
        # print(f"LINE {i}: {repr(line)} - IS_LIST_ITEM: {is_list_item} - STARTS_NEW_PARAGRAPH: {starts_new_paragraph}")  # DEBUG
        
        if is_list_item:
            # For list items, keep the line as-is
            cleaned_lines.append(line)
            # print(f"ADDED AS LIST ITEM: {line}")  # DEBUG
        elif starts_new_paragraph:
            # For text that should start a new paragraph, don't append to previous line
            cleaned_lines.append(line)
            # print(f"STARTED NEW PARAGRAPH: {line}")  # DEBUG
        else:
            # For regular text, add a space if it's not the first line and previous line wasn't a list item
            if cleaned_lines and not re.match(r'^\d+\.', cleaned_lines[-1]) and not re.match(r'^[-*+]\s', cleaned_lines[-1]):
                # Append to previous line with a space
                cleaned_lines[-1] += ' ' + line
                # print(f"APPENDED TO PREVIOUS: {cleaned_lines[-1]}")  # DEBUG
            else:
                # Start a new line
                cleaned_lines.append(line)
                # print(f"STARTED NEW LINE: {line}")  # DEBUG
    
    result = '\n'.join(cleaned_lines)
    # print(f"CLEAN_AI_RESPONSE OUTPUT: {repr(result)}")  # DEBUG
    return result

# Base Financial Advisor System Prompt
BASE_FINANCIAL_ADVISOR_PROMPT = """
You are an expert financial advisor AI. When presenting information, you may use Markdown formatting, including code blocks, tables, and LaTeX math. 

IMPORTANT: For mathematical formulas, use ONLY these formats:
- Inline math: $formula$ (e.g., $C = S_0 N(d_1) - Xe^{-rt} N(d_2)$)
- Block math: $$formula$$ (e.g., $$C = S_0 N(d_1) - Xe^{-rt} N(d_2)$$)

Do NOT use [formula], (formula), or any other delimiters for math. Only use $...$ and $$...$$.

CRITICAL SPACING RULES:
- Use exactly ONE blank line between paragraphs
- Use NO blank lines between list items or bullet points
- Use NO blank lines before or after lists
- Use NO blank lines before or after standalone math formulas
- Never use more than one blank line anywhere
- Keep spacing minimal and clean
- Do NOT add any extra spacing around bullet points or lists

You are Alex, a professional and knowledgeable financial advisor with over 15 years of experience. Your role is to provide personalized financial guidance, investment advice, and help users make informed decisions about their money.

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

def fix_missing_spaces(text: str) -> str:
    """
    Insert spaces between words if missing (e.g., 'Theformula' -> 'The formula').
    """
    # Add a space before capital letters that follow lowercase letters (except at the start)
    text = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', text)
    # Add a space after punctuation if missing
    text = re.sub(r'([.,;:!?])(?=\w)', r'\1 ', text)
    # Remove double spaces
    text = re.sub(r'\s{2,}', ' ', text)
    return text

def auto_rename_conversation(session, conversation_id: int) -> None:
    """Automatically rename conversation based on its content using AI"""
    try:
        conversation = session.get(Conversation, conversation_id)
        if not conversation:
            return
        
        # Get all messages in the conversation
        messages = session.query(Message).filter_by(
            conversation_id=conversation_id
        ).order_by(Message.timestamp).all()
        
        if not messages:
            return
        
        # Create a summary of the conversation for AI to generate a title
        conversation_summary = ""
        for msg in messages:
            role = "User" if msg.role == "user" else "Assistant"
            conversation_summary += f"{role}: {msg.content}\n"
        
        # Use AI to generate a better title
        title_prompt = f"""Based on this conversation, generate a concise, descriptive title that is exactly 6 words or less. The title should capture the main topic or question being discussed. Return only the title, nothing else.

Conversation:
{conversation_summary}

Title (6 words or less):"""
        
        try:
            # Get AI-generated title
            title_response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates concise, descriptive titles for conversations. Return only the title, no additional text."},
                    {"role": "user", "content": title_prompt}
                ],
                max_tokens=50,
                temperature=0.3
            )
            
            title_content = title_response.choices[0].message.content
            if title_content:
                new_title = title_content.strip()
                
                # Clean up the title (remove quotes, extra spaces, etc.)
                new_title = new_title.strip('"\'')
                new_title = new_title.strip()
                
                # Limit to at most 6 words
                words = new_title.split()
                if len(words) > 6:
                    # Take words until we reach 6, then stop
                    new_title = ' '.join(words[:6])
                
                # Also ensure it's not too long (character limit as backup)
                if len(new_title) > 60:
                    new_title = new_title[:57] + "..."
                
                # Update the conversation title
                conversation.title = new_title
                session.commit()
            else:
                # If AI returned empty response, use fallback
                raise Exception("AI returned empty title")
            
        except Exception as ai_error:
            # Fallback to original method if AI fails
            print(f"AI title generation failed, using fallback: {ai_error}")
            first_user_message = session.query(Message).filter_by(
                conversation_id=conversation_id, 
                role="user"
            ).order_by(Message.timestamp).first()
            
            if first_user_message:
                message_content = str(first_user_message.content)
                # Limit fallback title to 6 words as well
                words = message_content.split()
                if len(words) > 6:
                    new_title = ' '.join(words[:6])
                else:
                    new_title = message_content[:50]  # Character limit as backup
                    if len(message_content) > 50:
                        new_title += "..."
                
                conversation.title = new_title
                session.commit()
            
    except Exception as e:
        # Log error but don't fail the main operation
        print(f"Auto-rename failed for conversation {conversation_id}: {e}")

def convert_standalone_math_to_block(text: str) -> str:
    """Convert standalone inline math formulas to block math format for centering, with no extra newlines inside the block."""
    lines = text.split('\n')
    result_lines = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        # Check if the line contains only a math formula (with optional whitespace)
        # and doesn't already contain $$ block math delimiters
        if (stripped.startswith('$') and stripped.endswith('$') and 
            stripped.count('$') == 2 and '$$' not in stripped):
            # Convert inline math to block math, no extra newlines
            math_content = stripped[1:-1].strip()  # Remove the $ symbols and extra spaces
            result_lines.append(f"$${math_content}$$")
        elif (stripped.startswith('$$') and stripped.endswith('$$') and 
              stripped.count('$$') == 2):
            # Already block math, ensure it's properly formatted (no extra newlines)
            math_content = stripped[2:-2].strip()  # Remove the $$ symbols and extra spaces
            result_lines.append(f"$${math_content}$$")
        elif (stripped.startswith('\\(') and stripped.endswith('\\)')):
            # Convert LaTeX inline math to block math
            math_content = stripped[2:-2].strip()  # Remove the \( \) symbols
            result_lines.append(f"$${math_content}$$")
        elif (stripped.startswith('\\[') and stripped.endswith('\\]')):
            # Convert LaTeX block math to our format
            math_content = stripped[2:-2].strip()  # Remove the \[ \] symbols
            result_lines.append(f"$${math_content}$$")
        else:
            result_lines.append(line)
    
    return '\n'.join(result_lines)

def convert_bracket_math_to_dollars(text: str) -> str:
    """Convert various math delimiters to proper LaTeX math format."""
    # Convert [ ... ] blocks (on their own line) to $$ ... $$
    def replacer_block(match):
        content = match.group(1).strip()
        return f"$$\n{content}\n$$"
    
    # Convert inline [ ... ] to $ ... $
    def replacer_inline(match):
        content = match.group(1).strip()
        return f"${content}$"
    
    # Pattern for block math: [ ... ] on its own line, possibly with whitespace
    block_pattern = re.compile(r"^\s*\[(.*?)\]\s*$", re.DOTALL | re.MULTILINE)
    text = block_pattern.sub(replacer_block, text)
    
    # Manual scan for (( ... ))
    def manual_double_parens_replace(s):
        result = ''
        i = 0
        while i < len(s):
            if s[i:i+2] == '((':  # Found ((
                start = i + 2
                depth = 1
                j = start
                while j < len(s):
                    if s[j:j+2] == '))' and depth == 1:
                        match_str = s[start:j]
                        # If the match starts with (, include it
                        if match_str and s[start-1] == '(':
                            match_str = '(' + match_str
                        result += f'${match_str}$'
                        i = j + 2
                        break
                    elif s[j:j+2] == '((':  # Nested ((
                        depth += 1
                        j += 2
                    elif s[j:j+2] == '))' and depth > 1:
                        depth -= 1
                        j += 2
                    else:
                        j += 1
                else:
                    # No closing )), just add the rest
                    result += s[i:]
                    break
            else:
                result += s[i]
                i += 1
        return result
    text = manual_double_parens_replace(text)
    
    # Convert \( ... \) to $ ... $
    text = re.sub(r"\\\((.*?)\\\)", r"$\1$", text)
    
    # Convert \[ ... \] to $$ ... $$
    text = re.sub(r"\\\[(.*?)\\\]", r"$$\1$$", text)
    
    # Pattern for inline math: [ ... ] not on its own line and not inside parentheses
    inline_pattern = re.compile(r"(?<!\()\[(.*?)](?!\))")
    text = inline_pattern.sub(replacer_inline, text)
    
    # Convert bullet point math like (B_x), (P), etc. to $B_x$, $P$, etc.
    # When they appear at start of bullet points or after equals signs
    text = re.sub(r"^\s*[-*+]\s*\(([A-Za-z_][A-Za-z0-9_]*)\)", r"* $\1$", text, flags=re.MULTILINE)
    text = re.sub(r"=\s*\(([A-Za-z_][A-Za-z0-9_]*)\)", r"= $\1$", text)
    
    # Convert standalone inline math to block math for centering
    text = convert_standalone_math_to_block(text)
    
    return text

def get_chat_response_stream(
    user_message: str, conversation_id = None, tags = None
) -> Generator[str, None, int]:
    """
    Stream chat response from OpenAI and yield chunks as they arrive.
    Returns the conversation_id at the end.
    """
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

        # Get streaming response from OpenAI
        stream = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=message_payload,  # type: ignore
            max_tokens=1000,
            temperature=0.7,
            stream=True
        )
        
        full_response = ""
        
        # Stream the response chunks in real-time
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                content_chunk = chunk.choices[0].delta.content
                # print("RAW AI CHUNK:", repr(content_chunk))  # DEBUG: print raw AI output chunk
                full_response += content_chunk
                # Yield each chunk immediately for real-time streaming
                yield content_chunk
        
        # After streaming is complete, clean and store the full response
        # print("BEFORE CLEANING (streaming):", repr(full_response))  # DEBUG
        cleaned_response = clean_ai_response(full_response)  # Clean up excessive newlines
        # print("AFTER CLEANING (streaming):", repr(cleaned_response))  # DEBUG
        
        # Store the cleaned response in the database
        assistant = Message(
            conversation_id=conversation_id_int, role="assistant", content=cleaned_response
        )
        session.add(assistant)
        session.commit()
        
        # Return the conversation_id as an integer
        return conversation_id_int

    finally:
        session.close()

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
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=message_payload,  # type: ignore
            max_tokens=1000,
            temperature=0.7
        )
        assistant_msg = response.choices[0].message.content if response.choices and response.choices[0].message.content else ""
        # print("RAW AI FULL MESSAGE:", repr(assistant_msg))  # DEBUG: print raw AI output
        # print("BEFORE CLEANING (non-streaming):", repr(assistant_msg))  # DEBUG
        # Clean up excessive newlines before storing and returning
        assistant_msg = clean_ai_response(assistant_msg)
        # print("AFTER CLEANING (non-streaming):", repr(assistant_msg))  # DEBUG
        assistant = Message(
            conversation_id=conversation_id_int, role="assistant", content=assistant_msg
        )
        session.add(assistant)
        session.commit()
        return str(assistant_msg), conversation_id_int

    finally:
        session.close()
