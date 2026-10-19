/* ============================================================
   登录页逻辑：手机号/验证码校验（正则）、验证码60秒倒计时、
   协议勾选、登录态写入
   作者：24001010802 ysw
   ============================================================ */

let yswAgreeFlag = false;      // 是否勾选协议
let yswCodeCountdown = null;   // 倒计时句柄

/* ---------- 1. 表单错误提示 ---------- */
function yswShowError(msg) {
  document.getElementById('ysw_form_error').textContent = msg;
}

/* ---------- 2. 验证码倒计时（JS效果：定时器 + 按钮禁用） ---------- */
function yswStartCountdown() {
  const btn = document.getElementById('ysw_code_btn');
  const phone = document.getElementById('ysw_phone_input').value.trim();

  if (!/^1[3-9]\d{9}$/.test(phone)) {
    return yswShowError('请输入正确的11位手机号');
  }
  yswShowError('');
  yswToast('验证码已发送（演示：任意4位数字）');

  let left = 60;
  btn.disabled = true;
  btn.textContent = `${left}s后重发`;
  yswCodeCountdown = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(yswCodeCountdown);
      btn.disabled = false;
      btn.textContent = '获取验证码';
    } else {
      btn.textContent = `${left}s后重发`;
    }
  }, 1000);
}

/* ---------- 3. 协议勾选切换（JS效果） ---------- */
function yswInitAgreement() {
  document.getElementById('ysw_agree_check').addEventListener('click', function (e) {
    e.preventDefault();
    yswAgreeFlag = !yswAgreeFlag;
    this.classList.toggle('ysw-agreement__check--on', yswAgreeFlag);
  });
}

/* ---------- 4. 登录校验与跳转 ---------- */
function yswDoLogin() {
  const phone = document.getElementById('ysw_phone_input').value.trim();
  const code = document.getElementById('ysw_code_input').value.trim();

  if (!/^1[3-9]\d{9}$/.test(phone)) return yswShowError('请输入正确的11位手机号');
  if (!/^\d{4}$/.test(code)) return yswShowError('请输入4位数字验证码');
  if (!yswAgreeFlag) return yswShowError('请先阅读并勾选用户协议');

  yswShowError('');
  yswStore('ysw_logged_in', true);
  const p = yswStore('ysw_profile') || {};
  yswStore('ysw_profile', Object.assign({ name: '杨同学', job: '前端开发工程师', city: '大连', salary: '10-15K', phone }, p, { phone }));
  yswToast('登录成功');
  setTimeout(() => location.href = 'my.html', 700);
}

/* ---------- 5. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('ysw_code_btn').addEventListener('click', yswStartCountdown);
  document.getElementById('ysw_login_btn').addEventListener('click', yswDoLogin);
  yswInitAgreement();

  // 回车快捷登录
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter') yswDoLogin();
  });

  // 已登录用户免登
  if (yswStore('ysw_logged_in')) {
    location.href = 'my.html';
  }
});
