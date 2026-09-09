/* =========================================================
   FEEDBACK MODULE
========================================================= */

function feedbackTypeLabel(type){
    return {infrastructure:"Class & College Infrastructure",academic:"Subjects, Faculty & Labs",event:"Events & Functions"}[type] || type;
}

function feedbackAverageRating(list = db.feedbacks){
    if(!list.length) return "0.0";
    return (list.reduce((sum,f)=>sum + Number(f.rating || 0),0) / list.length).toFixed(1);
}

function selectFeedbackType(type){
    const hidden = !type;
    document.getElementById("feedbackType").value = type;
    document.querySelectorAll(".feedback-type-card").forEach(card=>card.classList.toggle("active",card.dataset.feedbackType===type));
    const academic=type==="academic", event=type==="event";
    document.getElementById("feedbackSubjectWrap").classList.toggle("hidden",!academic);
    document.getElementById("feedbackFacultyWrap").classList.toggle("hidden",!academic);
    document.getElementById("feedbackLabWrap").classList.toggle("hidden",!academic);
    document.getElementById("feedbackEventWrap").classList.toggle("hidden",!event);
    document.getElementById("feedbackSessionWrap").classList.toggle("hidden",!event);
    const area=document.getElementById("feedbackArea");
    if(!area) return;
    area.innerHTML = type==="infrastructure"
        ? `<option>Classroom</option><option>Library</option><option>Campus Cleanliness</option><option>Internet / Wi-Fi</option><option>College Facilities</option><option>Other Infrastructure</option>`
        : academic
        ? `<option>Subject & Faculty</option><option>Laboratory</option><option>Teaching Method</option><option>Learning Resources</option>`
        : `<option>Overall Session</option><option>Event Organization</option><option>Speaker / Resource Person</option><option>Learning Outcome</option><option>Facilities & Arrangements</option>`;
}

function resetFeedbackForm(){
    const form=document.getElementById("feedbackForm");
    if(form) form.reset();
    selectFeedbackType("infrastructure");
}

function submitFeedback(event){
    event.preventDefault();
    if(!currentUser || currentUser.role!=="student"){toast("Only students can submit feedback.");return;}
    const type=document.getElementById("feedbackType").value;
    const message=document.getElementById("feedbackMessage").value.trim();
    const rating=Number(document.querySelector('input[name="feedbackRating"]:checked')?.value||0);
    const priority=document.getElementById("feedbackPriority").value;
    const feedback={
        id:"FDB-"+Date.now().toString().slice(-8),
        studentId:currentUser.studentId,studentName:currentUser.name,
        department:currentUser.department||"Data Analytics",batch:currentUser.batch||"2025-2028",
        type,typeLabel:feedbackTypeLabel(type),area:document.getElementById("feedbackArea").value,
        subject:type==="academic"?document.getElementById("feedbackSubject").value:"",
        faculty:type==="academic"?document.getElementById("feedbackFaculty").value:"",
        lab:type==="academic"?document.getElementById("feedbackLab").value:"",
        event:type==="event"?document.getElementById("feedbackEvent").value.trim():"",
        session:type==="event"?document.getElementById("feedbackSession").value.trim():"",
        rating,priority,message,status:"Submitted",adviserResponse:"",
        createdAt:new Date().toLocaleString(),updatedAt:new Date().toLocaleString()
    };
    if(!message||!rating){toast("Please enter feedback and rating.");return;}
    if(type==="event"&&!feedback.event){toast("Please enter the event or function name.");return;}
    db.feedbacks.push(feedback);
    addNotice("New Student Feedback",`${feedback.id}: ${feedback.typeLabel} feedback from ${feedback.studentName}. Rating ${rating}/5.`,"adviser");
    save();refreshAll();go("student-feedback");
    document.getElementById("feedbackForm")?.reset();selectFeedbackType("infrastructure");
    toast(`Feedback ${feedback.id} sent to the Class Adviser.`);
}

function feedbackDetailsHTML(f){
    let details=`<b>${esc(f.area||"")}</b>`;
    if(f.type==="academic") details+=` • Subject: ${esc(f.subject||"—")} • Faculty: ${esc(f.faculty||"—")} • Lab: ${esc(f.lab||"—")}`;
    if(f.type==="event") details+=` • Event: ${esc(f.event||"—")} • Session: ${esc(f.session||"—")}`;
    return details;
}

function feedbackStatusClass(status){
    return status==="Action Taken"?"action":status==="Closed"?"closed":status==="Reviewed"?"reviewed":"submitted";
}

function studentFeedbackCard(f){
    return `<div class="feedback-card ${f.priority==="Urgent"?"priority":""}">
        <div class="feedback-header"><div><b>${esc(f.typeLabel)}</b><div class="feedback-id">${esc(f.id)} • ${esc(f.createdAt)}</div></div>
        <div style="text-align:right"><div class="feedback-rating">★ ${esc(f.rating)}/5</div><span class="feedback-status ${feedbackStatusClass(f.status)}">${esc(f.status)}</span></div></div>
        <p style="margin-top:10px">${feedbackDetailsHTML(f)}</p><p>${esc(f.message)}</p>
        ${f.adviserResponse?`<div class="feedback-response"><b>Class Adviser Response:</b><br>${esc(f.adviserResponse)}</div>`:""}
    </div>`;
}

function renderStudentFeedback(){
    const list=document.getElementById("studentFeedbackList"),count=document.getElementById("studentFeedbackCount");
    if(!list||!currentUser)return;
    const mine=db.feedbacks.filter(f=>f.studentId===currentUser.studentId).slice().reverse();
    if(count)count.textContent=mine.length;
    list.innerHTML=mine.length?mine.map(studentFeedbackCard).join(""):`<div class="feedback-empty">You have not submitted any feedback yet.</div>`;
}

function adviserFeedbackCard(f){
    return `<div class="feedback-card ${f.priority==="Urgent"?"priority":""}">
        <div class="feedback-header"><div><b>${esc(f.studentName)} • ${esc(f.studentId)}</b><div class="feedback-id">${esc(f.id)} • ${esc(f.createdAt)}</div></div>
        <div style="text-align:right"><div class="feedback-rating">★ ${esc(f.rating)}/5</div><span class="feedback-status ${feedbackStatusClass(f.status)}">${esc(f.status)}</span></div></div>
        <p style="margin-top:10px"><b>${esc(f.typeLabel)}</b> • ${feedbackDetailsHTML(f)}</p><p>${esc(f.message)}</p>
        <div class="actions">
            <button class="btn secondary" onclick="openFeedbackResponse('${escAttr(f.id)}')">🔎 Review / Respond</button>
            ${f.status==="Submitted"?`<button class="btn primary" onclick="updateFeedbackStatus('${escAttr(f.id)}','Reviewed')">Mark Reviewed</button>`:""}
            ${f.status==="Reviewed"?`<button class="btn success" onclick="updateFeedbackStatus('${escAttr(f.id)}','Action Taken')">Mark Action Taken</button>`:""}
            ${f.status==="Action Taken"?`<button class="btn secondary" onclick="updateFeedbackStatus('${escAttr(f.id)}','Closed')">Close</button>`:""}
        </div>
        ${f.adviserResponse?`<div class="feedback-response"><b>Adviser Response:</b><br>${esc(f.adviserResponse)}</div>`:""}
    </div>`;
}

function renderAdviserFeedback(){
    const list=document.getElementById("adviserFeedbackList"),analytics=document.getElementById("adviserFeedbackAnalytics");
    if(!list||!currentUser||currentUser.role!=="faculty"||!currentUser.classAdviser)return;
    const search=(document.getElementById("adviserFeedbackSearch")?.value||"").toLowerCase().trim();
    const type=document.getElementById("adviserFeedbackType")?.value||"",status=document.getElementById("adviserFeedbackStatus")?.value||"",priority=document.getElementById("adviserFeedbackPriority")?.value||"";
    const filtered=db.feedbacks.filter(f=>!search||[f.id,f.studentName,f.studentId,f.message,f.typeLabel,f.subject,f.faculty,f.event].join(" ").toLowerCase().includes(search))
        .filter(f=>!type||f.type===type).filter(f=>!status||f.status===status).filter(f=>!priority||f.priority===priority).slice().reverse();
    list.innerHTML=filtered.length?filtered.map(adviserFeedbackCard).join(""):`<div class="feedback-empty">No feedback matches the selected filters.</div>`;
    if(analytics){
        const infra=db.feedbacks.filter(f=>f.type==="infrastructure"),academic=db.feedbacks.filter(f=>f.type==="academic"),event=db.feedbacks.filter(f=>f.type==="event");
        analytics.innerHTML=`<div class="item"><b>${infra.length}</b><p>🏫 Infrastructure Feedback<br>Average: ${feedbackAverageRating(infra)}/5</p></div>
        <div class="item"><b>${academic.length}</b><p>📚 Subject / Faculty / Lab Feedback<br>Average: ${feedbackAverageRating(academic)}/5</p></div>
        <div class="item"><b>${event.length}</b><p>🎉 Event / Function Feedback<br>Average: ${feedbackAverageRating(event)}/5</p></div>`;
    }
}

function openFeedbackResponse(feedbackId){
    const f=db.feedbacks.find(x=>x.id===feedbackId);if(!f)return;
    openModal(`Feedback ${f.id}`,`<div class="item" style="margin-bottom:12px"><b>${esc(f.studentName)} • ${esc(f.typeLabel)}</b><p>${feedbackDetailsHTML(f)}</p><p>${esc(f.message)}</p><p><b>Rating:</b> ${esc(f.rating)}/5 &nbsp; <b>Priority:</b> ${esc(f.priority)}</p></div>
        <div class="form-group"><label>Status</label><select id="feedbackModalStatus" class="control">${["Submitted","Reviewed","Action Taken","Closed"].map(s=>`<option ${f.status===s?"selected":""}>${s}</option>`).join("")}</select></div>
        <div class="form-group"><label>Adviser Response / Action Note</label><textarea id="feedbackModalResponse" class="control" rows="5" placeholder="Write the response or action taken...">${esc(f.adviserResponse||"")}</textarea></div>
        <button class="btn primary" onclick="saveFeedbackResponse('${escAttr(f.id)}')">Save Response</button>`);
}

function saveFeedbackResponse(feedbackId){
    const f=db.feedbacks.find(x=>x.id===feedbackId);if(!f)return;
    const status=document.getElementById("feedbackModalStatus").value,response=document.getElementById("feedbackModalResponse").value.trim();
    f.status=status;f.adviserResponse=response;f.updatedAt=new Date().toLocaleString();
    addNotice("Feedback Update",`Your feedback ${f.id} is now "${status}".${response?" Adviser response: "+response:""}`,f.studentId);
    save();closeModal();refreshAll();go("adviser-feedback");toast(`Feedback ${f.id} updated.`);
}

function updateFeedbackStatus(feedbackId,status){
    const f=db.feedbacks.find(x=>x.id===feedbackId);if(!f)return;
    f.status=status;f.updatedAt=new Date().toLocaleString();
    addNotice("Feedback Status Updated",`Your feedback ${f.id} is now "${status}".`,f.studentId);
    save();refreshAll();go("adviser-feedback");toast(`Feedback marked ${status}.`);
}

