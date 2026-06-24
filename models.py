from sqlalchemy import Column, BigInteger, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from databaseFile import Base


class Chat(Base):
    __tablename__ = "chats"

    # BigInteger to handle Date.now() from React, autoincrement=False because React provides the ID
    id = Column(BigInteger, primary_key=True, index=True, autoincrement=False)
    title = Column(String, default="New BIM Document Chat")
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(BigInteger, primary_key=True, index=True)
    chat_id = Column(BigInteger, ForeignKey("chats.id"))
    role = Column(String)  # 'user' or 'assistant'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="messages")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    chat_id = Column(BigInteger, ForeignKey("chats.id"))
    author = Column(String)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    chat = relationship("Chat", back_populates="comments")