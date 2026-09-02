/* =========================================================
   ADVISER FEES
========================================================= */

function renderAdviserFees(){

    const element =
        document.getElementById(
            "adviserFees"
        );


    if(!element){

        return;

    }


    element.innerHTML =
        students()
        .map(
            student =>
                feeCard(
                    student.studentId,
                    false
                )
        )
        .join("")
        ||
        `
            <div class="card empty">
                No student fee records.
            </div>
        `;

}


