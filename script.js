let schedule = [];
let originalNames = [];
let courtCountGlobal = 1;

function generate(){

originalNames = document.getElementById("players").value
.split("\n")
.map(x=>x.trim())
.filter(x=>x);

courtCountGlobal = parseInt(document.getElementById("courts").value);

if(originalNames.length < 4){
alert("至少需要4人");
return;
}

buildSchedule(1,true);
}

function buildSchedule(startRound,resetAll=false){

if(resetAll) schedule=[];

let names=[...originalNames];

let stats={};
let teammateHistory={};
let opponentHistory={};
let lastPlayed={};

names.forEach(n=>{
stats[n]=0;
teammateHistory[n]={};
opponentHistory[n]={};
lastPlayed[n]=-99;
});

let maxRound=20;

for(let round=1; round<=maxRound; round++){

if(round < startRound && schedule[round-1]){
applyExistingRound(schedule[round-1],stats,lastPlayed,teammateHistory,opponentHistory,round);
continue;
}

let roundData=[];
let playingCount=courtCountGlobal*4;

if(playingCount>names.length)
playingCount=names.length-(names.length%4);

let resters=pickResters(names,stats,lastPlayed,playingCount);

let available=names.filter(n=>!resters.includes(n));

for(let c=1;c<=courtCountGlobal;c++){

if(available.length<4) break;

let best=findBestMatch(available,stats,lastPlayed,teammateHistory,opponentHistory,round);

updateStats(best,round,stats,lastPlayed,teammateHistory,opponentHistory);

roundData.push(best);

available=available.filter(p=>!best.includes(p));
}

schedule[round-1]={
round:round,
matches:roundData,
rest:resters
};
}

render();
saveLocal();
}

function applyExistingRound(r,stats,lastPlayed,teammateHistory,opponentHistory,round){

r.matches.forEach(m=>{
updateStats(m,round,stats,lastPlayed,teammateHistory,opponentHistory);
});
}

function pickResters(names,stats,lastPlayed,playingCount){

let sorted=[...names].sort((a,b)=>{
if(stats[b]!=stats[a]) return stats[b]-stats[a];
return lastPlayed[b]-lastPlayed[a];
});

return sorted.slice(0,names.length-playingCount);
}

function findBestMatch(pool,stats,lastPlayed,teammateHistory,opponentHistory,round){

let bestScore=Infinity;
let best=null;

for(let i=0;i<80;i++){

let four=shuffle([...pool]).slice(0,4);
let score=0;

four.forEach(p=>{
score+=stats[p]*120;
if(round-lastPlayed[p]==1) score+=300;
});

let t1=[four[0],four[1]];
let t2=[four[2],four[3]];

t1.forEach(a=>{
t1.forEach(b=>{
if(a!=b)
score+=(teammateHistory[a][b]||0)*100;
});
});

t2.forEach(a=>{
t2.forEach(b=>{
if(a!=b)
score+=(teammateHistory[a][b]||0)*100;
});
});

t1.forEach(a=>{
t2.forEach(b=>{
score+=(opponentHistory[a][b]||0)*60;
});
});

if(score<bestScore){
bestScore=score;
best=four;
}
}

return best;
}

function updateStats(four,round,stats,lastPlayed,teammateHistory,opponentHistory){

four.forEach(p=>{
stats[p]++;
lastPlayed[p]=round;
});

let t1=[four[0],four[1]];
let t2=[four[2],four[3]];

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

let out=document.getElementById("output");
out.innerHTML="";

schedule.forEach(r=>{

let title=document.createElement("div");
title.innerHTML="<b>第 "+r.round+" 輪</b>";
out.appendChild(title);

r.matches.forEach((m,i)=>{
let div=document.createElement("div");
div.className="match";

div.innerHTML=
"場"+(i+1)+": "+
"<input value='"+m[0]+"'> "+
"<input value='"+m[1]+"'> VS "+
"<input value='"+m[2]+"'> "+
"<input value='"+m[3]+"'> "+
"<button onclick='rebuildFrom("+r.round+")'>重排後續</button>";

out.appendChild(div);
});

let rest=document.createElement("div");
rest.innerText="休息: "+r.rest.join(" ");
out.appendChild(rest);
});

renderStats();
}

function renderStats(){

let statsCount={};

schedule.forEach(r=>{
r.matches.forEach(m=>{
m.forEach(p=>{
statsCount[p]=(statsCount[p]||0)+1;
});
});
});

let out=document.getElementById("output");

let hr=document.createElement("hr");
out.appendChild(hr);

let title=document.createElement("div");
title.innerHTML="<b>上場統計</b>";
out.appendChild(title);

Object.keys(statsCount).forEach(p=>{
let div=document.createElement("div");
div.innerText=p+" : "+statsCount[p]+" 次";
out.appendChild(div);
});
}

function rebuildFrom(round){

// 讀取修改後名單
document.querySelectorAll(".match").forEach((div,i)=>{
let inputs=div.querySelectorAll("input");
let rIndex=Math.floor(i/courtCountGlobal);
let mIndex=i%courtCountGlobal;

schedule[rIndex].matches[mIndex]=[
inputs[0].value,
inputs[1].value,
inputs[2].value,
inputs[3].value
];
});

buildSchedule(round,false);
}

function saveLocal(){
localStorage.setItem("ultimateSchedule",JSON.stringify(schedule));
}
