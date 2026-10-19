# BOSS直聘（手机APP仿制）—— 高级网页设计I 四级项目

> 作者：24001010802 ysw
> 课程：高级网页设计I（大连东软信息学院）
> 说明：基于 BOSS直聘 产品功能、交互逻辑与界面风格的手机 Web APP 仿制项目，仅供课程学习使用。

## 一、项目介绍

本项目以 BOSS直聘 为原型，复刻其核心功能模块、页面布局、交互流程与视觉设计规范，完成一个可运行的移动端 Web 应用（手机APP形态）。

### 页面清单（共 11 页，满足 ≥8 页要求）

| 页面 | 文件 | 层级 | 说明 |
| ---- | ---- | ---- | ---- |
| 首页 | `index.html` | 一级页面 | 轮播图、职位分类宫格、热门职位列表 |
| 搜索 | `search.html` | 二级页面 | 搜索历史、热门搜索、关键词实时搜索、分类筛选 |
| 公司列表 | `company.html` | 二级页面 | 行业筛选、公司卡片列表 |
| 公司详情 | `company-detail.html` | 三级页面 | 公司介绍、在招职位 |
| 职位详情 | `job.html` | 三级页面（内容页） | 职位描述、福利、招聘企业、收藏、立即沟通 |
| 消息 | `chat.html` | 二级页面 | 会话列表、未读红点 |
| 聊天详情 | `chat-detail.html` | 三级页面 | 聊天气泡、发送消息、HR模拟自动回复 |
| 我的 | `my.html` | 个人中心 | 个人资料、数据统计、简历完整度、后台入口 |
| 个人设置 | `settings.html` | 个人设置 | 资料编辑（模态框）、开关设置、清除缓存 |
| 登录 | `login.html` | 其他页面 | 表单校验、验证码倒计时、协议勾选 |
| 后台管理 | `admin.html` | 后台管理页面 | 数据看板、SVG图表、职位增删改查 |

### JavaScript 效果（≥6 个，均有意义）

1. 首页轮播图：自动播放、指示点联动、触摸滑动手势切换
2. 首页职位列表：推荐/最新/高薪选项卡切换 + 滚动触底自动加载更多（模拟分页）
3. 返回顶部：滚动监听显隐 + 平滑滚动
4. 搜索：输入防抖实时搜索、历史记录增删清空（localStorage 持久化）
5. 聊天：发送消息、HR 模拟自动回复、气泡入场动画、滚动定位
6. 收藏职位：图标切换动画 + localStorage 持久化 + Toast 反馈
7. 消息未读红点：跨页面状态同步（tabbar 徽标）
8. 登录：手机号/验证码正则校验、60 秒验证码倒计时、协议勾选拦截
9. 个人设置：资料编辑模态框、开关持久化、清除缓存
10. 后台管理：职位增删改查（localStorage 持久化）、上下架、确认删除、数字滚动动画、柱状图宽度过渡、SVG 折线图绘制动画

### Mock 数据接口（≥4 处，fetch 访问）

统一通过 `js/common.js` 中的 `yswFetch(api)` 封装访问 `data/` 目录接口：

| 接口 | 文件 | 使用页面 |
| ---- | ---- | ---- |
| 职位数据 | `data/jobs.json` | 首页、搜索、职位详情、公司详情、后台管理 |
| 公司数据 | `data/companies.json` | 首页、搜索、公司列表、公司详情、职位详情 |
| 会话数据 | `data/chats.json` | 消息、聊天详情、职位详情（沟通跳转）、我的 |
| 运营统计 | `data/stats.json` | 后台管理（指标卡、图表、简历列表） |

## 二、技术架构

- **技术栈**：纯 HTML5 + CSS3 + 原生 JavaScript（ES6+），**未使用任何第三方 CSS/JS 库**（无 Bootstrap、jQuery、Vue、React、Tailwind 等）
- **布局**：Flex + Grid 弹性布局，未使用 float 布局与表格布局
- **图标**：全部采用本地内联 SVG symbol 图标库（`js/common.js` 注入，`<use>` 引用），无网络图标、无文字截图
- **样式规范**：所有布局选择器均以姓名全拼 `ysw_` 为前缀（如 `ysw_navbar`、`ysw_tabbar`、`ysw_job-card`），CSS 变量统一管理主题色；每个页面标题/注释均包含完整学号姓名
- **数据**：Mock JSON 接口 + `fetch` 异步访问；用户行为数据（搜索历史、收藏、设置、聊天记录、后台改动）使用 `localStorage` 持久化
- **响应式**：APP 容器最大宽度 480px，桌面端居中展示、移动端全屏适配，兼容多视口宽度
- **资源**：全部为本地资源（图片、CSS、JS、SVG），无任何网络依赖

## 三、安装与运行

由于使用了 `fetch` 访问本地 JSON 接口，直接双击打开 HTML 文件会被浏览器 CORS 策略拦截，**必须通过本地 HTTP 服务访问**，任选以下方式之一：

### 方式一：Python（推荐）

```bash
# 在项目根目录执行
python -m http.server 8080
# 浏览器访问
http://localhost:8080
```

### 方式二：VS Code Live Server 插件

在 VS Code 中安装 Live Server 插件，右键 `index.html` → `Open with Live Server`。

### 方式三：Node.js

```bash
npx serve .
```

## 四、目录结构

```
四级项目/
├── index.html            # 首页（一级页面）
├── search.html           # 搜索（二级页面）
├── company.html          # 公司列表（二级页面）
├── company-detail.html   # 公司详情（三级页面）
├── job.html              # 职位详情（三级页面/内容页）
├── chat.html             # 消息（二级页面）
├── chat-detail.html      # 聊天详情（三级页面）
├── my.html               # 我的（个人中心）
├── settings.html         # 个人设置
├── login.html            # 登录
├── admin.html            # 后台管理
├── README.md             # 项目说明
├── css/
│   └── style.css         # 全局样式（ysw_ 前缀选择器）
├── js/
│   ├── common.js         # 公共脚本（SVG图标库/tabbar/fetch封装/Toast等）
│   ├── index.js          # 首页逻辑
│   ├── search.js         # 搜索逻辑
│   ├── company.js        # 公司列表逻辑
│   ├── company-detail.js # 公司详情逻辑
│   ├── job.js            # 职位详情逻辑
│   ├── chat.js           # 消息列表逻辑
│   ├── chat-detail.js    # 聊天详情逻辑
│   ├── my.js             # 我的逻辑
│   ├── settings.js       # 设置逻辑
│   ├── login.js          # 登录逻辑
│   └── admin.js          # 后台管理逻辑
├── data/                 # Mock 数据接口
│   ├── jobs.json         # 职位数据
│   ├── companies.json    # 公司数据
│   ├── chats.json        # 会话数据
│   └── stats.json        # 运营统计数据
├── images/               # 本地图片资源
│   ├── logo.jpg          # 站点logo
│   ├── avatar.jpg        # 用户头像
│   └── company1~8.jpg    # 企业logo
├── js/native-bridge.js   # 原生兼容层（构建时注入 www/，浏览器中自动降级为无操作）
├── scripts/              # 构建脚本（构建 www/、生成图标启动页、原生配置补丁）
├── resources/            # 应用图标与启动页源资源
├── www/                  # 构建产物：真正打进 App 的 Web 资源
├── android/              # Android 原生工程（Capacitor）
├── ios/                  # iOS 原生工程（Capacitor）
├── capacitor.config.json # 应用标识与原生插件配置
├── package.json          # Capacitor 工程与构建脚本
└── MOBILE-BUILD-GUIDE.md # 移动应用构建与部署指南
```

## 五、演示账号

- 手机号：任意 11 位合法手机号（如 `13812340000`）
- 验证码：任意 4 位数字
- 后台管理入口：「我的 → 后台管理」或直接访问 `admin.html`

## 六、移动应用（iOS / Android）

本项目已基于 **Capacitor 8** 改造为可独立运行的跨平台移动应用，**原网页版的全部功能与业务逻辑零删减**，
仅增加了一层原生壳层（`js/native-bridge.js`）与原生工程配置。

- 应用名称：**求职直聘**；包名 / Bundle ID：`com.ysw.zhipin`
- 双端支持：iOS（最低 15.0，Swift Package Manager）+ Android（最低 Android 7.0 / minSdk 24）
- 已配置：应用图标、启动页、权限清单、竖屏锁定、网络安全策略，以及状态栏、软键盘、网络状态、
  Android 物理返回键、触感反馈等系统交互适配
- 原生兼容层：本地存储兜底、相对路径 mock 接口自检、系统交互接管；**在普通浏览器中完全降级为无操作**，
  因此根目录的网页版仍可照常独立运行，不受任何影响

常用命令：

```bash
npm install      # 安装 Capacitor 与原生插件依赖
npm run assets   # 生成应用图标与启动页
npm run sync     # 构建 www/ 并同步到 Android + iOS
npm run preview  # 本地预览构建产物（http://localhost:8765）
```

> 完整的构建流程、真机调试、Android 签名出 AAB/APK、iOS 打包上架流程，以及兼容性测试结论，
> 详见 **[MOBILE-BUILD-GUIDE.md](MOBILE-BUILD-GUIDE.md)**。
