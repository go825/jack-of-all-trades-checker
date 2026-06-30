const build = new Array(7).fill(null);

const slots = document.querySelectorAll(".item-slot");
const items = document.querySelectorAll(".item-card");

items.forEach(item => {
    item.addEventListener("click", () => {
        const firstEmpty = build.findIndex(slot => slot === null);

        if (firstEmpty === -1) {
            alert("Buildがいっぱいです");
            return;
        }

        build[firstEmpty] = {
            id: item.dataset.id,
            name: item.dataset.name,
            image: item.dataset.image
        };

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
});

function renderBuild() {
    slots.forEach((slot, index) => {
        slot.innerHTML = "";

        const item = build[index];

        if (item === null) {
            return;
        }

        const img = document.createElement("img");
        img.src = item.image;
        img.alt = item.name;
        img.title = item.name;
        img.width = 48;
        img.height = 48;

        slot.appendChild(img);
    });
}