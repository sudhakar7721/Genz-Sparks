/* =========================================================
   EDUNEXA DATABASE
========================================================= */

const DB_KEY = "edunexa_v4";

let db = loadDatabase();
// Backward-compatible migration for databases created before the Feedback module.
db.feedbacks = Array.isArray(db.feedbacks) ? db.feedbacks : [];
// Enhanced EduNexa modules: backward-compatible localStorage migrations.
db.studentProfiles = Array.isArray(db.studentProfiles) ? db.studentProfiles : [];
db.certificates = Array.isArray(db.certificates) ? db.certificates : [];
db.completedCourses = Array.isArray(db.completedCourses) ? db.completedCourses : [];
db.internships = Array.isArray(db.internships) ? db.internships : [];
db.classTimetables = Array.isArray(db.classTimetables) ? db.classTimetables : [];
db.classMeetings = Array.isArray(db.classMeetings) ? db.classMeetings : [];
db.markChangeRequests = Array.isArray(db.markChangeRequests) ? db.markChangeRequests : [];
db.facultyTimetables = Array.isArray(db.facultyTimetables) ? db.facultyTimetables : [];
db.facultyAttendance = Array.isArray(db.facultyAttendance) ? db.facultyAttendance : [];
db.hodDetails = Array.isArray(db.hodDetails) ? db.hodDetails : [];
db.managementExtra = db.managementExtra || {};
db.departments = Array.isArray(db.departments) ? db.departments : [];
db.hodDetails = Array.isArray(db.hodDetails) ? db.hodDetails : [];


let currentUser = null;

let loginRole = "student";

let signupRole = "student";



/* =========================================================
   DATABASE
========================================================= */

function createDefaultDatabase(){

    return {

        users: [],

        tests: [],

        assignments: [],

        submissions: [],

        leaves: [],

        notifications: [],

        marks: [],

        fees: [],
        feedbacks: [],
        studentProfiles: [],
        certificates: [],
        completedCourses: [],
        internships: [],
        classTimetables: [],
        classMeetings: [],
        markChangeRequests: [],
        facultyTimetables: [],
        facultyAttendance: [],
        hodDetails: [],
        managementExtra: {},
        departments: []

    };

}


function loadDatabase(){

    try{

        const saved = localStorage.getItem(DB_KEY);

        if(saved){

            return JSON.parse(saved);

        }

    }catch(error){

        console.error("Database loading error:",error);

    }

    return createDefaultDatabase();

}


function save(){

    try{

        localStorage.setItem(
            DB_KEY,
            JSON.stringify(db)
        );

    }catch(error){

        console.error("Database save error:",error);

        toast("Unable to save data.");

    }

}



/* =========================================================
   SEED DATA
========================================================= */

function seedDatabase(){

    if(db.users.length > 0){

        return;

    }


    db.users = [

        {
            name:"Alexa",
            email:"alexa@example.com",
            password:"123456",
            role:"student",
            studentId:"EDU2026-1048",
            parentName:"Alexa Parent",
            parentPhone:"+91 90000 00001",
            department:"Data Analytics",
            batch:"2025-2028",
            attendance:86,
            skills:{
                Python:88,
                SQL:82,
                "Power BI":91,
                Excel:86,
                Communication:76
            }
        },


        {
            name:"Dr. Priya",
            email:"faculty@edunexa.com",
            password:"123456",
            role:"faculty",
            facultyId:"FAC-1001",
            mentor:true,
            classAdviser:true,
            department:"Data Analytics",
            position:"Assistant Professor",
            designation:"Faculty Coordinator",
            classesHandled:["II B.Sc Data Analytics","I B.Sc Data Analytics"],
            basicSubjects:["Python","Data Analytics"],
            extraSubjects:["SQL","Power BI"],
            qualification:"Ph.D. in Computer Science",
            experience:"8 Years",
            specialization:"Data Analytics & Machine Learning",
            office:"Block A - Room 204",
            phone:"+91 90000 10001",
            extraInfo:"Class Adviser for II B.Sc Data Analytics; Mentor for student skill dashboard; coordinates academic activities."
        },


        {
            name:"Dr. HOD Admin",
            email:"hod@edunexa.com",
            password:"123456",
            role:"hod",
            hodId:"HOD-1001",
            department:"Data Analytics",
            designation:"Head of Department",
            phone:"+91 90000 20001",
            qualification:"Ph.D.",
            experience:"12 Years"
        },


        {
            name:"Management Admin",
            email:"admin@edunexa.com",
            password:"123456",
            role:"management",
            adminId:"ADM-1001"
        }

    ];


    db.fees = [

        {
            studentId:"EDU2026-1048",
            tuition:60000,
            bus:12000,
            hostel:0,
            paid:50000,
            paymentMethod:"UPI",
            pending:22000
        }

    ];


    db.feedbacks = [
        {id:"FDB-10001",studentId:"EDU2026-1048",studentName:"Alexa",department:"Data Analytics",batch:"2025-2028",type:"infrastructure",typeLabel:"Class & College Infrastructure",area:"Internet / Wi-Fi",subject:"",faculty:"",lab:"",event:"",session:"",rating:4,priority:"Important",message:"The classroom internet is useful, but connectivity can be improved during practical sessions.",status:"Reviewed",adviserResponse:"Thank you. The connectivity issue has been noted and will be raised with the department.",createdAt:"2026-08-22 10:30 AM",updatedAt:"2026-08-22 12:10 PM"},
        {id:"FDB-10002",studentId:"EDU2026-1048",studentName:"Alexa",department:"Data Analytics",batch:"2025-2028",type:"academic",typeLabel:"Subjects, Faculty & Labs",area:"Subject & Faculty",subject:"Python",faculty:"Dr. Priya",lab:"Python Lab",event:"",session:"",rating:5,priority:"Normal",message:"Python practical explanations are clear and the lab exercises are helpful.",status:"Action Taken",adviserResponse:"Positive feedback shared with the faculty member.",createdAt:"2026-08-20 03:00 PM",updatedAt:"2026-08-21 09:00 AM"},
        {id:"FDB-10003",studentId:"EDU2026-1048",studentName:"Alexa",department:"Data Analytics",batch:"2025-2028",type:"event",typeLabel:"Events & Functions",area:"Overall Session",subject:"",faculty:"",lab:"",event:"Data Analytics Career Seminar",session:"Industry Session",rating:4,priority:"Normal",message:"The session was informative. More time for student questions would make it better.",status:"Submitted",adviserResponse:"",createdAt:"2026-08-23 04:15 PM",updatedAt:"2026-08-23 04:15 PM"}
    ];


    db.tests = [

        {
            id:1,
            title:"Python Fundamentals Test",
            subject:"Python",
            faculty:"Dr. Priya",
            start:"2026-08-20",
            due:"2026-08-25",

            questions:[

                {
                    q:"Which keyword defines a function in Python?",
                    opts:[
                        "func",
                        "def",
                        "function",
                        "define"
                    ],
                    ans:1
                },

                {
                    q:"Which data type is immutable?",
                    opts:[
                        "List",
                        "Dictionary",
                        "Tuple",
                        "Set"
                    ],
                    ans:2
                }

            ]

        }

    ];


    db.assignments = [

        {
            id:1,
            title:"SQL Query Assignment",
            subject:"SQL",
            faculty:"Dr. Priya",
            assigned:"2026-08-20",
            due:"2026-08-27",
            description:
                "Write SQL queries for the given student database."
        }

    ];


    save();

}


