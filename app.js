const KEY="konkur_tracker_v2";
const USER_NAME = "ابوالفضل"; 

const defaults=["ریاضی","فیزیک","شیمی","هندسه","ادبیات","دینی","زبان","عربی"];
let state=JSON.parse(localStorage.getItem(KEY)||"null")||{
 targetHours:8, targetTests:80, theme:"dark", compact:false,
 startDate: key(new Date()), // تاریخ شروع استفاده از برنامه برای ایجاد لیست روزها
 subjects:defaults.map(name=>({name})), days:{}, sessions:[], tests:[], goals:[],
 exams:[], reminders:[] 
};
if(!state.startDate) state.startDate = key(new Date());

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

function getXP(){ let a=all(); return Math.floor(a.m/6) + Math.floor(a.t/2); }
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
let todayGoals = state.goals.filter(g => g.date === k || (g.recurring && !g.doneDate?.includes(k)));
return `
<div class="grid g3">
  <div class="card" style="grid-column: 1 / -1; background:linear-gradient(135deg,#1b2037,#26204b);border-color:#6658bd55;padding:18px 22px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
    <div style="font-size:32px;">👋</div>
    <div>
      <div style="font-size:18px;font-weight:800;">خوش اومدی <span style="color:var(--cyan);">${USER_NAME}</span> جان!</div>
      <div class="muted" style="margin-top:3px;">امروز هم یک قدم به موفقیت در مسیر کنکور نزدیک‌تر شو.</div>
    </div>
  </div>
</div>

<div class="grid g4" style="margin-top:16px;">
<div class="card stat"><div class="ico">⏱️</div><div class="label">مطالعه کل</div><div class="num">${fmt(a.m)}</div><div class="sub">${days_count} روز مطالعه</div></div>
<div class="card stat"><div class="ico">📝</div><div class="label">تست کل</div><div class="num">${a.t}</div><div class="sub">${a.rate}% پاسخ صحیح</div></div>
<div class="card stat"><div class="ico">🔥</div><div class="label">Streak</div><div class="num">${streak()}</div><div class="sub">روز متوالی</div></div>
<div class="card stat" style="text-align:center;"><div class="label" style="margin-top:0">سطح شما</div><div class="num" style="color:var(--orange)">Lvl ${getLevel()}</div><div class="sub">${getXP()} XP کسب شده</div></div>
</div>

<div class="grid g2" style="margin-top:16px;">
  <div class="card hero"><div class="hero-row"><div><div class="muted">⏳ شمارش معکوس کنکور</div><div class="count">${remain()} روز</div><div class="muted">۱۰ تیر ۱۴۰۶</div></div><div class="ring" style="--p:${Math.max(2,prog)}%" data-text="${prog}%"></div></div><div style="margin-top:18px;position:relative;z-index:1"><div class="muted">پیشرفت زمانی مسیر</div><div class="progress" style="margin-top:8px"><i style="width:${prog}%"></i></div></div></div>
  <div class="card">
    <div class="section-title" style="margin-top:0"><h2>🔔 یادآوری و اهداف امروز</h2></div>
    ${todayReminders.length?todayReminders.map(r=>`<div class="reminder-item">⏰ <b>یادآوری:</b> ${r.text}</div>`).join(""):''}
    ${todayGoals.length?todayGoals.map(g=>`<div class="goal-item ${g.done?'done':''}"><div><b>${g.title}</b> ${g.recurring?'<span class="pomodoro-badge">تکرارشونده</span>':''}<div class="muted" style="font-size:10px">${g.value||''}</div></div><input type="checkbox" class="goal-check" data-id="${g.id}" ${g.done?'checked':''}></div>`).join(""):''}
    ${(!todayReminders.length && !todayGoals.length) ? '<div class="empty">برای امروز هدف یا یادآوری ثبت نشده.</div>':''}
  </div>
</div>

<div class="section-title"><h2>☀️ وضعیت امروز</h2><button class="btn primary" data-go="today">+ ثبت مطالعه / تست</button></div>
<div class="grid g4">
<div class="card"><div class="label">هدف مطالعه</div><div class="kpi">${state.targetHours} ساعت</div><div class="mini">واقعی: ${fmt(tm)}</div><div class="progress" style="margin-top:11px"><i style="width:${pct(tm,state.targetHours*60)}%"></i></div></div>
<div class="card"><div class="label">هدف تست</div><div class="kpi">${state.targetTests}</div><div class="mini">واقعی: ${tt}</div><div class="progress" style="margin-top:11px"><i style="width:${pct(tt,state.targetTests)}%"></i></div></div>
<div class="card"><div class="label">تحقق امروز</div><div class="kpi">${done}%</div><div class="mini">مطالعه + تست</div></div>
<div class="card"><div class="label">تاریخ امروز</div><div class="kpi" style="font-size:16px">${faDate()}</div><div class="mini">شروع مسیر: ${state.startDate}</div></div>
</div>`}

function today(){let k=key(),tm=mins(k),tt=tests(k),d=state.days[k]||{};return `
<div class="grid g3"><div class="card"><div class="label">مطالعه امروز</div><div class="num">${fmt(tm)}</div><div class="mini">هدف: ${state.targetHours} ساعت</div></div><div class="card"><div class="label">تست امروز</div><div class="num">${tt}</div><div class="mini">هدف: ${state.targetTests}</div></div><div class="card"><div class="label">تحقق امروز</div><div class="num">${Math.round((pct(tm,state.targetHours*60)+pct(tt,state.targetTests))/2)}%</div></div></div>
<div class="section-title"><h2>➕ ثبت جلسه مطالعه</h2></div><div class="card"><form id="sf" class="form"><div class="grid g3"><label>درس<select name="subject">${state.subjects.map(s=>`<option>${s.name}</option>`).join("")}</select></label><label>مبحث<input name="topic" placeholder="مثلاً مشتق"></label><label>مدت (دقیقه)<input name="minutes" type="number" min="1" required value="60"></label></div><div class="grid g2"><label>نوع فعالیت<select name="type"><option>آموزش</option><option>تست</option><option>مرور</option><option>جمع‌بندی</option><option>رفع اشکال</option></select></label><label>توضیحات<input name="note" placeholder="اختیاری"></label></div><button class="btn primary">ثبت جلسه</button></form></div>
<div class="section-title"><h2>📝 ثبت تست</h2></div><div class="card"><form id="tf" class="form"><div class="grid g4"><label>درس<select name="subject">${state.subjects.map(s=>`<option>${s.name}</option>`).join("")}</select></label><label>مبحث<input name="topic"></label><label>تعداد<input name="count" type="number" min="1" required value="20"></label><label>منبع تست<input name="source" placeholder="گاج، خیلی‌سبز..."></label></div><div class="grid g4"><label>درست<input name="correct" type="number" min="0" required value="0"></label><label>غلط<input name="wrong" type="number" min="0" value="0"></label><label>نزده<input name="blank" type="number" min="0" value="0"></label><label>تست‌های مارک‌دار<input name="marked" type="number" min="0" value="0" placeholder="مهم و سخت"></label></div><button class="btn primary">ثبت تست</button></form></div>
<div class="section-title"><h2>📋 گزارش و ارزیابی روز</h2></div><div class="card"><form id="df" class="form"><div class="grid g3"><label>انرژی (۱–۵)<input name="energy" type="number" min="1" max="5" value="${d.energy||3}"></label><label>تمرکز (۱–۵)<input name="focus" type="number" min="1" max="5" value="${d.focus||3}"></label><label>وضعیت روز<select name="status">${["عالی","خوب","متوسط","ضعیف"].map(x=>`<option ${d.status===x?"selected":""}>${x}</option>`).join("")}</select></label></div><label>گزارش و افکار<textarea name="note" rows="3">${d.note||""}</textarea></label><button class="btn primary">ذخیره گزارش</button></form></div>
<div class="section-title"><h2>🕘 جلسات ثبت‌شده امروز</h2></div><div class="card">${sessionTable(state.sessions.filter(x=>x.date===k))}</div>
<div class="section-title"><h2>📝 تست‌های ثبت‌شده امروز</h2></div><div class="card">${testTable(state.tests.filter(x=>x.date===k))}</div>`}

function sessionTable(rows){if(!rows.length)return `<div class="empty">جلسه‌ای برای این روز ثبت نشده.</div>`;return `<div class="table-wrap"><table class="table"><tr><th>درس</th><th>مبحث</th><th>نوع</th><th>مدت</th><th>عملیات</th></tr>${rows.map(x=>`<tr><td>${x.subject}</td><td>${x.topic||"—"}</td><td><span class="pill">${x.type}</span></td><td>${fmt(x.minutes)}</td><td><button class="btn danger ds" data-id="${x.id}">حذف</button></td></tr>`).join("")}</table></div>`}
function testTable(rows){if(!rows.length)return `<div class="empty">تستی برای این روز ثبت نشده.</div>`;return `<div class="table-wrap"><table class="table"><tr><th>درس</th><th>مبحث/منبع</th><th>تعداد</th><th>صحیح/غلط/نزده</th><th>مارک‌دار</th><th>عملیات</th></tr>${rows.map(x=>`<tr><td>${x.subject}</td><td>${x.topic||"—"} <br><small class="muted">${x.source||""}</small></td><td>${x.count}</td><td><span class="good">${x.correct||0}</span> / <span class="bad">${x.wrong||0}</span> / <span class="neutral">${x.blank||0}</span></td><td>${x.marked||0}</td><td><button class="btn danger dt" data-id="${x.id}">حذف</button></td></tr>`).join("")}</table></div>`}

window.daysPage = window.daysPage || 1;
function getDaysList() {
    let startD = new Date(state.startDate);
    let todayD = new Date();
    let keys = new Set([...state.sessions.map(x=>x.date), ...state.tests.map(x=>x.date), ...Object.keys(state.days)]);
    for(let d = new Date(startD); d <= todayD; d.setDate(d.getDate() + 1)) {
        keys.add(key(d));
    }
    return Array.from(keys).sort((a,b)=>b.localeCompare(a));
}
function days(){
    let allKeys = getDaysList();
    let totalPages = Math.ceil(allKeys.length / 10) || 1;
    let pagedKeys = allKeys.slice((window.daysPage-1)*10, window.daysPage*10);
    
    let rows = pagedKeys.map(k => {
        let d = new Date(k);
        return {d, k, m:mins(k), t:tests(k), info:state.days[k]||{}};
    });

    let pagHtml = `<div class="pagination">` + Array.from({length:totalPages}, (_,i)=>`<button class="page-btn ${window.daysPage===i+1?'active':''}" data-pagebtn="${i+1}">${i+1}</button>`).join("") + `</div>`;

    return `<div class="notice">تمامی روزها از تاریخ شروع در اینجا لیست می‌شوند حتی اگر خالی باشند. با استفاده از دکمه ویرایش (✏️) می‌توانی برای روزهای گذشته ساعت مطالعه و تست اضافه کنی.</div><div class="section-title"><h2>📅 گزارش روزانه (صفحه ${window.daysPage} از ${totalPages})</h2></div><div class="card"><div class="table-wrap"><table class="table"><tr><th>تاریخ</th><th>مطالعه</th><th>تست</th><th>تحقق</th><th>وضعیت</th><th>ویرایش گسترده</th></tr>${rows.map(r=>`<tr><td>${new Intl.DateTimeFormat("fa-IR",{weekday:"short",year:"numeric",month:"numeric",day:"numeric"}).format(r.d)} <br><small class="muted">${r.k}</small></td><td>${fmt(r.m)}</td><td>${r.t}</td><td>${Math.round((pct(r.m,state.targetHours*60)+pct(r.t,state.targetTests))/2)}%</td><td>${r.info.status||"—"}</td><td><button class="edit-btn" data-editday="${r.k}">✏️ افزودن/ویرایش دیتا</button></td></tr>`).join("")}</table></div>${pagHtml}</div>`}

function getPieChart() {
    let total = all().m;
    if(total===0) return '<div class="empty">دیتای مطالعه برای رسم نمودار کافی نیست.</div>';
    let colors = ['var(--accent)','var(--cyan)','var(--green)','var(--orange)','var(--red)','#8a7cf8','#f472b6','#a78bfa'];
    let acc = 0;
    let legends = [];
    let bg = state.subjects.map((s, i) => {
        let m = subStat(s.name).m;
        let pct = m/total*100;
        if(pct===0) return '';
        let color = colors[i%colors.length];
        let str = `${color} ${acc}% ${acc+pct}%`;
        acc += pct; 
        legends.push(`<div class="pie-item"><div class="pie-color" style="background:${color}"></div>${s.name} (${Math.round(pct)}%)</div>`);
        return str;
    }).filter(Boolean).join(',');
    
    return `<div class="pie-chart" style="background:conic-gradient(${bg})"></div><div class="pie-legend">${legends.join('')}</div>`;
}

function subjects(){
    let specNames = ["ریاضی","فیزیک","شیمی","هندسه","زیست","حسابان"];
    let specialized = state.subjects.filter(s=>specNames.includes(s.name));
    let general = state.subjects.filter(s=>!specNames.includes(s.name));
    let group=(title,arr,mark)=>!arr.length ? "" : `<div class="subject-group"><div class="group-title"><i class="mark"></i><h3>${title}</h3></div><div class="subject-grid">${arr.map(s=>{let x=subStat(s.name);return `<div class="card subject-card"><div class="subject-top"><div><div class="subject-name">${s.name}</div><div class="subject-stats">${fmt(x.m)} مطالعه<br>${x.t} تست • ${x.rate}% صحیح</div></div><div class="subject-icon">${mark}</div></div><div><div class="progress"><i style="width:${x.rate}%"></i></div><div class="mini">درصد عملکرد تست</div></div></div>`}).join("")}</div></div>`;
    return `<div class="section-title"><h2>📚 درس‌ها</h2><button class="btn primary" id="addSub">+ افزودن درس جدید</button></div>${group("دروس اختصاصی", specialized, "📐")}${group("دروس عمومی و سایر", general, "📖")}`;
}

function stats(){
    let a=all();
    let bgs = getBadges();
    return `<div class="grid g4"><div class="card stat"><div class="label">مطالعه کل</div><div class="num">${fmt(a.m)}</div></div><div class="card stat"><div class="label">تست کل</div><div class="num">${a.t}</div></div><div class="card stat"><div class="label">درصد صحیح</div><div class="num">${a.rate}%</div></div><div class="card stat"><div class="label">روزهای متوالی</div><div class="num">${streak()}</div></div></div>
    
    <div class="section-title"><h2>🏆 مدال‌ها و افتخارات شما</h2></div>
    <div class="badge-list">${bgs.length?bgs.map(b=>`<div class="badge"><div class="badge-icon">${b.i}</div><div class="badge-info"><b>${b.n}</b>${b.d}</div></div>`).join(""):`<div class="empty">هنوز مدالی دریافت نکرده‌اید. با مطالعه بیشتر مدال بگیرید!</div>`}</div>

    <div class="section-title"><h2>🟩 هیت‌مپ مطالعه در ۱۴۰ روز اخیر</h2></div><div class="card">${heatmap()}</div>
    
    <div class="grid g2" style="margin-top:20px;">
        <div><div class="section-title" style="margin-top:0"><h2>📈 روند ۱۴ روز اخیر</h2></div><div class="card">${chart(14)}</div></div>
        <div><div class="section-title" style="margin-top:0"><h2>🍕 توزیع زمان مطالعه دروس</h2></div><div class="card" style="height:310px; display:flex; flex-direction:column; justify-content:center;">${getPieChart()}</div></div>
    </div>
    
    <div class="section-title"><h2>📚 مقایسه درس‌ها</h2></div><div class="card"><div class="table-wrap"><table class="table"><tr><th>درس</th><th>مطالعه</th><th>تست</th><th>درصد صحیح</th></tr>${state.subjects.map(s=>{let x=subStat(s.name);return `<tr><td>${s.name}</td><td>${fmt(x.m)}</td><td>${x.t}</td><td class="${x.rate>=70?"good":x.rate<40?"bad":"neutral"}">${x.rate}%</td></tr>`}).join("")}</table></div></div>`
}

function examsPage(){
    return `<div class="section-title"><h2>📝 آزمون‌های آزمایشی (ماز، قلم‌چی، و ...)</h2></div>
    <div class="card"><form id="examForm" class="form">
      <div class="grid g4"><label>تاریخ آزمون<input type="date" name="date" required value="${key()}"></label><label>تراز کل<input type="number" name="taraz" required></label><label>رتبه<input type="number" name="rank"></label><label>توضیحات (اختیاری)<input name="note" placeholder="مثلا: مرحله ۵ ماز"></label></div>
      <div class="notice" style="margin:5px 0">ثبت درصدهای تک‌تک دروس برای نمودار پیشرفت (اختیاری):</div>
      <div class="grid g4" style="background:#0e131e; padding:15px; border-radius:10px; border:1px solid #293247;">
        ${state.subjects.map(s=>`<label>${s.name} (%)<input type="number" name="p_${s.name}" min="-34" max="100"></label>`).join("")}
      </div>
      <button class="btn primary">ثبت آزمون جامع</button>
    </form></div>
    <div class="section-title"><h2>📊 سوابق و درصدهای آزمون‌ها</h2></div>
    <div class="card"><div class="table-wrap"><table class="table"><tr><th>تاریخ</th><th>تراز</th><th>رتبه</th><th>توضیحات</th><th>عملیات</th></tr>${state.exams.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>`<tr><td>${e.date}</td><td style="color:var(--cyan);font-weight:bold">${e.taraz}</td><td>${e.rank||"-"}</td><td>${e.note||"-"}</td><td><button class="btn warning view-exam" data-id="${e.id}">👀 مشاهده درصدها</button> <button class="btn danger de" data-id="${e.id}">حذف</button></td></tr>`).join("")||`<tr><td colspan="5" class="empty">آزمونی ثبت نشده</td></tr>`}</table></div></div>`;
}

window.audioSounds = window.audioSounds || {
    rain: new Audio("https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3"),
    cafe: new Audio("https://cdn.pixabay.com/download/audio/2022/02/07/audio_6772714aeb.mp3"),
    lofi: new Audio("https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3")
};
Object.values(window.audioSounds).forEach(a => a.loop = true);

let timer={mode:"countdown",sec:1500,running:false,isPaused:false,interval:null,lastElapsed:0, pomodoroCount:0};
function clock(s){s=Math.max(0,Math.floor(s));return `${pad(Math.floor(s/3600))}:${pad(Math.floor(s%3600/60))}:${pad(s%60)}`}
function timerPage(){return `
<div class="card timer-card">
<div class="mode">
  <button class="${timer.mode==="countdown"?"active":""}" data-mode="countdown">⏳ شمارش معکوس</button>
  <button class="${timer.mode==="pomodoro"?"active":""}" data-mode="pomodoro">🍅 تکنیک پومودورو</button>
  <button class="${timer.mode==="stopwatch"?"active":""}" data-mode="stopwatch">⏱️ کرنومتر آزاد</button>
</div>
${timer.mode==="pomodoro"?`<div class="muted" style="margin-bottom:10px;">هر پومودورو شامل ۲۵ دقیقه مطالعه و ۵ دقیقه استراحت است. (پومودوروهای تکمیل شده: ${timer.pomodoroCount})</div>`:''}
<div class="timer" id="td" style="${timer.isPaused?'opacity:0.5':''}">${clock(timer.sec)}</div>
${timer.mode==="countdown"?`
<div class="timer-set"><label>ساعت<input id="th" type="number" min="0" value="${Math.floor(timer.sec/3600)}"></label><label>دقیقه<input id="tm" type="number" min="0" max="59" value="${Math.floor(timer.sec%3600/60)}"></label><label>ثانیه<input id="ts" type="number" min="0" max="59" value="${timer.sec%60}"></label><button class="btn cyan" id="applyTime">تنظیم زمان</button></div>
`:''}
<div class="timer-actions">
  <button class="bigbtn" id="start">${timer.running?"توقف کامل":(timer.isPaused?"ادامه":"شروع تایمر")}</button>
  ${timer.running && !timer.isPaused ? `<button class="btn warning" id="pauseBtn">⏸️ مکث (Pause)</button>` : ''}
  <button class="btn" id="reset">بازنشانی / رها کردن</button>
</div>
<div class="sound-bar">
  <button class="sound-btn ${!window.audioSounds.rain.paused?'playing':''}" data-sound="rain">🌧️ صدای باران</button>
  <button class="sound-btn ${!window.audioSounds.cafe.paused?'playing':''}" data-sound="cafe">☕ صدای کافه</button>
  <button class="sound-btn ${!window.audioSounds.lofi.paused?'playing':''}" data-sound="lofi">🎧 موسیقی Lofi</button>
</div>
<div class="section-title"><h2>💾 ثبت زمان تایمر به عنوان جلسه</h2></div><div class="grid g2"><select id="tSub">${state.subjects.map(s=>`<option>${s.name}</option>`).join("")}</select><input id="tTopic" class="form" placeholder="مبحث (اختیاری)"></div><div style="margin-top:10px"><button class="btn success" id="saveTimer">ثبت مجموع زمان سپری‌شده (مطالعه)</button></div></div>`}

function goals(){return `
<div class="grid g2">
  <div>
    <div class="section-title" style="margin-top:0"><h2>🎯 اهداف و برنامه‌ها</h2><button class="btn primary" id="addGoal">+ هدف جدید</button></div>
    ${state.goals.length?state.goals.sort((a,b)=>b.date.localeCompare(a.date)).map(g=>`<div class="card goal-item ${g.done?'done':''}" style="display:block;margin-bottom:12px"><div class="top"><div><b>${g.title}</b> ${g.recurring?'<span class="pomodoro-badge">تکرارشونده روزانه</span>':''}<div class="mini">${g.value||""} • تاریخ: ${g.date}</div></div><button class="btn danger dg" data-id="${g.id}">حذف</button></div></div>`).join(""):`<div class="card empty">هدفی ثبت نشده.</div>`}
  </div>
  <div>
    <div class="section-title" style="margin-top:0"><h2>🔔 یادآوری‌ها</h2><button class="btn cyan" id="addReminder">+ یادآوری جدید</button></div>
    ${state.reminders.length?state.reminders.sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<div class="card goal-item" style="display:block;margin-bottom:12px"><div class="top"><div><b>${r.text}</b><div class="mini">تاریخ: ${r.date}</div></div><button class="btn danger dr" data-id="${r.id}">حذف</button></div></div>`).join(""):`<div class="card empty">یادآوری ثبت نشده.</div>`}
  </div>
</div>`}

function settings(){return `<div class="grid g2"><div class="card"><div class="section-title" style="margin-top:0"><h2>⚙️ تنظیمات مطالعه</h2></div><form id="setf" class="form"><div class="grid g2"><label>هدف مطالعه روزانه (ساعت)<input name="hours" type="number" min="0" step=".5" value="${state.targetHours}"></label><label>هدف تست روزانه<input name="tests" type="number" min="0" value="${state.targetTests}"></label></div><button class="btn primary">ذخیره تنظیمات</button></form></div><div class="card"><div class="section-title" style="margin-top:0"><h2>🎨 ظاهر و امنیت</h2></div><div class="switch"><label>رمز ورود به برنامه</label><input type="password" id="appPassword" value="${localStorage.getItem("sfx_pass")||"9999"}" style="width:100px;background:#0e131e;color:#fff;border:1px solid #293247;border-radius:6px;padding:5px;text-align:center;"><button class="btn cyan" id="savePass" style="padding:6px 10px;">ذخیره رمز</button></div><div class="switch" style="margin-top:10px"><label>فونت بزرگ‌تر</label><input id="largeFont" type="checkbox" ${state.compact?"":"checked"}></div></div></div>
<div class="section-title"><h2>💾 پشتیبان و اطلاعات</h2></div><div class="card"><div class="row"><button class="btn cyan" id="export">📤 خروجی پشتیبان (Backup)</button><label class="btn">📥 وارد کردن پشتیبان<input id="import" type="file" accept=".json" style="display:none"></label><button class="btn danger" id="reset">🗑️ پاک کردن همه داده‌ها</button></div><div class="notice" style="margin-top:14px">پیشنهاد: حداقل هفته‌ای یک‌بار از اطلاعاتت خروجی بگیر (Export) تا در صورت پاک شدن هیستوری مرورگر، دیتای کنکورت از بین نرود. این فایل را در کامپیوتر یا تلگرامت نگه دار.</div></div>`}

const pages={dashboard:dash,today,days,subjects,stats,exams:examsPage,timer:timerPage,goals,settings};
function render(page="dashboard"){document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===page));let titles={dashboard:"داشبورد",today:"امروز",days:"گزارش روزها",subjects:"درس‌ها",stats:"آمار و نمودار",exams:"آزمون‌ها",timer:"تایمر مطالعه",goals:"اهداف و یادآوری",settings:"تنظیمات"};document.getElementById("pageTitle").textContent=titles[page];document.getElementById("todayLabel").textContent=faDate();document.getElementById("content").innerHTML=pages[page]();wire(page); document.getElementById('sidebar').classList.remove('open');}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>render(b.dataset.page));

function wire(page){
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>render(b.dataset.go));
if(page==="dashboard"){
    document.querySelectorAll(".goal-check").forEach(cb=>cb.onchange=e=>{
        let g = state.goals.find(x=>x.id==e.target.dataset.id);
        if(g){ 
            g.done = e.target.checked; 
            if(g.recurring) { g.doneDate = g.doneDate || []; g.doneDate.push(key()); }
            save(); render("dashboard"); 
        }
    });
}
if(page==="today"){
document.getElementById("sf").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);state.sessions.push({id:Date.now(),date:key(),subject:f.get("subject"),topic:f.get("topic"),minutes:+f.get("minutes"),type:f.get("type"),note:f.get("note")});save();toast("جلسه مطالعه ثبت شد");render("today")};
document.getElementById("tf").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);state.tests.push({id:Date.now(),date:key(),subject:f.get("subject"),topic:f.get("topic"),count:+f.get("count"),correct:+f.get("correct"),wrong:+f.get("wrong"),blank:+f.get("blank"),source:f.get("source"),marked:+f.get("marked")});save();toast("تست‌ها ثبت شدند");render("today")};
document.getElementById("df").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);state.days[key()]={energy:+f.get("energy"),focus:+f.get("focus"),status:f.get("status"),note:f.get("note")};save();toast("گزارش روز ذخیره شد");render("today")};
document.querySelectorAll(".ds").forEach(b=>b.onclick=()=>{state.sessions=state.sessions.filter(x=>x.id!=b.dataset.id);save();render("today")});
document.querySelectorAll(".dt").forEach(b=>b.onclick=()=>{state.tests=state.tests.filter(x=>x.id!=b.dataset.id);save();render("today")});
}
if(page==="days"){
    document.querySelectorAll(".page-btn").forEach(b=>b.onclick=()=>{window.daysPage = +b.dataset.pagebtn; render("days");});
    // ادیت پیشرفته روزها
    document.querySelectorAll("[data-editday]").forEach(b=>b.onclick=()=>{
        let dateK = b.dataset.editday;
        let daySessions = state.sessions.filter(x=>x.date===dateK);
        let dayTests = state.tests.filter(x=>x.date===dateK);
        showModal(`افزودن و ویرایش اطلاعات تاریخ: ${dateK}`, `
            <div style="margin-bottom:15px; font-size:12px; color:var(--muted)">در این بخش می‌توانی برای روزهایی که جا مانده‌ای یا آفلاین بودی، اطلاعات گذشته را وارد کنی یا موارد اشتباه را حذف کنی.</div>
            
            <div class="card" style="padding:15px; margin-bottom:15px; background:var(--bg)">
                <b>جلسات ثبت شده این روز:</b><br><br>
                ${sessionTable(daySessions)}
                <div class="section-title" style="margin-top:15px"><h3>➕ افزودن جلسه جدید به این روز</h3></div>
                <div class="form">
                    <div class="grid g3">
                      <select id="emSub">${state.subjects.map(s=>`<option>${s.name}</option>`).join("")}</select>
                      <input id="emMin" type="number" placeholder="مدت زمان (دقیقه)">
                      <select id="emType"><option>آموزش</option><option>مرور</option></select>
                    </div>
                    <button class="btn primary" id="emSave">اضافه کردن زمان مطالعه</button>
                </div>
            </div>

            <div class="card" style="padding:15px; margin-bottom:15px; background:var(--bg)">
                <b>تست‌های ثبت شده این روز:</b><br><br>
                ${testTable(dayTests)}
                <div class="section-title" style="margin-top:15px"><h3>➕ افزودن تست جدید به این روز</h3></div>
                <div class="form">
                    <div class="grid g4">
                      <select id="etSub">${state.subjects.map(s=>`<option>${s.name}</option>`).join("")}</select>
                      <input id="etCount" type="number" placeholder="تعداد تست">
                      <input id="etCorrect" type="number" placeholder="تعداد صحیح">
                      <input id="etWrong" type="number" placeholder="تعداد غلط">
                    </div>
                    <button class="btn primary" id="etSave">اضافه کردن تست</button>
                </div>
            </div>
        `);
        // دکمه حذف داخل مدال
        document.getElementById("modal").querySelectorAll(".ds").forEach(db=>db.onclick=()=>{state.sessions=state.sessions.filter(x=>x.id!=db.dataset.id); save(); toast("جلسه حذف شد"); document.getElementById("modal").classList.add("hidden"); render("days");});
        document.getElementById("modal").querySelectorAll(".dt").forEach(db=>db.onclick=()=>{state.tests=state.tests.filter(x=>x.id!=db.dataset.id); save(); toast("تست حذف شد"); document.getElementById("modal").classList.add("hidden"); render("days");});
        
        // ذخیره دستی مطالعه
        document.getElementById("emSave").onclick=()=>{
            let m = +document.getElementById("emMin").value;
            if(!m) return toast("زمان وارد نشده!");
            state.sessions.push({id:Date.now(), date:dateK, subject:document.getElementById("emSub").value, minutes:m, type:document.getElementById("emType").value});
            save(); toast("جلسه اضافه شد"); document.getElementById("modal").classList.add("hidden"); render("days");
        };
        // ذخیره دستی تست
        document.getElementById("etSave").onclick=()=>{
            let c = +document.getElementById("etCount").value;
            if(!c) return toast("تعداد تست وارد نشده!");
            state.tests.push({id:Date.now(), date:dateK, subject:document.getElementById("etSub").value, count:c, correct:+document.getElementById("etCorrect").value||0, wrong:+document.getElementById("etWrong").value||0, blank:0, marked:0});
            save(); toast("تست اضافه شد"); document.getElementById("modal").classList.add("hidden"); render("days");
        };
    });
}
if(page==="subjects"){document.getElementById("addSub").onclick=()=>showModal("افزودن درس",`<div class="form"><label>نام درس (مثلاً: زیست‌شناسی)<input id="newSub"></label></div>`,()=>{let n=document.getElementById("newSub")?.value.trim();if(n){state.subjects.push({name:n});save();toast("درس اضافه شد");render("subjects")}})}
if(page==="exams"){
    document.getElementById("examForm").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);
        let percs = {}; state.subjects.forEach(s => { let p = f.get("p_"+s.name); if(p!=="") percs[s.name] = +p; });
        state.exams.push({id:Date.now(), date:f.get("date"), taraz:+f.get("taraz"), rank:f.get("rank"), note:f.get("note"), percentages:percs});
        save(); toast("آزمون و درصدها ثبت شد"); render("exams");
    };
    document.querySelectorAll(".de").forEach(b=>b.onclick=()=>{state.exams=state.exams.filter(x=>x.id!=b.dataset.id);save();render("exams");})
    document.querySelectorAll(".view-exam").forEach(b=>b.onclick=()=>{
        let ex = state.exams.find(x=>x.id==b.dataset.id);
        if(!ex || !ex.percentages || Object.keys(ex.percentages).length===0) return toast("درصدی برای این آزمون ثبت نشده");
        let html = `<div class="table-wrap"><table class="table"><tr><th>درس</th><th>درصد کسب شده</th></tr>`;
        for(let s in ex.percentages) {
            let p = ex.percentages[s];
            html += `<tr><td>${s}</td><td class="${p>=70?'good':p<30?'bad':'neutral'}">${p}%</td></tr>`;
        }
        html += `</table></div>`;
        showModal(`درصدهای آزمون ${ex.date}`, html);
    });
}
if(page==="goals"){
    document.getElementById("addGoal").onclick=()=>showModal("افزودن هدف",`<div class="form"><label>تاریخ هدف<input id="gd" type="date" value="${key()}"></label><label>عنوان هدف<input id="gt"></label><label>توضیح/مقدار<input id="gv"></label><div class="switch" style="padding:10px;"><label>تکرارشونده هر روز؟</label><input type="checkbox" id="gRec"></div></div>`,()=>{let t=document.getElementById("gt")?.value.trim();if(t){state.goals.push({id:Date.now(),date:document.getElementById("gd").value,title:t,value:document.getElementById("gv")?.value||"",done:false,recurring:document.getElementById("gRec").checked,doneDate:[]});save();render("goals")}});
    document.getElementById("addReminder").onclick=()=>showModal("افزودن یادآوری",`<div class="form"><label>تاریخ یادآوری<input id="rd" type="date" value="${key()}"></label><label>متن یادآوری<input id="rt"></label></div>`,()=>{let t=document.getElementById("rt")?.value.trim();if(t){state.reminders.push({id:Date.now(),date:document.getElementById("rd").value,text:t});save();render("goals")}});
    document.querySelectorAll(".dg").forEach(b=>b.onclick=()=>{state.goals=state.goals.filter(g=>g.id!=b.dataset.id);save();render("goals")})
    document.querySelectorAll(".dr").forEach(b=>b.onclick=()=>{state.reminders=state.reminders.filter(r=>r.id!=b.dataset.id);save();render("goals")})
}
if(page==="timer"){
    document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{clearInterval(timer.interval);timer.running=false;timer.isPaused=false;timer.mode=b.dataset.mode;timer.sec=b.dataset.mode==="countdown"?1500:(b.dataset.mode==="pomodoro"?1500:0);render("timer")});
    
    let applyBtn = document.getElementById("applyTime");
    if(applyBtn) applyBtn.onclick=()=>{let h=+document.getElementById("th").value||0,m=+document.getElementById("tm").value||0,s=+document.getElementById("ts").value||0;timer.sec=h*3600+m*60+s;toast("زمان تنظیم شد");document.getElementById("td").textContent=clock(timer.sec)};
    
    document.getElementById("start").onclick=()=>{
        if(timer.running && !timer.isPaused){ // Stop Completely
            clearInterval(timer.interval);timer.running=false;timer.lastElapsed=timer.mode==="stopwatch"?timer.sec:timer.sec?timer.lastElapsed:0;toast("تایمر کاملاً متوقف شد");render("timer");
        }else{ // Start or Resume
            timer.running=true; timer.isPaused=false; timer.lastStart=Date.now();
            timer.interval=setInterval(()=>{
                timer.mode==="stopwatch"?timer.sec++:timer.sec--;
                if((timer.mode==="countdown"||timer.mode==="pomodoro") && timer.sec<=0){
                    timer.sec=0;clearInterval(timer.interval);timer.running=false;
                    if(timer.mode==="pomodoro") {
                        timer.pomodoroCount++;
                        toast("🍅 یک پومودورو تکمیل شد! استراحت کن.");
                        timer.sec = 5 * 60; // 5 min rest setup automatically
                    } else {
                        toast("⏰ زمان تمام شد");
                    }
                    timer.lastElapsed=timer.lastStart?Math.round((Date.now()-timer.lastStart)/1000):0;
                }
                let e=document.getElementById("td");if(e)e.textContent=clock(timer.sec)
            },1000);
            render("timer");
        }
    };
    
    let pauseBtn = document.getElementById("pauseBtn");
    if(pauseBtn) pauseBtn.onclick=()=>{
        clearInterval(timer.interval); timer.isPaused=true; toast("تایمر موقتاً متوقف شد (مکث)"); render("timer");
    };

    document.getElementById("reset").onclick=()=>{clearInterval(timer.interval);timer.running=false;timer.isPaused=false;timer.sec=timer.mode==="countdown"?1500:(timer.mode==="pomodoro"?1500:0);timer.lastElapsed=0;render("timer")};
    
    document.getElementById("saveTimer").onclick=()=>{
        let sec = timer.mode==="stopwatch" ? timer.sec : (timer.lastElapsed||0);
        if(timer.mode==="pomodoro") sec = timer.pomodoroCount * 25 * 60; // Auto calc for Pomodoro
        let m=Math.floor(sec/60);
        if(m<1){toast("حداقل یک دقیقه برای ثبت لازم است");return}
        state.sessions.push({id:Date.now(),date:key(),subject:document.getElementById("tSub").value,topic:document.getElementById("tTopic").value,minutes:m,type:"مطالعه با تایمر",note:`ثبت‌شده از تایمر (${timer.mode})`});
        save();timer.lastElapsed=0; timer.pomodoroCount=0; toast(`${m} دقیقه مطالعه ثبت شد`);render("timer")
    }
    
    // کدهای نویز سفید
    document.querySelectorAll(".sound-btn").forEach(b=>b.onclick=()=>{
        let s = b.dataset.sound;
        if(window.audioSounds[s].paused) {
            window.audioSounds[s].play(); b.classList.add("playing");
        } else {
            window.audioSounds[s].pause(); b.classList.remove("playing");
        }
    });
}
if(page==="settings"){
    document.getElementById("setf").onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);state.targetHours=+f.get("hours");state.targetTests=+f.get("tests");save();toast("تنظیمات ذخیره شد");render("settings")};
    document.getElementById("largeFont").onchange=e=>{state.compact=!e.target.checked;document.body.style.fontSize=state.compact?"13px":"14px";save()};
    document.getElementById("savePass").onclick=()=>{ let p = document.getElementById("appPassword").value; localStorage.setItem("sfx_pass", p); toast("رمز ورود ذخیره شد"); };
    document.getElementById("export").onclick=()=>{let blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="konkur-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
    document.getElementById("import").onchange=e=>{let file=e.target.files[0];if(!file)return;let r=new FileReader();r.onload=()=>{try{state=JSON.parse(r.result);save();toast("پشتیبان وارد شد");render("dashboard")}catch{toast("فایل پشتیبان معتبر نیست")}};r.readAsText(file)};
    document.getElementById("reset").onclick=()=>{if(confirm("همه اطلاعات برای همیشه پاک شود؟ دقت کن که غیر قابل برگشت است!")){localStorage.removeItem(KEY);location.reload()}}
}
}
render();
