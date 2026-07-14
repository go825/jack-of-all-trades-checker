const fs = require("fs");
const path = require("path");
const vm = require("vm");

const cacheRoot = path.resolve(__dirname, "..", "cache");
const versionPattern = /^\d+\.\d+\.\d+$/;
const patchDirectories = fs.readdirSync(cacheRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && versionPattern.test(entry.name))
    .map(entry => entry.name)
    .sort(comparePatchVersions);

if (patchDirectories.length < 2) {
    console.error("監査には2パッチ分のcache/<patch>/items.jsonが必要です。");
    process.exit(1);
}

const [previousPatch, currentPatch] = patchDirectories.slice(-2);
const previousItems = readItems(previousPatch);
const currentItems = readItems(currentPatch);
const calculateJackStats = loadJackStatCalculator();
const previousById = new Map(previousItems.map(item => [String(item.id), item]));
const currentById = new Map(currentItems.map(item => [String(item.id), item]));
const added = currentItems.filter(item => !previousById.has(String(item.id)));
const removed = previousItems.filter(item => !currentById.has(String(item.id)));
const changed = currentItems.flatMap(item => {
    const previous = previousById.get(String(item.id));
    if (!previous) return [];
    const before = calculateJackStats([previous]).sort();
    const after = calculateJackStats([item]).sort();
    return JSON.stringify(before) === JSON.stringify(after)
        ? []
        : [{ id: item.id, name: item.name, before, after }];
});
const missingAliases = currentItems.filter(item => !(item.search_aliases || []).some(Boolean));
const report = {
    previous_patch: previousPatch,
    current_patch: currentPatch,
    added: added.map(summarizeItem),
    removed: removed.map(summarizeItem),
    jack_stat_changes: changed,
    missing_search_aliases: missingAliases.map(summarizeItem)
};
const reportPath = path.join(cacheRoot, currentPatch, "audit.json");

fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`監査結果: ${previousPatch} -> ${currentPatch}`);
console.log(`追加 ${added.length} / 削除 ${removed.length} / 判定変更 ${changed.length}`);
console.log(`読み仮名未生成 ${missingAliases.length}`);
console.log(`出力: ${reportPath}`);

function readItems(patch) {
    const itemPath = path.join(cacheRoot, patch, "items.json");
    if (!fs.existsSync(itemPath)) throw new Error(`${itemPath} が見つかりません。`);
    return JSON.parse(fs.readFileSync(itemPath, "utf8"));
}

function loadJackStatCalculator() {
    const stackPath = path.resolve(__dirname, "..", "static", "js", "stack.js");
    const source = fs.readFileSync(stackPath, "utf8");
    const context = {};
    vm.createContext(context);
    vm.runInContext(`${source}; this.calculateJackStats = calculateJackStats;`, context);
    return context.calculateJackStats;
}

function summarizeItem(item) {
    return { id: item.id, name: item.name };
}

function comparePatchVersions(left, right) {
    const leftParts = left.split(".").map(Number);
    const rightParts = right.split(".").map(Number);
    for (let index = 0; index < 3; index += 1) {
        if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
    }
    return 0;
}