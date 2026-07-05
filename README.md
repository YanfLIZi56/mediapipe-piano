# MidiPipe — 手势空气钢琴

> 空中舞动指尖，实时识手演绎钢琴和弦，开启无接触音乐创作体验。

基于 **MediaPipe Hands** 实时手势识别，双手食指分别悬停在左侧「和弦类型」圆环与右侧「音符」圆环上，即可演奏钢琴和弦，无需触碰任何设备。

---

## ✨ 功能特性

- 📷 实时双手骨骼追踪（21 关键点，MediaPipe Hands）
- 🎹 7 个音符（C / D / E / F / G / A / B）× 6 种和弦类型（maj / min / add9 / maj7 / min7 / 7）
- 🔊 原生 Web Audio API 合成——零第三方音频依赖
- 🌀 SVG 圆环扇形交互界面 + 扇形极坐标碰撞检测
- 🪞 视频镜像坐标自动修正
- 🎨 赛博朋克青色（#00FFCC）霓虹 HUD 风格

---

## 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript + Vite |
| 样式 | Tailwind CSS + shadcn/ui |
| 手势识别 | MediaPipe Hands（CDN） |
| 音频合成 | Web Audio API（OscillatorNode / GainNode / ConvolverNode） |
| 碰撞检测 | 扇形极坐标算法（自研） |
| 构建工具 | Vite（rolldown-vite） |

---

## 📁 目录结构

```
├── index.html                 # 入口 HTML（含 MediaPipe CDN 引入）
├── public/                    # 静态资源
│   ├── favicon.png
│   └── images/
├── src/
│   ├── components/
│   │   ├── RingMenu.tsx       # SVG 圆环扇形菜单组件
│   │   └── ui/                # shadcn/ui 基础组件
│   ├── hooks/
│   │   ├── useHandTracking.ts # MediaPipe 手势追踪 Hook
│   │   ├── useChordSynth.ts   # Web Audio API 和弦合成 Hook
│   │   └── useButtonHitTest.ts# 扇形碰撞检测 Hook
│   ├── lib/
│   │   └── chords.ts          # 和弦频率映射表
│   ├── pages/
│   │   └── HomePage.tsx       # 主页面
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css              # 全局样式 & CSS 变量
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## 🚀 本地部署

### 环境要求

- **Node.js** ≥ 18（推荐 v20+）
- **pnpm** ≥ 8（或使用 npm / yarn）
- 支持摄像头的现代浏览器（推荐 Chrome）

```bash
# 检查版本
node -v   # 需要 ≥ v18
pnpm -v   # 需要 ≥ 8（可用 npm i -g pnpm 安装）
```

### 安装步骤

```bash
# 1. 克隆仓库，切换到 React-version 分支
git clone https://github.com/YanfLIZi56/OpenCV-Play-Music.git
cd OpenCV-Play-Music
git checkout React-version

# 2. 安装依赖
pnpm install
# 或使用 npm：npm install

# 3. 启动开发服务器
pnpm dev
# 或使用 npm：npm run dev
```

浏览器访问 `http://localhost:5173`

### 生产构建

```bash
pnpm build      # 构建到 dist/
pnpm preview    # 本地预览构建结果
```

### 在线体验

项目已通过 GitHub Actions 自动部署到 GitHub Pages：

👉 **[在线 Demo](https://yanflizi56.github.io/OpenCV-Play-Music/)**

> 每次推送代码到 `React-version` 分支，流水线会自动构建并部署。

---

## 📝 环境变量

本项目为**纯前端应用**，无需配置任何环境变量即可运行。

若需自定义，参考 `.env.example`：

```bash
cp .env.example .env
```

---

## 🎮 使用说明

1. 打开页面后点击中央 **「点击启动音频」** 解锁 AudioContext（浏览器安全策略要求）
2. 允许浏览器访问**摄像头权限**
3. 将双手置于摄像头前（距离约 40–80 cm）
4. **左手食指** 悬停在左侧 `CHORD` 圆环的任意扇区，选择和弦类型
5. **右手食指** 悬停在右侧 `NOTE` 圆环的任意扇区，选择音符
6. 双指同时命中扇区时，对应和弦即刻响起

> ⚠️ 建议在**光线充足**的环境使用，手部背景尽量简洁以提升识别精度。

---

## 🌐 浏览器兼容性

| 浏览器 | 支持情况 |
|--------|----------|
| Chrome 90+ | ✅ 完全支持（推荐） |
| Edge 90+ | ✅ 支持 |
| Firefox 90+ | ⚠️ 部分支持（MediaPipe WASM 可能受限） |
| Safari | ❌ 暂不支持（WebAssembly 限制） |

---

## 💡 关于本项目

### 开发方式

本项目采用 **Vibe Coding**（AI 辅助开发）模式快速迭代而成。坦白说，作者此前并不熟悉 React 生态，但正是借助 AI 工具的力量，在短时间内完成了从技术选型、架构设计到功能落地的全流程。每一行代码都经过人工审查与理解，项目的组件拆分、Hook 设计、碰撞检测算法等核心逻辑均由作者主导设计，AI 更多承担了"高速脚手架"的角色。

> 如果你也是 React 新手，不妨拿这个项目练手——**随便魔改，不用客气**。拆组件、换 UI 库、接 MIDI 输出、加手势……怎么玩都行。

### 设计思路

- **无依赖音频**：放弃 Tone.js 等第三方音频库，直接基于 Web Audio API 手写 OscillatorNode → GainNode → ConvolverNode 信号链，获得更轻量的包体积与更深入的对音频底层理解。
- **扇形碰撞检测**：常见圆环菜单多用 `atan2` 角度判断，但本项目结合了极坐标距离 + 角度双重校验，确保指尖精确命中扇区而非误触相邻区域。
- **镜像坐标修正**：摄像头画面天然镜像，直接使用 MediaPipe 返回的归一化坐标会导致左右颠倒——通过 `1 - x` 变换统一逻辑坐标系，使交互直觉与视觉一致。
- **双手独立状态机**：左右手各自维护独立的 `lastChord` / `lastNote` 状态，避免手指切换扇区时产生音符抖动，仅在双指同时命中时触发合成。

---

## 🤝 参与贡献

本项目完全开源，欢迎任何形式的贡献！

- 🐛 发现 Bug？直接提 [Issue](https://github.com/YanfLIZi56/OpenCV-Play-Music/issues)
- ✨ 有想法？Fork 之后尽情魔改，欢迎提 PR 合并回主仓库
- 💬 想讨论技术细节？Issue 区随时交流

无论你是 React 老手还是刚入门的新人，只要你对「手势交互 × 音乐」这个方向感兴趣，都欢迎一起来玩。

---

## 📄 License

MIT