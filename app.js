const KEY="konkur_tracker_v2";

// === اینجا اسم شخصی که مایل هستید را جایگزین کنید ===
const USER_NAME = "ابوالفضل"; 
// ====================================================

const defaults=["ریاضی","فیزیک","شیمی","هندسه","ادبیات","دینی","زبان","عربی"];
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{
 targetHours:8,targetTests:80,theme:"dark",compact:false,
 subjects:defaults.map(name=>({name})),days:{},sessions:[],tests:[],goals:[],
 exams:[], reminders:[] // اضافه شدن استیت‌های جدید
};
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function pad(n){return String(n).padStart(2,"0")}
function key(d=new Date()){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
function faDate(d=new Date()){return new Intl.DateTimeFormat("fa-IR",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(d)}
function remain(){let end=new Date(2027,6-1,30,23,59,59), now=new Date();return Math.max(0,Math.ceil((end-now)/86400000))}
function mins(k){return state.sessions.filter(x=>x.date===k).reduce((a,x)=>a+Number(x.minutes||0),0)}
function tests(k){return state.tests.filter(x=>x.date===k).reduce((a,x)=>a+Number(x.count||0),0)}
function fmt(m){m=Math.round(m||0);return `${Math.floor(m/60)} ساعت ${m%60} دقیقه`}
function pct(a,b){return b?Math.min(100,Math.round(a/b*100)):0}
function all(){let m=state.sessions.reduce((a,x)=>a+Number(x.minutes||0),0),t=state.tests.reduce((a,x)=>a+Number(x.count||0),0),c=state.tests.reduce((a,x)=>a+Number(x.correct||0),0);return{m,t,c,rate:t?Math.round(c/t*100):0}}
function subStat(name){let ss=state.sessions.filter(x=>x.subject===name),tt=state.tests.filter(x=>x.subject===name);let m=ss.reduce((a,x)=>a+Number(x.minutes||0),0),t=tt.reduce((a,x)=>a+Number(x.count||0),0),c=tt.reduce((a,x)=>a+Number(x.correct||0),0);return{m,t,rate:t?Math.round(c/t*100):0}}
function streak(){
    let n=0, d=new Date();
    if(mins(key(d))+tests(key(d))<=0) d.setDate(d.getDate()-1); 
    while(mins(key(d))+tests(key(d))>0){ n++; d.setDate(d.getDate()-1); }
    return n;
}

// سیستم XP و مدال‌ها (Gamification)
function getXP(){ let a=all(); return Math.floor(a.m/6) + Math.floor(a.t/2); } // 1 ساعت = 10 XP | 10 تست = 5 XP
function getLevel(){ return Math.floor(Math.sqrt(getXP() / 50)) + 1; }
function getBadges(){
    let b=[], a=all(), h=Math.floor(a.m/60), s=streak();
    if(h>=1) b.push({i:"🌱", n:"شروع مسیر", d:"اولین ساعت مطالعه"});
    if(h>=100) b.push({i:"📚", n:"کتاب‌خور", d:"۱۰۰ ساعت مطالعه"});
    if(a.t>=5000) b.push({i:"⚙️", n:"ماشین تست", d:"۵۰۰۰ تست زده‌شده"});
    if(s>=7) b.push({i:"🔥", n:"آتشین", d:"۷ روز مطالعه متوالی"});
    if(s>=30) b.push({i:"🛡️", n:"اراده پولادین", d:"۳۰ روز متوالی (بسیار سخت)"});
    if(h>=1000 && a.t>=30000) b.push({i:"👑", n:"افسانه کنکور", d:"۱۰۰۰ ساعت + ۳۰هزار تست (نهایی)"});
    return b;
}

function toast(t){let e=document.getElementById("toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),1800)}
function showModal(title,body,ok){let m=document.getElementById("modal");m.classList.remove("hidden");m.innerHTML=`<div class="modal-box"><h3>${title}</h3>${body}<div class="modal-actions"><button class="btn" id="modalCancel">بستن / لغو</button><button class="btn primary" id="modalOK" style="${!ok?'display:none':''}">تأیید</button></div></div>`;document.getElementById("modalCancel").onclick=()=>m.classList.add("hidden");if(ok)document.getElementById("modalOK").onclick=()=>{ok();m.classList.add("hidden");}}
function chart(n=14){let a=[],max=60;for(let i=n-1;i>=0;i--){let d=new Date();d.setDate(d.getDate()-i);let k=key(d),m=mins(k);a.push({d,m});max=Math.max(max,m)}return `<div class="chart">${a.map(x=>`<div class="barwrap"><div class="bar" style="height:${Math.max(2,x.m/max*82)}%" title="${fmt(x.m)}"></div><div class="barlabel">${new Intl.DateTimeFormat("fa-IR",{weekday:"short"}).format(x.d)}</div></div>`).join("")}</div>`}

// نمودار هیت‌مپ گیت‌هاب (Github Heatmap)
function heatmap(){
    let html = '<div class="heatmap-wrap"><div class="heatmap">';
    for(let i=139; i>=0; i--) {
        let d = new Date(); d.setDate(d.getDate()-i); let m = mins(key(d)), c = "lvl0";
        if(m>0) c="lvl1"; if(m>120) c="lvl2"; if(m>240) c="lvl3"; if(m>420) c="lvl4";
        html += `<div class="heatmap-cell ${c}" title="${faDate(d)} : ${fmt(m)}"></div>`;
    }
    return html + '</div></div>';
}

function dash(){
let a=all(),k=key(),tm=mins(k),tt=tests(k),done=Math.round((pct(tm,state.targetHours*60)+pct(tt,state.targetTests))/2),days_count=state.sessions.length?new Set(state.sessions.map(x=>x.date)).size:0;let elapsed=Math.max(0,304-remain()),prog=Math.min(100,Math.round(elapsed/304*100));
let todayReminders = state.reminders.filter(r => r.date === k);
let todayGoals = state.goals.filter(g => g.date === k);
return `
<div class="grid g3">
  <div class="card" style="grid-column: span 2; background:linear-gradient(135deg,#1b2037,#26204b);border-color:#6658bd55;padding:18px 22px;display:flex;align-items:center;gap:14px;">
    <div style="font-size:32px;">👋</div>
    <div>
      <div style="font-size:18px;font-weight:800;">خوش اومدی <span style="color:var(--cyan);">${USER_NAME}</span> جان!</div>
      <div class="muted" style="margin-top:3px;">امروز هم یک قدم به موفقیت در مسیر کنکور نزدیک‌تر شو.</div>
    </div>
  </div>
  <div class="card stat" style="min-height:auto; padding:15px; text-align:center;">
    <div class="label" style="margin-top:0">سطح شما (Level)</div>
    <div class="num" style="color:var(--orange)">Lvl ${getLevel()}</div>
    <div class="sub">${getXP()} XP کسب شده</div>
  </div>
</div>

<div class="grid g4" style="margin-top:16px;">
<div class="card stat"><div class="ico">⏱️</div><div class="label">مطالعه کل</div><div class="num">${fmt(a.m)}</div><div class="sub">${days_count} روز مطالعه</div></div>
<div class="card stat"><div class="ico">📝</div><div class="label">تست کل</div><div class="num">${a.t}</div><div class="sub">${a.rate}% پاسخ صحیح</div></div>
<div class="card stat"><div class="ico">🔥</div><div class="label">Streak</div><div class="num">${streak()}</div><div class="sub">روز متوالی</div></div>
<div class="card stat"><div class="ico">📈</div><div class="label">میانگین مطالعه</div><div class="num">${days_count?(a.m/days_count/60).toFixed(1):0}h</div><div class="sub">در هر روز مطالعه</div></div>
</div>

<div class="grid g2" style="margin-top:16px;">
  <div class="card hero"><div class="hero-row"><div><div class="muted">⏳ شمارش معکوس کنکور</div><div class="count">${remain()} روز</div><div class="muted">۱۰ تیر ۱۴۰۶</div></div><div class="ring" style="--p:${Math.max(2,prog)}%" data-text="${prog}%"></div></div><div style="margin-top:18px;position:relative;z-index:1"><div class="muted">پیشرفت زمانی مسیر</div><div class="progress" style="margin-top:8px"><i style="width:${prog}%"></i></div></div></div>
  <div class="card">
    <div class="section-title" style="margin-top:0"><h2>🔔 یادآوری و اهداف امروز</h2></div>
    ${todayReminders.length?todayReminders.map(r=>`<div class="reminder-item">⏰ <b>یادآوری:</b> ${r.text}</div>`).join(""):''}
    ${todayGoals.length?todayGoals.map(g=>`<div class="goal-item ${g.done?'done':''}"><div><b>${g.title}</b><div class="muted" style="font-size:10px">${g.value||''}</div></div><input type="checkbox" class="goal-check" data-id="${g.id}" ${g.done?'checked':''}></div>`).join(""):''}
    ${(!todayReminders.length && !todayGoals.length) ? '<div class="empty">برای امروز هدف یا یادآوری ثبت نشده.</div>':''}
  </div>
</div>

<div class="section-title"><h2>☀️ وضعیت امروز</h2><button class="btn primary" data-go="today">+ ثبت مطالعه</button></div>
<div class="grid g4">
<div class="card"><div class="label">هدف مطالعه</div><div class="kpi">${state.targetHours} ساعت</div><div class="mini">واقعی: ${fmt(tm)}</div><div class="progress" style="margin-top:11px"><i style="width:${pct(tm,state.targetHours*60)}%"></i></div></div>
<div class="card"><div class="label">هدف تست</div><div class="kpi">${state.targetTests}</div><div class="mini">واقعی: ${tt}</div><div class="progress" style="margin-top:11px"><i style="width:${pct(tt,state.targetTests)}%"></i></div></div>
<div class="card"><div class="label">تحقق امروز</div><div class="kpi">${done}%</div><div class="mini">مطالعه + تست</div></div>
<div class="card"><div class="label">تاریخ امروز</div><div class="kpi" style="font-size:16px">${faDate()}</div><div class="mini">شروع مسیر: ۸ شهریور ۱۴۰۵</div></div>
</div>`}

function today(){let k=key(),tm=mins(k),tt=tests(k),d=state.days[k]||{};return `
<div class="grid g3"><div class="card"><div class="label">مطالعه امروز</div><div class="num">${fmt(tm)}</div><div class="mini">هدف: ${state.targetHours} ساعت</div></div><div class="card"><div class="label">تست امروز</div><div class="num">${tt}</div><div class="mini">هدف: ${state.targetTests}</div></div><div class="card"><div class="label">تحقق امروز</div><div class="num">${Math.round((pct(tm,state.targetHours*60)+pct(tt,state.targetTests))/2)}%</div></div></div>
<div class="section-title"><h2>➕ ثبت جلسه مطالعه</h2></div><div class="card"><form id="sf" class="form"><div class="grid g3"><label>درس<select name="subject">${state.subjects.map(s=>`<option>${s.name}</option>`).join("")}</select></label><label>مبحث<input name="topic" placeholder="مثلاً مشتق"></label><label>مدت (دقیقه)<input name="minutes" type="number" min="1" required value="60"></label></div><div class="grid g2"><label>نوع فعالیت<select name="type"><option>آموزش</option><option>تست</option><option>مرور</option><option>جمع‌بندی</option><option>رفع اشکال</option></select></label><label>توضیحات<input name="note" placeholder="اختیاری"></label></div><button class="btn primary">ثبت جلسه</button></form></div>
<div class="section-title"><h2>📝 ثبت تست</h2></div><div class="card"><form id="tf" class="form"><div class="grid g4"><label>درس<select name="subject">${state.subjects.map(s=>`<option>${s.name}</option>`).join("")}</select></label><label>مبحث<input name="topic"></label><label>تعداد<input name="count" type="number" min="1" required value="20"></label><label>درست<input name="correct" type="number" min="0" required value="0"></label></div><div class="grid g3"><label>غلط<input name="wrong" type="number" min="0" value="0"></label><label>نزده<input name="blank" type="number" min="0" value="0"></label><label>زمان (دقیقه)<input name="time" type="number" min="0" value="0"></label></div><button class="btn primary">ثبت تست</button></form></div>
<div class="section-title"><h2>📋 گزارش روز</h2></div><div class="card"><form id="df" class="form"><div class="grid g3"><label>انرژی (۱–۵)<input name="energy" type="number" min="1" max="5" value="${d.energy||3}"></label><label>تمرکز (۱–۵)<input name="focus" type="number" min="1" max="5" value="${d.focus||3}"></label><label>وضعیت روز<select name="status">${["عالی","خوب","متوسط","ضعیف"].map(x=>`<option ${d.status===x?"selected":""}>${x}</option>`).join("")}</select></label></div><label>گزارش<textarea name="note" rows="3">${d.note||""}</textarea></label><button class="btn primary">ذخیره گزارش</button></form></div>
<div class="section-title"><h2>🕘 جلسات امروز</h2></div><div class="card">${sessionTable(state.sessions.filter(x=>x.date===k))}</div>`}
function sessionTable(rows){if(!rows.length)return `<div class="empty">هنوز جلسه‌ای برای این روز ثبت نشده.</div>`;return `<div class="table-wrap"><table class="table"><tr><th>درس</th><th>مبحث</th><th>نوع</th><th>مدت</th><th></th></tr>${rows.map(x=>`<tr><td>${x.subject}</td><td>${x.topic||"—"}</td><td><span class="pill">${x.type}</span></td><td>${fmt(x.minutes)}</td><td><button class="btn danger ds" data-id="${x.id}">حذف</button></td></tr>`).join("")}</table></div>`}

window.daysPage = window.daysPage || 1;
function days(){
    let allKeys = Array.from(new Set([...state.sessions.map(x=>x.date), ...state.tests.map(x=>x.date), ...Object.keys(state.days)])).sort((a,b)=>b.localeCompare(a));
    let totalPages = Math.ceil(allKeys.length / 10) || 1;
    let pagedKeys = allKeys.slice((window.daysPage-1)*10, window.daysPage*10);
    
    let rows = pagedKeys.map(k => {
        let d = new Date(k);
        return {d, k, m:mins(k), t:tests(k), info:state.days[k]||{}};
    });

    let pagHtml = `<div class="pagination">` + Array.from({length:totalPages}, (_,i)=>`<button class="page-btn ${window.daysPage===i+1?'active':''}" data-pagebtn="${i+1}">${i+1}</button>`).join("") + `</div>`;

    return `<div class="notice">در این بخش می‌توانی تاریخچه روزها را ببینی و با آیکون مداد (✏️) اطلاعات همان روز را ویرایش کنی.</div><div class="section-title"><h2>📅 گزارش روزانه (صفحه ${window.daysPage} از ${totalPages})</h2></div><div class="card"><div class="table-wrap"><table class="table"><tr><th>تاریخ</th><th>مطالعه</th><th>تست</th><th>تحقق</th><th>وضعیت</th><th>ویرایش</th></tr>${rows.map(r=>`<tr><td>${new Intl.DateTimeFormat("fa-IR",{weekday:"short",year:"numeric",month:"numeric",day:"numeric"}).format(r.d)}</td><td>${fmt(r.m)}</td><td>${r.t}</td><td>${Math.round((pct(r.m,state.targetHours*60)+pct(r.t,state.targetTests))/2)}%</td><td>${r.info.status||"—"}</td><td><button class="edit-btn" data-editday="${r.k}">✏️ ویرایش</button></td></tr>`).join("")}</table></div>${pagHtml}</div>`}

function subjects(){
    let specNames = ["ریاضی","فیزیک","شیمی","هندسه","زیست","حسابان"];
    let specialized = state.subjects.filter(s=>specNames.includes(s.name));
    let general = state.subjects.filter(s=>!specNames.includes(s.name));
    let group=(title,arr,mark)=>!arr.length ? "" : `<div class="subject-group"><div class="group-title"><i class="mark"></i><h3>${title}</h3></div><div class="subject-grid">${arr.map(s=>{let x=subStat(s.name);return `<div class="card subject-card"><div class="subject-top"><div><div class="subject-name">${s.name}</div><div class="subject-stats">${fmt(x.m)} مطالعه<br>${x.t} تست • ${x.rate}% صحیح</div></div><div class="subject-icon">${mark}</div></div><div><div class="progress"><i style="width:${x.rate}%"></i></div><div class="mini">درصد عملکرد تست</div></div></div>`}).join("")}</div></div>`;
    return `<div class="section-title"><h2>📚 درس‌ها</h2><button class="btn primary" id="addSub">+ افزودن درس</button></div>${group("دروس اختصاصی", specialized, "📐")}${group("دروس عمومی و سایر", general, "📖")}`;
}

function stats(){
    let a=all();
    let bgs = getBadges();
    return `<div class="grid g4"><div class="card stat"><div class="label">مطالعه کل</div><div class="num">${fmt(a.m)}</div></div><div class="card stat"><div class="label">تست کل</div><div class="num">${a.t}</div></div><div class="card stat"><div class="label">درصد صحیح</div><div class="num">${a.rate}%</div></div><div class="card stat"><div class="label">روزهای متوالی</div><div class="num">${streak()}</div></div></div>
    
    <div class="section-title"><h2>🏆 مدال‌ها و افتخارات شما</h2></div>
    <div class="badge-list">${bgs.length?bgs.map(b=>`<div class="badge"><div class="badge-icon">${b.i}</div><div class="badge-info"><b>${b.n}</b>${b.d}</div></div>`).join(""):`<div class="empty">هنوز مدالی دریافت نکرده‌اید. با مطالعه بیشتر مدال بگیرید!</div>`}</div>

    <div class="section-title"><h2>🟩 هیت‌مپ مطالعه در ۱۴۰ روز اخیر</h2></div><div class="card">${heatmap()}</div>
    <div class="section-title"><h2>📈 روند ۱۴ روز اخیر</h2></div><div class="card">${chart(14)}</div>
    <div class="section-title"><h2>📚 مقایسه درس‌ها</h2></div><div class="card"><div class="table-wrap"><table class="table"><tr><th>درس</th><th>مطالعه</th><th>تست</th><th>درصد صحیح</th></tr>${state.subjects.map(s=>{let x=subStat(s.name);return `<tr><td>${s.name}</td><td>${fmt(x.m)}</td><td>${x.t}</td><td class="${x.rate>=70?"good":x.rate<40?"bad":""}">${x.rate}%</td></tr>`}).join("")}</table></div></div>`
}

function examsPage(){
    return `<div class="section-title"><h2>📝 آزمون‌های آزمایشی (ماز و ...)</h2></div>
    <div class="card"><form id="examForm" class="form"><div class="grid g4"><label>تاریخ آزمون<input type="date" name="date" required value="${key()}"></label><label>تراز کل<input type="number" name="taraz" required></label><label>رتبه<input type="number" name="rank"></label><label>توضیحات<input name="note" placeholder="مثلا: مرحله ۵ ماز"></label></div><button class="btn primary">ثبت آزمون</button></form></div>
    <div class="section-title"><h2>📊 سوابق آزمون‌ها</h2></div>
    <div class="card"><div class="table-wrap"><table class="table"><tr><th>تاریخ</th><th>تراز</th><th>رتبه</th><th>توضیحات</th><th>حذف</th></tr>${state.exams.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>`<tr><td>${e.date}</td><td style="color:var(--cyan);font-weight:bold">${e.taraz}</td><td>${e.rank||"-"}</td><td>${e.note||"-"}</td><td><button class="btn danger de" data-id="${e.id}">حذف</button></td></tr>`).join("")||`<tr><td colspan="5" class="empty">آزمونی ثبت نشده</td></tr>`}</table></div></div>`;
}

// سیستم نویز سفید در تایمر
window.audioSounds = window.audioSounds || {
    rain: new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3"),
    cafe: new Audio("https://cdn.pixabay.com/download/audio/2022/02/07/audio_6772714aeb.mp3"),
    lofi: new Audio("https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3")
};
Object.values(window.audioSounds).forEach(a => a.loop = true);

let timer={mode:"countdown",sec:1500,running:false,interval:null,lastElapsed:0};
function clock(s){s=Math.max(0,Math.floor(s));return `${pad(Math.floor(s/3600))}:${pad(Math.floor(s%3600/60))}:${pad(s%60)}`}
function timerPage(){return `<div class="card timer-card"><div class="mode"><button class="${timer.mode==="countdown"?"active":""}" data-mode="countdown">⏳ شمارش معکوس</button><button class="${timer.mode==="stopwatch"?"active":""}" data-mode="stopwatch">⏱️ کرنومتر</button></div><div class="timer" id="td">${clock(timer.sec)}</div><div class="timer-set"><label>ساعت<input id="th" type="number" min="0" value="${Math.floor(timer.sec/3600)}"></label><label>دقیقه<input id="tm" type="number" min="0" max="59" value="${Math.floor(timer.sec%3600/60)}"></label><label>ثانیه<input id="ts" type="number" min="0" max="59" value="${timer.sec%60}"></label><button class="btn cyan" id="applyTime">تنظیم زمان</button></div><div class="timer-actions"><button class="bigbtn" id="start">${timer.running?"توقف":"شروع"}</button><button class="btn" id="reset">بازنشانی</button></div>
<div class="sound-bar">
  <button class="sound-btn ${!window.audioSounds.rain.paused?'playing':''}" data-sound="rain">🌧️ صدای باران</button>
  <button class="sound-btn ${!window.audioSounds.cafe.paused?'playing':''}" data-sound="cafe">☕ صدای کافه</button>
  <button class="sound-btn ${!window.audioSounds.lofi.paused?'playing':''}" data-sound="lofi">🎧 موسیقی Lofi</button>
</div>
<div class="section-title"><h2>💾 ثبت زمان تایمر</h2></div><div class="grid g2"><select id="tSub">${state.subjects.map(s=>`<option>${s.name}</option>`).join("")}</select><input id="tTopic" class="form" placeholder="مبحث (اختیاری)"></div><div style="margin-top:10px"><button class="btn success" id="saveTimer">ثبت زمان سپری‌شده به عنوان مطالعه</button></div></div>`}

function goals(){return `
<div class="grid g2">
  <div>
    <div class="section-title" style="margin-top:0"><h2>🎯 اهداف خاص</h2><button class="btn primary" id="addGoal">+ هدف جدید</button></div>
    ${state.goals.length?state.goals.sort((a,b)=>b.date.localeCompare(a.date)).map(g=>`<div class="card goal-item ${g.done?'done':''}" style="display:block;margin-bottom:12px"><div class="top"><div><b>${g.title}</b><div class="mini">${g.value||""} • تاریخ: ${g.date}</div></div><button class="btn danger dg" data-id="${g.id}">حذف</button></div></div>`).join(""):`<div class="card empty">هدفی ثبت نشده.</div>`}
  </div>
  <div>
    <div class="section-title" style="margin-top:0"><h2>🔔 یادآوری‌ها</h2><button class="btn cyan" id="addReminder">+ یادآوری جدید</button></div>
    ${state.reminders.length?state.reminders.sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<div class="card goal-item" style="display:block;margin-bottom:12px"><div class="top"><div><b>${r.text}</b><div class="mini">تاریخ: ${r.date}</div></div><button class="btn danger dr" data-id="${r.id}">حذف</button></div></div>`).join(""):`<div class="card empty">یادآوری ثبت نشده.</div>`}
  </div>
</div>`}

function settings(){return `<div class="grid g2"><div class="card"><div class="section-title" style="margin-top:0"><h2>⚙️ تنظیمات مطالعه</h2></div><form id="setf" class="form"><div class="grid g2"><label>هدف مطالعه روزانه<input name="hours" type="number" min="0" step=".5" value="${state.targetHours}"></label><label>هدف تست روزانه<input name="tests" type="number" min="0" value="${state.targetTests}"></label></div><button class="btn primary">ذخیره تنظیمات</button></form></div><div class="card"><div class="section-title" style="margin-top:0"><h2>🎨 ظاهر</h2></div><div class="switch"><label>حالت تیره</label><input type="checkbox" checked disabled></div><div class="switch" style="margin-top:10px"><label>فونت بزرگ‌تر</label><input id="largeFont" type="checkbox" ${state.compact?"":"checked"}></div></div></div>
<div class="section-title"><h2>💾 پشتیبان و اطلاعات</h2></div><div class="card"><div class="row"><button class="btn cyan" id="export">📤 خروجی پشتیبان</button><label class="btn">📥 وارد کردن پشتیبان<input id="import" type="file" accept=".json" style="display:none"></label><button class="btn danger" id="reset">🗑️ پاک کردن همه داده‌ها</button></div><div class="notice" style="margin-top:14px">پیشنهاد: هر چند وقت یک‌بار از اطلاعاتت خروجی بگیر و فایل پشتیبان را نگه دار.</div></div>`}

const pages={dashboard:dash,today,days,subjects,stats,exams:examsPage,timer:timerPage,goals,settings};
function render(page="dashboard"){document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===page));let titles={dashboard:"داشبورد",today:"امروز",days:"گزارش روزها",subjects:"درس‌ها",stats:"آمار و نمودار",exams:"آزمون‌ها",timer:"تایمر مطالعه",goals:"اهداف و یادآوری",settings:"تنظیمات"};document.getElementById("pageTitle").textContent=titles[page];document.getElementById("todayLabel").textContent=faDate();document.getElementById("content").innerHTML=pages[page]();wire(page)}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>render(b.dataset.page));

function wire(page){
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>render(b.dataset.go));
if(page==="dashboard"){
    document.querySelectorAll(".goal-check").forEach(cb=>cb.onchange=e=>{
        let g = state.goals.find(x=>x.id==e.target.dataset.id);
        if(g){ g.done = e.target.checked; save(); render("dashboard"); }
    });
}
if(page==="today"){
document.getElementById("sf").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);state.sessions.push({id:Date.now(),date:key(),subject:f.get("subject"),topic:f.get("topic"),minutes:+f.get("minutes"),type:f.get("type"),note:f.get("note")});save();toast("جلسه مطالعه ثبت شد");render("today")};
document.getElementById("tf").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);state.tests.push({id:Date.now(),date:key(),subject:f.get("subject"),topic:f.get("topic"),count:+f.get("count"),correct:+f.get("correct"),wrong:+f.get("wrong"),blank:+f.get("blank"),time:+f.get("time")});save();toast("تست‌ها ثبت شدند");render("today")};
document.getElementById("df").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);state.days[key()]={energy:+f.get("energy"),focus:+f.get("focus"),status:f.get("status"),note:f.get("note")};save();toast("گزارش روز ذخیره شد");render("today")};
document.querySelectorAll(".ds").forEach(b=>b.onclick=()=>{state.sessions=state.sessions.filter(x=>x.id!=b.dataset.id);save();render("today")})}
if(page==="days"){
    document.querySelectorAll(".page-btn").forEach(b=>b.onclick=()=>{window.daysPage = +b.dataset.pagebtn; render("days");});
    // ادیت روزها
    document.querySelectorAll("[data-editday]").forEach(b=>b.onclick=()=>{
        let dateK = b.dataset.editday;
        let daySessions = state.sessions.filter(x=>x.date===dateK);
        showModal(`ویرایش جلسات روز: ${dateK}`, `
            <div style="margin-bottom:15px; font-size:12px; color:var(--muted)">برای ویرایش این روز، می‌توانید جلسات اشتباه را حذف کرده و از فرم زیر جلسه جدیدی با تاریخ همین روز ثبت کنید.</div>
            <div class="card" style="padding:10px; margin-bottom:15px; background:var(--bg)">${sessionTable(daySessions)}</div>
            <div class="section-title" style="margin-top:0"><h2>افزودن جلسه به این تاریخ</h2></div>
            <div class="form">
                <select id="emSub">${state.subjects.map(s=>`<option>${s.name}</option>`).join("")}</select>
                <input id="emMin" type="number" placeholder="مدت زمان (دقیقه)">
                <button class="btn primary" id="emSave">اضافه کردن</button>
            </div>
        `);
        // دکمه حذف داخل مدال
        document.getElementById("modal").querySelectorAll(".ds").forEach(db=>db.onclick=()=>{
            state.sessions=state.sessions.filter(x=>x.id!=db.dataset.id); save(); toast("حذف شد"); document.getElementById("modal").classList.add("hidden"); render("days");
        });
        document.getElementById("emSave").onclick=()=>{
            let m = +document.getElementById("emMin").value;
            if(!m) return toast("زمان وارد نشده!");
            state.sessions.push({id:Date.now(), date:dateK, subject:document.getElementById("emSub").value, minutes:m, type:"دستی"});
            save(); toast("اضافه شد"); document.getElementById("modal").classList.add("hidden"); render("days");
        };
    });
}
if(page==="subjects"){document.getElementById("addSub").onclick=()=>showModal("افزودن درس",`<div class="form"><label>نام درس<input id="newSub"></label></div>`,()=>{let n=document.getElementById("newSub")?.value.trim();if(n){state.subjects.push({name:n});save();toast("درس اضافه شد");render("subjects")}})}
if(page==="exams"){
    document.getElementById("examForm").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);
        state.exams.push({id:Date.now(), date:f.get("date"), taraz:+f.get("taraz"), rank:f.get("rank"), note:f.get("note")});
        save(); toast("آزمون ثبت شد"); render("exams");
    };
    document.querySelectorAll(".de").forEach(b=>b.onclick=()=>{state.exams=state.exams.filter(x=>x.id!=b.dataset.id);save();render("exams");})
}
if(page==="goals"){
    document.getElementById("addGoal").onclick=()=>showModal("افزودن هدف",`<div class="form"><label>تاریخ هدف<input id="gd" type="date" value="${key()}"></label><label>عنوان هدف<input id="gt"></label><label>توضیح/مقدار<input id="gv"></label></div>`,()=>{let t=document.getElementById("gt")?.value.trim();if(t){state.goals.push({id:Date.now(),date:document.getElementById("gd").value,title:t,value:document.getElementById("gv")?.value||"",done:false});save();render("goals")}});
    document.getElementById("addReminder").onclick=()=>showModal("افزودن یادآوری",`<div class="form"><label>تاریخ یادآوری<input id="rd" type="date" value="${key()}"></label><label>متن یادآوری<input id="rt"></label></div>`,()=>{let t=document.getElementById("rt")?.value.trim();if(t){state.reminders.push({id:Date.now(),date:document.getElementById("rd").value,text:t});save();render("goals")}});
    document.querySelectorAll(".dg").forEach(b=>b.onclick=()=>{state.goals=state.goals.filter(g=>g.id!=b.dataset.id);save();render("goals")})
    document.querySelectorAll(".dr").forEach(b=>b.onclick=()=>{state.reminders=state.reminders.filter(r=>r.id!=b.dataset.id);save();render("goals")})
}
if(page==="timer"){
    document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{clearInterval(timer.interval);timer.running=false;timer.mode=b.dataset.mode;timer.sec=b.dataset.mode==="countdown"?1500:0;render("timer")});
    document.getElementById("applyTime").onclick=()=>{let h=+document.getElementById("th").value||0,m=+document.getElementById("tm").value||0,s=+document.getElementById("ts").value||0;timer.sec=h*3600+m*60+s;toast("زمان تنظیم شد");document.getElementById("td").textContent=clock(timer.sec)};
    document.getElementById("start").onclick=()=>{if(timer.running){clearInterval(timer.interval);timer.running=false;timer.lastElapsed=timer.mode==="stopwatch"?timer.sec:timer.sec?timer.lastElapsed:0;toast("تایمر متوقف شد");render("timer")}else{timer.running=true;timer.lastStart=Date.now();timer.interval=setInterval(()=>{timer.mode==="stopwatch"?timer.sec++:timer.sec--;if(timer.mode==="countdown"&&timer.sec<=0){timer.sec=0;clearInterval(timer.interval);timer.running=false;timer.lastElapsed=timer.lastStart?Math.round((Date.now()-timer.lastStart)/1000):0;toast("⏰ زمان تمام شد");}let e=document.getElementById("td");if(e)e.textContent=clock(timer.sec)},1000);render("timer")}};
    document.getElementById("reset").onclick=()=>{clearInterval(timer.interval);timer.running=false;timer.sec=timer.mode==="countdown"?1500:0;timer.lastElapsed=0;render("timer")};
    document.getElementById("saveTimer").onclick=()=>{let sec=timer.mode==="stopwatch"?timer.sec:(timer.lastElapsed||0);let m=Math.floor(sec/60);if(m<1){toast("حداقل یک دقیقه برای ثبت لازم است");return}state.sessions.push({id:Date.now(),date:key(),subject:document.getElementById("tSub").value,topic:document.getElementById("tTopic").value,minutes:m,type:"مطالعه با تایمر",note:"ثبت‌شده از تایمر"});save();timer.lastElapsed=0;toast(`${m} دقیقه مطالعه ثبت شد`);render("timer")}
    
    // کدهای نویز سفید
    document.querySelectorAll(".sound-btn").forEach(b=>b.onclick=()=>{
        let s = b.dataset.sound;
        if(window.audioSounds[s].paused) {
            window.audioSounds[s].play();
            b.classList.add("playing");
        } else {
            window.audioSounds[s].pause();
            b.classList.remove("playing");
        }
    });
}
if(page==="settings"){document.getElementById("setf").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);state.targetHours=+f.get("hours");state.targetTests=+f.get("tests");save();toast("تنظیمات ذخیره شد");render("settings")};document.getElementById("largeFont").onchange=e=>{state.compact=!e.target.checked;document.body.style.fontSize=state.compact?"13px":"14px";save()};document.getElementById("export").onclick=()=>{let blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="konkur-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};document.getElementById("import").onchange=e=>{let file=e.target.files[0];if(!file)return;let r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();toast("پشتیبان وارد شد");render("dashboard")}catch{toast("فایل پشتیبان معتبر نیست")}};r.readAsText(file)};document.getElementById("reset").onclick=()=>{if(confirm("همه اطلاعات برای همیشه پاک شود؟")){localStorage.removeItem(KEY);location.reload()}}}}
render();