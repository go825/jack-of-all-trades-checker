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
const classFilterButtons = document.querySelectorAll(".class-filter");
let selectedCategory = "all";
const searchableItemCards = document.querySelectorAll(".item-card");

const searchableItems = Array.from(searchableItemCards).map(card => {
    const item = JSON.parse(card.dataset.item);

    const aliases = ITEM_SEARCH_ALIASES[item.name] || [];

    return {
        card,
        normalizedSearchText: [item.name, ...aliases]
            .map(normalizeSearchText)
            .join(" "),
        shopClass: item.shop_class || null
    };
});

itemSearchInput.addEventListener("input", applyItemFilters);
itemSearchInput.addEventListener("compositionend", applyItemFilters);

classFilterButtons.forEach(button => {
    button.addEventListener("click", () => {
        const category = button.dataset.category;

        selectedCategory = selectedCategory === category ? "all" : category;

        classFilterButtons.forEach(filterButton => {
            const isActive = filterButton.dataset.category === selectedCategory;
            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute("aria-pressed", String(isActive));
        });

        applyItemFilters();
    });
});

function applyItemFilters() {
    const query = normalizeSearchText(itemSearchInput.value);
    const category = selectedCategory;

    searchableItems.forEach(({ card, normalizedSearchText, shopClass }) => {
        const matchesSearch = normalizedSearchText.includes(query);
        const matchesCategory = category === "all" || shopClass === category;

        card.hidden = !matchesSearch || !matchesCategory;
    });
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