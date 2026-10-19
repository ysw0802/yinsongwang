/* ============================================================
   职位详情页逻辑：按 id 拉取数据、收藏切换（localStorage）、
   立即沟通跳转、相似职位推荐
   作者：24001010802 ysw
   ============================================================ */

let yswJob = null; // 当前职位数据

/* ---------- 1. 渲染职位详情 ---------- */
function yswRenderJob(job, company) {
  document.title = `${job.name} - BOSS直聘 | 24001010802 ysw`;
  document.getElementById('ysw_job_title').textContent = job.name;
  document.getElementById('ysw_job_salary').textContent = job.salary;
  document.getElementById('ysw_job_addr').textContent = `${job.city}市${job.area} · ${job.address}`;

  document.getElementById('ysw_job_meta').innerHTML =
    [job.exp, job.edu, job.category + '类'].map(t => `<span class="ysw-tag">${t}</span>`).join('') +
    job.tags.map(t => `<span class="ysw-tag">${t}</span>`).join('');

  document.getElementById('ysw_job_welfare').innerHTML =
    job.welfare.map(w => `<span class="ysw-welfare__item">${w}</span>`).join('');

  document.getElementById('ysw_job_desc').textContent = job.desc;

  // 公司信息
  document.getElementById('ysw_company_link').href = `company-detail.html?id=${company.id}`;
  document.getElementById('ysw_company_logo').src = company.logo;
  document.getElementById('ysw_company_name').textContent = company.name;
  document.getElementById('ysw_company_meta').textContent = `${company.industry} · ${company.scale} · ${company.stage}`;

  // HR 卡片
  document.getElementById('ysw_hr_card').innerHTML = `
    ${yswAvatarHtml(job.hr.name)}
    <div>
      <p style="font-size:14.5px;font-weight:600">${job.hr.name} · ${job.hr.role}</p>
      <p style="font-size:12px;color:var(--ysw-text-light);margin-top:2px">
        <span style="color:var(--ysw-green)">● </span>${job.hr.active} · 沟通活跃
      </p>
    </div>`;
}

/* ---------- 2. 相似职位（同类别，最多3条） ---------- */
function yswRenderSimilar(allJobs, curJob) {
  const list = allJobs.filter(j => j.category === curJob.category && j.id !== curJob.id).slice(0, 3);
  document.getElementById('ysw_similar_list').innerHTML = list.map(job => `
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
      </a>
    </li>`).join('') ||
    '<li class="ysw-empty"><svg class="ysw-icon"><use href="#i-empty"></use></svg><br>暂无更多相似职位</li>';
}

/* ---------- 3. 收藏切换（JS效果：localStorage 持久化 + 图标动画 + toast） ---------- */
function yswInitCollect() {
  const btn = document.getElementById('ysw_collect_btn');
  const icon = btn.querySelector('use');
  const label = btn.querySelector('span');

  function paint() {
    const list = yswStore('ysw_collect') || [];
    const on = list.includes(yswJob.id);
    btn.classList.toggle('ysw-actionbar__collect--on', on);
    icon.setAttribute('href', on ? '#i-star-fill' : '#i-star');
    label.textContent = on ? '已收藏' : '收藏';
  }

  btn.addEventListener('click', () => {
    const list = yswStore('ysw_collect') || [];
    const idx = list.indexOf(yswJob.id);
    if (idx > -1) {
      list.splice(idx, 1);
      yswToast('已取消收藏');
    } else {
      list.push(yswJob.id);
      yswToast('收藏成功，可在“我的”中查看');
      btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 300 });
    }
    yswStore('ysw_collect', list);
    paint();
  });

  paint();
}

/* ---------- 4. 立即沟通（跳转到对应聊天，若无则进入通用会话） ---------- */
function yswInitChatBtn(chatId) {
  document.getElementById('ysw_chat_btn').addEventListener('click', () => {
    location.href = `chat-detail.html?id=${chatId}`;
  });
}

/* ---------- 5. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  const id = Number(yswQuery('id')) || 1;
  try {
    const [jobs, companies, chats] = await Promise.all([
      yswFetch('jobs'), yswFetch('companies'), yswFetch('chats')
    ]);
    yswJob = jobs.find(j => j.id === id);
    if (!yswJob) throw new Error('职位不存在');

    const company = companies.find(c => c.id === yswJob.companyId);
    const chat = chats.find(c => c.jobId === yswJob.id);

    yswRenderJob(yswJob, company);
    yswRenderSimilar(jobs, yswJob);
    yswInitCollect();
    yswInitChatBtn(chat ? chat.id : 1);
  } catch (err) {
    yswToast(err.message || '数据加载失败');
    setTimeout(yswGoBack, 1500);
  }
});
