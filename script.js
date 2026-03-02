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
alert("至少4人");
return;
}

buildSchedule(1,true);
}

function buildSchedule(startRound,resetAll=false){

if(resetAll) schedule=[];

let names=[...originalNames];

let stats={}, teammateHistory={}, opponentHistory={}, lastPlayed={};

names.forEach(n=>{
stats[n]=0;
teammateHistory[n]={};
opponentHistory[n]={};
lastPlayed[n]=-99;
});

for(let round=1; round<=20; round++){

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

roundData.push({
players:best,
score1:0,
score2:0
});

available=available.filter(p=>!best.includes(p));
}

schedule[round-1]={ round, matches:roundData, rest:resters };
}

render();
}

function applyExistingRound(r,stats,lastPlayed,teammateHistory,opponentHistory,round){
r.matches.forEach(m=>{
updateStats(m.players,round,stats,lastPlayed,teammateHistory,opponentHistory);
});
}

function pickResters(names,stats,lastPlayed,playingCount){
return [...names]
.sort((a,b)=>{
if(stats[b]!=stats[a]) return stats[b]-stats[a];
return lastPlayed[b]-lastPlayed[a];
})
.slice(0,names.length-playingCount);
}

function findBestMatch(pool,stats,lastPlayed,teammateHistory,opponentHistory,round){

let bestScore=Infinity,best=null;

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
if(a!=b) score+=(teammateHistory[a][b]||0)*100;
});
});

t2.forEach(a=>{
t2.forEach(b=>{
if(a!=b) score+=(teammateHistory[a][b]||0)*100;
});
});

t1.forEach(a=>{
t2.forEach(b=>{
score+=(opponentHistory[a][b]||0)*60;
});
});

if(score<bestScore){ bestScore=score; best=four; }
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

function shuffle(arr){ return arr.sort(()=>Math.random()-0.5); }

function render(){

let out=document.getElementById("output");
out.innerHTML="";

schedule.forEach((r,ri)=>{

let title=document.createElement("div");
title.innerHTML="<b>第 "+r.round+" 輪</b>";
out.appendChild(title);

r.matches.forEach((m,mi)=>{

let div=document.createElement("div");
div.className="match";

div.innerHTML=
"<input value='"+m.players[0]+"'> "+
"<input value='"+m.players[1]+"'> ("+
"<input type='number' value='"+m.score1+"' onchange='updateScore("+ri+","+mi+",1,this.value)'> ) VS ("+
"<input type='number' value='"+m.score2+"' onchange='updateScore("+ri+","+mi+",2,this.value)'> ) "+
"<input value='"+m.players[2]+"'> "+
"<input value='"+m.players[3]+"'> "+
"<button onclick='rebuildFrom("+r.round+")'>重排後續</button>";

out.appendChild(div);
});

let rest=document.createElement("div");
rest.innerText="休息: "+r.rest.join(" ");
out.appendChild(rest);
});

renderRanking();
}

function rebuildFrom(round){

document.querySelectorAll(".match").forEach((div,i)=>{

let inputs=div.querySelectorAll("input");
let rIndex=Math.floor(i/courtCountGlobal);
let mIndex=i%courtCountGlobal;

schedule[rIndex].matches[mIndex].players=[
inputs[0].value,
inputs[1].value,
inputs[4].value,
inputs[5].value
];
});

buildSchedule(round,false);
}

function updateScore(r,m,team,value){

if(team==1) schedule[r].matches[m].score1=parseInt(value||0);
if(team==2) schedule[r].matches[m].score2=parseInt(value||0);

renderRanking();
}

function renderRanking(){

let table={};

originalNames.forEach(n=>{
table[n]={win:0,lose:0,point:0,score:0,against:0};
});

schedule.forEach(r=>{
r.matches.forEach(m=>{

let t1=[m.players[0],m.players[1]];
let t2=[m.players[2],m.players[3]];

t1.forEach(p=>{
table[p].score+=m.score1;
table[p].against+=m.score2;
});

t2.forEach(p=>{
table[p].score+=m.score2;
table[p].against+=m.score1;
});

if(m.score1>m.score2){
t1.forEach(p=>{ table[p].win++; table[p].point+=2; });
t2.forEach(p=>{ table[p].lose++; });
}
if(m.score2>m.score1){
t2.forEach(p=>{ table[p].win++; table[p].point+=2; });
t1.forEach(p=>{ table[p].lose++; });
}
});
});

let arr=Object.keys(table).map(p=>({name:p,...table[p]}));

arr.sort((a,b)=> b.point-a.point || (b.score-b.against)-(a.score-a.against));

let out=document.getElementById("output");

let hr=document.createElement("hr");
out.appendChild(hr);

let title=document.createElement("div");
title.innerHTML="<b>排名</b>";
out.appendChild(title);

arr.forEach((p,i)=>{
let div=document.createElement("div");
div.innerText=
(i+1)+". "+p.name+
" 積分:"+p.point+
" 勝:"+p.win+
" 敗:"+p.lose+
" 得:"+p.score+
" 失:"+p.against;
out.appendChild(div);
});
}
function exportCSV(){

let rows=[];

rows.push(["輪次","場次","隊伍A","A得分","隊伍B","B得分"]);

schedule.forEach(r=>{
r.matches.forEach((m,i)=>{
rows.push([
r.round,
i+1,
m.players[0]+" "+m.players[1],
m.score1,
m.players[2]+" "+m.players[3],
m.score2
]);
});
});

rows.push([]);
rows.push(["排名"]);

let table={};

originalNames.forEach(n=>{
table[n]={win:0,lose:0,point:0,score:0,against:0};
});

schedule.forEach(r=>{
r.matches.forEach(m=>{
let t1=[m.players[0],m.players[1]];
let t2=[m.players[2],m.players[3]];

t1.forEach(p=>{
table[p].score+=m.score1;
table[p].against+=m.score2;
});
t2.forEach(p=>{
table[p].score+=m.score2;
table[p].against+=m.score1;
});

if(m.score1>m.score2){
t1.forEach(p=>{ table[p].win++; table[p].point+=2; });
t2.forEach(p=>{ table[p].lose++; });
}
if(m.score2>m.score1){
t2.forEach(p=>{ table[p].win++; table[p].point+=2; });
t1.forEach(p=>{ table[p].lose++; });
}
});
});

let ranking=Object.keys(table).map(p=>({name:p,...table[p]}));
ranking.sort((a,b)=> b.point-a.point || (b.score-b.against)-(a.score-a.against));

rows.push(["名次","姓名","積分","勝","敗","得分","失分"]);

ranking.forEach((p,i)=>{
rows.push([i+1,p.name,p.point,p.win,p.lose,p.score,p.against]);
});

let csvContent = "data:text/csv;charset=utf-8,"
+ rows.map(e=>e.join(",")).join("\n");

let encodedUri = encodeURI(csvContent);
let link = document.createElement("a");
link.setAttribute("href", encodedUri);
link.setAttribute("download", "比賽結果.csv");
document.body.appendChild(link);
link.click();
}
