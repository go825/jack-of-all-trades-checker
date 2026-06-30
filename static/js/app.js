const build = new Array(7).fill(null);

const slots = document.querySelectorAll(".item-slot");
const items = document.querySelectorAll(".item-card");

items.forEach(item => {

    item.addEventListener("click", () => {

        const image = item.dataset.image;

        const firstEmpty = build.findIndex(i => i === null);

        if (firstEmpty === -1) {
            alert("Buildがいっぱいです");
            return;
        }

        build[firstEmpty] = image;

        renderBuild();

    });

});


function renderBuild(){

    slots.forEach((slot,index)=>{

        slot.innerHTML="";

        if(build[index]){

            const img=document.createElement("img");

            img.src=build[index];

            img.width=48;
            img.height=48;

            slot.appendChild(img);

        }

    });

}