/* =========================================================
   FEES
========================================================= */

function fee(studentId){

    return (
        db.fees.find(
            item =>
                item.studentId === studentId
        )
        ||
        {
            studentId,
            tuition:0,
            bus:0,
            hostel:0,
            paid:0,
            paymentMethod:"-",
            pending:0
        }
    );

}


function feeCard(studentId,studentView){

    const student =
        getStudent(studentId)
        ||
        {
            name:studentId
        };


    const f =
        fee(studentId);


    return `

        <div class="card">

            <div class="card-head">

                <div>

                    <h3>
                        ${esc(student.name)}
                        —
                        ${esc(studentId)}
                    </h3>

                    <p>
                        Fee account
                    </p>

                </div>


                <span
                    class="badge ${
                        f.pending
                        ? "yellow"
                        : "green"
                    }"
                >
                    ${
                        f.pending
                        ? "Pending"
                        : "Paid"
                    }
                </span>

            </div>


            <div class="grid3">

                <div class="item">

                    <p>
                        Tuition Fees
                    </p>

                    <b>
                        ₹${f.tuition.toLocaleString()}
                    </b>

                </div>


                <div class="item">

                    <p>
                        Bus Fees
                    </p>

                    <b>
                        ₹${f.bus.toLocaleString()}
                    </b>

                </div>


                <div class="item">

                    <p>
                        Hostel Fees
                    </p>

                    <b>
                        ₹${f.hostel.toLocaleString()}
                    </b>

                </div>


                <div class="item">

                    <p>
                        Total Paid
                    </p>

                    <b>
                        ₹${f.paid.toLocaleString()}
                    </b>

                </div>


                <div class="item">

                    <p>
                        Payment Method
                    </p>

                    <b>
                        ${esc(f.paymentMethod)}
                    </b>

                </div>


                <div class="item">

                    <p>
                        Pending Fees
                    </p>

                    <b style="color:var(--red)">
                        ₹${f.pending.toLocaleString()}
                    </b>

                </div>

            </div>


            ${
                studentView && f.pending
                ?
                `
                <div
                    class="notice"
                    style="margin-top:15px"
                >
                    🔔 Fee reminder:
                    pending amount
                    ₹${f.pending.toLocaleString()}.
                    Your class adviser and parent
                    can also receive this notification.
                </div>
                `
                :
                ""
            }

        </div>

    `;

}


