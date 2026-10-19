/* ============================================================
   公司详情页逻辑：按 id 拉取公司信息 + 该公司在招职位列表
   作者：24001010802 ysw
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  yswRenderTabbar('company');
  yswInitBacktop();

  const id = Number(yswQuery('id')) || 1;
  try {
    const [companies, jobs] = await Promise.all([yswFetch('companies'), yswFetch('jobs')]);
    const c = companies.find(x => x.id === id);
    if (!c) throw new Error('公司不存在');

    document.title = `${c.name} - BOSS直聘 | 24001010802 ysw`;
    document.getElementById('ysw_c_logo').src = c.logo;
    document.getElementById('ysw_c_name').textContent = c.name;
    document.getElementById('ysw_c_meta').textContent = `${c.industry} · ${c.scale} · ${c.stage}`;
    document.getElementById('ysw_c_stats').innerHTML =
      `<span class="ysw-company-hero__stat">${c.jobsCount} 在招职位</span>
       <span class="ysw-company-hero__stat">${c.city}</span>
       <span class="ysw-company-hero__stat">${c.stage}</span>`;
    document.getElementById('ysw_c_intro').textContent = c.intro;
    document.getElementById('ysw_c_addr').textContent = c.address;

    // 该公司在招职位
    const cj = jobs.filter(j => j.companyId === c.id);
    document.getElementById('ysw_c_jobcount').textContent = `共${cj.length}个`;
    document.getElementById('ysw_c_jobs').innerHTML = cj.map(job => `
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
      </li>`).join('') || `
      <li class="ysw-empty"><svg class="ysw-icon"><use href="#i-empty"></use></svg><br>该公司暂无在招职位</li>`;
  } catch (err) {
    yswToast(err.message || '数据加载失败');
    setTimeout(yswGoBack, 1500);
  }
});
