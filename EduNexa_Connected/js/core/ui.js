/* =========================================================
   MODAL
========================================================= */

function openModal(title,body){

    document
        .getElementById("modalTitle")
        .textContent = title;


    document
        .getElementById("modalBody")
        .innerHTML = body;


    document
        .getElementById("modal")
        .classList.add("show");

}


function closeModal(){

    document
        .getElementById("modal")
        .classList.remove("show");

}



/* =========================================================
   SEARCH
========================================================= */

function searchPages(query){

    query =
        query
            .toLowerCase()
            .trim();


    document
        .querySelectorAll(".nav")
        .forEach(nav => {

            const matches =
                !query ||
                nav.textContent
                    .toLowerCase()
                    .includes(query);


            nav.style.display =
                matches
                ? "flex"
                : "none";

        });

}



/* =========================================================
   MODAL OUTSIDE CLICK
========================================================= */

window.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById("modal");


        if(event.target === modal){

            closeModal();

        }

    }

);



/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if(event.key === "Escape"){

            closeModal();

        }

    }

);


