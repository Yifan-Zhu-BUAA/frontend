import { defineStore } from 'pinia'
import { login, register, getCurrentUser } from '@/api/auth'
import router from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    isLoggedIn: !!localStorage.getItem('token'),
  }),

  getters: {
    isAdmin: (state) => {
      return state.userInfo?.role === 2 || state.userInfo?.role === 'ADMIN'
    },
    nickname: (state) => state.userInfo?.nickname || '游客',
    avatar: (state) => state.userInfo?.avatar || '',
    uid: (state) => state.userInfo?.uid,
  },

  actions: {
    // 登录
    async login(credentials) {
      try {
        const res = await login(credentials)
        // 后端只返回 token，先保存 token
        this.token = res.data.token
        this.isLoggedIn = true
        localStorage.setItem('token', res.data.token)
        
        // 然后获取用户信息
        try {
          const userRes = await getCurrentUser()
          this.userInfo = userRes.data
          localStorage.setItem('userInfo', JSON.stringify(userRes.data))
        } catch (e) {
          // 如果获取用户信息失败，至少保存基本信息
          console.warn('获取用户信息失败', e)
        }
        
        return res
      } catch (error) {
        throw error
      }
    },

    // 注册
    async register(userData) {
      try {
        const res = await register(userData)
        // 注册成功后可选择自动登录
        if (res.data.token) {
          this.setAuth(res.data)
        }
        return res
      } catch (error) {
        throw error
      }
    },

    // 设置认证信息
    setAuth(data) {
      this.token = data.token
      this.userInfo = data
      this.isLoggedIn = true
      localStorage.setItem('token', data.token)
      localStorage.setItem('userInfo', JSON.stringify(data))
    },

    // 退出登录
    logout() {
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      router.push('/login')
    },

    // 检查认证状态
    async checkAuth() {
      if (!this.token) return false
      
      try {
        const res = await getCurrentUser()
        this.userInfo = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    // 更新用户信息
    updateUserInfo(info) {
      this.userInfo = { ...this.userInfo, ...info }
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
    },
  },
})
