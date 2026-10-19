/* ============================================================
   “我的”页面逻辑：资料读取（localStorage）、时段问候语、
   收藏数量统计、简历完整度圆环动画、退出登录确认
   作者：24001010802 ysw
   ============================================================ */

/* ---------- 1. 时段问候语（JS效果） ---------- */
function yswGreeting() {
  const h = new Date().getHours();
  let text = '你好，愿好机会不期而遇';
  if (h < 6) text = '夜深了，注意休息哦';
  else if (h < 9) text = '早上好，今天也要元气满满';
  else if (h < 12) text = '上午好，好职位已就位';
  else if (h < 14) text = '午安，休息一下再出发';
  else if (h < 19) text = '下午好，继续加油';
  document.getElementById('ysw_me_greeting').textContent = text;
}

/* ---------- 2. 资料渲染（与设置页共享 localStorage 数据） ---------- */
function yswRenderProfile() {
  const p = yswStore('ysw_profile') || {};
  document.getElementById('ysw_me_name').textContent = p.name || '求职者';

  const intent = p.job ? `${p.job} · ${p.city || '不限'} · ${p.salary || '面议'}` : '';
  document.getElementById('ysw_intent_row').style.display = intent ? 'flex' : 'none';
  document.getElementById('ysw_intent_text').textContent = intent;
}

/* ---------- 3. 统计数据渲染 ---------- */
async function yswRenderStats() {
  const collect = yswStore('ysw_collect') || [];
  document.getElementById('ysw_stat_collect').textContent = collect.length;
  document.getElementById('ysw_collect_desc').textContent = `${collect.length}个`;

  try {
    const chats = await yswFetch('chats');
    document.getElementById('ysw_stat_chat').textContent = chats.length;
  } catch (e) {
    document.getElementById('ysw_stat_chat').textContent = '-';
  }
}

/* ---------- 4. 收藏职位查看（弹层展示收藏列表） ---------- */
async function yswShowCollect() {
  const collect = yswStore('ysw_collect') || [];
  if (!collect.length) return yswToast('暂无收藏职位，去首页看看吧');

  try {
    const jobs = await yswFetch('jobs');
    const list = jobs.filter(j => collect.includes(j.id));
    yswModalOpen(`
      <div class="ysw-modal__body" style="padding-bottom:14px">
        ${list.map(j => `
          <a class="ysw-cell" style="border-bottom:1px solid var(--ysw-line);border-radius:8px" href="job.html?id=${j.id}">
            <span class="ysw-cell__title" style="font-size:14px">${j.name}</span>
            <span style="color:var(--ysw-teal);font-weight:600">${j.salary}</span>
          </a>`).join('')}
      </div>`);
  } catch (e) {
    yswToast('数据加载失败');
  }
}

/* ---------- 5. 通用模态框（收藏列表复用） ---------- */
function yswModalOpen(innerHtml) {
  let mask = document.getElementById('ysw_modal_mask');
  if (!mask) {
    mask = document.createElement('div');
    mask.className = 'ysw-modal-mask ysw-modal-mask--show';
    mask.id = 'ysw_modal_mask';
    mask.innerHTML = `<div class="ysw-modal" id="ysw_modal_box"></div>`;
    mask.addEventListener('click', e => {
      if (e.target === mask) mask.classList.remove('ysw-modal-mask--show');
    });
    document.body.appendChild(mask);
  }
  document.getElementById('ysw_modal_box').innerHTML = innerHtml;
  mask.classList.add('ysw-modal-mask--show');
}

/* ---------- 6. 简历完整度圆环动画（JS效果：SVG描边动画） ---------- */
function yswAnimateRing() {
  const ring = document.getElementById('ysw_ring');
  const C = 2 * Math.PI * 23; // 周长
  ring.setAttribute('stroke-dasharray', C);
  requestAnimationFrame(() => {
    ring.style.strokeDashoffset = C * (1 - 0.85);
  });
}

/* ---------- 7. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  yswRenderTabbar('my');
  yswGreeting();
  yswRenderProfile();
  yswRenderStats();
  yswAnimateRing();

  // 退出登录（确认后清除登录态并跳转）
  document.getElementById('ysw_logout').addEventListener('click', () => {
    yswModalOpen(`
      <p class="ysw-modal__confirm-text">确定要退出当前账号吗？</p>
      <div class="ysw-modal__foot">
        <button class="ysw-modal__btn" type="button" onclick="document.getElementById('ysw_modal_mask').classList.remove('ysw-modal-mask--show')">取消</button>
        <button class="ysw-modal__btn ysw-modal__btn--primary" type="button" id="ysw_logout_ok">退出</button>
      </div>`);
    document.getElementById('ysw_logout_ok').addEventListener('click', () => {
      yswStore('ysw_logged_in', false);
      yswToast('已退出登录');
      setTimeout(() => location.href = 'login.html', 800);
    });
  });
});
