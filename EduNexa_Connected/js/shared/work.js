/* =========================================================
   WORK
========================================================= */

function workHTML(){

    const work = [

        ...db.tests.map(
            item => ({
                title:item.title,
                due:item.due,
                type:"Test"
            })
        ),

        ...db.assignments.map(
            item => ({
                title:item.title,
                due:item.due,
                type:"Assignment"
            })
        )

    ];


    if(work.length === 0){

        return `
            <div class="empty">
                No work published.
            </div>
        `;

    }


    return work
        .slice(0,5)
        .map(
            item => `

            <div class="item">

                <b>
                    ${esc(item.title)}
                </b>

                <p>
                    ${esc(item.type)}
                    • Due ${esc(item.due)}
                </p>

            </div>

            `
        )
        .join("");

}


