/* ============================================================
   个人设置页逻辑：资料编辑（模态框）、开关持久化（localStorage）、
   清除缓存、退出登录
   作者：24001010802 ysw
   ============================================================ */

const YSW_SW_KEYS = ['ysw_sw_push', 'ysw_sw_sound', 'ysw_sw_hide'];

/* ---------- 1. 资料读取与渲染 ---------- */
function yswGetProfile() {
  return yswStore('ysw_profile') || {};
}

function yswRenderProfile() {
  const p = yswGetProfile();
  document.getElementById('ysw_name_val').textContent = p.name || '求职者';
  document.getElementById('ysw_intent_val').textContent =
    p.job ? `${p.job} / ${p.city || '不限'} / ${p.salary || '面议'}` : '未设置';
  document.getElementById('ysw_phone_val').textContent = p.phone || '138****0000';
}

/* ---------- 2. 模态框工具（打开/关闭） ---------- */
function yswSettingsModalOpen(innerHtml) {
  let mask = document.getElementById('ysw_set_modal');
  if (!mask) {
    mask = document.createElement('div');
    mask.className = 'ysw-modal-mask';
    mask.id = 'ysw_set_modal';
    mask.innerHTML = '<div class="ysw-modal" id="ysw_set_modal_box"></div>';
    mask.addEventListener('click', e => {
      if (e.target === mask) mask.classList.remove('ysw-modal-mask--show');
    });
    document.body.appendChild(mask);
  }
  document.getElementById('ysw_set_modal_box').innerHTML = innerHtml;
  mask.classList.add('ysw-modal-mask--show');
}

function yswSettingsModalClose() {
  const mask = document.getElementById('ysw_set_modal');
  if (mask) mask.classList.remove('ysw-modal-mask--show');
}

/* ---------- 3. 姓名编辑 ---------- */
function yswEditName() {
  const p = yswGetProfile();
  yswSettingsModalOpen(`
    <p class="ysw-modal__head">修改姓名</p>
    <div class="ysw-modal__body">
      <div class="ysw-modal__field">
        <label class="ysw-modal__label">姓名</label>
        <input class="ysw-modal__input" id="ysw_name_input" maxlength="12" value="${p.name || ''}" placeholder="请输入姓名">
      </div>
    </div>
    <div class="ysw-modal__foot">
      <button class="ysw-modal__btn" type="button" onclick="yswSettingsModalClose()">取消</button>
      <button class="ysw-modal__btn ysw-modal__btn--primary" type="button" id="ysw_name_save">保存</button>
    </div>`);
  document.getElementById('ysw_name_save').addEventListener('click', () => {
    const val = document.getElementById('ysw_name_input').value.trim();
    if (!val) return yswToast('姓名不能为空');
    yswStore('ysw_profile', Object.assign(p, { name: val }));
    yswSettingsModalClose();
    yswRenderProfile();
    yswToast('姓名已更新');
  });
}

/* ---------- 4. 求职意向编辑（三字段表单） ---------- */
function yswEditIntent() {
  const p = yswGetProfile();
  yswSettingsModalOpen(`
    <p class="ysw-modal__head">编辑求职意向</p>
    <div class="ysw-modal__body">
      <div class="ysw-modal__field">
        <label class="ysw-modal__label">期望职位</label>
        <input class="ysw-modal__input" id="ysw_intent_job" maxlength="16" value="${p.job || ''}" placeholder="如：前端开发工程师">
      </div>
      <div class="ysw-modal__field">
        <label class="ysw-modal__label">期望城市</label>
        <input class="ysw-modal__input" id="ysw_intent_city" maxlength="10" value="${p.city || ''}" placeholder="如：大连">
      </div>
      <div class="ysw-modal__field">
        <label class="ysw-modal__label">期望薪资</label>
        <input class="ysw-modal__input" id="ysw_intent_salary" maxlength="12" value="${p.salary || ''}" placeholder="如：10-15K">
      </div>
    </div>
    <div class="ysw-modal__foot">
      <button class="ysw-modal__btn" type="button" onclick="yswSettingsModalClose()">取消</button>
      <button class="ysw-modal__btn ysw-modal__btn--primary" type="button" id="ysw_intent_save">保存</button>
    </div>`);
  document.getElementById('ysw_intent_save').addEventListener('click', () => {
    const job = document.getElementById('ysw_intent_job').value.trim();
    const city = document.getElementById('ysw_intent_city').value.trim();
    const salary = document.getElementById('ysw_intent_salary').value.trim();
    if (!job) return yswToast('请填写期望职位');
    yswStore('ysw_profile', Object.assign(p, { job, city, salary }));
    yswSettingsModalClose();
    yswRenderProfile();
    yswToast('求职意向已更新');
  });
}

/* ---------- 5. 开关初始化与持久化（JS效果：开关切换动画） ---------- */
function yswInitSwitches() {
  const switches = document.querySelectorAll('.ysw-switch');
  switches.forEach(sw => {
    sw.classList.toggle('ysw-switch--on', !!yswStore(sw.dataset.key));
    sw.addEventListener('click', () => {
      const on = sw.classList.toggle('ysw-switch--on');
      yswStore(sw.dataset.key, on);
      yswToast(on ? '已开启' : '已关闭');
    });
  });
}

/* ---------- 6. 缓存清理（仅清除浏览类数据，保留资料） ---------- */
function yswInitClearCache() {
  document.getElementById('ysw_clear_cache').addEventListener('click', () => {
    const keys = ['ysw_search_history', 'ysw_read_ids', 'ysw_chat_unread'];
    keys.forEach(k => localStorage.removeItem(k));
    // 会话本地消息
    Object.keys(localStorage).filter(k => k.startsWith('ysw_chat_msgs_')).forEach(k => localStorage.removeItem(k));
    document.getElementById('ysw_cache_size').textContent = '0KB';
    yswToast('缓存已清除');
  });
}

/* ---------- 7. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  yswRenderProfile();
  yswInitSwitches();
  yswInitClearCache();

  document.getElementById('ysw_edit_name').addEventListener('click', yswEditName);
  document.getElementById('ysw_edit_intent').addEventListener('click', yswEditIntent);

  document.getElementById('ysw_check_update').addEventListener('click', () => yswToast('当前已是最新版本 v1.0.0'));

  document.getElementById('ysw_logout').addEventListener('click', () => {
    yswSettingsModalOpen(`
      <p class="ysw-modal__confirm-text">确定要退出当前账号吗？</p>
      <div class="ysw-modal__foot">
        <button class="ysw-modal__btn" type="button" onclick="yswSettingsModalClose()">取消</button>
        <button class="ysw-modal__btn ysw-modal__btn--primary" type="button" id="ysw_set_logout_ok">退出</button>
      </div>`);
    document.getElementById('ysw_set_logout_ok').addEventListener('click', () => {
      yswStore('ysw_logged_in', false);
      location.href = 'login.html';
    });
  });
});
