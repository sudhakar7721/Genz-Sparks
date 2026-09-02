/* =========================================================
   MANAGEMENT PAGES
========================================================= */

function managementPages(){
    return `
    <!-- MANAGEMENT DASHBOARD -->
    <div class="page" id="management-dashboard">
        <div class="page-title">
            <h1>Management Control Center 🏢</h1>
            <p>Fees, marks and placement intelligence across all departments.</p>
        </div>
        <div class="stats">
            ${stat("Departments", managementDepartments().length, "Fee structure available")}
            ${stat("Faculty", managementFaculty.length, "Faculty records")}
            ${stat("Students", managementStudents().length, "Across all departments")}
            ${stat("Companies", managementCompanies.length, "Placement records")}
            ${stat("Placed Students", managementPlacements.length, "Sorted by package")}
        </div>
        <div class="grid2">
            <div class="card">
                <div class="card-head"><div><h3>Fee Structure</h3><p>Department → Class → Student fee details</p></div><button class="btn primary" onclick="go('management-fees')">Open</button></div>
                <div class="list">
                    ${managementDepartments().map(d=>`<div class="item"><b>${esc(d)}</b><p>${managementFeeStudents().filter(x=>x.department===d).length} student fee records</p></div>`).join('')}
                </div>
            </div>
            <div class="card">
                <div class="card-head"><div><h3>Placement Highlights</h3><p>Highest package to lowest package</p></div><button class="btn primary" onclick="go('management-placements')">Open</button></div>
                ${managementPlacements.slice(0,5).map(p=>`<div class="item"><div class="item-top"><div><b>${esc(p.studentName)}</b><p>${esc(p.department)} • ${esc(p.company)}</p></div><strong>₹${esc(p.package)} LPA</strong></div></div>`).join('')}
            </div>
        </div>
        <div class="card">
            <div class="card-head"><div><h3>Quick Access</h3><p>Management-only operations</p></div></div>
            <div class="button-row">
                <button class="btn secondary" onclick="go('management-faculty')">👨‍🏫 Faculty Details</button>
                <button class="btn secondary" onclick="go('management-fees')">💳 Department Fees</button>
                <button class="btn secondary" onclick="go('management-marks')">🎯 Student Marks</button>
                <button class="btn secondary" onclick="go('management-placements')">🏢 Placements</button>
            </div>
        </div>
    </div>

    <!-- MANAGEMENT FACULTY DETAILS -->
    <div class="page" id="management-faculty">
        <div class="page-title"><h1>Faculty Details 👨‍🏫</h1><p>View faculty profile, classes handled, class adviser responsibility, college position, basic subject and extra information.</p></div>
        <div class="stats">
            ${stat("Faculty", managementFaculty.length, "All faculty records")}
            ${stat("Class Advisers", managementFaculty.filter(f=>f.classAdviser).length, "Assigned advisers")}
            ${stat("Mentors", managementFaculty.filter(f=>f.mentor).length, "Mentor access")}
            ${stat("Departments", [...new Set(managementFaculty.map(f=>f.department))].length, "Faculty departments")}
        </div>
        <div class="card">
            <div class="card-head"><div><h3>Faculty Directory</h3><p>Search and filter faculty by department, position or class.</p></div></div>
            <div class="faculty-filter">
                <input class="control" id="managementFacultySearch" oninput="renderManagementFaculty()" placeholder="Search faculty / ID / subject / class">
                <select class="control" id="managementFacultyDepartment" onchange="renderManagementFaculty()"><option value="">All Departments</option>${[...new Set(managementFaculty.map(f=>f.department))].map(d=>`<option>${esc(d)}</option>`).join('')}</select>
                <select class="control" id="managementFacultyPosition" onchange="renderManagementFaculty()"><option value="">All Positions</option>${[...new Set(managementFaculty.map(f=>f.position))].map(d=>`<option>${esc(d)}</option>`).join('')}</select>
            </div>
            <div id="managementFacultyList" class="faculty-management-grid"></div>
        </div>
        <div class="card">
            <div class="card-head"><div><h3>Faculty Class & Subject Overview</h3><p>Which faculty handles which class and basic subject.</p></div></div>
            <div class="table-wrap"><table><thead><tr><th>Faculty</th><th>Department</th><th>Position</th><th>Class / Section</th><th>Basic Subject</th><th>Class Adviser</th><th>Mentor</th></tr></thead><tbody>
            ${managementFaculty.map(f=>`<tr><td><b>${esc(f.name)}</b><br><small>${esc(f.facultyId)}</small></td><td>${esc(f.department)}</td><td><span class="position-badge">${esc(f.position)}</span></td><td>${esc((f.classesHandled||[]).join(', '))}</td><td>${esc((f.basicSubjects||[]).join(', '))}</td><td>${f.classAdviser?'<span class="badge green">Yes</span>':'<span class="badge">No</span>'}</td><td>${f.mentor?'<span class="badge blue">Yes</span>':'<span class="badge">No</span>'}</td></tr>`).join('')}
            </tbody></table></div>
        </div>
    </div>

    <!-- MANAGEMENT FEES -->
    <div class="page" id="management-fees">
        <div class="page-title"><h1>Department Fee Structure 💳</h1><p>Click a department, then a class, to view complete student-wise fee details.</p></div>
        <div class="card">
            <div class="card-head"><div><h3>Departments</h3><p>Select a department</p></div></div>
            <div class="management-grid">
                ${managementDepartments().map(d=>`<button class="management-tile" onclick="showManagementClasses('${escAttr(d)}')"><span>🏫</span><b>${esc(d)}</b><small>View classes →</small></button>`).join('')}
            </div>
        </div>
        <div id="managementFeeClasses"></div>
        <div id="managementFeeStudents"></div>
    </div>

    <!-- MANAGEMENT MARKS -->
    <div class="page" id="management-marks">
        <div class="page-title"><h1>Student Mark Management 🎯</h1><p>Management can access and correct student marks whenever an issue is identified.</p></div>
        <div class="card">
            <div class="card-head"><div><h3>Student Marks</h3><p>Edit CA1, CA2 and Model marks, then save the correction.</p></div><input class="control" style="max-width:280px" id="managementMarkSearch" oninput="renderManagementMarks()" placeholder="Search student / department"></div>
            <div id="managementMarksList"></div>
        </div>
    </div>

    <!-- MANAGEMENT PLACEMENTS -->
    <div class="page" id="management-placements">
        <div class="page-title"><h1>Placement Company & Results 🏢</h1><p>Company details, campus visits and placed students across all departments.</p></div>
        <div class="card">
            <div class="card-head"><div><h3>Campus Interview Companies</h3><p>Companies that visited the college for campus recruitment</p></div></div>
            <div class="table-wrap"><table><thead><tr><th>Company</th><th>Industry</th><th>Location</th><th>Visit Date</th><th>Interview Status</th><th>Students Placed</th></tr></thead><tbody>
            ${managementCompanies.filter(c=>c.visited).map(c=>`<tr><td><b>${esc(c.name)}</b><br><small>${esc(c.description)}</small></td><td>${esc(c.industry)}</td><td>${esc(c.location)}</td><td>${esc(c.visitDate)}</td><td><span class="badge green">Visited</span></td><td>${esc(c.placedCount)}</td></tr>`).join('')}
            </tbody></table></div>
        </div>
        <div class="card">
            <div class="card-head"><div><h3>Company Details</h3><p>Complete placement company information</p></div></div>
            <div class="table-wrap"><table><thead><tr><th>Company</th><th>Industry</th><th>Package Range</th><th>Openings</th><th>Visit</th></tr></thead><tbody>
            ${managementCompanies.map(c=>`<tr><td><b>${esc(c.name)}</b></td><td>${esc(c.industry)}</td><td>₹${esc(c.minPackage)} - ₹${esc(c.maxPackage)} LPA</td><td>${esc(c.openings)}</td><td>${c.visited?'<span class="badge green">Visited</span>':'<span class="badge">Not Visited</span>'}</td></tr>`).join('')}
            </tbody></table></div>
        </div>
        <div class="card">
            <div class="card-head"><div><h3>Placed Students — Highest to Lowest Package</h3><p>All departments</p></div></div>
            <div class="table-wrap"><table><thead><tr><th>Rank</th><th>Student</th><th>Department</th><th>Class</th><th>Company</th><th>Package</th></tr></thead><tbody>
            ${managementPlacements.map((p,i)=>`<tr><td><b>#${i+1}</b></td><td>${esc(p.studentName)}</td><td>${esc(p.department)}</td><td>${esc(p.className)}</td><td>${esc(p.company)}</td><td><strong>₹${esc(p.package)} LPA</strong></td></tr>`).join('')}
            </tbody></table></div>
        </div>
    </div>`;
}

function escAttr(v){ return String(v ?? '').replaceAll('\\','\\\\').replaceAll("'","\\'"); }

const managementFaculty = [
    {facultyId:'FAC-1001',name:'Dr. Priya',email:'faculty@edunexa.com',phone:'+91 90000 10001',department:'Data Analytics',position:'Assistant Professor',designation:'Faculty Coordinator',classAdviser:true,mentor:true,classesHandled:['II B.Sc Data Analytics','I B.Sc Data Analytics'],basicSubjects:['Python','Data Analytics'],extraSubjects:['SQL','Power BI'],experience:'8 Years',qualification:'Ph.D. in Computer Science',office:'Block A - Room 204',joiningYear:2018,workload:'18 Hours / Week',specialization:'Data Analytics & Machine Learning',extraInfo:'Class Adviser for II B.Sc Data Analytics; Mentor for student skill dashboard; coordinates academic activities.'},
    {facultyId:'FAC-1002',name:'Mr. Arun Kumar',email:'arun.faculty@edunexa.com',phone:'+91 90000 10002',department:'Computer Science',position:'Assistant Professor',designation:'Senior Faculty',classAdviser:true,mentor:false,classesHandled:['II B.Sc Computer Science','I B.Sc Computer Science'],basicSubjects:['Java','Data Structures'],extraSubjects:['Web Development','DBMS'],experience:'6 Years',qualification:'M.Phil. Computer Science',office:'Block B - Room 106',joiningYear:2020,workload:'20 Hours / Week',specialization:'Programming & Web Technologies',extraInfo:'Class Adviser for II B.Sc Computer Science; department examination coordinator.'},
    {facultyId:'FAC-1003',name:'Ms. Kavitha R',email:'kavitha.faculty@edunexa.com',phone:'+91 90000 10003',department:'Information Technology',position:'Assistant Professor',designation:'Faculty',classAdviser:false,mentor:true,classesHandled:['II B.Sc Information Technology','I B.Sc Information Technology'],basicSubjects:['Database Management Systems','Networking'],extraSubjects:['Cloud Computing','Cyber Security'],experience:'5 Years',qualification:'M.E. Computer Science',office:'Block C - Room 112',joiningYear:2021,workload:'19 Hours / Week',specialization:'Cloud & Database Technologies',extraInfo:'Mentor faculty for IT students; supports technical clubs and project guidance.'},
    {facultyId:'FAC-1004',name:'Dr. Meena S',email:'meena.faculty@edunexa.com',phone:'+91 90000 10004',department:'Artificial Intelligence & Data Science',position:'Associate Professor',designation:'HOD',classAdviser:true,mentor:true,classesHandled:['II B.Sc AI & Data Science','III B.Sc AI & Data Science'],basicSubjects:['Machine Learning','Artificial Intelligence'],extraSubjects:['Deep Learning','Python'],experience:'11 Years',qualification:'Ph.D. in Artificial Intelligence',office:'Block D - HOD Room',joiningYear:2015,workload:'16 Hours / Week',specialization:'AI, ML & Deep Learning',extraInfo:'HOD and Class Adviser; supervises projects, placements and department academic planning.'}
];

const managementFeeData = [
    {department:'Data Analytics', className:'II B.Sc Data Analytics', students:[
        {name:'Alexa',id:'EDU2026-1048',tutionTotal:60000,tutionPaid:50000,busTotal:12000,busPaid:8000,hostelTotal:0,hostelPaid:0,placementTotal:5000,placementPaid:3000},
        {name:'Arun Kumar',id:'DA2026-002',tutionTotal:60000,tutionPaid:60000,busTotal:12000,busPaid:12000,hostelTotal:45000,hostelPaid:30000,placementTotal:5000,placementPaid:5000},
        {name:'Divya S',id:'DA2026-003',tutionTotal:60000,tutionPaid:45000,busTotal:12000,busPaid:6000,hostelTotal:45000,hostelPaid:45000,placementTotal:5000,placementPaid:2500}
    ]},
    {department:'Computer Science', className:'II B.Sc Computer Science', students:[
        {name:'Karthik R',id:'CS2026-001',tutionTotal:55000,tutionPaid:50000,busTotal:12000,busPaid:12000,hostelTotal:45000,hostelPaid:30000,placementTotal:5000,placementPaid:5000},
        {name:'Nivetha P',id:'CS2026-002',tutionTotal:55000,tutionPaid:40000,busTotal:12000,busPaid:8000,hostelTotal:0,hostelPaid:0,placementTotal:5000,placementPaid:0}
    ]},
    {department:'Information Technology', className:'II B.Sc Information Technology', students:[
        {name:'Kishore V',id:'IT2026-001',tutionTotal:58000,tutionPaid:58000,busTotal:12000,busPaid:6000,hostelTotal:45000,hostelPaid:45000,placementTotal:5000,placementPaid:5000},
        {name:'Lakshanya M',id:'IT2026-002',tutionTotal:58000,tutionPaid:48000,busTotal:12000,busPaid:12000,hostelTotal:45000,hostelPaid:20000,placementTotal:5000,placementPaid:3000}
    ]},
    {department:'Artificial Intelligence & Data Science', className:'II B.Sc AI & Data Science', students:[
        {name:'Harish K',id:'AIDS2026-001',tutionTotal:65000,tutionPaid:60000,busTotal:12000,busPaid:12000,hostelTotal:45000,hostelPaid:45000,placementTotal:5000,placementPaid:5000},
        {name:'Pavithra J',id:'AIDS2026-002',tutionTotal:65000,tutionPaid:35000,busTotal:12000,busPaid:0,hostelTotal:45000,hostelPaid:30000,placementTotal:5000,placementPaid:2500}
    ]}
];

const managementCompanies = [
    {name:'Zoho Corporation',industry:'Software / SaaS',location:'Chennai',visitDate:'2026-08-05',visited:true,placedCount:4,minPackage:6,maxPackage:12,openings:8,description:'Software products and cloud solutions'},
    {name:'TCS',industry:'IT Services',location:'Chennai',visitDate:'2026-07-28',visited:true,placedCount:8,minPackage:4.5,maxPackage:7,openings:20,description:'IT services and consulting'},
    {name:'Accenture',industry:'Technology Services',location:'Bengaluru',visitDate:'2026-07-18',visited:true,placedCount:6,minPackage:5.5,maxPackage:9,openings:15,description:'Digital, cloud and technology services'},
    {name:'Deloitte',industry:'Consulting',location:'Chennai',visitDate:'2026-06-30',visited:true,placedCount:3,minPackage:7,maxPackage:11,openings:7,description:'Consulting and professional services'},
    {name:'Freshworks',industry:'SaaS',location:'Chennai',visitDate:'—',visited:false,placedCount:0,minPackage:6,maxPackage:10,openings:10,description:'Customer and employee experience software'}
];

const managementPlacements = [
    {studentName:'Harish K',department:'Artificial Intelligence & Data Science',className:'II B.Sc AI & Data Science',company:'Deloitte',package:11},
    {studentName:'Arun Kumar',department:'Data Analytics',className:'II B.Sc Data Analytics',company:'Zoho Corporation',package:10},
    {studentName:'Karthik R',department:'Computer Science',className:'II B.Sc Computer Science',company:'Accenture',package:9},
    {studentName:'Kishore V',department:'Information Technology',className:'II B.Sc Information Technology',company:'Zoho Corporation',package:8.5},
    {studentName:'Pavithra J',department:'Artificial Intelligence & Data Science',className:'II B.Sc AI & Data Science',company:'TCS',package:7.2},
    {studentName:'Nivetha P',department:'Computer Science',className:'II B.Sc Computer Science',company:'TCS',package:6.8},
    {studentName:'Lakshanya M',department:'Information Technology',className:'II B.Sc Information Technology',company:'Accenture',package:6.5},
    {studentName:'Divya S',department:'Data Analytics',className:'II B.Sc Data Analytics',company:'TCS',package:6.2},
    {studentName:'Alexa',department:'Data Analytics',className:'II B.Sc Data Analytics',company:'Zoho Corporation',package:6}
].sort((a,b)=>Number(b.package)-Number(a.package));

// Initialize management-only fee data without changing student/faculty modules.
db.managementFeeData = managementFeeData;
if(!db.marks) db.marks=[];
if(db.marks.length===0){
    db.marks.push({studentId:"EDU2026-1048",ca1:84,ca2:88,model:91,average:88});
}
save();


function managementFeeStudents(){
    return managementFeeData.flatMap(d=>d.students.map(s=>({...s,department:d.department,className:d.className})));
}
function managementStudents(){ return managementFeeStudents(); }
function managementDepartments(){ return [...new Set(managementFeeData.map(d=>d.department))]; }
function renderManagementFaculty(){
    const el=document.getElementById('managementFacultyList');
    if(!el) return;
    const q=(document.getElementById('managementFacultySearch')?.value||'').toLowerCase();
    const dept=document.getElementById('managementFacultyDepartment')?.value||'';
    const pos=document.getElementById('managementFacultyPosition')?.value||'';
    const list=managementFaculty.filter(f=>{
        const text=[f.name,f.facultyId,f.email,f.department,f.position,f.designation,...(f.classesHandled||[]),...(f.basicSubjects||[]),...(f.extraSubjects||[])].join(' ').toLowerCase();
        return (!q||text.includes(q))&&(!dept||f.department===dept)&&(!pos||f.position===pos);
    });
    el.innerHTML=list.length?list.map(f=>`<div class="faculty-profile-card">
        <div class="faculty-profile-top"><div class="faculty-avatar">${esc(f.name.replace(/[^A-Za-z]/g,'').slice(0,2).toUpperCase()||'F')}</div><div><h3>${esc(f.name)}</h3><p class="muted">${esc(f.facultyId)} • ${esc(f.department)}</p></div></div>
        <div><span class="position-badge">${esc(f.position)}</span> ${f.classAdviser?'<span class="badge green">Class Adviser</span>':''} ${f.mentor?'<span class="badge blue">Mentor</span>':''}</div>
        <div class="faculty-meta">
            <div class="item"><div class="faculty-label">Designation</div><div class="faculty-value">${esc(f.designation)}</div></div>
            <div class="item"><div class="faculty-label">Experience</div><div class="faculty-value">${esc(f.experience)}</div></div>
            <div class="item"><div class="faculty-label">Basic Subject</div><div class="faculty-value">${esc((f.basicSubjects||[]).join(', '))}</div></div>
            <div class="item"><div class="faculty-label">Classes Faced</div><div class="faculty-value">${esc((f.classesHandled||[]).join(', '))}</div></div>
        </div>
        <div class="faculty-detail-list">
            <div class="faculty-detail-row"><b>Qualification</b><span>${esc(f.qualification)}</span></div>
            <div class="faculty-detail-row"><b>Office</b><span>${esc(f.office)}</span></div>
            <div class="faculty-detail-row"><b>Specialization</b><span>${esc(f.specialization)}</span></div>
            <div class="faculty-detail-row"><b>Extra Subjects</b><span>${esc((f.extraSubjects||[]).join(', '))}</span></div>
            <div class="faculty-detail-row"><b>Extra Information</b><span>${esc(f.extraInfo)}</span></div>
        </div>
        <div class="actions"><button class="btn primary" onclick="showManagementFacultyDetails('${escAttr(f.facultyId)}')">View Full Details</button></div>
    </div>`).join(''):'<div class="empty">No faculty records match the selected filters.</div>';
}

function showManagementFacultyDetails(facultyId){
    const f=managementFaculty.find(x=>x.facultyId===facultyId); if(!f) return;
    document.getElementById('modalTitle').textContent=`Faculty Details — ${f.name}`;
    document.getElementById('modalBody').innerHTML=`<div class="faculty-detail-list">
        <div class="faculty-detail-row"><b>Faculty ID</b><span>${esc(f.facultyId)}</span></div><div class="faculty-detail-row"><b>Email</b><span>${esc(f.email)}</span></div><div class="faculty-detail-row"><b>Phone</b><span>${esc(f.phone)}</span></div><div class="faculty-detail-row"><b>Department</b><span>${esc(f.department)}</span></div><div class="faculty-detail-row"><b>College Position</b><span>${esc(f.position)}</span></div><div class="faculty-detail-row"><b>Designation</b><span>${esc(f.designation)}</span></div><div class="faculty-detail-row"><b>Class Adviser</b><span>${f.classAdviser?'Yes — '+esc((f.classesHandled||[]).join(', ')):'No'}</span></div><div class="faculty-detail-row"><b>Mentor Access</b><span>${f.mentor?'Enabled':'Not assigned'}</span></div><div class="faculty-detail-row"><b>Classes Faced</b><span>${esc((f.classesHandled||[]).join(', '))}</span></div><div class="faculty-detail-row"><b>Basic Subject</b><span>${esc((f.basicSubjects||[]).join(', '))}</span></div><div class="faculty-detail-row"><b>Extra Subjects</b><span>${esc((f.extraSubjects||[]).join(', '))}</span></div><div class="faculty-detail-row"><b>Qualification</b><span>${esc(f.qualification)}</span></div><div class="faculty-detail-row"><b>Experience</b><span>${esc(f.experience)}</span></div><div class="faculty-detail-row"><b>Specialization</b><span>${esc(f.specialization)}</span></div><div class="faculty-detail-row"><b>Office</b><span>${esc(f.office)}</span></div><div class="faculty-detail-row"><b>Joining Year</b><span>${esc(f.joiningYear)}</span></div><div class="faculty-detail-row"><b>Workload</b><span>${esc(f.workload)}</span></div><div class="faculty-detail-row"><b>Extra Information</b><span>${esc(f.extraInfo)}</span></div>
    </div>`;
    document.getElementById('modal').classList.add('show');
}


function managementClasses(department){ return managementFeeData.filter(d=>d.department===department); }
function money(n){ return '₹'+Number(n||0).toLocaleString('en-IN'); }
function feeStatus(total,paid){ return Number(paid)>=Number(total) ? '<span class="badge green">Paid</span>' : `<span class="badge red">Pending ${money(Number(total)-Number(paid))}</span>`; }

function showManagementClasses(department){
    const target=document.getElementById('managementFeeClasses');
    const studentsTarget=document.getElementById('managementFeeStudents');
    if(!target) return;
    target.innerHTML=`<div class="card"><div class="card-head"><div><h3>${esc(department)} — Classes</h3><p>Click a class to view student-wise fees.</p></div></div><div class="management-grid">${managementClasses(department).map(c=>`<button class="management-tile" onclick="showManagementFeeStudents('${escAttr(department)}','${escAttr(c.className)}')"><span>📚</span><b>${esc(c.className)}</b><small>${c.students.length} students →</small></button>`).join('')}</div></div>`;
    studentsTarget.innerHTML='';
    target.scrollIntoView({behavior:'smooth',block:'start'});
}

function showManagementFeeStudents(department,className){
    const target=document.getElementById('managementFeeStudents');
    if(!target) return;
    const cls=managementFeeData.find(d=>d.department===department && d.className===className);
    if(!cls) return;
    target.innerHTML=`<div class="card"><div class="card-head"><div><h3>${esc(className)} — Student Fee Details</h3><p>Complete tuition, bus, hostel and placement fee status.</p></div></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>ID</th><th>Tuition</th><th>Bus</th><th>Hostel</th><th>Placement</th></tr></thead><tbody>${cls.students.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.id)}</td><td>${money(s.tutionTotal)} / ${money(s.tutionPaid)}<br>${feeStatus(s.tutionTotal,s.tutionPaid)}</td><td>${money(s.busTotal)} / ${money(s.busPaid)}<br>${feeStatus(s.busTotal,s.busPaid)}</td><td>${money(s.hostelTotal)} / ${money(s.hostelPaid)}<br>${feeStatus(s.hostelTotal,s.hostelPaid)}</td><td>${money(s.placementTotal)} / ${money(s.placementPaid)}<br>${feeStatus(s.placementTotal,s.placementPaid)}</td></tr>`).join('')}</tbody></table></div></div>`;
    target.scrollIntoView({behavior:'smooth',block:'start'});
}

function renderManagementMarks(){
    const el=document.getElementById('managementMarksList');
    if(!el) return;
    const q=(document.getElementById('managementMarkSearch')?.value||'').toLowerCase();
    const list=students().filter(s=>`${s.name} ${s.studentId||''} ${s.department||''}`.toLowerCase().includes(q));
    el.innerHTML=list.length ? list.map(s=>{
        const m=db.marks.find(x=>x.studentId===s.studentId)||{ca1:0,ca2:0,model:0,average:0};
        return `<div class="card management-mark-card"><div class="item-top"><div><h3>${esc(s.name)}</h3><p>${esc(s.studentId)} • ${esc(s.department||'Department not set')}</p></div><span class="badge">Average ${esc(m.average||0)}%</span></div><div class="mark-grid"><label>CA 1<input class="control" type="number" min="0" max="100" id="mm1-${escAttr(s.studentId)}" value="${esc(m.ca1||0)}"></label><label>CA 2<input class="control" type="number" min="0" max="100" id="mm2-${escAttr(s.studentId)}" value="${esc(m.ca2||0)}"></label><label>Model<input class="control" type="number" min="0" max="100" id="mm3-${escAttr(s.studentId)}" value="${esc(m.model||0)}"></label><button class="btn primary" onclick="managementSaveMark('${escAttr(s.studentId)}')">Save Correction</button></div></div>`;
    }).join('') : '<div class="empty">No students found.</div>';
}

function managementSaveMark(studentId){
    const vals=['mm1','mm2','mm3'].map(x=>Number(document.getElementById(`${x}-${studentId}`).value));
    if(vals.some(v=>Number.isNaN(v)||v<0||v>100)){ toast('Marks must be between 0 and 100.'); return; }
    let m=db.marks.find(x=>x.studentId===studentId);
    if(!m){ m={studentId}; db.marks.push(m); }
    m.ca1=vals[0]; m.ca2=vals[1]; m.model=vals[2]; m.average=Math.round(vals.reduce((a,b)=>a+b,0)/3); m.lastModifiedBy=currentUser.name; m.lastModifiedAt=new Date().toLocaleString();
    addNotice('Management marks correction',`Marks for ${studentId} were corrected by management.`,studentId);
    save(); renderManagementMarks(); toast('Student marks corrected successfully.');
}

function refreshManagementPages(){
    renderManagementMarks();
    renderManagementFaculty();
}


