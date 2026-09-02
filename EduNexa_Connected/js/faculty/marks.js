/* =========================================================
   MARKS
========================================================= */

async function saveMark(studentId){

    const mark1 =
        Number(
            document
                .getElementById(`m1-${studentId}`)
                .value
        );

    const mark2 =
        Number(
            document
                .getElementById(`m2-${studentId}`)
                .value
        );

    const mark3 =
        Number(
            document
                .getElementById(`m3-${studentId}`)
                .value
        );


    if(
        [mark1,mark2,mark3]
            .some(
                value =>
                    Number.isNaN(value) ||
                    value < 0 ||
                    value > 100
            )
    ){

        toast("Marks must be between 0 and 100.");

        return;

    }


    const average =
        Math.round(
            (mark1 + mark2 + mark3) / 3
        );


    if(EDUNEXA_BACKEND_ENABLED){
        const student = getStudent(studentId);
        if(student?.backendStudentId){
            try{
                const payload = {
                    student_id: student.backendStudentId,
                    subject: "Overall",
                    m1: mark1,
                    m2: mark2,
                    m3: mark3,
                    m4: 0
                };
                if(student._backendMarkId){
                    await api(`/marks/${student._backendMarkId}`, {
                        method:"PUT",
                        body:JSON.stringify(payload)
                    });
                }else{
                    const created = await api("/marks", {
                        method:"POST",
                        body:JSON.stringify(payload)
                    });
                    student._backendMarkId = created.id;
                }
            }catch(error){ toast(error.message); return; }
        }
    }

    const existing =
        db.marks.find(
            mark =>
                mark.studentId === studentId
        );


    if(existing){

        existing.ca1 = mark1;

        existing.ca2 = mark2;

        existing.model = mark3;

        existing.average = average;

    }else{

        db.marks.push({

            studentId,

            ca1:mark1,

            ca2:mark2,

            model:mark3,

            average

        });

    }


    addNotice(
        "Marks updated",
        `Marks for ${studentId} were updated by ${currentUser.name}.`,
        studentId
    );


    save();

    toast(
        "Student marks saved successfully."
    );

}


