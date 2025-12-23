<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="admin-logo">
        <el-icon :size="28"><Setting /></el-icon>
        <span>管理后台</span>
      </div>

      <el-menu :default-active="activeMenu" router background-color="#1a1a2e" text-color="#8b8ba0" active-text-color="#4A90E2">
        <el-menu-item index="/admin/applications">
          <el-icon><Document /></el-icon>
          <span>学者认证审核</span>
        </el-menu-item>
        <el-menu-item index="/admin/claims">
          <el-icon><Files /></el-icon>
          <span>成果认领审核</span>
        </el-menu-item>
      </el-menu>
    </aside>

    <div class="admin-main">
      <header class="admin-header">
        <h2>{{ pageTitle }}</h2>
        <div class="header-right">
          <span>管理员：{{ userStore.nickname }}</span>
          <el-button text @click="router.push('/')">返回首页</el-button>
        </div>
      </header>

      <main class="admin-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)

const pageTitle = computed(() => {
  if (route.path.includes('applications')) return '学者认证审核'
  if (route.path.includes('claims')) return '成果认领审核'
  return '管理后台'
})
</script>

<style lang="scss" scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

.admin-sidebar {
  width: 220px;
  background: #1a1a2e;
  flex-shrink: 0;

  .admin-logo {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .el-menu {
    border-right: none;

    .el-menu-item {
      &.is-active {
        background: rgba(74, 144, 226, 0.15);
      }
    }
  }
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.admin-header {
  height: 64px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);

  h2 {
    font-size: 18px;
    font-weight: 600;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    span {
      color: var(--text-secondary);
    }
  }
}

.admin-content {
  flex: 1;
  padding: 24px;
  background: var(--bg-color);
}
</style>
