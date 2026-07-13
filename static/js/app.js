const roleBuilds = {
    top: new Array(6).fill(null),
    jungle: new Array(6).fill(null),
    mid: new Array(6).fill(null),
    adc: new Array(7).fill(null),
    support: new Array(7).fill(null)
};

const SUPPORT_ITEM_IDS = new Set([
    "3865",
    "3869",
    "3870",
    "3871",
    "3876",
    "3877"
]);

let activeRole = "adc";
let build = roleBuilds[activeRole];

const buildGrid = document.querySelector(".build-grid");
const slots = document.querySelectorAll(".item-slot");
const items = document.querySelectorAll(".item-card");
const roleButtons = document.querySelectorAll(".role-tabs button");

let draggedIndex = null;

roleButtons.forEach(button => {
    button.addEventListener("click", () => {
        activeRole = button.dataset.role;
        build = roleBuilds[activeRole];
        draggedIndex = null;

        roleButtons.forEach(roleButton => {
            roleButton.classList.toggle("active", roleButton === button);
        });

        clearDropTargets();
        renderBuild();
    });
});

items.forEach(card => {
    card.addEventListener("click", () => {
        const item = JSON.parse(card.dataset.item);

        if (isBootItem(item) && build.some(buildItem => isBootItem(buildItem))) {
            alert("このアイテムは複数積めません");
            return;
        }

        if (isSupportItem(item) && activeRole !== "support") {
            alert("supアイテムはsupしか積めません");
            return;
        }

        const targetIndex = findItemTargetIndex(item);

        if (targetIndex === -1) {
            const message = isSpecialRoleItem(item)
                ? "このアイテムは複数積めません"
                : "Buildがいっぱいです";

            alert(message);
            return;
        }

        build[targetIndex] = item;
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

        const draggedItem = build[draggedIndex];
        const targetItem = build[targetIndex];

        if (
            !isItemAllowedInSlot(draggedItem, targetIndex) ||
            !isItemAllowedInSlot(targetItem, draggedIndex)
        ) {
            clearDropTargets();
            return;
        }

        build[targetIndex] = draggedItem;
        build[draggedIndex] = targetItem;

        draggedIndex = null;
        clearDropTargets();
        renderBuild();
    });
});

function findItemTargetIndex(item) {
    const specialSlotIndex = getSpecialSlotIndex();

    if (isSpecialRoleItem(item)) {
        return build[specialSlotIndex] === null ? specialSlotIndex : -1;
    }

    const regularSlotCount = getRegularSlotCount();

    return build.slice(0, regularSlotCount).findIndex(slot => slot === null);
}

function getSpecialSlotIndex() {
    if (activeRole === "adc") {
        return 6;
    }

    if (activeRole === "support") {
        return 6;
    }

    return -1;
}

function getRegularSlotCount() {
    if (activeRole === "adc") {
        return 6;
    }

    if (activeRole === "support") {
        return 5;
    }

    return build.length;
}

function isSpecialRoleItem(item) {
    if (!item) {
        return false;
    }

    if (activeRole === "adc") {
        return isBootItem(item);
    }

    if (activeRole === "support") {
        return isSupportItem(item);
    }

    return false;
}

function isBootItem(item) {
    return item !== null && (item.tags || []).includes("Boots");
}
function isSupportItem(item) {
    return item !== null && SUPPORT_ITEM_IDS.has(String(item.id));
}

function isItemAllowedInSlot(item, slotIndex) {
    if (item === null) {
        return true;
    }

    const specialSlotIndex = getSpecialSlotIndex();

    if (specialSlotIndex === -1) {
        return true;
    }

    return slotIndex === specialSlotIndex
        ? isSpecialRoleItem(item)
        : !isSpecialRoleItem(item);
}
function renderBuild() {
    buildGrid.classList.toggle("has-special-slot", getSpecialSlotIndex() !== -1);

    slots.forEach((slot, index) => {
        const isAvailable = index < build.length && !(
            activeRole === "support" && index === 5
        );

        const isBootSlot = activeRole === "adc" && index === 6;
        const isSupportSlot = activeRole === "support" && index === 6;

        slot.innerHTML = "";
        slot.hidden = !isAvailable;
        slot.classList.toggle("boot-slot", isBootSlot);
        slot.classList.toggle("support-slot", isSupportSlot);
        slot.title = isBootSlot
            ? "ADC用ブーツ枠"
            : isSupportSlot
                ? "SUP用World Atlas系枠"
                : "";
        slot.setAttribute("draggable", isAvailable && build[index] !== null);

        if (!isAvailable) {
            return;
        }

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

function renderStatus(acquiredStats) {
    const acquiredList = document.getElementById("acquired-stats");
    const missingList = document.getElementById("missing-stats");

    acquiredList.innerHTML = "";
    missingList.innerHTML = "";

    JACK_STAT_LIST.forEach(stat => {
        const isAcquired = acquiredStats.includes(stat);
        const li = document.createElement("li");
        const icon = document.createElement("img");
        const label = document.createElement("span");

        li.className = isAcquired ? "stat-item acquired" : "stat-item missing";
        icon.className = "stat-icon";
        icon.src = `/static/images/stats/${STAT_ICONS[stat]}`;
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        label.textContent = stat;

        li.appendChild(icon);
        li.appendChild(label);

        if (isAcquired) {
            acquiredList.appendChild(li);
        } else {
            missingList.appendChild(li);
        }
    });
}