let schedule = [];
let originalNames = [];
let courtCountGlobal = 1;

// 1. 初始化並產生賽程
function generate() {
    originalNames = document.getElementById("players").value
        .split("\n")
        .map(x => x.trim())
        .filter(x => x);

    courtCountGlobal = parseInt(document.getElementById("courts").value);

    if (originalNames.length < 4) {
        alert("至少4人");
        return;
    }
    buildSchedule(1, true); // 從第1輪開始建立，重設所有賽程 [1]
}

// 2. 建立賽程邏輯
function buildSchedule(startRound, resetAll = false) {
    if (resetAll) schedule = [];
    let names = [...originalNames];
    let stats = {}, teammateHistory = {}, opponentHistory = {}, lastPlayed = {};

    names.forEach(n => {
        stats[n] = 0;
        teammateHistory[n] = {};
        opponentHistory[n] = {};
        lastPlayed[n] = -99;
    });

    for (let round = 1; round <= 20; round++) {
        if (round < startRound && schedule[round - 1]) {
            applyExistingRound(schedule[round - 1], stats, lastPlayed, teammateHistory, opponentHistory, round);
            continue;
        }

        let roundData = [];
        let playingCount = courtCountGlobal * 4;
        if (playingCount > names.length)
            playingCount = names.length - (names.length % 4);

        let resters = pickResters(names, stats, lastPlayed, playingCount);
        let available = names.filter(n => !resters.includes(n));

        for (let c = 1; c <= courtCountGlobal; c++) {
            if (available.length < 4) break;
            let best = findBestMatch(available, stats, lastPlayed, teammateHistory, opponentHistory, round);
            updateStats(best, round, stats, lastPlayed, teammateHistory, opponentHistory);
            roundData.push({
                players: best,
                score1: 0,
                score2: 0
            });
            available = available.filter(p => !best.includes(p));
        }
        schedule[round - 1] = { round, matches: roundData, rest: resters };
    }
    render(); // 建立完畢後執行繪製 [2]
}

// 3. 繪製介面 (核心修正：清空舊內容)
function render() {
    let out = document.getElementById("output");
    out.innerHTML = ""; // 每次重繪前先清空，避免內容重複 [3]

    schedule.forEach((r, ri) => {
        let title = document.createElement("div");
        title.innerHTML = `<h3>*第 ${r.round} 輪*</h3>`;
        out.appendChild(title);

        r.matches.forEach((m, mi) => {
            let div = document.createElement("div");
            div.className = "match";
            // 這裡包含球員姓名輸入框與分數輸入框 [3, 4]
            div.innerHTML = `
                <input type="text" value="${m.players}">
                <input type="text" value="${m.players[1]}"> 
                VS 
                <input type="text" value="${m.players[5]}">
                <input type="text" value="${m.players[2]}">
                | 分數: 
                <input type="number" value="${m.score1}" onchange="updateScore(${ri},${mi},1,this.value)"> : 
                <input type="number" value="${m.score2}" onchange="updateScore(${ri},${mi},2,this.value)">
                <button onclick="rebuildFrom(${r.round})">重排後續</button>
            `;
            out.appendChild(div);
        });

        let rest = document.createElement("div");
        rest.innerText = "休息: " + r.rest.join(" ");
        out.appendChild(rest);
    });

    renderRanking(); // 在賽程繪製完後，緊接著繪製排名 [4]
}

// 4. 更新分數並重繪 (修正點：呼叫 render 而非單獨呼叫排名)
function updateScore(r, m, team, value) {
    if (team == 1) schedule[r].matches[m].score1 = parseInt(value || 0);
    if (team == 2) schedule[r].matches[m].score2 = parseInt(value || 0);
    
    // 原本這裡只呼叫 renderRanking() 導致重複出現，現在改呼叫 render() 以重新整理畫面 [6]
    render(); 
}

// 5. 計算與繪製排名
function renderRanking() {
    let table = {};
    originalNames.forEach(n => {
        table[n] = { win: 0, lose: 0, point: 0, score: 0, against: 0 };
    });

    schedule.forEach(r => {
        r.matches.forEach(m => {
            let t1 = [m.players, m.players[1]];
            let t2 = [m.players[5], m.players[2]];
            t1.forEach(p => { table[p].score += m.score1; table[p].against += m.score2; });
            t2.forEach(p => { table[p].score += m.score2; table[p].against += m.score1; });

            if (m.score1 > m.score2) {
                t1.forEach(p => { table[p].win++; table[p].point += 2; });
                t2.forEach(p => { table[p].lose++; });
            } else if (m.score2 > m.score1) {
                t2.forEach(p => { table[p].win++; table[p].point += 2; });
                t1.forEach(p => { table[p].lose++; });
            }
        });
    });

    let arr = Object.keys(table).map(p => ({ name: p, ...table[p] }));
    // 排序邏輯：積分優先，淨勝分次之 [7]
    arr.sort((a, b) => b.point - a.point || (b.score - b.against) - (a.score - a.against));

    let out = document.getElementById("output");
    out.appendChild(document.createElement("hr"));
    let title = document.createElement("div");
    title.innerHTML = "<h2>*目前排名*</h2>";
    out.appendChild(title);

    arr.forEach((p, i) => {
        let div = document.createElement("div");
        div.innerText = `${i + 1}. ${p.name} | 積分:${p.point} | 勝:${p.win} 敗:${p.lose} | 得:${p.score} 失:${p.against}`;
        out.appendChild(div);
    });
}

// --- 以下為輔助運算函式 (保持不變) ---
function applyExistingRound(r, stats, lastPlayed, teammateHistory, opponentHistory, round) {
    r.matches.forEach(m => updateStats(m.players, round, stats, lastPlayed, teammateHistory, opponentHistory));
}

function pickResters(names, stats, lastPlayed, playingCount) {
    return [...names].sort((a, b) => (stats[b] - stats[a]) || (lastPlayed[b] - lastPlayed[a])).slice(0, names.length - playingCount);
}

function findBestMatch(pool, stats, lastPlayed, teammateHistory, opponentHistory, round) {
    let bestScore = Infinity, best = null;
    for (let i = 0; i < 80; i++) {
        let four = shuffle([...pool]).slice(0, 4);
        let score = 0;
        four.forEach(p => {
            score += stats[p] * 120;
            if (round - lastPlayed[p] == 1) score += 300;
        });
        let t1 = [four, four[1]], t2 = [four[5], four[2]];
        t1.forEach(a => t1.forEach(b => { if (a != b) score += (teammateHistory[a][b] || 0) * 100; }));
        t2.forEach(a => t2.forEach(b => { if (a != b) score += (teammateHistory[a][b] || 0) * 100; }));
        t1.forEach(a => t2.forEach(b => { score += (opponentHistory[a][b] || 0) * 60; }));
        if (score < bestScore) { bestScore = score; best = four; }
    }
    return best;
}

function updateStats(four, round, stats, lastPlayed, teammateHistory, opponentHistory) {
    four.forEach(p => { stats[p]++; lastPlayed[p] = round; });
    let t1 = [four, four[1]], t2 = [four[5], four[2]];
    t1.forEach(a => t1.forEach(b => { if (a != b) teammateHistory[a][b] = (teammateHistory[a][b] || 0) + 1; }));
    t2.forEach(a => t2.forEach(b => { if (a != b) teammateHistory[a][b] = (teammateHistory[a][b] || 0) + 1; }));
    t1.forEach(a => t2.forEach(b => {
        opponentHistory[a][b] = (opponentHistory[a][b] || 0) + 1;
        opponentHistory[b][a] = (opponentHistory[b][a] || 0) + 1;
    }));
}

function shuffle(arr) { return arr.sort(() => Math.random() - 0.5); }

function rebuildFrom(round) {
    // 這裡應獲取當前所有輸入的名字並更新 schedule，再重新建立後續賽程 [4]
    buildSchedule(round, false);
}
