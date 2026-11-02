---
name: submit-github
description: 将当前项目 commit 并 push 到 GitHub 仓库 ysw0802/yinsongwang（使用已设置的 SSH 公钥）。当用户说提交到 github、push 到 GitHub、同步到 GitHub 仓库时使用。不要用于 Gitee 提交或仅查看 git 状态。
---

# 提交项目到 GitHub（ysw0802/yinsongwang）

按顺序执行以下流程。任何一步失败都停下来向用户报告，不要跳步。

## 流程

### 1. 预检
- 在项目根目录（upload_site）执行 `git status`、`git branch --show-current`、`git remote -v` 确认仓库状态。
- 确认存在名为 `github` 的远程；没有则添加：
  `git remote add github git@github.com:ysw0802/yinsongwang.git`
- 若 `github` 远程地址不对，用 `git remote set-url github git@github.com:ysw0802/yinsongwang.git` 修正。
- **不要**改动 `origin`（Gitee）远程。

### 2. SSH 身份
- 使用已设置的 ed25519 公钥（`%USERPROFILE%\.ssh\id_ed25519.pub`，尾缀 19390632567@139.com）。
- 连通性测试：`ssh -T git@github.com`，看到 `Hi ysw0802!` 即成功；首次连接自动接受 host key（StrictHostKeyChecking=accept-new）。
- 若认证失败：提示用户检查 GitHub → Settings → SSH and GPG keys 是否已添加公钥，**不要**改用密码或令牌重试。

### 3. 暂存与提交
- `git add` 逐个添加本次变更的文件（新增的 `*.bak`、`.trae-html-share-packages/` 等缓存文件不要提交）。
- 提交说明用简体中文，说明本次改动内容；不要使用 `--amend`。

### 4. 推送
- 本地分支为 `master`，远程主分支为 `main`：
  - 若远程 `main` 为空仓库或仅含初始 README：先 `git fetch github`，再
    `git merge github/main --allow-unrelated-histories`（如产生合并提交，说明为"合并 GitHub 初始提交"），然后
    `git push github master:main`
  - 若远程 `main` 已与本仓库历史一致：直接 `git push github master:main`
- **禁止** `--force` 强推；推送被拒时先 `git fetch github` 查看差异，向用户报告后再决定。

### 5. 验证与后续
- `git ls-remote github main` 确认远程哈希与本地一致。
- GitHub Pages 发布：提醒用户到仓库 Settings → Pages → Branch 选 `main` + `/ (root)` → Save，
  在线地址为 `https://ysw0802.github.io/yinsongwang/`。
