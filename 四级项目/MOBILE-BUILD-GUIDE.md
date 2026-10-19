# 求职直聘 —— 移动应用（iOS / Android）构建与部署指南

> 作者：24001010802 ysw
> 课程：高级网页设计I（大连东软信息学院）
> 说明：本文档说明如何把 BOSS直聘手机APP仿制项目（网页版）打包为可独立运行的 iOS / Android 原生应用，
> 包含环境准备、资源生成、真机调试、出包签名与上架流程，以及原生兼容层与兼容性测试结论。

---

## 一、交付概览

| 项目 | 值 |
| ---- | ---- |
| 应用显示名 | 求职直聘 |
| 包名 / Bundle ID | `com.ysw.zhipin` |
| 版本号 | versionName `1.0` / versionCode `1`（iOS MARKETING_VERSION `1.0`） |
| 跨平台方案 | Capacitor 8.5.3（WebView 原生壳层） |
| Web 资源目录 | `www/`（由根目录网页版构建而来） |
| Android 最低版本 | minSdk 24（Android 7.0） |
| iOS 最低版本 | 15.0 |
| Android 编译配置 | compileSdk 36 / targetSdk 36，Gradle 8.14.3 |
| iOS 依赖方式 | Swift Package Manager（无需 CocoaPods） |

### 为什么选用 Capacitor

要求是「保留原项目所有现有功能和业务逻辑，不做功能删减」。原项目是 11 个 HTML 页面 + 原生 JavaScript
（含 `yswFetch` 接口封装、`yswStore` 同步本地存储、SVG 图标库、轮播、触底分页、聊天自动回复、后台增删改查等）。
Capacitor 直接把现有 `.html/.css/.js` 作为 WebView 内容运行，**业务代码零改动**即可跨 iOS / Android 双端运行；
而 uni-app / Flutter / React Native 都需要用各自语言重写业务逻辑，属于功能重写，与本要求相冲突。

### 目录结构

```
四级项目/
├── index.html 等 11 个 HTML 页面     # 网页版（纯净，可直接用 HTTP 服务打开）
├── css/ js/ data/ images/            # 网页版公共资源
├── js/native-bridge.js               # 原生兼容层（仅注入到 www/ 副本）
├── package.json                      # Capacitor 工程与脚本
├── capacitor.config.json             # 应用标识 / 启动页 / 状态栏 / 键盘等配置
├── scripts/
│   ├── build-www.mjs                 # 构建 www/（复制页面并注入兼容层）
│   ├── gen-assets.py                 # 生成应用图标与启动页
│   ├── patch-native.mjs              # 原生权限/竖屏/网络策略补丁（幂等）
│   └── serve-www.mjs                 # www/ 本地预览服务（仅测试用）
├── resources/                        # 品牌源资源（图标 / 启动页）
├── android/                          # Android 原生工程
├── ios/                              # iOS 原生工程
└── www/                              # 构建产物：真正打进 App 的 Web 资源
```

> **注意**：`www/` 与 `android/.../public/`、`ios/.../public/` 都是**构建产物**，不要直接编辑。
> 页面改动一律改根目录的源文件，再执行 `npm run sync` 同步。

---

## 二、环境要求

### 通用

- Node.js 20 及以上（本项目在 Node 24 下构建通过）
- 首次安装依赖：`npm install`

### Android 端

| 依赖 | 要求 | 说明 |
| ---- | ---- | ---- |
| JDK | **21 及以上** | Capacitor 8 明确要求 JDK 21+，JDK 8/11/17 无法完成构建 |
| Android Studio | 最新稳定版 | 用于真机调试、签名与出包 |
| Android SDK Platform | 36 | compileSdk/targetSdk 均为 36 |
| Gradle | 8.14.3 | 由 `android/gradle/wrapper` 自动下载，无需手动安装 |

需配置环境变量 `ANDROID_HOME`（或 `ANDROID_SDK_ROOT`）指向 Android SDK 目录。

### iOS 端

| 依赖 | 要求 | 说明 |
| ---- | ---- | ---- |
| macOS | 必需 | iOS 只能在 macOS 上构建，Windows 无法出包 |
| Xcode | 16 及以上 | 含 iOS SDK |
| Apple 开发者账号 | 真机调试免费账号即可；上架需付费账号 | 用于签名与 TestFlight / App Store |

> **关于 CocoaPods**：本工程 iOS 侧使用 **Swift Package Manager** 管理依赖，`ios/App/App.xcodeproj`
> 直接引用 `Package.swift`，**不需要安装 CocoaPods**。这也是在 Windows 上也能生成 iOS 工程的原因。

---

## 三、构建流程

### 3.1 首次构建（已在本项目执行完成）

```bash
npm install                 # 1) 安装 Capacitor 与各原生插件
npm run assets              # 2) 生成应用图标 / 启动页（需 Python 3 + Pillow）
npm run build:www           # 3) 构建 www/（复制 11 个页面 + 注入原生兼容层）
npx cap add android         # 4) 生成 Android 原生工程
npx cap add ios             # 5) 生成 iOS 原生工程
npm run patch:native        # 6) 写入权限清单 / 竖屏锁定 / 网络安全策略
npm run sync                # 7) 同步 Web 资源到两个原生工程
```

第 6 步的补丁脚本为**幂等**设计，重复执行不会产生重复内容。若删除了 `android/` 或 `ios/` 目录后重新
`cap add`，需再次执行 `npm run patch:native`（图标资源也需重新执行 `npm run assets`）。

### 3.2 日常开发流程

```bash
# 改完根目录的 HTML / CSS / JS 后：
npm run sync                # = build:www + cap sync，两个平台一起同步
```

单独同步某一端：

```bash
npm run sync:android
npm run sync:ios
```

> **最容易踩的坑**：只改根目录页面、不执行 `npm run sync`，App 里跑的还是旧资源。
> 因为原生工程加载的是各自目录下的 `public/` 副本，而不是根目录。

### 3.3 本地预览（不装 Xcode / Android Studio 也能看效果）

```bash
npm run preview             # 构建 www/ 并在 http://localhost:8765 启动预览服务
```

---

## 四、Android：真机调试与出包

### 4.1 用 Android Studio 打开

```bash
npx cap open android
```

首次打开会自动同步 Gradle（需联网下载 Gradle 8.14.3 与 Android SDK Platform 36）。

### 4.2 真机调试

1. 手机开启「开发者选项 → USB 调试」，用数据线连接电脑，授权调试。
2. Android Studio 顶部设备下拉框选择该设备，点击 **Run ▶**。
3. 也可命令行安装（需已连接设备）：

```bash
cd android
./gradlew installDebug            # Windows: gradlew.bat installDebug
```

需要在 App 内调试 WebView 页面时，用 Chrome 打开 `chrome://inspect` 即可看到 WebView 并查看控制台
（`capacitor.config.json` 已开启 `webContentsDebuggingEnabled`）。

### 4.3 生成可发布的构建产物

**方式一：Android Studio（推荐）**

`Build → Generate Signed App Bundle / APK`，按向导创建签名密钥并选择：
- **Android App Bundle（.aab）**：用于上架 Google Play
- **APK**：用于直接分发 / 侧载

**方式二：命令行**

```bash
cd android
./gradlew bundleRelease           # 生成 AAB
./gradlew assembleRelease         # 生成 APK
```

命令行出包前需在 `android/app/build.gradle` 中配置签名：

```gradle
android {
    signingConfigs {
        release {
            storeFile file("ysw-release.keystore")
            storePassword "你的密码"
            keyAlias "ysw"
            keyPassword "你的密码"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
        }
    }
}
```

生成密钥：

```bash
keytool -genkeypair -v -keystore ysw-release.keystore -alias ysw \
  -keyalg RSA -keysize 2048 -validity 36500
```

产物位置：
- AAB：`android/app/build/outputs/bundle/release/app-release.aab`
- APK：`android/app/build/outputs/apk/release/app-release.apk`

> 首次上架 Google Play 必须使用 AAB。签名密钥请务必妥善备份，丢失后将无法更新已发布的应用。

---

## 五、iOS：真机调试与上架

> 必须在 macOS 上操作。

### 5.1 用 Xcode 打开

```bash
npx cap open ios
```

### 5.2 真机调试

1. 在 Xcode 中选择 `App` Target → `Signing & Capabilities`，勾选 **Automatically manage signing**，
   选择你的 Team（Apple ID 需先在 Xcode 中登录）。
2. 连接 iPhone，顶部选择该设备，点击 **Run ▶**。
3. 若 Bundle ID 与你的开发者账号冲突，可临时改为 `com.ysw.zhipin.dev`。

### 5.3 打包与上架

1. Xcode 顶部设备选择 **Any iOS Device (arm64)**。
2. `Product → Archive`，等待归档完成。
3. 在 Organizer 中点击 **Distribute App**：
   - `App Store Connect` → 上传，之后在 App Store Connect 中提交审核；
   - `Ad Hoc / Development` → 导出 IPA 用于内测分发。
4. 也可上传后通过 **TestFlight** 分发给测试人员。

---

## 六、原生配置清单

### 6.1 权限清单（Android）

应用**仅申请了功能真正需要的权限**，不涉及相机、定位、通讯录、通知推送，因此未申请相应权限：

| 权限 | 用途 |
| ---- | ---- |
| `android.permission.INTERNET` | 访问本地与远程网络接口 |
| `android.permission.ACCESS_NETWORK_STATE` | 读取网络连接状态（用于断网/恢复提示） |
| `android.permission.VIBRATE` | 底部导航轻触感反馈 |

声明位置：`android/app/src/main/AndroidManifest.xml`。
其中后两项由插件（`@capacitor/network`、`@capacitor/haptics`）在构建时合并声明，本工程又在应用
Manifest 中显式列出，便于权限审查时集中查看。

iOS 侧不需要额外权限声明（无相机/定位/照片等敏感能力）。

### 6.2 应用图标与启动页

图标与启动页由 `scripts/gen-assets.py` 统一生成，图形为「品牌蓝渐变（#00a9e0 → #00c2e0）+ 白色公文包」，
与应用内首页顶部渐变、SVG 图标语言保持一致。

生成产物：

| 平台 | 文件 |
| ---- | ---- |
| 品牌源资源 | `resources/icon.png`(1024²)、`icon-foreground.png`、`icon-background.png`、`splash.png`(2732²) |
| Android | `mipmap-{m,h,xh,xxh,xxxh}dpi/ic_launcher.png`、`ic_launcher_round.png`、`ic_launcher_foreground.png`（自适应图标前景） |
| Android 启动页 | `drawable/splash.png` + `drawable-land-*/splash.png` + `drawable-port-*/splash.png` |
| Android 背景色 | `values/ic_launcher_background.xml`（品牌蓝 `#00A9E0`） |
| iOS 图标 | `Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`（1024²，无 alpha 通道） |
| iOS 启动页 | `Assets.xcassets/Splash.imageset/splash-2732x2732*.png` |

重新生成（需 Python 3 + Pillow）：

```bash
npm run assets
```

**启动页显示逻辑**：`capacitor.config.json` 中设置了 `launchAutoHide: false`（不自动隐藏），
由 `js/native-bridge.js` 在页面首屏渲染完成后主动调用 `SplashScreen.hide()`（DOMContentLoaded 后 350ms），
避免出现「启动页一闪而过 / 白屏」。

### 6.3 其他原生配置

| 配置项 | 值 | 原因 |
| ---- | ---- | ---- |
| 屏幕方向 | 竖屏锁定（Android `screenOrientation="portrait"`，iOS 仅 Portrait） | 应用内容 `max-width: 480px`，为手机竖屏形态 |
| Android 网络安全 | `network_security_config.xml`：默认禁止明文流量，仅 `localhost`/`127.0.0.1`/`10.0.2.2` 放行 | 正式运行走 `https://localhost`，明文放行仅服务于开发期热更新/真机联调 |
| iOS ATS | `NSAllowsLocalNetworking = true` | 同上，仅为开发期本地服务器放行 |
| iOS 出口合规 | `ITSAppUsesNonExemptEncryption = false` | 应用未使用自定义加密，声明后上架无需重复回答出口合规问题 |
| iOS 默认语言 | `CFBundleDevelopmentRegion = zh_CN` | 面向中文用户 |
| WebView 调试 | Android `webContentsDebuggingEnabled: true` | 便于真机排查 H5 问题；上架前可按需关闭 |

---

## 七、原生兼容层说明

`js/native-bridge.js` 在构建 `www/` 时被自动注入到 11 个页面的 `<script>` 中（插在 `js/common.js` 之前），
专门解决「网页 ≠ 原生」的四类差异：

| 兼容问题 | 处理方式 |
| ---- | ---- |
| 本地存储 | 启动即探测 `localStorage` 可用性；若被禁用/被回收，自动降级为**内存兜底存储**，保证 `yswStore()` 的**同步**读写语义不变、业务不抛错 |
| 接口调用 | Capacitor 内置本地服务（Android `https://localhost` / iOS `capacitor://localhost`）直接托管 `www/`，相对路径 `data/*.json` 与网页版行为一致；兼容层再做一次探活自检 |
| 系统交互 | 状态栏按页面自适应（首页蓝底白字 / 内页白底深字）、软键盘弹出时保证聊天输入框可见、网络断开与恢复提示、底部导航轻触感反馈 |
| 导航行为 | 接管 Android 物理返回键：内页回退 → 直达内页回首页 → 首页最小化应用 |

**关键设计：** 兼容层在**非 Capacitor 环境（普通浏览器）中会立即 `return`，完全降级为无操作**。
因此根目录的网页版仍可照常运行，功能与视觉效果不受任何影响。

另外，兼容层只在原生环境给 `<html>` 加上 `ysw-native` 类，用于去掉 WebView 的点击蓝色高亮与橡皮筋回弹，
使手感更接近原生。

---

## 八、兼容性测试结论

### 8.1 测试方法

- 把构建产物 `www/`（即真正打进 App 的那份 Web 资源）用本地 HTTP 服务托管，在浏览器中逐页验证。
- 同时做静态审查：CSS 固定宽度审查（确认不存在会溢出的写死宽度）、响应式断点检查、原生工程配置核对。

### 8.2 验证结果

| 页面 | 渲染 | 交互 | 结论 |
| ---- | ---- | ---- | ---- |
| index.html（首页） | 顶部城市栏、轮播图、分类九宫格、职位列表、底部 4 tab 正常 | 正常 | 通过 |
| search.html（搜索） | 输入框、热门搜索、搜索历史正常 | 点击热词可出搜索结果，历史正常记录 | 通过 |
| company.html（公司列表） | 行业筛选、公司卡片正常 | 卡片可跳转公司详情 | 通过 |
| company-detail.html（公司详情） | 公司信息、介绍、在招职位正常 | 正常 | 通过 |
| job.html（职位详情） | 职位信息、福利、企业、底部固定操作栏正常 | 收藏状态切换、立即沟通跳转（静态核对 + 前期验收均已确认） | 通过 |
| chat.html（消息列表） | 会话列表、底部 tab 正常 | 会话可跳转聊天详情（同上） | 通过 |
| chat-detail.html（聊天详情） | 历史气泡、底部输入框正常 | **发送消息成功、HR 自动回复成功**，输入框聚焦时未被遮挡 | 通过 |
| my.html（个人中心） | 头像昵称、完整度圆环、数据统计、功能菜单正常 | 底部 4 个 tab 图标文字完整、未被底部导航遮挡 | 通过 |
| settings.html（设置） | 资料项、开关、清除缓存正常 | 开关状态可正常切换并有提示 | 通过 |
| login.html（登录） | Logo、手机号/验证码输入、协议勾选正常 | 非法手机号有校验提示、获取验证码进入倒计时 | 通过 |
| admin.html（后台） | 数据看板、图表、职位列表正常 | 新增/编辑/删除职位链路（静态核对：`#ysw_admin_add` → 模态框 → `yswStore('ysw_admin_jobs')` 本地持久化，链路完整；前期项目验收已实测通过） | 通过 |

- 上述页面在浏览器中**均无 JavaScript 报错**，业务资源（`data/*.json`、`css/style.css`、各页 `js`）全部加载成功。
- **兼容层降级验证**：网页版不含原生环境时，兼容层立即返回、不触碰任何 Capacitor API，故浏览器中零报错即证明其对网页版无副作用。

### 8.3 移动端适配审查

- 布局为流式：应用列 `max-width: 480px`，窄屏自动收缩，不存在写死的超宽尺寸。
- CSS 中所有超过 340px 的尺寸均为 `max-width`（应用列、弹窗、提示），**无 `min-width` 造成的横向溢出风险**。
- 已内置 `@media (max-width: 360px)` 断点（分类宫格改 3 列、聊天气泡放宽至 80%），覆盖小屏机型。
- 底部导航与固定操作栏均使用 `env(safe-area-inset-bottom)` 适配全面屏手势条。
- 原生侧已锁定竖屏并设置状态栏/键盘策略，与页面布局一致。

### 8.4 测试边界（如实说明）

- **本机不具备真机/模拟器运行条件**：本机为 Windows，JDK 为 1.8、未安装 Android SDK，因此
  **无法在本机编译 APK、也无法连接 Android 模拟器**；iOS 打包必须使用 macOS + Xcode。
- 因此本次验证覆盖的是「**打进 App 的 Web 资源包 + 原生工程配置**」这一层；**Capacitor 原生运行时的
  真机行为**（启动页隐藏、状态栏颜色、物理返回键、触感反馈、本地服务访问）需在具备上述环境后，
  按第四节 / 第五节连接真机实测。
- 浏览器测试工具的视口控制能力有限，页面验证主要在桌面视口完成；移动端适配通过上述 CSS 静态审查
  （流式布局 + 断点 + 安全区）交叉印证。

---

## 九、已知限制与注意事项

1. **本机无法出包**：需按第二节准备好 JDK 21 + Android SDK（Android）或 macOS + Xcode（iOS）。
2. **Windows 上 npm 的执行策略**：本机 PowerShell 会拦截 `npm.ps1`，请用 `npm.cmd` 调用，
   例如 `& "E:\node\npm.cmd" install`。使用 `npm run <script>` 不受影响。
3. **务必重新同步**：修改网页源码后必须执行 `npm run sync`，否则 App 内仍是旧资源。
4. **不要直接改构建产物**：`www/`、`android/.../public/`、`ios/.../public/` 均由脚本生成，会被覆盖。
5. **`yswStore` 为同步 API**：兼容层的存储兜底严格保持同步语义，请勿将其改为异步，否则所有调用点都会报错。
6. **接口为本地 mock 数据**：`data/*.json` 随应用一起打包，因此**断网也能完整演示所有功能**；
   接入真实后端时把 `js/common.js` 中 `yswFetch` 的地址改为线上 HTTPS 接口即可，无需改动页面。
7. **上架前建议**：关闭 `webContentsDebuggingEnabled`；为正式包启用 `minifyEnabled`；
   检查 `network_security_config` 是否仍需放行开发期明文地址（可精简）。

---

## 十、命令速查

| 命令 | 作用 |
| ---- | ---- |
| `npm install` | 安装 Capacitor 与原生插件依赖 |
| `npm run assets` | 生成应用图标与启动页（需 Python + Pillow） |
| `npm run build:www` | 构建 `www/`（复制页面 + 注入原生兼容层） |
| `npm run sync` | 构建 `www/` 并同步到 Android + iOS |
| `npm run sync:android` / `sync:ios` | 仅同步指定平台 |
| `npm run patch:native` | 写入原生权限/竖屏/网络策略补丁（幂等） |
| `npx cap add android` / `add:ios` | 生成原生工程 |
| `npm run open:android` / `open:ios` | 用 Android Studio / Xcode 打开工程 |
| `npm run preview` | 本地预览 `www/`（http://localhost:8765） |
| `cd android && ./gradlew bundleRelease` | 命令行生成 AAB（需 JDK 21 + Android SDK） |
