const ITEM_SEARCH_ALIASES = {
    "アトマの報い": ["あとまのむくい"],
    "ガストウォーカーの幼体": ["がすとうぉーかーのようたい"],
    "シュレリアの戦歌": ["しゅれりあのせんか"],
    "ショウジンの矛": ["しょうじんのほこ"],
    "スコーチクロウの幼体": ["すこーちくろうのようたい"],
    "ステラックの篭手": ["すてらっくのこて"],
    "セリルダの怨恨": ["せりるだのおんこん"],
    "ゾーニャの砂時計": ["ぞーにゃのすなどけい"],
    "トンネル掘り": ["とんねるほり"],
    "バンドルグラスの鏡": ["ばんどるぐらすのかがみ"],
    "フィーンドハンターの矢": ["ふぃーんどはんたーのや"],
    "フィンディッシュの古書": ["ふぃんでぃっしゅのこしょ"],
    "ブラッドレターの呪い": ["ぶらっどれたーののろい"],
    "ヘリアの残響": ["へりあのざんきょう"],
    "マルモティウスの胃袋": ["まるもてぃうすのいぶくろ"],
    "ミカエルの祝福": ["みかえるのしゅくふく"],
    "ムーンストーンの再生": ["むーんすとーんのさいせい"],
    "モスストンパーの幼体": ["もすすとんぱーのようたい"],
    "ライアンドリーの仮面": ["らいあんどりーのかめん"],
    "運命の灰": ["うんめいのはい"],
    "黄昏と暁": ["たそがれとあかつき"],
    "花咲く夜明けの剣": ["はなさくよあけのけん"],
    "輝きのモート": ["かがやきのもーと"],
    "騎士の誓い": ["きしのちかい"],
    "詰め替えポーション": ["つめかえぽーしょん"],
    "久遠のカタリスト": ["くおんのかたりすと"],
    "枯死の宝石": ["こしのほうせき"],
    "黒炎のトーチ": ["こくえんのとーち"],
    "再生の珠": ["さいせいのたま"],
    "砕けたアームガード": ["くだけたあーむがーど"],
    "至点のソリ": ["してんのそり"],
    "自然の力": ["しぜんのちから"],
    "実験的ヘクスプレート": ["じっけんてきへくすぷれーと"],
    "終わりなき飢え": ["おわりなきうえ"],
    "終わりなき絶望": ["おわりなきぜつぼう"],
    "女神の涙": ["めがみのなみだ"],
    "心の鋼": ["こころのはがね"],
    "真紅のアイオニア ブーツ": ["しんくのあいおにあぶーつ"],
    "星空のマント": ["ほしぞらのまんと"],
    "赤月の刃": ["せきげつのやいば"],
    "装甲強化の進撃": ["そうこうきょうかのしんげき"],
    "増魔の書": ["ぞうまのしょ"],
    "体力ポーション": ["たいりょくぽーしょん"],
    "偵察兵のパチンコ": ["ていさつへいのぱちんこ"],
    "帝国の指令": ["ていこくのしれい"],
    "天帝の剣": ["てんていのけん"],
    "冬の訪れ": ["ふゆのおとずれ"],
    "毒蛇の牙": ["どくじゃのきば"],
    "肉喰らう者": ["にくくらうもの"],
    "覇王のブラッドメイル": ["はおうのぶらっどめいる"],
    "悲愴な仮面": ["ひそうなかめん"],
    "不死身の大王の王冠": ["ふじみのだいおうのおうかん"],
    "不滅の道": ["ふめつのみち"],
    "変幻自在のジャック＝ショー": ["へんげんじざいのじゃっくしょー"],
    "帽子ジュース": ["ぼうしじゅーす"],
    "忘却のオーブ": ["ぼうきゃくのおーぶ"],
    "妖夢の霊剣": ["ようむのれいけん"],
    "翼のムーンプレート": ["つばさのむーんぷれーと"],
    "冷酷な一撃": ["れいこくないちげき"],
    "連呪使いのブーツ": ["れんじゅつかいのぶーつ"],
    "囁きのサークレット": ["ささやきのさーくれっと"]
};

const itemSearchInput = document.getElementById("item-search");
const missingStatFilterButton = document.getElementById("missing-stat-filter");
const statFilters = document.getElementById("stat-filters");
const itemList = document.querySelector(".item-list");
const searchableItemCards = document.querySelectorAll(".item-card");
const selectedStats = new Set();
let showMissingStats = false;

const searchableItems = Array.from(searchableItemCards, (card, originalIndex) => {
    const item = JSON.parse(card.dataset.item);
    const aliases = ITEM_SEARCH_ALIASES[item.name] || [];

    return {
        card,
        item,
        originalIndex,
        normalizedSearchText: [item.name, ...aliases]
            .map(normalizeSearchText)
            .join(" "),
        stats: new Set(calculateJackStats([item]))
    };
});

renderStatFilters();
itemSearchInput.addEventListener("input", applyItemFilters);
itemSearchInput.addEventListener("compositionend", applyItemFilters);
missingStatFilterButton.addEventListener("click", () => {
    showMissingStats = !showMissingStats;
    selectedStats.clear();
    updateFilterButtons();
    applyItemFilters();
});
document.addEventListener("jackstatschange", applyItemFilters);

function renderStatFilters() {
    JACK_STAT_LIST.forEach(stat => {
        const button = document.createElement("button");
        const icon = document.createElement("img");
        const label = document.createElement("span");

        button.className = "stat-filter";
        button.type = "button";
        button.dataset.stat = stat;
        button.hidden = !searchableItems.some(({ stats }) => stats.has(stat));
        button.setAttribute("aria-pressed", "false");
        icon.src = `/static/images/stats/${STAT_ICONS[stat]}`;
        icon.alt = "";
        icon.setAttribute("aria-hidden", "true");
        label.textContent = stat;
        button.append(icon, label);
        button.addEventListener("click", () => {
            if (selectedStats.has(stat)) {
                selectedStats.delete(stat);
            } else {
                selectedStats.add(stat);
            }
            showMissingStats = false;
            updateFilterButtons();
            applyItemFilters();
        });
        statFilters.appendChild(button);
    });
}

function updateFilterButtons() {
    missingStatFilterButton.classList.toggle("active", showMissingStats);
    missingStatFilterButton.setAttribute("aria-pressed", String(showMissingStats));

    statFilters.querySelectorAll(".stat-filter").forEach(button => {
        const isActive = selectedStats.has(button.dataset.stat);
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

function applyItemFilters() {
    const query = normalizeSearchText(itemSearchInput.value);
    const acquiredStats = new Set(window.currentJackStats || []);

    searchableItems.forEach(({ card, normalizedSearchText, stats }) => {
        const matchesSearch = normalizedSearchText.includes(query);
        const matchesSelectedStats = Array.from(selectedStats).every(stat => stats.has(stat));
        const matchesMissingStats = !showMissingStats || Array.from(stats).some(
            stat => !acquiredStats.has(stat)
        );

        card.hidden = !matchesSearch || !matchesSelectedStats || !matchesMissingStats;
    });

    sortItemCards();
}

function sortItemCards() {
    const hasActiveFilter = normalizeSearchText(itemSearchInput.value) !== "" ||
        selectedStats.size > 0 ||
        showMissingStats;
    const orderedItems = [...searchableItems].sort((left, right) => {
        if (!hasActiveFilter) {
            return left.originalIndex - right.originalIndex;
        }

        const priceDifference = (left.item.gold?.total || 0) - (right.item.gold?.total || 0);
        return priceDifference || left.originalIndex - right.originalIndex;
    });

    orderedItems.forEach(({ card }) => itemList.appendChild(card));
}

function normalizeSearchText(value) {
    return String(value || "")
        .normalize("NFKC")
        .toLocaleLowerCase("ja-JP")
        .replace(/[ァ-ヶ]/g, character =>
            String.fromCharCode(character.charCodeAt(0) - 0x60)
        )
        .trim();
}