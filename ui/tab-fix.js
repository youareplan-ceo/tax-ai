// 안전 fetch (API 실패시 mock 상대경로로 폴백)
async function safeGet(url, mockUrl){
  try{
    const r = await fetch(url,{credentials:'include'});
    if(!r.ok) throw new Error('HTTP '+r.status);
    return await r.json();
  }catch(e){
    if(mockUrl){
      try{ const m = await fetch(mockUrl); return await m.json(); }
      catch(_){}
    }
    return {success:false,data:[],message:'offline'};
  }
}

const sections = ['ledger','upload','classify','report','quick'];

function showTab(id){
  sections.forEach(s=>{
    const sec = document.getElementById(s);
    if(sec) sec.style.display = (s===id?'block':'none');
    const btn = document.querySelector(`[data-tab="${s}"]`);
    if(btn) btn.classList.toggle('active', s===id);
  });
  loadTabContent(id);
}

async function loadTabContent(id){
  try{
    if(id==='ledger'){
      const res = await safeGet('/api/entries/list','./mock/entries.json');
      if(res?.data) updateLedgerCards(res.data);
    }else if(id==='report'){
      const res = await safeGet('/api/entries/summary','./mock/summary.json');
      if(res?.data) updateSummaryCards(res.data);
    }
  }catch(_){}
}

// 카드 렌더(간단 버전: 페이지에 동일 id가 있는 경우만 수행)
function updateLedgerCards(list=[]){
  const wrap = document.getElementById('ledger');
  if(!wrap) return;
  [...wrap.querySelectorAll('.ledger-card,.ledger-skeleton')].forEach(n=>n.remove());
  list.forEach(entry=>{
    const d = document.createElement('div');
    d.className='ledger-card';
    const amt = parseInt(entry.amount||0);
    d.innerHTML = `
      <div>
        <div class="ledger-merchant">${entry.vendor||''}</div>
        <div class="ledger-date">${entry.trx_date||''}</div>
      </div>
      <div class="ledger-amount ${amt>0?'pos':'neg'}">
        ${amt>0?'+':''}₩${Math.abs(amt).toLocaleString()}
      </div>`;
    wrap.appendChild(d);
  });
}
function updateSummaryCards(sum={}){
  const s = document.getElementById('sum-month');
  if(s && sum.total_amount!=null) s.textContent = `₩${Number(sum.total_amount).toLocaleString()}`;
  const t = document.getElementById('top-cats');
  if(t && Array.isArray(sum.categories))
    t.textContent = sum.categories.filter(c=>c.amount>0).slice(0,2).map(c=>c.name).join(', ') || '—';
}

// 초기 진입 + 탭 이벤트(위임 + id 모두 지원)
document.addEventListener('DOMContentLoaded', ()=>{
  // data-tab이 없을 수 있으니 id(#tab-ledger 등)와 data-tab 둘 다 지원
  const ids = ['ledger','upload','classify','report','quick'];
  ids.forEach(id=>{
    const byId = document.getElementById('tab-'+id);
    if(byId) byId.setAttribute('data-tab', id);
  });
  const tabbar = document.getElementById('tabbar') || document;
  tabbar.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-tab]');
    if(!btn) return;
    e.preventDefault();
    showTab(btn.dataset.tab);
  });

  // 섹션 표시 초기화 + 기본 탭
  sections.forEach((s,i)=>{
    const sec = document.getElementById(s);
    if(sec) sec.style.display = i===0?'block':'none';
  });
  showTab('ledger');
});
