<template>
  <div class="user-center-page">
    <div class="user-center-container">
      <!-- 侧边栏 -->
      <aside class="user-sidebar">
        <div class="user-info-card">
          <el-avatar :size="80" :src="userStore.avatar">
            {{ userStore.nickname?.charAt(0) }}
          </el-avatar>
          <h3>{{ userStore.nickname }}</h3>
          <p class="user-email">{{ userStore.userInfo?.email }}</p>
          <div class="user-stats">
            <div class="stat">
              <span class="value">{{ userStore.userInfo?.followsCount || 0 }}</span>
              <span class="label">关注</span>
            </div>
            <div class="stat">
              <span class="value">{{ userStore.userInfo?.fansCount || 0 }}</span>
              <span class="label">粉丝</span>
            </div>
          </div>
        </div>

        <el-menu :default-active="activeMenu" router>
          <el-menu-item index="/user">
            <el-icon><User /></el-icon>
            <span>个人资料</span>
          </el-menu-item>
          <el-menu-item index="/user/collections">
            <el-icon><Star /></el-icon>
            <span>我的收藏</span>
          </el-menu-item>
          <el-menu-item index="/user/history">
            <el-icon><Clock /></el-icon>
            <span>浏览历史</span>
          </el-menu-item>
          <el-menu-item index="/user/follows">
            <el-icon><Connection /></el-icon>
            <span>我的关注</span>
          </el-menu-item>
          <el-menu-item index="/user/messages">
            <el-icon><Bell /></el-icon>
            <span>我的消息</span>
          </el-menu-item>
          <el-menu-item index="/user/applications">
            <el-icon><Document /></el-icon>
            <span>我的申请</span>
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- 主内容区 -->
      <main class="user-main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
</script>

<style lang="scss" scoped>
.user-center-page {
  min-height: calc(100vh - 140px);
  background: var(--bg-color);
}

.user-center-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
  display: flex;
  gap: 24px;
}

.user-sidebar {
  width: 260px;
  flex-shrink: 0;

  .user-info-card {
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    padding: 24px;
    text-align: center;
    margin-bottom: 16px;
    box-shadow: var(--shadow-sm);

    .el-avatar {
      margin-bottom: 12px;
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
    }

    .user-email {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }

    .user-stats {
      display: flex;
      justify-content: center;
      gap: 32px;
      padding-top: 16px;
      border-top: 1px solid var(--border-lighter);

      .stat {
        text-align: center;

        .value {
          display: block;
          font-size: 20px;
          font-weight: 600;
          color: var(--primary-color);
        }

        .label {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }
    }
  }

  .el-menu {
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    border: none;
    box-shadow: var(--shadow-sm);

    .el-menu-item {
      height: 48px;
      line-height: 48px;

      &.is-active {
        background: var(--primary-lightest);
        color: var(--primary-color);
      }
    }
  }
}

.user-main {
  flex: 1;
  min-width: 0;
}

@media (max-width: 900px) {
  .user-center-container {
    flex-direction: column;
  }

  .user-sidebar {
    width: 100%;
  }
}
</style>
