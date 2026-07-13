const BUILD_STORAGE_KEY = "jack-of-all-trades-checker:builds:v1";
const ROLE_BUILD_LENGTHS = { top: 6, jungle: 6, mid: 6, adc: 7, support: 7 };

function loadBuildState(defaultRoleBuilds, defaultRole) {
    try {
        const savedState = JSON.parse(localStorage.getItem(BUILD_STORAGE_KEY));
        if (!savedState || typeof savedState !== "object") return { roleBuilds: defaultRoleBuilds, activeRole: defaultRole };
        const restoredBuilds = {};
        for (const [role, length] of Object.entries(ROLE_BUILD_LENGTHS)) {
            const savedBuild = savedState.roleBuilds?.[role];
            restoredBuilds[role] = Array.isArray(savedBuild) && savedBuild.length === length
                ? savedBuild.map(item => isSavedItem(item) ? item : null)
                : defaultRoleBuilds[role];
        }
        const activeRole = Object.hasOwn(ROLE_BUILD_LENGTHS, savedState.activeRole) ? savedState.activeRole : defaultRole;
        return { roleBuilds: restoredBuilds, activeRole };
    } catch (error) {
        console.warn("保存済みビルドを読み込めませんでした。", error);
        return { roleBuilds: defaultRoleBuilds, activeRole: defaultRole };
    }
}

function saveBuildState(roleBuilds, activeRole) {
    try {
        localStorage.setItem(BUILD_STORAGE_KEY, JSON.stringify({ roleBuilds, activeRole }));
    } catch (error) {
        console.warn("ビルドを保存できませんでした。", error);
    }
}

function isSavedItem(item) {
    return item === null || (typeof item === "object" && item !== null &&
        (typeof item.id === "string" || typeof item.id === "number") &&
        typeof item.name === "string" && typeof item.image?.url === "string");
}
