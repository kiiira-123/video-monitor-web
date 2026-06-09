# 视频监控 · LIVE

一个跑在浏览器里的视频监控面板，打开网页就能实时查看单片机传回来的视频。连上 Supabase Storage 当后端，不用自己搭服务器，部署走 GitHub Pages 免费托管。

> 💡 这是 v1 精简版，只支持视频。如果你还需要**显示图片**、**30 秒自动刷新**、以及**模拟单片机上传的 Python 测试脚本**，直接看升级版：[mcu-monitor](https://github.com/kiiira-123/mcu-monitor)。v1 代码更少更好读，建议先看这个理解核心逻辑，再看 v2。

## 怎么工作的

```
硬件端（ESP32 / STM32 / 树莓派）
    │
    ├─ 拍摄视频（.mp4 / .webm / .mov …）
    └─ 通过 Supabase REST API 上传到云端 Bucket
           │
           ▼
    Supabase Storage（云端存储，免费额度够用）
           │
           ▼
    这个网页（浏览器打开即可）
    ├─ 拉取 Bucket 里所有视频文件
    ├─ 按上传时间倒序排列
    ├─ 每个视频带 LIVE 角标、上传时间
    └─ 点击就能在浏览器里播放
```

整个链路不需要自己写后端——Supabase 提供了现成的存储 API 和 CDN 加速，你只需要：
1. 在 Supabase 建一个项目
2. 建一个叫 `videos` 的公共 Bucket
3. 单片机往这个 Bucket 上传视频
4. 打开这个网页就能看到

## v1 vs v2

| | v1（本项目） | [v2 (mcu-monitor)](https://github.com/kiiira-123/mcu-monitor) |
|---|---|---|
| 视频播放 | ✅ | ✅ |
| 图片显示 | ❌ | ✅ JPG / PNG / GIF / WebP |
| 刷新方式 | 手动点按钮 | 每 30 秒自动刷新 |
| 单片机模拟脚本 | 没有 | 有 Python `mock_mcu.py` |
| 一键部署脚本 | npm 命令 | Bash + PowerShell 双版本 |
| 代码量 | ~250 行 | ~300 行 |
| 适合场景 | 纯视频监控，快速上手 | 视频 + 图片混合监控，长期用 |

## 快速开始

### 1. 克隆 + 装依赖

```bash
git clone https://github.com/kiiira-123/video-monitor-web.git
cd video-monitor-web
npm install
```

### 2. 配 Supabase

去 [supabase.com](https://supabase.com) 注册一个免费账号，创建项目：
1. 进 **Storage** → 新建一个 Bucket，名字叫 `videos`
2. 把 Bucket 设为 **public**（公开访问）
3. 去项目 **Settings → API**，复制 `Project URL` 和 `anon public key`

然后在项目根目录创建 `.env` 文件：

```bash
VITE_SUPABASE_URL=https://你的项目id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> 不会填？看一眼 `src/lib/supabase.ts`，这个文件负责读环境变量并初始化 Supabase 客户端，就知道该填什么了。

### 3. 跑起来

```bash
npm run dev
```

浏览器打开 `http://localhost:5173`。如果 Supabase 里还没有视频，页面会显示「暂无视频文件」的空状态。

### 4. 测试：手动上传一个视频

目前 Bucket 是空的，你可能想先传个东西试试能不能显示。最简单的办法：

1. 打开 Supabase 后台 → **Storage → videos**
2. 直接拖一个 `.mp4` 文件进去
3. 回到网页，点「刷新画面」按钮

视频就会出现在列表里，带 LIVE 角标和上传时间。

### 5. 模拟单片机上传（Python 脚本）

单片机不在手边、想快速验证整套链路？v1 没有自带模拟脚本，但你可以用下面这个最简 Python 版测试上传：

```python
import requests

SUPABASE_URL = "https://你的项目.supabase.co"
API_KEY = "你的anon key"
BUCKET = "videos"
FILE_PATH = "./test.mp4"

url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{FILE_PATH.split('/')[-1]}"
headers = {"Authorization": f"Bearer {API_KEY}"}

with open(FILE_PATH, "rb") as f:
    res = requests.post(url, headers=headers, data=f)

print("✅ 上传成功" if res.status_code == 200 else f"❌ {res.text}")
```

这段代码和 ESP32 上用 HTTPClient 发请求的逻辑一模一样——都是往 Supabase REST API 发 POST，Header 里带 Authorization，Body 里放文件二进制数据。

> v2（mcu-monitor）里有个更完整的 `mock_mcu.py`，支持批量上传和错误处理，可以直接拿过去用。

## 部署到 GitHub Pages

项目已经配好了 `gh-pages`，一行命令部署：

```bash
npm run deploy:gh-pages
```

这段命令执行了两件事：
1. `vite build` — 把项目打包到 `dist/` 目录
2. `gh-pages -d dist` — 把 `dist/` 的内容推送到仓库的 `gh-pages` 分支

部署完之后：
1. 打开 GitHub 仓库页面 → **Settings → Pages**
2. **Source** 选 `Deploy from a branch`
3. **Branch** 选 `gh-pages`，目录选 `/ (root)`
4. 点 Save，等一两分钟

站点地址：`https://你的用户名.github.io/video-monitor-web/`

> ⚠️ 如果你的仓库名字不是 `video-monitor-web`，部署前记得设置环境变量：
> ```bash
> export VITE_BASE=/你的仓库名/
> npm run build
> npx gh-pages -d dist
> ```
> 因为 GitHub Pages 项目站点的资源路径是 `/仓库名/` 而不是 `/`，`vite.config.ts` 里通过 `VITE_BASE` 来处理这个事。

## 单片机上传格式参考

不管你用什么硬件（ESP32 / STM32 / 树莓派 / Arduino），只要会发 HTTP 请求就行：

```
POST https://<你的项目>.supabase.co/storage/v1/object/videos/<文件名>
Headers:
  Authorization: Bearer <anon key>
  Content-Type: video/mp4    （根据实际文件类型填）
Body: <文件二进制数据>
```

支持的文件格式（定义在 `src/lib/supabase.ts` 里）：
- `.mp4` `.webm` `.ogg` `.ogv` `.mov` `.mkv` `.m4v` `.avi`

## 项目结构

```
video-monitor-web/
├── src/
│   ├── main.tsx            # React 入口，挂载到 index.html 的 #root
│   ├── App.tsx             # 主界面：视频列表、播放器、刷新按钮、空状态
│   ├── lib/supabase.ts     # Supabase 客户端初始化 + 文件类型判断
│   └── index.css           # Tailwind 基础指令 + 暗色背景渐变
├── public/
│   └── vite.svg            # 网站 favicon
├── index.html              # HTML 壳，引入 Google Fonts（Orbitron + 等宽）
├── vite.config.ts          # Vite 配置，通过 VITE_BASE 适配 GitHub Pages
├── tailwind.config.js      # Tailwind 主题色（暗色竞技风格）
├── tsconfig.json           # TypeScript 配置
├── package.json            # 依赖 + 脚本（dev / build / deploy:gh-pages）
└── postcss.config.js       # PostCSS（Tailwind 需要）
```

代码总共 250 行出头，核心逻辑在 `App.tsx` 里——三个状态（加载中 / 空数据 / 有数据）各对应一套 UI，`lib/supabase.ts` 封装了 Bucket 列表拉取和签名 URL 生成，读一遍就能改。

## 常见问题

**Q: 打开网页一片空白？**
按 F12 打开浏览器控制台，看有没有红色报错。大概率是下面两个原因之一：
- `.env` 文件不存在或 Supabase 配置填错了
- Supabase 项目的 Bucket 没有设为 public

**Q: 控制台报 "缺少 VITE_SUPABASE_URL 或 VITE_SUPABASE_ANON_KEY"？**
说明你没创建 `.env` 文件。在项目根目录创建一个，内容参考上面「快速开始 - 配 Supabase」那一段。

**Q: 视频列表一直显示"暂无视频文件"但 Bucket 里明明有？**
- 确认 Bucket 名字是 `videos`（大小写敏感）
- 确认文件名后缀在支持列表里（`mp4 / webm / mov / mkv` 等）
- 检查 Bucket 的 RLS 策略：如果你没设成 public，需要去 Supabase 后台 Storage → Policies 加一条允许公开读取的策略

**Q: 视频点不开 / 播放不了？**
检查 Supabase Bucket 的访问权限。项目代码会先尝试生成临时签名 URL（12 小时有效），失败才降级到公开 URL。如果两种方式都拿不到，说明 Bucket 权限配置有问题。

**Q: 怎么改 Bucket 名字？**
去 `src/lib/supabase.ts`，把 `VIDEOS_BUCKET` 变量的值从 `"videos"` 改成你 Bucket 的名字就行。

## 技术栈

| 层面 | 用了什么 | 为什么选它 |
|---|---|---|
| 前端 | React 19 + TypeScript | 队友上手快，类型检查防低级错误 |
| 构建 | Vite 6 | 开发热更新秒开，打包快 |
| 样式 | Tailwind CSS 3 | 不用写 CSS 文件，类名直接写 HTML 上 |
| 后端/存储 | Supabase Storage | 免费额度够练手，自带 CDN，不用搭后端 |
| 部署 | GitHub Pages | 免费，push 代码就能更新站点 |

## 相关项目

- [mcu-monitor](https://github.com/kiiira-123/mcu-monitor) — v2 升级版，视频 + 图片全支持，带自动刷新和模拟单片机上传脚本
- [Supabase Storage 文档](https://supabase.com/docs/guides/storage) — 上传 API、权限策略、SDK 用法都在这里

---

团队竞赛 Demo 项目 · 感谢一起熬夜 debug 的小伙伴们 🔧
