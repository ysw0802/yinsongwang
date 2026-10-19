/* ============================================================
   搜索页逻辑：历史记录（localStorage 增删清空）、热门搜索、
   关键词实时搜索、分类筛选、结果渲染
   作者：24001010802 ysw
   ============================================================ */

const YSW_HOT_WORDS = ['前端工程师', 'Java', '数据分析', 'UI设计', '产品经理', '新媒体运营', '大连', '实习生'];
const YSW_FILTERS = ['全部', '技术', '产品', '设计', '运营', '销售', '职能'];

let yswJobs = [];           // 职位数据
let yswCompanies = [];      // 公司数据
let yswCurKw = '';          // 当前关键词
let yswCurFilter = '全部';  // 当前分类筛选

/* ---------- 1. 历史记录读写（localStorage，最多10条，去重） ---------- */
function yswGetHistory() {
  return yswStore('ysw_search_history') || [];
}

function yswSaveHistory(kw) {
  if (!kw) return;
  let list = yswGetHistory().filter(k => k !== kw);
  list.unshift(kw);
  if (list.length > 10) list = list.slice(0, 10);
  yswStore('ysw_search_history', list);
  yswRenderHistory();
}

function yswRenderHistory() {
  const list = yswGetHistory();
  document.getElementById('ysw_history_box').innerHTML = list.map(k =>
    `<button class="ysw-chip" type="button" data-kw="${k}">${k}</button>`).join('') ||
    '<span style="font-size:12px;color:var(--ysw-text-light)">暂无搜索历史</span>';
}

/* ---------- 2. 热门搜索渲染 ---------- */
function yswRenderHot() {
  document.getElementById('ysw_hot_list').innerHTML = YSW_HOT_WORDS.map((w, i) => `
    <li class="ysw-hot-item" data-kw="${w}">
      <span class="ysw-hot-item__rank">${i + 1}</span>
      <span class="ysw-hot-item__text">${w}</span>
      <span class="ysw-hot-item__heat">${(9860 - i * 830).toLocaleString()} 热度</span>
    </li>`).join('');
}

/* ---------- 3. 执行搜索 ---------- */
function yswDoSearch(kw) {
  yswCurKw = (kw || '').trim();
  document.getElementById('ysw_search_input').value = yswCurKw;
  if (yswCurKw) yswSaveHistory(yswCurKw);
  yswRenderResult();
}

/* ---------- 4. 结果过滤与渲染 ---------- */
function yswRenderResult() {
  const hasKw = !!yswCurKw;
  document.getElementById('ysw_discover').style.display = hasKw ? 'none' : 'block';
  document.getElementById('ysw_filter').style.display = hasKw ? 'flex' : 'none';
  document.getElementById('ysw_search_go').style.display = hasKw ? 'none' : 'block';
  document.getElementById('ysw_search_cancel').style.display = hasKw ? 'block' : 'none';

  const listBox = document.getElementById('ysw_result_list');
  if (!hasKw) { listBox.innerHTML = ''; return; }

  const kw = yswCurKw.toLowerCase();
  const list = yswJobs.filter(j => {
    const company = yswCompanies.find(c => c.id === j.companyId) || {};
    const hitKw = (j.name + j.city + j.area + j.category + company.name + j.tags.join('')).toLowerCase().includes(kw);
    const hitFilter = yswCurFilter === '全部' || j.category === yswCurFilter;
    return hitKw && hitFilter;
  });

  if (!list.length) {
    listBox.innerHTML = `<li class="ysw-empty">
      <svg class="ysw-icon"><use href="#i-empty"></use></svg><br>
      没有找到与“${yswCurKw}”相关的职位<br><span style="font-size:11px">换个关键词试试吧</span></li>`;
    return;
  }

  listBox.innerHTML = list.map(job => {
    const company = yswCompanies.find(c => c.id === job.companyId) || {};
    return `
    <li class="ysw-job-card" style="background:var(--ysw-card)">
      <a href="job.html?id=${job.id}">
        <div class="ysw-job-card__top">
          <h3 class="ysw-job-card__name">${job.name}</h3>
          <span class="ysw-job-card__salary">${job.salary}</span>
        </div>
        <div class="ysw-job-card__tags">
          <span class="ysw-tag">${job.city}·${job.area}</span>
          <span class="ysw-tag">${job.exp}</span>
          <span class="ysw-tag">${job.edu}</span>
        </div>
        <div class="ysw-job-card__company">
          <img class="ysw-logo" src="images/company${job.companyId}.jpg" alt="${company.name}logo">
          <div>
            <p class="ysw-job-card__company-name">${company.name || ''}</p>
            <p class="ysw-job-card__company-meta">${company.industry || ''} · ${company.scale || ''}</p>
          </div>
          <p class="ysw-hr"><span class="ysw-hr__dot${job.hr.active === '在线' ? '' : ' ysw-hr__dot--offline'}"></span>${job.hr.name}·${job.hr.active}</p>
        </div>
      </a>
    </li>`;
  }).join('') + `<li class="ysw-loading__end">共 ${list.length} 个相关职位</li>`;
}

/* ---------- 5. 事件绑定 ---------- */
function yswBindEvents() {
  const input = document.getElementById('ysw_search_input');

  // 回车搜索（JS效果：键盘事件 + 实时搜索防抖）
  let debounce = null;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => yswDoSearch(input.value), 300);
  });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') yswDoSearch(input.value); });

  document.getElementById('ysw_search_go').addEventListener('click', () => yswDoSearch(input.value));
  document.getElementById('ysw_search_cancel').addEventListener('click', () => yswDoSearch(''));

  // 历史/热门点击
  document.body.addEventListener('click', e => {
    const chip = e.target.closest('[data-kw]');
    if (chip) yswDoSearch(chip.dataset.kw);
  });

  // 清空历史
  document.getElementById('ysw_history_clear').addEventListener('click', () => {
    if (!yswGetHistory().length) return yswToast('暂无历史记录');
    yswStore('ysw_search_history', []);
    yswRenderHistory();
    yswToast('已清空搜索历史');
  });

  // 分类筛选切换
  document.getElementById('ysw_filter').addEventListener('click', e => {
    const item = e.target.closest('.ysw-filter__item');
    if (!item) return;
    document.querySelectorAll('.ysw-filter__item').forEach(el => el.classList.remove('ysw-filter__item--active'));
    item.classList.add('ysw-filter__item--active');
    yswCurFilter = item.dataset.cat;
    yswRenderResult();
  });
}

/* ---------- 6. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  yswRenderTabbar('index');
  yswInitBacktop();
  yswRenderHistory();
  yswRenderHot();
  yswBindEvents();

  document.getElementById('ysw_filter').innerHTML = YSW_FILTERS.map((f, i) =>
    `<button class="ysw-filter__item${i === 0 ? ' ysw-filter__item--active' : ''}" type="button" data-cat="${f}">${f}</button>`).join('');

  try {
    [yswJobs, yswCompanies] = await Promise.all([yswFetch('jobs'), yswFetch('companies')]);
    // 支持 URL 带 kw 参数直接搜索（如从首页分类宫格进入）
    const kwParam = yswQuery('kw');
    if (kwParam) yswDoSearch(kwParam);
    else document.getElementById('ysw_search_input').focus();
  } catch (err) {
    yswToast('数据加载失败，请检查本地服务');
  }
});
