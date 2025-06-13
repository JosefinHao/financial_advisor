from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    ARRAY,
)
from sqlalchemy.orm import sessionmaker, relationship, scoped_session, declarative_base
from datetime import datetime, timezone
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- SQLAlchemy Base ---
Base = declarative_base()

# --- Models ---
class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True)
    title = Column(String, default="Untitled", nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

    # Store tags as a list of strings using PostgreSQL ARRAY
    tags = Column(ARRAY(Text), default=list)  # Use ARRAY of Text

    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan", # If a conversation is deleted, so are its messages.
        order_by="Message.timestamp",
    )

    def __repr__(self):
        return f"<Conversation id={self.id} title='{self.title}' tags={self.tags}>"


class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message id={self.id} role={self.role} content='{self.content[:20]}...'>"


# --- PostgreSQL DB Setup ---
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_engine(DATABASE_URL, echo=False)

Base.metadata.create_all(engine)

SessionLocal = scoped_session(sessionmaker(bind=engine))

# Test
if __name__ == "__main__":
    session = SessionLocal()
    try:
        results = session.query(Message).limit(5).all()
        for msg in results:
            print(msg)
    finally:
        session.close()
