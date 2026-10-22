---
name: submit-project
description: 提交并推送当前项目到 Gitee 仓库 advanced-web-design。当用户说提交项目、commit 并 push、推送到 Gitee、同步代码到远程仓库时使用。不要用于仅查看 git 状态或普通文件修改。
---

# 提交项目（Commit & Push to Gitee）

将当前项目 `c:\Users\20827\Desktop\高级网页设计\upload_site` 的变更提交并推送到远程仓库 `https://gitee.com/yin-songwang/advanced-web-design.git`。

## 执行步骤

1. **预检**：运行 `git status`、`git diff`、`git log -n 5`（如果存在提交历史）了解当前状态与提交信息风格。
2. **初始化**：若尚未初始化仓库，执行 `git init`；Gitee 默认分支通常为 master，首次提交后用 `git branch -M master` 规范分支名。
3. **远程配置**：运行 `git remote -v`。
   - 无 origin：`git remote add origin https://gitee.com/yin-songwang/advanced-web-design.git`
   - origin 指向其他地址：使用 `git remote set-url origin https://gitee.com/yin-songwang/advanced-web-design.git`
4. **暂存**：按文件名逐一 `git add`，不要使用 `git add -A` 或 `git add .` 盲加。排除以下文件：
   - `*.bak`、`*.bak2` 等备份文件
   - `.trae-html-share-packages/` 预览打包缓存
   - `node_modules/`、`.env`、凭据类文件（若存在则警告用户）
5. **提交**：用 `git commit -m "提交说明"` 创建新提交。说明用中文，一句话聚焦"为什么"而非"改了什么"（如 `提交：新增移动端底部导航页面 iconfont-3/4`）。禁止 `--amend` 覆盖历史提交；禁止 `--no-verify`。
6. **推送**：
   - 首次推送：`git push -u origin master`
   - 后续推送：`git push`
   - 若被拒绝（non-fast-forward）：先 `git fetch origin` 并 `git log master..origin/master` 查看差异，再 `git pull --no-rebase` 合并后重新推送。**禁止 `--force` 强推**。
7. **汇报**：推送成功后报告提交哈希、分支名、远程地址；失败则说明原因（最常见：HTTPS 凭据失效，需用户在弹窗或凭据管理器中重新登录 Gitee）。

## 注意事项

- 工作区无变更时不创建空提交，直接告知用户"没有可提交的变更"。
- 推送失败不要盲目重试，先诊断（网络、凭据、分支保护）。
- 若用户要求更新 ysw_prompt.md 之类的提示词记录文件，一并纳入本次提交。
