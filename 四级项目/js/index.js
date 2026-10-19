/* ============================================================
   首页逻辑：轮播图、分类宫格、职位列表（tab切换 + 触底加载更多）
   作者：24001010802 ysw
   ============================================================ */

/* ---------- 分类宫格数据 ---------- */
const YSW_GRID_ITEMS = [
  { text: '技术', icon: 'i-code', color: 'c1', kw: '技术' },
  { text: '产品', icon: 'i-box', color: 'c2', kw: '产品' },
  { text: '设计', icon: 'i-pen', color: 'c3', kw: '设计' },
  { text: '运营', icon: 'i-mega', color: 'c4', kw: '运营' },
  { text: '销售', icon: 'i-chart', color: 'c5', kw: '销售' },
  { text: '人力行政', icon: 'i-users', color: 'c6', kw: '职能' },
  { text: '金融财务', icon: 'i-wallet', color: 'c7', kw: '职能' },
  { text: '医疗健康', icon: 'i-heart', color: 'c8', kw: '医疗' }
];

let yswAllJobs = [];        // 全部职位数据（fetch 获取）
let yswCompanyMap = {};     // 公司映射表（id -> 公司对象）
let yswCurTab = 'rec';      // 当前选项卡
let yswShownCount = 0;      // 已展示条数
const YSW_PAGE_SIZE = 5;    // 每次追加条数

/* ---------- 1. 轮播图：自动播放 + 指示点 + 手动触摸切换 ---------- */
function yswInitSwiper() {
  const track = document.getElementById('ysw_swiper_track');
  const dotsBox = document.getElementById('ysw_swiper_dots');
  const total = track.children.length;
  let cur = 0;
  let timer = null;

  dotsBox.innerHTML = Array.from({ length: total }, (_, i) =>
    `<span class="ysw-swiper__dot${i === 0 ? ' ysw-swiper__dot--active' : ''}"></span>`).join('');
  const dots = [...dotsBox.children];

  function go(i) {
    cur = (i + total) % total;
    track.style.transform = `translateX(-${cur * 100}%)`;
    dots.forEach((d, k) => d.classList.toggle('ysw-swiper__dot--active', k === cur));
  }

  function play() {
    timer = setInterval(() => go(cur + 1), 3200);
  }

  function stop() {
    clearInterval(timer);
  }

  // 触摸滑动切换
  let startX = 0;
  const box = document.getElementById('ysw_swiper');
  box.addEventListener('touchstart', e => { startX = e.touches[0].clientX; stop(); }, { passive: true });
  box.addEventListener('touchend', e => {
    const delta = e.changedTouches[0].clientX - startX;
    if (Math.abs(delta) > 40) go(delta < 0 ? cur + 1 : cur - 1);
    play();
  }, { passive: true });
  box.addEventListener('mouseenter', stop);
  box.addEventListener('mouseleave', play);

  play();
}

/* ---------- 2. 分类宫格渲染 ---------- */
function yswRenderGrid() {
  document.getElementById('ysw_grid').innerHTML = YSW_GRID_ITEMS.map(item => `
    <a class="ysw-grid__item" href="search.html?kw=${encodeURIComponent(item.kw)}">
      <span class="ysw-grid__icon ysw-grid__icon--${item.color}">
        <svg class="ysw-icon"><use href="#${item.icon}"></use></svg>
      </span>
      <span>${item.text}</span>
    </a>`).join('');
}

/* ---------- 3. 职位列表渲染（按 tab 排序 + 分批追加） ---------- */
function yswSortJobs() {
  const list = [...yswAllJobs];
  if (yswCurTab === 'new') {
    list.sort((a, b) => b.date.localeCompare(a.date));
  } else if (yswCurTab === 'salary') {
    list.sort((a, b) => b.salaryLow - a.salaryLow);
  }
  return list;
}

function yswRenderJobs(reset) {
  if (reset) {
    yswShownCount = 0;
    document.getElementById('ysw_job_list').innerHTML = '';
  }
  const jobs = yswSortJobs();
  const slice = jobs.slice(yswShownCount, yswShownCount + YSW_PAGE_SIZE);
  const html = slice.map(job => `
    <li class="ysw-job-card">
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
          <img class="ysw-logo" src="images/company${job.companyId}.jpg" alt="${(yswCompanyMap[job.companyId] || {}).name}logo">
          <div>
            <p class="ysw-job-card__company-name">${(yswCompanyMap[job.companyId] || {}).name || ''}</p>
            <p class="ysw-job-card__company-meta">${(yswCompanyMap[job.companyId] || {}).industry || ''} · ${(yswCompanyMap[job.companyId] || {}).scale || ''}</p>
          </div>
          <p class="ysw-hr"><span class="ysw-hr__dot${job.hr.active === '在线' ? '' : ' ysw-hr__dot--offline'}"></span>${job.hr.name}·${job.hr.active}</p>
        </div>
      </a>
    </li>`).join('');

  document.getElementById('ysw_job_list').insertAdjacentHTML('beforeend', html);
  yswShownCount += slice.length;
  yswToggleLoading();
}

/* ---------- 4. 触底加载更多（加载指示器接近视口即触发，带防抖与自动补位） ---------- */
let yswLoadingMore = false; // 加载防抖标志

/* 依据剩余数据量显隐加载指示器 */
function yswToggleLoading() {
  const loading = document.getElementById('ysw_loading');
  const done = yswShownCount >= yswSortJobs().length;
  loading.style.display = done ? 'none' : 'flex';
}

function yswTryLoadMore() {
  const loading = document.getElementById('ysw_loading');
  if (yswLoadingMore || loading.style.display === 'none') return;
  yswLoadingMore = true;
  setTimeout(() => {
    yswRenderJobs(false);
    yswLoadingMore = false;
    // 数据不足一屏时自动补位，保证列表可继续滚动
    const el = document.getElementById('ysw_loading');
    if (el.style.display !== 'none' && el.getBoundingClientRect().top < window.innerHeight + 100) {
      yswTryLoadMore();
    }
  }, 400); // 模拟网络延迟
}

function yswInitScrollLoad() {
  window.addEventListener('scroll', () => {
    const loading = document.getElementById('ysw_loading');
    if (loading.style.display === 'none') return;
    if (loading.getBoundingClientRect().top < window.innerHeight + 100) {
      yswTryLoadMore();
    }
  }, { passive: true });
}

/* ---------- 5. 选项卡切换（JS效果：tab联动） ---------- */
function yswInitTabs() {
  document.getElementById('ysw_tabs').addEventListener('click', e => {
    const item = e.target.closest('.ysw-tabs__item');
    if (!item) return;
    document.querySelectorAll('.ysw-tabs__item').forEach(el => el.classList.remove('ysw-tabs__item--active'));
    item.classList.add('ysw-tabs__item--active');
    yswCurTab = item.dataset.tab;
    yswRenderJobs(true);
    yswTryLoadMore(); // 切换后若数据不足一屏自动补位
  });
}

/* ---------- 6. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  yswRenderTabbar('index');
  yswInitBacktop();
  yswInitSwiper();
  yswRenderGrid();
  yswInitTabs();
  yswInitScrollLoad();

  try {
    const [jobs, companies] = await Promise.all([yswFetch('jobs'), yswFetch('companies')]);
    yswAllJobs = jobs;
    companies.forEach(c => { yswCompanyMap[c.id] = c; });
    yswRenderJobs(true);
    yswTryLoadMore(); // 首屏数据不足一屏时自动补位
  } catch (err) {
    document.getElementById('ysw_loading').innerHTML =
      `<svg class="ysw-icon"><use href="#i-warn"></use></svg> 数据加载失败，请检查本地服务`;
  }
});
