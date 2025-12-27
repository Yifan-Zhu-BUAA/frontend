import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      // 搜索结果
      {
        path: 'search',
        name: 'Search',
        component: () => import('@/views/Search.vue'),
        meta: { title: '搜索结果' }
      },
      // 学者相关
      {
        path: 'authors',
        name: 'Authors',
        component: () => import('@/views/author/AuthorList.vue'),
        meta: { title: '学者列表' }
      },
      {
        path: 'authors/:id',
        name: 'AuthorDetail',
        component: () => import('@/views/author/AuthorDetail.vue'),
        meta: { title: '学者详情' }
      },      // 著作相关
      {
        path: 'works',
        name: 'Works',
        component: () => import('@/views/work/WorkList.vue'),
        meta: { title: '著作列表' }
      },
      {
        path: 'works/advanced-search',
        name: 'WorkAdvancedSearch',
        component: () => import('@/views/work/WorkAdvancedSearch.vue'),
        meta: { title: '高级搜索' }
      },
      {
        path: 'works/:id',
        name: 'WorkDetail',
        component: () => import('@/views/work/WorkDetail.vue'),
        meta: { title: '著作详情' }
      },
      // 概念相关
      {
        path: 'concepts',
        name: 'Concepts',
        component: () => import('@/views/concept/ConceptList.vue'),
        meta: { title: '研究概念' }
      },
      {
        path: 'concepts/:id',
        name: 'ConceptDetail',
        component: () => import('@/views/concept/ConceptDetail.vue'),
        meta: { title: '概念详情' }
      },
      // 机构相关
      {
        path: 'institutions',
        name: 'Institutions',
        component: () => import('@/views/institution/InstitutionList.vue'),
        meta: { title: '机构列表' }
      },
      {
        path: 'institutions/:id',
        name: 'InstitutionDetail',
        component: () => import('@/views/institution/InstitutionDetail.vue'),
        meta: { title: '机构详情' }
      },
      // 专利相关
      {
        path: 'patents',
        name: 'Patents',
        component: () => import('@/views/patent/PatentList.vue'),
        meta: { title: '专利列表' }
      },
      {
        path: 'patents/:id',
        name: 'PatentDetail',
        component: () => import('@/views/patent/PatentDetail.vue'),
        meta: { title: '专利详情' }
      },
      // 个人门户（独立页面）
      {
        path: 'user/dashboard',
        name: 'UserDashboard',
        component: () => import('@/views/user/Dashboard.vue'),
        meta: { requiresAuth: true, title: '个人门户' }
      },
      // 用户中心
      {
        path: 'user',
        component: () => import('@/views/user/UserCenter.vue'),
        meta: { requiresAuth: true },
        children: [
          {
            path: 'profile',
            name: 'UserProfile',
            component: () => import('@/views/user/Profile.vue'),
            meta: { title: '个人资料' }
          },
          {
            path: 'collections',
            name: 'UserCollections',
            component: () => import('@/views/user/Collections.vue'),
            meta: { title: '我的收藏' }
          },
          {
            path: 'history',
            name: 'UserHistory',
            component: () => import('@/views/user/History.vue'),
            meta: { title: '浏览历史' }
          },
          {
            path: 'follows',
            name: 'UserFollows',
            component: () => import('@/views/user/Follows.vue'),
            meta: { title: '我的关注' }
          },
          {
            path: 'messages',
            name: 'UserMessages',
            component: () => import('@/views/user/Messages.vue'),
            meta: { title: '我的消息' }
          },
          {
            path: 'applications',
            name: 'UserApplications',
            component: () => import('@/views/user/Applications.vue'),
            meta: { title: '我的申请' }
          },
        ]
      },
      // 用户信息页面（查看其他用户）
      {
        path: 'user/:id',
        name: 'OtherUserProfile',
        component: () => import('@/views/user/UserProfile.vue'),
        meta: { title: '用户信息' }
      },
      // 私信聊天
      {
        path: 'chat/:id?',
        name: 'Chat',
        component: () => import('@/views/message/Chat.vue'),
        meta: { requiresAuth: true, title: '私信' }
      },
      // 管理员
      {
        path: 'admin',
        component: () => import('@/views/admin/AdminLayout.vue'),
        meta: { requiresAuth: true, requiresAdmin: true },
        children: [
          {
            path: 'applications',
            name: 'AdminApplications',
            component: () => import('@/views/admin/ApplicationManage.vue'),
            meta: { title: '申请管理' }
          },
          {
            path: 'claims',
            name: 'AdminClaims',
            component: () => import('@/views/admin/ClaimManage.vue'),
            meta: { title: '认领管理' }
          },
        ]
      },
    ]
  },
  // 登录注册
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册' }
  },
  // 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: '页面不存在' }
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 学术成果分享平台` : '学术成果分享平台'
  
  const token = localStorage.getItem('token')
  
  // 需要登录的页面
  if (to.meta.requiresAuth && !token) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }
  
  // 需要管理员权限
  if (to.meta.requiresAdmin) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    if (userInfo.role !== 2 && userInfo.role !== 'ADMIN') {
      next({ name: 'Home' })
      return
    }
  }
  
  next()
})

export default router
