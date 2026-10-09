#!/usr/bin/env node
/**
 * 自动更新 index.html 里的「网页目录」链接区块
 * 用法：双击「更新目录.bat」，或在本目录运行 node update-index.js
 *
 * 原理：扫描本目录下所有 .html / .css 文件，重新生成 index.html 中
 *       <!-- AUTO-LINKS:START --> 与 <!-- AUTO-LINKS:END --> 之间的链接。
 *       空文件（0 字节，还没写内容的）会自动跳过。
 */
const fs = require('fs');
const path = require('path');

const dir = __dirname;
const indexPath = path.join(dir, 'index.html');
const START = '<!-- AUTO-LINKS:START （由 update-index.js 自动生成，请勿手改这一块） -->';
const END = '<!-- AUTO-LINKS:END -->';

// ---------- 1) 扫描文件 ----------
const entries = fs.readdirSync(dir, { withFileTypes: true })
    .filter(function (e) { return e.isFile(); })
    .map(function (e) { return e.name; });

function sizeOf(n) {
    try { return fs.statSync(path.join(dir, n)).size; } catch (e) { return 0; }
}

const skippedEmpty = [];
const htmlFiles = entries
    .filter(function (n) { return /\.html?$/i.test(n); })
    .filter(function (n) {
        if (sizeOf(n) === 0) { skippedEmpty.push(n); return false; }
        return true;
    })
    .sort(function (a, b) {
        if (a.toLowerCase() === 'index.html') return -1;
        if (b.toLowerCase() === 'index.html') return 1;
        return a.localeCompare(b, 'zh');
    });

const cssFiles = entries
    .filter(function (n) { return /\.css$/i.test(n); })
    .sort(function (a, b) { return a.localeCompare(b, 'zh'); });

// ---------- 2) 读取每个页面的 title 作为鼠标悬浮提示 ----------
function titleOf(name) {
    try {
        const s = fs.readFileSync(path.join(dir, name), 'utf8');
        const m = /<title>([\s\S]*?)<\/title>/i.exec(s);
        return m ? m[1].trim().replace(/\s+/g, ' ') : '';
    } catch (e) {
        return '';
    }
}

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function linkLines(list, withTitle) {
    return list.map(function (n) {
        const t = withTitle ? titleOf(n) : '';
        const attr = t ? ' title="' + esc(t) + '"' : '';
        return '        <a class="file-link" href="' + esc(n) + '"' + attr + '><span>✎</span>' + esc(n) + '</a>';
    }).join('\n');
}

const generated = [
    START,
    '      <div class="file-links">',
    linkLines(htmlFiles, true),
    '      </div>',
    '',
    '      <div class="mini-title" style="margin-top:22px;">样式文件（CSS）</div>',
    '      <div class="file-links">',
    linkLines(cssFiles, false),
    '      </div>',
    '      ' + END
].join('\n');

// ---------- 3) 更新 index.html ----------
if (!fs.existsSync(indexPath)) {
    console.error('[错误] 找不到 index.html，请把本脚本和 index.html 放在同一个文件夹里。');
    process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf8');
const si = html.indexOf(START);
const ei = html.indexOf(END);

if (si !== -1 && ei !== -1 && ei > si) {
    html = html.slice(0, si) + generated + html.slice(ei + END.length);
} else {
    const anchor = html.indexOf('id="modules"');
    if (anchor === -1) {
        console.error('[错误] 在 index.html 中找不到 id="modules" 的「网页目录」区块。');
        process.exit(1);
    }
    const sectionOpen = html.lastIndexOf('<section', anchor);
    const sectionCloseTag = '</section>';
    const sectionEnd = html.indexOf(sectionCloseTag, anchor);
    if (sectionOpen === -1 || sectionEnd === -1) {
        console.error('[错误] 无法定位「网页目录」区块的起止位置。');
        process.exit(1);
    }

    const sectionText = html.slice(sectionOpen, sectionEnd + sectionCloseTag.length);
    const titleRe = /<div class="panel-title">[\s\S]*?<\/div>\s*<\/div>/;
    const tm = titleRe.exec(sectionText);
    if (!tm) {
        console.error('[错误] 无法定位「网页目录」的标题部分。');
        process.exit(1);
    }

    const head = sectionText.slice(0, tm.index + tm[0].length);
    const newSection = head + '\n\n' + generated + '\n    ' + sectionCloseTag;
    html = html.slice(0, sectionOpen) + newSection + html.slice(sectionEnd + sectionCloseTag.length);
    console.log('首次运行：已在「网页目录」中插入自动生成标记。');
}

fs.writeFileSync(path.join(dir, 'index.html.bak'), fs.readFileSync(indexPath));
fs.writeFileSync(indexPath, html, 'utf8');

console.log('');
console.log('index.html 已更新');
console.log('  页面 (' + htmlFiles.length + ') ：' + htmlFiles.join('、'));
console.log('  样式 (' + cssFiles.length + ') ：' + (cssFiles.length ? cssFiles.join('、') : '（无）'));
if (skippedEmpty.length) {
    console.log('  已跳过空文件 ：' + skippedEmpty.join('、') + '（还没写内容，写好后重新运行即可收录）');
}
console.log('  备份 ：index.html.bak');
