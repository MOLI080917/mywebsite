/* =============================================================
   i18n.js —— 中英文语言切换（零构建 / 无依赖）
   - data-i18n="key"        ：写入 innerHTML（词典可含受信任的标签）
   - data-i18n-aria="key"   ：写入 aria-label
   - 选择记忆在 localStorage('moli-lang')，首次访问按浏览器语言
   - 必须在 main.js 之前加载（defer 保序），让入场动效直接使用当前语言
   ============================================================= */
(function () {
  'use strict';

  var DICT = {
    zh: {
      /* head */
      'meta.title': 'MOLI · Liang Yukun — 个人作品集',
      'meta.desc': 'Liang Yukun（MOLI），中职计算机专业学生、前端方向学习者的个人作品集：做过的项目、技能栈与成长路径。',

      /* 通用 */
      'common.replace': '〔可替换〕',
      'skip': '跳到主要内容',
      'nav.brandAria': 'MOLI 回到首页',
      'nav.toggleOpen': '打开菜单',
      'nav.toggleClose': '关闭菜单',
      'mm.about': '关于我', 'mm.works': '作品', 'mm.skills': '技能', 'mm.path': '经历',
      'mm.honors': '荣誉', 'mm.socials': '社交', 'mm.contact': '联系',
      'mm.lang': '切换为 ENGLISH',
      'nav.langAria': '切换语言',

      /* hero */
      'hero.role': 'Liang Yukun — 中职计算机专业学生 / 前端方向',
      'hero.tagline': '“用代码把想法做成能点开的东西。”',
      'hero.works': '看作品', 'hero.contact': '联系我',
      'hero.scrollAria': '向下滚动到关于我',

      /* about */
      'about.title': '把兴趣，<br />做成<br />能跑起来的作品。',
      'about.p1': '我是 Liang Yukun，<strong>MOLI</strong> 是我做东西时用的名字。中职选了计算机专业，从第一次在浏览器里看到自己写的页面蹦出来开始，就迷上了把想法变成作品这件事。现在主要往前端方向走，写 HTML / CSS / JavaScript，也会一点 Python 和设计工具。',
      'about.p2': '我还在学，但更习惯<strong>边学边做</strong>：每个阶段都留下一个能真正点开的东西，而不是只停在教程里。 <span class="muted">〔可替换〕</span>',
      'about.t1': '前端学习者', 'about.t2': '计算机专业中职在读', 'about.t3': '自学驱动', 'about.t4': '习惯把东西做完整',
      'about.s1': '代表作品', 'about.s2': '年写代码', 'about.s3': '课堂 / 个人练习', 'about.s4': '想学的东西',

      /* statement A */
      'sta.sub': '想法到代码到能点开的作品',

      /* works */
      'works.title': '做过的东西',
      'works.deckAria': '项目卡片，可用左右方向键切换',
      'wc0.aria': '项目 1：校园社团招新落地页', 'wc1.aria': '项目 2：待办清单 PWA',
      'wc2.aria': '项目 3：班级成绩可视化小工具', 'wc3.aria': '项目 4：MOLI 个人作品集',
      'wn0': '社团招新<br />落地页', 'wn1': '待办清单<br />PWA',
      'wn2': '成绩可视化<br />小工具', 'wn3': 'MOLI<br />作品集',
      'wd0.title': '校园社团招新落地页',
      'wd0.desc': '为学校社团做的单页招新页，包含活动介绍、报名表单校验与锚点导航。第一次完整走完「提需求 → 设计 → 编码 → 静态部署」的流程。',
      'wd0.role': '角色：独立完成设计 + 编码', 'wd0.result': '成果：招新季被 3 个社团借用',
      'wd1.title': '待办清单 PWA',
      'wd1.desc': '可离线使用、可安装到桌面的待办应用，支持增删改、优先级排序与本地持久化，关掉网络也能正常记录。',
      'wd1.role': '角色：独立开发', 'wd1.result': '成果：至今自己每天在用',
      'wd2.title': '班级成绩可视化小工具',
      'wd2.desc': '粘贴一张成绩表，就能自动生成分数分布图和进退步对比，帮老师省掉手工画图、手动排名的重复劳动。',
      'wd2.role': '角色：两人小组 · 核心开发', 'wd2.result': '成果：期末用于班级学情分析',
      'wd3.title': 'MOLI 个人作品集（本站）',
      'wd3.desc': '就是你正在看的这个网站：黑白红、零构建框架、双击 index.html 即可离线打开，动效均改编自前端效果库。',
      'wd3.role': '角色：设计 + 开发', 'wd3.result': '成果：个人品牌主页',
      'works.prev': '上一个项目', 'works.next': '下一个项目',
      'works.dot0': '项目1', 'works.dot1': '项目2', 'works.dot2': '项目3', 'works.dot3': '项目4',

      /* skills / build */
      'skills.title': '从想法，<br />到上线',
      'skills.lead': '// 不标熟练度百分比，只说我能用它们做出什么 〔可替换〕',
      'b1.t': '想清楚', 'b1.desc': '先把要做什么拆成几步，画一张潦草的草图，想清楚再动手写代码。',
      'b1.tag1': '纸笔草图', 'b1.tag2': 'Figma（基础）',
      'b2.t': '搭骨架', 'b2.desc': '用语义化 HTML 把内容和结构立起来，先能用、再谈好看，也照顾键盘与读屏。',
      'b2.tag1': '语义化结构', 'b2.tag2': '可访问性基础',
      'b3.t': '做样式', 'b3.desc': 'Flex / Grid 加响应式排版，手机和桌面端都排得稳、看得清。',
      'b3.tag1': '响应式布局',
      'b4.t': '加交互', 'b4.desc': '让页面会动、会响应：操作 DOM、监听事件，再用 GSAP 做滚动动效。',
      'b4.tag1': 'DOM 与事件', 'b4.tag2': 'GSAP 动效',
      'b5.t': '管版本', 'b5.desc': '在命令行里用 Git 记录每一次改动，推到 GitHub，留下完整的学习痕迹。',
      'b5.tag1': '命令行',
      'b6.t': '发出去', 'b6.desc': '部署成一个能直接点开的链接，发给别人真正用起来，而不是只躺在本地。',
      'b6.tag1': 'GitHub Pages 部署', 'b6.tag2': 'PWA（待办应用实践）',
      'skills.also': '// 也会一点，还在持续学',
      'skills.footTag': 'Photoshop / 剪映基础',
      'skills.note': '能不能做出来，上面的作品就是答案——这比百分比更诚实。〔可替换〕',

      /* statement B */
      'stb.sub': '走得慢一点，但一直在走',
      'mq.learn': '边学边做',

      /* path */
      'path.title': '一路怎么<br />走来',
      'path.lead': '向下滚动，横向走过这几年',
      'path.cueH': '左右滑动，横向走过这几年 →',
      'path.imgtag': 'IMG · 〔可替换〕',
      'pa0.aria': '阶段配图占位：入读中职', 'pa1.aria': '阶段配图占位：第一个网页',
      'pa2.aria': '阶段配图占位：校级技能赛', 'pa3.aria': '阶段配图占位：系统学 JavaScript',
      'pa4.aria': '阶段配图占位：第一个完整应用', 'pa5.aria': '阶段配图占位：完成本站作品集',
      'p0.t': '入读中职 · 计算机专业',
      'p0.desc': '系统学习计算机基础与编程入门，第一次知道网页是怎么被做出来的。',
      'p1.t': '写出第一个网页',
      'p1.desc': '用 HTML 写了一页个人介绍，第一次看到自己敲的代码在浏览器里变成页面。',
      'p2.t': '校级网页设计技能赛 <span class="muted">〔名次可替换〕</span>',
      'p2.desc': '第一次带着作品参加比赛，体会到做完整比写一点更重要。',
      'p3.t': '取得证书 · 系统学 JavaScript <span class="muted">〔证书可替换〕</span>',
      'p3.desc': '拿到相关等级证书，同时不再满足于静态页面，开始系统学习 JavaScript。',
      'p4.t': '第一个完整小应用跑通',
      'p4.desc': '待办 PWA 完成离线可用，开始用 GitHub 记录每一次提交和学习轨迹。',
      'p5.t': '完成本站作品集',
      'p5.desc': '把做过的东西整理成你现在看到的网站，正在寻找实习 / 升学 / 比赛组队机会。',

      /* honors */
      'honors.title': '一些<br />小荣誉',
      'honors.lead': '比赛、证书与被认可的瞬间，都收进这叠卡片里。点击卡片或箭头切换。',
      'honors.prev': '上一张荣誉', 'honors.next': '下一张荣誉',
      'honors.hint': '奖项与证书均为占位，替换 index.html 中对应卡片即可。',
      'honors.dot': '查看第 {n} 张荣誉',
      'h0.t': '校级网页设计技能赛', 'h0.org': '〔名次可替换〕',
      'h0.desc': '第一次带着完整作品站上赛场，明白了“做完”比“只写一点”更重要。',
      'h1.t': '前端相关等级证书', 'h1.org': '〔证书名称可替换〕',
      'h1.desc': '系统学习 HTML / CSS / JavaScript 后考取，是这段学习路径的一个小结。',
      'h2.t': '校园编程 / 创新比赛', 'h2.org': '〔奖项可替换〕',
      'h2.desc': '用一个能真正跑起来的小应用参赛，从想法到演示全程自己完成。〔占位〕',
      'h3.t': '优秀学生作品 / 奖学金', 'h3.org': '〔可替换〕',
      'h3.desc': '作品被老师和同学看到的时刻，也是继续做下去的动力之一。〔占位〕',
      'h4.t': '个人作品集站点上线', 'h4.org': 'SELF PROJECT',
      'h4.desc': '从零设计并手写了你正在看的这个网站，当作给自己的一份阶段答卷。',

      /* socials */
      'socials.title': '这些地方<br />也能找到我',
      'acc.douyin.name': '抖音', 'acc.bili.name': '哔哩哔哩', 'acc.weibo.name': '微博',
      'acc.close': '收起',
      'acc.douyin.h': '抖音', 'acc.bili.h': '哔哩哔哩', 'acc.weibo.h': '微博',
      'acc.douyin.desc': '用短视频记录做作品的过程与小片段，偶尔更新学习日常。〔占位文案 · 可替换〕',
      'acc.bili.desc': '放长一点的教程复盘、项目演示录屏和踩坑笔记。〔占位文案 · 可替换〕',
      'acc.ins.desc': '作品截图、配色与排版灵感，以及做东西时的工作台。〔占位文案 · 可替换〕',
      'acc.x.desc': '随手记开发笔记、转藏前端资源，也在这里关注同行在做什么。〔占位文案 · 可替换〕',
      'acc.weibo.desc': '同步作品更新与日常，也会转发设计、前端相关的内容。〔占位文案 · 可替换〕',
      'acc.douyin.s1': '作品', 'acc.douyin.s2': '粉丝', 'acc.douyin.s3': '获赞',
      'acc.bili.s1': '视频', 'acc.bili.s2': '粉丝', 'acc.bili.s3': '播放',
      'acc.ins.s1': '帖子', 'acc.ins.s2': '粉丝', 'acc.ins.s3': '关注',
      'acc.x.s1': '帖子', 'acc.x.s2': '粉丝', 'acc.x.s3': '关注',
      'acc.weibo.s1': '微博', 'acc.weibo.s2': '粉丝', 'acc.weibo.s3': '转评赞',
      'acc.go': '前往主页',
      'socials.note': '账号、数据与文案均为占位，替换 index.html 中对应 href 与文字即可上线。',

      /* contact / footer / lightbox */
      'contact.title': '一起做<br />点东西？',
      'contact.sub': '实习、比赛组队、交流学习都欢迎找我，通常当天回。 <span class="muted">〔可替换〕</span>',
      'contact.copy': '复制邮箱', 'contact.copied': '已复制 ✓',
      'contact.link2': 'B站 / 微信',
      'footer.top': '回到顶部 ↑', 'toTop.aria': '回到顶部',
      'lightbox.aria': '图片放大查看', 'lightbox.close': '关闭',
      'lightbox.imgAlt': '放大的阶段配图',
      'lightbox.ph': 'IMG · 大图占位<br />把 .hpanel__img 换成真实 &lt;img&gt; 或加 data-full 即可在此放大'
    },

    en: {
      'meta.title': 'MOLI · Liang Yukun — Portfolio',
      'meta.desc': 'Portfolio of Liang Yukun (MOLI), a vocational computer-science student and front-end learner: projects, skills and growth path.',

      'common.replace': '[EDIT ME]',
      'skip': 'Skip to main content',
      'nav.brandAria': 'MOLI — Back to home',
      'nav.toggleOpen': 'Open menu',
      'nav.toggleClose': 'Close menu',
      /* mm.about 等小字标签两态均保留中文（英文大字 + 中文小字的双语对照） */
      'mm.lang': 'SWITCH TO 中文',
      'nav.langAria': 'Switch language',

      'hero.role': 'Liang Yukun — Vocational CS Student / Front-End Track',
      'hero.tagline': '"I turn ideas into things you can click open with code."',
      'hero.works': 'View Work', 'hero.contact': 'Contact',
      'hero.scrollAria': 'Scroll down to About',

      'about.title': 'TURNING CURIOSITY<br />INTO THINGS THAT RUN.',
      'about.p1': 'I\'m Liang Yukun, and <strong>MOLI</strong> is the name I build things under. I chose computer science at vocational school, and from the first time I saw a page I\'d written pop up in the browser, I was hooked on turning ideas into real things. I\'m now focused on front-end — HTML / CSS / JavaScript — with a bit of Python and design tools.',
      'about.p2': 'I\'m still learning, but I prefer <strong>learning by building</strong>: at every stage I leave behind something you can actually open, not just follow tutorials. <span class="muted">[EDIT ME]</span>',
      'about.t1': 'Front-end learner', 'about.t2': 'Vocational CS student', 'about.t3': 'Self-taught driven', 'about.t4': 'I finish what I build',
      'about.s1': 'Featured projects', 'about.s2': 'Years coding', 'about.s3': 'Classroom / personal exercises', 'about.s4': 'Things I want to learn',

      'sta.sub': 'From idea to code to something you can open',

      'works.title': 'THINGS I\'VE BUILT',
      'works.deckAria': 'Project cards — use arrow keys to switch',
      'wc0.aria': 'Project 1: Campus Club Recruitment Landing Page', 'wc1.aria': 'Project 2: To-Do List PWA',
      'wc2.aria': 'Project 3: Class Grades Visualizer', 'wc3.aria': 'Project 4: MOLI Portfolio',
      'wn0': 'CLUB RECRUIT<br />LANDING PAGE', 'wn1': 'TO-DO LIST<br />PWA',
      'wn2': 'GRADES<br />VISUALIZER', 'wn3': 'MOLI<br />PORTFOLIO',
      'wd0.title': 'Campus Club Recruitment Landing Page',
      'wd0.desc': 'A one-page recruitment site for school clubs with event intro, form validation and anchor navigation. My first full cycle of "brief → design → code → static deploy".',
      'wd0.role': 'Role: Designed & built solo', 'wd0.result': 'Result: Used by 3 clubs during recruitment',
      'wd1.title': 'To-Do List PWA',
      'wd1.desc': 'An offline-capable, installable to-do app with CRUD, priority sorting and local persistence — it keeps working with the network off.',
      'wd1.role': 'Role: Solo developer', 'wd1.result': 'Result: I use it every day',
      'wd2.title': 'Class Grades Visualizer',
      'wd2.desc': 'Paste in a grade sheet and it auto-generates score distribution charts and progress comparisons, saving teachers from manual charting and ranking.',
      'wd2.role': 'Role: Two-person team · lead dev', 'wd2.result': 'Result: Used for end-of-term class analysis',
      'wd3.title': 'MOLI Portfolio (this site)',
      'wd3.desc': 'The site you\'re looking at: black-white-red, zero build step, opens offline by double-clicking index.html; all effects are adapted from front-end effect libraries.',
      'wd3.role': 'Role: Design & development', 'wd3.result': 'Result: Personal brand homepage',
      'works.prev': 'Previous project', 'works.next': 'Next project',
      'works.dot0': 'Project 1', 'works.dot1': 'Project 2', 'works.dot2': 'Project 3', 'works.dot3': 'Project 4',

      'skills.title': 'FROM IDEA,<br />TO SHIP',
      'skills.lead': '// No proficiency percentages — just what I can build with them [EDIT ME]',
      'b1.t': 'PLAN IT', 'b1.desc': 'Break what I want to make into steps, sketch a rough draft, and think it through before writing code.',
      'b1.tag1': 'Paper sketches', 'b1.tag2': 'Figma (basic)',
      'b2.t': 'MARK IT UP', 'b2.desc': 'Use semantic HTML to set up content and structure — works first, pretty second — with keyboard and screen-reader support.',
      'b2.tag1': 'Semantic structure', 'b2.tag2': 'Accessibility basics',
      'b3.t': 'STYLE IT', 'b3.desc': 'Flex / Grid with responsive layout — stable and readable on both phone and desktop.',
      'b3.tag1': 'Responsive layout',
      'b4.t': 'MAKE IT INTERACT', 'b4.desc': 'Make the page move and respond: manipulate the DOM, listen to events, and use GSAP for scroll motion.',
      'b4.tag1': 'DOM & events', 'b4.tag2': 'GSAP motion',
      'b5.t': 'VERSION IT', 'b5.desc': 'Use Git on the command line to record every change, push to GitHub and leave a complete learning trail.',
      'b5.tag1': 'Command line',
      'b6.t': 'SHIP IT', 'b6.desc': 'Deploy to a link anyone can open and actually use — not just sitting on my machine.',
      'b6.tag1': 'GitHub Pages deploy', 'b6.tag2': 'PWA (to-do app practice)',
      'skills.also': '// Also know a bit, still learning',
      'skills.footTag': 'Photoshop / CapCut basics',
      'skills.note': 'Can I actually build? The work above is the answer — more honest than percentages. [EDIT ME]',

      'stb.sub': 'Slowly, but always moving',
      'mq.learn': 'LEARN BY DOING',

      'path.title': 'HOW I GOT<br />HERE',
      'path.lead': 'Scroll down to travel sideways through the years',
      'path.cueH': 'Swipe sideways through the years →',
      'path.imgtag': 'IMG · [EDIT ME]',
      'pa0.aria': 'Placeholder image: Starting vocational school', 'pa1.aria': 'Placeholder image: First web page',
      'pa2.aria': 'Placeholder image: School skills contest', 'pa3.aria': 'Placeholder image: Learning JavaScript',
      'pa4.aria': 'Placeholder image: First complete app', 'pa5.aria': 'Placeholder image: Finishing this portfolio',
      'p0.t': 'Starting Vocational School · CS Major',
      'p0.desc': 'Learned computing fundamentals and programming basics — the first time I understood how web pages are made.',
      'p1.t': 'Writing My First Web Page',
      'p1.desc': 'Wrote a personal intro page in HTML and first saw my code become a page in the browser.',
      'p2.t': 'School Web Design Contest <span class="muted">[RANK EDIT ME]</span>',
      'p2.desc': 'Entered a contest with my work for the first time and learned finishing matters more than snippets.',
      'p3.t': 'Earned a Certificate · Learning JavaScript <span class="muted">[CERT EDIT ME]</span>',
      'p3.desc': 'Got a level certificate, and no longer satisfied with static pages, started learning JavaScript systematically.',
      'p4.t': 'My First Complete App Works',
      'p4.desc': 'The to-do PWA worked offline; started using GitHub to record every commit and my learning path.',
      'p5.t': 'Finishing This Portfolio',
      'p5.desc': 'Turned what I\'ve built into the site you see; now looking for internships / further study / contest teammates.',

      'honors.title': 'LITTLE<br />HONORS',
      'honors.lead': 'Contests, certificates and moments of recognition, stacked in this deck. Click a card or the arrows.',
      'honors.prev': 'Previous honor', 'honors.next': 'Next honor',
      'honors.hint': 'Awards and certificates are placeholders — replace the cards in index.html.',
      'honors.dot': 'View honor {n}',
      'h0.t': 'School Web Design Contest', 'h0.org': '[RANK EDIT ME]',
      'h0.desc': 'First time on stage with a finished project — learned "done" beats "just a little".',
      'h1.t': 'Front-End Level Certificate', 'h1.org': '[CERT NAME EDIT ME]',
      'h1.desc': 'Earned after systematically learning HTML / CSS / JavaScript — a checkpoint on this path.',
      'h2.t': 'Campus Coding / Innovation Contest', 'h2.org': '[AWARD EDIT ME]',
      'h2.desc': 'Entered with an app that actually runs — idea to demo, all solo. [PLACEHOLDER]',
      'h3.t': 'Outstanding Student Work / Scholarship', 'h3.org': '[EDIT ME]',
      'h3.desc': 'The moment teachers and classmates saw my work — fuel to keep building. [PLACEHOLDER]',
      'h4.t': 'Portfolio Site Goes Live', 'h4.org': 'SELF PROJECT',
      'h4.desc': 'Designed and hand-coded the site you\'re viewing — a checkpoint report to myself.',

      'socials.title': 'FIND ME<br />ON THESE',
      'acc.douyin.name': 'Douyin', 'acc.bili.name': 'Bilibili', 'acc.weibo.name': 'Weibo',
      'acc.close': 'Collapse',
      'acc.douyin.h': 'Douyin', 'acc.bili.h': 'Bilibili', 'acc.weibo.h': 'Weibo',
      'acc.douyin.desc': 'Short videos of my build process and clips, with occasional study updates. [PLACEHOLDER]',
      'acc.bili.desc': 'Longer tutorial recaps, project demos and notes on pitfalls. [PLACEHOLDER]',
      'acc.ins.desc': 'Screenshots of work, color & layout inspiration, and my desk while building. [PLACEHOLDER]',
      'acc.x.desc': 'Dev notes, saved front-end resources, and following what peers are building. [PLACEHOLDER]',
      'acc.weibo.desc': 'Work updates and daily posts, plus reposts on design and front-end. [PLACEHOLDER]',
      'acc.douyin.s1': 'Posts', 'acc.douyin.s2': 'Followers', 'acc.douyin.s3': 'Likes',
      'acc.bili.s1': 'Videos', 'acc.bili.s2': 'Followers', 'acc.bili.s3': 'Plays',
      'acc.ins.s1': 'Posts', 'acc.ins.s2': 'Followers', 'acc.ins.s3': 'Following',
      'acc.x.s1': 'Posts', 'acc.x.s2': 'Followers', 'acc.x.s3': 'Following',
      'acc.weibo.s1': 'Posts', 'acc.weibo.s2': 'Followers', 'acc.weibo.s3': 'Reposts · Comments · Likes',
      'acc.go': 'Visit Profile',
      'socials.note': 'Accounts, data and copy are placeholders — replace hrefs and text in index.html.',

      'contact.title': 'LET\'S BUILD<br />SOMETHING?',
      'contact.sub': 'Internships, contest teams and learning chats are all welcome — I usually reply the same day. <span class="muted">[EDIT ME]</span>',
      'contact.copy': 'Copy Email', 'contact.copied': 'Copied ✓',
      'contact.link2': 'Bilibili / WeChat',
      'footer.top': 'Back to top ↑', 'toTop.aria': 'Back to top',
      'lightbox.aria': 'Image zoom view', 'lightbox.close': 'Close',
      'lightbox.imgAlt': 'Enlarged stage image',
      'lightbox.ph': 'IMG · large placeholder<br />Replace .hpanel__img with a real &lt;img&gt; or add data-full to zoom here'
    }
  };

  var STORE_KEY = 'moli-lang';
  var docEl = document.documentElement;

  function storedLang() {
    try { return window.localStorage.getItem(STORE_KEY); } catch (e) { return null; }
  }
  function initialLang() {
    var s = storedLang();
    if (s === 'zh' || s === 'en') return s;
    var l = (window.navigator.language || 'zh').toLowerCase();
    return l.indexOf('zh') === 0 ? 'zh' : 'en';
  }

  var lang = initialLang();
  var changeCbs = [];

  function t(key) {
    var v = DICT[lang] ? DICT[lang][key] : undefined;
    if (v === undefined) v = DICT.zh[key];
    return v === undefined ? '' : v;
  }

  function paintButtons() {
    var shortLabel = lang === 'zh' ? 'EN' : '中';
    var longLabel = t('mm.lang');
    document.querySelectorAll('.nav__lang').forEach(function (b) {
      b.textContent = shortLabel;
      b.setAttribute('aria-label', t('nav.langAria'));
    });
    document.querySelectorAll('.mobile-menu__lang').forEach(function (b) { b.textContent = longLabel; });
  }

  function apply() {
    docEl.setAttribute('lang', lang === 'zh' ? 'zh-CN' : 'en');
    docEl.classList.toggle('lang-en', lang === 'en');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    document.title = t('meta.title');
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', t('meta.desc'));
    paintButtons();
  }

  function microAnimate(btn) {
    var gsap = window.gsap;
    if (!gsap) return;
    try {
      if (btn) gsap.fromTo(btn, { rotateX: -90 }, { rotateX: 0, duration: 0.4, ease: 'power2.out', transformPerspective: 400 });
      var leaf = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]')).filter(function (el) {
        if (el.parentElement && el.parentElement.closest('[data-i18n]')) return false;
        var r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      gsap.fromTo(leaf, { opacity: 0.2, y: 8 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.015, ease: 'power2.out', overwrite: true });
    } catch (e) {}
  }

  function setLang(next, sourceBtn) {
    if (next !== 'zh' && next !== 'en') next = 'en';
    if (next === lang) return;
    lang = next;
    try { window.localStorage.setItem(STORE_KEY, lang); } catch (e) {}
    apply();
    changeCbs.forEach(function (f) { try { f(lang); } catch (e) {} });
    microAnimate(sourceBtn);
    window.setTimeout(function () {
      window.dispatchEvent(new Event('resize'));
      if (window.ScrollTrigger) { try { window.ScrollTrigger.refresh(); } catch (e) {} }
    }, 80);
  }

  window.MOLI_I18N = {
    t: t,
    get lang() { return lang; },
    onChange: function (f) { if (typeof f === 'function') changeCbs.push(f); },
    setLang: setLang,
    toggle: function (btn) { setLang(lang === 'zh' ? 'en' : 'zh', btn); }
  };

  function bind() {
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('.nav__lang, .mobile-menu__lang');
      if (b) {
        e.preventDefault();
        var fromMenu = b.classList.contains('mobile-menu__lang');
        setLang(lang === 'zh' ? 'en' : 'zh', b);
        if (fromMenu) { // 在全屏菜单内切换后自动收起，让用户直接看到结果
          var tog = document.querySelector('#navToggle');
          if (tog && tog.getAttribute('aria-expanded') === 'true') tog.click();
        }
      }
    });
    apply();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
