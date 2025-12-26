import { defineStore } from 'pinia'
import { getUnreadCount } from '@/api/message'
import { getUnreadPrivateCount } from '@/api/privateMessage'

export const useMessageStore = defineStore('message', {
  state: () => ({
    unreadCount: 0,
    systemUnreadCount: 0,
    privateUnreadCount: 0,
  }),

  actions: {
    // 刷新未读消息数量
    async refreshUnreadCount() {
      try {
        const [sysRes, privateRes] = await Promise.all([
          getUnreadCount(),
          getUnreadPrivateCount()
        ])
        this.systemUnreadCount = sysRes.data || 0
        this.privateUnreadCount = privateRes.data || 0
        this.unreadCount = this.systemUnreadCount + this.privateUnreadCount
      } catch (error) {
        console.error('获取未读消息数失败', error)
      }
    },

    // 清除私信未读数（当阅读私信后调用）
    decrementPrivateUnread(count = 1) {
      this.privateUnreadCount = Math.max(0, this.privateUnreadCount - count)
      this.unreadCount = this.systemUnreadCount + this.privateUnreadCount
    },

    // 重置
    reset() {
      this.unreadCount = 0
      this.systemUnreadCount = 0
      this.privateUnreadCount = 0
    }
  }
})
