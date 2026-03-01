let schedule = [];
let stats = {};
let teammateHistory = {};
let opponentHistory = {};

function generate() {

let names = document.getElementById("players").value
.split("\n")
.map(x=>x.trim())
.filter(x=>x);

let courtCount = parseInt(document.getElementById("courts").value);

if(names.length < 4) {
alert("至少需要 4 人");
return;
}

initStats(names);

schedule = [];

for(let round=1; round<=20; round++){

let roundData = [];
let available = [...names];

for(let c=1; c<=courtCount; c++){

let playersNeeded = 4;
if(available.length < 4) break;

let four = pickPlayers(available);

updateStats(four, round);

roundData.push(four);

available = available.filter(p=>!four.includes(p));
}

schedule.push(roundData);
}

render();
saveLocal();
}

function initStats(names){
stats = {};
teammateHistory = {};
opponentHistory = {};

names.forEach(n=>{
stats[n] = { count:0, last:-1 };
teammateHistory[n] = {};
opponentHistory[n] = {};
});
}

function pickPlayers(pool){

pool.sort((a,b)=>{
if(stats[a].count != stats[b].count)
return stats[a].count - stats[b].count;
return stats[a].last - stats[b].last;
});

let selected = pool.slice(0,4);

return shuffle(selected);
}

function updateStats(four, round){

four.forEach(p=>{
stats[p].count++;
stats[p].last = round;
});

let t1 = [four[0],four[1]];
let t2 = [four[2],four[3]];

t1.forEach(a=>{
t1.forEach(b=>{
if(a!=b)
teammateHistory[a][b]=(teammateHistory[a][b]||0)+1;
});
});

t1.forEach(a=>{
t2.forEach(b=>{
opponentHistory[a][b]=(opponentHistory[a][b]||0)+1;
});
});

t2.forEach(a=>{
t2.forEach(b=>{
if(a!=b)
teammateHistory[a][b]=(teammateHistory[a][b]||0)+1;
});
});

t2.forEach(a=>{
t1.forEach(b=>{
opponentHistory[a][b]=(opponentHistory[a][b]||0)+1;
});
});
}

function shuffle(arr){
return arr.sort(()=>Math.random()-0.5);
}

function render(){
let out = document.getElementById("output");
out.innerHTML="";

schedule.forEach((roundData,i)=>{
let div = document.createElement("div");
div.className="round-title";
div.innerText="第 "+(i+1)+" 輪";
out.appendChild(div);

roundData.forEach((match,j)=>{
let m = document.createElement("div");
m.className="match";
m.innerText =
"場"+(j+1)+": "+
match[0]+" "+match[1]+
" VS "+
match[2]+" "+match[3];
out.appendChild(m);
});
});
}

function resetAll(){
localStorage.clear();
location.reload();
}

function saveLocal(){
localStorage.setItem("schedule",JSON.stringify(schedule));
}

if("serviceWorker" in navigator){
navigator.serviceWorker.register("service-worker.js");
}
