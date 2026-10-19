/* ============================================================
   后台管理页逻辑：数据概览（指标卡/柱状图/SVG折线图）+ 
   职位管理（增删改查，localStorage 持久化，模态框交互）
   作者：24001010802 ysw
   ============================================================ */

let yswAdminJobs = [];     // 职位管理数据（fetch + 本地修改合并）
let yswAdminView = 'dash'; // 当前视图

/* ---------- 1. 页内导航切换（JS效果：tab切换） ---------- */
function yswInitAdminNav() {
  document.querySelector('.ysw-admin-nav').addEventListener('click', e => {
    const item = e.target.closest('.ysw-admin-nav__item');
    if (!item) return;
    document.querySelectorAll('.ysw-admin-nav__item').forEach(el => el.classList.remove('ysw-admin-nav__item--active'));
    item.classList.add('ysw-admin-nav__item--active');
    yswAdminView = item.dataset.view;
    document.getElementById('ysw_view_dash').style.display = yswAdminView === 'dash' ? 'block' : 'none';
    document.getElementById('ysw_view_jobs').style.display = yswAdminView === 'jobs' ? 'block' : 'none';
  });
}

/* ---------- 2. 指标卡片渲染（数字滚动动画） ---------- */
function yswRenderStatCards(overview) {
  document.getElementById('ysw_stat_cards').innerHTML = overview.map((s, i) => `
    <div class="ysw-stat-card">
      <p class="ysw-stat-card__label">${s.label}<span class="ysw-stat-card__trend">${s.trend}</span></p>
      <p class="ysw-stat-card__val"><span data-target="${s.value}">0</span><em>${s.unit}</em></p>
    </div>`).join('');

  // 数字滚动动画（requestAnimationFrame 补间）
  document.querySelectorAll('.ysw-stat-card [data-target]').forEach(el => {
    const target = Number(el.dataset.target);
    const start = performance.now();
    const dur = 800;
    (function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  });
}

/* ---------- 3. 分类柱状图（宽度过渡动画） ---------- */
function yswRenderBarChart(chartData) {
  const max = Math.max(...chartData.map(d => d.count));
  document.getElementById('ysw_chart_bars').innerHTML = chartData.map(d => `
    <div class="ysw-chart__row">
      <span class="ysw-chart__label">${d.category}</span>
      <div class="ysw-chart__track"><div class="ysw-chart__bar" data-w="${(d.count / max * 100).toFixed(1)}"></div></div>
      <span class="ysw-chart__val">${d.count}</span>
    </div>`).join('');

  requestAnimationFrame(() => {
    document.querySelectorAll('.ysw-chart__bar').forEach(bar => {
      bar.style.width = bar.dataset.w + '%';
    });
  });
}

/* ---------- 4. 本周沟通趋势 SVG 折线图（JS绘制） ---------- */
function yswRenderLineChart(weekly) {
  const svg = document.getElementById('ysw_chart_line');
  const W = 340, H = 150, PAD = 24;
  const max = Math.max(...weekly.map(d => d.value));
  const stepX = (W - PAD * 2) / (weekly.length - 1);

  const pts = weekly.map((d, i) => [PAD + i * stepX, H - PAD - (d.value / max) * (H - PAD * 2)]);
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${pts[pts.length - 1][0]},${H - PAD} L${pts[0][0]},${H - PAD} Z`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="ysw_line_grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00a9e0" stop-opacity="0.28"/>
        <stop offset="100%" stop-color="#00a9e0" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${area}" fill="url(#ysw_line_grad)"/>
    <path d="${path}" fill="none" stroke="#00a9e0" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          stroke-dasharray="900" stroke-dashoffset="900" style="animation:ysw_line_draw 1.2s ease forwards"/>
    ${pts.map((p, i) => `
      <circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#fff" stroke="#00a9e0" stroke-width="2">
        <title>${weekly[i].day}：${weekly[i].value}次</title>
      </circle>
      <text x="${p[0]}" y="${H - 8}" font-size="10" fill="#9ba1a8" text-anchor="middle">${weekly[i].day}</text>
      <text x="${p[0]}" y="${p[1] - 8}" font-size="10" fill="#00a9e0" text-anchor="middle">${weekly[i].value}</text>`).join('')}
  `;
  // 折线绘制动画
  const style = document.createElement('style');
  style.textContent = '@keyframes ysw_line_draw{to{stroke-dashoffset:0}}';
  if (!document.getElementById('ysw_line_anim_style')) {
    style.id = 'ysw_line_anim_style';
    document.head.appendChild(style);
  }
}

/* ---------- 5. 最新简历列表 ---------- */
function yswRenderResumes(latestResumes) {
  document.getElementById('ysw_resume_list').innerHTML = latestResumes.map(r => `
    <div class="ysw-cell" style="padding:11px 0">
      ${yswAvatarHtml(r.name, 'ysw-avatar--sm')}
      <span class="ysw-cell__title" style="font-size:13.5px">${r.name}<span style="font-size:11px;color:var(--ysw-text-light)"> 应聘 ${r.job}</span></span>
      <span class="ysw-cell__desc">${r.time.slice(5)}</span>
      <span class="ysw-status-tag ${r.status === '待查看' ? 'ysw-status-tag--off' : 'ysw-status-tag--on'}">${r.status}</span>
    </div>`).join('');
}

/* ---------- 6. 职位管理数据（localStorage 优先，首次从接口加载） ---------- */
async function yswLoadAdminJobs() {
  const local = yswStore('ysw_admin_jobs');
  if (local && local.length) {
    yswAdminJobs = local;
  } else {
    yswAdminJobs = await yswFetch('jobs');
  }
}

function yswSaveAdminJobs() {
  yswStore('ysw_admin_jobs', yswAdminJobs);
}

/* ---------- 7. 职位列表渲染 ---------- */
function yswRenderAdminJobs() {
  const rows = document.getElementById('ysw_admin_rows');
  rows.innerHTML = yswAdminJobs.map((j, i) => `
    <div class="ysw-admin-row">
      <span class="ysw-col-name"><i class="ysw-status-tag ysw-status-tag--on" style="background:rgba(0,169,224,.1);color:var(--ysw-primary)">${j.category}</i><span>${j.name}</span></span>
      <span class="ysw-col-salary">${j.salary}</span>
      <span class="ysw-col-status"><span class="ysw-status-tag ${j.off ? 'ysw-status-tag--off' : 'ysw-status-tag--on'}">${j.off ? '已下架' : '在招'}</span></span>
      <span class="ysw-col-ops">
        <button class="ysw-op-btn" type="button" data-act="toggle" data-i="${i}">${j.off ? '上架' : '下架'}</button>
        <button class="ysw-op-btn" type="button" data-act="edit" data-i="${i}">编辑</button>
        <button class="ysw-op-btn ysw-op-btn--del" type="button" data-act="del" data-i="${i}">删除</button>
      </span>
    </div>`).join('') || `
    <div class="ysw-empty"><svg class="ysw-icon"><use href="#i-empty"></use></svg><br>暂无职位，点击下方按钮新增</div>`;
}

/* ---------- 8. 模态框工具 ---------- */
function yswAdminModalOpen(innerHtml) {
  let mask = document.getElementById('ysw_admin_modal');
  if (!mask) {
    mask = document.createElement('div');
    mask.className = 'ysw-modal-mask';
    mask.id = 'ysw_admin_modal';
    mask.innerHTML = '<div class="ysw-modal"></div>';
    mask.addEventListener('click', e => {
      if (e.target === mask) mask.classList.remove('ysw-modal-mask--show');
    });
    document.body.appendChild(mask);
  }
  mask.querySelector('.ysw-modal').innerHTML = innerHtml;
  mask.classList.add('ysw-modal-mask--show');
}

function yswAdminModalClose() {
  const mask = document.getElementById('ysw_admin_modal');
  if (mask) mask.classList.remove('ysw-modal-mask--show');
}

/* ---------- 9. 新增/编辑职位（共用表单模态框） ---------- */
function yswAdminEditJob(index) {
  const isAdd = index === -1;
  const job = isAdd
    ? { name: '', salary: '', city: '', category: '技术', desc: '岗位职责面谈。', exp: '1-3年', edu: '本科', area: '', companyId: 1, tags: [], welfare: [], hr: { name: '王女士', role: 'HR', active: '在线' }, date: new Date().toISOString().slice(0, 10) }
    : yswAdminJobs[index];

  yswAdminModalOpen(`
    <p class="ysw-modal__head">${isAdd ? '新增职位' : '编辑职位'}</p>
    <div class="ysw-modal__body">
      <div class="ysw-modal__field">
        <label class="ysw-modal__label">职位名称</label>
        <input class="ysw-modal__input" id="ysw_f_name" maxlength="20" value="${job.name}" placeholder="如：前端开发工程师">
      </div>
      <div class="ysw-modal__field">
        <label class="ysw-modal__label">薪资</label>
        <input class="ysw-modal__input" id="ysw_f_salary" maxlength="16" value="${job.salary}" placeholder="如：10-15K">
      </div>
      <div class="ysw-modal__field">
        <label class="ysw-modal__label">城市</label>
        <input class="ysw-modal__input" id="ysw_f_city" maxlength="10" value="${job.city}" placeholder="如：大连">
      </div>
      <div class="ysw-modal__field">
        <label class="ysw-modal__label">分类</label>
        <select class="ysw-modal__input" id="ysw_f_category">
          ${['技术', '产品', '设计', '运营', '销售', '职能'].map(c =>
            `<option value="${c}" ${c === job.category ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="ysw-modal__foot">
      <button class="ysw-modal__btn" type="button" onclick="yswAdminModalClose()">取消</button>
      <button class="ysw-modal__btn ysw-modal__btn--primary" type="button" id="ysw_f_save">保存</button>
    </div>`);

  document.getElementById('ysw_f_save').addEventListener('click', () => {
    const name = document.getElementById('ysw_f_name').value.trim();
    const salary = document.getElementById('ysw_f_salary').value.trim();
    const city = document.getElementById('ysw_f_city').value.trim();
    const category = document.getElementById('ysw_f_category').value;
    if (!name) return yswToast('请填写职位名称');
    if (!salary) return yswToast('请填写薪资范围');
    if (!city) return yswToast('请填写城市');

    Object.assign(job, { name, salary, city, category });
    if (isAdd) yswAdminJobs.unshift(job);
    yswSaveAdminJobs();
    yswAdminModalClose();
    yswRenderAdminJobs();
    yswToast(isAdd ? '新增职位成功' : '保存成功');
  });
}

/* ---------- 10. 删除职位（确认模态框） ---------- */
function yswAdminDelJob(index) {
  const job = yswAdminJobs[index];
  yswAdminModalOpen(`
    <p class="ysw-modal__confirm-text">确定删除职位「${job.name}」吗？<br><span style="font-size:12px;color:var(--ysw-text-light)">删除后不可恢复</span></p>
    <div class="ysw-modal__foot">
      <button class="ysw-modal__btn" type="button" onclick="yswAdminModalClose()">取消</button>
      <button class="ysw-modal__btn ysw-modal__btn--primary" type="button" style="color:var(--ysw-red)" id="ysw_del_ok">删除</button>
    </div>`);
  document.getElementById('ysw_del_ok').addEventListener('click', () => {
    yswAdminJobs.splice(index, 1);
    yswSaveAdminJobs();
    yswAdminModalClose();
    yswRenderAdminJobs();
    yswToast('职位已删除');
  });
}

/* ---------- 11. 上架/下架 ---------- */
function yswAdminToggleJob(index) {
  const job = yswAdminJobs[index];
  job.off = !job.off;
  yswSaveAdminJobs();
  yswRenderAdminJobs();
  yswToast(job.off ? '职位已下架' : '职位已上架');
}

/* ---------- 12. 操作事件绑定（事件委托） ---------- */
function yswInitJobOps() {
  document.getElementById('ysw_admin_rows').addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const i = Number(btn.dataset.i);
    if (btn.dataset.act === 'edit') yswAdminEditJob(i);
    else if (btn.dataset.act === 'del') yswAdminDelJob(i);
    else if (btn.dataset.act === 'toggle') yswAdminToggleJob(i);
  });
  document.getElementById('ysw_admin_add').addEventListener('click', () => yswAdminEditJob(-1));
}

/* ---------- 13. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  yswInitAdminNav();
  yswInitJobOps();

  try {
    const [stats] = await Promise.all([yswFetch('stats'), yswLoadAdminJobs()]);
    yswRenderStatCards(stats.overview);
    yswRenderBarChart(stats.categoryChart);
    yswRenderLineChart(stats.weeklyLine);
    yswRenderResumes(stats.latestResumes);
    yswRenderAdminJobs();
  } catch (err) {
    yswToast('数据加载失败，请检查本地服务');
  }
});
