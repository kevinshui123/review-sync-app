export interface Feature {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  usage: string[];
  tips?: string[];
  relatedFeatures?: string[];
}

export interface SubCategory {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  features: Feature[];
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  description: string;
  subcategories: SubCategory[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'dashboard',
    name: '数据概览',
    nameEn: 'Dashboard',
    icon: 'Dashboard',
    color: '#1e3a5f',
    description: '一站式查看所有门店的核心业务数据，快速掌握经营状况',
    subcategories: [
      {
        id: 'overview',
        name: '综合概览',
        nameEn: 'Overview',
        icon: 'Overview',
        description: '展示所有门店的整体数据摘要和关键指标',
        features: [
          {
            id: 'kpi-cards',
            name: 'KPI指标卡片',
            nameEn: 'KPI Cards',
            description: '在仪表盘顶部以卡片形式展示6个核心KPI指标：搜索展示次数、地图查看次数、网站点击次数、导航请求次数、电话拨打次数、已发布帖子数。每个卡片配有图标、当前数值和与上一周期的变化百分比。',
            usage: [
              '进入系统后默认显示仪表盘页面',
              '在顶部筛选器中选择时间范围（7天/30天/90天/12个月）',
              '选择特定门店或查看所有门店汇总数据',
              '点击刷新按钮手动更新数据',
            ],
            tips: ['颜色编码：深蓝色=搜索展示、紫色=地图查看、绿色=网站点击、橙色=导航、红色=电话、深蓝=帖子'],
          },
          {
            id: 'trend-charts',
            name: '趋势图表',
            nameEn: 'Trend Charts',
            description: '使用面积图和组合图表展示关键指标随时间的变化趋势。包括搜索展示趋势（搜索+地图双线图）和用户行为趋势（网站点击+导航+电话三线图），支持鼠标悬停查看详细数值。',
            usage: [
              '在趋势图区域查看数据随时间的变化',
              '将鼠标悬停在数据点上查看具体数值',
              '使用时间范围筛选器调整显示的时间段',
              '图表自动响应窗口宽度调整尺寸',
            ],
            tips: ['双线面积图可以直观对比搜索展示和地图查看的关系'],
          },
          {
            id: 'health-score',
            name: '门店健康评分',
            nameEn: 'Location Health Score',
            description: '综合评估所有门店的Google商业信息完整度评分，基于商家名称、地址、电话号码、网站和评价等因素计算。分数越高表示商业信息越完善，在Google搜索结果中的表现越好。',
            usage: [
              '在仪表盘底部左侧查看整体健康评分',
              '健康评分范围为0-100分',
              '绿色表示80分以上，黄色表示60-79分，红色表示60分以下',
              '点击具体门店可查看详细的健康状况',
            ],
            tips: ['定期检查健康评分，确保商业信息始终保持最新'],
          },
          {
            id: 'recent-reviews',
            name: '最新评价动态',
            nameEn: 'Recent Reviews',
            description: '实时展示来自Google和其他平台的最新客户评价，支持筛选查看所有/正面/负面评价，并显示已回复和待回复状态，帮助企业及时响应客户反馈。',
            usage: [
              '在仪表盘右侧面板查看最新评价列表',
              '使用筛选按钮切换查看全部/正面/负面评价',
              '点击评价卡片查看完整内容和回复状态',
              '点击"回复"按钮直接跳转到评价管理页面',
            ],
            tips: ['及时回复负面评价可以显著改善品牌形象'],
          },
        ],
      },
    ],
  },
  {
    id: 'listings',
    name: '商家列表管理',
    nameEn: 'Listings Management',
    icon: 'Listings',
    color: '#0ea5e9',
    description: '统一管理所有门店的Google商业信息，保持数据一致性',
    subcategories: [
      {
        id: 'location-list',
        name: '门店列表',
        nameEn: 'Location List',
        icon: 'LocationList',
        description: '以表格形式展示所有已连接的门店，显示关键信息和同步状态',
        features: [
          {
            id: 'location-table',
            name: '门店信息表格',
            nameEn: 'Location Table',
            description: '展示所有已连接Google商业资料的门店列表，包括门店名称、地址、连接账户、状态、评分、评价数量和最后同步时间。支持按名称搜索和排序。',
            usage: [
              '进入"商家列表"页面查看所有门店',
              '点击门店行查看详细信息侧边栏',
              '点击"编辑"按钮进入编辑页面修改门店信息',
              '点击"断开连接"移除不再需要的门店',
            ],
            tips: ['使用搜索框快速定位特定门店'],
          },
          {
            id: 'location-detail',
            name: '门店详情',
            nameEn: 'Location Detail Drawer',
            description: '从右侧滑出的详细信息面板，展示门店的完整Google商业信息，包括商家名称、地址、电话号码、网站链接，以及评分和评价统计。',
            usage: [
              '点击门店行中的"详情"按钮打开详情面板',
              '在详情面板中查看完整的商家信息',
              '点击"查看评价"跳转到评价管理页面',
              '点击"在Google中打开"直接跳转到Google商业页面',
            ],
          },
          {
            id: 'profile-analysis',
            name: '商业档案分析',
            nameEn: 'Profile Analysis',
            description: 'AI驱动的商业档案健康度分析，自动检测缺失的信息项并提供优化建议，帮助提升Google搜索排名和客户转化率。',
            usage: [
              '在门店详情面板中点击"AI分析"按钮',
              '等待AI完成档案分析（约10-30秒）',
              '查看分析结果中的缺失项和建议',
              '根据建议逐一完善商业信息',
            ],
            tips: ['完整的商业档案可使客户转化率提升高达50%'],
          },
        ],
      },
      {
        id: 'edit-business',
        name: '编辑商家信息',
        nameEn: 'Edit Business Info',
        icon: 'EditBusiness',
        description: '编辑和更新单个门店的Google商业信息内容',
        features: [
          {
            id: 'basic-info-edit',
            name: '基础信息编辑',
            nameEn: 'Basic Info Editing',
            description: '编辑商家名称、类别、地址、电话号码等基础商业信息。所有修改将同步到Google商业资料，确保客户获取准确信息。',
            usage: [
              '在门店列表中点击"编辑"进入编辑页面',
              '填写或修改商家基础信息表单',
              '点击"保存更改"提交修改',
              '系统自动将更改同步到Google',
            ],
            tips: ['商家名称和类别对搜索排名影响最大，应优先确保准确'],
          },
          {
            id: 'hours-edit',
            name: '营业时间编辑',
            nameEn: 'Hours Editing',
            description: '设置和更新每周每天的营业时间，包括常规营业时间、特殊假期休息时间等。准确的营业时间可减少客户因到店发现关门而产生的负面评价。',
            usage: [
              '在编辑页面找到"营业时间"部分',
              '为每天设置营业时间或标记休息',
              '添加节假日特殊营业时间',
              '保存后系统自动更新Google商业资料',
            ],
          },
          {
            id: 'photos-manage',
            name: '商家照片管理',
            nameEn: 'Photos Management',
            description: '上传和管理商家照片，包括门面照片、内部环境、产品服务展示等。高质量的图片可显著提升客户的到店意愿。',
            usage: [
              '在编辑页面找到"照片"部分',
              '点击"上传照片"添加新图片',
              '可以设置封面照片和分类管理',
              '支持批量上传多张照片',
            ],
            tips: ['建议上传至少10张高质量照片，覆盖不同产品和服务'],
          },
        ],
      },
    ],
  },
  {
    id: 'reviews',
    name: '评价管理',
    nameEn: 'Reviews Management',
    icon: 'Reviews',
    color: '#f59e0b',
    description: '集中管理所有平台的客户评价，提升在线口碑',
    subcategories: [
      {
        id: 'review-list',
        name: '评价列表',
        nameEn: 'Review List',
        icon: 'ReviewList',
        description: '集中展示来自Google等平台的所有客户评价',
        features: [
          {
            id: 'review-stream',
            name: '评价流',
            nameEn: 'Review Stream',
            description: '以信息流形式展示所有评价，支持按评分、门店、来源平台等多维度筛选，并按时间排序让最新评价优先展示。',
            usage: [
              '进入"评价"页面查看所有评价',
              '使用左侧筛选栏按状态筛选（全部/待回复/已回复）',
              '使用顶部搜索框搜索评价内容或用户名',
              '选择排序方式（新到旧/旧到新/高评分/低评分）',
            ],
          },
          {
            id: 'review-detail',
            name: '评价详情',
            nameEn: 'Review Detail Panel',
            description: '在右侧面板展示选中评价的完整内容，包括评价文本、评分、来源平台、发布时间，以及已回复内容预览。',
            usage: [
              '点击评价卡片查看完整详情',
              '在详情面板中阅读完整评价内容',
              '查看该评价是否已有回复',
              '使用AI生成回复或手动撰写回复',
            ],
          },
          {
            id: 'reply-draft',
            name: '撰写回复',
            nameEn: 'Draft Reply',
            description: '为评价撰写专业回复，支持手动输入或AI辅助生成。回复可选择三种语气风格：专业、友好、同理心，满足不同场景需求。',
            usage: [
              '在评价详情面板底部文本框中输入回复内容',
              '或点击"AI回复"按钮生成建议回复',
              '从三种语气中选择合适的风格',
              '点击"发送回复"将回复提交到Google',
            ],
            tips: ['AI生成的回复可根据语气风格进一步编辑调整'],
          },
        ],
      },
      {
        id: 'automations',
        name: '自动回复',
        nameEn: 'Auto Replies',
        icon: 'Automations',
        description: '设置自动评价回复规则，减少人工回复工作量',
        features: [
          {
            id: 'auto-reply-rules',
            name: '自动回复规则',
            nameEn: 'Auto Reply Rules',
            description: '创建基于评分或关键词的自动回复规则。例如，所有5星评价自动发送感谢语，特定关键词触发特定回复模板。',
            usage: [
              '进入"评价"页面，点击"自动回复"标签',
              '点击"添加规则"创建新规则',
              '设置触发条件（评分范围/关键词）',
              '编写或选择回复模板',
            ],
            tips: ['自动回复不能完全替代人工回复，建议用于常见场景的快速响应'],
          },
          {
            id: 'reply-templates',
            name: '回复模板库',
            nameEn: 'Reply Templates',
            description: '预设多种场景的回复模板，包括感谢回复、问题道歉、改进承诺等，方便快速选择使用。支持自定义添加和编辑模板内容。',
            usage: [
              '在自动回复页面查看预设模板',
              '点击模板预览完整内容',
              '选择模板应用到规则中',
              '支持创建自定义模板',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'bulk-edits',
    name: '批量编辑',
    nameEn: 'Bulk Edits',
    icon: 'BulkEdits',
    color: '#8b5cf6',
    description: '一次操作更新多个门店信息，大幅提升工作效率',
    subcategories: [
      {
        id: 'wizard-flow',
        name: '三步向导',
        nameEn: 'Three-Step Wizard',
        icon: 'Wizard',
        description: '引导式批量编辑流程，分步完成选择门店、填写字段、确认提交',
        features: [
          {
            id: 'step-select-locations',
            name: '步骤一：选择门店',
            nameEn: 'Step 1: Select Locations',
            description: '从已连接的门店列表中选择需要批量编辑的目标门店，支持全选/取消全选，方便快速操作。显示每个门店的当前评分和评价数量供参考。',
            usage: [
              '进入"批量编辑"页面',
              '查看当前连接的所有门店列表',
              '勾选需要批量编辑的门店',
              '点击"全选"快速选择所有门店',
              '确认选择后点击"下一步"',
            ],
          },
          {
            id: 'step-fill-fields',
            name: '步骤二：填写字段',
            nameEn: 'Step 2: Fill Fields',
            description: '填写需要批量更新的字段值，可以同时更新电话号码、网站URL、地址等字段。系统仅更新有填写值的字段，空白字段保持不变。',
            usage: [
              '在表单中填写需要更新的字段值',
              '只需填写需要修改的字段，其他可留空',
              '预览将要更新的字段列表',
              '确认无误后点击"下一步"',
            ],
            tips: ['此步骤仅填写要修改的字段，不填写的字段不会被覆盖'],
          },
          {
            id: 'step-review-apply',
            name: '步骤三：审核并应用',
            nameEn: 'Step 3: Review & Apply',
            description: '在提交前审核所有更改，确认受影响门店数量和更新字段汇总。点击"应用更改"后系统将批量更新所有选中门店的Google商业信息。',
            usage: [
              '查看更改摘要：门店数量和字段数量',
              '查看将要应用的详细更改内容',
              '点击"应用更改"开始批量更新',
              '等待处理完成后查看结果',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'edits-log',
    name: '操作日志',
    nameEn: 'Activity Log',
    icon: 'EditsLog',
    color: '#10b981',
    description: '记录所有操作历史，便于追溯和审计',
    subcategories: [
      {
        id: 'log-view',
        name: '日志查看',
        nameEn: 'Log Viewer',
        icon: 'LogViewer',
        description: '以时间线形式展示所有操作记录，包括创建、编辑、删除、同步等各类操作',
        features: [
          {
            id: 'activity-timeline',
            name: '活动时间线',
            nameEn: 'Activity Timeline',
            description: '以卡片式时间线展示所有操作记录，每条记录包含操作类型、涉及实体、操作详情、时间和状态。便于追溯每个门店的所有变更历史。',
            usage: [
              '进入"操作日志"页面查看操作记录',
              '时间从新到旧排列，最新操作在最前',
              '每条记录显示操作类型和详情',
              '点击记录可查看更多详情',
            ],
          },
          {
            id: 'log-filters',
            name: '日志筛选',
            nameEn: 'Log Filters',
            description: '支持按操作类型筛选日志记录：全部活动、仅创建、仅帖子、仅回复、仅同步、仅删除。方便快速定位特定类型的操作。',
            usage: [
              '使用左侧筛选栏按操作类型筛选',
              '点击筛选按钮只显示特定类型记录',
              '筛选条件组合使用可精确定位',
              '点击刷新按钮重新加载最新日志',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'publishing',
    name: '内容发布',
    nameEn: 'Content Publishing',
    icon: 'Publishing',
    color: '#ec4899',
    description: '创建和管理Google商家帖子，保持活跃的在线存在感',
    subcategories: [
      {
        id: 'calendar-view',
        name: '日历视图',
        nameEn: 'Calendar View',
        icon: 'Calendar',
        description: '以日历形式展示已发布和待发布的帖子，便于规划内容发布计划',
        features: [
          {
            id: 'calendar-grid',
            name: '日历网格',
            nameEn: 'Calendar Grid',
            description: '月历视图展示每天的帖子安排，不同颜色区分已发布（绿色）、已排期（蓝色）和草稿（橙色）状态。点击日期可查看当天所有帖子详情。',
            usage: [
              '进入"内容发布"页面查看日历视图',
              '使用左右箭头切换上/下个月',
              '点击"今天"快速回到当前日期',
              '查看每天日期格中的帖子标签',
              '悬停在帖子上查看预览',
            ],
            tips: ['建议提前规划一个月的内容发布计划，保持发布频率稳定'],
          },
          {
            id: 'post-list',
            name: '帖子列表',
            nameEn: 'Post List',
            description: '在日历下方或侧边显示当前筛选条件下的所有帖子列表，支持按门店和状态筛选，显示每个帖子的内容摘要、发布时间和当前状态。',
            usage: [
              '使用顶部筛选器按门店筛选帖子',
              '按状态筛选：全部/已发布/已排期/草稿',
              '点击帖子行可展开更多操作',
              '支持直接从列表发布、编辑或删除',
            ],
          },
        ],
      },
      {
        id: 'create-post',
        name: '创建帖子',
        nameEn: 'Create Post',
        icon: 'CreatePost',
        description: '创建新的Google商家帖子，支持立即发布或定时发布',
        features: [
          {
            id: 'post-composer',
            name: '帖子编辑器',
            nameEn: 'Post Composer',
            description: '使用帖子编辑器撰写帖子内容，支持添加文字描述，选择目标门店，设置发布方式（立即发布或定时发布）。内容将直接同步到Google商业页面。',
            usage: [
              '点击右下角"+"按钮打开帖子编辑器',
              '在文本框中输入帖子内容',
              '选择目标门店（可选多个）',
              '设置发布时间：立即发布或选择未来时间',
              '点击"发布"或"保存草稿"完成',
            ],
            tips: ['帖子内容建议包含关键词和号召性用语，提高客户参与度'],
          },
          {
            id: 'publish-now',
            name: '立即发布',
            nameEn: 'Publish Now',
            description: '编辑完帖子内容后直接点击发布，帖子将立即同步到Google商业页面，立即展示给潜在客户。适合时效性强的内容。',
            usage: [
              '填写帖子内容',
              '不设置发布时间（留空）',
              '点击"发布"按钮',
              '确认发布成功提示',
            ],
          },
          {
            id: 'schedule-post',
            name: '定时发布',
            nameEn: 'Schedule Post',
            description: '设置未来的发布时间，系统将在指定时间自动将帖子发布到Google。适合提前规划营销活动，确保内容按时上线。',
            usage: [
              '填写帖子内容',
              '点击日期时间选择器',
              '选择未来的发布日期和时间',
              '点击"定时发布"保存排期',
              '在日历中查看已排期的帖子',
            ],
            tips: ['建议在工作时间内发布帖子以获得更好的互动'],
          },
          {
            id: 'post-quick-actions',
            name: '快捷操作',
            nameEn: 'Quick Actions',
            description: '在日历视图中对已排期的帖子进行快捷操作：点击发布按钮可立即发布，点击删除按钮可取消帖子。悬停时显示操作按钮。',
            usage: [
              '将鼠标悬停在已排期帖子上',
              '点击发送图标立即发布',
              '点击删除图标取消帖子',
              '操作后自动刷新日历视图',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'reports',
    name: '数据报告',
    nameEn: 'Reports',
    icon: 'Reports',
    color: '#f97316',
    description: '深度分析业务数据，导出专业报告辅助决策',
    subcategories: [
      {
        id: 'performance-report',
        name: '绩效报告',
        nameEn: 'Performance Report',
        icon: 'Performance',
        description: '详细分析Google商业资料的绩效数据，包括展示、点击、转化等关键指标',
        features: [
          {
            id: 'search-performance',
            name: '搜索绩效分析',
            nameEn: 'Search Performance',
            description: '展示在Google搜索中的表现数据，包括搜索展示次数和地图展示次数的趋势图、月度对比表、饼图分析和周数据柱状图，全面了解品牌曝光情况。',
            usage: [
              '选择门店和时间范围',
              '查看搜索展示趋势图',
              '查看月度数据对比表格',
              '查看搜索vs地图展示占比饼图',
              '查看最近7天的柱状图数据',
            ],
          },
          {
            id: 'actions-performance',
            name: '行为绩效分析',
            nameEn: 'Actions Performance',
            description: '分析用户的实际行为数据，包括导航请求次数、电话拨打次数，以及两类行为的趋势对比和占比分析，帮助了解客户转化路径。',
            usage: [
              '查看导航和电话的趋势变化图',
              '查看月度行为数据对比',
              '查看导航vs电话占比饼图',
              '分析不同时段的用户行为差异',
            ],
          },
          {
            id: 'date-range-filter',
            name: '日期范围筛选',
            nameEn: 'Date Range Filter',
            description: '灵活设置数据报告的时间范围，支持自定义起止日期，便于对比不同时间段的表现，发现增长趋势或问题。',
            usage: [
              '点击开始日期选择器',
              '选择报告起始日期',
              '点击结束日期选择器',
              '选择报告结束日期',
              '数据自动更新为选定范围',
            ],
          },
          {
            id: 'pdf-export',
            name: 'PDF导出',
            nameEn: 'PDF Export',
            description: '将当前报告数据导出为专业的PDF文档，包含所有图表和数据表格，方便与团队分享或存档。文档格式美观，可直接用于演示。',
            usage: [
              '设置好筛选条件查看数据',
              '点击页面右侧"下载PDF"按钮',
              '等待PDF生成（约5-10秒）',
              '浏览器自动下载PDF文件',
              '可在本地查看或分享给他人',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'seo',
    name: '本地SEO优化',
    nameEn: 'Local SEO',
    icon: 'SEO',
    color: '#06b6d4',
    description: '提升本地搜索排名，增加门店曝光和客流',
    subcategories: [
      {
        id: 'local-search-grid',
        name: '本地搜索网格',
        nameEn: 'Local Search Grid',
        icon: 'Grid',
        description: '可视化分析门店在不同地理位置的搜索排名情况',
        features: [
          {
            id: 'keyword-scan',
            name: '关键词扫描',
            nameEn: 'Keyword Scan',
            description: '输入目标关键词，分析门店在不同地理位置的Google搜索排名。使用网格扫描技术，在门店周围生成多个采样点，评估排名覆盖度。',
            usage: [
              '输入目标关键词（如"餐厅"）',
              '选择网格密度（3x3/5x5/7x7/9x9）',
              '选择扫描半径（1-20英里）',
              '点击"扫描"开始分析',
            ],
            tips: ['建议扫描半径覆盖主要客源区域'],
          },
          {
            id: 'rank-visualization',
            name: '排名可视化',
            nameEn: 'Rank Visualization',
            description: '在交互式地图上展示扫描结果，不同颜色表示不同排名区间：绿色=前3名（优秀）、黄色=4-10名（良好）、红色=10名以后（需改进）。直观了解排名地理分布。',
            usage: [
              '扫描完成后自动显示地图',
              '地图上每个点代表一个采样位置',
              '点击数据点查看该位置排名详情',
              '查看图例了解颜色含义',
              '缩放和平移地图查看更多区域',
            ],
          },
          {
            id: 'grid-statistics',
            name: '网格统计',
            nameEn: 'Grid Statistics',
            description: '汇总扫描结果的关键统计数据：平均排名、前3名占比、前10名占比、扫描点总数等。量化评估整体搜索表现。',
            usage: [
              '扫描完成后查看顶部统计卡片',
              '平均排名反映整体搜索表现',
              '前3名占比越高越好',
              '对比不同关键词的统计结果',
            ],
          },
          {
            id: 'grid-point-table',
            name: '网格数据表',
            nameEn: 'Grid Point Table',
            description: '以表格形式列出所有扫描点的详细数据，包括位置编号、排名、搜索结果总数。方便导出和分析具体数据。',
            usage: [
              '在地图下方查看数据表',
              '点击行数据可在地图上高亮对应位置',
              '按排名排序快速找到最优和最差点位',
              '复制数据用于其他分析',
            ],
          },
        ],
      },
      {
        id: 'citations',
        name: '本地引用',
        nameEn: 'Local Citations',
        icon: 'Citations',
        description: '追踪和管理门店在各大目录平台的引用信息',
        features: [
          {
            id: 'citation-tracker',
            name: '引用追踪器',
            nameEn: 'Citation Tracker',
            description: '自动扫描互联网上与门店相关的商业引用，追踪在Google、Yelp、Facebook等平台的展示情况，确保NAP（名称、地址、电话）信息一致。',
            usage: [
              '进入SEO页面，点击"引用"标签',
              '系统自动获取门店基础信息',
              '查看已发现的引用列表',
              '检查每个引用的信息一致性',
            ],
          },
          {
            id: 'citation-audit',
            name: '引用审计',
            nameEn: 'Citation Audit',
            description: '对比不同平台上的门店信息，发现不一致的引用项。高亮显示存在信息差异的平台，便于逐一修正，提高引用质量。',
            usage: [
              '在引用页面查看审计结果',
              '绿色表示信息一致',
              '黄色表示需要确认',
              '点击具体项目查看详情',
            ],
          },
        ],
      },
      {
        id: 'seo-optimization',
        name: 'SEO优化建议',
        nameEn: 'SEO Optimization',
        icon: 'Optimization',
        description: 'AI驱动的SEO健康度分析和优化建议',
        features: [
          {
            id: 'seo-health-score',
            name: 'SEO健康评分',
            nameEn: 'SEO Health Score',
            description: '基于AI分析生成0-100的综合SEO健康评分，综合评估商业档案完整性、内容质量、评价状况等因素。环形进度图直观展示当前分数。',
            usage: [
              '点击"生成报告"开始分析',
              '等待AI完成分析（约10-30秒）',
              '查看SEO健康评分环形图',
              '分数越高表示SEO状况越好',
            ],
          },
          {
            id: 'quick-wins',
            name: '快速优化项',
            nameEn: 'Quick Wins',
            description: '列出最容易实施且效果明显的优化建议，按影响程度分级（高/中/低）。帮助优先处理最高价值的优化任务，快速提升搜索排名。',
            usage: [
              '查看健康评分下方的快速优化列表',
              '按影响程度排序，高优先级在上',
              '逐项查看具体优化建议',
              '按建议操作完成优化',
            ],
            tips: ['从高影响建议开始，可以最快看到排名提升效果'],
          },
        ],
      },
      {
        id: 'real-comment',
        name: '真实评价获取',
        nameEn: 'Real Reviews',
        icon: 'RealReviews',
        description: '帮助企业获取更多真实的Google评价，提升在线口碑',
        features: [
          {
            id: 'review-link-generator',
            name: '评价链接生成器',
            nameEn: 'Review Link Generator',
            description: '为每个门店生成专属的Google评价链接，方便客户直接跳转撰写评价。支持多门店批量生成。',
            usage: [
              '进入"真实评价"页面',
              '系统自动为已连接门店生成评价链接',
              '复制链接用于发送给客户',
              '点击直接跳转到Google评价页面',
            ],
          },
        ],
      },
      {
        id: 'rednote-seo',
        name: '小红书SEO',
        nameEn: 'RedNote SEO',
        icon: 'RedNote',
        description: '针对小红书平台的内容优化建议',
        features: [
          {
            id: 'rednote-tips',
            name: '小红书运营技巧',
            nameEn: 'RedNote Tips',
            description: '提供针对小红书平台的内容发布和优化技巧，帮助企业在这个重要平台建立存在感。包括标签建议、关键词优化、内容格式指导等。',
            usage: [
              '进入"小红书SEO"页面',
              '查看平台特点介绍',
              '学习内容发布最佳实践',
              '应用建议到实际内容运营中',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'settings',
    name: '系统设置',
    nameEn: 'Settings',
    icon: 'Settings',
    color: '#64748b',
    description: '配置API密钥和系统参数',
    subcategories: [
      {
        id: 'api-keys',
        name: 'API密钥配置',
        nameEn: 'API Keys',
        icon: 'ApiKeys',
        description: '配置各平台API密钥以启用相应功能',
        features: [
          {
            id: 'embedsocial-key',
            name: 'EmbedSocial API密钥',
            nameEn: 'EmbedSocial API Key',
            description: '配置EmbedSocial API密钥以连接Google商业资料、获取评价数据和发布帖子。密钥可在EmbedSocial后台获取。',
            usage: [
              '进入"设置"页面',
              '找到EmbedSocial API密钥输入框',
              '粘贴从EmbedSocial后台获取的密钥',
              '点击保存并等待验证',
            ],
          },
          {
            id: 'gemini-key',
            name: 'Gemini API密钥',
            nameEn: 'Gemini API Key',
            description: '配置Google Gemini API密钥以启用AI回复生成、商业档案分析等智能功能。密钥可在Google AI Studio获取。',
            usage: [
              '在设置页面找到Gemini API配置',
              '输入有效的Gemini API密钥',
              '保存后AI功能自动启用',
              '可在仪表盘右上角查看积分余额',
            ],
          },
          {
            id: 'openai-key',
            name: 'OpenAI API密钥',
            nameEn: 'OpenAI API Key',
            description: '配置OpenAI API密钥作为Gemini的备选方案，用于AI功能。当Gemini不可用时可自动切换。',
            usage: [
              '在设置页面找到OpenAI API配置',
              '输入有效的OpenAI API密钥',
              '保存后作为备用AI服务',
            ],
          },
        ],
      },
      {
        id: 'language-settings',
        name: '语言设置',
        nameEn: 'Language Settings',
        icon: 'Language',
        description: '设置系统界面语言',
        features: [
          {
            id: 'ui-language',
            name: '界面语言',
            nameEn: 'UI Language',
            description: '切换系统界面的显示语言，支持中文和英文。界面文字将根据设置的语言版本显示。',
            usage: [
              '在设置页面找到语言选项',
              '选择目标语言（中文/English）',
              '界面自动刷新为所选语言',
              '刷新页面后设置保持生效',
            ],
          },
        ],
      },
    ],
  },
];
