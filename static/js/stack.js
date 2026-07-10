const JACK_STAT_LIST = [
    "攻撃力",
    "魔力",
    "攻撃速度",
    "体力",
    "マナ",
    "物理防御",
    "魔法防御",
    "移動速度",
    "クリティカル率",
    "スキルヘイスト"
];

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

        if (hasBaseStat(item.description, "スキルヘイスト")) {
            stats.add("スキルヘイスト");
        }
    });

    return Array.from(stats);
}

function hasBaseStat(description, statName) {
    if (!description) {
        return false;
    }

    const statsSection = description.match(
        /<stats>([\s\S]*?)<\/stats>/i
    );

    return (
        statsSection !== null &&
        statsSection[1].includes(statName)
    );
}