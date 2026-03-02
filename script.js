let schedule = [];
let stats = {};
let teammateHistory = {};
let opponentHistory = {};
let lastPlayedRound = {};

function generate() {

let names = document.getElementById("players").value
.split("\n")
.map(x=>x.trim())
.filter(x=>x);

let courtCount = parseInt(document.getElementById("courts").value);

if(names.length < 4){
alert("至少需要4人");
return;
}

initStats(names);

schedule = [];

for(let round=1; round<=20; round++){

let roundData = [];
let playingCount = courtCount * 4;

if(playingCount > names.length)
playingCount = names.length - (names.length % 4);

let resting = pickResters(names, playingCount);

let available = names.filter(n=>!resting.includes(n));

for(let c=1; c<=courtCount; c++){

if(available.length < 4) break;

let bestMatch = findBestMatch(available);

updateStats(bestMatch, round);

roundData.push(bestMatch);

available = available.filter(p=>!bestMatch.includes(p));
}

schedule.push({
round: round,
matches: roundData,
rest: resting
});
}

render();
}

function initStats(names){
stats = {};
teammateHistory = {};
opponentHistory = {};
lastPlayedRound = {};

names.forEach(n=>{
stats[n] = 0;
teammateHistory[n] = {};
opponentHistory[n] = {};
lastPlayedRound[n] = -99;
});
}

function pickResters(names, playingCount){

let sorted = [...names].sort((a,b)=>{
if(stats[b] != stats[a])
return stats[b] - stats[a];
return lastPlayedRound[b] - lastPlayedRound[a];
});

return sorted.slice(0, names.length - playingCount);
}

function findBestMatch(pool){

let bestScore = Infinity;
let bestCombo = null;

for(let i=0;i<50;i++){

let shuffled = shuffle([...pool]);
let four = shuffled.slice(0,4);

let score = evaluate(four);

if(score < bestScore){
bestScore = score;
bestCombo = four;
}
}

return bestCombo;
}

function evaluate(four){

let score = 0;

four.forEach(p=>{
score += stats[p] * 100;
score += (20 - lastPlayedRound[p]) * 5;
});

let t1 = [four[0],four[1]];
let t2 = [four[2],four[3]];

t1.forEach(a=>{
t1.forEach(b=>{
if(a!=b)
score += (teammateHistory[a][b] || 0) * 50;
});
});

t2.forEach(a=>{
t2.forEach(b=>{
if(a!=b)
score += (teammateHistory[a][b] || 0) * 50;
});
});

t1.forEach(a=>{
t2.forEach(b=>{
score += (opponentHistory[a][b] || 0) * 30;
});
});

return score;
}

function updateStats(four, round){

four.forEach(p=>{
stats[p]++;
lastPlayedRound[p] = round;
});

let t1 = [four[0],four[1]];
let t2 = [four[2],four[3]];

t1.forEach(a=>{
t1.forEach(b=>{
if(a!=b)
teammateHistory[a][b]=(teammateHistory[a][b]||0)+1;
});
});

t2.forEach(a=>{
t2.forEach(b=>{
if(a!=b)
teammateHistory[a][b]=(teammateHistory[a][b]||0)+1;
});
});

t1.forEach(a=>{
t2.forEach(b=>{
opponentHistory[a][b]=(opponentHistory[a][b]||0)+1;
opponentHistory[b][a]=(opponentHistory[b][a]||0)+1;
});
});
}

function shuffle(arr){
return arr.sort(()=>Math.random()-0.5);
}

function render(){

let out = document.getElementById("output");
out.innerHTML="";

schedule.forEach(r=>{

let title = document.createElement("div");
title.innerHTML = "<b>第 "+r.round+" 輪</b>";
out.appendChild(title);

r.matches.forEach((m,i)=>{
let div = document.createElement("div");
div.className="match";
div.innerText =
"場"+(i+1)+": "+
m[0]+" "+m[1]+" VS "+m[2]+" "+m[3];
out.appendChild(div);
});

let rest = document.createElement("div");
rest.innerText="休息: "+r.rest.join(" ");
out.appendChild(rest);

});

renderStats();
}

function renderStats(){

let out = document.getElementById("output");

let hr = document.createElement("hr");
out.appendChild(hr);

let title = document.createElement("div");
title.innerHTML="<b>上場統計</b>";
out.appendChild(title);

Object.keys(stats).forEach(p=>{
let div = document.createElement("div");
div.innerText = p + " : " + stats[p] + " 次";
out.appendChild(div);
});
}
