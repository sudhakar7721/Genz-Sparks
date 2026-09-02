/* =========================================================
   ATTENDANCE
========================================================= */

async function updateAttendance(studentId){

    const select =
        document.querySelector(
            `.attendance-select[data-id="${CSS.escape(studentId)}"]`
        );


    const student =
        getStudent(studentId);


    if(!student || !select){

        return;

    }


    const status =
        select.value;


    let current =
        Number(student.attendance || 0);


    if(status === "Present"){

        current =
            Math.min(
                100,
                current + 1
            );

    }else{

        current =
            Math.max(
                0,
                current - 1
            );

    }


    if(EDUNEXA_BACKEND_ENABLED && student.backendStudentId){
        try{
            await api("/attendance", {
                method:"POST",
                body:JSON.stringify({
                    student_id: student.backendStudentId,
                    date: today(),
                    subject: null,
                    status
                })
            });
        }catch(error){ toast(error.message); return; }
    }

    student.attendance = current;


    addNotice(
        "Attendance updated",
        `${student.name}'s attendance is now ${current}%.`,
        student.studentId
    );


    save();

    toast(
        `Attendance updated for ${student.name}.`
    );

}


function saveAttendance(){

    save();

    refreshAll();

    toast(
        "Attendance saved successfully."
    );

}


