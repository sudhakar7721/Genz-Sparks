# EduNexa Multi-Login Update

This build keeps the existing frontend modules and adds 77 deterministic demo accounts across 5 departments.

- 50 Students (10 per department)
- 20 Faculty (4 per department; each has one class-adviser class)
- 5 HODs (1 per department)
- 2 Management/Admin accounts
- 4 classes per department (16 classes total)

The migration is additive: it preserves existing localStorage records and adds missing demo accounts.

See `DEMO_CREDENTIALS.md` for the full login table.
