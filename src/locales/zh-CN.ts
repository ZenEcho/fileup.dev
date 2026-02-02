export default {
  name: 'GioPic Web Extension',
  header: {
    features: '功能特性',
    demo: '演示',
    providers: '支持平台',
    marketplace: '插件市场',
    docs: '文档',
    github: 'GitHub',
    console: '控制台'
  },
  marketplace: {
    subtitle: '使用强大的社区插件扩展 GioPic。在沙箱环境中安全执行。',
    searchPlaceholder: '搜索插件...',
    installed: '已安装',
    install: '安装',
    configure: '配置',
    devGuide: '插件开发指南',
    installExtensionFirst: '请先安装 GioPic 扩展',
    installSuccess: '插件安装成功！',
    installFailed: '安装失败：',
    uninstallSuccess: '插件卸载成功！',
    uninstallFailed: '卸载失败：',
    toggleFailed: '操作失败：',
    extensionNotInstalled: '未检测到 GioPic 扩展',
    installExtensionTip: '安装插件功能需要配合 GioPic 浏览器扩展使用。',
    downloadLink: '去下载',
    uninstall: '卸载',
    enable: '启用',
    disable: '禁用',
    loadFailed: '加载插件失败',
    sort: {
      popular: '最受欢迎',
      newest: '最新上架'
    },
    categories: {
      all: '全部',
      image_hosting: '图床',
      cloud_storage: '对象存储',
      git: 'Git'
    }
  },
  admin: {
    title: '管理员审核',
    loading: '加载中...',
    noPending: '暂无待审核插件。',
    pendingTag: '待审核',
    id: 'ID',
    version: '版本',
    author: '作者',
    desc: '描述',
    codePreview: '代码预览',
    reject: '拒绝',
    approve: '通过',
    auditSuccess: '插件已{status}',
    auditFailed: '审核操作失败',
    unauthorized: '权限不足：需要管理员权限',
    loadingFailed: '加载待审核插件失败'
  },
  dashboard: {
    title: '开发者控制台',
    subtitle: '管理您的插件和提交记录',
    submitNew: '提交新插件',
    noPlugins: '暂无插件',
    noPluginsDesc: '您尚未提交任何插件。',
    getStarted: '开始提交',
    edit: '编辑',
    resubmit: '重新提交',
    status: {
      APPROVED: '已发布',
      PENDING: '审核中',
      REJECTED: '已拒绝'
    },
    loadFailed: '加载插件失败',
    editComingSoon: '编辑功能即将推出',
    published: '已上架',
    unpublished: '已下架',
    publish: '上架',
    unpublish: '下架',
    confirmPublish: '确认上架该插件？',
    confirmUnpublish: '确认下架该插件？下架后市场将不可见。',
    delete: '删除',
    deleted: '插件已删除',
    confirmDelete: '危险：确认彻底删除该插件？此操作不可逆！',
    opFailed: '操作失败',
    public: '公开',
    private: '私有'
  },
  submit: {
    title: '提交插件',
    jsonLabel: '插件 JSON 内容 (在此粘贴以自动填充)',
    jsonPlaceholder: '在此粘贴您的 plugin.json...',
    id: '插件 ID (例如 org.example.plugin)',
    idPlaceholder: 'org.example.plugin',
    name: '名称',
    namePlaceholder: '我的插件',
    version: '版本',
    versionPlaceholder: '1.0.0',
    author: '作者 (可选)',
    authorPlaceholder: '插件作者名称',
    icon: '图标 URL',
    iconPlaceholder: 'https://...',
    desc: '描述',
    descPlaceholder: '描述您的插件...',
    script: '插件脚本 (Script)',
    scriptPlaceholder: '在此粘贴或编辑插件脚本...',
    configPreview: '配置项预览 (Inputs Preview)',
    changelog: '更新日志',
    changelogPlaceholder: '此版本有哪些更新？',
    submitBtn: '提交插件',
    autoFill: '自动填充',
    autoFillSuccess: '表单已自动填充',
    success: '插件提交成功！等待审核。',
    invalidJson: '无效的 JSON 内容',
    loginFirst: '请先登录'
  },
  auth: {
    processing: '正在处理登录...',
    login: '登录',
    logout: '退出登录',
    logoutSuccess: '已退出登录'
  },
  hero: {
    tag: '🚀 v2.0 全新发布',
    title: {
      part1: '一键并发，',
      part2: '多端同步',
      part3: '浏览器图床管理新体验'
    },
    desc: 'GioPic Web Extension 是一款强大的浏览器扩展，支持 Lsky Pro、S3、OSS 等多节点并发上传。支持拖拽、粘贴、右键菜单，让素材收集从未如此高效。',
    install: '安装到 Chrome',
    source: '源码构建',
    imageAlt: 'GioPic 主界面'
  },
  features: {
    title: '为什么选择 GioPic Web Extension？',
    subtitle: '专为极客、博主和开发者打造的极致上传工具',
    list: [
      {
        title: '多节点并发分发',
        desc: '一次上传，即可同时推送到多个目标（对象存储、图床平台、GitHub），自动生成多端链接。'
      },
      {
        title: '强大的插件系统',
        desc: '支持导入 .json 格式的 JavaScript 插件，在安全沙箱中运行，无限扩展任意图床接口。'
      },
      {
        title: '智能网页感知',
        desc: '自动识别 Lsky Pro、EasyImages 等站点，一键配置。自动检测当前页面的编辑器类型。'
      },
      {
        title: '极致交互体验',
        desc: '支持悬浮球、拖拽上传、剪贴板粘贴。内置历史记录管理、批量删除和格式筛选。'
      }
    ]
  },
  showcase: {
    section1: {
      title: '智能注入，写作无忧',
      desc: 'GioPic Web Extension 能够识别 Markdown、富文本编辑器或 Discuz! 论坛。上传完成后，图片链接将自动插入到光标位置。',
      features: ['自动识别输入框', '支持 Markdown 格式', '实时进度显示'],
      imageAlt: '自动注入演示'
    },
    section2: {
      title: '右键菜单，极速采集',
      desc: '在网页上看到喜欢的图片？只需点击右键选择“GioPic 上传”，即可将其转存到您的私有图床。',
      features: ['绕过防盗链限制', '保留原始画质', '后台静默处理'],
      imageAlt: '右键上传演示'
    }
  },
  providers: {
    title: '已支持的存储服务',
    more: '+ 支持通过插件扩展更多服务',
    items: [
      'Lsky Pro', 'EasyImages', 'Chevereto', 'ImgURL', 'Hellohao',
      'SM.MS', 'Imgur', '阿里云 OSS', '腾讯云 COS', 'AWS S3',
      'GitHub Repo', '自定义 HTTP'
    ]
  },
  footer: {
    desc: '基于 Vue 3 + Vite 构建的现代化浏览器图床扩展，致力于提供最流畅的图片管理体验。',
    copyright: "github{'@'}ZenEcho",
    products: {
      title: '产品',
      items: ['下载扩展', '更新日志', '插件市场']
    },
    develop: {
      title: '开发',
      items: ['GitHub', '提交 Issue', '贡献指南']
    }
  }
}
