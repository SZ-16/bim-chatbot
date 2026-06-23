from sqlalchemy import Column, BigInteger, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from databaseFile import Base

class Chat(Base):
    __tablename__ = "chats"

    # UPGRADED: BigInteger to handle Date.now() from React, and autoincrement=False because React provides the ID
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=False)
    title = Column(String, default="New BIM Document Chat")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Link to the messages table
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    # UPGRADED: BigInteger
    id = Column(BigInteger, primary_key=True, index=True)
    chat_id = Column(BigInteger, ForeignKey("chats.id"))
    role = Column(String)  # Will be 'user' or 'assistant'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Link back to the chat table
    chat = relationship("Chat", back_populates="messages")