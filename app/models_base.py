from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, ARRAY
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime, timezone

Base = declarative_base()

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True)
    title = Column(String, default="Untitled", nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    tags = Column(ARRAY(Text), default=list)  # Use ARRAY of Text
    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
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