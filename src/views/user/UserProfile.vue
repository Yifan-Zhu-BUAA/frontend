<template>
  <div class="user-profile-page">
    <div class="profile-container card" v-loading="loading">
      <template v-if="userInfo">
        <!-- 右上角前往学者页按钮 -->
        <div v-if="userInfo.authorId" class="top-right-btn">
          <el-button type="primary" size="small" @click="goToAuthorPage">前往学者页</el-button>
        </div>
        
        <!-- 用户头部信息 -->
        <div class="profile-header">
          <el-avatar :size="100" :src="userInfo.avatar" class="user-avatar">
            {{ userInfo.nickname?.charAt(0) }}
          </el-avatar>
          
          <div class="profile-info">
            <h2 class="user-nickname">{{ userInfo.nickname }}</h2>
            <div class="user-meta">
              <span v-if="userInfo.fields" class="meta-item">
                <el-icon><Briefcase /></el-icon>
                {{ userInfo.fields }}
              </span>
              <span v-if="userInfo.email" class="meta-item">
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
              <!-- 关注按钮 -->
              <el-button
                :type="isFollowed ? 'info' : 'primary'"
                :plain="isFollowed"
                :loading="followLoading"
                @click="handleFollow"
              >
                {{ isFollowed ? '已关注' : '关注' }}
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
            <el-descriptions-item label="关联学者" v-if="userInfo.authorId && userInfo.role === 1">
              <router-link :to="`/authors/${userInfo.authorId}`">{{ userInfo.authorName || '已关联学者' }}</router-link>
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
import { getAuthorById } from '@/api/author'
import { followUser, unfollowUser, getMyFollows, unfollow } from '@/api/follow'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const userInfo = ref(null)
const isFollowed = ref(false)
const followId = ref(null)
const followLoading = ref(false)

const userId = computed(() => parseInt(route.params.id))
const isCurrentUser = computed(() => userStore.user?.uid === userId.value)
const canSendMessage = computed(() => userInfo.value?.role !== undefined)

const fetchUserInfo = async () => {
  loading.value = true
  try {
    const res = await getUserInfo(userId.value)
    userInfo.value = res.data
    
    // 若有关联学者，尝试获取学者姓名（兼容短 id 与 openalex 完整 id）
    if (userInfo.value?.authorId) {
      try {
        let aRes = null
        try {
          aRes = await getAuthorById(userInfo.value.authorId)
        } catch (e) {
          try {
            aRes = await getAuthorById(`https://openalex.org/${userInfo.value.authorId}`)
          } catch (e2) {
            console.warn('尝试用不同 id 查询学者均失败', e2)
          }
        }
        if (aRes && aRes.data) {
          userInfo.value.authorName = aRes.data.name || ''
        }
      } catch (err) {
        console.error('获取学者信息失败', err)
      }
    }
    // 检查关注状态（只要不是当前用户就检查）
    if (!isCurrentUser.value) {
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
  if (!userStore.isLoggedIn) return

  try {
    // 获取我的关注列表，查找是否存在对该用户或其关联学者的关注
    const res = await getMyFollows({ page: 0, size: 100 })
    // 后端返回格式: { follows: [{ id, authorId, userId, name, avatar, organizationName, type }] }
    const list = res.data?.follows || res.follows || []
    followId.value = null
    isFollowed.value = false
    
    // 要匹配的目标 ID
    const targetAuthorId = userInfo.value?.authorId
    const targetUserId = userInfo.value?.uid
    
    for (const f of list) {
      // 后端 authorId 字段是被关注者的 authorId
      if (targetAuthorId && f.authorId && String(f.authorId) === String(targetAuthorId)) {
        isFollowed.value = true
        followId.value = f.id
        break
      }
      // 也检查 userId 匹配
      if (targetUserId && f.userId && String(f.userId) === String(targetUserId)) {
        isFollowed.value = true
        followId.value = f.id
        break
      }
    }
  } catch (error) {
    console.error('检查关注状态失败', error)
  }
}

const handleFollow = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  followLoading.value = true
  try {
    if (isFollowed.value) {
      // 取消关注
      let removed = false
      
      // 1. 优先使用 followId 取消关注
      if (followId.value) {
        try {
          await unfollow(followId.value)
          removed = true
        } catch (e) {
          console.warn('使用 followId 删除失败', e)
        }
      }

      // 2. 使用 authorId 取消关注
      if (!removed && userInfo.value?.authorId) {
        try {
          await unfollowUser(userInfo.value.authorId)
          removed = true
        } catch (e) {
          console.warn('使用 authorId 删除失败', e)
        }
      }

      if (removed) {
        if (userInfo.value) {
          userInfo.value.fansCount = Math.max((userInfo.value.fansCount || 1) - 1, 0)
        }
        isFollowed.value = false
        followId.value = null
        ElMessage.success('取消关注成功')
      } else {
        ElMessage.error('取消关注失败，请重试')
      }
    } else {
      // 关注：使用 idTo 字段（后端要求）
      const targetId = userInfo.value?.authorId || String(userInfo.value.uid)
      await followUser({
        idTo: targetId,
        authorName: userInfo.value.authorName || userInfo.value.nickname || '',
        authorInst: userInfo.value.fields || ''
      })

      if (userInfo.value) {
        userInfo.value.fansCount = (userInfo.value.fansCount || 0) + 1
      }
      isFollowed.value = true
      // 刷新以获取 followId
      await checkFollow()
      ElMessage.success('关注成功')
    }
  } catch (error) {
    console.error('操作失败', error)
    ElMessage.error(error?.response?.data?.message || '操作失败，请重试')
  } finally {
    followLoading.value = false
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

// 跳转到学者页面
const goToAuthorPage = () => {
  if (userInfo.value?.authorId) {
    router.push(`/authors/${userInfo.value.authorId}`)
  }
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
  position: relative;
}

.top-right-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.profile-header {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 24px;

  .user-avatar {
    flex-shrink: 0;
  }

  .profile-info {
    flex: 1;
    min-width: 0;

    .user-nickname {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #303133;
    }

    .user-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
      color: #606266;
      font-size: 14px;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }

    .user-stats {
      display: flex;
      gap: 32px;
      margin-bottom: 16px;

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;

        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--el-color-primary, #409eff);
        }

        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 4px;
        }
      }
    }

    .profile-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
  }
}

.profile-details {
  margin-top: 24px;

  :deep(.el-descriptions__label) {
    font-weight: 500;
    width: 100px;
  }
}
</style>
