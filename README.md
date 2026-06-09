# 视频监控 · LIVE

一个轻量级的网页端视频监控面板，专门配合单片机（ESP32 / STM32 等）使用。单片机把拍到的视频上传到 Supabase Storage，这个页面自动拉取并展示，打开浏览器就能看到所有视频信号。

## 怎么工作的

```
单片机拍视频 → 上传到 Supabase Storage → 这个页面自动拉列表 → 浏览器播放
```

1. 单片机端把 `.mp4` / `.webm` / `.mov` 这些格式的视频文件上传到你配好的 Supabase Bucket
2. 网页打开后会自动列出 Bucket 里的所有视频文件，按上传时间倒序排
3. 点击视频就能直接在浏览器里播放，支持全屏、倍速、画中画

页面会标记每个视频的上传时间，左上角有个 LIVE 角标和在线状态指示灯，整体风格偏暗色竞技风（方便晚上盯着不晃眼）。

## 技术栈

| 层面 | 用了什么 |
|------|---------|
| 前端框架 | React 19 + TypeScript |
| 构建工具 | Vite 6 |
| 样式 | Tailwind CSS 3 |
| 后端 / 存储 | Supabase Storage |
| 部署 | GitHub Pages（`gh-pages`） |

## 本地跑起来

```bash
# 1. 装依赖
npm install

# 2. 配环境变量
cp .env.example .env
# 然后编辑 .env，填上你的 Supabase URL 和 anon key：
#   VITE_SUPABASE_URL=https://xxxxx.supabase.co
#   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# 3. 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173` 就能看到界面了。

## 部署到 GitHub Pages

项目站点走 GitHub Pages 是免费的，按下面几步来：

```bash
# 构建 + 部署（一条命令）
npm run deploy:gh-pages
```

这条命令干了什么：先用 Vite 打出 `dist/` 目录，然后 `gh-pages` 包会自动把 `dist/` 推到仓库的 `gh-pages` 分支。

部署完之后去 GitHub 仓库的 **Settings → Pages**，把 Source 选成 `gh-pages` 分支，保存。等一两分钟，页面就会出现在 `https://你的用户名.github.io/video-monitor-web/`。

> 如果你的仓库名改了或者想绑自定义域名，记得同步改 `vite.config.ts` 里的 `VITE_BASE` 环境变量。

## 目录结构

```
video-monitor-web/
├── src/
│   ├── main.tsx          # 入口
│   ├── App.tsx           # 主界面：视频列表 + 播放
│   ├── lib/supabase.ts   # Supabase 连接 & 视频文件查询
│   └── index.css         # Tailwind + 全局样式
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

代码总共不到 300 行，没什么抽象层次，直接改就行。

## 常见问题

**Q: 页面打开一片空白？**
先打开浏览器控制台（F12），看有没有报错。大概率是 `.env` 里的 Supabase 配置没填或填错了。

**Q: 视频列表加载不出来？**
确认 Supabase Bucket 名字是 `videos`（或者去 `src/lib/supabase.ts` 改 `VIDEOS_BUCKET`），并且 Bucket 的访问权限设成了 public。

**Q: 单片机怎么上传视频？**
这个项目只管网页展示。单片机那边用 Supabase 的 REST API 或者 SDK 上传文件到 Bucket 就行，ESP32 上用 HTTP Client 直接调 Supabase Storage API 很方便。

## 致谢

本项目为团队竞赛 Demo 项目，感谢所有参与开发的小伙伴。
