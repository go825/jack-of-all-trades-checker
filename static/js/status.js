function updateJackOfAllTrades(build) {
    const jackStats = calculateJackStats(build);

    renderStack(jackStats.length);
    renderStatus(jackStats);

    console.log("何でも屋ステータス:", jackStats);
}

function renderStack(stackCount) {
    const countElement = document.getElementById("stack-count");
    const stackBoxes = document.querySelectorAll(".stack-box");
    const cappedCount = Math.min(stackCount, 10);

    countElement.textContent = `${cappedCount} / 10`;

    stackBoxes.forEach((box, index) => {
        box.classList.toggle("active", index < cappedCount);
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

        li.append(icon, label);
        (isAcquired ? acquiredList : missingList).appendChild(li);
    });
}