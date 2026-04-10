import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.listings': 'Listings',
    'nav.reviews': 'Reviews',
    'nav.comments-gen': 'Auto Comments',
    'nav.rank-tracker': 'Rank Tracker',
    'nav.posts': 'Posts',
    'nav.reports': 'Reports',
    'nav.docs': 'Documentation',
    'nav.settings': 'Settings',

    // Header
    'header.search': 'Search locations...',
    'header.locations': 'Locations',
    'header.keywords': 'Keywords',

    // Comments Gen
    'comments.title': 'Auto Comments',
    'comments.subtitle': 'Generate and schedule reviews using your managed Google accounts.',
    'comments.quota': 'Monthly Quota',
    'comments.remaining': 'remaining',
    'comments.setup': 'Task Setup',
    'comments.selectAccount': 'Select Account',
    'comments.targetLocation': 'Target Location (Optional)',
    'comments.generation': 'Content Generation',
    'comments.keywords': 'Keywords / Context',
    'comments.keywordsPlaceholder': 'e.g., great coffee, friendly staff, fast wifi',
    'comments.generateBtn': 'Generate',
    'comments.reviewContent': 'Review Content',
    'comments.reviewPlaceholder': 'Generated review will appear here. You can edit it before saving.',
    'comments.photos': 'Photos (Optional)',
    'comments.addPhoto': 'Add Photo',
    'comments.saveTask': 'Save Task to Queue',
    'comments.quotaExceeded': 'Monthly quota exceeded. Cannot save new tasks.',
    'comments.errorKeywords': 'Please enter keywords first.',
    'comments.errorAccount': 'Please select a Google account.',
    'comments.errorContent': 'Please generate or write comment content.',
    'comments.success': 'Comment task saved successfully! It is now pending execution.',

    // App
    'app.title.dashboard': 'Local SEO Manager',
    'app.title.listings': 'Listings & Profile',
    'app.title.reviews': 'Unified Inbox',
    'app.title.comments-gen': 'Auto Comments',
    'app.title.rank-tracker': 'Geo-Grid Rank Tracker',
    'app.title.posts': 'Content Calendar',
    'app.title.reports': 'Analytics & Reports',
    'app.title.keywords': 'Keyword Management',
    'app.title.settings': 'API Settings',
    'app.title.docs': 'Documentation',
    'app.configWarning': 'Please configure your API settings to use the application.',
    'app.goToSettings': 'Go to Settings',
    'dashboard.subtitle': 'Welcome back. Here\'s what\'s happening with your locations today.',
    'dashboard.totalLocations': 'Total Locations',
    'dashboard.avgRating': 'Avg Rating',
    'dashboard.totalReviews': 'Total Reviews',
    'dashboard.replyRate': 'Reply Rate',
    'dashboard.unreplied': 'Unreplied',
    'dashboard.replied': 'Replied',
    'dashboard.viewAll': 'View All',
    'dashboard.traffic': 'Traffic Trend',
    'dashboard.views': 'Views',
    'dashboard.clicks': 'Clicks',
    'dashboard.topKeywords': 'Top Keywords',
    'dashboard.keyword': 'Keyword',
    'dashboard.rank': 'Rank',
    'dashboard.volume': 'Volume',
    'dashboard.trend': 'Trend',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.activity.review': 'New 5-Star Review',
    'dashboard.activity.post': 'Auto-Post Success',
    'dashboard.activity.sync': 'Location data synced',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.action.reply': 'Reply to Reviews',
    'dashboard.action.post': 'Create Post',
    'dashboard.action.sync': 'Sync Data',
    'dashboard.locationFocus': 'Location Focus',
    'dashboard.heatmap': 'Local Visibility Heatmap',
    'dashboard.updated': 'Updated',
    'dashboard.aiSuggestion': 'AI Suggestion',
    'dashboard.aiSuggestionDesc': 'You have 12 unanswered questions on the Arlington profile. Respond now to boost engagement.',
    'dashboard.openAiAssistant': 'Open AI Assistant',
    'dashboard.health': 'Health',
    
    // Listings
    'listings.title': 'Locations & Profiles',
    'listings.subtitle': 'Manage your business information across all locations.',
    'listings.syncAll': 'Sync All',
    'listings.addLocation': 'Add Location',
    'listings.search': 'Search locations...',
    'listings.status.synced': 'Synced',
    'listings.status.pending': 'Pending',
    'listings.table.name': 'Name',
    'listings.table.address': 'Address',
    'listings.table.phone': 'Phone',
    'listings.table.status': 'Status',
    'listings.table.actions': 'Actions',
    'listings.edit': 'Edit',
    'listings.view': 'View',
    'listings.editor': 'Business Info Editor',
    'listings.noLocations': 'No Locations Found',
    'listings.noLocationsDesc': 'Connect your Google Business Profile and sync to view and edit your locations here.',
    'listings.connectGoogle': 'Connect Google Account',
    'listings.businessHours': 'Business Hours',
    'listings.days.monday': 'Monday',
    'listings.days.tuesday': 'Tuesday',
    'listings.days.wednesday': 'Wednesday',
    'listings.days.thursday': 'Thursday',
    'listings.days.friday': 'Friday',
    'listings.days.saturday': 'Saturday',
    'listings.days.sunday': 'Sunday',
    'listings.discard': 'Discard Changes',
    'listings.save': 'Save Profile',
    'listings.mapPresence': 'Map Presence',
    'listings.verifiedPosition': 'Verified Position',
    'listings.searchPerformance': 'Search Performance',
    'listings.directSearches': 'Direct Searches',
    'listings.discoverySearches': 'Discovery Searches',
    'listings.viewAnalytics': 'View Detailed Analytics',

    // Reviews
    'reviews.title': 'Unified Inbox',
    'reviews.subtitle': 'Manage and reply to customer reviews across all locations.',
    'reviews.filter.all': 'All Reviews',
    'reviews.filter.unreplied': 'Unreplied',
    'reviews.filter.replied': 'Replied',
    'reviews.search': 'Search reviews...',
    'reviews.replyBtn': 'Reply',
    'reviews.aiReplyBtn': 'AI Reply',
    'reviews.repliedBy': 'Replied by',
    'reviews.aiGenerated': 'AI Generated',

    'listings.placesApiKeyBanner':
      'Google Places API key required. Add it at the top of Settings → Google Business Profile, or set GOOGLE_PLACES_API_KEY in .env.',
    'listings.placesApiKeyManualError':
      'Configure the Google Places API key in Settings (Google Business Profile section at the top), or set GOOGLE_PLACES_API_KEY in .env.',

    // Settings
    'settings.title': 'API Settings',
    'settings.subtitle': 'Configure your API keys to connect your local business data. These keys are stored securely and are required to sync your listings and reviews.',
    'settings.googleApi': 'Google Business Profile API',
    'settings.googleClientId': 'Google Client ID',
    'settings.googleClientSecret': 'Google Client Secret',
    'settings.geminiApi': 'Google Gemini API',
    'settings.geminiApiKey': 'Gemini API Key',
    'settings.googlePlacesApiKey': 'Google Places API Key',
    'settings.googlePlacesSectionTitle': 'Google Places API',
    'settings.googlePlacesApiKeyDesc':
      'Used to search and validate Google Business locations on the Listings page. Separate from OAuth (Business Profile sync).',
    'settings.googlePlacesApiKeyHint':
      'Enable Places API in Google Cloud Console, then create an API key (restrict it to Places for production).',
    'settings.googleOAuthTitle': 'Google Business Profile (OAuth)',
    'settings.googleOAuthDesc':
      'Required to sync reviews from Google and post replies. Separate from the Places API key above. Link each store to Google in Listings using Place ID.',
    'settings.saveBtn': 'Save Configuration',
    'settings.saving': 'Saving...',
    'settings.success': 'Settings saved successfully.',
    'settings.error': 'Failed to save settings.',
    'settings.teamMembers': 'Team Members',
    'settings.teamMembersDesc': 'Manage who has access to your business dashboard.',
    'settings.enterEmail': 'Enter email address',
    'settings.addMember': 'Add Member',
    'settings.noMembers': 'No team members added yet.',
    'settings.added': 'Added',
    'settings.removeMember': 'Remove member',
  },
  zh: {
    // Navigation
    'nav.dashboard': '仪表盘',
    'nav.listings': '门店管理',
    'nav.reviews': '评价管理',
    'nav.comments-gen': '自动评价',
    'nav.rank-tracker': '排名追踪',
    'nav.posts': '贴文管理',
    'nav.reports': '数据报告',
    'nav.docs': '使用文档',
    'nav.settings': '系统设置',

    // Header
    'header.search': '搜索门店...',
    'header.locations': '门店',
    'header.keywords': '关键词',

    // Comments Gen
    'comments.title': '自动评价',
    'comments.subtitle': '使用您管理的 Google 账号生成并定时发布评价。',
    'comments.quota': '本月额度',
    'comments.remaining': '剩余',
    'comments.setup': '任务设置',
    'comments.selectAccount': '选择账号',
    'comments.targetLocation': '目标门店 (可选)',
    'comments.generation': '内容生成',
    'comments.keywords': '关键词 / 上下文',
    'comments.keywordsPlaceholder': '例如：咖啡好喝，服务热情，环境安静',
    'comments.generateBtn': '生成评价',
    'comments.reviewContent': '评价内容',
    'comments.reviewPlaceholder': '生成的评价会显示在这里。您可以在保存前进行修改。',
    'comments.photos': '上传图片 (可选)',
    'comments.addPhoto': '添加图片',
    'comments.saveTask': '保存任务到队列',
    'comments.quotaExceeded': '本月额度已用完，无法保存新任务。',
    'comments.errorKeywords': '请先输入关键词。',
    'comments.errorAccount': '请选择一个 Google 账号。',
    'comments.errorContent': '请生成或手动输入评价内容。',
    'comments.success': '评价任务保存成功！已加入执行队列。',

    // App
    'app.title.dashboard': '本地 SEO 管理器',
    'app.title.listings': '门店与资料',
    'app.title.reviews': '统一收件箱',
    'app.title.comments-gen': '自动评价',
    'app.title.rank-tracker': '排名追踪',
    'app.title.posts': '贴文管理',
    'app.title.reports': '数据报告',
    'app.title.keywords': '关键词管理',
    'app.title.settings': 'API 设置',
    'app.title.docs': '使用文档',
    'app.configWarning': '请配置您的 API 设置以使用该应用程序。',
    'app.goToSettings': '前往设置',
    
    // Dashboard
    'dashboard.title': '概览',
    'dashboard.subtitle': '欢迎回来。以下是您门店今天的最新动态。',
    'dashboard.totalLocations': '总门店数',
    'dashboard.avgRating': '平均评分',
    'dashboard.totalReviews': '总评价数',
    'dashboard.replyRate': '回复率',
    'dashboard.unreplied': '未回复',
    'dashboard.replied': '已回复',
    'dashboard.viewAll': '查看全部',
    'dashboard.traffic': '流量趋势',
    'dashboard.views': '浏览量',
    'dashboard.clicks': '点击量',
    'dashboard.topKeywords': '热门关键词',
    'dashboard.keyword': '关键词',
    'dashboard.rank': '排名',
    'dashboard.volume': '搜索量',
    'dashboard.trend': '趋势',
    'dashboard.recentActivity': '近期动态',
    'dashboard.activity.review': '收到新的 5 星评价',
    'dashboard.activity.post': '贴文自动发布成功',
    'dashboard.activity.sync': '门店数据同步完成',
    'dashboard.quickActions': '快捷操作',
    'dashboard.action.reply': '回复评价',
    'dashboard.action.post': '创建贴文',
    'dashboard.action.sync': '同步数据',
    'dashboard.locationFocus': '重点门店',
    'dashboard.heatmap': '本地可见度热力图',
    'dashboard.updated': '更新于',
    'dashboard.aiSuggestion': 'AI 建议',
    'dashboard.aiSuggestionDesc': 'Arlington 门店有 12 个未回复的问题。立即回复以提升互动率。',
    'dashboard.openAiAssistant': '打开 AI 助手',
    'dashboard.health': '健康度',

    // Listings
    'listings.title': '门店与资料',
    'listings.subtitle': '管理您所有门店的商业信息。',
    'listings.syncAll': '全部同步',
    'listings.addLocation': '添加门店',
    'listings.search': '搜索门店...',
    'listings.status.synced': '已同步',
    'listings.status.pending': '待同步',
    'listings.table.name': '名称',
    'listings.table.address': '地址',
    'listings.table.phone': '电话',
    'listings.table.status': '状态',
    'listings.table.actions': '操作',
    'listings.edit': '编辑',
    'listings.view': '查看',
    'listings.editor': '商家信息编辑器',
    'listings.noLocations': '未找到门店',
    'listings.noLocationsDesc': '连接您的 Google 商家资料并同步，即可在此处查看和编辑您的门店。',
    'listings.connectGoogle': '连接 Google 账号',
    'listings.businessHours': '营业时间',
    'listings.days.monday': '星期一',
    'listings.days.tuesday': '星期二',
    'listings.days.wednesday': '星期三',
    'listings.days.thursday': '星期四',
    'listings.days.friday': '星期五',
    'listings.days.saturday': '星期六',
    'listings.days.sunday': '星期日',
    'listings.discard': '放弃更改',
    'listings.save': '保存资料',
    'listings.mapPresence': '地图展示',
    'listings.verifiedPosition': '已验证位置',
    'listings.searchPerformance': '搜索表现',
    'listings.directSearches': '直接搜索',
    'listings.discoverySearches': '发现搜索',
    'listings.viewAnalytics': '查看详细分析',

    // Reviews
    'reviews.title': '统一收件箱',
    'reviews.subtitle': '管理并回复所有门店的客户评价。',
    'reviews.filter.all': '全部评价',
    'reviews.filter.unreplied': '未回复',
    'reviews.filter.replied': '已回复',
    'reviews.search': '搜索评价...',
    'reviews.replyBtn': '回复',
    'reviews.aiReplyBtn': 'AI 智能回复',
    'reviews.repliedBy': '回复人',
    'reviews.aiGenerated': 'AI 生成',
    'reviews.syncReviews': '同步评价',
    'reviews.filter': '筛选',
    'reviews.noReviews': '未找到评价。',
    'reviews.noReviewsDesc': '点击“同步评价”从 Google 获取。',
    'reviews.noComment': '未提供评论。',
    'reviews.googleVerified': 'Google 验证评价',
    'reviews.posted': '发布于',
    'reviews.replied': '已回复',
    'reviews.respondToReview': '回复评价',
    'reviews.replyPlaceholder': '写下您的个性化回复...',
    'reviews.readyToSend': '准备发送',
    'reviews.sendReply': '发送回复',
    'reviews.selectReview': '选择一条评价以查看详情',
    'reviews.noReviewsAvailable': '暂无评价',

    'listings.placesApiKeyBanner':
      '需要 Google Places API 密钥。请在「系统设置 → Google 商家资料」区块顶部填写，或在 .env 中设置 GOOGLE_PLACES_API_KEY。',
    'listings.placesApiKeyManualError':
      '请在「系统设置 → Google 商家资料」区块顶部填写 Google Places API 密钥，或在 .env 中设置 GOOGLE_PLACES_API_KEY。',

    // Settings
    'settings.title': 'API 设置',
    'settings.subtitle': '配置您的 API 密钥以连接本地业务数据。这些密钥将被安全存储，并用于同步您的门店和评价。',
    'settings.googleApi': 'Google 商家资料 API',
    'settings.googleClientId': 'Google 客户端 ID',
    'settings.googleClientSecret': 'Google 客户端密钥',
    'settings.geminiApi': 'Google Gemini API',
    'settings.geminiApiKey': 'Gemini API 密钥',
    'settings.googlePlacesApiKey': 'Google Places API 密钥',
    'settings.googlePlacesSectionTitle': 'Google Places API',
    'settings.googlePlacesApiKeyDesc':
      '用于在「门店管理」中搜索并校验 Google 商家地点。与下方 OAuth（商家资料同步）是两套配置。',
    'settings.googlePlacesApiKeyHint':
      '在 Google Cloud 控制台启用 Places API，再创建 API 密钥（生产环境建议限制为仅 Places）。',
    'settings.googleOAuthTitle': 'Google 商家资料（OAuth 登录）',
    'settings.googleOAuthDesc':
      '用于从 Google 同步评价并发布回复，与上方的 Places API 密钥不同。在「门店管理」里用 Place ID 关联门店后即可同步。',
    'settings.saveBtn': '保存配置',
    'settings.saving': '保存中...',
    'settings.success': '设置保存成功。',
    'settings.error': '保存设置失败。',
    'settings.teamMembers': '团队成员',
    'settings.teamMembersDesc': '管理谁可以访问您的业务仪表盘。',
    'settings.enterEmail': '输入邮箱地址',
    'settings.addMember': '添加成员',
    'settings.noMembers': '暂无团队成员。',
    'settings.added': '添加于',
    'settings.removeMember': '移除成员',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
      setLanguage(savedLang);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
