from enum import Enum

from pydantic import BaseModel, EmailStr


class Category(str, Enum):
    ALL = "전체"
    ACADEMIC = "학사"
    SCHOLARSHIP = "장학"
    INTERNATIONAL = "국제교류"
    FOREIGN_STUDENT = "외국인유학생"
    RECRUITMENT = "채용"
    EXTRACURRICULAR = "비교과·행사"
    FACULTY_RECRUITMENT = "교원채용"
    TEACHING = "교직"
    VOLUNTEER = "봉사"
    ETC = "기타"


class SubscribeRequest(BaseModel):
    email: EmailStr
    categories: list[Category]
    auth_code: str


class UnsubscribeRequest(BaseModel):
    email: EmailStr
    categories: list[Category]


class SubscriptionResponse(BaseModel):
    email: str
    subscribed_categories: list[str]
