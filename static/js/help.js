const helpButton = document.querySelector(".help-button");
const helpDialog = document.querySelector(".help-dialog");
const helpCloseButton = document.querySelector(".help-close-button");

helpButton.addEventListener("click", () => {
    helpDialog.showModal();
});

helpCloseButton.addEventListener("click", () => {
    helpDialog.close();
});

helpDialog.addEventListener("click", event => {
    const bounds = helpDialog.getBoundingClientRect();
    const isInside = event.clientX >= bounds.left && event.clientX <= bounds.right &&
        event.clientY >= bounds.top && event.clientY <= bounds.bottom;

    if (!isInside) {
        helpDialog.close();
    }
});