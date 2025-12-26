<template>
  <div class="user-profile-page">
    <div class="profile-container card" v-loading="loading">
      <template v-if="userInfo">
        <!-- 用户头部信息 -->
        <div class="profile-header">
          <el-avatar :size="100" :src="userInfo.avatar">
            {{ userInfo.nickname?.charAt(0) }}
          </el-avatar>
          <div class="profile-info">
            <h2 class="user-nickname">{{ userInfo.nickname }}</h2>
            <div class="user-meta">
              <span v-if="userInfo.fields">
                <el-icon><Briefcase /></el-icon>
                {{ userInfo.fields }}
              </span>
              <span v-if="userInfo.email">
                <el-icon><Message /></el-icon>
                {{ userInfo.email }}
              </span>
            </div>
            <div class="user-stats">
              <div class="stat-item">
                <span class="stat-value">{{ userInfo.followsCount || 0 }}</span>
                <span class="stat-label">关注</span>
              </div>
              <div class="stat-item">
                <span class="stat-value">{{ userInfo.fansCount || 0 }}</span>
                <span class="stat-label">粉丝</span>
              </div>
            </div>
            <!-- 操作按钮 -->
            <div class="profile-actions" v-if="!isCurrentUser">
              <el-button type="primary" @click="startChat" v-if="canSendMessage">
                <el-icon><ChatDotRound /></el-icon>
                发私信
              </el-button>
              <el-button @click="handleFollow" v-if="userInfo.authorId">
                {{ isFollowed ? '取消关注' : '关注' }}
              </el-button>
            </div>
          </div>
        </div>

        <!-- 用户详细信息 -->
        <div class="profile-details">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户ID">
              {{ userInfo.uid }}
            </el-descriptions-item>
            <el-descriptions-item label="角色">
              {{ getRoleLabel(userInfo.role) }}
            </el-descriptions-item>
            <el-descriptions-item label="注册时间" v-if="userInfo.createDate">
              {{ formatDate(userInfo.createDate) }}
            </el-descriptions-item>
            <el-descriptions-item label="关联作者ID" v-if="userInfo.authorId">
              {{ userInfo.authorId }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getUserInfo } from '@/api/privateMessage'
import { checkFollowStatus, followUser, unfollowUser } from '@/api/follow'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const userInfo = ref(null)
const isFollowed = ref(false)

const userId = computed(() => parseInt(route.params.id))
const isCurrentUser = computed(() => userStore.user?.uid === userId.value)
const canSendMessage = computed(() => userInfo.value?.role !== undefined)

const fetchUserInfo = async () => {
  loading.value = true
  try {
    const res = await getUserInfo(userId.value)
    userInfo.value = res.data
    
    // 检查关注状态
    if (!isCurrentUser.value && userInfo.value.authorId) {
      checkFollow()
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败')
  } finally {
    loading.value = false
  }
}

const checkFollow = async () => {
  if (!userStore.isLoggedIn || !userInfo.value.authorId) return
  
  try {
    const res = await checkFollowStatus(userInfo.value.authorId)
    isFollowed.value = res.data
  } catch (error) {
    console.error('检查关注状态失败', error)
  }
}

const handleFollow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    if (isFollowed.value) {
      await unfollowUser(userInfo.value.authorId)
      isFollowed.value = false
      ElMessage.success('取消关注成功')
    } else {
      await followUser({
        authorId: userInfo.value.authorId,
        authorName: userInfo.value.nickname,
        authorInst: userInfo.value.fields || ''
      })
      isFollowed.value = true
      ElMessage.success('关注成功')
    }
  } catch (error) {
    console.error('操作失败', error)
    ElMessage.error('操作失败，请重试')
  }
}

const startChat = () => {
  router.push(`/chat/${userId.value}`)
}

const getRoleLabel = (role) => {
  const roles = {
    0: '普通用户',
    1: '科研人员',
    2: '管理员'
  }
  return roles[role] || '未知'
}

const formatDate = (date) => {
  if (!date) return '未知'
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  fetchUserInfo()
})
</script>

<style lang="scss" scoped>
.user-profile-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
}

.profile-container {
  padding: 32px;
}

.profile-header {
  display: flex;
  gap: 32px;
  padding-bottom: 32px;
  border-bottom: 1px solid var(--border-lighter);
  margin-bottom: 32px;

  .profile-info {
    flex: 1;

    .user-nickname {
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 12px 0;
    }

    .user-meta {
      display: flex;
      gap: 24px;
      margin-bottom: 20px;
      color: var(--text-secondary);
      font-size: 14px;

      span {
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .user-stats {
      display: flex;
      gap: 32px;
      margin-bottom: 24px;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--primary-color);
        }

        .stat-label {
          font-size: 14px;
          color: var(--text-secondary);
          margin-top: 4px;
        }
      }
    }

    .profile-actions {
      display: flex;
      gap: 12px;
    }
  }
}

.profile-details {
  :deep(.el-descriptions__label) {
    font-weight: 500;
  }
}
</style>
