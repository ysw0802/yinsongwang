/* ============================================================
   原生兼容层 Native Bridge
   作者：24001010802 ysw
   ------------------------------------------------------------
   作用：把纯网页项目包装成 App 时，补齐"网页 ≠ 原生"的差异。
   覆盖四类兼容问题：
     1. 本地存储 —— WebView 存储不可用时自动降级为内存兜底，
        保证 js/common.js 的同步 yswStore 永不抛异常；
     2. 接口调用 —— 相对路径 mock 接口在 https://localhost 下的可用性自检；
     3. 系统交互 —— 状态栏、软键盘、网络状态、触感反馈；
     4. 导航行为 —— Android 物理返回键接管（首页最小化、内页回退）。
   重要：在普通浏览器中本文件完全降级为无操作（见下方立即 return），
        因此网页版（根目录直接打开/HTTP 服务）行为不受任何影响。
   ============================================================ */
(function () {
  'use strict';

  var Cap = window.Capacitor;
  var hasCap = !!(Cap && typeof Cap.isNativePlatform === 'function');
  var isNative = hasCap && Cap.isNativePlatform();

  /* ---------- 对外暴露的环境标记：页面与兼容性测试均可查询 ---------- */
  window.YSW_NATIVE = {
    isNative: isNative,
    platform: isNative && typeof Cap.getPlatform === 'function' ? Cap.getPlatform() : 'web',
    version: '1.0.0',
    storage: 'unknown',   // localStorage | memory-fallback
    api: 'pending',       // ok | http-xxx | failed
    network: 'unknown',   // online | offline
    backButton: 'uninitialized'
  };

  /* ============ 非原生环境：直接退出，网页版零影响 ============ */
  if (!isNative) {
    window.YSW_NATIVE.storage = 'browser-localStorage';
    window.YSW_NATIVE.backButton = 'browser-default';
    return;
  }

  var platform = window.YSW_NATIVE.platform;

  /* ---------- 工具函数 ---------- */
  function plugin(name) {
    return (Cap.Plugins && Cap.Plugins[name]) || null;
  }
  function safe(promise, label) {
    if (promise && typeof promise.catch === 'function') {
      promise.catch(function (e) {
        console.warn('[native-bridge] ' + label + ' 调用失败：', (e && e.message) || e);
      });
    }
    return promise;
  }
  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  /* ---------- 原生容器专属微调：去掉点击高亮与橡皮筋回弹，贴近原生手感 ---------- */
  var nativeStyle = document.createElement('style');
  nativeStyle.id = 'ysw_native_style';
  nativeStyle.textContent =
    '.ysw-native *{-webkit-tap-highlight-color:transparent}' +
    '.ysw-native body{overscroll-behavior-y:none}';
  document.head.appendChild(nativeStyle);
  document.documentElement.classList.add('ysw-native');

  /* ============ 1. 本地存储兼容性 ============ */
  function ensureStorage() {
    try {
      var probe = '__ysw_storage_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      window.YSW_NATIVE.storage = 'localStorage';
      return;
    } catch (err) {
      /* 存储被禁用（隐私模式 / 存储被系统回收）时启用内存兜底，
         保证 yswStore() 同步读写不抛错，业务逻辑不中断 */
      var mem = {};
      var shim = {
        getItem: function (k) {
          k = String(k);
          return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null;
        },
        setItem: function (k, v) { mem[String(k)] = String(v); },
        removeItem: function (k) { delete mem[String(k)]; },
        clear: function () { mem = {}; },
        key: function (i) { return Object.keys(mem)[i] || null; }
      };
      Object.defineProperty(shim, 'length', { get: function () { return Object.keys(mem).length; } });
      try {
        Object.defineProperty(window, 'localStorage', { value: shim, configurable: true });
      } catch (e1) {
        try { window.localStorage = shim; } catch (e2) { /* 只读属性，忽略 */ }
      }
      window.YSW_NATIVE.storage = 'memory-fallback';
      console.warn('[native-bridge] localStorage 不可用，已切换内存兜底存储');
    }
  }
  ensureStorage();

  /* ============ 2. 接口调用兼容性自检 ============ */
  /* Capacitor 内置本地服务（Android: https://localhost / iOS: capacitor://localhost）
     直接托管 www/ 目录，因此相对路径 data/*.json 与网页版行为一致；
     此处做一次探活，结果写入 YSW_NATIVE.api 供排查与测试取证。 */
  function probeApi() {
    return fetch('data/jobs.json', { cache: 'no-store' })
      .then(function (r) {
        window.YSW_NATIVE.api = r.ok ? 'ok' : 'http-' + r.status;
        return r.ok;
      })
      .catch(function () {
        window.YSW_NATIVE.api = 'failed';
        return false;
      });
  }
  window.YSW_NATIVE.checkApi = probeApi;

  /* ============ 3. 启动页（Splash）============ */
  function hideSplash() {
    var Splash = plugin('SplashScreen');
    if (Splash && Splash.hide) safe(Splash.hide(), 'SplashScreen.hide');
  }

  /* ============ 4. 状态栏 ============ */
  /* 首页顶部为品牌蓝渐变 → 状态栏白字蓝底；其余页面为白色导航栏 → 状态栏深字白底 */
  function applyStatusBar() {
    var SB = plugin('StatusBar');
    if (!SB) return;
    var isHome = !!document.querySelector('.ysw-home-header');
    if (SB.setStyle) safe(SB.setStyle({ style: isHome ? 'LIGHT' : 'DARK' }), 'StatusBar.setStyle');
    if (platform === 'android') {
      if (SB.setBackgroundColor) safe(SB.setBackgroundColor({ color: isHome ? '#00a9e0' : '#ffffff' }), 'StatusBar.setBackgroundColor');
      if (SB.setOverlaysWebView) safe(SB.setOverlaysWebView({ overlay: false }), 'StatusBar.setOverlaysWebView');
    }
  }

  /* ============ 5. 软键盘 ============ */
  /* 聊天详情页输入框位于 fixed 底栏，键盘弹出时需保证输入框始终可见 */
  function applyKeyboard() {
    var KB = plugin('Keyboard');
    if (!KB) return;
    if (KB.setResizeMode) safe(KB.setResizeMode({ mode: 'native' }), 'Keyboard.setResizeMode');
    if (KB.setScroll) safe(KB.setScroll({ isDisabled: false }), 'Keyboard.setScroll');
    if (KB.setStyle) safe(KB.setStyle({ style: 'LIGHT' }), 'Keyboard.setStyle');
    if (KB.addListener) {
      KB.addListener('keyboardWillShow', function () {
        var el = document.activeElement;
        if (!el || !/^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
        setTimeout(function () {
          if (el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, 150);
      });
    }
  }

  /* ============ 6. 网络状态 ============ */
  /* 项目接口为本地 mock 数据，断网也能完整演示；此处仅做状态提示 */
  function applyNetwork() {
    var Net = plugin('Network');
    if (!Net) return;
    if (Net.addListener) {
      Net.addListener('networkStatusChange', function (status) {
        window.YSW_NATIVE.network = status.connected ? 'online' : 'offline';
        if (typeof window.yswToast !== 'function') return;
        if (!status.connected) window.yswToast('网络已断开，已切换离线演示模式');
        else window.yswToast('网络已恢复');
      });
    }
    if (Net.getStatus) {
      safe(Net.getStatus().then(function (s) {
        window.YSW_NATIVE.network = s.connected ? 'online' : 'offline';
      }), 'Network.getStatus');
    }
  }

  /* ============ 7. Android 物理返回键接管 ============ */
  function applyBackButton() {
    var App = plugin('App');
    if (!App || !App.addListener) return;
    var page = (window.location.pathname.split('/').pop() || 'index.html').split('?')[0];
    App.addListener('backButton', function () {
      if (window.history.length > 1) {
        window.history.back();            // 内页：正常回退
      } else if (page !== 'index.html') {
        window.location.href = 'index.html'; // 直达内页：回到首页
      } else if (App.minimizeApp) {
        safe(App.minimizeApp(), 'App.minimizeApp'); // 首页：最小化而非直接退出
      }
    });
    window.YSW_NATIVE.backButton = 'handled';
  }

  /* ============ 8. 触感反馈（轻触底部导航）============ */
  function applyHaptics() {
    var Hap = plugin('Haptics');
    if (!Hap || !Hap.impact) return;
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t && t.closest && t.closest('.ysw-tabbar__item')) {
        safe(Hap.impact({ style: 'LIGHT' }), 'Haptics.impact');
      }
    }, true);
  }

  /* ---------- 启动流程 ---------- */
  applyKeyboard();
  applyNetwork();
  applyBackButton();
  applyHaptics();

  onReady(function () {
    applyStatusBar();
    setTimeout(hideSplash, 350);
    setTimeout(probeApi, 800);
  });
})();
