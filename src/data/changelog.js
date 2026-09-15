/**
 * Calculator-focused release notes (milestone-level).
 * Keep in sync with notable v2.x ships shown on the marketing changelog.
 */
export const changelogEntries = [
  {
    version: '2.7.3',
    date: '2026-09-15',
    titleEn: 'In-app changelog for the quote calculator',
    titleZh: '报价计算器站内更新日志',
    highlightsEn: [
      'New #changelog section with bilingual release timeline',
      'Ecosystem strip and footer link to recent calculator versions',
      'Points interviewers to the landing #walkthrough and API demo:curl',
    ],
    highlightsZh: [
      '新增 #changelog 中英双语版本时间线',
      '产品链条带与页脚链到计算器近期版本',
      '引导面试官去主站 #walkthrough 与 API demo:curl',
    ],
  },
  {
    version: '2.7.2',
    date: '2026-09-11',
    titleEn: 'Social og:image for link previews',
    titleZh: '社交分享预览图',
    highlightsEn: [
      '1200×630 og-image.svg for LinkedIn / X',
      'Build injects og:image + twitter:summary_large_image',
    ],
    highlightsZh: [
      '1200×630 og-image.svg，方便 LinkedIn / X 预览',
      '构建注入 og:image 与 twitter:summary_large_image',
    ],
  },
  {
    version: '2.7.1',
    date: '2026-09-04',
    titleEn: 'Ecosystem links to Rongen + walkthrough',
    titleZh: '产品链链到荣恩堂与走查',
    highlightsEn: [
      'Strip links Rongen (zh/EN) and landing #walkthrough',
      'Footer cross-link to the live client church preview',
    ],
    highlightsZh: [
      '链条带链到荣恩堂（中/EN）与主站 #walkthrough',
      '页脚增加客户堂会预览链接',
    ],
  },
  {
    version: '2.7.0',
    date: '2026-08-18',
    titleEn: 'Engagement record + CRM this-browser status',
    titleZh: '合作记录 + CRM 本机状态',
    highlightsEn: [
      'Download JSON/Markdown engagement evidence after signing',
      'CRM admin shows this-browser quote stage separately from demo seed',
    ],
    highlightsZh: [
      '签署后可下载 JSON/Markdown 合作证据',
      'CRM 管理显示本浏览器报价阶段，与演示数据分开',
    ],
  },
  {
    version: '2.6.0',
    date: '2026-08-17',
    titleEn: 'Typed proposal acceptance + kickoff checklist',
    titleZh: '键入接受提案 + 开工清单',
    highlightsEn: [
      'Proposal requires a typed name; SOW dates fill from the quote',
      'Portal tracks deposit sent + kickoff assets / copy / access',
    ],
    highlightsZh: [
      '提案需键入姓名；SOW 日期由报价自动填入',
      '门户可标记定金与开工素材 / 文案 / 权限',
    ],
  },
  {
    version: '2.5.0',
    date: '2026-08-17',
    titleEn: 'Shareable in-app proposal',
    titleZh: '可分享站内提案',
    highlightsEn: [
      'Open ?proposal=sow with the same price, scope, and quote ID',
      'Optional client name flows through proposal, invoice, and portal',
    ],
    highlightsZh: [
      '打开 ?proposal=sow，价格、范围与报价编号一致',
      '可选客户名称贯通提案、发票与门户',
    ],
  },
  {
    version: '2.4.0',
    date: '2026-08-17',
    titleEn: 'Quote-hydrated client portal',
    titleZh: '报价灌水的客户门户',
    highlightsEn: [
      '?portal=quote opens with the same price and scope',
      'Accept scope in-browser; CRM rows link to matching portals',
    ],
    highlightsZh: [
      '?portal=quote 打开后价格与范围一致',
      '浏览器内接受范围；CRM 行链到对应门户',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-07-16',
    titleEn: 'Client project status portal demo',
    titleZh: '客户项目状态页演示',
    highlightsEn: [
      'Zero-config ?portal=demo with progress and milestones',
      'Linked from CRM admin and ecosystem strip',
    ],
    highlightsZh: [
      '零配置 ?portal=demo：进度与里程碑',
      '从 CRM 管理与产品链条带可访问',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-07-13',
    titleEn: 'CRM demo mode + printable SOW / invoice',
    titleZh: 'CRM 演示模式 + 可打印提案 / 发票',
    highlightsEn: [
      '?admin=1 works offline with seed data — no API secrets',
      'Print-ready SOW HTML and deposit invoice from one quote',
    ],
    highlightsZh: [
      '?admin=1 零 API 演示数据，面试可用',
      '同一报价可打印 SOW 与定金发票',
    ],
  },
]
