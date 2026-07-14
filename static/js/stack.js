const JACK_STAT_LIST = [
    "攻撃力",
    "魔力",
    "攻撃速度",
    "体力",
    "マナ",
    "物理防御",
    "魔法防御",
    "移動速度",
    "移動速度(%)",
    "クリティカル率",
    "スキルヘイスト",
    "射程",
    "物理防御貫通",
    "回復・シールド効果",
    "基本体力自動回復",
    "ライフスティール",
    "脅威",
    "魔法防御貫通",
    "魔法防御貫通(%)",
    "基本マナ自動回復",
    "オムニヴァンプ",
    "行動妨害耐性"
];

const STAT_ICONS = {
    "攻撃力": "attack-damage.png",
    "魔力": "ability-power.png",
    "攻撃速度": "attack-speed.png",
    "体力": "health.png",
    "マナ": "mana.png",
    "物理防御": "armor.png",
    "魔法防御": "magic-resist.png",
    "移動速度": "movement-speed.png",
    "移動速度(%)": "percent-movement-speed.png",
    "クリティカル率": "critical-strike.png",
    "スキルヘイスト": "ability-haste.png",
    "射程": "attack-range.png",
    "物理防御貫通": "armor-penetration.png",
    "回復・シールド効果": "heal-shield-power.png",
    "基本体力自動回復": "health-regen.png",
    "ライフスティール": "life-steal.png",
    "脅威": "lethality.png",
    "魔法防御貫通": "magic-penetration.png",
    "魔法防御貫通(%)": "percent-magic-penetration.png",
    "基本マナ自動回復": "mana-regen.png",
    "オムニヴァンプ": "omnivamp.png",
    "行動妨害耐性": "tenacity.png"
};

const STAT_RULES = {
    FlatPhysicalDamageMod: "攻撃力",
    FlatMagicDamageMod: "魔力",
    PercentAttackSpeedMod: "攻撃速度",
    FlatHPPoolMod: "体力",
    FlatMPPoolMod: "マナ",
    FlatArmorMod: "物理防御",
    FlatSpellBlockMod: "魔法防御",
    FlatMovementSpeedMod: "移動速度",
    PercentMovementSpeedMod: "移動速度(%)",
    FlatCritChanceMod: "クリティカル率"
};

const DESCRIPTION_STAT_RULES = [
    { label: "スキルヘイスト", matches: line => line.includes("スキルヘイスト") },
    { label: "射程", matches: line => line.includes("射程") },
    { label: "物理防御貫通", matches: line => line.includes("物理防御貫通") && line.includes("%") },
    { label: "回復・シールド効果", matches: line => line.includes("体力回復量とシールド量") },
    { label: "基本体力自動回復", matches: line => line.includes("基本体力自動回復") },
    { label: "ライフスティール", matches: line => line.includes("ライフ スティール") },
    { label: "脅威", matches: line => line.includes("脅威") },
    { label: "魔法防御貫通(%)", matches: line => line.includes("魔法防御貫通") && line.includes("%") },
    { label: "魔法防御貫通", matches: line => line.includes("魔法防御貫通") && !line.includes("%") },
    { label: "基本マナ自動回復", matches: line => line.includes("基本マナ自動回復") },
    { label: "オムニヴァンプ", matches: line => line.includes("オムニヴァンプ") },
    { label: "行動妨害耐性", matches: line => line.includes("行動妨害耐性") }
];

function calculateJackStats(build) {
    const stats = new Set();

    build.forEach(item => {
        if (item === null) {
            return;
        }

        const itemStats = item.stats || {};

        Object.entries(itemStats).forEach(([statKey, value]) => {
            const label = STAT_RULES[statKey];

            if (label && Number(value) > 0) {
                stats.add(label);
            }
        });

        const baseStatLines = getBaseStatLines(item.description);

        DESCRIPTION_STAT_RULES.forEach(rule => {
            if (baseStatLines.some(rule.matches)) {
                stats.add(rule.label);
            }
        });
    });

    return Array.from(stats);
}

function getBaseStatLines(description) {
    if (!description) {
        return [];
    }

    const statsSection = description.match(/<stats>([\s\S]*?)<\/stats>/i);

    if (statsSection === null) {
        return [];
    }

    return statsSection[1]
        .split(/<br\s*\/?\s*>/i)
        .map(line => line.replace(/<[^>]+>/g, "").trim())
        .filter(Boolean);
}

function hasBaseStat(description, statName) {
    return getBaseStatLines(description).some(line => line.includes(statName));
}