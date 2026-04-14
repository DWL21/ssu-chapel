# Email Subscription Feature - Setup Guide

## Overview
The email subscription feature allows users to subscribe to notice categories and receive daily digest emails at 9:00 AM KST with relevant notices.

## Files Created/Modified

### Backend
- ✅ `.env` - Environment variables (SMTP settings)
- ✅ `app/SendMail.py` - Updated with SMTP email sending
- ✅ `app/email_template.py` - HTML email template builder (already complete)
- ✅ `app/scheuler.py` - Updated with daily digest job
- ✅ `app/config.py` - Added SMTP configuration
- ✅ `app/models/subscription.py` - Subscriber, Subscription models (already complete)
- ✅ `app/models/notice.py` - Updated Notice model with title, content, category, department
- ✅ `app/schemas/subscription.py` - Pydantic schemas (already complete)
- ✅ `app/routers/subscription.py` - API routes (already complete)
- ✅ `app/main.py` - Already includes subscription router and scheduler
- ✅ `alembic/versions/0002_add_subscriptions.py` - Migration file

### Frontend
- ✅ `frontend/src/EmailSubscriptionForm.tsx` - Subscription form component (NEW)
- ✅ `frontend/src/App.tsx` - Added subscription modal and button

## Setup Instructions

### 1. Configure Environment Variables
Edit `.env` in the project root:
```
DATABASE_URL=sqlite+aiosqlite:///./chapel_data.db
DEBUG=False
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

**For Gmail SMTP:**
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated 16-character password as `SMTP_PASSWORD`

### 2. Run Database Migration
```bash
cd backend
alembic upgrade head
```

This will create:
- `subscribers` table (id, email, created_at)
- `subscriptions` table (id, subscriber_id, category, created_at)
- Update `notices` table with title, content, category, department columns

### 3. Install Dependencies
Backend dependencies should already be installed. If not:
```bash
cd backend
pip install -r requirements.txt
```

Frontend dependencies:
```bash
cd frontend
npm install
```

### 4. Run the Application

**Backend:**
```bash
cd backend
python -m uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## API Endpoints

### Subscribe to Categories
```bash
curl -X POST http://localhost:8000/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "categories": ["학사", "장학", "채용"]
  }'
```

**Response (201):**
```json
{
  "email": "user@example.com",
  "subscribed_categories": ["학사", "장학", "채용"]
}
```

### Unsubscribe from Categories
```bash
curl -X DELETE http://localhost:8000/subscriptions \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "categories": ["장학"]
  }'
```

### Error Responses

| Status | Scenario |
|--------|----------|
| 400 | Missing categories or invalid email format |
| 404 | Subscriber not found (for unsubscribe) |
| 500 | Database or SMTP error |

## Frontend Usage

1. Click the **📧 구독** button in the header
2. Enter your email address
3. Select one or more categories to subscribe to
4. Click **구독하기**
5. You'll receive confirmation and daily digests at 9:00 AM KST

## Categories Available

- 전체 (All)
- 학사 (Academic)
- 장학 (Scholarship)
- 국제교류 (International Exchange)
- 외국인유학생 (International Students)
- 채용 (Recruitment)
- 비교과·행사 (Extracurricular & Events)
- 교원채용 (Faculty Recruitment)
- 교직 (Teaching)
- 봉사 (Volunteer)
- 기타 (Other)

## Scheduler Details

- **Time:** 9:00 AM KST (configurable in `app/scheuler.py`)
- **Frequency:** Daily
- **Behavior:**
  - Fetches all notices from the database
  - Groups notices by subscriber's subscribed categories
  - Generates HTML email from template
  - Sends to all subscribed users
  - Runs in daemon thread automatically on app startup

## Database Schema

### subscribers
| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | BigInt | NO | PK, auto-increment |
| email | String | NO | UNIQUE |
| created_at | DateTime | NO | Server-set |

### subscriptions
| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | BigInt | NO | PK, auto-increment |
| subscriber_id | BigInt | NO | FK → subscribers.id (ondelete CASCADE) |
| category | String | NO | Notice category |
| created_at | DateTime | NO | Server-set |
| | | | UNIQUE(subscriber_id, category) |

### notices
| Column | Type | Null | Notes |
|--------|------|------|-------|
| id | BigInt | NO | PK, auto-increment |
| title | String | NO | Notice title |
| content | Text | YES | Notice content (HTML or plain) |
| category | String | NO | Category for filtering |
| link | String | NO | UNIQUE source link |
| department | String | YES | Publishing department |
| created_at | DateTime | NO | Server-set |

## Testing the Scheduler (Development)

To test the scheduler without waiting 24 hours:

1. Edit `app/scheuler.py` and change the time:
```python
# Change from:
schedule.every().day.at("09:00").do(lambda: asyncio.run(job()))

# To:
schedule.every(1).minutes.do(lambda: asyncio.run(job()))
```

2. Add some test notices to the database:
```python
# In a Python shell or test script
from app.database import AsyncSessionLocal
from app.models.subscription import Notice
import asyncio

async def add_test_notice():
    async with AsyncSessionLocal() as session:
        notice = Notice(
            title="Test Notice",
            content="This is a test notice",
            category="학사",
            link="https://example.com/notice/1",
            department="학사관리팀"
        )
        session.add(notice)
        await session.commit()

asyncio.run(add_test_notice())
```

3. Watch the log output for scheduler execution

## Troubleshooting

### SMTP Connection Errors
- Verify `SMTP_USER` and `SMTP_PASSWORD` in `.env`
- Check 2FA and App Passwords are generated correctly
- Ensure port 587 is not blocked by firewall

### Migration Errors
- Check database file permissions
- Ensure alembic.ini is in the backend directory
- Try: `alembic current` to check current revision

### Scheduler Not Running
- Check logs for errors in the startup thread
- Verify `Schedule` library is installed: `pip install schedule`
- Confirm timezone for KST times (scheduler uses system timezone)

## Security Notes

- **Emails are not encrypted** in this implementation - add TLS/SSL in production
- **SMTP credentials in .env** - Never commit `.env` to git (already in .gitignore)
- **User email validation** - Email is validated by Pydantic (EmailStr type)
- **Database access** - All operations use parameterized queries (SQLAlchemy ORM)

## Future Enhancements

- [ ] Add unsubscribe link in email footer
- [ ] Per-user timezone support
- [ ] Email template customization
- [ ] Notice crawler integration (auto-populate notices table)
- [ ] Subscriber preference for digest frequency (daily/weekly/monthly)
- [ ] Email template versioning
- [ ] Bounce handling and email cleanup
