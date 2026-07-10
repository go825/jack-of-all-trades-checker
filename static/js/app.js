const build = new Array(7).fill(null);

const slots = document.querySelectorAll(".item-slot");
const items = document.querySelectorAll(".item-card");

let draggedIndex = null;

items.forEach(card => {
    card.addEventListener("click", () => {
        const firstEmpty = build.findIndex(slot => slot === null);

        if (firstEmpty === -1) {
            alert("Buildがいっぱいです");
            return;
        }

        const item = JSON.parse(card.dataset.item);

        build[firstEmpty] = item;

        renderBuild();
    });
});

slots.forEach(slot => {
    slot.addEventListener("click", () => {
        const index = Number(slot.dataset.slot);

        if (build[index] === null) {
            return;
        }

        build[index] = null;
        renderBuild();
    });

    slot.addEventListener("dragstart", event => {
        const index = Number(slot.dataset.slot);

        if (build[index] === null) {
            event.preventDefault();
            return;
        }

        draggedIndex = index;
        event.dataTransfer.effectAllowed = "move";
        slot.classList.add("dragging");
    });

    slot.addEventListener("dragend", () => {
        draggedIndex = null;
        slot.classList.remove("dragging");
        clearDropTargets();
    });

    slot.addEventListener("dragover", event => {
        event.preventDefault();

        if (draggedIndex === null) {
            return;
        }

        slot.classList.add("drop-target");
    });

    slot.addEventListener("dragleave", () => {
        slot.classList.remove("drop-target");
    });

    slot.addEventListener("drop", event => {
        event.preventDefault();

        const targetIndex = Number(slot.dataset.slot);

        if (draggedIndex === null || draggedIndex === targetIndex) {
            clearDropTargets();
            return;
        }

        const temp = build[targetIndex];
        build[targetIndex] = build[draggedIndex];
        build[draggedIndex] = temp;

        draggedIndex = null;
        clearDropTargets();
        renderBuild();
    });
});

function renderBuild() {
    slots.forEach((slot, index) => {
        slot.innerHTML = "";
        slot.setAttribute("draggable", build[index] !== null);

        const item = build[index];

        if (item === null) {
            return;
        }

        const img = document.createElement("img");
        img.src = item.image.url;
        img.alt = item.name;
        img.title = item.name;
        img.width = 48;
        img.height = 48;
        img.draggable = false;

        slot.appendChild(img);
    });

    updateJackOfAllTrades();
}

function updateJackOfAllTrades() {
    const jackStats = calculateJackStats(build);

    renderStack(jackStats.length);
    renderStatus(jackStats);

    console.log("何でも屋ステータス:", jackStats);
}

function clearDropTargets() {
    slots.forEach(slot => {
        slot.classList.remove("drop-target");
        slot.classList.remove("dragging");
    });
}

renderBuild();

function renderStack(stackCount) {
    const countElement = document.getElementById("stack-count");
    const stackBoxes = document.querySelectorAll(".stack-box");

    const cappedCount = Math.min(stackCount, 10);

    countElement.textContent = `${cappedCount} / 10`;

    stackBoxes.forEach((box, index) => {
        if (index < cappedCount) {
            box.classList.add("active");
        } else {
            box.classList.remove("active");
        }
    });
}

function renderStatus(acquiredStats){

    const acquiredList=document.getElementById("acquired-stats");
    const missingList=document.getElementById("missing-stats");

    acquiredList.innerHTML="";
    missingList.innerHTML="";

    JACK_STAT_LIST.forEach(stat=>{

        const li=document.createElement("li");

        if(acquiredStats.includes(stat)){

            li.textContent="✔ "+stat;
            acquiredList.appendChild(li);

        }else{

            li.textContent="□ "+stat;
            missingList.appendChild(li);

        }

    });

}