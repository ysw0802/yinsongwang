/* ============================================================
   公司列表页逻辑：行业筛选 + 公司卡片渲染
   作者：24001010802 ysw
   ============================================================ */

const YSW_INDUSTRIES = ['全部', '互联网', '电子商务', '金融', '游戏', '数据服务', '物流', '医疗健康', '教育培训'];
let yswCompanies = [];
let yswCurIndustry = '全部';

/* ---------- 1. 渲染公司列表 ---------- */
function yswRenderCompanies() {
  const list = yswCurIndustry === '全部'
    ? yswCompanies
    : yswCompanies.filter(c => c.industry === yswCurIndustry);

  document.getElementById('ysw_company_list').innerHTML = list.map(c => `
    <a class="ysw-company-card" href="company-detail.html?id=${c.id}">
      <img class="ysw-company-card__logo" src="${c.logo}" alt="${c.name}logo">
      <div style="flex:1;min-width:0">
        <p class="ysw-company-card__name">${c.name}</p>
        <p class="ysw-company-card__meta">${c.industry} · ${c.scale} · ${c.stage}</p>
        <div class="ysw-company-card__tags">
          ${c.tags.map(t => `<span class="ysw-tag">${t}</span>`).join('')}
          <span class="ysw-tag" style="color:var(--ysw-primary);background:rgba(0,169,224,.08)">${c.jobsCount}个在招职位</span>
        </div>
      </div>
    </a>`).join('') || `
    <div class="ysw-empty">
      <svg class="ysw-icon"><use href="#i-empty"></use></svg><br>该行业暂无入驻企业
    </div>`;
}

/* ---------- 2. 筛选切换（JS效果：筛选联动） ---------- */
function yswInitFilter() {
  const box = document.getElementById('ysw_filter');
  box.innerHTML = YSW_INDUSTRIES.map((f, i) =>
    `<button class="ysw-filter__item${i === 0 ? ' ysw-filter__item--active' : ''}" type="button" data-ind="${f}">${f}</button>`).join('');

  box.addEventListener('click', e => {
    const item = e.target.closest('.ysw-filter__item');
    if (!item) return;
    box.querySelectorAll('.ysw-filter__item').forEach(el => el.classList.remove('ysw-filter__item--active'));
    item.classList.add('ysw-filter__item--active');
    yswCurIndustry = item.dataset.ind;
    yswRenderCompanies();
  });
}

/* ---------- 3. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  yswRenderTabbar('company');
  yswInitBacktop();
  yswInitFilter();
  document.getElementById('ysw_company_list').innerHTML =
    '<div class="ysw-loading"><span class="ysw-spinner"></span>加载中...</div>';

  try {
    yswCompanies = await yswFetch('companies');
    yswRenderCompanies();
  } catch (err) {
    document.getElementById('ysw_company_list').innerHTML =
      `<div class="ysw-empty"><svg class="ysw-icon"><use href="#i-warn"></use></svg><br>数据加载失败，请检查本地服务</div>`;
  }
});
