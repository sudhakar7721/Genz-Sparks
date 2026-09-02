# EduNexa API Quick Test

Start:
`uvicorn app.main:app --reload --port 8000`

## Login

POST `/api/auth/login`

```json
{
  "email": "alexa@example.com",
  "password": "123456"
}
```

Copy `access_token`.

Use:
`Authorization: Bearer YOUR_TOKEN`

## Student profile

GET `/api/students/me`

## Student marks

GET `/api/marks/1`

## Student skills

GET `/api/skills/1`

## Tests

GET `/api/tests`

## Assignments

GET `/api/assignments`

## Notifications

GET `/api/notifications/my`

## Management dashboard

Login as management, then:

GET `/api/management/dashboard`
