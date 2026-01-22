from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class PostBase(BaseModel):
    content: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None


class PostCreate(PostBase):
    user_email: str


class Post(PostBase):
    id: UUID
    user_email: str
    created_at: datetime
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class LikeCreate(BaseModel):
    post_id: UUID
    user_email: str
    is_like: bool


class LikeCount(BaseModel):
    likes: int
    dislikes: int


class CommentCreate(BaseModel):
    post_id: UUID
    user_email: str
    content: str


class Comment(BaseModel):
    id: UUID
    post_id: UUID
    user_email: str
    content: str
    created_at: datetime
    username: Optional[str] = None
    avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class User(BaseModel):
    email: str
    username: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileBase(BaseModel):
    username: Optional[str] = None
    avatar_url: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    email: str
    onboarding_completed: bool = False


class UserProfileUpdate(UserProfileBase):
    onboarding_completed: Optional[bool] = None


class UserProfile(UserProfileBase):
    email: str
    onboarding_completed: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    total_posts: int
    total_comments: int
    total_likes_received: int
    total_dislikes_received: int


class MessageCreate(BaseModel):
    receiver_email: str
    content: str


class Message(BaseModel):
    id: UUID
    sender_email: str
    receiver_email: str
    content: str
    read: bool
    created_at: datetime
    sender_username: Optional[str] = None
    sender_avatar_url: Optional[str] = None
    receiver_username: Optional[str] = None
    receiver_avatar_url: Optional[str] = None
    
    class Config:
        from_attributes = True
