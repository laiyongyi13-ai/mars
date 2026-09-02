# Mars Garden · 火星花园 — 交接文档

YY（华南理工 UX/交互设计）的个人作品集网站。主题：火星上开花。

---

## 技术栈
- React 18 + Vite 5 + `@vitejs/plugin-react`
- `@react-three/fiber`（r3f，声明式 three.js）+ `@react-three/drei`（`Html` 标签、`useGLTF`）
- `three`（程序化地形/花朵/粒子/相机）
- `hanzi-writer`（联系区「向阳而生」逐笔书写）

## 启动 / 构建
```bash
cd bloom-on-mars
npm install
npm run dev      # http://localhost:5173
npm run build    # 出包到 dist/
```
Shell 为 Windows cmd.exe（无 PowerShell cmdlet，如 Select-String 不可用）。

---

## 目录结构
```
bloom-on-mars/
├─ index.html               # Vite 入口，含 Google Fonts (Cormorant Garamond / Inter / Ma Shan Zheng)
├─ vite.config.js
├─ assets/works/            # 作品图 1~4 的 cover/full（Vite import 引用，返回 URL）
├─ public/models/
│  ├─ heimeiqiu.glb         # 黑煤球吉祥物模型（Tripo 导出，单网格无骨骼无动画）
│  └─ heimeiqiu_wave.glb    # 待生成：带挥手动画的版本
├─ tools/rig_wave.py        # Blender 脚本：给模型加骨骼+挥手动画并导出 wave 版
├─ css/style.css            # 全站样式（唯一样式文件）
└─ src/
   ├─ main.jsx              # createRoot + import css
   ├─ App.jsx               # 组装：Cursor / MarsScene / Nav / main(各 section) / WorkPreview / Lightbox
   ├─ data/works.js         # WORKS[]（title/sub/type/cover/full/desc）、GLOW、flowerSVG()
   ├─ hooks/useReveal.js    # useReveal(IntersectionObserver 加 .in) + useParallax
   ├─ scene/MarsScene.jsx   # ★核心 3D：地形/岩石/花田/黑煤球/相机
   └─ components/
      ├─ Loader / Nav / Dust / Hero / Player / Cursor
      ├─ About / Timeline / Garden      # 用 SplitText 标题，无排序编号
      ├─ Contact                        # hanzi-writer 逐笔书写
      ├─ SplitText / WorkPreview / Lightbox
```

---

## 关键机制（都在 `src/scene/MarsScene.jsx`）

### 相机滚动飞行 — `CameraRig`
- 全页滚动进度 `p`（pageYOffset / max）驱动相机 z 向前飞。
- 用 `keyframe(p, stops)` + `smooth` 做分段关键帧。
- 关键点位（由 DOM 实测）：`gp`=`#garden` 到达比例；`aStart/aEnd`=`#about` 区间。
- **About 平台段**：`[aStart, aEnd]` 相机定格在「对准黑煤球」机位（`FOCUS`），滚动几乎不推进 = 阻力/停留感，暗示信息+黑煤球是一个部分。
- `focus` 权重把视线从「向前」切到黑煤球头部；注视点为 `MASCOT_X - 1.8`，让黑煤球稳定偏右不居中。

### 黑煤球吉祥物 — `Mascot` / `MascotModel`
- `useGLTF("/models/heimeiqiu.glb")`，按包围盒归一化：缩放到 `MASCOT_H=3.8`、居中、底部贴地。
- 位置常量：`MASCOT_X=5.5, MASCOT_Z=-15`；朝向 `rotation.y=-0.46 + MASCOT_YAW`（背对相机就把 `MASCOT_YAW` 设 `Math.PI`）。
- **打招呼**：`IntersectionObserver` 监听 `#about`，进入区（可见>35%）时 `greet` 组做 跳+摆身+点头+挤压拉伸（因模型无骨骼，用整体动作近似）。
- 待办见下。

### 花田 / 作品 — `FlowerField` / `FeatureFlower`
- `FlowerField` 用 `IntersectionObserver` 监听 `#garden`，可见>25% 才 `active`。
- 特写花（4 个 WORKS）**只有 active 后**才发光/可点/可预览（光晕/点光/地环/Html 标签/命中球都条件渲染）；未 active 时是普通花。
- 位置：`xs=[-11,-4,4,11]`, `zs=[-40,-43,-42.5,-40]`（较远，相机飞行范围已相应拉长）。
- 点击 `onOpen(idx)` → App 打开 `Lightbox`；悬停 `onHover(idx)` → App 显示 `WorkPreview`（光标跟随封面预览，原生 rAF，无 framer-motion）。

### 点击穿透
`css/style.css`：`main { pointer-events: none }`，只有 `a/button/input/.tl-card/.tag/.skill/.contact-copy` 恢复 `auto`，`.mars-canvas` 为 `auto`。这样作品区空白处点击会穿透到底层 3D 画布，命中特写花。

### 其它
- 地形：`SIZE=80, DEPTH=150`（z 拉长把远边推入雾里，消除地平线硬边）；`fogExp2` 密度 0.028。
- `.section-fade-bottom { display:none }`（已废弃的渐变黑边）。
- 各模块小字已整体放大（section-tag/desc、about 正文、tag/skill、timeline、contact、footer）。

---

## 待办 / 下一步
1. **真挥手动画**：装 Blender 后运行
   ```
   cd bloom-on-mars/tools
   blender --background --python rig_wave.py
   ```
   得到 `public/models/heimeiqiu_wave.glb`（含 `wave` clip）。
   若摆动部位不对，调 `rig_wave.py` 顶部 `ARM_BOX_MIN/MAX`。
   拿到文件后：把 `MASCOT_URL` 改为 wave 版，用 drei `useAnimations` 在进入 `#about` 时 `play("wave")`、离开 `stop/fadeOut`，替换现在的程序化 `greet` 动作。
2. 打包体积 >500KB 警告（含 GLTF loader）——需要时再做 `manualChunks` 代码分割。

## 常用微调点
- 黑煤球大小/朝向：`MASCOT_H` / `MASCOT_YAW`（MarsScene.jsx 顶部吉祥物段）。
- 黑煤球偏右幅度：`CameraRig` 里 `MASCOT_X - 1.8` 的偏移量。
- About 停留时长：`css` 里 `.about { min-height }` 或 `aStart/aEnd` 的 `0.18/0.82` 系数。
- 花田远近 / 到达节奏：`zs`、`FIELD_Z`、`CameraRig` 的 z 关键帧（`14 → -26 → -50`）。
