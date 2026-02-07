export default {
  name: 'GioPic Web Extension',
  header: {
    features: 'Features',
    demo: 'Demo',
    providers: 'Providers',
    marketplace: 'Marketplace',
    docs: 'Docs',
    github: 'GitHub',
    console: 'Console'
  },
  marketplace: {
    subtitle: 'Extend GioPic with powerful community plugins. Securely executed in a sandboxed environment.',
    searchPlaceholder: 'Search plugins...',
    installed: 'Installed',
    install: 'Install',
    configure: 'Configure',
    devGuide: 'Plugin Dev Guide',
    installExtensionFirst: 'Please install GioPic extension first',
    installSuccess: 'Plugin installed successfully!',
    installFailed: 'Installation failed: ',
    uninstallSuccess: 'Plugin uninstalled successfully!',
    uninstallFailed: 'Uninstall failed: ',
    toggleFailed: 'Operation failed: ',
    extensionNotInstalled: 'GioPic Extension Not Detected',
    installExtensionTip: 'Plugin installation requires the GioPic browser extension.',
    downloadLink: 'Download Now',
    uninstall: 'Uninstall',
    enable: 'Enable',
    disable: 'Disable',
    loadFailed: 'Failed to load plugins',
    sort: {
      popular: 'Most Popular',
      newest: 'Newest'
    },
    categories: {
      all: 'All',
      image_hosting: 'Image Hosting',
      cloud_storage: 'Cloud Storage',
      git: 'Git'
    }
  },
  admin: {
    title: 'Admin Review',
    loading: 'Loading...',
    noPending: 'No pending plugins.',
    pendingTag: 'PENDING',
    id: 'ID',
    version: 'Version',
    author: 'Author',
    desc: 'Description',
    codePreview: 'Code Preview',
    reject: 'Reject',
    approve: 'Approve',
    auditSuccess: 'Plugin {status}',
    auditFailed: 'Audit failed',
    unauthorized: 'Unauthorized: You need ADMIN role',
    loadingFailed: 'Failed to load pending plugins'
  },
  dashboard: {
    title: 'Developer Console',
    subtitle: 'Manage your plugins and submissions',
    submitNew: 'Submit New Plugin',
    noPlugins: 'No Plugins Yet',
    noPluginsDesc: "You haven't submitted any plugins yet.",
    getStarted: 'Get Started',
    edit: 'Edit',
    resubmit: 'Resubmit',
    status: {
      APPROVED: 'APPROVED',
      PENDING: 'PENDING',
      REJECTED: 'REJECTED'
    },
    loadFailed: 'Failed to load plugins',
    editComingSoon: 'Edit feature coming soon',
    published: 'Published',
    unpublished: 'Unpublished',
    publish: 'Publish',
    unpublish: 'Unpublish',
    confirmPublish: 'Publish this plugin?',
    confirmUnpublish: 'Unpublish this plugin? It will be hidden from marketplace.',
    delete: 'Delete',
    deleted: 'Plugin deleted',
    confirmDelete: 'Danger: Permanently delete this plugin? This cannot be undone!',
    opFailed: 'Operation failed',
    public: 'Public',
    private: 'Private'
  },
  submit: {
    title: 'Submit Plugin',
    jsonLabel: 'Plugin JSON Content (Paste here to auto-fill)',
    jsonPlaceholder: 'Paste your plugin.json here...',
    id: 'Plugin ID (e.g. org.example.plugin)',
    idPlaceholder: 'org.example.plugin',
    name: 'Name',
    namePlaceholder: 'My Plugin',
    version: 'Version',
    versionPlaceholder: '1.0.0',
    author: 'Author (Optional)',
    authorPlaceholder: 'Plugin Author Name',
    icon: 'Icon URL',
    iconPlaceholder: 'https://...',
    desc: 'Description',
    descPlaceholder: 'Describe your plugin...',
    script: 'Plugin Script',
    scriptPlaceholder: 'Paste or edit plugin script here...',
    configPreview: 'Configuration Preview',
    changelog: 'Changelog',
    changelogPlaceholder: "What's new in this version?",
    submitBtn: 'Submit Plugin',
    autoFill: 'Auto Fill',
    autoFillSuccess: 'Form auto-filled',
    success: 'Plugin submitted successfully! Waiting for approval.',
    invalidJson: 'Invalid JSON content',
    loginFirst: 'Please login first'
  },
  auth: {
    processing: 'Processing Login...',
    login: 'Login',
    logout: 'Logout',
    logoutSuccess: 'Logged out'
  },
  hero: {
    tag: '🚀 v2.0 Brand New Release',
    title: {
      part1: 'One-Click Concurrency, ',
      part2: 'Multi-End Sync',
      part3: 'A New Experience for Browser Image Management'
    },
    desc: 'GioPic Web Extension is a powerful browser extension that supports concurrent uploads to multiple nodes like Lsky Pro, S3, OSS. Supports drag & drop, paste, and context menu, making material collection more efficient than ever.',
    install: 'Install to Chrome',
    source: 'Source Code',
    imageAlt: 'GioPic Main Interface'
  },
  features: {
    title: 'Why Choose GioPic Web Extension?',
    subtitle: 'The ultimate upload tool built for geeks, bloggers, and developers',
    list: [
      {
        title: 'Multi-Node Concurrent Distribution',
        desc: 'Upload once, push to multiple targets (Object Storage, Image Hosting, GitHub) simultaneously, and automatically generate multi-end links.'
      },
      {
        title: 'Powerful Plugin System',
        desc: 'Supports importing JavaScript plugins in .json format, running in a secure sandbox, infinitely extending any image hosting interface.'
      },
      {
        title: 'Smart Web Page Perception',
        desc: 'Automatically identify sites like Lsky Pro, EasyImages for one-click configuration. Automatically detect the editor type of the current page.'
      },
      {
        title: 'Ultimate Interactive Experience',
        desc: 'Supports floating ball, drag & drop upload, clipboard paste. Built-in history management, batch deletion, and format filtering.'
      }
    ]
  },
  showcase: {
    section1: {
      title: 'Smart Injection, Worry-Free Writing',
      desc: 'GioPic Web Extension can recognize Markdown, rich text editors, or Discuz! forums. After upload, image links are automatically inserted at the cursor position.',
      features: ['Auto Input Recognition', 'Markdown Support', 'Real-time Progress'],
      imageAlt: 'Auto Injection Demo'
    },
    section2: {
      title: 'Context Menu, Rapid Collection',
      desc: 'See an image you like on a webpage? Just right-click and select "GioPic Upload" to save it to your private image host.',
      features: ['Bypass Hotlink Protection', 'Retain Original Quality', 'Silent Background Processing'],
      imageAlt: 'Right-click Upload Demo'
    }
  },
  providers: {
    title: 'Supported Storage Services',
    more: '+ Support more services via plugins',
    items: [
      'Lsky Pro', 'EasyImages', 'Chevereto', 'ImgURL', 'Hellohao',
      'SM.MS', 'Imgur', 'Aliyun OSS', 'Tencent Cloud COS', 'AWS S3',
      'GitHub Repo', 'Custom HTTP'
    ]
  },
  footer: {
    desc: 'A modern browser image hosting extension built with Vue 3 + Vite, dedicated to providing the smoothest image management experience.',
    copyright: "github{'@'}ZenEcho",
    products: {
      title: 'Products',
      items: ['Download Extension', 'Changelog', 'Plugin Market']
    },
    develop: {
      title: 'Develop',
      items: ['GitHub', 'Submit Issue', 'Contribution Guide']
    }
  }
}
