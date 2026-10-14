(function () {
  'use strict';
  const input = document.getElementById('dob');
  const picker = document.getElementById('dobPicker');
  if (!input || !picker) return;
  const el = id => document.getElementById(id);
  const toggle = el('dobPickerToggle'), monthYear = el('dobMonthYear'), days = el('dobDays');
  const calendar = el('dobCalendarView'), yearView = el('dobYearView'), years = el('dobYears');
  const yearRange = el('dobYearRange'), monthView = el('dobMonthView');
  const today = new Date(); today.setHours(0,0,0,0);
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  let view = new Date(today.getFullYear(), today.getMonth(), 1), selected = null, mode = 'calendar', yearStart = Math.floor((today.getFullYear()-1)/12)*12;
  function parse(value) {
    const s = String(value || '').trim(); let m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/), y, mo, d;
    if (m) { d=+m[1]; mo=+m[2]; y=+m[3]; } else { m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/); if(!m) return null; y=+m[1]; mo=+m[2]; d=+m[3]; }
    const date = new Date(y,mo-1,d); if(date.getFullYear()!==y||date.getMonth()!==mo-1||date.getDate()!==d) return null;
    date.setHours(0,0,0,0); return date<=today ? date : null;
  }
  function format(date) { return String(date.getDate()).padStart(2,'0')+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+date.getFullYear(); }
  function same(a,b) { return !!a&&!!b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
  function close() { picker.hidden=true; toggle.setAttribute('aria-expanded','false'); }
  function open() { selected=parse(input.value); view=selected?new Date(selected.getFullYear(),selected.getMonth(),1):new Date(today.getFullYear(),today.getMonth(),1); mode='calendar'; render(); picker.hidden=false; toggle.setAttribute('aria-expanded','true'); }
  function button(text, cls, handler) { const b=document.createElement('button'); b.type='button'; b.className=cls; b.textContent=text; b.addEventListener('click',handler); return b; }
  function renderYears() { yearRange.textContent=yearStart+'–'+(yearStart+11); years.innerHTML=''; for(let y=yearStart;y<yearStart+12;y++){ const b=button(String(y),'dob-year-option'+(y===view.getFullYear()?' is-current':''),()=>{view.setFullYear(y);mode='months';render();}); years.appendChild(b); } }
  function renderMonths() { monthView.innerHTML=''; months.forEach((name,i)=>monthView.appendChild(button(name.slice(0,3),'dob-month-option'+(i===view.getMonth()?' is-current':''),()=>{view.setMonth(i);mode='calendar';render();}))); }
  function render() {
    monthYear.textContent=months[view.getMonth()]+' '+view.getFullYear(); calendar.hidden=mode!=='calendar'; yearView.hidden=mode!=='years'; monthView.hidden=mode!=='months';
    if(mode==='years'){renderYears();return;} if(mode==='months'){renderMonths();return;} days.innerHTML='';
    const first=new Date(view.getFullYear(),view.getMonth(),1).getDay(), count=new Date(view.getFullYear(),view.getMonth()+1,0).getDate(), prevCount=new Date(view.getFullYear(),view.getMonth(),0).getDate();
    for(let i=0;i<42;i++){ let date,outside=false; if(i<first){date=new Date(view.getFullYear(),view.getMonth()-1,prevCount-first+i+1);outside=true;}else if(i>=first+count){date=new Date(view.getFullYear(),view.getMonth()+1,i-first-count+1);outside=true;}else date=new Date(view.getFullYear(),view.getMonth(),i-first+1);
      const b=button(String(date.getDate()),'dob-day'+(outside?' is-outside':'')+(same(date,selected)?' is-selected':'')+(same(date,today)?' is-today':''),()=>{selected=new Date(date);input.value=format(selected);input.dispatchEvent(new Event('input',{bubbles:true}));close();});
      b.disabled=date>today; b.setAttribute('aria-label',date.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})); b.setAttribute('aria-pressed',String(same(date,selected))); days.appendChild(b);
    }
    el('dobPrev').disabled=view.getFullYear()===1900&&view.getMonth()===0; el('dobNext').disabled=view.getFullYear()===today.getFullYear()&&view.getMonth()===today.getMonth();
  }
  toggle.addEventListener('click',()=>picker.hidden?open():close());
  el('dobPrev').addEventListener('click',()=>{view.setMonth(view.getMonth()-1);render();});
  el('dobNext').addEventListener('click',()=>{view.setMonth(view.getMonth()+1);render();});
  monthYear.addEventListener('click',()=>{mode=mode==='years'?'calendar':'years';yearStart=Math.floor((view.getFullYear()-1)/12)*12;render();});
  el('dobYearPrev').addEventListener('click',()=>{yearStart-=12;renderYears();}); el('dobYearNext').addEventListener('click',()=>{yearStart+=12;renderYears();});
  el('dobToday').addEventListener('click',()=>{selected=new Date(today);input.value=format(today);input.dispatchEvent(new Event('input',{bubbles:true}));close();});
  el('dobClear').addEventListener('click',()=>{selected=null;input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));close();input.focus();});
  el('dobDone').addEventListener('click',()=>{if(selected)input.value=format(selected);close();});
  input.addEventListener('blur',()=>{if(!input.value.trim())return;const d=parse(input.value);if(d)input.value=format(d);});
  input.addEventListener('keydown',e=>{if(e.key==='Escape')close();if(e.key==='ArrowDown'&&e.altKey){e.preventDefault();open();}});
  document.addEventListener('pointerdown',e=>{if(!picker.hidden&&!picker.contains(e.target)&&!toggle.contains(e.target))close();});
  render();
})();