/* ============================================================
   BOSS直聘（手机APP仿制）公共脚本
   作者：24001010802 ysw
   说明：提供 SVG 图标库、底部导航渲染、fetch 接口封装、
        Toast 轻提示、返回顶部等公共能力，供各页面复用。
   ============================================================ */

/* ---------- 1. SVG 图标库（本地内联，无任何网络资源） ---------- */
const YSW_ICONS = `
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
  <symbol id="i-job" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 12h18"/></symbol>
  <symbol id="i-company" viewBox="0 0 24 24"><rect x="4" y="3" width="12" height="18" rx="1.5"/><path d="M16 8h3a1 1 0 0 1 1 1v12"/><path d="M7.5 7.5h2m3 0h-2m2 3.5h-2m2 3.5h-2M7.5 11h2m-2 3.5h2M9.5 21v-3h2v3"/></symbol>
  <symbol id="i-chat" viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H5.5L3 21.5V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/></symbol>
  <symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4.5 20.5c1.5-3.5 4.3-5 7.5-5s6 1.5 7.5 5"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.8-3.8"/></symbol>
  <symbol id="i-loc" viewBox="0 0 24 24"><path d="M12 21s-7-5.8-7-11a7 7 0 0 1 14 0c0 5.2-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></symbol>
  <symbol id="i-back" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></symbol>
  <symbol id="i-caret" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></symbol>
  <symbol id="i-star" viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/></symbol>
  <symbol id="i-star-fill" viewBox="0 0 24 24"><path fill="currentColor" stroke="none" d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/></symbol>
  <symbol id="i-top" viewBox="0 0 24 24"><path d="M6 13l6-6 6 6M12 7v13"/></symbol>
  <symbol id="i-trash" viewBox="0 0 24 24"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-1 13a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 7"/><path d="M10 11v6m4-6v6"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>
  <symbol id="i-phone" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></symbol>
  <symbol id="i-lock" viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></symbol>
  <symbol id="i-resume" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="9" r="2.5"/><path d="M8 16c.8-1.8 2.2-2.8 4-2.8s3.2 1 4 2.8"/></symbol>
  <symbol id="i-collect" viewBox="0 0 24 24"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/></symbol>
  <symbol id="i-send" viewBox="0 0 24 24"><path d="M21 3 10.5 13.5M21 3l-6.5 18-4-7.5L3 9.5z"/></symbol>
  <symbol id="i-setting" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/></symbol>
  <symbol id="i-bell" viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.5 20a2 2 0 0 0 3 0"/></symbol>
  <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3l7.5 2.8v5.6c0 4.6-3 8.4-7.5 9.6-4.5-1.2-7.5-5-7.5-9.6V5.8z"/><path d="M9 12l2 2 4-4.5"/></symbol>
  <symbol id="i-logout" viewBox="0 0 24 24"><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3"/><path d="M15 8l4 4-4 4M19 12H9"/></symbol>
  <symbol id="i-history" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></symbol>
  <symbol id="i-fire" viewBox="0 0 24 24"><path d="M12 3s5.5 4 5.5 9.5a5.5 5.5 0 0 1-11 0C6.5 9 9 7.5 9.5 5c1 1.2 1.7 2.2 2 3.5C12 7 12 5 12 3z"/></symbol>
  <symbol id="i-doc" viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h5m-5 3.5h5"/></symbol>
  <symbol id="i-chart" viewBox="0 0 24 24"><path d="M4 20V10m5.5 10V4m5.5 16v-7m5.5 7V8"/></symbol>
  <symbol id="i-heart" viewBox="0 0 24 24"><path d="M12 20s-7.5-4.7-9.3-9.3C1.5 7.5 3.7 4.5 7 4.5c2 0 3.6 1 5 3 1.4-2 3-3 5-3 3.3 0 5.5 3 4.3 6.2C19.5 15.3 12 20 12 20z"/></symbol>
  <symbol id="i-book" viewBox="0 0 24 24"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/></symbol>
  <symbol id="i-code" viewBox="0 0 24 24"><path d="M8 7l-5 5 5 5m8-10 5 5-5 5M13.5 4l-3 16"/></symbol>
  <symbol id="i-box" viewBox="0 0 24 24"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12 4 7.5M12 12v9"/></symbol>
  <symbol id="i-pen" viewBox="0 0 24 24"><path d="M4 20l1.2-4.2L16.8 4.2a2 2 0 0 1 2.8 0l.2.2a2 2 0 0 1 0 2.8L8.2 18.8z"/><path d="M13.5 5.5l3 3"/></symbol>
  <symbol id="i-mega" viewBox="0 0 24 24"><path d="M3 10.5v3a1.5 1.5 0 0 0 1.5 1.5H7l6 4.5V4.5L7 9H4.5A1.5 1.5 0 0 0 3 10.5z"/><path d="M16.5 9a4 4 0 0 1 0 6.5M19 6.5a7.5 7.5 0 0 1 0 11"/></symbol>
  <symbol id="i-medal" viewBox="0 0 24 24"><circle cx="12" cy="14.5" r="5.5"/><path d="M12 12.2l.9 1.8 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3zM8.5 9.5 5 3h4l3 5.5L15 3h4l-3.5 6.5"/></symbol>
  <symbol id="i-users" viewBox="0 0 24 24"><circle cx="9" cy="8.5" r="3.5"/><path d="M2.5 20c1.3-3 3.7-4.5 6.5-4.5s5.2 1.5 6.5 4.5"/><circle cx="17.5" cy="9.5" r="2.5"/><path d="M17 15.5c2.3.2 4 1.5 4.8 4"/></symbol>
  <symbol id="i-wallet" viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M16 15h2"/></symbol>
  <symbol id="i-rocket" viewBox="0 0 24 24"><path d="M12 15c-1.5-3-1.5-7.5 0-10.5C13.5 7.5 13.5 12 12 15z"/><path d="M12 15l3.5 3.5M12 15l-3.5 3.5M9 6.5C6.5 8 5 11 5.5 14.5l3.5-2M15 6.5c2.5 1.5 4 4.5 3.5 8l-3.5-2M12 18.5V21"/></symbol>
  <symbol id="i-edit" viewBox="0 0 24 24"><path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M17.5 3.5a2.1 2.1 0 0 1 3 3L11 16l-4 1 1-4z"/></symbol>
  <symbol id="i-warn" viewBox="0 0 24 24"><path d="M12 4 2.5 20h19z"/><path d="M12 10v4.5m0 2.5h.01"/></symbol>
  <symbol id="i-empty" viewBox="0 0 24 24"><path d="M4 6h16v13H4z"/><path d="M4 10h16M8 6V4h8v2"/></symbol>
</svg>`;

document.addEventListener('DOMContentLoaded', () => {
  document.body.insertAdjacentHTML('afterbegin', YSW_ICONS);
});

/* ---------- 2. fetch 接口封装（统一访问 data/ 目录下的 mock 接口） ---------- */
/**
 * 请求 mock 数据接口
 * @param {string} api - 接口地址，如 'jobs'
 * @returns {Promise<any>} 接口返回的 data 字段
 */
async function yswFetch(api) {
  const res = await fetch(`data/${api}.json`, { headers: { 'Cache-Control': 'no-cache' } });
  if (!res.ok) throw new Error(`接口 ${api} 请求失败：${res.status}`);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.msg || '接口返回异常');
  return json.data;
}

/* ---------- 3. 获取 URL 查询参数 ---------- */
function yswQuery(name) {
  return new URLSearchParams(location.search).get(name);
}

/* ---------- 4. Toast 轻提示 ---------- */
let yswToastTimer = null;
function yswToast(msg) {
  let el = document.querySelector('.ysw-toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'ysw-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('ysw-toast--show');
  clearTimeout(yswToastTimer);
  yswToastTimer = setTimeout(() => el.classList.remove('ysw-toast--show'), 1800);
}

/* ---------- 5. 底部导航栏渲染 ---------- */
const YSW_TABS = [
  { key: 'index', text: '职位', icon: 'i-job', href: 'index.html' },
  { key: 'company', text: '公司', icon: 'i-company', href: 'company.html' },
  { key: 'chat', text: '消息', icon: 'i-chat', href: 'chat.html' },
  { key: 'my', text: '我的', icon: 'i-user', href: 'my.html' }
];

/**
 * 渲染底部导航栏
 * @param {string} activeKey - 当前激活的 tab key
 */
function yswRenderTabbar(activeKey) {
  const host = document.getElementById('ysw_tabbar');
  if (!host) return;
  host.className = 'ysw-tabbar';
  host.innerHTML = YSW_TABS.map(tab => `
    <a class="ysw-tabbar__item${tab.key === activeKey ? ' ysw-tabbar__item--active' : ''}" href="${tab.href}">
      <svg class="ysw-icon"><use href="#${tab.icon}"></use></svg>
      <span>${tab.text}</span>
      ${tab.key === 'chat' ? '<i class="ysw-tabbar__badge" id="ysw_chat_badge" style="display:none">0</i>' : ''}
    </a>`).join('');

  // 消息未读红点总数
  const total = yswGetChatUnread();
  const badge = document.getElementById('ysw_chat_badge');
  if (badge && total > 0) {
    badge.textContent = total > 99 ? '99+' : total;
    badge.style.display = 'block';
  }
}

/* ---------- 6. localStorage 存取工具 ---------- */
function yswStore(key, val) {
  if (val === undefined) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  }
  localStorage.setItem(key, JSON.stringify(val));
}

/* ---------- 7. 消息未读数（localStorage 持久化，供 tabbar 红点使用） ---------- */
function yswGetChatUnread() {
  return yswStore('ysw_chat_unread') || 0;
}

/* 更新全局未读数（由 chat 页在拉取数据后调用） */
function yswSetChatUnread(total) {
  yswStore('ysw_chat_unread', total);
}

/* ---------- 8. 姓名首字头像（自动配色，无需图片资源） ---------- */
const YSW_AVATAR_COLORS = ['#00a9e0', '#6a5cff', '#ff7a45', '#00bebd', '#ff4e6a', '#2bbf6b', '#5b8cff', '#f5a623'];
function yswAvatarColor(name) {
  let hash = 0;
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return YSW_AVATAR_COLORS[hash % YSW_AVATAR_COLORS.length];
}

function yswAvatarHtml(name, extra) {
  return `<span class="ysw-avatar ${extra || ''}" style="background:${yswAvatarColor(name)}">${String(name).slice(0, 1)}</span>`;
}

/* ---------- 9. 返回顶部（滚动监听显隐 + 平滑滚动） ---------- */
function yswInitBacktop() {
  const btn = document.getElementById('ysw_backtop');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('ysw-backtop--show', window.scrollY > 320);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- 10. 通用返回上一页 ---------- */
function yswGoBack() {
  if (history.length > 1) history.back();
  else location.href = 'index.html';
}
