/* ============================================================
   聊天详情页逻辑：消息气泡渲染、发送消息、HR模拟自动回复、
   滚动到底部、职位上下文卡片、本地消息持久化
   作者：24001010802 ysw
   ============================================================ */

let yswChat = null;       // 当前会话
let yswChatMessages = []; // 聊天消息（mock 数据 + 本地新增）
let yswLocalMsgs = [];    // 本地新增消息（localStorage 持久化）
let yswLocalKey = '';     // 本地消息存储键

const YSW_AUTO_REPLIES = [
  '收到！方便发一份您的简历过来吗？',
  '好的，我这边帮您和用人部门确认下，稍后回复您~',
  '您的经历和岗位挺匹配的，期待进一步沟通！',
  '没问题，面试时间确定后我第一时间告诉您。'
];

/* ---------- 1. 渲染单条气泡 ---------- */
function yswBubbleHtml(msg, peerName) {
  return `
  ${msg.time ? `<p class="ysw-bubble__time">${msg.time}</p>` : ''}
  <div class="ysw-bubble-row${msg.from === 'me' ? ' ysw-bubble-row--me' : ''}">
    ${msg.from === 'me' ? '' : yswAvatarHtml(peerName, 'ysw-avatar--sm')}
    <div class="ysw-bubble ysw-bubble--${msg.from === 'me' ? 'me' : 'hr'}">${msg.text}</div>
  </div>`;
}

/* ---------- 2. 渲染整个聊天区并滚动到底部 ---------- */
function yswRenderChatBody() {
  const body = document.getElementById('ysw_chat_body');
  body.innerHTML = `
    <div class="ysw-chat-context">
      <p class="ysw-chat-context__job">${yswChat.jobName}<span class="ysw-chat-context__salary">${yswChat.salary}</span></p>
      <p style="margin-top:2px">${yswChat.companyName} · 该职位正在招聘中</p>
    </div>
    ${yswChatMessages.map(m => yswBubbleHtml(m, yswChat.name)).join('')}`;
  body.scrollTop = body.scrollHeight;
}

/* ---------- 3. 获取当前时间（HH:MM） ---------- */
function yswNowTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/* ---------- 4. 发送消息（JS效果：发送 + 模拟HR自动回复） ---------- */
function yswSendMessage() {
  const input = document.getElementById('ysw_chat_input');
  const text = input.value.trim();
  if (!text) return yswToast('请输入消息内容');

  const time = yswNowTime();
  yswChatMessages.push({ from: 'me', text, time });
  yswLocalMsgs.push({ from: 'me', text, time });
  yswStore(yswLocalKey, yswLocalMsgs);
  input.value = '';
  yswRenderChatBody();

  // 模拟HR在一秒后自动回复
  const sendBtn = document.getElementById('ysw_chat_send');
  sendBtn.disabled = true;
  setTimeout(() => {
    const reply = YSW_AUTO_REPLIES[Math.floor(Math.random() * YSW_AUTO_REPLIES.length)];
    yswChatMessages.push({ from: 'hr', text: reply });
    yswLocalMsgs.push({ from: 'hr', text: reply });
    yswStore(yswLocalKey, yswLocalMsgs);
    yswRenderChatBody();
    sendBtn.disabled = false;
    input.focus();
  }, 1000);
}

/* ---------- 5. 标记当前会话已读 ---------- */
function yswMarkReadNow() {
  const ids = yswStore('ysw_read_ids') || [];
  if (!ids.includes(yswChat.id)) {
    ids.push(yswChat.id);
    yswStore('ysw_read_ids', ids);
  }
}

/* ---------- 6. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  const id = Number(yswQuery('id')) || 1;
  try {
    const chats = await yswFetch('chats');
    yswChat = chats.find(c => c.id === id);
    if (!yswChat) throw new Error('会话不存在');

    document.title = `${yswChat.name} - BOSS直聘 | 24001010802 ysw`;
    document.getElementById('ysw_peer_name').textContent = `${yswChat.name}·${yswChat.role}`;
    document.getElementById('ysw_peer_status').textContent = yswChat.companyName;

    // 合并 mock 消息与本地新增消息（刷新不丢失）
    yswLocalKey = `ysw_chat_msgs_${yswChat.id}`;
    yswLocalMsgs = yswStore(yswLocalKey) || [];
    yswChatMessages = yswChat.messages.concat(yswLocalMsgs);
    yswRenderChatBody();
    yswMarkReadNow();
    yswRenderTabbar('chat');

    const input = document.getElementById('ysw_chat_input');
    document.getElementById('ysw_chat_send').addEventListener('click', yswSendMessage);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') yswSendMessage(); });
  } catch (err) {
    document.getElementById('ysw_chat_body').innerHTML =
      `<div class="ysw-empty" style="padding-top:40%"><svg class="ysw-icon"><use href="#i-warn"></use></svg><br>${err.message || '数据加载失败'}</div>`;
  }
});
