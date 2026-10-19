/* ============================================================
   原生工程配置补丁
   作者：24001010802 ysw
   ------------------------------------------------------------
   幂等执行：重复运行不会产生重复内容。包含三项改造：
     1. AndroidManifest.xml —— 权限清单显式声明、竖屏锁定、
        网络安全配置引用（明文流量仅对本地调试服务器放行）
     2. res/xml/network_security_config.xml —— 生成网络安全配置文件
     3. iOS Info.plist —— 竖屏锁定、本地网络例外（ATS）、
        出口合规声明、中文为默认开发语言
   用法：node scripts/patch-native.mjs
   ============================================================ */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MANIFEST = path.join(ROOT, 'android/app/src/main/AndroidManifest.xml');
const NET_SECURITY = path.join(ROOT, 'android/app/src/main/res/xml/network_security_config.xml');
const INFO_PLIST = path.join(ROOT, 'ios/App/App/Info.plist');

/* 应用真正需要的权限：
   - INTERNET            访问本地/远程接口（Capacitor 模板已含）
   - ACCESS_NETWORK_STATE 供 @capacitor/network 读取网络状态（插件自身也会合并声明，此处显式列出便于审查）
   - VIBRATE             供 @capacitor/haptics 提供触感反馈（同上）
   本应用不涉及相机、定位、通讯录、通知推送，因此不申请相应权限。 */
const NEEDED_PERMISSIONS = [
  ['android.permission.INTERNET', '访问网络接口'],
  ['android.permission.ACCESS_NETWORK_STATE', '读取网络连接状态（网络状态提示）'],
  ['android.permission.VIBRATE', '底部导航轻触感反馈']
];

const results = [];

async function readIfExists(file) {
  try {
    return await fs.readFile(file, 'utf8');
  } catch {
    return null;
  }
}

async function write(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, 'utf8');
}

/* ---------- 1 & 2. Android ---------- */
async function patchAndroid() {
  const manifest = await readIfExists(MANIFEST);
  if (!manifest) {
    console.log('[patch-native] 未发现 android/ 工程，跳过 Android 配置');
    return;
  }
  let out = manifest;

  /* 1.1 权限清单：缺失的显式补到 INTERNET 之后 */
  const missing = NEEDED_PERMISSIONS.filter(([name]) => !out.includes(name));
  if (missing.length) {
    const block = missing
      .map(([name, why]) => `    <!-- ${why} -->\n    <uses-permission android:name="${name}" />`)
      .join('\n');
    const anchor = '    <uses-permission android:name="android.permission.INTERNET" />';
    if (out.includes(anchor)) {
      out = out.replace(anchor, anchor + '\n' + block);
    } else if (out.includes('</manifest>')) {
      out = out.replace('</manifest>', block + '\n\n</manifest>');
    }
    results.push(`AndroidManifest 权限：补入 ${missing.map(([n]) => n.split('.').pop()).join('、')}`);
  } else {
    results.push('AndroidManifest 权限：已完整');
  }

  /* 1.2 竖屏锁定：应用为手机竖屏形态（内容 max-width 480px），锁定竖屏避免布局拉伸 */
  if (!out.includes('android:screenOrientation')) {
    out = out.replace(
      'android:name=".MainActivity"',
      'android:name=".MainActivity"\n            android:screenOrientation="portrait"'
    );
    results.push('AndroidManifest：MainActivity 已锁定竖屏');
  }

  /* 1.3 网络安全配置：默认禁止明文流量，仅本地调试地址放行 */
  if (!out.includes('android:networkSecurityConfig')) {
    out = out.replace(
      'android:theme="@style/AppTheme">',
      'android:theme="@style/AppTheme"\n        android:networkSecurityConfig="@xml/network_security_config">'
    );
    results.push('AndroidManifest：已引用 network_security_config');
  }

  if (out !== manifest) await write(MANIFEST, out);

  const netConfig = `<?xml version="1.0" encoding="utf-8"?>
<!-- 作者：24001010802 ysw
     默认禁止明文 HTTP，仅对本地调试服务器放行（真机热更新 / 模拟器回环地址），
     应用正式运行使用 https://localhost，因此不受影响。 -->
<network-security-config>
    <base-config cleartextTrafficPermitted="false" />
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">localhost</domain>
        <domain includeSubdomains="false">127.0.0.1</domain>
        <domain includeSubdomains="false">10.0.2.2</domain>
    </domain-config>
</network-security-config>
`;
  await write(NET_SECURITY, netConfig);
  results.push('已生成 network_security_config.xml');
}

/* ---------- 3. iOS ---------- */
async function patchIos() {
  const plist = await readIfExists(INFO_PLIST);
  if (!plist) {
    console.log('[patch-native] 未发现 ios/ 工程，跳过 iOS 配置');
    return;
  }
  let out = plist;

  /* 3.1 竖屏锁定（iPad 额外允许倒置竖屏，符合 Apple 对 iPad 的适配建议） */
  const portraitArray =
    '\t<key>UISupportedInterfaceOrientations</key>\n' +
    '\t<array>\n' +
    '\t\t<string>UIInterfaceOrientationPortrait</string>\n' +
    '\t</array>';
  const ipadArray =
    '\t<key>UISupportedInterfaceOrientations~ipad</key>\n' +
    '\t<array>\n' +
    '\t\t<string>UIInterfaceOrientationPortrait</string>\n' +
    '\t\t<string>UIInterfaceOrientationPortraitUpsideDown</string>\n' +
    '\t</array>';

  const before = out;
  out = out.replace(
    /[ \t]*<key>UISupportedInterfaceOrientations~ipad<\/key>\s*<array>[\s\S]*?<\/array>/,
    ipadArray
  );
  out = out.replace(
    /[ \t]*<key>UISupportedInterfaceOrientations<\/key>\s*<array>[\s\S]*?<\/array>/,
    portraitArray
  );
  if (out !== before) results.push('Info.plist：已锁定竖屏');

  /* 3.2 追加配置项：本地网络例外 + 出口合规声明 + 默认语言 */
  if (!out.includes('NSAllowsLocalNetworking')) {
    const extra =
      '\t<key>NSAppTransportSecurity</key>\n' +
      '\t<dict>\n' +
      '\t\t<!-- 仅为开发期的本地热更新服务器放行，线上接口仍走 HTTPS -->\n' +
      '\t\t<key>NSAllowsLocalNetworking</key>\n' +
      '\t\t<true/>\n' +
      '\t</dict>\n' +
      '\t<!-- 应用未使用自定义加密算法，声明后提交审核无需重复回答出口合规问题 -->\n' +
      '\t<key>ITSAppUsesNonExemptEncryption</key>\n' +
      '\t<false/>\n';
    out = out.replace(/([ \t]*)<\/dict>\s*<\/plist>/, extra + '</dict>\n</plist>\n');
    results.push('Info.plist：已追加 ATS 本地例外与出口合规声明');
  }

  if (out.includes('<key>CFBundleDevelopmentRegion</key>')) {
    const next = out.replace(
      /(<key>CFBundleDevelopmentRegion<\/key>\s*<string>)en(<\/string>)/,
      '$1zh_CN$2'
    );
    if (next !== out) {
      out = next;
      results.push('Info.plist：默认开发语言设为 zh_CN');
    }
  }

  await write(INFO_PLIST, out);
}

async function main() {
  await patchAndroid();
  await patchIos();
  console.log('[patch-native] 完成：');
  for (const line of results) console.log('  - ' + line);
}

main().catch((err) => {
  console.error('[patch-native] 执行失败：', err.message);
  process.exit(1);
});
