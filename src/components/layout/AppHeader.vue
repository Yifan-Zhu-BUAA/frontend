<template>
  <header class="app-header">
    <div class="header-container">
      <!-- 左侧区域：Logo -->
      <div class="left-section">
        <div class="logo" @click="router.push('/')">
          <el-icon :size="28" color="#4A90E2"><Reading /></el-icon>
          <span class="logo-text">学术成果分享平台</span>
        </div>
      </div>

      <!-- 右侧区域：导航菜单和用户区域 -->
      <div class="right-section">
        <!-- 导航菜单 -->
        <nav class="nav-menu">
        <el-menu mode="horizontal" :ellipsis="false" :default-active="activeMenu">
          <el-menu-item index="authors" @click="router.push('/authors')">
            <el-icon><User /></el-icon>
            <span>学者</span>
          </el-menu-item>
          <el-menu-item index="works" @click="router.push('/works')">
            <el-icon><Document /></el-icon>
            <span>著作</span>
          </el-menu-item>
          <el-menu-item index="institutions" @click="router.push('/institutions')">
            <el-icon><OfficeBuilding /></el-icon>
            <span>机构</span>
          </el-menu-item>
          <el-menu-item index="concepts" @click="router.push('/concepts')">
            <el-icon><Connection /></el-icon>
            <span>概念</span>
          </el-menu-item>
        </el-menu>
      </nav>

      <!-- 用户区域 -->
      <div class="user-area">
        <template v-if="userStore.isLoggedIn">
          <!-- 消息图标 -->
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge">
            <el-button circle @click="router.push('/user/messages')">
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>

          <!-- 用户下拉菜单 -->
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-avatar">
              <el-avatar :size="36" :src="userStore.avatar">
                {{ userStore.nickname.charAt(0) }}
              </el-avatar>
              <span class="user-name">{{ userStore.nickname }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="dashboard">
                  <el-icon><DataBoard /></el-icon>
                  个人门户
                </el-dropdown-item>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="collections">
                  <el-icon><Star /></el-icon>
                  我的收藏
                </el-dropdown-item>
                <el-dropdown-item command="history">
                  <el-icon><Clock /></el-icon>
                  浏览历史
                </el-dropdown-item>
                <el-dropdown-item v-if="userStore.isAdmin" command="admin" divided>
                  <el-icon><Setting /></el-icon>
                  管理后台
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>

        <template v-else>
          <el-button type="primary" @click="router.push('/login')">登录</el-button>
          <el-button @click="router.push('/register')">注册</el-button>
        </template>
      </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const messageStore = useMessageStore()

// 使用 store 中的未读数量
const unreadCount = computed(() => messageStore.unreadCount)

const activeMenu = computed(() => {
  const path = route.path
  if (path.includes('/authors')) return 'authors'
  if (path.includes('/works')) return 'works'
  if (path.includes('/institutions')) return 'institutions'
  if (path.includes('/concepts')) return 'concepts'
  return ''
})

const handleCommand = (command) => {
  switch (command) {
    case 'dashboard':
      router.push('/user/dashboard')
      break
    case 'profile':
      router.push('/user/profile')
      break
    case 'collections':
      router.push('/user/collections')
      break
    case 'history':
      router.push('/user/history')
      break
    case 'admin':
      router.push('/admin/applications')
      break
    case 'logout':
      userStore.logout()
      break
  }
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    messageStore.refreshUnreadCount()
  }
})
</script>

<style lang="scss" scoped>
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(135deg, #ffffff 0%, #f5f9fc 100%);
  box-shadow: 0 2px 12px rgba(74, 144, 226, 0.1);
  z-index: 1000;
}

.header-container {
  max-width: 1400px;
  height: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.right-section {
  display: flex;
  align-items: center;
  gap: 24px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex-shrink: 0;

  .logo-text {
    font-size: 18px;
    font-weight: 600;
    background: linear-gradient(135deg, #4A90E2 0%, #3A7BD5 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.nav-menu {
  :deep(.el-menu) {
    border-bottom: none;
    background: transparent;
    
    .el-menu-item {
      height: 60px;
      line-height: 60px;
      padding: 0 16px;
      
      &:hover {
        background-color: var(--primary-lightest);
      }
      
      &.is-active {
        color: var(--primary-color);
        border-bottom: 2px solid var(--primary-color);
      }
    }
  }
}

.user-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;

  .message-badge {
    margin-right: 8px;
  }

  .user-avatar {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 20px;
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--primary-lightest);
    }

    .user-name {
      font-size: 14px;
      color: var(--text-primary);
      max-width: 80px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
