# 阶段 7 · 可视化验证 / 性能 / 兼容 / 无障碍报告

> 对象：`index.html` + `css/variables.css` + `css/style.css` + `js/main.js`
> 验证方式：Edge（Chromium）无头真实渲染截图 + `node --check` 语法校验 + 代码走查。
> 桌面视口 1440px，移动视口 390px（无头窗口存在最小逻辑宽度限制，移动端用 390px iframe 外壳真实还原）。

---

## 1. 可视化走查结果（逐区块）

| 区块 | 桌面 1440 | 移动 390 | 结论 |
|---|---|---|---|
| 导航 Nav | MOLI. 品牌 + 5 锚点 + 滚动当前项红色下划线 | 仅品牌 + 汉堡，菜单点击展开 | 通过 |
| Hero | 巨字 MOLI 解码、红主按钮（黑字）/描边次按钮、标签换行正常 | 标签/身份语自动换行，按钮不溢出 | 通过 |
| About | 大标题、红笔底高亮、标签、04/02+/06+/∞ 数字带 | 标签自动折行、数字带 2 列 | 通过 |
| 宣言 A（深） | I BUILD THINGS. 黑白灰渐变 + 单点红扫光 | 字号按视口收窄，不溢出 | 通过 |
| Works | 01 红边红硬投影，02–04 斜向扇出；右侧详情 + 箭头/圆点 | 改为横向滑动卡片条，详情在下 | 通过 |
| Skills（深） | 红色 MOLI CORE 核心 + 6 个描边卫星节点 + 红连线；三组红色刻度条 | 星座在上、刻度条单列堆叠 | 通过 |
| 宣言 B（浅） | STILL LEARNING. 黑灰渐变 + 单点红扫光 | 同上，自适应 | 通过 |
| Path | 竖向时间线，红点/红日期/黑标题/灰描述 | 同结构，窄屏正常 | 通过 |
| Contact（近黑） | 超大白色标题、红底**黑字**邮箱按钮、下划线链接 | 按钮通宽，文字对比达标 | 通过 |
| Footer | 版权 / BUILT WITH / 回到顶部 横向分布 | 纵向堆叠 | 通过 |

中文（含繁体风格标点）与等宽英文均正常渲染，无方块、无文字截断、无横向滚动条。

### 本轮发现并修复的真实问题（5 项）
1. **解码 / 滚动揭示在"虚拟时间"下可能定格空白** → 解码加"最迟时长后直接写最终文字"兜底；滚动揭示改为初始化即查视口 + load/字体就绪复查 + 1.2s 全局全显兜底。真实浏览器本就正常，兜底确保任何环境内容绝不永久隐藏。
2. **自定义光标在页面中央幽灵显示** → 光标默认 `opacity:0`，首次 `mousemove` 才加 `.is-visible`，离开页面隐藏。
3. **技能星座卫星节点不可见** → 节点填充由"与深底同色"改为近白 7% 透明（深底上呈描边圆）；入场由 `scale(0)` 改为纯淡入并在结束后强制全显，避免动画被冻结时永久消失。
4. **作品第 4 张卡向右伸进详情文字区** → 扇出步距 x 158→104、y 44→32、旋转 8°→6°，远端卡片逐级缩小（0.78/0.66/0.56）；详情面板提升层级并铺底色，保证文字始终在卡片之上。
5. **窄屏横向溢出隐患加固** → `html,body` 均 `overflow-x:hidden;max-width:100%`，`img,svg{max-width:100%}`；手机端英文标签允许换行、宣言/联系大标题再收一档。（诊断确认页面 `scrollWidth==clientWidth`，本无真实溢出，此为防御性加固。）

另：经核查 `main.js` 全部动效用原生 rAF / WAAPI / IntersectionObserver / CSS 实现，**并未真正使用 GSAP**，故移除两条 GSAP CDN 标签，站点除 Google Fonts（可离线回退）外零运行时第三方依赖，页脚表述同步改为 `VANILLA JS`。

---

## 2. 性能

| 维度 | 情况 |
|---|---|
| 总体积 | HTML 17.5KB + CSS（3.9+21.9）+ JS 15.9 ≈ **59KB 未压缩**，无图片、无框架、无打包产物 |
| 网络请求 | 仅 1 个 JS、2 个 CSS；字体为可选 Google Fonts（`preconnect`，断网自动回退系统字体栈）；favicon 为内联 SVG，零额外请求 |
| 加载策略 | 脚本 `defer`，不阻塞解析；字体 `display=swap` 不阻塞首屏文字 |
| 滚动性能 | 所有 scroll 监听 `{passive:true}` + `requestAnimationFrame` 节流；扫光只写一个 CSS 变量 `--gy`，不触发布局 |
| 动画开销 | 仅 transform/opacity（GPU 友好）；斜向卡片用 `will-change:transform`；IO 进入视口触发一次后 `unobserve`，无持续观察 |
| 容错 | 9 个交互模块在 `boot()` 内各自 try/catch，单模块报错不影响其余模块与内容阅读 |
| 渲染稳定 | 无布局抖动；斜向卡片在 resize 时重算；无定时器轮询型逻辑 |

---

## 3. 兼容性与降级

- **目标浏览器**：Edge / Chrome / Firefox / Safari 近年版本（evergreen）。
- **无 JS**：`<html class="no-js">`，仅 `html.js [data-reveal]` 才做隐藏，因此禁用 JS 时所有内容直接完整可读（渐进增强）。
- **无 IntersectionObserver**：`onEnter` 检测到不支持时直接执行回调，内容照常显示。
- **不支持 background-clip:text**：`@supports` 包裹扫光，回退为纯色大字。
- **触屏 / 鼠标缺失（pointer:coarse）**：不启用自定义双层光标，使用系统原生光标与触摸滚动。
- **`prefers-reduced-motion`**：近乎全部动画/过渡关闭，内容与布局完整（详见样式表末尾媒体查询）。
- **断网**：Google Fonts 失败回退到 `variables.css` 的系统字体栈；无其他外链，功能不受影响，真正做到双击 `index.html` 即可离线打开。
- **响应式断点**：移动优先，768 / 1024 / 1440 三档向上增强。

---

## 4. 无障碍（A11y）

- 语义化结构：`header / nav / main / section / footer`，每个 section 带可读标题与锚点 id。
- "跳到主要内容"跳转链接（skip-link），键盘 Tab 首个焦点可达。
- 全局 `:focus-visible` 用 3px 红色描边，键盘焦点位置清晰。
- 移动端汉堡按钮具备 `aria-expanded / aria-controls`，菜单具 `aria-hidden` 联动，支持 Esc 关闭、点击链接后自动收起。
- 作品卡片区 `role=listbox`、卡片 `aria-selected`，支持左右方向键切换；翻页圆点 `aria-selected`。
- Hero 解码期间乱码层对辅助技术隐藏（`aria-hidden`），最终文字直接落在可读节点。
- 自定义光标装饰层 `aria-hidden="true"`，不干扰读屏。
- 颜色对比（数值来自 `01-color-selection.md`，WCAG）：
  - 近黑正文 × 近白底 **20.8:1（AAA）**；中灰次要文字 × 近白 **7.99:1（AA）**；近白 × 深炭反色区 **12.8:1（AAA）**。
  - 红 × 近白仅 3.65:1 → 红色**只用于大号展示字、刻度、装饰与 UI 控件**，不承担正文。
  - 红按钮文字采用近黑（黑 × 红 **5.70:1**），不使用白底白字式低对比组合。

---

## 5. 主题回归检查（对照 `00-theme-anchor.md`）

- [x] 全站仅使用 003 色板 5 色及其透明度衍生，无新增色相（红=唯一焦点/行动色）。
- [x] 锐利 Sharp（巨字、硬投影、红边）/ 极客 Geek（等宽字、星座、解码、代码注释式小标题）/ 真诚 Real（第一人称、真实学习路径、当天回的联系方式）三气质均有落点。
- [x] 6 个动效全部改编自 `001/` 效果库，未直接搬运依赖（见 `02-effect-selection.md`）。
- [x] P0/P1 模块齐全；排除清单（无博客、无主题切换、无真人照片、无构建框架）均未被违反。
- [x] 所有 AI 示例文案统一标注 `〔可替换〕`。

**阶段结论：通过，可进入阶段 8（README 与最终交付）。**

---

## 6. 修订记录：GSAP 动效升级（取代上文部分结论）

> 本节为后续迭代补记。应"动效要更高级、更有交互创意"的要求，站点重新引入 GSAP，原第 2/3/4 节中"未使用 GSAP、已移除 CDN、零第三方运行时依赖、页脚 VANILLA JS、自定义双层光标"等结论**自本节起被取代**，其余配色 / 无障碍 / 主题回归结论仍然有效。

- **动效栈**：GSAP 3.15（jsDelivr CDN，`defer` 按序加载 gsap → ScrollTrigger → ScrollToPlugin → ScrollSmoother → SplitText → ScrambleTextPlugin → DrawSVGPlugin，最后加载 `js/main.js`）。
- **能力清单**：ScrollSmoother 桌面平滑滚动（触屏 / <768px 关闭，走原生滚动）、ScrollToPlugin 锚点定位、SplitText 大标题逐行遮罩上推与 Hero 逐字 3D 升起、ScrambleText 身份行解码、ScrollTrigger 视口触发、About 数字计数、技能条增长、DrawSVG 星座描线 + 节点弹性入场 / 浮动、时间线滑入与主轴生长、宣言大字字距收拢 + 视差、主按钮磁吸。
- **自定义光标已整体移除**，全站恢复系统原生光标（相关 DOM / CSS / JS 均删除）。
- **渐进增强（三层回退，已逐项验证）**：① 无 JS 内容直接可读；② GSAP CDN 失败 / 断网 → `HAS_GSAP` 为假，自动走原生 rAF / IO 轻动效，预隐藏样式仅在 `html.js:not(.gsap-on)` 生效，不会留白；③ `prefers-reduced-motion` → 直接呈现终态。已用无头浏览器分别截图验证"无 GSAP""减少动态""桌面 1440""移动 390"四种路径，内容与终态均完整。
- **结构调整**：`<main>` 与 `<footer>` 包入 `#smooth-wrapper > #smooth-content`（固定导航与移动菜单留在包裹层外，避免被 transform 影响）；页脚中缝改为 `BUILT WITH HTML / CSS / GSAP · NO FRAMEWORK`。
- **体积与性能**：自身代码仍无图片 / 无构建；GSAP 走公共 CDN 缓存友好。ScrollSmoother 仅桌面启用，循环动画（节点浮动、连线流光）数量少且只改 transform / stroke，不触发布局；测试开关 `?nosmooth` 可临时关闭平滑滚动。
