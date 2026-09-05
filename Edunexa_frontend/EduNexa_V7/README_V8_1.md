# EduNexa V8.1

## Login fix
The combined Staff Login card is labeled **Faculty** as requested, with two internal login types: Faculty Login and HOD Login.

### Demo credentials
- Faculty: `faculty@edunexa.com` / `123456`
- HOD: `hod@edunexa.com` / `123456`
- Student: `alexa@example.com` / `123456`
- Management: `admin@edunexa.com` / `123456`

The final authentication patch repairs missing demo Faculty/HOD users in older `edunexa_v4` localStorage databases without deleting existing records.
