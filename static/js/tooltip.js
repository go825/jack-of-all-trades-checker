const tooltip = document.createElement("div");
tooltip.className = "item-tooltip";
tooltip.setAttribute("role", "tooltip");
tooltip.hidden = true;
document.body.appendChild(tooltip);

const TOOLTIP_ALLOWED_TAGS = new Set([
    "MAINText", "STATS", "ATTENTION", "PASSIVE", "ACTIVE",
    "MAGICDAMAGE", "PHYSICALDAMAGE", "TRUEDAMAGE", "HEALING",
    "SHIELD", "SPEED", "STATUS", "RULES", "BR"
].map(tag => tag.toUpperCase()));

const tooltipItemCards = document.querySelectorAll(".item-card");
const tooltipItemsById = new Map(
    Array.from(tooltipItemCards, card => {
        const item = JSON.parse(card.dataset.item);
        return [String(item.id), item];
    })
);
const MOBILE_TOOLTIP_DURATION = 5000;
const mobileTooltipQuery = window.matchMedia("(hover: none), (pointer: coarse)");
let mobileTooltipTimer = null;

window.addEventListener("scroll", () => {
    if (!tooltip.hidden) {
        hideItemTooltip();
    }
}, { passive: true });

tooltipItemCards.forEach(card => {
    card.addEventListener("mouseenter", event => {
        const item = tooltipItemsById.get(String(JSON.parse(card.dataset.item).id));
        renderItemTooltip(item);
        tooltip.hidden = false;
        positionItemTooltip(event.clientX, event.clientY);
        scheduleMobileTooltipHide();
    });

    card.addEventListener("mousemove", event => {
        positionItemTooltip(event.clientX, event.clientY);
    });

    card.addEventListener("mouseleave", hideItemTooltip);
});

function renderItemTooltip(item) {
    tooltip.replaceChildren();

    const header = document.createElement("div");
    header.className = "item-tooltip-header";

    const image = document.createElement("img");
    image.src = item.image.url;
    image.alt = "";

    const titleArea = document.createElement("div");
    const name = document.createElement("div");
    name.className = "item-tooltip-name";
    name.textContent = item.name;

    const price = document.createElement("div");
    price.className = "item-tooltip-price";
    price.textContent = `${item.gold?.total ?? 0} ゴールド`;

    titleArea.append(name, price);
    header.append(image, titleArea);

    const description = document.createElement("div");
    description.className = "item-tooltip-description";
    description.append(sanitizeItemDescription(item.description));

    tooltip.append(header, description);

    const recipe = createRecipeSection(item);
    if (recipe !== null) {
        tooltip.appendChild(recipe);
    }
}

function createRecipeSection(item) {
    const sourceIds = item.from || [];
    if (sourceIds.length === 0) {
        return null;
    }

    const materials = sourceIds
        .map(sourceId => tooltipItemsById.get(String(sourceId)))
        .filter(Boolean);
    if (materials.length === 0) {
        return null;
    }

    const section = document.createElement("div");
    section.className = "item-tooltip-recipe";
    const title = document.createElement("div");
    title.className = "item-tooltip-recipe-title";
    title.textContent = "合成ツリー";
    const tree = document.createElement("div");
    tree.className = "item-tooltip-recipe-tree";
    const core = createRecipeItem(item, "core");
    const branches = document.createElement("div");
    branches.className = "item-tooltip-recipe-branches";

    materials.forEach(material => {
        branches.appendChild(createRecipeItem(material, "material"));
    });

    tree.append(core, branches);
    section.append(title, tree);
    return section;
}

function createRecipeItem(item, type) {
    const itemElement = document.createElement("div");
    itemElement.className = `item-tooltip-recipe-item ${type}`;
    const image = document.createElement("img");
    image.src = item.image.url;
    image.alt = "";
    const name = document.createElement("span");
    name.textContent = item.name;

    itemElement.append(image, name);
    return itemElement;
}
function sanitizeItemDescription(description) {
    const documentFragment = document.createDocumentFragment();
    const parsed = new DOMParser().parseFromString(description || "", "text/html");

    Array.from(parsed.body.childNodes).forEach(node => {
        documentFragment.append(sanitizeTooltipNode(node));
    });

    return documentFragment;
}

function sanitizeTooltipNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
        return document.createTextNode(node.textContent);
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
        return document.createDocumentFragment();
    }

    const fragment = document.createDocumentFragment();
    const children = Array.from(node.childNodes).map(sanitizeTooltipNode);

    if (!TOOLTIP_ALLOWED_TAGS.has(node.tagName)) {
        fragment.append(...children);
        return fragment;
    }

    const safeElement = document.createElement(node.tagName.toLowerCase());
    safeElement.append(...children);
    return safeElement;
}

function positionItemTooltip(cursorX, cursorY) {
    const gap = 16;
    const bounds = tooltip.getBoundingClientRect();
    let left = cursorX + gap;
    let top = cursorY + gap;

    if (left + bounds.width > window.innerWidth - gap) {
        left = cursorX - bounds.width - gap;
    }

    if (top + bounds.height > window.innerHeight - gap) {
        top = cursorY - bounds.height - gap;
    }

    tooltip.style.left = `${Math.max(gap, left)}px`;
    tooltip.style.top = `${Math.max(gap, top)}px`;
}

function hideItemTooltip() {
    clearTimeout(mobileTooltipTimer);
    mobileTooltipTimer = null;
    tooltip.hidden = true;
}

function scheduleMobileTooltipHide() {
    clearTimeout(mobileTooltipTimer);
    mobileTooltipTimer = null;

    if (mobileTooltipQuery.matches) {
        mobileTooltipTimer = setTimeout(hideItemTooltip, MOBILE_TOOLTIP_DURATION);
    }
}
