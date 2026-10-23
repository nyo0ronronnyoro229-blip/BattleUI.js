//=============================================================================
// BattleUI.js
//=============================================================================
/*:
 * @target MZ
 * @plugindesc v2.3.1 戦闘UI統合：ステータス／アクターコマンド／UIエディタ（UIエディタ中心設計）／SAN・AMMO表示
 * @author nyoro
 * @orderAfter AimMinigame
 * @orderAfter BattleUI_Timing
 *
 * @help BattleUI.js
 * ============================================================================
 * 【このプラグインについて】
 * ============================================================================
 * 戦闘UIを1つにまとめた統合プラグインです。
 *   1) キャラクター別ステータス（Actor1〜Actor4）
 *   2) アクターコマンド（必殺技／アイテム／逃げる）
 *   3) 戦闘UIエディタ（位置・サイズ・表示/非表示・画像を戦闘中に編集して保存）
 *   4) SAN／AMMOなどの表示（AimMinigame.js から移動した描画処理）
 *
 * 旧 BattleUI_Core / BattleUI_Command / BattleUI_Editor は二重に動作するため、
 * プラグイン管理で必ず「OFF（または削除）」にしてください。
 *
 * ============================================================================
 * 【導入順序】
 * ============================================================================
 *   AimMinigame → BattleUI_Timing → BattleUI
 *   ※ AimMinigame が無い場合、SAN／AMMOの表示は行いません。
 *
 * ============================================================================
 * 【v2.0.0 の設計方針：UIエディタが設定の中心】
 * ============================================================================
 * 位置・サイズ・表示/非表示・画像は、プラグインパラメータではなく
 * 戦闘中の「UIエディタ」で設定します。優先順位は次の通りです。
 *
 *   UIエディタの保存データ（config.rpgsave）
 *     ↓ なければ
 *   UIエディタの初期状態（標準の配置。旧パラメータの値があれば、それを初期値に使用）
 *     ↓
 *   必要最低限のプラグインパラメータ
 *
 * ・旧バージョンの位置/サイズ系パラメータ（CommandX/Y/Width/Height、
 *   キャラクターA〜Dの PanelX/Y・幅・高さ・FaceX/Y・FaceScale・HP/SAN/AMMO座標、
 *   NameWidth・MpBarWidth/Height など）は、画面からは削除しましたが、
 *   既存プロジェクトの保存値は「初期値」として読み込みます（互換性維持）。
 * ・保存データ（UIエディタ）が存在する要素は、常に保存データが優先されます。
 * ・EnableEditor がOFFでも、保存済みの配置は反映されます（編集機能だけが無効）。
 *
 * ============================================================================
 * 【UIエディタの編集対象（IDで管理）】
 * ============================================================================
 *  ActorStatus（Actor1_ 〜 Actor4_。実際のパーティ人数分のみ）
 *   Panel   … 背景（動かすとそのキャラのUI全体が一緒に動きます）
 *             ★「表示ON/OFF」をOFFにすると、そのキャラのステータス全体が非表示
 *   Face    … 顔グラフィック（幅・高さで拡大縮小）
 *   Name    … 名前
 *   HP      … HPバー＋HPテキストを一体にした1つの編集対象（一緒に移動・拡縮）
 *   SAN     … SANバー＋SANテキストを一体にした1つの編集対象（AimMinigame導入時）
 *   Ammo    … AMMO表示（AimMinigame導入時）。幅・高さ＝実際の表示領域。文字の大きさは
 *             高さに合わせて拡縮し、幅に収まるよう自動で縮めます（切れません）。
 *             通常戦闘もUIエディタも同じ描画処理です（編集専用の表示はありません）。
 *             不要なキャラは Visible を OFF にしてください。
 *   ※ このUIにMPバー／MPテキストはありません（BattleUI上ではMPを表示しません。
 *      ゲーム本体のMPやスキルのMP消費には一切影響しません）。
 *
 *  ActorCommand
 *   ActorCommand_Background … コマンド背景（動かすと3つのボタンも一緒に動きます）
 *   ActorCommand_Skill      … 必殺技ボタン
 *   ActorCommand_Item       … アイテムボタン
 *   ActorCommand_Escape     … 逃げるボタン
 *   ※ 3つのボタンは画面上の好きな場所・好きな大きさに配置できます。
 *   ※ 画像を設定しない場合は、従来のウィンドウ表示（枠＋文字）になります。
 *
 *  Command Lists（戦闘中の一覧ウィンドウ）
 *   SkillList … 必殺技／攻撃など、スキルを選んだ後に出る一覧
 *   ItemList  … アイテムを選んだ後に出る一覧
 *   ※ 編集中は両方を表示します。位置・サイズ・背景画像を変更でき、実際の
 *      ウィンドウに反映されます（画像未設定なら標準ウィンドウ表示）。
 *
 *  すべての編集対象で X / Y / Width / Height / 表示ON/OFF を変更できます
 *  （SkillList / ItemList は、操作できなくなるため表示OFFにできません）。
 *
 * ============================================================================
 * 【画像の設定（UIエディタ内・ファイル名入力）】
 * ============================================================================
 *  設定パネルの [Image] ボタンで対象を切り替え、下の欄をクリックして
 *  ファイル名（拡張子なし）を入力し、Enter で確定します。空にして Enter で解除。
 *   ・Status Panel BG … アクターステータスPanel背景（4人共通の1枚。img/pictures）
 *   ・Command BG      … アクターコマンド背景（img/pictures）
 *   ・Button Normal   … ボタン通常画像（3つのボタン共通。img/pictures）
 *   ・Button Selected … ボタン選択中画像（カーソルが乗ったボタンだけ切り替わる）
 *   ・Skill List BG   … スキル一覧の背景（img/pictures）
 *   ・Item List BG    … アイテム一覧の背景（img/pictures）
 *   ・色は次の5種類が完全に独立しています（すべて全キャラ共通）。
 *       HP Bar Color / SAN Bar Color … HP／SANバーの塗り色
 *       HP Text Color / SAN Text Color … HP／SANのラベル・数値文字
 *       Ammo Text Color … AMMOのラベル・数値文字
 *     #RRGGBB（#なし・3桁・小文字も可。内部では #RRGGBB に正規化）を入力して Enter。
 *     不正な値は「Invalid color」として拒否し、今の色は変わりません。
 *     空にして Enter で標準色（AimMinigameの設定色）に戻ります。
 *  ※ 画像は img/pictures/ に置いてください。存在しないファイル名は入力時に
 *    確認して拒否します（読み込みエラーでゲームが止まるのを防ぎます）。
 *  ※ 画像を未設定にすると、従来の表示（黒背景／標準ウィンドウ）に戻ります。
 *  ※ 画像設定はプラグインパラメータには存在しません（二重管理を避けるため）。
 *    旧「背景画像」パラメータに値があった場合のみ、ステータス背景の初期値に使います。
 *  ※ 文字入力はキーボードの半角文字のみ対応です（日本語入力不可）。
 *
 * ============================================================================
 * 【ステータス表示について】
 * ============================================================================
 *  ・HPバー／SANバー … AimMinigame が拡張した Sprite_Gauge（SAN値、表示名、
 *    ゲージ色、フォント、文字色）を継承して使用します。
 *  ・AMMO表示 … 値は AimMinigame の ammo()/maxAmmo() を読み取るだけです（変更しません）。
 *    表示名・色・フォントの既定値は AimMinigame の既存パラメータに従い、描画はBattleUI側
 *    で行います（drawAmmoNumber は標準ステータス窓用にそのまま残しています）。
 *    AMMOの増減は通常戦闘中もすぐ反映されます。
 *  ・表示のON/OFF … UIエディタの Visible が唯一の設定です（HP／SAN／AMMO。AimMinigame
 *    の「HP表示」「SANゲージ」「弾数」パラメータは標準ステータス窓用で、ここには影響しません）。
 *  ・ステータスはWindowではなくSpriteで描画します（画面全体のWindowを重ねると、
 *    MZのWindowLayerの仕様で下のWindowが隠れ、1人しか表示されなくなるため）。
 *    ステータスはウィンドウ層の下に表示されます（ウィンドウは常に手前）。
 *  ・「標準ステータスウィンドウを隠す」がONなら、MZ標準の Window_BattleStatus を
 *    非表示にします。
 *  ・味方選択ウィンドウ(Window_BattleActor)は、操作（カーソル移動・決定・キャンセル・タッチ）
 *    は標準のままですが、見た目は描画しません（v2.3.0）。標準では Window_BattleActor が
 *    Window_BattleStatus を継承しているため、味方ターゲット選択のたびに標準カード
 *    （TPバー付き）がUIパネルの上に重なって表示されていました。現在は選択中のパネルを
 *    BattleUIのパネル自身が枠で強調表示します（レイアウト・AMMO・画像は一切触りません）。
 *  ・v2.3.1：味方選択画面でゲームが停止する不具合を修正。MZ標準の Window_Selectable の
 *    isOpenAndActive() は「非表示のウィンドウは入力を受け付けない」ため、見た目を隠していた
 *    味方選択ウィンドウがカーソル移動・決定・キャンセル・タッチのすべてを受け付けず、
 *    しかし active のままで戦闘が進行しない状態になっていました。味方選択ウィンドウに限り、
 *    BattleUIが表示を担当している間は「非表示でも入力を受け付ける」ようにしました。
 *
 * ============================================================================
 * 【アクターコマンドについて】
 * ============================================================================
 *  ・必殺技 → MZ標準のスキル選択／アイテム → MZ標準のアイテム選択／
 *    逃げる → MZ標準の逃走処理（BattleManager.processEscape）。
 *  ・スキルタイプID／列数／文字サイズ／背景透明度／パーティコマンド省略は
 *    従来通りパラメータで設定します（列数は初期配置の並びに使います）。
 *  ・キーボード：↑↓で移動（列数1のときは←→も移動）、決定／キャンセルは標準通り。
 *  ・タッチ：各ボタンの範囲をタッチして選択／決定。
 *  ・ターン制で2人目以降が「逃げる」に失敗した場合の扱いは標準仕様のままです。
 *
 * ============================================================================
 * 【UIエディタの使い方】
 * ============================================================================
 *  1. 「UIエディタを有効化」をONにする（OFFの間は編集機能は表示されません）
 *  2. 戦闘を開始する
 *  3. 画面右上の [UI EDITOR] ボタン、または開始キー（初期値 F7）で編集モードへ
 *  4. 動かしたいUIをクリックして選択（白い枠と SELECTED 表示）
 *  5. ドラッグで移動／W・H欄や＋－でサイズ変更／Vis で表示ON/OFF
 *  6. [Save] で保存 → [Close] で通常の戦闘へ戻る
 *
 *  ・クリック／タッチ … UIを選択
 *  ・ドラッグ … 選択中のUIを移動
 *  ・重なっている場所をクリック … 候補一覧から選択（右クリックで常に候補一覧）
 *  ・X / Y / W / H 欄をクリック → 数字キー → Enter で直接入力
 *      （Escで取消、Backspaceで1文字削除、マイナスはX/Yの先頭のみ）
 *  ・- / + / ← → ↑ ↓ … 微調整（Stepで 1 / 5 / 10 を切替）
 *  ・キーボードの矢印キー … 選択中のUIを微調整
 *  ・Prev / Next … UIを順番に選択
 *  ・Dock … 設定パネルを右端／左端に切り替え
 *  ・Save … 保存／Reset … 初期状態へ戻す（確認あり）／Close … 終了
 *  ・編集モード中は、ボタンをクリックしてもゲーム側のコマンドは実行されません
 *    （UI編集が最優先。戦闘の進行も一時停止します）。
 *
 * ============================================================================
 * 【座標・サイズ・保存】
 * ============================================================================
 *  ・座標はすべて「ゲーム画面の左上を(0,0)とした画面座標」です。
 *  ・サイズの最小値：コマンド系・Panel・Face は 32、バー系などは要素ごとに設定。
 *  ・UIが完全に画面外へ消えないよう、移動範囲を制限しています。
 *  ・保存先は ConfigManager（config.rpgsave）。ゲーム本編のセーブデータには
 *    何も保存しません。保存形式の例：
 *      battleUILayout = { w, h, items: { "ActorCommand_Skill": {x,y,width,height} },
 *                         images: { ... } }
 *  ・初期状態と同じ要素は保存されません（Resetで初期状態へ戻ります）。
 *  ・保存時の画面サイズも記録し、画面サイズが変わった場合は座標とサイズを
 *    比率に合わせて自動的に拡縮します（すべての要素で共通の処理）。
 *  ・旧バージョンの保存データ（Actor?_Image など）も読み込めます。
 *
 * ============================================================================
 * 【注意】
 * ============================================================================
 *  ・編集モード中は戦闘の進行を一時停止します。
 *  ・タイミングゲーム中は編集モードを開けません。
 *  ・BattleUI_Timing が window.BattleUI.suppress.core を立てている間は、
 *    ステータスを非表示にします（従来通り）。
 *
 * @param HideStandardStatusWindow
 * @text 標準ステータスウィンドウを隠す
 * @desc ONにすると、MZ標準の戦闘ステータスウィンドウを非表示にします（このプラグインのステータスのみ表示）。
 * @type boolean
 * @on 隠す
 * @off 隠さない
 * @default true
 *
 * @param HideWhileMessage
 * @text メッセージ表示中はステータスを隠す
 * @desc ONにすると、メッセージウィンドウ表示中はステータスを隠します（標準のステータスウィンドウと同じ挙動）。
 * @type boolean
 * @default true
 *
 * @param CharacterA
 * @text キャラクターA（顔グラ上書き・任意）
 * @desc 位置・サイズ・表示・画像はUIエディタで設定します。ここは顔グラフィックを上書きしたい場合のみ。
 * @type struct<CharacterPanel>
 * @default {"FaceImage":"","FaceIndex":"0"}
 *
 * @param CharacterB
 * @text キャラクターB（顔グラ上書き・任意）
 * @type struct<CharacterPanel>
 * @default {"FaceImage":"","FaceIndex":"0"}
 *
 * @param CharacterC
 * @text キャラクターC（顔グラ上書き・任意）
 * @type struct<CharacterPanel>
 * @default {"FaceImage":"","FaceIndex":"0"}
 *
 * @param CharacterD
 * @text キャラクターD（顔グラ上書き・任意）
 * @type struct<CharacterPanel>
 * @default {"FaceImage":"","FaceIndex":"0"}
 *
 * @param SkillName
 * @text 必殺技の表示名
 * @type string
 * @default 必殺技
 *
 * @param ItemName
 * @text アイテムの表示名
 * @type string
 * @default アイテム
 *
 * @param EscapeName
 * @text 逃げるの表示名
 * @type string
 * @default 逃げる
 *
 * @param SkillTypeId
 * @text 必殺技のスキルタイプID
 * @desc 0＝アクターが持つ最初のスキルタイプ。1以上＝そのスキルタイプIDのスキル一覧を開きます。
 * @type number
 * @min 0
 * @default 0
 *
 * @param CommandCols
 * @text 列数（初期配置用）
 * @desc ボタンの初期配置の列数。以後の位置・サイズはUIエディタで設定します。
 * @type number
 * @min 1
 * @max 3
 * @default 1
 *
 * @param CommandFontSize
 * @text 文字サイズ
 * @type number
 * @min 8
 * @max 100
 * @default 28
 *
 * @param CommandBackOpacity
 * @text 背景透明度（画像未設定時）
 * @desc 標準のウィンドウ背景の不透明度（0＝完全に透明 ～ 255＝不透明）。MZ標準は192です。
 * @type number
 * @min 0
 * @max 255
 * @default 192
 *
 * @param SkipPartyCommand
 * @text パーティコマンドを省略する
 * @desc ONにすると、ターン制戦闘の「戦う／逃げる」を表示せず、直接アクターコマンドを表示します。
 * @type boolean
 * @on 省略する
 * @off 省略しない
 * @default true
 *
 * @param EnableEditor
 * @text UIエディタを有効化
 * @desc ONの時だけ、戦闘画面に編集ボタンが表示され、開始キーも有効になります。
 * @type boolean
 * @on 有効
 * @off 無効
 * @default false
 *
 * @param OpenKey
 * @text 編集モード開始キー
 * @desc 編集モードを開閉するキー。例：F7 / U / Tab / Home / End / Delete / Insert。F5・F8・F9はツクール側で使われます。
 * @type string
 * @default F7
 *
 * @param ShowEditorButton
 * @text 編集ボタンを表示
 * @desc ONにすると、UIエディタ有効時に戦闘画面の右上へ [UI EDITOR] ボタンを表示します。
 * @type boolean
 * @on 表示する
 * @off 表示しない（キーのみ）
 * @default true
 *
 * @param ShowName
 * @text キャラクター名を表示（機能ON/OFF）
 * @type boolean
 * @on 表示する
 * @off 表示しない
 * @default true
 *
 * @param NameFontSize
 * @text 名前の文字サイズ
 * @type number
 * @min 8
 * @max 60
 * @default 16
 */
/*~struct~CharacterPanel:
 * @param FaceImage
 * @text 顔グラフィック画像（任意）
 * @desc 空欄ならアクターのデータベース設定の顔グラフィックを使用します。指定した場合はこの画像とインデックスを使用します（img/faces）。
 * @type file
 * @dir img/faces
 * @default
 *
 * @param FaceIndex
 * @text 顔グラフィックのインデックス
 * @desc 「顔グラフィック画像」を指定した場合のみ使用（0〜7）。
 * @type number
 * @min 0
 * @max 7
 * @default 0
 */

//##############################################################################
// 1) AimMinigame.js から移動：SAN／AMMOなどの戦闘UI表示
//##############################################################################

(() => {
"use strict";

//==================================================================
// 【AimMinigame.js から移動】SAN／AMMO などの戦闘UI表示
// ----------------------------------------------------------------
// 以下のコードは AimMinigame.js から「そのまま移動」したものです。
// 処理内容は変更していません。パラメータ（ShowSanGauge・AmmoName・
// StatusFontFace・BattleCard* など）の定義は従来どおり AimMinigame 側に
// 残してあり、ここから読み取ります（設定値の引っ越しは不要）。
// AimMinigame（SAN／AMMO機能）が無い場合は何もしません。
//==================================================================

if (typeof Game_BattlerBase.prototype.san !== "function" ||
    typeof Game_BattlerBase.prototype.ammo !== "function") {
    console.warn("[BattleUI] AimMinigame のSAN／AMMO機能が見つかりません。" +
        "AimMinigame を BattleUI より上に配置してください（SAN／AMMO表示は行いません）。");
    return;
}

const params = PluginManager.parameters("AimMinigame");

function legacyParameters(name) {
    try {
        const p = PluginManager.parameters(name);
        return p && typeof p === "object" ? p : {};
    } catch (e) {
        return {};
    }
}

const legacySanAmmoParams = legacyParameters("SanAmmoSystem");
const hasLegacySanAmmo = Object.keys(legacySanAmmoParams).length > 0;

function withLegacyFallback(key, fallbackDefault) {
    const own = params[key];
    if (own !== undefined && own !== "") return own;
    if (hasLegacySanAmmo && legacySanAmmoParams[key] !== undefined && legacySanAmmoParams[key] !== "") {
        return legacySanAmmoParams[key];
    }
    return fallbackDefault;
}

function fontFaceAvailable(name) {
    if (!name) return false;
    try {
        if (typeof document !== "undefined" && document.fonts && document.fonts.check) {
            return document.fonts.check("10px \"" + name + "\"");
        }
    } catch (e) {
        // 判定できない環境では、指定された名前をそのまま使用してみる
    }
    return true;
}

// CSSカラー文字列、またはツクールのテキストカラー番号（0〜31等）のどちらも受け付ける。
function resolveColor(str, fallback) {
    const s = String(str === undefined || str === null ? "" : str).trim();
    if (s === "") return fallback;
    if (/^\d+$/.test(s)) {
        try {
            return ColorManager.textColor(Number(s));
        } catch (e) {
            return fallback;
        }
    }
    return s;
}

//------------------------------------------------------------------
// パラメータ読み込み（AimMinigame.js から移動）
//------------------------------------------------------------------

const sanName = withLegacyFallback("SanName", "SAN");
const showSanGauge = String(params["ShowSanGauge"] !== undefined ? params["ShowSanGauge"] : withLegacyFallback("ShowSanGauge", "true")) === "true";
const sanGaugeColor1 = withLegacyFallback("SanGaugeColor1", "#e91e8c");
const sanGaugeColor2 = withLegacyFallback("SanGaugeColor2", "#8e0047");

const ammoName = withLegacyFallback("AmmoName", "Ammo");
const showAmmoNumber = String(params["ShowAmmoNumber"] !== undefined ? params["ShowAmmoNumber"] : withLegacyFallback("ShowAmmoNumber", "true")) === "true";
const ammoNumberColor = withLegacyFallback("AmmoNumberColor", "#ffffff");

const hpName = params["HpName"] || "HP";
const mpName = params["MpName"] || "MP";
const showHpGauge = params["ShowHpGauge"] === undefined ? true : String(params["ShowHpGauge"]) === "true";
// v2.1.0：BattleUIではMPを表示しない（ゲーム本体のMPやスキルのMP消費には影響しない）
const showMpGauge = false;
const showTpGauge = params["ShowTpGauge"] === undefined ? true : String(params["ShowTpGauge"]) === "true";

const statusFontFace = params["StatusFontFace"] || "";
const labelFontSizeParam = Number(params["LabelFontSize"] || 0);
const valueFontSizeParam = Number(params["ValueFontSize"] || 0);

const hpLabelColor = params["HpLabelColor"] || "";
const hpValueColor = params["HpValueColor"] || "";
const mpLabelColor = params["MpLabelColor"] || "";
const mpValueColor = params["MpValueColor"] || "";
const sanLabelColor = params["SanLabelColor"] || "";
const sanValueColor = params["SanValueColor"] || "";
const ammoLabelColor = params["AmmoLabelColor"] || "";

// 顔グラフィック位置・サイズ調整
// （FaceOffsetX/Y = 位置、FaceScale = 表示サイズのみを拡大縮小）
const faceOffsetX = Number(params["FaceOffsetX"] || 0);
const faceOffsetY = Number(params["FaceOffsetY"] || 0);
const faceScale = Number(params["FaceScale"] || 1) > 0 ? Number(params["FaceScale"] || 1) : 1;

// 戦闘UIカードレイアウト（顔グラ左＋ステータス右の横長カード）用パラメータ
// ※既存のFaceOffsetX/Y・FaceScaleとは役割が重複しないよう、
//   こちらはあくまで「カード内の余白・配置」のみを担当する。
const battleCardPadding = Number(params["BattleCardPadding"] || 8);
const battleCardFaceWidth = Number(params["BattleCardFaceWidth"] || 0); // 0ならデフォルト顔グラ幅を使用
const battleCardFaceGap = Number(params["BattleCardFaceGap"] || 8);
const battleCardStatusGapY = Number(params["BattleCardStatusGapY"] || 0);
const battleCardShowFrame = String(params["BattleCardShowFrame"] || "false") === "true";
const battleCardFrameColor = params["BattleCardFrameColor"] || "#ffffff";

const resolvedStatusFontFace = fontFaceAvailable(statusFontFace) ? statusFontFace : "";

//==================================================================
// Sprite_Gauge：HP/MP/SANゲージの表示名・文字色・数値色・フォントの
//               カスタマイズ（バーサイズ調整は v3.2.0 で廃止）
//==================================================================

const _Sprite_Gauge_currentValue = Sprite_Gauge.prototype.currentValue;
Sprite_Gauge.prototype.currentValue = function() {
    if (this._statusType === "san" && this._battler) {
        return this._battler.san();
    }
    return _Sprite_Gauge_currentValue.call(this);
};

const _Sprite_Gauge_currentMaxValue = Sprite_Gauge.prototype.currentMaxValue;
Sprite_Gauge.prototype.currentMaxValue = function() {
    if (this._statusType === "san" && this._battler) {
        return this._battler.maxSan();
    }
    return _Sprite_Gauge_currentMaxValue.call(this);
};

const _Sprite_Gauge_label = Sprite_Gauge.prototype.label;
Sprite_Gauge.prototype.label = function() {
    if (this._statusType === "san") return sanName;
    if (this._statusType === "hp" && hpName) return hpName;
    if (this._statusType === "mp" && mpName) return mpName;
    return _Sprite_Gauge_label.call(this);
};

const _Sprite_Gauge_gaugeColor1 = Sprite_Gauge.prototype.gaugeColor1;
Sprite_Gauge.prototype.gaugeColor1 = function() {
    if (this._statusType === "san") return sanGaugeColor1 || _Sprite_Gauge_gaugeColor1.call(this);
    return _Sprite_Gauge_gaugeColor1.call(this);
};

const _Sprite_Gauge_gaugeColor2 = Sprite_Gauge.prototype.gaugeColor2;
Sprite_Gauge.prototype.gaugeColor2 = function() {
    if (this._statusType === "san") return sanGaugeColor2 || _Sprite_Gauge_gaugeColor2.call(this);
    return _Sprite_Gauge_gaugeColor2.call(this);
};

function statusLabelColorRaw(statusType) {
    switch (statusType) {
        case "hp": return hpLabelColor;
        case "mp": return mpLabelColor;
        case "san": return sanLabelColor;
        default: return "";
    }
}

function statusValueColorRaw(statusType) {
    switch (statusType) {
        case "hp": return hpValueColor;
        case "mp": return mpValueColor;
        case "san": return sanValueColor;
        default: return "";
    }
}

if (Sprite_Gauge.prototype.labelColor) {
    const _Sprite_Gauge_labelColor = Sprite_Gauge.prototype.labelColor;
    Sprite_Gauge.prototype.labelColor = function() {
        const raw = statusLabelColorRaw(this._statusType);
        return raw ? resolveColor(raw, _Sprite_Gauge_labelColor.call(this)) : _Sprite_Gauge_labelColor.call(this);
    };
}

if (Sprite_Gauge.prototype.valueColor) {
    const _Sprite_Gauge_valueColor = Sprite_Gauge.prototype.valueColor;
    Sprite_Gauge.prototype.valueColor = function() {
        const raw = statusValueColorRaw(this._statusType);
        return raw ? resolveColor(raw, _Sprite_Gauge_valueColor.call(this)) : _Sprite_Gauge_valueColor.call(this);
    };
}

if (Sprite_Gauge.prototype.labelFontFace) {
    const _Sprite_Gauge_labelFontFace = Sprite_Gauge.prototype.labelFontFace;
    Sprite_Gauge.prototype.labelFontFace = function() {
        return resolvedStatusFontFace || _Sprite_Gauge_labelFontFace.call(this);
    };
}

if (Sprite_Gauge.prototype.valueFontFace) {
    const _Sprite_Gauge_valueFontFace = Sprite_Gauge.prototype.valueFontFace;
    Sprite_Gauge.prototype.valueFontFace = function() {
        return resolvedStatusFontFace || _Sprite_Gauge_valueFontFace.call(this);
    };
}

if (Sprite_Gauge.prototype.labelFontSize) {
    const _Sprite_Gauge_labelFontSize = Sprite_Gauge.prototype.labelFontSize;
    Sprite_Gauge.prototype.labelFontSize = function() {
        return labelFontSizeParam > 0 ? labelFontSizeParam : _Sprite_Gauge_labelFontSize.call(this);
    };
}

if (Sprite_Gauge.prototype.valueFontSize) {
    const _Sprite_Gauge_valueFontSize = Sprite_Gauge.prototype.valueFontSize;
    Sprite_Gauge.prototype.valueFontSize = function() {
        return valueFontSizeParam > 0 ? valueFontSizeParam : _Sprite_Gauge_valueFontSize.call(this);
    };
}

//==================================================================
// Window_StatusBase：戦闘・メニュー・ステータス画面共通の表示追加
// ----------------------------------------------------------------
// v3.2.0：表示位置・表示順・自動収まり調整などの細かい設定は廃止し、
// 「表示するかどうか（ON/OFF）」だけを設定できるシンプルな仕組みに
// なっています。表示順は常に HP → MP → TP → SAN → Ammo の固定順で、
// Y座標は前の項目の高さ分だけ自動的にずれていきます。
//
// 新しいステータス種別（スタミナ・感染度・空腹など）は、これまで通り
//   AimMinigame.registerStatus("stamina", { visible, draw });
// で登録できます（登録した項目は Ammo の後ろに自動的に追加されます）。
//==================================================================

// registerStatus と登録テーブルは外部プラグイン互換のため AimMinigame.js に残してあり、
// ここでは同じテーブルを参照する。
window.AimMinigame = window.AimMinigame || {};
const _AimMinigameStatusRegistry = window.AimMinigame._statusRegistry || (window.AimMinigame._statusRegistry = {});

// 固定表示順（HP/MP/TP/SAN/Ammo）。カスタム登録分はこの後ろに追加される。
const _fixedStatusOrder = ["hp", "mp", "tp", "san", "ammo"];

function isStatusVisible(win, actor, key) {
    switch (key) {
        case "hp":
            return showHpGauge;
        case "mp":
            return showMpGauge && !!$dataSystem.optDisplayMp;
        case "tp":
            return showTpGauge && !!$dataSystem.optDisplayTp;
        case "san":
            return showSanGauge;
        case "ammo":
            return showAmmoNumber && !!(actor && actor.maxAmmo && actor.maxAmmo() > 0);
        default: {
            const custom = _AimMinigameStatusRegistry[key];
            if (!custom) return false;
            return typeof custom.visible === "function" ? !!custom.visible(actor) : true;
        }
    }
}

function drawStatusEntry(win, actor, key, x, y) {
    if (key === "hp" || key === "mp" || key === "tp" || key === "san") {
        win.placeGauge(actor, key, x, y);
        return win.gaugeLineHeight();
    }
    if (key === "ammo") {
        return win.drawAmmoNumber(actor, x, y);
    }
    const custom = _AimMinigameStatusRegistry[key];
    if (custom) {
        const h = custom.draw(win, actor, x, y);
        return h > 0 ? h : win.gaugeLineHeight();
    }
    return 0;
}

Window_StatusBase.prototype.placeBasicGauges = function(actor, x, y) {
    if (!actor) return;

    const lineHeight = this.gaugeLineHeight();
    const customKeys = Object.keys(_AimMinigameStatusRegistry);
    const orderedKeys = _fixedStatusOrder.concat(customKeys);

    let curY = y;
    for (const key of orderedKeys) {
        if (!isStatusVisible(this, actor, key)) continue;
        drawStatusEntry(this, actor, key, x, curY);
        curY += lineHeight;
    }
};

// Ammoは「7/12」のような数字のみの表示。表示名（AmmoName）が空欄の
// 場合はラベルを一切描画せず、数字だけを表示する（「Ammo 5/8」の
// ようなラベル付き表示にはならない）。
Window_StatusBase.prototype.drawAmmoNumber = function(actor, x, y) {
    let labelWidth = 0;

    if (ammoName) {
        this.resetFontSettings();
        if (resolvedStatusFontFace) this.contents.fontFace = resolvedStatusFontFace;
        if (labelFontSizeParam > 0) this.contents.fontSize = labelFontSizeParam;
        this.changeTextColor(resolveColor(ammoLabelColor, ColorManager.systemColor ? ColorManager.systemColor() : "#ffffff"));
        labelWidth = this.textWidth(ammoName) + 6;
        this.drawText(ammoName, x, y, labelWidth);
    }

    this.resetFontSettings();
    if (resolvedStatusFontFace) this.contents.fontFace = resolvedStatusFontFace;
    if (valueFontSizeParam > 0) this.contents.fontSize = valueFontSizeParam;
    this.changeTextColor(resolveColor(ammoNumberColor, "#ffffff"));
    const text = actor.ammo() + "/" + actor.maxAmmo();
    const valueWidth = Math.max(96, this.textWidth("0000/0000") + 8);
    this.drawText(text, x + labelWidth, y, valueWidth, "left");

    this.resetTextColor();
    this.resetFontSettings();
    return this.gaugeLineHeight();
};

// BattleUI側のAMMO描画用：AMMOの「見た目の既定値」（表示名・色・フォント）を読み取り専用で公開する。
// 値(ammo()/maxAmmo())はここでは扱わない。drawAmmoNumber 自体は標準ステータス窓用にそのまま残す。
window.BattleUI = window.BattleUI || {};
window.BattleUI.getAmmoStyle = function() {
    return {
        label: ammoName || "",
        labelColor: resolveColor(ammoLabelColor, ColorManager.systemColor ? ColorManager.systemColor() : "#ffffff"),
        numberColor: resolveColor(ammoNumberColor, "#ffffff"),
        fontFace: resolvedStatusFontFace || "",
        labelFontSize: labelFontSizeParam,
        valueFontSize: valueFontSizeParam
    };
};

//==================================================================
// 顔グラフィックの位置・サイズ調整
// ----------------------------------------------------------------
// FaceOffsetX / FaceOffsetY … 表示位置のずらし（既存動作互換）
// FaceScale                 … 表示サイズのみを拡大縮小（位置は
//                              元の描画枠の中央基準を維持したまま拡縮）
//==================================================================

if (Window_Base.prototype.drawFace) {
    Window_Base.prototype.drawFace = function(faceName, faceIndex, x, y, width, height) {
        width = width || ImageManager.faceWidth;
        height = height || ImageManager.faceHeight;

        const bitmap = ImageManager.loadFace(faceName);
        const pw = ImageManager.faceWidth;
        const ph = ImageManager.faceHeight;
        const sw = Math.min(width, pw);
        const sh = Math.min(height, ph);

        // 拡縮なしの場合の基準描画位置（従来と同じ計算）
        const baseDx = Math.floor(x + Math.max(width - pw, 0) / 2);
        const baseDy = Math.floor(y + Math.max(height - ph, 0) / 2);

        const dw = Math.round(sw * faceScale);
        const dh = Math.round(sh * faceScale);
        // 拡縮後も基準位置の中心が変わらないよう、中央合わせで補正する
        const dx = Math.floor(baseDx + (sw - dw) / 2) + faceOffsetX;
        const dy = Math.floor(baseDy + (sh - dh) / 2) + faceOffsetY;

        const sx = (faceIndex % 4) * pw + (pw - sw) / 2;
        const sy = Math.floor(faceIndex / 4) * ph + (ph - sh) / 2;

        this.contents.blt(bitmap, sx, sy, sw, sh, dx, dy, dw, dh);
    };
}

//==================================================================
// ここから追加：戦闘画面のアクターステータスUIを
// 「顔グラ（左）＋ HP/MP/TP/SAN/Ammo（右・縦並び）」の
// 横長カードレイアウトに変更する。
// ----------------------------------------------------------------
// ・変更するのは Window_BattleStatus（戦闘画面のアクターステータス
//   ウィンドウ）の drawItemImage / drawItemStatus のみ。
// ・Window_Base.prototype.drawFace（上のブロック）は変更していない
//   ため、メニュー画面など戦闘以外の顔グラ表示（FaceOffsetX/Y・
//   FaceScaleを含む）は従来どおり。
// ・HP/MP/TP/SAN/AmmoのON/OFF判定・表示順（HP→MP→TP→SAN→Ammo）・
//   ゲージ処理・Ammo表示仕様は placeBasicGauges / drawAmmoNumber
//   （このファイル内の既存実装）をそのまま呼び出しているだけで、
//   中身は一切変更していない。
// ・アクター人数に応じたカード幅の自動割り当てはRPGツクールMZ
//   標準の Window_BattleStatus.prototype.maxCols
//   （＝パーティ人数分の列を自動生成する仕様）をそのまま利用する
//   ため、ここでは変更していない。
//==================================================================

// ゲージ（Sprite_Gauge）の横幅は、RPGツクールMZ標準のままとする。
// （以前はカード幅に合わせて bitmapWidth を一時上書きしていたが、
//   MZ標準幅に戻したため、上書き用フックは撤去した。
//   メニュー画面など戦闘以外のゲージにも一切影響しない。）

if (typeof Window_BattleStatus !== "undefined") {

    // カード内、顔グラの右側＝ステータス欄の開始X座標とその利用可能幅を
    // まとめて計算する（drawItemImage / drawItemStatus 共通で使用）。
    Window_BattleStatus.prototype.aimCardFaceWidth = function() {
        return battleCardFaceWidth > 0 ? battleCardFaceWidth : ImageManager.faceWidth;
    };

    Window_BattleStatus.prototype.aimCardStatusX = function(rect) {
        return rect.x + battleCardPadding + this.aimCardFaceWidth() + battleCardFaceGap;
    };

    Window_BattleStatus.prototype.aimCardStatusWidth = function(rect) {
        const statusX = this.aimCardStatusX(rect);
        const right = rect.x + rect.width - battleCardPadding;
        return Math.max(right - statusX, 60);
    };

    // 顔グラフィック：カード左側に、パディングを除いた高さいっぱいに表示する。
    // 実際の描画（オフセット・拡縮）は Window_Base.prototype.drawFace
    // （上のブロック／変更なし）にそのまま委ねる。
    Window_BattleStatus.prototype.drawItemImage = function(index) {
        const actor = this.actor(index);
        if (!actor) return;
        const rect = this.itemRect(index);
        const faceW = this.aimCardFaceWidth();
        const faceH = Math.max(rect.height - battleCardPadding * 2, 24);
        const fx = rect.x + battleCardPadding;
        const fy = rect.y + battleCardPadding;
        this.changePaintOpacity(actor.isBattleMember());
        this.drawActorFace(actor, fx, fy, faceW, faceH);
        this.changePaintOpacity(true);
    };

    // ステータス欄：顔グラの右側に「名前 → HP → MP → TP → SAN → Ammo」を
    // 縦に並べる。HP/MP/TP/SAN/Ammoの実際の描画・ON/OFF判定・並び順は
    // 既存の placeBasicGauges（このファイル内、変更なし）を利用する。
    Window_BattleStatus.prototype.drawItemStatus = function(index) {
        const actor = this.actor(index);
        if (!actor) return;
        const rect = this.itemRect(index);
        const statusX = this.aimCardStatusX(rect);
        const statusWidth = this.aimCardStatusWidth(rect);
        let curY = rect.y + battleCardPadding;

        // カード枠（任意・パラメータでON/OFF）
        if (battleCardShowFrame) {
            this.aimDrawCardFrame(rect);
        }

        // TPB（アクティブ/ウェイト）使用時は、既存のタイムゲージ機能を
        // 名前の上に維持する（本プラグインの機能ではないため、存在する
        // 場合のみ呼び出す＝他の処理への影響なし）。
        if (
            typeof this.placeTimeGauge === "function" &&
            typeof BattleManager.isTpb === "function" &&
            BattleManager.isTpb()
        ) {
            this.placeTimeGauge(actor, statusX, curY);
            curY += this.gaugeLineHeight ? this.gaugeLineHeight() : this.lineHeight();
        }

        // アクター名（ステートアイコン分だけ幅を空けておく）
        this.resetFontSettings();
        if (resolvedStatusFontFace) this.contents.fontFace = resolvedStatusFontFace;
        const iconReserve = ImageManager.iconWidth + 4;
        this.drawActorName(actor, statusX, curY, Math.max(statusWidth - iconReserve, 40));
        if (typeof this.placeStateIcon === "function") {
            this.placeStateIcon(actor, statusX + statusWidth - ImageManager.iconWidth / 2, curY + this.lineHeight() / 2);
        }
        curY += this.lineHeight() + battleCardStatusGapY;

        // HP/MP/TP/SAN/Ammo（表示ON/OFF・順序・ゲージ処理は既存仕様のまま）。
        // ゲージ幅はカード幅で上書きせず、MZ標準のゲージ幅を使用する。
        this.placeBasicGauges(actor, statusX, curY);
    };

    // カード枠線の描画（BattleCardShowFrame がONの場合のみ使用）。
    Window_BattleStatus.prototype.aimDrawCardFrame = function(rect) {
        const color = resolveColor(battleCardFrameColor, "#ffffff");
        const x = rect.x + 1;
        const y = rect.y + 1;
        const w = Math.max(rect.width - 2, 0);
        const h = Math.max(rect.height - 2, 0);
        this.contents.fillRect(x, y, w, 1, color);
        this.contents.fillRect(x, y + h - 1, w, 1, color);
        this.contents.fillRect(x, y, 1, h, color);
        this.contents.fillRect(x + w - 1, y, 1, h, color);
    };
}

})();

//##############################################################################
// 2) BattleUI 本体：ステータス（Actor1〜4）／アクターコマンド／UIエディタ
// ----------------------------------------------------------------------------
// v2.0.0：旧「キャラクターパネル」「アクターコマンド」「UIエディタ」を1つの
// 仕組みにまとめました。位置・サイズ・表示/非表示・画像はUIエディタの保存データ
// （ConfigManager.battleUILayout）が最優先です。
//##############################################################################

(() => {
"use strict";
const pluginName = "BattleUI";
const params = PluginManager.parameters(pluginName);

// AimMinigame のパラメータ（表示ON/OFFの参照のみ。未導入なら空オブジェクト）
let aimParams = {};
try {
    aimParams = PluginManager.parameters("AimMinigame") || {};
} catch (e) {
    aimParams = {};
}

//==================================================================
// 共通ユーティリティ（旧：3つのブロックに重複していたものを1つに統合）
//==================================================================

function toNum(value, defaultValue) {
    if (value === undefined || value === null || value === "") return defaultValue;
    const n = Number(value);
    return isNaN(n) ? defaultValue : n;
}

function toBool(value, defaultValue) {
    if (value === undefined || value === null || value === "") return defaultValue;
    return String(value) === "true";
}

function toText(value, defaultValue) {
    return value === undefined || value === null || value === "" ? defaultValue : String(value);
}

function parseStruct(str) {
    try {
        const obj = JSON.parse(str || "{}");
        return obj && typeof obj === "object" ? obj : {};
    } catch (e) {
        return {};
    }
}

// プラグイン間の共通フラグ（BattleUI_Timing が更新する。未導入でも動作）
window.BattleUI = window.BattleUI || {};
window.BattleUI.suppress = window.BattleUI.suppress || { core: false };

//==================================================================
// パラメータ読み込み（必要最低限のパラメータ）
//==================================================================

const hideStandardStatusWindow = toBool(params["HideStandardStatusWindow"], true);
const hideWhileMessage = toBool(params["HideWhileMessage"], true);

const showName = toBool(params["ShowName"], true);
const nameFontSize = Math.max(8, toNum(params["NameFontSize"], 16));

const skillName = toText(params["SkillName"], "必殺技");
const itemName = toText(params["ItemName"], "アイテム");
const escapeName = toText(params["EscapeName"], "逃げる");
const skillTypeIdParam = Math.max(0, Math.floor(toNum(params["SkillTypeId"], 0)));
const commandCols = Math.max(1, Math.min(3, Math.floor(toNum(params["CommandCols"], 1))));
const commandFontSize = Math.max(8, toNum(params["CommandFontSize"], 28));
const commandBackOpacity = Math.max(0, Math.min(255, toNum(params["CommandBackOpacity"], 192)));
const skipPartyCommand = toBool(params["SkipPartyCommand"], true);

const enableEditor = toBool(params["EnableEditor"], false);
const openKey = String(params["OpenKey"] === undefined ? "F7" : params["OpenKey"]).trim();
const showEditorButton = toBool(params["ShowEditorButton"], true);

// HP／SAN／AMMOの表示・非表示はUIエディタ（Visible）だけで決める（AimMinigameの
// ShowHpGauge 等は標準ステータス窓用で、BattleUIのステータスには影響しない）。

// AimMinigame 側のSAN／AMMO機能が存在するか
const sanSupported = typeof Game_BattlerBase.prototype.san === "function" &&
    typeof Game_BattlerBase.prototype.maxSan === "function";
const ammoSupported = typeof Game_BattlerBase.prototype.ammo === "function" &&
    typeof Game_BattlerBase.prototype.maxAmmo === "function";

//------------------------------------------------------------------
// 旧パラメータ（互換用：読み込みのみ。UIエディタの「初期値」として使う）
// ----------------------------------------------------------------
// 位置・サイズ・表示・背景画像は、v2.0.0 からプラグインパラメータの画面には
// 出しません。既存プロジェクトに保存されている値だけを初期値として読みます。
// UIエディタの保存データがある場合は、そちらが常に優先されます。
//------------------------------------------------------------------

const legacyNameWidth = Math.max(16, toNum(params["NameWidth"], 100));
const legacyCommandRect = {
    x: toNum(params["CommandX"], 0),
    y: toNum(params["CommandY"], 368),
    w: Math.max(32, toNum(params["CommandWidth"], 240)),
    h: Math.max(32, toNum(params["CommandHeight"], 156))
};

function parsePanelConfig(raw, slot, defaultX) {
    const s = parseStruct(raw);
    return {
        slot: slot,
        visible: toBool(s.Visible, true),
        x: toNum(s.PanelX, defaultX),
        y: toNum(s.PanelY, 524),
        width: Math.max(8, toNum(s.PanelWidth, 204)),
        height: Math.max(8, toNum(s.PanelHeight, 100)),
        useBg: toBool(s.UseBackgroundImage, false),
        bgName: String(s.BackgroundImage || ""),
        showFace: toBool(s.ShowFace, true),
        faceImage: String(s.FaceImage || ""),
        faceIndex: Math.max(0, Math.floor(toNum(s.FaceIndex, 0))),
        faceX: toNum(s.FaceX, 6),
        faceY: toNum(s.FaceY, 6),
        faceScale: toNum(s.FaceScale, 0.6) > 0 ? toNum(s.FaceScale, 0.6) : 0.6,
        hpX: toNum(s.HpX, 96),
        hpY: toNum(s.HpY, 28),
        hpW: Math.max(8, toNum(s.HpWidth, 100)),
        hpH: Math.max(2, toNum(s.HpHeight, 12)),
        sanX: toNum(s.SanX, 96),
        sanY: toNum(s.SanY, 48),
        sanW: Math.max(8, toNum(s.SanWidth, 100)),
        sanH: Math.max(2, toNum(s.SanHeight, 12)),
        ammoX: toNum(s.AmmoX, 96),
        ammoY: toNum(s.AmmoY, 62)
    };
}

// 各キャラクター（A〜D）は、別々のオブジェクトとして生成する（共有しない）
const panelConfigs = [
    parsePanelConfig(params["CharacterA"], 0, 0),
    parsePanelConfig(params["CharacterB"], 1, 204),
    parsePanelConfig(params["CharacterC"], 2, 408),
    parsePanelConfig(params["CharacterD"], 3, 612)
];

//==================================================================
// 定数
//==================================================================

const MAX_ACTORS = 4;
const STEP_LIST = [1, 5, 10];
const HIT_PADDING = 3;
const COORD_SHOW_FRAMES = 45;
const AMMO_RECT_WIDTH = 150;
const AMMO_RECT_HEIGHT = 36;
const EDITOR_PANEL_WIDTH = 232;
const EDITOR_PANEL_HEIGHT = 512;
const EDITOR_BUTTON_WIDTH = 96;
const EDITOR_BUTTON_HEIGHT = 28;
const COMMAND_MIN_SIZE = 32;
const GHOST_ALPHA = 0.35; // 編集中、「表示OFF」の要素を薄く表示する

const ACTOR_PART_KEYS = ["Panel", "Face", "Name", "HP", "SAN", "Ammo"];
const COMMAND_PART_KEYS = ["Background", "Skill", "Item", "Escape"];
const COMMAND_SYMBOL_KEY = { skill: "Skill", item: "Item", escape: "Escape" };

// UIエディタで設定する項目（すべて全キャラクター／全ウィンドウ共通）
// image＝img/pictures の画像ファイル名、color＝#RRGGBB
const SETTING_SLOTS = [
    { key: "statusBg", label: "Status Panel BG", type: "image" },
    { key: "commandBg", label: "Command BG", type: "image" },
    { key: "buttonNormal", label: "Button Normal", type: "image" },
    { key: "buttonSelected", label: "Button Selected", type: "image" },
    { key: "skillBg", label: "Skill List BG", type: "image" },
    { key: "itemBg", label: "Item List BG", type: "image" },
    { key: "hpColor", label: "HP Bar Color", type: "color" },
    { key: "sanColor", label: "SAN Bar Color", type: "color" },
    { key: "hpTextColor", label: "HP Text Color", type: "color" },
    { key: "sanTextColor", label: "SAN Text Color", type: "color" },
    { key: "ammoTextColor", label: "Ammo Text Color", type: "color" }
];
const SETTING_KEYS = SETTING_SLOTS.map(s => s.key);
const IMAGE_KEYS = SETTING_SLOTS.filter(s => s.type === "image").map(s => s.key);
const COLOR_KEYS = SETTING_SLOTS.filter(s => s.type === "color").map(s => s.key);

//==================================================================
// 画像の安全な読み込み
// ----------------------------------------------------------------
// ImageManager.loadPicture で存在しないファイルを読むと、次のシーン切替時に
// 「Failed to load」でゲームが止まる。そのため、先に Image で存在確認してから
// ImageManager を使う（確認前・存在しない場合は null を返し、何も表示しない）。
//==================================================================

const imageStatus = new Map();   // name -> "ok" | "bad" | "loading"
const probeWaiters = new Map();  // name -> [callback]

function probePicture(name, callback) {
    const key = String(name || "");
    if (!key) {
        if (callback) callback(false);
        return;
    }
    const st = imageStatus.get(key);
    if (st === "ok" || st === "bad") {
        if (callback) callback(st === "ok");
        return;
    }
    const waiters = probeWaiters.get(key) || [];
    if (callback) waiters.push(callback);
    probeWaiters.set(key, waiters);
    if (st === "loading") return;
    imageStatus.set(key, "loading");
    const finish = ok => {
        imageStatus.set(key, ok ? "ok" : "bad");
        const list = probeWaiters.get(key) || [];
        probeWaiters.delete(key);
        for (const cb of list) cb(ok);
    };
    try {
        const img = new Image();
        img.onload = () => finish(true);
        img.onerror = () => finish(false);
        const enc = typeof Utils.encodeURI === "function" ? Utils.encodeURI(key) : encodeURIComponent(key);
        img.src = "img/pictures/" + enc + ".png";
    } catch (e) {
        finish(false);
    }
}

// 使える状態の Bitmap（未読み込みのこともある）。未確認なら確認を始めて null。
function getPicture(name) {
    const key = String(name || "");
    if (!key) return null;
    const st = imageStatus.get(key);
    if (st === "ok") return ImageManager.loadPicture(key);
    if (st === undefined) probePicture(key);
    return null;
}

// 画像の状態を表す文字列（変化したら再描画する）
function pictureSignature(name) {
    const key = String(name || "");
    if (!key) return "";
    const bmp = getPicture(key);
    return key + "|" + (imageStatus.get(key) || "") + "|" + (bmp && bmp.isReady() ? 1 : 0);
}

function sanitizeImageName(text) {
    return String(text === undefined || text === null ? "" : text)
        .replace(/[\\\/:*?"<>|]/g, "").trim().slice(0, 64);
}

//==================================================================
// 配置データの保存（ConfigManager）／画面サイズ補正（全要素共通）
// ----------------------------------------------------------------
// ConfigManager.battleUILayout = {
//   w, h,
//   items: { "Actor1_Name": {x, y, width, height, hidden}, ... },
//   images: { statusBg, commandBg, buttonNormal, buttonSelected, skillBg, itemBg }
//   colors: { hpColor, sanColor, hpTextColor, sanTextColor, ammoTextColor }  // 初期値と違うものだけ
// }
// ゲーム本編のセーブデータ($gameSystem等)には何も保存しない。
//==================================================================

ConfigManager.battleUILayout = null;

// 色：#RRGGBB（#なし・3桁も可）。空文字＝標準色。不正な値は null
function normalizeHexColor(text) {
    let t = String(text === undefined || text === null ? "" : text).trim().replace(/^#/, "");
    if (t === "") return "";
    if (/^[0-9a-fA-F]{3}$/.test(t)) t = t[0] + t[0] + t[1] + t[1] + t[2] + t[2];
    if (!/^[0-9a-fA-F]{6}$/.test(t)) return null;
    return "#" + t.toUpperCase();
}

// 旧バージョンのID（Actor?_Image）を新しいID（Actor?_Face）として読む
function normalizeLayoutId(id) {
    return String(id).replace(/^(Actor\d+_)Image$/, "$1Face");
}

function sanitizeLayout(raw) {
    if (!raw || typeof raw !== "object") return null;
    const items = {};
    const src = raw.items && typeof raw.items === "object" ? raw.items : {};
    for (const rawKey of Object.keys(src)) {
        const v = src[rawKey];
        if (!v || typeof v !== "object") continue;
        const x = Number(v.x);
        const y = Number(v.y);
        if (!isFinite(x) || !isFinite(y)) continue;
        const item = { x: Math.round(x), y: Math.round(y) };
        const iw = Number(v.width);
        const ih = Number(v.height);
        if (isFinite(iw) && iw > 0 && isFinite(ih) && ih > 0) {
            item.width = Math.round(iw);
            item.height = Math.round(ih);
        }
        if (typeof v.hidden === "boolean") item.hidden = v.hidden;
        items[normalizeLayoutId(rawKey)] = item;
    }
    const images = {};
    const imgSrc = raw.images && typeof raw.images === "object" ? raw.images : {};
    for (const key of IMAGE_KEYS) {
        if (typeof imgSrc[key] === "string") images[key] = sanitizeImageName(imgSrc[key]);
    }
    const colors = {};
    const colSrc = raw.colors && typeof raw.colors === "object" ? raw.colors : {};
    for (const key of COLOR_KEYS) {
        if (typeof colSrc[key] === "string") {
            const hex = normalizeHexColor(colSrc[key]);
            if (hex !== null) colors[key] = hex;
        }
    }
    const w = Number(raw.w);
    const h = Number(raw.h);
    return {
        w: isFinite(w) && w > 0 ? Math.round(w) : 0,
        h: isFinite(h) && h > 0 ? Math.round(h) : 0,
        items: items,
        images: images,
        colors: colors
    };
}

const _ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function() {
    const config = _ConfigManager_makeData.call(this);
    if (this.battleUILayout) {
        config.battleUILayout = this.battleUILayout;
    }
    return config;
};

const _ConfigManager_applyData = ConfigManager.applyData;
ConfigManager.applyData = function(config) {
    _ConfigManager_applyData.call(this, config);
    this.battleUILayout = sanitizeLayout(config ? config.battleUILayout : null);
};

// 設定（画像・色）の初期値。旧「背景画像」パラメータがあれば、ステータス背景の初期値にする
function defaultSettings() {
    let statusBg = "";
    for (const c of panelConfigs) {
        if (c.useBg && c.bgName) {
            statusBg = sanitizeImageName(c.bgName);
            break;
        }
    }
    return {
        statusBg: statusBg, commandBg: "", buttonNormal: "", buttonSelected: "",
        skillBg: "", itemBg: "", hpColor: "", sanColor: "",
        hpTextColor: "", sanTextColor: "", ammoTextColor: ""
    };
}

// 優先順位：保存データ ＞ 初期値（色の ""＝標準色）
function resolveSettings() {
    const result = defaultSettings();
    const saved = ConfigManager.battleUILayout;
    if (saved && saved.images) {
        for (const key of IMAGE_KEYS) {
            if (typeof saved.images[key] === "string") result[key] = saved.images[key];
        }
    }
    if (saved && saved.colors) {
        for (const key of COLOR_KEYS) {
            if (typeof saved.colors[key] === "string") result[key] = saved.colors[key];
        }
    }
    return result;
}

//==================================================================
// 編集対象（要素）の共通定義
// ----------------------------------------------------------------
// ステータス・コマンドの全要素は、この同じ形のオブジェクトで管理する。
//   init* … 初期状態（Resetで戻る） cur* … 現在 base* … 保存済み
//   owner.setPart(key, rect, hidden) で実際の表示物へ反映する。
//==================================================================

function makeElementDef(o) {
    const d = {
        id: o.id,
        key: o.key,
        kind: o.kind,
        priority: o.priority,
        group: o.group,
        master: !!o.master,
        noHide: !!o.noHide,
        owner: o.owner,
        minW: o.minW,
        minH: o.minH,
        isAvailable: o.isAvailable,
        available: false,
        initX: Math.round(o.x),
        initY: Math.round(o.y),
        initW: Math.max(o.minW, Math.round(o.w)),
        initH: Math.max(o.minH, Math.round(o.h)),
        initHidden: !!o.hidden
    };
    d.curX = d.baseX = d.initX;
    d.curY = d.baseY = d.initY;
    d.curW = d.baseW = d.initW;
    d.curH = d.baseH = d.initH;
    d.curHidden = d.baseHidden = d.initHidden;
    return d;
}

function clampSizeFor(d, w, h) {
    return {
        w: Math.round(Math.min(Math.max(w, d.minW), Math.max(d.minW, Graphics.boxWidth))),
        h: Math.round(Math.min(Math.max(h, d.minH), Math.max(d.minH, Graphics.boxHeight)))
    };
}

// UIが完全に画面外へ消えないように位置を制限する
function clampPositionFor(w, h, x, y) {
    const margin = Math.min(16, w, h);
    const minX = margin - w;
    const maxX = Graphics.boxWidth - margin;
    const minY = margin - h;
    const maxY = Graphics.boxHeight - margin;
    return {
        x: Math.round(Math.min(Math.max(x, minX), maxX)),
        y: Math.round(Math.min(Math.max(y, minY), maxY))
    };
}

function applyDef(d) {
    d.owner.setPart(d.key, { x: d.curX, y: d.curY, w: d.curW, h: d.curH }, d.curHidden);
}

// 保存データを反映する（画面サイズが変わっていたら、全要素を同じ比率で補正）
function resolveDefsFromSaved(defs) {
    const saved = ConfigManager.battleUILayout;
    const scaleX = saved && saved.w > 0 ? Graphics.boxWidth / saved.w : 1;
    const scaleY = saved && saved.h > 0 ? Graphics.boxHeight / saved.h : 1;
    for (const d of defs) {
        const s = saved && saved.items ? saved.items[d.id] : null;
        if (s) {
            if (isFinite(s.width) && isFinite(s.height) && s.width > 0 && s.height > 0) {
                const sz = clampSizeFor(d, Math.round(s.width * scaleX), Math.round(s.height * scaleY));
                d.curW = sz.w;
                d.curH = sz.h;
            }
            const p = clampPositionFor(d.curW, d.curH, Math.round(s.x * scaleX), Math.round(s.y * scaleY));
            d.curX = p.x;
            d.curY = p.y;
            d.curHidden = typeof s.hidden === "boolean" ? s.hidden : d.initHidden;
        }
        d.baseX = d.curX;
        d.baseY = d.curY;
        d.baseW = d.curW;
        d.baseH = d.curH;
        d.baseHidden = d.curHidden;
    }
}

//==================================================================
// 描画ヘルパー
//==================================================================

function strokeBox(bitmap, x, y, w, h, thickness, color) {
    bitmap.fillRect(x, y, w, thickness, color);
    bitmap.fillRect(x, y + h - thickness, w, thickness, color);
    bitmap.fillRect(x, y + thickness, thickness, Math.max(0, h - thickness * 2), color);
    bitmap.fillRect(x + w - thickness, y + thickness, thickness, Math.max(0, h - thickness * 2), color);
}

// ウィンドウスキンから標準のウィンドウ背景＋枠を描く（コマンド背景の画像未設定時用）
function drawWindowSkinBox(bitmap, skin, backOpacity) {
    const w = bitmap.width;
    const h = bitmap.height;
    bitmap.clear();
    if (!skin || !skin.isReady()) return;
    const m = 4;
    const bw = Math.max(1, w - m * 2);
    const bh = Math.max(1, h - m * 2);
    bitmap.paintOpacity = backOpacity;
    bitmap.blt(skin, 0, 0, 95, 95, m, m, bw, bh);
    for (let ty = m; ty < h - m; ty += 96) {
        for (let tx = m; tx < w - m; tx += 96) {
            const tw = Math.min(96, w - m - tx);
            const th = Math.min(96, h - m - ty);
            if (tw > 0 && th > 0) bitmap.blt(skin, 0, 96, tw, th, tx, ty, tw, th);
        }
    }
    bitmap.paintOpacity = 255;
    const fm = Math.max(1, Math.min(24, Math.floor(w / 2), Math.floor(h / 2)));
    const sx = 96;
    const ss = 96;
    bitmap.blt(skin, sx, 0, fm, fm, 0, 0, fm, fm);
    bitmap.blt(skin, sx + ss - fm, 0, fm, fm, w - fm, 0, fm, fm);
    bitmap.blt(skin, sx, ss - fm, fm, fm, 0, h - fm, fm, fm);
    bitmap.blt(skin, sx + ss - fm, ss - fm, fm, fm, w - fm, h - fm, fm, fm);
    if (w - fm * 2 > 0) {
        bitmap.blt(skin, sx + fm, 0, ss - fm * 2, fm, fm, 0, w - fm * 2, fm);
        bitmap.blt(skin, sx + fm, ss - fm, ss - fm * 2, fm, fm, h - fm, w - fm * 2, fm);
    }
    if (h - fm * 2 > 0) {
        bitmap.blt(skin, sx, fm, fm, ss - fm * 2, 0, fm, fm, h - fm * 2);
        bitmap.blt(skin, sx + ss - fm, fm, fm, ss - fm * 2, w - fm, fm, fm, h - fm * 2);
    }
}

//==================================================================
// AMMO：値の取得と描画の分離
// ----------------------------------------------------------------
// 値は AimMinigame の ammo()/maxAmmo() を「読むだけ」（BattleUIは値を変更しない）。
// 描画はBattleUI側で、与えられたBitmap（幅w×高さh）の中に収まるように行う。
//==================================================================

function getAmmoInfo(actor) {
    const cur = Number(actor.ammo());
    const max = Number(actor.maxAmmo());
    return { cur: isFinite(cur) ? cur : 0, max: isFinite(max) ? max : 0 };
}

// 表示名・色・フォントの既定値は AimMinigame の既存パラメータ（getAmmoStyle）に従う。
// colorOverride（Ammo Text Color）があれば、ラベルと数値の両方をその色にする。
function drawAmmoText(bitmap, info, w, h, colorOverride) {
    const style = typeof window.BattleUI.getAmmoStyle === "function" ? window.BattleUI.getAmmoStyle() : {
        label: "Ammo", labelColor: "#ffffff", numberColor: "#ffffff", fontFace: "",
        labelFontSize: 0, valueFontSize: 0
    };
    const text = info.cur + "/" + info.max;
    const label = style.label || "";
    const face = style.fontFace || $gameSystem.mainFontFace();
    const baseValue = style.valueFontSize > 0 ? style.valueFontSize : $gameSystem.mainFontSize();
    const baseLabel = style.labelFontSize > 0 ? style.labelFontSize : $gameSystem.mainFontSize();
    // 文字の大きさ：標準の高さ(36)を基準に、領域の高さに比例して拡縮（領域に収める）
    let k = Math.min(h / AMMO_RECT_HEIGHT, Math.max(8, h - 4) / baseValue);
    const sizeOf = (base, scale) => Math.max(6, Math.round(base * scale));
    const measure = scale => {
        bitmap.fontFace = face;
        bitmap.fontSize = sizeOf(baseLabel, scale);
        const lw = label ? Math.ceil(bitmap.measureTextWidth(label)) + 6 : 0;
        bitmap.fontSize = sizeOf(baseValue, scale);
        return { lw: lw, vw: Math.ceil(bitmap.measureTextWidth(text)) };
    };
    // 幅に収まるまで縮める（文字が領域の外で切れないようにする）
    let m = measure(k);
    for (let i = 0; i < 40 && m.lw + m.vw > w && sizeOf(baseValue, k) > 6; i++) {
        k *= 0.92;
        m = measure(k);
    }
    const labelColor = colorOverride || style.labelColor || "#ffffff";
    const valueColor = colorOverride || style.numberColor || "#ffffff";
    bitmap.paintOpacity = 255;
    if (label) {
        bitmap.fontFace = face;
        bitmap.fontSize = sizeOf(baseLabel, k);
        bitmap.textColor = labelColor;
        bitmap.drawText(label, 0, 0, Math.max(1, m.lw), h, "left");
    }
    bitmap.fontFace = face;
    bitmap.fontSize = sizeOf(baseValue, k);
    bitmap.textColor = valueColor;
    bitmap.drawText(text, m.lw, 0, Math.max(1, w - m.lw), h, "left");
}

//==================================================================
// Bitmap の作り直し（サイズが変わった時だけ。古いBitmapは破棄する）
//==================================================================

function ensureSpriteBitmap(sprite, w, h) {
    const nw = Math.max(1, Math.round(w));
    const nh = Math.max(1, Math.round(h));
    const old = sprite.bitmap;
    if (old && old.width === nw && old.height === nh) return false;
    sprite.bitmap = new Bitmap(nw, nh);
    if (old && typeof old.destroy === "function") old.destroy();
    return true;
}

function destroySpriteBitmap(sprite) {
    if (sprite && sprite.bitmap && typeof sprite.bitmap.destroy === "function") {
        sprite.bitmap.destroy();
    }
}

//==================================================================
// Sprite_BattleUIEdGauge：サイズ指定可能なゲージ（バーのみ／文字のみ）
// ----------------------------------------------------------------
// Sprite_Gauge を継承するため、AimMinigame が追加した表示名・色・フォント等は
// そのまま使われる。Sprite_Gauge 本体は変更しない。
//==================================================================

function Sprite_BattleUIEdGauge() {
    this.initialize(...arguments);
}

Sprite_BattleUIEdGauge.prototype = Object.create(Sprite_Gauge.prototype);
Sprite_BattleUIEdGauge.prototype.constructor = Sprite_BattleUIEdGauge;

// width＝全体の幅／barHeight＝バーの太さ／totalHeight＝バー＋文字を含む全体の高さ
Sprite_BattleUIEdGauge.prototype.initialize = function(width, barHeight, mode, totalHeight) {
    this._edWidth = Math.max(8, width);
    this._edHeight = Math.max(2, barHeight);
    this._edTotal = Math.max(this._edHeight, totalHeight || 0, 8);
    this._edMode = mode || "bar"; // "bar"＝バーのみ／"text"＝ラベルと数値のみ
    this._edColor = "";           // バーの色（""＝標準色）
    this._edTextColor = "";       // 文字の色（""＝標準色）
    Sprite_Gauge.prototype.initialize.call(this);
};

Sprite_BattleUIEdGauge.prototype.bitmapWidth = function() {
    return this._edWidth;
};

Sprite_BattleUIEdGauge.prototype.gaugeHeight = function() {
    return this._edHeight;
};

Sprite_BattleUIEdGauge.prototype.textHeight = function() {
    return this._edTotal;
};

Sprite_BattleUIEdGauge.prototype.bitmapHeight = function() {
    return this.textHeight();
};

// 色はこのゲージ専用（Sprite_Gauge本体や他のゲージには影響しない）
// ・バーの塗り色  ＝ _edColor      （HP Bar Color / SAN Bar Color）
// ・ラベル／数値文字 ＝ _edTextColor  （HP Text Color / SAN Text Color）
// 2つは完全に別の設定。""の時は、元のゲージの色（AimMinigame拡張を含む）を使う。
Sprite_BattleUIEdGauge.prototype.gaugeColor1 = function() {
    return normalizeHexColor(this._edColor) || Sprite_Gauge.prototype.gaugeColor1.call(this);
};

Sprite_BattleUIEdGauge.prototype.gaugeColor2 = function() {
    return normalizeHexColor(this._edColor) || Sprite_Gauge.prototype.gaugeColor2.call(this);
};

Sprite_BattleUIEdGauge.prototype.labelColor = function() {
    const custom = normalizeHexColor(this._edTextColor);
    if (custom) return custom;
    return Sprite_Gauge.prototype.labelColor ? Sprite_Gauge.prototype.labelColor.call(this) : ColorManager.systemColor();
};

Sprite_BattleUIEdGauge.prototype.valueColor = function() {
    const custom = normalizeHexColor(this._edTextColor);
    if (custom) return custom;
    return Sprite_Gauge.prototype.valueColor ? Sprite_Gauge.prototype.valueColor.call(this) : ColorManager.normalColor();
};

// バーの色（""＝標準色）。不正な値は無視して今の色を保つ
Sprite_BattleUIEdGauge.prototype.setBarColor = function(color) {
    const c = normalizeHexColor(color);
    if (c === null || this._edColor === c) return;
    this._edColor = c;
    if (this._battler) this.redraw();
};

// 文字の色（""＝標準色）。不正な値は無視して今の色を保つ
Sprite_BattleUIEdGauge.prototype.setTextColor = function(color) {
    const c = normalizeHexColor(color);
    if (c === null || this._edTextColor === c) return;
    this._edTextColor = c;
    if (this._battler) this.redraw();
};

Sprite_BattleUIEdGauge.prototype.drawGauge = function() {
    if (this._edMode === "text") return;
    Sprite_Gauge.prototype.drawGauge.call(this);
};

Sprite_BattleUIEdGauge.prototype.drawLabel = function() {
    if (this._edMode === "bar") return;
    Sprite_Gauge.prototype.drawLabel.call(this);
};

Sprite_BattleUIEdGauge.prototype.drawValue = function() {
    if (this._edMode === "bar") return;
    Sprite_Gauge.prototype.drawValue.call(this);
};

// UIエディタでの幅・高さの変更：Bitmapを作り直して描き直す
Sprite_BattleUIEdGauge.prototype.resize = function(width, barHeight, totalHeight) {
    const nw = Math.max(8, Math.round(width));
    const nb = Math.max(2, Math.round(barHeight));
    const nt = Math.max(nb, Math.round(totalHeight || 0), 8);
    if (nw === this._edWidth && nb === this._edHeight && nt === this._edTotal) return false;
    this._edWidth = nw;
    this._edHeight = nb;
    this._edTotal = nt;
    const old = this.bitmap;
    this.createBitmap();
    if (old && old !== this.bitmap && typeof old.destroy === "function") old.destroy();
    if (this._battler) this.redraw();
    return true;
};

//==================================================================
// Sprite_BattleUIActorStatus：キャラクター1人分のステータス（Actor1〜4それぞれ独立）
// ----------------------------------------------------------------
// ActorStatus
//  ├ Background(Panel) ├ Face ├ Name ├ HP(Bar＋Text) ├ SAN(Bar＋Text) └ Ammo
// すべて「このキャラ専用」のSprite／Bitmapを持つ（他キャラと共有しない）。
// ※ 画面全体の大きさのWindowを重ねる方式は、MZのWindowLayerが「上のWindowの
//   範囲では下のWindowを描かない」ため、最前面の1人しか見えなくなる。
//   そのためWindowではなくSpriteで構成している。
//==================================================================

function Sprite_BattleUIActorStatus() {
    this.initialize(...arguments);
}

Sprite_BattleUIActorStatus.prototype = Object.create(Sprite.prototype);
Sprite_BattleUIActorStatus.prototype.constructor = Sprite_BattleUIActorStatus;

Sprite_BattleUIActorStatus.prototype.initialize = function(slot, config) {
    Sprite.prototype.initialize.call(this);
    this._uiSlot = slot;
    this._uiConfig = config;
    this._uiAmmoColor = "";   // Ammo Text Color（全キャラ共通。""＝AimMinigameの既存色）
    this._uiActor = null;
    this._uiDestroyed = false;
    this._uiEditMode = false;
    this._uiImage = "";
    this._uiDirty = {};
    this._uiSig = { bg: "", face: "", name: "", ammo: "" };
    this._uiFaceWaiting = [];
    this._uiParts = {};
    for (const key of ACTOR_PART_KEYS) {
        this._uiParts[key] = { x: 0, y: 0, w: 8, h: 8, hidden: false };
    }
    this._uiBg = new Sprite();
    this._uiFace = new Sprite();
    this._uiName = new Sprite();
    this._uiAmmo = new Sprite();
    // 味方ターゲット選択中の強調枠（編集対象ではない／レイアウトデータには含まれない）
    this._uiSelect = new Sprite();
    this._uiSelect.visible = false;
    this._uiLastMaxAmmo = null;
    // HP／SANは「バー＋テキスト」を1セットにした1つの編集対象（Bar/Textは内部の子）
    this._uiGauges = {
        HP: { bar: new Sprite_BattleUIEdGauge(8, 2, "bar", 8), text: new Sprite_BattleUIEdGauge(8, 2, "text", 8) },
        SAN: { bar: new Sprite_BattleUIEdGauge(8, 2, "bar", 8), text: new Sprite_BattleUIEdGauge(8, 2, "text", 8) }
    };
    // バーの太さ÷全体の高さ（サイズ変更しても、この比率でバーとテキストを配分する）
    this._uiGaugeRatio = {
        HP: Math.min(1, config.hpH / Math.max(24, config.hpH)),
        SAN: Math.min(1, config.sanH / Math.max(24, config.sanH))
    };
    this.addChild(this._uiBg);
    this.addChild(this._uiFace);
    this.addChild(this._uiName);
    for (const key of Object.keys(this._uiGauges)) {
        this.addChild(this._uiGauges[key].bar);
        this.addChild(this._uiGauges[key].text);
    }
    this.addChild(this._uiAmmo);
    this.addChild(this._uiSelect);
    this.visible = false;
};

Sprite_BattleUIActorStatus.prototype.destroy = function(options) {
    this._uiDestroyed = true;
    destroySpriteBitmap(this._uiBg);
    destroySpriteBitmap(this._uiFace);
    destroySpriteBitmap(this._uiName);
    destroySpriteBitmap(this._uiAmmo);
    destroySpriteBitmap(this._uiSelect);
    Sprite.prototype.destroy.call(this, options);
};

Sprite_BattleUIActorStatus.prototype.partSprite = function(key) {
    switch (key) {
    case "Panel": return this._uiBg;
    case "Face": return this._uiFace;
    case "Name": return this._uiName;
    case "Ammo": return this._uiAmmo;
    default: return this._uiGauges[key] ? this._uiGauges[key].bar : null;
    }
};

// その要素を構成するSprite（HP/SANは バー＋テキスト）
Sprite_BattleUIActorStatus.prototype.partSprites = function(key) {
    const set = this._uiGauges[key];
    if (set) return [set.bar, set.text];
    const sprite = this.partSprite(key);
    return sprite ? [sprite] : [];
};

// 要素ごとの編集対象定義（ID・初期位置・サイズ・最小サイズ）。初期値は旧パラメータ互換。
Sprite_BattleUIActorStatus.prototype.makeDefs = function() {
    const c = this._uiConfig;
    const n = this._uiSlot + 1;
    const group = "Actor" + n;
    const fw = ImageManager.faceWidth || 144;
    const fh = ImageManager.faceHeight || 144;
    const make = (key, kind, priority, x, y, w, h, minW, minH, hidden, master) => makeElementDef({
        id: group + "_" + key, key: key, kind: kind, priority: priority, group: group,
        master: master, owner: this, minW: minW, minH: minH,
        x: x, y: y, w: w, h: h, hidden: hidden,
        isAvailable: () => this.isPartAvailable(key)
    });
    const off = h => Math.max(24, h) - h;
    // HP／SAN：バーとテキストを含む1つの矩形（旧バージョンの標準配置と同じ位置）
    const hpX = c.x + c.hpX;
    const hpY = c.y + c.hpY - off(c.hpH);
    const sanX = c.x + c.sanX;
    const sanY = c.y + c.sanY - off(c.sanH);
    return [
        make("Panel", "panel", 1, c.x, c.y, c.width, c.height, 32, 32, !c.visible, true),
        make("Face", "image", 4, c.x + c.faceX, c.y + c.faceY,
            Math.round(fw * c.faceScale), Math.round(fh * c.faceScale), 8, 8, !c.showFace, false),
        make("Name", "name", 8, c.x + 96, c.y, legacyNameWidth, nameFontSize + 6, 16, 8, false, false),
        make("HP", "gauge", 6, hpX, hpY, c.hpW, Math.max(24, c.hpH), 16, 8, false, false),
        make("SAN", "gauge", 6, sanX, sanY, c.sanW, Math.max(24, c.sanH), 16, 8, false, false),
        make("Ammo", "ammo", 7, c.x + c.ammoX, c.y + c.ammoY, AMMO_RECT_WIDTH, AMMO_RECT_HEIGHT, 16, 8, false, false)
    ];
};

// 「このキャラクターのこの要素が使える状態か」（表示OFF設定とは別。編集対象の判定に使う）
Sprite_BattleUIActorStatus.prototype.isPartAvailable = function(key) {
    const actor = this._uiActor || $gameParty.battleMembers()[this._uiSlot] || null;
    if (!actor) return false;
    switch (key) {
    case "Name": return showName;
    case "SAN": return sanSupported;
    case "Ammo": return ammoSupported;
    default: return true;
    }
};

Sprite_BattleUIActorStatus.prototype.setEditMode = function(flag) {
    this._uiEditMode = !!flag;
};

// 色の設定（5種類は完全に独立。全キャラクター共通。""＝標準色）
//   hpColor／sanColor           … HP／SANバーの塗り色
//   hpTextColor／sanTextColor   … HP／SANのラベル・数値文字
//   ammoTextColor               … AMMOのラベル・数値文字
Sprite_BattleUIActorStatus.prototype.setColors = function(st) {
    const g = this._uiGauges;
    g.HP.bar.setBarColor(st.hpColor);
    g.HP.text.setTextColor(st.hpTextColor);
    g.SAN.bar.setBarColor(st.sanColor);
    g.SAN.text.setTextColor(st.sanTextColor);
    const ammo = normalizeHexColor(st.ammoTextColor);
    if (ammo !== null && ammo !== this._uiAmmoColor) {
        this._uiAmmoColor = ammo;
        this._uiDirty.Ammo = true;
        if (this._uiActor) this.refreshDirty(); // 色の変更を即座に反映
    }
};

// アクターステータス背景の共通画像（4人とも同じ名前を設定する）
Sprite_BattleUIActorStatus.prototype.setBackgroundImage = function(name) {
    this._uiImage = String(name || "");
    this._uiDirty.Panel = true;
};

// 位置・サイズ・表示/非表示の反映（UIエディタ／保存データの両方がここを通る）
Sprite_BattleUIActorStatus.prototype.setPart = function(key, rect, hidden) {
    const p = this._uiParts[key];
    const sprite = this.partSprite(key);
    if (!p || !sprite) return;
    const w = Math.max(1, Math.round(rect.w));
    const h = Math.max(1, Math.round(rect.h));
    const sizeChanged = p.w !== w || p.h !== h;
    p.x = Math.round(rect.x);
    p.y = Math.round(rect.y);
    p.w = w;
    p.h = h;
    p.hidden = !!hidden;
    const set = this._uiGauges[key];
    if (set) {
        // HP／SAN：バーとテキストを同じ矩形に重ね、サイズ変更もセットで行う
        const barH = Math.max(2, Math.min(h, Math.round(h * this._uiGaugeRatio[key])));
        for (const g of [set.bar, set.text]) {
            g.resize(w, barH, h);
            g.move(p.x, p.y);
        }
    } else {
        sprite.move(p.x, p.y);
        if (sizeChanged || !sprite.bitmap) {
            this._uiDirty[key] = true;
            // サイズが変わったら、その場でBitmapを作り直して描き直す（編集Rect＝実際の表示領域）
            if (this._uiActor) this.refreshDirty();
        }
    }
};

Sprite_BattleUIActorStatus.prototype.setUIActor = function(actor) {
    this._uiActor = actor || null;
    if (this._uiActor) {
        const g = this._uiGauges;
        g.HP.bar.setup(this._uiActor, "hp");
        g.HP.text.setup(this._uiActor, "hp");
        if (sanSupported) {
            g.SAN.bar.setup(this._uiActor, "san");
            g.SAN.text.setup(this._uiActor, "san");
        }
    }
    this.refresh();
};

// 全部を描き直す（外部プラグイン互換：旧パネルの refresh と同じ名前）
Sprite_BattleUIActorStatus.prototype.refresh = function() {
    if (this._uiDestroyed) return;
    for (const key of ["Panel", "Face", "Name", "Ammo"]) this._uiDirty[key] = true;
};

Sprite_BattleUIActorStatus.prototype.isUIPanelVisible = function() {
    if (!this._uiActor || this._uiParts.Panel.hidden) return false;
    if (window.BattleUI.suppress.core) return false;
    if (hideWhileMessage && $gameMessage && $gameMessage.isBusy()) return false;
    return true;
};

Sprite_BattleUIActorStatus.prototype.update = function() {
    Sprite.prototype.update.call(this);
    if (this._uiDestroyed) return;
    const actor = $gameParty.battleMembers()[this._uiSlot] || null;
    if (actor !== this._uiActor) this.setUIActor(actor);
    this.updateUIDirty();
    this.refreshDirty();
    this.updateUIVisibility();
    this.updateUISelect();
};

// 画像の読み込み状況・アクターの変化・AMMOの増減を検出して描き直す
Sprite_BattleUIActorStatus.prototype.updateUIDirty = function() {
    const actor = this._uiActor;
    const sig = this._uiSig;
    const bgSig = pictureSignature(this._uiImage);
    if (bgSig !== sig.bg) {
        sig.bg = bgSig;
        this._uiDirty.Panel = true;
    }
    if (!actor) return;
    const c = this._uiConfig;
    const faceName = c.faceImage || actor.faceName();
    const faceIndex = c.faceImage ? c.faceIndex : actor.faceIndex();
    const faceSig = faceName + "|" + faceIndex;
    if (faceSig !== sig.face) {
        sig.face = faceSig;
        this._uiDirty.Face = true;
    }
    const nameSig = actor.name() + "|" + nameFontSize;
    if (nameSig !== sig.name) {
        sig.name = nameSig;
        this._uiDirty.Name = true;
    }
    if (ammoSupported) {
        const info = getAmmoInfo(actor);
        const ammoSig = info.cur + "/" + info.max;
        // 診断用（読み取り専用）：window.BattleUI.debugAmmo = true でmaxAmmoの変化をログに出す。
        // 値は一切変更しない。maxAmmoが0になる原因（AimMinigame等）の切り分け用。
        if (window.BattleUI.debugAmmo === true && this._uiLastMaxAmmo !== info.max) {
            const sc = SceneManager._scene;
            const aw = sc && sc._actorWindow;
            console.warn("[BattleUI] maxAmmo changed: slot=" + this._uiSlot + " actor=" + actor.name() +
                " " + this._uiLastMaxAmmo + " -> " + info.max + " (ammo=" + info.cur + ")" +
                " phase=" + (BattleManager._phase || "") +
                " actorWindowActive=" + !!(aw && aw.active));
        }
        this._uiLastMaxAmmo = info.max;
        if (ammoSig !== sig.ammo) {
            sig.ammo = ammoSig;
            this._uiDirty.Ammo = true;
        }
    }
};

Sprite_BattleUIActorStatus.prototype.refreshDirty = function() {
    const dirty = this._uiDirty;
    if (dirty.Panel) { dirty.Panel = false; this.drawBackground(); }
    if (dirty.Face) { dirty.Face = false; this.drawFace(); }
    if (dirty.Name) { dirty.Name = false; this.drawName(); }
    if (dirty.Ammo) { dirty.Ammo = false; this.drawAmmo(); }
};

// 背景：共通画像を設定していればパネルサイズに合わせて伸縮表示。未設定なら黒背景（従来通り）
Sprite_BattleUIActorStatus.prototype.drawBackground = function() {
    const p = this._uiParts.Panel;
    ensureSpriteBitmap(this._uiBg, p.w, p.h);
    const bmp = this._uiBg.bitmap;
    bmp.clear();
    const img = this._uiImage ? getPicture(this._uiImage) : null;
    if (img && img.isReady()) {
        bmp.blt(img, 0, 0, img.width, img.height, 0, 0, p.w, p.h);
    } else {
        bmp.fillRect(0, 0, p.w, p.h, "#000000");
    }
};

Sprite_BattleUIActorStatus.prototype.waitFaceBitmap = function(bitmap) {
    if (this._uiFaceWaiting.indexOf(bitmap) >= 0) return;
    this._uiFaceWaiting.push(bitmap);
    bitmap.addLoadListener(() => {
        const index = this._uiFaceWaiting.indexOf(bitmap);
        if (index >= 0) this._uiFaceWaiting.splice(index, 1);
        if (!this._uiDestroyed) this._uiDirty.Face = true;
    });
};

// 顔グラフィック：要素の幅・高さに合わせて拡大縮小して描く
Sprite_BattleUIActorStatus.prototype.drawFace = function() {
    const p = this._uiParts.Face;
    ensureSpriteBitmap(this._uiFace, p.w, p.h);
    const bmp = this._uiFace.bitmap;
    bmp.clear();
    const actor = this._uiActor;
    if (!actor) return;
    const c = this._uiConfig;
    const faceName = c.faceImage || actor.faceName();
    const faceIndex = c.faceImage ? c.faceIndex : actor.faceIndex();
    if (!faceName) return;
    const src = ImageManager.loadFace(faceName);
    if (!src.isReady()) {
        this.waitFaceBitmap(src);
        return;
    }
    const pw = ImageManager.faceWidth;
    const ph = ImageManager.faceHeight;
    const sx = (faceIndex % 4) * pw;
    const sy = Math.floor(faceIndex / 4) * ph;
    bmp.paintOpacity = actor.isBattleMember() ? 255 : 160;
    bmp.blt(src, sx, sy, pw, ph, 0, 0, p.w, p.h);
    bmp.paintOpacity = 255;
};

Sprite_BattleUIActorStatus.prototype.drawName = function() {
    const p = this._uiParts.Name;
    ensureSpriteBitmap(this._uiName, p.w, p.h);
    const bmp = this._uiName.bitmap;
    bmp.clear();
    const actor = this._uiActor;
    if (!actor) return;
    bmp.fontFace = $gameSystem.mainFontFace();
    bmp.fontSize = nameFontSize;
    bmp.textColor = ColorManager.hpColor(actor);
    bmp.drawText(actor.name(), 0, 0, p.w, p.h, "left");
};

// AMMO：値の取得(getAmmoInfo)と描画(drawAmmoText)を分け、通常戦闘もUIエディタも
// この同じ処理だけを使う（編集中専用の表示・ダミー描画はしない）。
// 描画先は「このキャラ専用のBitmap」で、編集Rectと同じ幅・高さ。
Sprite_BattleUIActorStatus.prototype.drawAmmo = function() {
    const p = this._uiParts.Ammo;
    ensureSpriteBitmap(this._uiAmmo, p.w, p.h);
    const bmp = this._uiAmmo.bitmap;
    bmp.clear();
    const actor = this._uiActor;
    if (!actor || !ammoSupported) return;
    drawAmmoText(bmp, getAmmoInfo(actor), p.w, p.h, this._uiAmmoColor);
};

// 表示/非表示：存在しないActor3/4・表示OFF・メッセージ中などを判定する
Sprite_BattleUIActorStatus.prototype.updateUIVisibility = function() {
    const edit = this._uiEditMode;
    const actor = this._uiActor;
    const hiddenAll = this._uiParts.Panel.hidden;
    let visible = !!actor && (edit || !hiddenAll);
    if (visible && !edit) visible = this.isUIPanelVisible();
    this.visible = visible;
    this.alpha = edit && hiddenAll ? GHOST_ALPHA : 1;
    if (!visible) return;
    for (const key of ACTOR_PART_KEYS) {
        const hid = key !== "Panel" && this._uiParts[key].hidden;
        const show = this.isPartAvailable(key) && (!hid || edit);
        for (const sprite of this.partSprites(key)) {
            sprite.visible = show;
            sprite.alpha = hid ? GHOST_ALPHA : 1;
        }
    }
};

// 味方ターゲット選択中の強調表示。
// Window_BattleActor は見た目を描画しなくなったため、選択中のパネルをここで枠表示する。
// 位置・サイズは既存の Panel 要素（UIエディタ設定）をそのまま参照するだけで、
// レイアウト・_uiParts・画像・色・AMMOには一切書き込まない。
Sprite_BattleUIActorStatus.prototype.updateUISelect = function() {
    const sp = this._uiSelect;
    if (!sp) return;
    let on = false;
    if (this.visible && !this._uiEditMode && this._uiActor) {
        const scene = SceneManager._scene;
        const win = scene && scene._actorWindow;
        if (win && win.active && typeof win.actor === "function") {
            on = !!win._cursorAll || win.actor(win.index()) === this._uiActor;
        }
    }
    sp.visible = on;
    if (!on) return;
    const p = this._uiParts.Panel;
    if (ensureSpriteBitmap(sp, p.w, p.h)) {
        const bmp = sp.bitmap;
        bmp.clear();
        bmp.fillRect(0, 0, p.w, p.h, "rgba(255,255,255,0.15)");
        strokeBox(bmp, 0, 0, p.w, p.h, 3, "#ffffff");
    }
    sp.move(p.x, p.y);
    sp.alpha = 0.65 + 0.35 * Math.sin(Graphics.frameCount / 7);
};

//==================================================================
// Sprite_BattleUICommandSkin：アクターコマンドの見た目（背景＋3つのボタン）
// ----------------------------------------------------------------
// ActorCommand
//  ├ Background ├ Skill ├ Item └ Escape
// 実際の操作（カーソル・決定・キャンセル・タッチ）は標準の Window_ActorCommand が
// 行い、このクラスは「背景画像／ボタン画像」と「各ボタンの位置・サイズ」を担当する。
// Window_ActorCommand は透明にして、背景とボタンをまとめた範囲に配置する。
//==================================================================

function Sprite_BattleUICommandSkin() {
    this.initialize(...arguments);
}

Sprite_BattleUICommandSkin.prototype = Object.create(Sprite.prototype);
Sprite_BattleUICommandSkin.prototype.constructor = Sprite_BattleUICommandSkin;

Sprite_BattleUICommandSkin.prototype.initialize = function(win, defaults) {
    Sprite.prototype.initialize.call(this);
    this._uiWindow = win;
    this._uiDefaults = defaults;
    this._uiParts = {};
    for (const key of COMMAND_PART_KEYS) {
        this._uiParts[key] = { x: 0, y: 0, w: COMMAND_MIN_SIZE, h: COMMAND_MIN_SIZE, hidden: false };
    }
    this._uiImages = { commandBg: "", buttonNormal: "", buttonSelected: "" };
    this._uiEditMode = false;
    this._uiForceKey = "";
    this._uiBgDirty = true;
    this._uiBgSig = "";
    this._uiCursorSig = "";
    this._uiDestroyed = false;
    this._uiBg = new Sprite();
    this._uiButtons = { Skill: new Sprite(), Item: new Sprite(), Escape: new Sprite() };
    this.addChild(this._uiBg);
    for (const key of Object.keys(this._uiButtons)) this.addChild(this._uiButtons[key]);
    this.visible = false;
    // ウィンドウは透明にし、余白(padding)なしで「背景＋ボタン」の範囲に合わせる
    win._battleUISkin = this;
    win.padding = 0;
    win.setBackgroundType(2);
};

Sprite_BattleUICommandSkin.prototype.destroy = function(options) {
    this._uiDestroyed = true;
    destroySpriteBitmap(this._uiBg);
    const win = this._uiWindow;
    if (win && win._battleUISkin === this) win._battleUISkin = null;
    this._uiWindow = null;
    Sprite.prototype.destroy.call(this, options);
};

Sprite_BattleUICommandSkin.prototype.makeDefs = function() {
    const bg = this._uiDefaults.Background;
    const make = (key, kind, priority, rect, master) => makeElementDef({
        id: "ActorCommand_" + key, key: key, kind: kind, priority: priority, group: "ActorCommand",
        master: master, owner: this, minW: COMMAND_MIN_SIZE, minH: COMMAND_MIN_SIZE,
        x: rect.x, y: rect.y, w: rect.w, h: rect.h, hidden: false,
        isAvailable: () => !!this._uiWindow && $gameParty.battleMembers().length > 0
    });
    return [
        make("Background", "cmdbg", 1, bg, true),
        make("Skill", "button", 5, this._uiDefaults.Skill, false),
        make("Item", "button", 5, this._uiDefaults.Item, false),
        make("Escape", "button", 5, this._uiDefaults.Escape, false)
    ];
};

// 値だけ保存する（まとめて設定する時用。反映は layoutParts で行う）
Sprite_BattleUICommandSkin.prototype.storePart = function(key, rect, hidden) {
    const p = this._uiParts[key];
    if (!p) return;
    const w = Math.max(COMMAND_MIN_SIZE, Math.round(rect.w));
    const h = Math.max(COMMAND_MIN_SIZE, Math.round(rect.h));
    if (key === "Background" && (p.w !== w || p.h !== h)) this._uiBgDirty = true;
    p.x = Math.round(rect.x);
    p.y = Math.round(rect.y);
    p.w = w;
    p.h = h;
    p.hidden = !!hidden;
};

Sprite_BattleUICommandSkin.prototype.setPart = function(key, rect, hidden) {
    this.storePart(key, rect, hidden);
    this.layoutParts();
};

Sprite_BattleUICommandSkin.prototype.partRect = function(key) {
    return this._uiParts[key];
};

// 非表示にしたボタンは、通常の戦闘ではコマンド自体を出さない（編集中は表示する）
Sprite_BattleUICommandSkin.prototype.isCommandHidden = function(key) {
    if (this._uiEditMode) return false;
    const p = this._uiParts[key];
    return !!p && p.hidden;
};

Sprite_BattleUICommandSkin.prototype.setEditMode = function(flag) {
    this._uiEditMode = !!flag;
};

// 編集中、選択しているボタンを「選択中画像」で表示して確認できるようにする
Sprite_BattleUICommandSkin.prototype.setForceKey = function(key) {
    this._uiForceKey = key || "";
};

Sprite_BattleUICommandSkin.prototype.setImages = function(images) {
    this._uiImages.commandBg = String(images.commandBg || "");
    this._uiImages.buttonNormal = String(images.buttonNormal || "");
    this._uiImages.buttonSelected = String(images.buttonSelected || "");
    this._uiBgDirty = true;
    this.updateCursorVisibility();
    const win = this._uiWindow;
    if (win && typeof win.refresh === "function") win.refresh();
};

Sprite_BattleUICommandSkin.prototype.isImageMode = function() {
    return !!(getPicture(this._uiImages.buttonNormal) || getPicture(this._uiImages.buttonSelected));
};

// 選択中画像が使える時は、標準のカーソル枠を出さない
Sprite_BattleUICommandSkin.prototype.hasSelectedImage = function() {
    return !!getPicture(this._uiImages.buttonSelected);
};

Sprite_BattleUICommandSkin.prototype.updateCursorVisibility = function() {
    const win = this._uiWindow;
    if (win && typeof win.refreshCursor === "function") win.refreshCursor();
};

// 背景＋3つのボタンをまとめた範囲へ Window_ActorCommand を移動／リサイズする
Sprite_BattleUICommandSkin.prototype.layoutParts = function() {
    const P = this._uiParts;
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    for (const key of COMMAND_PART_KEYS) {
        const p = P[key];
        x1 = Math.min(x1, p.x);
        y1 = Math.min(y1, p.y);
        x2 = Math.max(x2, p.x + p.w);
        y2 = Math.max(y2, p.y + p.h);
    }
    this._uiBg.move(P.Background.x, P.Background.y);
    const win = this._uiWindow;
    if (!win) return;
    const rx = Math.round(x1);
    const ry = Math.round(y1);
    const rw = Math.max(COMMAND_MIN_SIZE, Math.round(x2 - x1));
    const rh = Math.max(COMMAND_MIN_SIZE, Math.round(y2 - y1));
    const sizeChanged = win.width !== rw || win.height !== rh || !win._battleUILaidOut;
    win.move(rx, ry, rw, rh);
    if (sizeChanged) {
        win.createContents();
        win._battleUILaidOut = true;
    }
    win.refresh();
    this.updateCursorVisibility();
};

Sprite_BattleUICommandSkin.prototype.update = function() {
    Sprite.prototype.update.call(this);
    const win = this._uiWindow;
    if (!win || this._uiDestroyed) return;
    const edit = this._uiEditMode;
    const shown = edit || (win.visible && win.openness > 0);
    this.visible = shown;
    this.alpha = edit ? 1 : win.openness / 255;
    if (!shown) return;
    const skinReady = win.windowskin && win.windowskin.isReady() ? 1 : 0;
    const sig = pictureSignature(this._uiImages.commandBg) + "|" + skinReady + "|" + commandBackOpacity;
    if (this._uiBgDirty || sig !== this._uiBgSig) {
        this._uiBgSig = sig;
        this._uiBgDirty = false;
        this.redrawBackground();
    }
    const cursorSig = pictureSignature(this._uiImages.buttonSelected);
    if (cursorSig !== this._uiCursorSig) {
        this._uiCursorSig = cursorSig;
        this.updateCursorVisibility();
    }
    this.updateButtons();
};

// 背景：画像があれば画像、なければ標準のウィンドウ背景＋枠
Sprite_BattleUICommandSkin.prototype.redrawBackground = function() {
    const p = this._uiParts.Background;
    const win = this._uiWindow;
    ensureSpriteBitmap(this._uiBg, p.w, p.h);
    const bmp = this._uiBg.bitmap;
    const img = this._uiImages.commandBg ? getPicture(this._uiImages.commandBg) : null;
    if (img && img.isReady()) {
        bmp.clear();
        bmp.blt(img, 0, 0, img.width, img.height, 0, 0, p.w, p.h);
    } else {
        drawWindowSkinBox(bmp, win ? win.windowskin : null, commandBackOpacity);
    }
};

Sprite_BattleUICommandSkin.prototype.commandIndexOf = function(key) {
    const win = this._uiWindow;
    if (!win || !win._list) return -1;
    for (let i = 0; i < win._list.length; i++) {
        if (COMMAND_SYMBOL_KEY[win._list[i].symbol] === key) return i;
    }
    return -1;
};

// ボタン画像：カーソルが乗っているボタンだけ「選択中画像」、他は「通常画像」
Sprite_BattleUICommandSkin.prototype.updateButtons = function() {
    const win = this._uiWindow;
    const edit = this._uiEditMode;
    const normal = getPicture(this._uiImages.buttonNormal);
    const selected = getPicture(this._uiImages.buttonSelected);
    const bgHidden = this._uiParts.Background.hidden && !edit;
    this._uiBg.visible = !bgHidden;
    this._uiBg.alpha = this._uiParts.Background.hidden ? GHOST_ALPHA : 1;
    for (const key of Object.keys(this._uiButtons)) {
        const sprite = this._uiButtons[key];
        const p = this._uiParts[key];
        const idx = this.commandIndexOf(key);
        const isSelected = this._uiForceKey ? this._uiForceKey === key : (idx >= 0 && idx === win.index());
        const img = isSelected && selected ? selected : normal;
        if (!img || !img.isReady() || (p.hidden && !edit)) {
            sprite.visible = false;
            continue;
        }
        if (sprite.bitmap !== img) sprite.bitmap = img;
        sprite.move(p.x, p.y);
        sprite.scale.x = p.w / Math.max(1, img.width);
        sprite.scale.y = p.h / Math.max(1, img.height);
        sprite.alpha = p.hidden ? GHOST_ALPHA : 1;
        sprite.visible = true;
    }
};

//==================================================================
// Sprite_BattleUIListSkin：スキル一覧／アイテム一覧の背景画像と位置・サイズ
// ----------------------------------------------------------------
// 一覧は標準の Window_BattleSkill / Window_BattleItem のまま（操作は標準処理）。
// UIエディタで決めた位置・サイズを実際のWindowへ反映し、背景画像を設定した時だけ
// 標準のウィンドウ枠を消して画像を敷く（未設定なら標準ウィンドウ表示）。
//==================================================================

function Sprite_BattleUIListSkin() {
    this.initialize(...arguments);
}

Sprite_BattleUIListSkin.prototype = Object.create(Sprite.prototype);
Sprite_BattleUIListSkin.prototype.constructor = Sprite_BattleUIListSkin;

Sprite_BattleUIListSkin.prototype.initialize = function(win, id, rect) {
    Sprite.prototype.initialize.call(this);
    this._uiWindow = win;
    this._uiId = id;
    this._uiRect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
    this._uiDefaultRect = { x: rect.x, y: rect.y, w: rect.w, h: rect.h };
    this._uiImage = "";
    this._uiUseImage = false;
    this._uiEditMode = false;
    this._uiPrev = null;
    this._uiSig = "";
    this._uiDestroyed = false;
    this._uiBg = new Sprite();
    this.addChild(this._uiBg);
    this.visible = false;
    win._battleUIListSkin = this;
};

Sprite_BattleUIListSkin.prototype.destroy = function(options) {
    this._uiDestroyed = true;
    destroySpriteBitmap(this._uiBg);
    const win = this._uiWindow;
    if (win && win._battleUIListSkin === this) win._battleUIListSkin = null;
    this._uiWindow = null;
    Sprite.prototype.destroy.call(this, options);
};

Sprite_BattleUIListSkin.prototype.makeDefs = function() {
    const r = this._uiDefaultRect;
    return [makeElementDef({
        id: this._uiId, key: "List", kind: "list", priority: 2, group: this._uiId,
        master: true, noHide: true, owner: this, minW: 64, minH: 64,
        x: r.x, y: r.y, w: r.w, h: r.h, hidden: false,
        isAvailable: () => !!this._uiWindow
    })];
};

// 位置・サイズを実際のWindowへ反映する
Sprite_BattleUIListSkin.prototype.setPart = function(key, rect) {
    const win = this._uiWindow;
    const r = this._uiRect;
    const w = Math.max(64, Math.round(rect.w));
    const h = Math.max(64, Math.round(rect.h));
    const sizeChanged = r.w !== w || r.h !== h || (win && (win.width !== w || win.height !== h));
    r.x = Math.round(rect.x);
    r.y = Math.round(rect.y);
    r.w = w;
    r.h = h;
    this._uiBg.move(r.x, r.y);
    if (!win) return;
    win.move(r.x, r.y, w, h);
    if (sizeChanged) {
        win.createContents();
        win.refresh();
        if (typeof win.scrollTo === "function" && typeof win.scrollX === "function" && typeof win.scrollY === "function") {
            win.scrollTo(win.scrollX(), win.scrollY()); // 縮小後のスクロール位置を範囲内に収める
        }
        if (typeof win.refreshCursor === "function") win.refreshCursor();
        this._uiSig = "";
    }
};

Sprite_BattleUIListSkin.prototype.setImage = function(name) {
    this._uiImage = String(name || "");
    this._uiSig = "";
};

// 編集中は、一覧を（まだ開いていなくても）見える状態にして編集できるようにする
Sprite_BattleUIListSkin.prototype.beginPreview = function() {
    const win = this._uiWindow;
    if (!win) return;
    this._uiPrev = { visible: win.visible, actor: win._actor, stypeId: win._stypeId };
    this._uiEditMode = true;
    const actor = $gameParty.battleMembers()[0] || null;
    if (this._uiId === "SkillList" && actor && typeof win.setActor === "function") {
        win.setActor(actor);
        if (typeof win.setStypeId === "function") {
            win.setStypeId(resolveSkillTypeId(actor) || (actor.skillTypes()[0] || 1));
        }
    }
    win.refresh();
    win.show();
};

Sprite_BattleUIListSkin.prototype.endPreview = function() {
    const win = this._uiWindow;
    const prev = this._uiPrev;
    this._uiPrev = null;
    this._uiEditMode = false;
    if (!win || !prev) return;
    if (this._uiId === "SkillList" && typeof win.setActor === "function") {
        win.setActor(prev.actor || null);
        if (typeof win.setStypeId === "function") win.setStypeId(prev.stypeId || 0);
    }
    win.refresh();
    win.visible = prev.visible;
};

Sprite_BattleUIListSkin.prototype.update = function() {
    Sprite.prototype.update.call(this);
    const win = this._uiWindow;
    if (!win || this._uiDestroyed) return;
    const shown = this._uiEditMode || (win.visible && win.openness > 0);
    this.visible = shown;
    this.alpha = this._uiEditMode ? 1 : win.openness / 255;
    if (!shown) return;
    const img = this._uiImage ? getPicture(this._uiImage) : null;
    const ready = !!(img && img.isReady());
    const sig = pictureSignature(this._uiImage) + "|" + this._uiRect.w + "x" + this._uiRect.h;
    if (sig !== this._uiSig) {
        this._uiSig = sig;
        ensureSpriteBitmap(this._uiBg, this._uiRect.w, this._uiRect.h);
        const bmp = this._uiBg.bitmap;
        bmp.clear();
        if (ready) bmp.blt(img, 0, 0, img.width, img.height, 0, 0, this._uiRect.w, this._uiRect.h);
    }
    if (ready !== this._uiUseImage) {
        this._uiUseImage = ready;
        win.setBackgroundType(ready ? 2 : 0); // 画像がある時だけ標準の枠を消す
    }
    this._uiBg.visible = ready;
};

//==================================================================
// Window_ActorCommand：コマンド内容と見た目（旧 BattleUI_Command）
// （元の処理を退避し、アクターが存在する場合のみ置き換える）
//==================================================================

function resolveSkillTypeId(actor) {
    if (!actor || typeof actor.skillTypes !== "function") return 0;
    const types = actor.skillTypes();
    if (skillTypeIdParam > 0) {
        return types.indexOf(skillTypeIdParam) >= 0 ? skillTypeIdParam : 0;
    }
    return types.length > 0 ? types[0] : 0;
}

const _Window_ActorCommand_makeCommandList = Window_ActorCommand.prototype.makeCommandList;
Window_ActorCommand.prototype.makeCommandList = function() {
    if (!this._actor) {
        _Window_ActorCommand_makeCommandList.call(this);
        return;
    }
    const skin = this._battleUISkin;
    const stypeId = resolveSkillTypeId(this._actor);
    // 必殺技：標準の "skill" コマンド（ext＝スキルタイプID）なので、
    // Scene_Battle.commandSkill がそのままスキル選択を開く
    if (!skin || !skin.isCommandHidden("Skill")) this.addCommand(skillName, "skill", stypeId > 0, stypeId);
    // アイテム：標準の "item" コマンド
    if (!skin || !skin.isCommandHidden("Item")) this.addCommand(itemName, "item", true);
    // 逃げる：標準の逃走処理を呼ぶ "escape" コマンド
    if (!skin || !skin.isCommandHidden("Escape")) this.addCommand(escapeName, "escape", BattleManager.canEscape());
};

const _Window_ActorCommand_maxCols = Window_ActorCommand.prototype.maxCols;
Window_ActorCommand.prototype.maxCols = function() {
    return commandCols || _Window_ActorCommand_maxCols.call(this);
};

const _Window_ActorCommand_resetFontSettings = Window_ActorCommand.prototype.resetFontSettings;
Window_ActorCommand.prototype.resetFontSettings = function() {
    _Window_ActorCommand_resetFontSettings.call(this);
    this.contents.fontSize = commandFontSize;
};

const _Window_ActorCommand_lineHeight = Window_ActorCommand.prototype.lineHeight;
Window_ActorCommand.prototype.lineHeight = function() {
    return Math.max(_Window_ActorCommand_lineHeight.call(this), commandFontSize + 8);
};

const _Window_ActorCommand_itemHeight = Window_ActorCommand.prototype.itemHeight;
Window_ActorCommand.prototype.itemHeight = function() {
    return Math.max(_Window_ActorCommand_itemHeight.call(this), this.lineHeight());
};

const _Window_ActorCommand_updateBackOpacity = Window_ActorCommand.prototype.updateBackOpacity;
Window_ActorCommand.prototype.updateBackOpacity = function() {
    _Window_ActorCommand_updateBackOpacity.call(this);
    this.backOpacity = commandBackOpacity;
};

// --- 各ボタンを自由な位置・サイズに置くための拡張（スキンが付いている時だけ有効）---

// 余白(padding)なし：ウィンドウ＝「背景＋ボタン」の範囲
const _Window_ActorCommand_updatePadding = Window_ActorCommand.prototype.updatePadding;
Window_ActorCommand.prototype.updatePadding = function() {
    if (this._battleUISkin) {
        this.padding = 0;
        return;
    }
    _Window_ActorCommand_updatePadding.call(this);
};

// 各コマンド（必殺技／アイテム／逃げる）の範囲＝UIエディタで設定した各ボタンの範囲
const _Window_ActorCommand_itemRect = Window_ActorCommand.prototype.itemRect;
Window_ActorCommand.prototype.itemRect = function(index) {
    const skin = this._battleUISkin;
    if (skin && this._list && index >= 0 && index < this._list.length) {
        const key = COMMAND_SYMBOL_KEY[this._list[index].symbol];
        const p = key ? skin.partRect(key) : null;
        if (p) return new Rectangle(p.x - this.x, p.y - this.y, p.w, p.h);
    }
    return _Window_ActorCommand_itemRect.call(this, index);
};

const _Window_ActorCommand_maxVisibleItems = Window_ActorCommand.prototype.maxVisibleItems;
Window_ActorCommand.prototype.maxVisibleItems = function() {
    return this._battleUISkin ? this.maxItems() : _Window_ActorCommand_maxVisibleItems.call(this);
};

const _Window_ActorCommand_overallHeight = Window_ActorCommand.prototype.overallHeight;
Window_ActorCommand.prototype.overallHeight = function() {
    return this._battleUISkin ? this.innerHeight : _Window_ActorCommand_overallHeight.call(this);
};

const _Window_ActorCommand_overallWidth = Window_ActorCommand.prototype.overallWidth;
Window_ActorCommand.prototype.overallWidth = function() {
    return this._battleUISkin ? this.innerWidth : _Window_ActorCommand_overallWidth.call(this);
};

// 配置が自由なので、スクロールはしない
const _Window_ActorCommand_ensureCursorVisible = Window_ActorCommand.prototype.ensureCursorVisible;
Window_ActorCommand.prototype.ensureCursorVisible = function(smooth) {
    if (this._battleUISkin) return;
    _Window_ActorCommand_ensureCursorVisible.call(this, smooth);
};

const _Window_ActorCommand_itemTextAlign = Window_ActorCommand.prototype.itemTextAlign;
Window_ActorCommand.prototype.itemTextAlign = function() {
    const skin = this._battleUISkin;
    return skin && skin.isImageMode() ? "center" : _Window_ActorCommand_itemTextAlign.call(this);
};

const _Window_ActorCommand_drawItemBackground = Window_ActorCommand.prototype.drawItemBackground;
Window_ActorCommand.prototype.drawItemBackground = function(index) {
    const skin = this._battleUISkin;
    if (skin && skin.isImageMode()) return;
    _Window_ActorCommand_drawItemBackground.call(this, index);
};

const _Window_ActorCommand_refreshCursor = Window_ActorCommand.prototype.refreshCursor;
Window_ActorCommand.prototype.refreshCursor = function() {
    const skin = this._battleUISkin;
    if (skin && skin.hasSelectedImage()) {
        this.setCursorRect(0, 0, 0, 0);
        return;
    }
    _Window_ActorCommand_refreshCursor.call(this);
};

// ボタンを横に並べた時のために、列数1でも ←→ で移動できるようにする
const _Window_ActorCommand_cursorRight = Window_ActorCommand.prototype.cursorRight;
Window_ActorCommand.prototype.cursorRight = function(wrap) {
    if (this._battleUISkin && this.maxCols() <= 1) {
        this.cursorDown(wrap);
        return;
    }
    _Window_ActorCommand_cursorRight.call(this, wrap);
};

const _Window_ActorCommand_cursorLeft = Window_ActorCommand.prototype.cursorLeft;
Window_ActorCommand.prototype.cursorLeft = function(wrap) {
    if (this._battleUISkin && this.maxCols() <= 1) {
        this.cursorUp(wrap);
        return;
    }
    _Window_ActorCommand_cursorLeft.call(this, wrap);
};

//==================================================================
// Scene_Battle：ステータス／コマンドの生成と後始末
//==================================================================

// ステータス・コマンドの見た目は、ウィンドウ層のすぐ下のSprite層に置く
Scene_Battle.prototype.createBattleUILayer = function() {
    if (this._battleUILayer) return;
    const layer = new Sprite();
    const wl = this._windowLayer;
    layer.x = wl ? wl.x : 0;
    layer.y = wl ? wl.y : 0;
    const index = wl ? this.children.indexOf(wl) : -1;
    if (index >= 0) this.addChildAt(layer, index);
    else this.addChild(layer);
    this._battleUILayer = layer;
    this._battleUISettings = resolveSettings();
    this._battleUIDefs = [];
    this._battleUIListSkins = [];
};

const _Scene_Battle_createStatusWindow = Scene_Battle.prototype.createStatusWindow;
Scene_Battle.prototype.createStatusWindow = function() {
    _Scene_Battle_createStatusWindow.call(this);
    this.createBattleUIPanels();
};

// Actor1〜4：それぞれ独立したSprite（4つとも別オブジェクト）を生成する
Scene_Battle.prototype.createBattleUIPanels = function() {
    this.createBattleUILayer();
    this._battleUIPanels = [];
    for (let i = 0; i < MAX_ACTORS; i++) {
        const status = new Sprite_BattleUIActorStatus(i, panelConfigs[i]);
        this._battleUILayer.addChild(status);
        this._battleUIPanels.push(status);
        const defs = status.makeDefs();
        resolveDefsFromSaved(defs);       // 保存データ ＞ 初期状態
        status.setBackgroundImage(this._battleUISettings.statusBg);
        status.setColors(this._battleUISettings);
        for (const d of defs) {
            applyDef(d);
            this._battleUIDefs.push(d);
        }
        status.refresh();
    }
};

const _Scene_Battle_actorCommandWindowRect = Scene_Battle.prototype.actorCommandWindowRect;
Scene_Battle.prototype.actorCommandWindowRect = function() {
    // 初期状態の位置・サイズ（旧 CommandX/Y/Width/Height）。UIエディタの保存値は
    // 生成後に Sprite_BattleUICommandSkin が反映する（保存値が優先）。
    const rect = _Scene_Battle_actorCommandWindowRect.call(this);
    rect.x = legacyCommandRect.x;
    rect.y = legacyCommandRect.y;
    rect.width = legacyCommandRect.w;
    rect.height = legacyCommandRect.h;
    return rect;
};

const _Scene_Battle_createActorCommandWindow = Scene_Battle.prototype.createActorCommandWindow;
Scene_Battle.prototype.createActorCommandWindow = function() {
    _Scene_Battle_createActorCommandWindow.call(this);
    // 「逃げる」＝MZ標準の commandEscape（BattleManager.processEscape）を呼ぶ
    this._actorCommandWindow.setHandler("escape", this.onBattleUIEscape.bind(this));
    this.createBattleUICommandSkin();
};

Scene_Battle.prototype.createBattleUICommandSkin = function() {
    const win = this._actorCommandWindow;
    if (!win) return;
    this.createBattleUILayer();
    // 初期状態：標準の並び（旧パラメータの位置・サイズ・列数）から各ボタンの範囲を求める
    // （この時点ではスキン未装着なので、標準の itemRect が返る）
    const defaults = { Background: { x: win.x, y: win.y, w: win.width, h: win.height } };
    ["Skill", "Item", "Escape"].forEach((key, i) => {
        const r = win.itemRect(i);
        defaults[key] = {
            x: Math.round(win.x + win.padding + r.x),
            y: Math.round(win.y + win.padding + r.y),
            w: Math.max(COMMAND_MIN_SIZE, Math.round(r.width)),
            h: Math.max(COMMAND_MIN_SIZE, Math.round(r.height))
        };
    });
    const skin = new Sprite_BattleUICommandSkin(win, defaults);
    this._battleUILayer.addChild(skin);
    this._battleUISkin = skin;
    const defs = skin.makeDefs();
    resolveDefsFromSaved(defs);           // 保存データ ＞ 初期状態
    for (const d of defs) {
        skin.storePart(d.key, { x: d.curX, y: d.curY, w: d.curW, h: d.curH }, d.curHidden);
        this._battleUIDefs.push(d);
    }
    skin.setImages(this._battleUISettings);
    skin.layoutParts();
};

// スキル一覧・アイテム一覧（標準Windowの位置・サイズ・背景画像をUIエディタで設定）
Scene_Battle.prototype.createBattleUIListSkin = function(win, id, settingKey) {
    if (!win) return;
    this.createBattleUILayer();
    const skin = new Sprite_BattleUIListSkin(win, id, { x: win.x, y: win.y, w: win.width, h: win.height });
    this._battleUILayer.addChild(skin);
    this._battleUIListSkins.push(skin);
    const defs = skin.makeDefs();
    resolveDefsFromSaved(defs);           // 保存データ ＞ 初期状態
    for (const d of defs) {
        applyDef(d);
        this._battleUIDefs.push(d);
    }
    skin.setImage(this._battleUISettings[settingKey]);
};

const _Scene_Battle_createSkillWindow = Scene_Battle.prototype.createSkillWindow;
Scene_Battle.prototype.createSkillWindow = function() {
    _Scene_Battle_createSkillWindow.call(this);
    this.createBattleUIListSkin(this._skillWindow, "SkillList", "skillBg");
};

const _Scene_Battle_createItemWindow = Scene_Battle.prototype.createItemWindow;
Scene_Battle.prototype.createItemWindow = function() {
    _Scene_Battle_createItemWindow.call(this);
    this.createBattleUIListSkin(this._itemWindow, "ItemList", "itemBg");
};

Scene_Battle.prototype.onBattleUIEscape = function() {
    if (typeof this.commandEscape === "function") {
        this.commandEscape();
    } else {
        BattleManager.processEscape();
        this.changeInputWindow();
    }
};

const _Scene_Battle_startPartyCommandSelection = Scene_Battle.prototype.startPartyCommandSelection;
Scene_Battle.prototype.startPartyCommandSelection = function() {
    if (
        skipPartyCommand &&
        !BattleManager.isTpb() &&
        BattleManager.isInputting() &&
        !BattleManager.actor() &&
        $gameParty.canInput()
    ) {
        // 「戦う」を選んだ時と同じ処理（標準の commandFight 相当）
        this.selectNextCommand();
        return;
    }
    _Scene_Battle_startPartyCommandSelection.call(this);
};

//==================================================================
// Window_BattleActor（味方ターゲット選択）：見た目を描画せず、操作だけ標準のまま残す
// ----------------------------------------------------------------
// 【原因】Window_BattleActor は Window_BattleStatus を継承している。そのため、
// 上のブロックで Window_BattleStatus に施した「顔グラ＋名前＋HP/MP/TP/SAN/Ammo」の
// カード描画（placeBasicGauges：showTpGauge＝既定ON なので TP も描く）が、味方選択の
// たびに画面下の標準位置へ新しく描かれ、UIエディタで配置した Sprite パネルの上に重なっていた。
//   ・パネルが初期配置に戻ったように見える／TPバーが出る／AMMOが隠れる ＝ すべてこれ
//   ・Sprite_BattleUIActorStatus や ConfigManager.battleUILayout は触られていない
// 【対策】Window_BattleActor は描画しない・表示しない（操作は標準のまま有効）。
// カーソルの当たり判定はBattleUIパネルの範囲に合わせ、強調表示はパネル側で行う。
//==================================================================

function hasBattleUIPanels() {
    const scene = SceneManager._scene;
    return !!(scene && scene._battleUIPanels && scene._battleUIPanels.length > 0);
}

function battleUIPanelRect(index) {
    const scene = SceneManager._scene;
    const status = scene && scene._battleUIPanels ? scene._battleUIPanels[index] : null;
    if (!status || status._uiParts.Panel.hidden) return null;
    const p = status._uiParts.Panel;
    return { x: p.x, y: p.y, w: p.w, h: p.h };
}

if (typeof Window_BattleActor !== "undefined") {
    // 標準カード（TP含む）を描かない。ゲージ用のSpriteも作られない。
    const _Window_BattleActor_drawItem = Window_BattleActor.prototype.drawItem;
    Window_BattleActor.prototype.drawItem = function(index) {
        if (hasBattleUIPanels()) return;
        _Window_BattleActor_drawItem.call(this, index);
    };

    // show() は標準どおり forceSelect(0) などを行わせ、見た目だけ非表示にする
    const _Window_BattleActor_show = Window_BattleActor.prototype.show;
    Window_BattleActor.prototype.show = function() {
        _Window_BattleActor_show.call(this);
        if (hasBattleUIPanels()) {
            this._battleUIShown = true; // v2.3.1：シーンが表示を要求した状態（入力可否の判定に使う）
            this.visible = false;
        }
    };

    // v2.3.1：hide() でシーンが表示を終えた状態に戻す（標準の hide() の処理はそのまま実行する）
    const _Window_BattleActor_hide = Window_BattleActor.prototype.hide;
    Window_BattleActor.prototype.hide = function() {
        this._battleUIShown = false;
        _Window_BattleActor_hide.call(this);
    };

    // v2.3.1：入力を受け付けるかの判定。
    // 【不具合の原因】MZ標準の Window_Selectable.isOpenAndActive() は isOpen() && visible && active。
    // 上の show() と Scene_Battle.update で visible=false にしているため、味方選択中でも false になり、
    // カーソル移動(isCursorMovable)・決定/キャンセル(processHandling)・タッチ(processTouch)が
    // すべて無効になる。一方 active は true のままなので Scene_Battle.isAnyInputWindowActive() が
    // true を返し続け、戦闘が進行せず、エラーも出ないまま画面が停止して見えていた。
    // 【対策】BattleUIが見た目を担当していて、かつシーンが show() を要求している間だけ、
    // visible を条件から外す。hide() 後や、BattleUIのパネルが無い場合は標準の判定のまま。
    const _Window_BattleActor_isOpenAndActive = Window_BattleActor.prototype.isOpenAndActive;
    Window_BattleActor.prototype.isOpenAndActive = function() {
        if (this._battleUIShown && hasBattleUIPanels()) {
            return this.isOpen() && this.active;
        }
        return _Window_BattleActor_isOpenAndActive.call(this);
    };

    // 各項目の範囲＝そのActorのBattleUIパネルの範囲（読み取りのみ）
    const _Window_BattleActor_itemRect = Window_BattleActor.prototype.itemRect;
    Window_BattleActor.prototype.itemRect = function(index) {
        const r = hasBattleUIPanels() ? battleUIPanelRect(index) : null;
        if (!r) return _Window_BattleActor_itemRect.call(this, index);
        return new Rectangle(r.x - this.x - this.padding, r.y - this.y - this.padding, r.w, r.h);
    };

    // タッチ：ウィンドウ枠の外にあるパネルも選択できるようにする
    const _Window_BattleActor_hitTest = Window_BattleActor.prototype.hitTest;
    Window_BattleActor.prototype.hitTest = function(x, y) {
        if (!hasBattleUIPanels()) return _Window_BattleActor_hitTest.call(this, x, y);
        for (let i = 0; i < this.maxItems(); i++) {
            const r = battleUIPanelRect(i);
            if (r && x + this.x >= r.x && x + this.x < r.x + r.w &&
                y + this.y >= r.y && y + this.y < r.y + r.h) {
                return i;
            }
        }
        return -1;
    };

    const _Window_BattleActor_isTouchedInsideFrame = Window_BattleActor.prototype.isTouchedInsideFrame;
    Window_BattleActor.prototype.isTouchedInsideFrame = function() {
        if (!hasBattleUIPanels()) return _Window_BattleActor_isTouchedInsideFrame.call(this);
        return this.hitIndex() >= 0;
    };
}

const _Scene_Battle_update_core = Scene_Battle.prototype.update;
Scene_Battle.prototype.update = function() {
    _Scene_Battle_update_core.call(this);
    // 標準処理(show())で再表示されることがあるため、毎フレーム最後に非表示を保証する
    if (hideStandardStatusWindow && this._statusWindow) {
        this._statusWindow.visible = false;
    }
    // 味方選択ウィンドウ：操作は生かしたまま、標準カードの描画（TP等）は表示しない
    if (this._actorWindow && hasBattleUIPanels()) {
        this._actorWindow.visible = false;
    }
};

// シーン終了時の後始末（エディタの描画物）
const _Scene_Battle_terminate_ui = Scene_Battle.prototype.terminate;
Scene_Battle.prototype.terminate = function() {
    _Scene_Battle_terminate_ui.call(this);
    if (this._battleUIEditor && typeof this._battleUIEditor.cleanup === "function") {
        this._battleUIEditor.cleanup();
    }
};


//==================================================================
// Window_BattleUIEditorPanel：設定パネル（右端／左端）
//==================================================================

function Window_BattleUIEditorPanel() {
    this.initialize(...arguments);
}

Window_BattleUIEditorPanel.prototype = Object.create(Window_Base.prototype);
Window_BattleUIEditorPanel.prototype.constructor = Window_BattleUIEditorPanel;

Window_BattleUIEditorPanel.prototype.initialize = function(rect, editor) {
    this._editor = editor;
    this._buttons = this.makeButtons();
    Window_Base.prototype.initialize.call(this, rect);
    this.openness = 255;
    this.refresh();
};

Window_BattleUIEditorPanel.prototype.updatePadding = function() {
    this.padding = 8;
};

Window_BattleUIEditorPanel.prototype.updateBackOpacity = function() {
    this.backOpacity = 235;
};

Window_BattleUIEditorPanel.prototype.makeButtons = function() {
    const list = [];
    const add = (id, x, y, w, h, label) => list.push({ id: id, x: x, y: y, w: w, h: h, label: label });
    add("dock", 152, 0, 64, 22, "Dock");
    add("fieldX", 28, 72, 84, 26, "");
    add("xMinus", 118, 72, 44, 26, "-");
    add("xPlus", 166, 72, 44, 26, "+");
    add("fieldY", 28, 104, 84, 26, "");
    add("yMinus", 118, 104, 44, 26, "-");
    add("yPlus", 166, 104, 44, 26, "+");
    add("fieldW", 28, 136, 84, 26, "");
    add("wMinus", 118, 136, 44, 26, "-");
    add("wPlus", 166, 136, 44, 26, "+");
    add("fieldH", 28, 168, 84, 26, "");
    add("hMinus", 118, 168, 44, 26, "-");
    add("hPlus", 166, 168, 44, 26, "+");
    add("step", 44, 204, 56, 26, "");
    add("prev", 108, 204, 48, 26, "Prev");
    add("next", 162, 204, 48, 26, "Next");
    add("left", 0, 236, 50, 28, "\u2190");
    add("right", 55, 236, 50, 28, "\u2192");
    add("up", 110, 236, 50, 28, "\u2191");
    add("down", 165, 236, 50, 28, "\u2193");
    add("vis", 0, 270, 216, 26, "");
    add("slot", 60, 302, 156, 26, "");
    add("fieldImg", 0, 332, 216, 26, "");
    add("save", 0, 368, 68, 30, "Save");
    add("reset", 74, 368, 68, 30, "Reset");
    add("close", 148, 368, 68, 30, "Close");
    return list;
};

Window_BattleUIEditorPanel.prototype.containsPoint = function(pos) {
    return pos.x >= this.x && pos.x < this.x + this.width &&
        pos.y >= this.y && pos.y < this.y + this.height;
};

Window_BattleUIEditorPanel.prototype.buttonAt = function(pos) {
    const lx = pos.x - this.x - this.padding;
    const ly = pos.y - this.y - this.padding;
    for (const b of this._buttons) {
        if (lx >= b.x && lx < b.x + b.w && ly >= b.y && ly < b.y + b.h) return b.id;
    }
    return "";
};

Window_BattleUIEditorPanel.prototype.drawButton = function(b, label, enabled, highlight) {
    const c = this.contents;
    c.paintOpacity = enabled ? 255 : 110;
    c.fillRect(b.x, b.y, b.w, b.h, highlight ? "#ffd700" : "rgba(255,255,255,0.55)");
    c.fillRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2, "rgba(30,30,30,0.9)");
    c.fontSize = 16;
    this.changeTextColor(ColorManager.normalColor());
    c.drawText(label, b.x + 2, b.y, b.w - 4, b.h, "center");
    c.paintOpacity = 255;
};

Window_BattleUIEditorPanel.prototype.refresh = function() {
    const st = this._editor.getPanelState();
    const c = this.contents;
    c.clear();

    c.fontSize = 20;
    this.changeTextColor(ColorManager.systemColor());
    c.drawText("UI EDITOR", 0, 0, 150, 24, "left");

    c.fontSize = 14;
    this.changeTextColor(ColorManager.systemColor());
    c.drawText("Selected:", 0, 28, 120, 18, "left");
    c.fontSize = 18;
    this.changeTextColor(st.has ? "#ffe97a" : ColorManager.deathColor());
    c.drawText(st.has ? st.id : "(none)", 0, 46, 216, 22, "left");

    c.fontSize = 18;
    this.changeTextColor(ColorManager.systemColor());
    c.paintOpacity = st.has ? 255 : 110;
    c.drawText("X:", 0, 72, 26, 26, "left");
    c.drawText("Y:", 0, 104, 26, 26, "left");
    c.drawText("W:", 0, 136, 26, 26, "left");
    c.drawText("H:", 0, 168, 26, 26, "left");
    c.paintOpacity = 255;
    c.fontSize = 14;
    c.drawText("Step", 0, 204, 42, 26, "left");
    c.drawText("Setting:", 0, 302, 58, 26, "left");

    const sizeIds = ["fieldW", "fieldH", "wMinus", "wPlus", "hMinus", "hPlus"];
    const selIds = ["fieldX", "fieldY", "xMinus", "xPlus", "yMinus", "yPlus",
        "left", "right", "up", "down", "vis"].concat(sizeIds);
    for (const b of this._buttons) {
        let label = b.label;
        let highlight = false;
        let enabled = selIds.indexOf(b.id) >= 0 ? st.has : true;
        if (b.id === "fieldX" || b.id === "fieldY" || b.id === "fieldW" || b.id === "fieldH") {
            const field = { fieldX: "x", fieldY: "y", fieldW: "w", fieldH: "h" }[b.id];
            const typing = st.typing && st.typing.field === field;
            highlight = !!typing;
            if (typing) label = st.typing.text + "_";
            else label = st.has ? String(st[field]) : "-";
        } else if (b.id === "step") {
            label = "\u00B1" + st.step;
        } else if (b.id === "vis") {
            label = st.has ? (st.canHide ? (st.hidden ? "Visible: OFF" : "Visible: ON") : "Visible: (fixed)") : "Visible: -";
            highlight = st.has && st.hidden;
            if (st.has && !st.canHide) enabled = false;
        } else if (b.id === "slot") {
            label = st.slotLabel;
        } else if (b.id === "fieldImg") {
            const typing = st.typing && st.typing.field === "img";
            highlight = !!typing;
            label = typing ? st.typing.text + "_" : (st.imageName || (st.slotType === "color" ? "(default)" : "(none)"));
        } else if (b.id === "save") {
            enabled = true;
            highlight = st.dirty;
        }
        this.drawButton(b, label, enabled, highlight);
    }

    if (st.slotType === "color" && st.imageName) {
        const fb = this._buttons.find(b => b.id === "fieldImg");
        c.fillRect(fb.x + fb.w - 22, fb.y + 5, 16, 16, st.imageName);
    }

    c.fontSize = 14;
    if (st.message) {
        this.changeTextColor("#9be37a");
        c.drawText(st.message, 0, 404, 216, 18, "left");
    } else if (st.dirty) {
        this.changeTextColor("#ffcc66");
        c.drawText("* \u672A\u4FDD\u5B58\u306E\u5909\u66F4\u3042\u308A", 0, 404, 216, 18, "left");
    }

    c.fontSize = 13;
    this.changeTextColor(ColorManager.normalColor());
    const help = [
        "\u30C9\u30E9\u30C3\u30B0\u79FB\u52D5 / \u53F3\u30AF\u30EA\u30C3\u30AF: \u91CD\u306A\u308A\u5019\u88DC",
        "\u77E2\u5370\u30AD\u30FC: \u5FAE\u8ABF\u6574\uFF08Step\uFF09",
        "X/Y/W/H/Setting\u6B04: \u30AF\u30EA\u30C3\u30AF\u2192\u5165\u529B\u2192Enter",
        "Prev/Next: UI\u3092\u9806\u306B\u9078\u629E"
    ];
    for (let i = 0; i < help.length; i++) {
        c.drawText(help[i], 0, 424 + i * 16, 216, 16, "left");
    }
    this.resetFontSettings();
};


//==================================================================
// Window_BattleUIEditorList：候補一覧／確認の選択肢
//==================================================================

function Window_BattleUIEditorList() {
    this.initialize(...arguments);
}

Window_BattleUIEditorList.prototype = Object.create(Window_Command.prototype);
Window_BattleUIEditorList.prototype.constructor = Window_BattleUIEditorList;

Window_BattleUIEditorList.prototype.initialize = function(rect) {
    this._items = [];
    this._cols = 1;
    Window_Command.prototype.initialize.call(this, rect);
    this.openness = 255;
    this.hide();
    this.deactivate();
};

Window_BattleUIEditorList.prototype.makeCommandList = function() {
    for (const item of this._items) {
        this.addCommand(item.name, item.symbol, item.enabled !== false, item.ext);
    }
};

Window_BattleUIEditorList.prototype.maxCols = function() {
    return this._cols;
};

Window_BattleUIEditorList.prototype.setupList = function(items, cols, width, x, y, selectIndex) {
    this._items = items;
    this._cols = cols;
    const rows = Math.max(1, Math.ceil(items.length / cols));
    const height = Math.min(rows, 8) * this.itemHeight() + this.padding * 2;
    this.move(x, y, width, height);
    this.createContents();
    this.refresh();
    this.select(selectIndex || 0);
    this.openness = 255;
    this.show();
    this.activate();
};

Window_BattleUIEditorList.prototype.closeList = function() {
    this.deactivate();
    this.hide();
};

//==================================================================
// Window_BattleUIEditorMessage：確認メッセージ
//==================================================================

function Window_BattleUIEditorMessage() {
    this.initialize(...arguments);
}

Window_BattleUIEditorMessage.prototype = Object.create(Window_Base.prototype);
Window_BattleUIEditorMessage.prototype.constructor = Window_BattleUIEditorMessage;

Window_BattleUIEditorMessage.prototype.initialize = function(rect) {
    this._text = "";
    Window_Base.prototype.initialize.call(this, rect);
    this.openness = 255;
    this.hide();
};

Window_BattleUIEditorMessage.prototype.setText = function(text) {
    this._text = text;
    this.refresh();
};

Window_BattleUIEditorMessage.prototype.refresh = function() {
    this.contents.clear();
    this.resetFontSettings();
    this.drawText(this._text, 0, 0, this.innerWidth, "center");
};


//==================================================================
// BattleUIEditor：エディタ本体（シーンごとに1つ）
// ----------------------------------------------------------------
// 編集対象は Scene_Battle._battleUIDefs（ステータス4人分＋アクターコマンド）。
// すべて同じ形の要素なので、移動・サイズ・表示/非表示・保存・Resetは共通処理。
//==================================================================

class BattleUIEditor {
    constructor(scene) {
        this._scene = scene;
        this._panels = [];
        this._skin = null;
        this._listSkins = [];
        this._elements = [];
        this._attached = false;
        this._ui = null;
        this._active = false;
        this._selectedId = "";
        this._dragging = false;
        this._dragMoved = false;
        this._grabDX = 0;
        this._grabDY = 0;
        this._step = 1;
        this._dockRight = true;
        this._typing = null;
        this._dirty = false;
        this._message = "";
        this._messageTimer = 0;
        this._coordTimer = 0;
        this._pickerOpen = false;
        this._confirmKind = "";
        this._overlayDirty = false;
        this._panelDirty = false;
        this._cmdPreview = null;
        this._settings = defaultSettings();
        this._baseSettings = defaultSettings();
        this._initSettings = defaultSettings();
        this._slotIndex = 0;
    }

    //--------------------------------------------------------------
    // 取り付け：シーンが作った編集対象（ステータス・コマンド）を受け取る
    //--------------------------------------------------------------

    attach() {
        const scene = this._scene;
        this._elements = scene._battleUIDefs || [];
        this._panels = scene._battleUIPanels || [];
        this._skin = scene._battleUISkin || null;
        this._listSkins = scene._battleUIListSkins || [];
        if (this._elements.length === 0) return false;
        this._initSettings = defaultSettings();
        this._settings = Object.assign({}, scene._battleUISettings || resolveSettings());
        this._baseSettings = Object.assign({}, this._settings);
        this._attached = true;
        return true;
    }

    cleanup() {
        const ui = this._ui;
        if (!ui) return;
        if (ui.guides && ui.guides.bitmap) ui.guides.bitmap.destroy();
        if (ui.button && ui.button.bitmap) ui.button.bitmap.destroy();
        this._active = false;
    }

    //--------------------------------------------------------------
    // 編集中の表示：通常の戦闘と同じ状態で、ステータスもコマンドも見せる
    //--------------------------------------------------------------

    beginPreview() {
        for (const status of this._panels) {
            status.setEditMode(true);
            status.update();
        }
        for (const list of this._listSkins) list.beginPreview();
        const win = this._scene._actorCommandWindow;
        const skin = this._skin;
        if (!win || !skin) return;
        const prev = { visible: win.visible, openness: win.openness, actor: win._actor };
        this._cmdPreview = prev;
        skin.setEditMode(true);
        // アクターがまだ設定されていない時（敵のターン等）は、先頭メンバーで一時的に内容を作る
        if (!win._actor) win._actor = $gameParty.battleMembers()[0] || null;
        win.refresh();
        win.show();
        win.openness = 255;
        skin.update();
    }

    endPreview() {
        for (const status of this._panels) {
            status.setEditMode(false);
            status.update();
        }
        for (const list of this._listSkins) list.endPreview();
        const win = this._scene._actorCommandWindow;
        const skin = this._skin;
        const prev = this._cmdPreview;
        this._cmdPreview = null;
        if (!skin) return;
        skin.setEditMode(false);
        skin.setForceKey("");
        if (!win || !prev) return;
        win._actor = prev.actor;
        win.refresh();
        win.visible = prev.visible;
        win.openness = prev.openness;
        skin.update();
    }

    elementRect(el) {
        return {
            x: Math.round(el.curX),
            y: Math.round(el.curY),
            w: Math.max(1, Math.round(el.curW)),
            h: Math.max(1, Math.round(el.curH))
        };
    }

    refreshAvailability() {
        for (const el of this._elements) {
            el.available = !!el.isAvailable();
        }
        const selected = this.selectedElement();
        if (selected && !selected.available) this._selectedId = "";
    }

    selectedElement() {
        if (!this._selectedId) return null;
        return this._elements.find(el => el.id === this._selectedId) || null;
    }

    //--------------------------------------------------------------
    // 位置・サイズ・表示/非表示の適用（全要素共通）
    //--------------------------------------------------------------

    applyElement(el) {
        applyDef(el);
    }

    applyAll() {
        for (const el of this._elements) this.applyElement(el);
    }

    afterChange() {
        this.recomputeDirty();
        this._coordTimer = COORD_SHOW_FRAMES;
        this._overlayDirty = true;
        this._panelDirty = true;
    }

    moveElementTo(el, x, y) {
        const p = clampPositionFor(el.curW, el.curH, x, y);
        const dx = p.x - el.curX;
        const dy = p.y - el.curY;
        if (dx === 0 && dy === 0) return false;
        el.curX = p.x;
        el.curY = p.y;
        this.applyElement(el);
        // 背景（Panel／ActorCommand_Background）を動かした場合は、同じグループ全体を一緒に動かす
        if (el.master) {
            for (const other of this._elements) {
                if (other === el || other.group !== el.group) continue;
                const q = clampPositionFor(other.curW, other.curH, other.curX + dx, other.curY + dy);
                other.curX = q.x;
                other.curY = q.y;
                this.applyElement(other);
            }
        }
        this.afterChange();
        return true;
    }

    resizeElementTo(el, w, h) {
        if (!el) return false;
        const sz = clampSizeFor(el, w, h);
        if (sz.w === el.curW && sz.h === el.curH) return false;
        el.curW = sz.w;
        el.curH = sz.h;
        this.applyElement(el);
        this.afterChange();
        return true;
    }

    resizeNudge(dw, dh) {
        const el = this.selectedElement();
        if (!el) return;
        this.resizeElementTo(el, el.curW + dw * this._step, el.curH + dh * this._step);
    }

    toggleHidden() {
        const el = this.selectedElement();
        if (!el) return;
        if (el.noHide) {
            this.setMessage("Cannot hide this window.");
            return;
        }
        el.curHidden = !el.curHidden;
        this.applyElement(el);
        this.afterChange();
    }

    nudge(dx, dy) {
        const el = this.selectedElement();
        if (!el) return;
        this.moveElementTo(el, el.curX + dx * this._step, el.curY + dy * this._step);
    }

    imagesChanged() {
        return SETTING_KEYS.some(k => this._settings[k] !== this._baseSettings[k]);
    }

    recomputeDirty() {
        this._dirty = this.imagesChanged() || this._elements.some(el =>
            el.curX !== el.baseX || el.curY !== el.baseY ||
            el.curW !== el.baseW || el.curH !== el.baseH ||
            el.curHidden !== el.baseHidden);
    }

    //--------------------------------------------------------------
    // 画像（ファイル名入力。ステータス背景・コマンド背景・ボタン通常/選択は共通画像）
    //--------------------------------------------------------------

    currentSlot() {
        return SETTING_SLOTS[this._slotIndex];
    }

    cycleSlot() {
        this._slotIndex = (this._slotIndex + 1) % SETTING_SLOTS.length;
        this._typing = null;
        this._panelDirty = true;
    }

    // 画像・色を実際の表示物へ反映する（リアルタイム）
    applyImages() {
        const st = this._settings;
        for (const status of this._panels) {
            status.setBackgroundImage(st.statusBg);
            status.setColors(st);
        }
        if (this._skin) this._skin.setImages(st);
        for (const list of this._listSkins) {
            list.setImage(list._uiId === "SkillList" ? st.skillBg : st.itemBg);
        }
    }

    setImage(key, value) {
        this._settings[key] = value;
        this.applyImages();
        this.recomputeDirty();
        this._overlayDirty = true;
        this._panelDirty = true;
    }

    // 入力値の確認後に設定する。画像：存在しないファイルは拒否（ゲームが止まるのを防ぐ）
    // 色：#RRGGBB（空＝標準色）
    commitImage(key, text) {
        const slot = SETTING_SLOTS.find(s => s.key === key);
        if (slot && slot.type === "color") {
            const hex = normalizeHexColor(text);
            if (hex === null) {
                this.setMessage("Invalid color (#RRGGBB).");
                return;
            }
            this.setImage(key, hex);
            this.setMessage(hex ? "Color set." : "Color reset.");
            return;
        }
        const name = sanitizeImageName(text);
        if (name === "") {
            this.setImage(key, "");
            this.setMessage("Image cleared.");
            return;
        }
        this.setMessage("Checking...");
        probePicture(name, ok => {
            if (!this._active) return;
            if (ok) {
                this.setImage(key, name);
                this.setMessage("Image set.");
            } else {
                this.setMessage("File not found.");
            }
        });
    }

    //--------------------------------------------------------------
    // UI生成（EnableEditor がONの時だけ呼ばれる）
    //--------------------------------------------------------------

    createUI() {
        if (!enableEditor || !this._attached || this._ui) return;
        const scene = this._scene;
        const W = Graphics.boxWidth;
        const H = Graphics.boxHeight;
        const layer = scene._windowLayer;

        const overlay = new Sprite();
        overlay.x = layer ? layer.x : 0;
        overlay.y = layer ? layer.y : 0;

        const guideBitmap = new Bitmap(W, H);
        guideBitmap.fontFace = $gameSystem.mainFontFace();
        const guides = new Sprite(guideBitmap);
        guides.visible = false;
        overlay.addChild(guides);

        const buttonBitmap = new Bitmap(EDITOR_BUTTON_WIDTH, EDITOR_BUTTON_HEIGHT);
        buttonBitmap.fontFace = $gameSystem.mainFontFace();
        buttonBitmap.fillRect(0, 0, EDITOR_BUTTON_WIDTH, EDITOR_BUTTON_HEIGHT, "rgba(0,0,0,0.65)");
        strokeBox(buttonBitmap, 0, 0, EDITOR_BUTTON_WIDTH, EDITOR_BUTTON_HEIGHT, 1, "rgba(255,255,255,0.8)");
        buttonBitmap.fontSize = 15;
        buttonBitmap.drawText("UI EDITOR", 0, 0, EDITOR_BUTTON_WIDTH, EDITOR_BUTTON_HEIGHT, "center");
        const button = new Sprite(buttonBitmap);
        button.x = W - EDITOR_BUTTON_WIDTH - 6;
        button.y = 6;
        button.visible = showEditorButton;
        overlay.addChild(button);
        scene.addChild(overlay);

        const panelWin = new Window_BattleUIEditorPanel(
            new Rectangle(0, 0, EDITOR_PANEL_WIDTH, EDITOR_PANEL_HEIGHT), this);
        panelWin.hide();
        scene.addWindow(panelWin);

        const picker = new Window_BattleUIEditorList(new Rectangle(0, 0, 260, 100));
        picker.setHandler("pick", () => this.onPickerOk());
        picker.setHandler("cancel", () => this.closePicker());
        scene.addWindow(picker);

        const confirmMsg = new Window_BattleUIEditorMessage(new Rectangle(0, 0, 400, 64));
        scene.addWindow(confirmMsg);
        const confirmList = new Window_BattleUIEditorList(new Rectangle(0, 0, 400, 64));
        confirmList.setHandler("yes", () => this.onConfirmYes());
        confirmList.setHandler("no", () => this.closeConfirm());
        confirmList.setHandler("cancel", () => this.closeConfirm());
        scene.addWindow(confirmList);

        this._ui = {
            overlay: overlay,
            guides: guides,
            button: button,
            panelWin: panelWin,
            picker: picker,
            confirmMsg: confirmMsg,
            confirmList: confirmList
        };
    }

    //--------------------------------------------------------------
    // 開く／閉じる
    //--------------------------------------------------------------

    isActive() {
        return this._active;
    }

    isTimingGameActive() {
        const t = window.BattleUI_Timing;
        if (t && typeof t.isPlaying === "function" && t.isPlaying()) return true;
        return !!BattleManager._aimPlaying;
    }

    canOpen() {
        return enableEditor && this._attached && !!this._ui && !this._active &&
            !SceneManager.isSceneChanging() && !this.isTimingGameActive();
    }

    open() {
        if (!this.canOpen()) return;
        this._active = true;
        this._dragging = false;
        this._typing = null;
        this._selectedId = "";
        this._message = "";
        this._pickerOpen = false;
        this._confirmKind = "";

        // 現在のUIをそのまま表示した状態にそろえる
        this.beginPreview();
        this.refreshAvailability();
        this.recomputeDirty();

        const ui = this._ui;
        ui.button.visible = false;
        ui.guides.visible = true;
        ui.panelWin.show();
        this.positionPanelWindow();
        SoundManager.playOk();
        this._overlayDirty = true;
        this._panelDirty = true;
        this.flushDirty();
    }

    close() {
        if (!this._active) return;
        const ui = this._ui;
        this._active = false;
        this._dragging = false;
        this._typing = null;
        this._pickerOpen = false;
        this._confirmKind = "";
        ui.guides.visible = false;
        ui.panelWin.hide();
        ui.picker.closeList();
        ui.confirmMsg.hide();
        ui.confirmList.closeList();
        ui.button.visible = showEditorButton;
        this.endPreview();
        // 通常の戦闘へ戻る時に、編集中の入力が残らないようにする
        Input.clear();
        TouchInput.clear();
        SoundManager.playCancel();
    }

    requestClose() {
        if (this._dirty) {
            this.showConfirm("close", "\u672A\u4FDD\u5B58\u306E\u5909\u66F4\u304C\u3042\u308A\u307E\u3059\u3002\u7834\u68C4\u3057\u3066\u9589\u3058\u307E\u3059\u304B\uFF1F");
        } else {
            this.close();
        }
    }

    discardAndClose() {
        for (const el of this._elements) {
            el.curX = el.baseX;
            el.curY = el.baseY;
            el.curW = el.baseW;
            el.curH = el.baseH;
            el.curHidden = el.baseHidden;
        }
        this.applyAll();
        this._settings = Object.assign({}, this._baseSettings);
        this.applyImages();
        this._dirty = false;
        this.close();
    }

    positionPanelWindow() {
        const win = this._ui.panelWin;
        win.x = this._dockRight ? Graphics.boxWidth - win.width : 0;
        win.y = 0;
    }

    //--------------------------------------------------------------
    // 保存／リセット（保存先は従来通り ConfigManager）
    //--------------------------------------------------------------

    save() {
        const saved = ConfigManager.battleUILayout;
        const items = saved && saved.items ? Object.assign({}, saved.items) : {};
        for (const el of this._elements) {
            const same = el.curX === el.initX && el.curY === el.initY &&
                el.curW === el.initW && el.curH === el.initH && el.curHidden === el.initHidden;
            if (same) {
                delete items[el.id];
            } else {
                items[el.id] = {
                    x: Math.round(el.curX),
                    y: Math.round(el.curY),
                    width: Math.round(el.curW),
                    height: Math.round(el.curH),
                    hidden: !!el.curHidden
                };
            }
        }
        const images = {};
        for (const key of IMAGE_KEYS) {
            if (this._settings[key] !== this._initSettings[key]) images[key] = this._settings[key];
        }
        const colors = {};
        for (const key of COLOR_KEYS) {
            if (this._settings[key] !== this._initSettings[key]) colors[key] = this._settings[key];
        }
        ConfigManager.battleUILayout = {
            w: Graphics.boxWidth, h: Graphics.boxHeight, items: items, images: images, colors: colors
        };
        try {
            const result = ConfigManager.save();
            if (result && typeof result.catch === "function") {
                result.catch(e => console.error("[BattleUI] 保存に失敗しました:", e));
            }
        } catch (e) {
            console.error("[BattleUI] 保存に失敗しました:", e);
        }
        for (const el of this._elements) {
            el.baseX = el.curX;
            el.baseY = el.curY;
            el.baseW = el.curW;
            el.baseH = el.curH;
            el.baseHidden = el.curHidden;
        }
        this._baseSettings = Object.assign({}, this._settings);
        this._dirty = false;
        this.setMessage("Saved.");
        SoundManager.playSave();
        console.log("[BattleUI] saved layout:", JSON.stringify(ConfigManager.battleUILayout));
    }

    doReset() {
        for (const el of this._elements) {
            el.curX = el.initX;
            el.curY = el.initY;
            el.curW = el.initW;
            el.curH = el.initH;
            el.curHidden = el.initHidden;
        }
        this.applyAll();
        this._settings = Object.assign({}, this._initSettings);
        this.applyImages();
        this.recomputeDirty();
        this.setMessage("Reset.");
        this._overlayDirty = true;
        this._panelDirty = true;
    }

    setMessage(text) {
        this._message = text;
        this._messageTimer = 120;
        this._panelDirty = true;
    }

    //--------------------------------------------------------------
    // 確認ダイアログ
    //--------------------------------------------------------------

    showConfirm(kind, text) {
        const ui = this._ui;
        const W = Graphics.boxWidth;
        const H = Graphics.boxHeight;
        this._typing = null;
        this._confirmKind = kind;
        const msg = ui.confirmMsg;
        msg.x = Math.round((W - msg.width) / 2);
        msg.y = Math.round(H / 2 - msg.height);
        msg.setText(text);
        msg.show();
        ui.confirmList.setupList(
            [{ name: "\u306F\u3044", symbol: "yes" }, { name: "\u3044\u3044\u3048", symbol: "no" }],
            2, msg.width, msg.x, msg.y + msg.height, 1);
        this._overlayDirty = true;
        this._panelDirty = true;
    }

    closeConfirm() {
        const ui = this._ui;
        this._confirmKind = "";
        ui.confirmMsg.hide();
        ui.confirmList.closeList();
        this._overlayDirty = true;
    }

    onConfirmYes() {
        const kind = this._confirmKind;
        this.closeConfirm();
        if (kind === "reset") this.doReset();
        else if (kind === "close") this.discardAndClose();
    }

    //--------------------------------------------------------------
    // 候補一覧（UIが重なっている場合）
    //--------------------------------------------------------------

    openPicker(hits, pos) {
        const ui = this._ui;
        const items = hits.map(el => ({ name: el.id, symbol: "pick", ext: el.id }));
        const width = 260;
        const rows = Math.min(items.length, 8);
        const height = rows * ui.picker.itemHeight() + ui.picker.padding * 2;
        const x = Math.max(0, Math.min(pos.x + 14, Graphics.boxWidth - width));
        const y = Math.max(0, Math.min(pos.y + 14, Graphics.boxHeight - height));
        ui.picker.setupList(items, 1, width, x, y, 0);
        this._pickerOpen = true;
        this._overlayDirty = true;
    }

    closePicker() {
        this._pickerOpen = false;
        this._ui.picker.closeList();
        this._overlayDirty = true;
    }

    onPickerOk() {
        const id = this._ui.picker.currentExt();
        this.closePicker();
        if (id) this.select(id);
    }

    //--------------------------------------------------------------
    // 選択
    //--------------------------------------------------------------

    select(id) {
        this._selectedId = id || "";
        this._typing = null;
        // コマンドのボタンを選択している間は、そのボタンを「選択中画像」で表示して確認できる
        const el = this.selectedElement();
        if (this._skin) {
            const isButton = el && el.group === "ActorCommand" && el.key !== "Background";
            this._skin.setForceKey(isButton ? el.key : "");
        }
        this._overlayDirty = true;
        this._panelDirty = true;
    }

    cycleSelection(dir) {
        const list = this._elements.filter(el => el.available);
        if (list.length === 0) return;
        let idx = list.findIndex(el => el.id === this._selectedId);
        if (idx < 0) idx = dir > 0 ? 0 : list.length - 1;
        else idx = (idx + dir + list.length) % list.length;
        this.select(list[idx].id);
    }

    elementsAt(pos) {
        const hits = this._elements.filter(el => {
            if (!el.available) return false;
            const r = this.elementRect(el);
            return pos.x >= r.x - HIT_PADDING && pos.x < r.x + r.w + HIT_PADDING &&
                pos.y >= r.y - HIT_PADDING && pos.y < r.y + r.h + HIT_PADDING;
        });
        hits.sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            const ra = this.elementRect(a);
            const rb = this.elementRect(b);
            return ra.w * ra.h - rb.w * rb.h;
        });
        return hits;
    }

    //--------------------------------------------------------------
    // 入力処理（編集モード中は、ゲーム側のコマンド処理より編集が最優先）
    //--------------------------------------------------------------

    pointerPos() {
        const layer = this._scene._windowLayer;
        return {
            x: TouchInput.x - (layer ? layer.x : 0),
            y: TouchInput.y - (layer ? layer.y : 0)
        };
    }

    isOverEditorWindow(pos) {
        const ui = this._ui;
        if (ui.panelWin.visible && ui.panelWin.containsPoint(pos)) return true;
        return false;
    }

    onPress(pos) {
        const ui = this._ui;
        if (ui.panelWin.containsPoint(pos)) {
            const id = ui.panelWin.buttonAt(pos);
            const typingFields = ["fieldX", "fieldY", "fieldW", "fieldH", "fieldImg"];
            if (this._typing && typingFields.indexOf(id) < 0) this.commitTyping();
            if (id) this.handleAction(id);
            return;
        }
        if (this._typing) this.commitTyping();

        const hits = this.elementsAt(pos);
        if (hits.length === 0) {
            if (this._selectedId) this.select("");
            return;
        }
        if (hits.length === 1) {
            if (this._selectedId !== hits[0].id) this.select(hits[0].id);
            this.startDrag(pos);
            return;
        }
        if (hits.some(el => el.id === this._selectedId)) {
            this.startDrag(pos);
            return;
        }
        this.openPicker(hits, pos);
    }

    onRightClick(pos) {
        if (this.isOverEditorWindow(pos)) return;
        const hits = this.elementsAt(pos);
        if (hits.length > 0) this.openPicker(hits, pos);
    }

    startDrag(pos) {
        const el = this.selectedElement();
        if (!el) return;
        this._dragging = true;
        this._dragMoved = false;
        this._grabDX = pos.x - el.curX;
        this._grabDY = pos.y - el.curY;
        this._coordTimer = COORD_SHOW_FRAMES;
        this._overlayDirty = true;
    }

    onDrag(pos) {
        const el = this.selectedElement();
        if (!el) {
            this._dragging = false;
            return;
        }
        if (this.moveElementTo(el, pos.x - this._grabDX, pos.y - this._grabDY)) {
            this._dragMoved = true;
        }
    }

    endDrag() {
        this._dragging = false;
        this._coordTimer = COORD_SHOW_FRAMES;
        this._overlayDirty = true;
    }

    handleAction(id) {
        const el = this.selectedElement();
        switch (id) {
        case "dock":
            this._dockRight = !this._dockRight;
            this.positionPanelWindow();
            this._overlayDirty = true;
            break;
        case "fieldX":
        case "fieldY":
        case "fieldW":
        case "fieldH":
            if (el) {
                this._typing = { field: { fieldX: "x", fieldY: "y", fieldW: "w", fieldH: "h" }[id], text: "" };
                this._panelDirty = true;
            }
            break;
        case "fieldImg":
            this._typing = { field: "img", text: this._settings[this.currentSlot().key] || "" };
            this._panelDirty = true;
            break;
        case "slot": this.cycleSlot(); break;
        case "vis": this.toggleHidden(); break;
        case "wMinus": this.resizeNudge(-1, 0); break;
        case "wPlus": this.resizeNudge(1, 0); break;
        case "hMinus": this.resizeNudge(0, -1); break;
        case "hPlus": this.resizeNudge(0, 1); break;
        case "xMinus": this.nudge(-1, 0); break;
        case "xPlus": this.nudge(1, 0); break;
        case "yMinus": this.nudge(0, -1); break;
        case "yPlus": this.nudge(0, 1); break;
        case "left": this.nudge(-1, 0); break;
        case "right": this.nudge(1, 0); break;
        case "up": this.nudge(0, -1); break;
        case "down": this.nudge(0, 1); break;
        case "step":
            this._step = STEP_LIST[(STEP_LIST.indexOf(this._step) + 1) % STEP_LIST.length];
            this._panelDirty = true;
            break;
        case "prev": this.cycleSelection(-1); break;
        case "next": this.cycleSelection(1); break;
        case "save": this.save(); break;
        case "reset":
            this.showConfirm("reset", "\u672C\u5F53\u306B\u521D\u671F\u72B6\u614B\u306B\u623B\u3057\u307E\u3059\u304B\uFF1F");
            break;
        case "close": this.requestClose(); break;
        }
    }

    commitTyping() {
        const t = this._typing;
        this._typing = null;
        this._panelDirty = true;
        if (!t) return;
        if (t.field === "img") {
            this.commitImage(this.currentSlot().key, t.text);
            return;
        }
        const el = this.selectedElement();
        if (!el || t.text === "" || t.text === "-") return;
        const value = parseInt(t.text, 10);
        if (isNaN(value)) return;
        if (t.field === "x") this.moveElementTo(el, value, el.curY);
        else if (t.field === "y") this.moveElementTo(el, el.curX, value);
        else if (t.field === "w") this.resizeElementTo(el, value, el.curH);
        else if (t.field === "h") this.resizeElementTo(el, el.curW, value);
    }

    matchesOpenKey(event) {
        if (!openKey) return false;
        const k = openKey.toLowerCase();
        const key = String(event.key).toLowerCase();
        const code = String(event.code).toLowerCase();
        return key === k || code === k || code === "key" + k || code === "digit" + k;
    }

    // キーボード入力。処理した場合は true を返す
    handleKeyDown(event) {
        if (!enableEditor || !this._attached || !this._ui) return false;

        if (!this._active) {
            if (this.matchesOpenKey(event)) {
                if (!event.repeat && this.canOpen()) this.open();
                return true;
            }
            return false;
        }

        if (this._confirmKind) {
            if (event.key === "Escape") {
                this.closeConfirm();
                return true;
            }
            return false;
        }
        if (this._pickerOpen) {
            if (event.key === "Escape") {
                this.closePicker();
                return true;
            }
            return false;
        }

        if (this._typing) {
            const t = this._typing;
            const key = event.key;
            if (t.field === "img") {
                // 画像ファイル名（半角文字）。入力中は他のキー操作を奪う
                if (key === "Backspace") {
                    t.text = t.text.slice(0, -1);
                } else if (key === "Enter") {
                    this.commitTyping();
                } else if (key === "Escape") {
                    this._typing = null;
                } else if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    if (this.currentSlot().type === "color") {
                        if (/[0-9a-fA-F#]/.test(key) && t.text.length < 7) t.text += key;
                    } else if (!/[\\\/:*?"<>|]/.test(key) && t.text.length < 64) {
                        t.text += key;
                    }
                } else {
                    return false;
                }
            } else if (/^[0-9]$/.test(key)) {
                if (t.text.replace("-", "").length < 5) t.text += key;
            } else if (key === "-") {
                if (t.text === "" && (t.field === "x" || t.field === "y")) t.text = "-";
            } else if (key === "Backspace") {
                t.text = t.text.slice(0, -1);
            } else if (key === "Enter") {
                this.commitTyping();
            } else if (key === "Escape") {
                this._typing = null;
            } else {
                return false;
            }
            this._panelDirty = true;
            return true;
        }

        if (this.matchesOpenKey(event)) {
            if (!event.repeat) this.requestClose();
            return true;
        }
        switch (event.key) {
        case "ArrowLeft": this.nudge(-1, 0); return true;
        case "ArrowRight": this.nudge(1, 0); return true;
        case "ArrowUp": this.nudge(0, -1); return true;
        case "ArrowDown": this.nudge(0, 1); return true;
        }
        return false;
    }

    //--------------------------------------------------------------
    // 更新
    //--------------------------------------------------------------

    // 通常時（編集モードでない時）の更新：編集ボタンの処理だけ行う
    updateIdle() {
        if (!this._ui) return;
        const button = this._ui.button;
        button.visible = showEditorButton && !this._active && !this.isTimingGameActive();
        if (!button.visible || !TouchInput.isTriggered()) return;
        const pos = this.pointerPos();
        if (pos.x >= button.x && pos.x < button.x + EDITOR_BUTTON_WIDTH &&
            pos.y >= button.y && pos.y < button.y + EDITOR_BUTTON_HEIGHT) {
            this.open();
        }
    }

    // 編集モード中の更新（戦闘の進行は止まっている）
    update() {
        if (this._messageTimer > 0) {
            this._messageTimer--;
            if (this._messageTimer === 0) {
                this._message = "";
                this._panelDirty = true;
            }
        }
        if (this._coordTimer > 0 && !this._dragging) {
            this._coordTimer--;
            if (this._coordTimer === 0) this._overlayDirty = true;
        }

        // 戦闘が止まっている間も、ステータス・コマンドの見た目（画像の読み込み等）を更新する
        for (const status of this._panels) status.update();
        if (this._skin) this._skin.update();
        for (const list of this._listSkins) list.update();

        if (this._confirmKind) {
            this._ui.confirmList.update();
        } else if (this._pickerOpen) {
            const picker = this._ui.picker;
            if (TouchInput.isTriggered() && !picker.isTouchedInsideFrame()) {
                this.closePicker();
            } else {
                picker.update();
            }
        } else {
            this.updatePointer();
        }
        this.flushDirty();
    }

    updatePointer() {
        const pos = this.pointerPos();
        if (TouchInput.isTriggered()) {
            this.onPress(pos);
        } else if (TouchInput.isRepeated() && !this._dragging) {
            // ボタンの押しっぱなしで微調整を連続実行する
            const id = this._ui.panelWin.containsPoint(pos) ? this._ui.panelWin.buttonAt(pos) : "";
            const repeatable = ["xMinus", "xPlus", "yMinus", "yPlus", "wMinus", "wPlus", "hMinus", "hPlus",
                "left", "right", "up", "down"];
            if (repeatable.indexOf(id) >= 0) this.handleAction(id);
        }
        if (this._dragging) {
            if (TouchInput.isPressed()) this.onDrag(pos);
            else this.endDrag();
        }
        if (TouchInput.isCancelled()) this.onRightClick(pos);
    }

    flushDirty() {
        if (this._panelDirty) {
            this._panelDirty = false;
            this._ui.panelWin.refresh();
        }
        if (this._overlayDirty) {
            this._overlayDirty = false;
            this.redrawOverlay();
        }
    }

    getPanelState() {
        const el = this.selectedElement();
        const slot = this.currentSlot();
        return {
            has: !!el,
            id: el ? el.id : "",
            x: el ? el.curX : 0,
            y: el ? el.curY : 0,
            w: el ? el.curW : 0,
            h: el ? el.curH : 0,
            hidden: !!(el && el.curHidden),
            step: this._step,
            typing: this._typing,
            message: this._message,
            dirty: this._dirty,
            slotLabel: slot.label,
            slotType: slot.type,
            imageName: this._settings[slot.key] || "",
            canHide: !!(el && !el.noHide)
        };
    }

    //--------------------------------------------------------------
    // 編集中だけ表示するオーバーレイ（選択枠・座標表示）
    //--------------------------------------------------------------

    redrawOverlay() {
        const ui = this._ui;
        if (!ui) return;
        const bmp = ui.guides.bitmap;
        const W = Graphics.boxWidth;
        const H = Graphics.boxHeight;
        bmp.clear();
        if (!this._active) return;

        const selected = this.selectedElement();
        for (const el of this._elements) {
            if (!el.available || el === selected) continue;
            const r = this.elementRect(el);
            strokeBox(bmp, r.x, r.y, r.w, r.h, 1,
                el.curHidden ? "rgba(255,120,120,0.45)" : "rgba(255,255,255,0.35)");
        }

        if (selected) {
            const r = this.elementRect(selected);
            bmp.fillRect(r.x, r.y, r.w, r.h, "rgba(255,255,255,0.12)");
            strokeBox(bmp, r.x - 1, r.y - 1, r.w + 2, r.h + 2, 2, "#ffffff");
            strokeBox(bmp, r.x - 3, r.y - 3, r.w + 6, r.h + 6, 1, "rgba(150,150,150,0.95)");

            // 選択中であることを示すタグ
            const tag = "SELECTED: " + selected.id + (selected.curHidden ? " (HIDDEN)" : "");
            bmp.fontSize = 14;
            const tagW = Math.ceil(bmp.measureTextWidth(tag)) + 12;
            const tagX = Math.max(0, Math.min(r.x - 3, W - tagW));
            const tagY = Math.max(0, Math.min(r.y - 26, H - 20));
            bmp.fillRect(tagX, tagY, tagW, 20, "rgba(70,70,70,0.92)");
            bmp.textColor = "#ffffff";
            bmp.drawText(tag, tagX + 6, tagY, tagW, 20, "left");

            // ドラッグ中（および移動直後）の座標・サイズ表示
            if (this._dragging || this._coordTimer > 0) {
                const boxW = 84;
                const boxH = 84;
                let cx = r.x + r.w + 10;
                if (cx + boxW > W) cx = r.x - boxW - 10;
                cx = Math.max(0, Math.min(cx, W - boxW));
                const cy = Math.max(0, Math.min(r.y, H - boxH));
                bmp.fillRect(cx, cy, boxW, boxH, "rgba(0,0,0,0.78)");
                strokeBox(bmp, cx, cy, boxW, boxH, 1, "rgba(255,255,255,0.7)");
                bmp.fontSize = 16;
                bmp.textColor = "#ffffff";
                bmp.drawText("X: " + selected.curX, cx + 6, cy + 2, boxW - 8, 20, "left");
                bmp.drawText("Y: " + selected.curY, cx + 6, cy + 22, boxW - 8, 20, "left");
                bmp.drawText("W: " + selected.curW, cx + 6, cy + 42, boxW - 8, 20, "left");
                bmp.drawText("H: " + selected.curH, cx + 6, cy + 62, boxW - 8, 20, "left");
            }
        }

        // 編集用ウィンドウの下にはガイド線を出さない
        for (const win of [ui.panelWin, ui.picker, ui.confirmMsg, ui.confirmList]) {
            if (win && win.visible) bmp.clearRect(win.x, win.y, win.width, win.height);
        }
    }
}

//==================================================================
// キーボード（開始キー・数値/ファイル名入力・矢印キーでの微調整）
//==================================================================

document.addEventListener("keydown", event => {
    const scene = SceneManager._scene;
    const editor = scene && scene._battleUIEditor;
    if (!editor) return;
    if (editor.handleKeyDown(event)) {
        event.preventDefault();
        event.stopPropagation();
    }
});

//==================================================================
// Scene_Battle：エディタの取り付け・更新（元の処理は退避して呼び出す）
//==================================================================

const _Scene_Battle_createAllWindows = Scene_Battle.prototype.createAllWindows;
Scene_Battle.prototype.createAllWindows = function() {
    _Scene_Battle_createAllWindows.call(this);
    // ステータス・コマンドがすべて作られた後に取り付ける
    this._battleUIEditor = new BattleUIEditor(this);
    if (this._battleUIEditor.attach()) {
        this._battleUIEditor.createUI(); // EnableEditor がOFFなら何も作らない
    }
};

const _Scene_Battle_update_editor = Scene_Battle.prototype.update;
Scene_Battle.prototype.update = function() {
    const editor = this._battleUIEditor;
    if (editor && editor.isActive()) {
        editor.update(); // 編集中は戦闘の進行を止める（ゲーム側の操作より編集が最優先）
        return;
    }
    _Scene_Battle_update_editor.call(this);
    if (editor) editor.updateIdle();
};

})();
