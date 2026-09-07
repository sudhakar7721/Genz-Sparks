PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT NOT NULL,email TEXT UNIQUE COLLATE NOCASE NOT NULL,password_hash TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN('student','faculty','hod','management')),student_id TEXT UNIQUE,faculty_id TEXT UNIQUE,hod_id TEXT UNIQUE,department TEXT DEFAULT 'Data Analytics',batch TEXT,designation TEXT,phone TEXT,qualification TEXT,experience TEXT,specialization TEXT,office TEXT,parent_name TEXT,parent_phone TEXT,attendance REAL DEFAULT 0,is_active INTEGER DEFAULT 1,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS student_profiles(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,age INTEGER,sex TEXT,caste TEXT,region TEXT,address TEXT,parent_name TEXT,parent_phone TEXT,blood_group TEXT,school_name TEXT,tenth_mark REAL,twelfth_mark REAL,additional_details TEXT);
CREATE TABLE IF NOT EXISTS faculty_profiles(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,classes_handled TEXT DEFAULT '[]',subjects_handled TEXT DEFAULT '[]',is_class_adviser INTEGER DEFAULT 0,extra_info TEXT);
CREATE TABLE IF NOT EXISTS departments(id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT UNIQUE NOT NULL,hod_user_id INTEGER REFERENCES users(id),description TEXT);
CREATE TABLE IF NOT EXISTS classes(
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 department_id INTEGER REFERENCES departments(id),
 name TEXT NOT NULL,batch TEXT,semester TEXT,section TEXT,
 class_adviser_id INTEGER REFERENCES users(id),
 UNIQUE(department_id,name)
);
CREATE TABLE IF NOT EXISTS marks(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,subject TEXT NOT NULL,exam TEXT NOT NULL,mark REAL NOT NULL,max_mark REAL DEFAULT 100,entered_by INTEGER REFERENCES users(id),updated_at TEXT DEFAULT CURRENT_TIMESTAMP,UNIQUE(student_id,subject,exam));
CREATE TABLE IF NOT EXISTS mark_change_requests(id INTEGER PRIMARY KEY AUTOINCREMENT,mark_id INTEGER NOT NULL REFERENCES marks(id) ON DELETE CASCADE,student_id INTEGER NOT NULL REFERENCES users(id),requested_by INTEGER NOT NULL REFERENCES users(id),old_mark REAL NOT NULL,new_mark REAL NOT NULL,reason TEXT NOT NULL,student_approved INTEGER DEFAULT 0,status TEXT DEFAULT 'pending',reviewed_by INTEGER REFERENCES users(id),review_note TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP,reviewed_at TEXT);
CREATE TABLE IF NOT EXISTS class_timetables(id INTEGER PRIMARY KEY AUTOINCREMENT,class_name TEXT,day TEXT,period TEXT,start_time TEXT,end_time TEXT,subject TEXT,faculty_name TEXT,room TEXT,created_by INTEGER REFERENCES users(id),UNIQUE(class_name,day,period));
CREATE TABLE IF NOT EXISTS faculty_timetables(id INTEGER PRIMARY KEY AUTOINCREMENT,faculty_id INTEGER REFERENCES users(id) ON DELETE CASCADE,day TEXT,period TEXT,start_time TEXT,end_time TEXT,subject TEXT,class_name TEXT,room TEXT,UNIQUE(faculty_id,day,period));
CREATE TABLE IF NOT EXISTS attendance(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,subject TEXT,date TEXT,status TEXT,marked_by INTEGER REFERENCES users(id),UNIQUE(student_id,subject,date));
CREATE TABLE IF NOT EXISTS leaves(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,leave_type TEXT,from_date TEXT,to_date TEXT,hours REAL DEFAULT 6,reason TEXT,status TEXT DEFAULT 'pending',adviser_note TEXT,reviewed_by INTEGER REFERENCES users(id),created_at TEXT DEFAULT CURRENT_TIMESTAMP,reviewed_at TEXT);
CREATE TABLE IF NOT EXISTS feedbacks(
 id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
 category TEXT,subject TEXT,rating REAL,message TEXT,recipient TEXT DEFAULT 'class_adviser',
 status TEXT DEFAULT 'open',response TEXT,responded_by INTEGER REFERENCES users(id),
 responded_at TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS tests(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,description TEXT,subject TEXT,class_name TEXT,faculty_id INTEGER REFERENCES users(id),due_date TEXT,max_mark REAL DEFAULT 100,file_id INTEGER);
CREATE TABLE IF NOT EXISTS assignments(id INTEGER PRIMARY KEY AUTOINCREMENT,title TEXT,description TEXT,subject TEXT,class_name TEXT,faculty_id INTEGER REFERENCES users(id),due_date TEXT,max_mark REAL DEFAULT 100,file_id INTEGER);
CREATE TABLE IF NOT EXISTS submissions(
 id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER REFERENCES users(id),
 item_type TEXT,item_id INTEGER,file_id INTEGER REFERENCES files(id),text_answer TEXT,
 mark REAL,status TEXT DEFAULT 'submitted',submitted_at TEXT DEFAULT CURRENT_TIMESTAMP,
 UNIQUE(student_id,item_type,item_id)
);
CREATE TABLE IF NOT EXISTS files(id INTEGER PRIMARY KEY AUTOINCREMENT,owner_id INTEGER REFERENCES users(id),original_name TEXT,stored_name TEXT UNIQUE,content_type TEXT,size INTEGER,category TEXT,created_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS certificates(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER REFERENCES users(id),title TEXT,issuer TEXT,completion_date TEXT,file_id INTEGER REFERENCES files(id));
CREATE TABLE IF NOT EXISTS courses(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER REFERENCES users(id),title TEXT,provider TEXT,completion_date TEXT,certificate_file_id INTEGER REFERENCES files(id));
CREATE TABLE IF NOT EXISTS internships(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER REFERENCES users(id),company TEXT,role TEXT,start_date TEXT,end_date TEXT,description TEXT,file_id INTEGER REFERENCES files(id));
CREATE TABLE IF NOT EXISTS fees(id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER UNIQUE REFERENCES users(id),tuition_total REAL DEFAULT 0,tuition_paid REAL DEFAULT 0,bus_total REAL DEFAULT 0,bus_paid REAL DEFAULT 0,hostel_total REAL DEFAULT 0,hostel_paid REAL DEFAULT 0,placement_total REAL DEFAULT 0,placement_paid REAL DEFAULT 0,updated_at TEXT DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS fee_structures(id INTEGER PRIMARY KEY AUTOINCREMENT,department TEXT,class_name TEXT,tuition REAL DEFAULT 0,bus REAL DEFAULT 0,hostel REAL DEFAULT 0,placement REAL DEFAULT 0,UNIQUE(department,class_name));
CREATE TABLE IF NOT EXISTS placement_companies(id INTEGER PRIMARY KEY AUTOINCREMENT,company_name TEXT,industry TEXT,location TEXT,visited INTEGER DEFAULT 0,visit_date TEXT,package_min REAL,package_max REAL,description TEXT);
CREATE TABLE IF NOT EXISTS placements(id INTEGER PRIMARY KEY AUTOINCREMENT,company_id INTEGER REFERENCES placement_companies(id),student_id INTEGER REFERENCES users(id),package REAL,offer_status TEXT DEFAULT 'placed',placed_date TEXT);
CREATE TABLE IF NOT EXISTS achievements(id INTEGER PRIMARY KEY AUTOINCREMENT,department TEXT,title TEXT,description TEXT,achievement_date TEXT,metric REAL,created_by INTEGER REFERENCES users(id));
CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY AUTOINCREMENT,user_id INTEGER REFERENCES users(id),title TEXT,message TEXT,is_read INTEGER DEFAULT 0,created_at TEXT DEFAULT CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS idx_users_role_dept ON users(role,department);
CREATE INDEX IF NOT EXISTS idx_marks_student ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_leaves_student ON leaves(student_id,status);
CREATE INDEX IF NOT EXISTS idx_feedback_student ON feedbacks(student_id,status);
CREATE INDEX IF NOT EXISTS idx_placements_student ON placements(student_id);
