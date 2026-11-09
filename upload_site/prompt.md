# 课堂任务 6 · 与 AI 的关键对话记录

> 作    者：尹松旺
> 建立时间：2026-11-09
> 使用模型：Kimi-K3
> 功能简介：记录课堂任务 6（Swiper 综合实践）三个任务中与 AI 的提示词对话、AI 回答及验证结论，作为"禁止复制即交"的答辩留痕材料。

---

## 任务一 · 提示词工程师：让 AI 听懂需求

**需求：** 让 AI 生成 `new Swiper('#wySw4', {...})` 配置：
① 无循环 ② 3.2 秒自动翻页且手动操作后不停 ③ 圆点分页器可点击 ④ 初始效果为 cube

---

### 第 1 轮提示词（我）

> 请帮我用 Swiper 初始化一个轮播 #wySw4，要求：
> ① 不要循环
> ② 3.2 秒自动翻页，用户操作后不要停
> ③ 底部小圆点可以点击跳转
> ④ 初始切换效果是 cube 立方体。

### AI 第 1 轮回答

```js
var swiper = new Swiper('#wySw4', {
    loop: true,
    effect: 'cube',
    autoplay: { delay: 3200 },
    pagination: { el: '.swiper-pagination' }
});
```

### 我对第 1 轮的审查（发现 3 处错误）

1. `loop: true` —— 我明确说"不要循环"，应改为 `loop: false`；
2. `autoplay` 缺 `disableOnInteraction: false` —— 用户操作后自动播放会停止；
3. `pagination` 缺 `clickable: true` —— 圆点不可点击；
4. （附加）`pagination.el` 用了类选择器 `.swiper-pagination`，应指定为 `#wyPag4`。

### 第 2 轮提示词（我纠正）

> 你给的代码有三处错误：
> ① 我明确说"不要循环"，你写了 `loop: true`，应改为 `loop: false` 或不写；
> ② `autoplay` 缺 `disableOnInteraction: false`，用户操作后自动播放会停止；
> ③ `pagination` 缺 `clickable: true`，圆点不可点击。
> 请用正确参数重写，并把分页器 el 改为 `#wyPag4`。

### AI 第 2 轮回答（修正后）

```js
var swiper = new Swiper('#wySw4', {
    loop: false,
    effect: 'cube',
    autoplay: { delay: 3200, disableOnInteraction: false },
    pagination: { el: '#wyPag4', clickable: true }
});
```

### 验证结论

第 2 轮代码粘进页面后全部满足：无循环（最后一张不能再往后翻）、3.2s 自动翻页、拖动后不停、圆点可点击跳转、cube 3D 效果。✅

### 答辩抽问准备

| 问题 | 答案 |
|---|---|
| 你的第一句话给 AI 翻译了哪个需求？ | 翻译了"初始效果为 cube"（`effect: 'cube'`） |
| 你是怎么在第二轮里说清楚的？ | 逐条指出 AI 三处错误并给出正确参数值（`loop: false` / `disableOnInteraction: false` / `clickable: true`），同时修正 `el` 选择器 |
| AI 第一次给的代码错在哪？ | `loop` 写反、`autoplay` 缺 `disableOnInteraction`、`pagination` 缺 `clickable`，且 `el` 用了类选择器而非指定 id |

---

## 任务二 · creative 仿写：课堂没讲，AI 教你

**需求：** 读懂 Swiper 第 7 种 effect —— `creative`（自定义变换），用 `creativeEffect` 的 `prev` / `next` `transform` 实现"影视墙"效果（上一张缩小左移带角度、下一张右移进场）。

### 提示词（我）

> 课堂上只讲了 6 种 effect，Swiper 还有第 7 种 creative。请打开官方示例 swiper/demo/257-effect-creative.html，帮我读懂 creativeEffect 的 transform 写法。我要做一个"影视墙"效果：上一张缩小左移并带角度、下一张放大右移进场（像电影海报墙）。请给出配置代码。

### AI 回答

```js
new Swiper('#wySw4', {
    effect: 'creative',
    creativeEffect: {
        prev: {
            translate: ['-30%', 0, -200],  // 上一张：左移 30%，向后退 200px
            scale: 0.7,                     // 缩小到 70%
            rotate: -15,                    // 向左倾斜 15 度
            shadow: true
        },
        next: {
            translate: ['60%', 0, -100],   // 下一张：右移 60%，向后退 100px
            scale: 0.85,                    // 略小，激活时放大进场
            rotate: 10                      // 向右倾斜 10 度
        }
    }
});
```

### 追问 1（我）

> `creativeEffect.prev.transform` 和 `next.transform` 分别控制什么？百分比是相对谁的？

### AI 回答

`creativeEffect.prev` 控制**上一张（当前 slide 左侧）**的样式，`next` 控制**下一张（右侧）**。`transform` 是数组 `[x, y, z]`，单位可以是 px 或**百分比字符串**（如 `'-30%'`）。百分比是相对于**当前 slide 自身的宽高**计算的：x 方向的 % 相对 slide 宽度，y 方向相对 slide 高度。z 只能是 px（3D 深度）。

### 追问 2（我）

> 怎么让卡片旋转 20 度？

### AI 回答

在 `prev` 或 `next` 对象里加 `rotate: 20`（单位是度）。例如 `next: { translate: ['60%', 0, -100], scale: 0.85, rotate: 20 }` 就能让右侧的下一张卡片倾斜 20 度。改数值后 Swiper 会自动应用。

### 验证结论

点击 creative 按钮后，`#wySw4` 容器获得 `swiper-creative swiper-3d` 类，上一张缩小左移带角度、下一张从右放大进场，呈现电影海报墙效果。✅

### 答辩抽问准备

| 问题 | 答案 |
|---|---|
| transform 里的百分号相对谁？ | 相对当前 slide 自身的宽高：x 方向 % 相对 slide 宽度，y 方向相对 slide 高度 |
| 改一个数值让卡片转 20 度？ | 在 `prev` 或 `next` 里加/改 `rotate: 20`（单位度） |
| prev / next 各控制什么？ | `prev` 控制上一张（左侧）的变换，`next` 控制下一张（右侧）的变换 |

---

## 任务三 · 综合创作 + 技术答辩：超纲加分项

**需求：**
① 为光影展添加第六件展品——爱达魔都号（首艘国产大型邮轮，2024 年 1 月首航），图片用 AI 生成（横版 16:9），slide 结构完整；
② 挑一个课堂上没讲过的 Swiper 能力加上去（选了 keyboard 键盘控制）。

### 提示词（我）

> 我想给 Swiper 加键盘左右方向键控制，怎么写？课堂上没讲过这个功能。

### AI 第一次回答

```js
new Swiper('.swiper', {
    keyboard: true
});
```

### 我对第一次回答的审查

`keyboard: true` 虽然能开启键盘，但缺少 `onlyInViewport` 选项。如果页面上有多个轮播，所有轮播会同时响应键盘，造成冲突。需要用对象形式并加 `onlyInViewport: true`。

### 追问（我）

> `keyboard: true` 太简单了，如果页面上有多个轮播会冲突。请用对象形式配置，并解释每个参数的作用。

### AI 第二次回答（修正后）

```js
new Swiper('#wySw4', {
    keyboard: {
        enabled: true,              // 开启键盘控制
        onlyInViewport: true        // 只有轮播在可视区域内时才响应键盘
    }
});
```

`enabled` 开启键盘控制；`onlyInViewport` 表示只有当轮播在可视区域内时才响应键盘事件，避免页面上多个轮播同时响应。用户需要先点击轮播区域让它获得焦点，然后按 ← / → 方向键切换。

### 爱达魔都号图片生成提示词（我）

> Website carousel slide image for a 'Great Power Instruments' exhibition: The AIDAmodu (爱达魔都号), China's first domestically built large cruise ship, sailing on the blue ocean under clear sky with white clouds, January 2024 maiden voyage, photorealistic, high definition, majestic and proud atmosphere, cinematic lighting, wide angle shot

（图片规格：landscape_16_9，生成尺寸 2560×1440，保存为 `swiper-imgs/aidamodu.jpg`）

### 验证结论

- 任务四轮播现有 6 张 slide，第 6 张为爱达魔都号，图片加载正常（2560×1440）；
- 点击轮播区域后按键盘 ← / → 可切换上一张/下一张；
- 切换效果按钮时（含 creative），keyboard 控制依然有效。✅

### 答辩四连问准备

| 问题 | 答案 |
|---|---|
| 这段代码什么意思？ | `keyboard: { enabled: true, onlyInViewport: true }` 开启键盘控制，仅当轮播在视口内且获得焦点时响应左右方向键 |
| AI 第一次给的哪里不对？ | AI 只给了 `keyboard: true`，缺少 `onlyInViewport`，页面多个轮播会同时响应造成冲突 |
| 你改了什么？新参数的作用？ | 改为对象形式并加 `onlyInViewport: true`，限制只有当前可见轮播响应键盘 |
| 现场把 delay 改成指定值并解释预期变化？ | `autoplay.delay` 改 `1500` → 每张停留 1.5 秒，翻页更快；改 `5000` → 每张停留 5 秒，翻页更慢 |

---

## 思政升华

> 给重器一个舞台：这节课我们学的只是一个轮播组件，但请记住——技术没有温度，用技术的人才让它有了温度。天眼之父南仁东用 22 年把"不可能"变成"中国天眼"；你们用今天的每一段代码，练就明天为中国发声的本领。轮播终会翻页，但奋斗者的故事永远自动播放。
