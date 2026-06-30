const STAT_RULES = {
    FlatPhysicalDamageMod: "攻撃力",
    FlatMagicDamageMod: "魔力",
    PercentAttackSpeedMod: "攻撃速度",
    FlatHPPoolMod: "体力",
    FlatMPPoolMod: "マナ",
    FlatArmorMod: "物理防御",
    FlatSpellBlockMod: "魔法防御",
    PercentMovementSpeedMod: "移動速度",
    FlatMovementSpeedMod: "移動速度",
    FlatCritChanceMod: "クリティカル率"
};

function calculateJackStats(build) {
    const stats = new Set();

    build.forEach(item => {
        if (item === null) {
            return;
        }

        const itemStats = item.stats || {};

        Object.keys(itemStats).forEach(statKey => {
            const label = STAT_RULES[statKey];

            if (label) {
                stats.add(label);
            }
        });
    });

    return Array.from(stats);
}