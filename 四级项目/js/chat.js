/* ============================================================
   消息列表页逻辑：会话渲染、未读数计算与红点同步、
   点击进入聊天详情（记录已读）
   作者：24001010802 ysw
   ============================================================ */

/* ---------- 1. 已读集合（localStorage） ---------- */
function yswGetReadIds() {
  return yswStore('ysw_read_ids') || [];
}

function yswMarkRead(id) {
  const ids = yswGetReadIds();
  if (!ids.includes(id)) {
    ids.push(id);
    yswStore('ysw_read_ids', ids);
  }
}

/* ---------- 2. 渲染会话列表 ---------- */
function yswRenderChats(chats) {
  const readIds = yswGetReadIds();
  let unreadTotal = 0;

  const html = chats.map(c => {
    const unread = readIds.includes(c.id) ? 0 : c.unread;
    unreadTotal += unread;
    return `
    <div class="ysw-chat-item" data-id="${c.id}">
      <span class="ysw-chat-item__avatar-wrap">
        ${yswAvatarHtml(c.name)}
        ${unread ? `<i class="ysw-badge ysw-chat-item__badge">${unread}</i>` : ''}
      </span>
      <div class="ysw-chat-item__info">
        <div class="ysw-chat-item__row">
          <span class="ysw-chat-item__name">${c.name}·${c.role}</span>
          <span class="ysw-chat-item__time">${c.time}</span>
        </div>
        <p class="ysw-chat-item__msg">${c.lastMsg}</p>
      </div>
    </div>`;
  }).join('');

  document.getElementById('ysw_chat_list').innerHTML = html;
  document.getElementById('ysw_unread_tip').textContent =
    unreadTotal ? `${unreadTotal} 条未读消息` : '沟通记录实时同步';

  // 同步全局未读数（tabbar 红点）
  yswSetChatUnread(unreadTotal);
  yswRenderTabbar('chat');

  // 点击进入聊天详情
  document.getElementById('ysw_chat_list').addEventListener('click', e => {
    const item = e.target.closest('.ysw-chat-item');
    if (!item) return;
    yswMarkRead(Number(item.dataset.id));
    location.href = `chat-detail.html?id=${item.dataset.id}`;
  });
}

/* ---------- 3. 页面初始化 ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  yswRenderTabbar('chat');
  yswInitBacktop();
  document.getElementById('ysw_chat_list').innerHTML =
    '<div class="ysw-loading"><span class="ysw-spinner"></span>加载中...</div>';

  try {
    const chats = await yswFetch('chats');
    yswRenderChats(chats);
  } catch (err) {
    document.getElementById('ysw_chat_list').innerHTML =
      `<div class="ysw-empty"><svg class="ysw-icon"><use href="#i-warn"></use></svg><br>数据加载失败，请检查本地服务</div>`;
  }
});
