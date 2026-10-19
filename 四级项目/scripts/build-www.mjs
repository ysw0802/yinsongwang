/* ============================================================
   构建 www/ 目录 —— Capacitor WebView 的加载入口
   作者：24001010802 ysw
   作用：
     1. 把根目录的 11 个 HTML 页面 + css/ js/ data/ images/ 复制进 www/
     2. 在每个 HTML 页面中注入原生兼容层 js/native-bridge.js
        （仅注入到 www/ 的副本，根目录页面保持纯净的 Web 版）
     3. 生成 www/build-manifest.json 便于核对构建产物
   ============================================================ */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const WWW = path.join(ROOT, 'www');

/* 需要复制到 www/ 的静态目录（均为网页版既有资源，不做任何删减） */
const COPY_DIRS = ['css', 'js', 'data', 'images'];

/* 原生兼容层注入锚点：优先插到公共脚本之前，保证兼容层最先执行 */
const BRIDGE_TAG = '<script src="js/native-bridge.js"></script>';
const ANCHOR = '<script src="js/common.js"></script>';

async function rimraf(target) {
  await fs.rm(target, { recursive: true, force: true });
}

async function copyDir(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = await fs.readdir(from, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) count += await copyDir(src, dest);
    else { await fs.copyFile(src, dest); count += 1; }
  }
  return count;
}

/* 在页面中注入原生兼容层：幂等，已存在则不重复注入 */
function injectBridge(html) {
  if (html.includes(BRIDGE_TAG)) return { html, injected: false };
  if (html.includes(ANCHOR)) {
    return { html: html.replace(ANCHOR, BRIDGE_TAG + '\n  ' + ANCHOR), injected: true };
  }
  // 兜底：页面没有引用公共脚本时，插到 </body> 之前
  return { html: html.replace('</body>', `  ${BRIDGE_TAG}\n</body>`), injected: true };
}

async function main() {
  const startedAt = Date.now();
  await rimraf(WWW);
  await fs.mkdir(WWW, { recursive: true });

  /* 1. 静态资源目录整体复制 */
  const assetCount = {};
  for (const dir of COPY_DIRS) {
    const from = path.join(ROOT, dir);
    try {
      await fs.access(from);
    } catch {
      throw new Error(`缺少资源目录：${dir}/，无法构建 www/`);
    }
    assetCount[dir] = await copyDir(from, path.join(WWW, dir));
  }

  /* 2. HTML 页面复制 + 注入原生兼容层 */
  const rootEntries = await fs.readdir(ROOT, { withFileTypes: true });
  const htmlFiles = rootEntries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.html'))
    .map((e) => e.name)
    .sort();

  if (htmlFiles.length === 0) throw new Error('根目录未找到任何 HTML 页面');

  const pages = [];
  for (const name of htmlFiles) {
    const raw = await fs.readFile(path.join(ROOT, name), 'utf8');
    const { html, injected } = injectBridge(raw);
    await fs.writeFile(path.join(WWW, name), html, 'utf8');
    pages.push({ page: name, bridgeInjected: injected });
  }

  /* 3. 校验兼容层文件确实存在 */
  await fs.access(path.join(WWW, 'js', 'native-bridge.js'));

  /* 4. 构建清单 */
  const manifest = {
    appId: 'com.ysw.zhipin',
    appName: '求职直聘',
    author: '24001010802 ysw',
    builtAt: new Date().toISOString(),
    pageCount: htmlFiles.length,
    pages,
    assetCount,
    outputDir: 'www'
  };
  await fs.writeFile(
    path.join(WWW, 'build-manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf8'
  );

  console.log('[build-www] 构建完成 → www/');
  console.log(`[build-www] 页面 ${htmlFiles.length} 个：${htmlFiles.join(', ')}`);
  for (const dir of COPY_DIRS) console.log(`[build-www] ${dir}/ 复制 ${assetCount[dir]} 个文件`);
  console.log(`[build-www] 原生兼容层已注入 ${pages.filter((p) => p.bridgeInjected).length} 个页面`);
  console.log(`[build-www] 耗时 ${Date.now() - startedAt}ms`);
}

main().catch((err) => {
  console.error('[build-www] 构建失败：', err.message);
  process.exit(1);
});
