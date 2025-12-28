<template>
  <div class="follows-page card">
    <h2 class="page-title">我的关注</h2>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="我关注的" name="follows">
        <div class="follows-list" v-loading="loading">
          <div 
            class="follow-item" 
            v-for="item in mergedFollows" 
            :key="item.id"
            @click="handleItemClick(item)"
            style="cursor: pointer;"
          >
            <el-avatar :size="48">{{ getDisplayName(item).charAt(0) }}</el-avatar>
            <div class="follow-info">
              <h4>{{ getDisplayName(item) }}</h4>
              <p>{{ item.organizationName || '暂无机构信息' }}</p>
            </div>
            <el-button 
              type="danger" 
              plain 
              size="small" 
              @click.stop="handleUnfollow(item)"
            >
              取消关注
            </el-button>
          </div>
          <el-empty v-if="!mergedFollows.length" description="暂无关注" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="我的粉丝" name="fans">
        <div class="fans-list" v-loading="fansLoading">
          <div 
            class="follow-item" 
            v-for="item in fans" 
            :key="item.id"
            @click="handleFanClick(item)"
            style="cursor: pointer;"
          >
            <el-avatar :size="48">{{ getFanDisplayName(item).charAt(0) }}</el-avatar>
            <div class="follow-info">
              <h4>{{ getFanDisplayName(item) }}</h4>
              <p>{{ item.organizationName || '暂无机构信息' }}</p>
            </div>
          </div>
          <el-empty v-if="!fans.length" description="暂无粉丝" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyFollows, getMyFans, unfollow } from '@/api/follow'
import { getUserInfo } from '@/api/privateMessage'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const activeTab = ref('follows')
const loading = ref(false)
const fansLoading = ref(false)

const follows = ref([])
const fans = ref([])

// 合并关注列表：将绑定了用户的学者合并（去重）
const mergedFollows = computed(() => {
  // 按 authorId 分组，优先保留有 userId 的记录
  const authorMap = new Map()
  
  for (const item of follows.value) {
    const authorId = item.authorId
    if (!authorMap.has(authorId)) {
      authorMap.set(authorId, item)
    } else {
      // 如果已存在，优先保留有 userId 的
      const existing = authorMap.get(authorId)
      if (!existing.userId && item.userId) {
        authorMap.set(authorId, item)
      }
    }
  }
  
  return Array.from(authorMap.values())
})

// 获取显示名称：如果学者绑定了用户，显示"学者名(用户名)"
const getDisplayName = (item) => {
  if (item.userId && item.nickname && item.name !== item.nickname) {
    return `${item.name}(${item.nickname})`
  }
  return item.name || '未知'
}

// 点击跳转逻辑
const handleItemClick = (item) => {
  if (item.userId) {
    // 学者绑定了用户，跳转到用户页
    router.push(`/user/${item.userId}`)
  } else {
    // 学者未绑定用户，跳转到学者页
    router.push(`/authors/${item.authorId}`)
  }
}

const fetchFollows = async () => {
  loading.value = true
  try {
    const res = await getMyFollows({ page: 0, size: 50 })
    console.log('获取关注列表响应:', res)
    const list = res.data?.follows || res.follows || []
    
    // 对于有 userId 但没有 nickname 的记录，去获取用户信息
    for (const item of list) {
      if (item.userId && !item.nickname) {
        try {
          const userRes = await getUserInfo(item.userId)
          if (userRes.data) {
            item.nickname = userRes.data.nickname
          }
        } catch (e) {
          console.warn(`获取用户 ${item.userId} 昵称失败`, e)
        }
      }
    }
    
    follows.value = list
    console.log('处理后的关注列表:', follows.value)
  } catch (error) {
    console.error('获取关注列表失败', error)
  } finally {
    loading.value = false
  }
}

const fetchFans = async () => {
  fansLoading.value = true
  try {
    const res = await getMyFans({ page: 0, size: 50 })
    console.log('获取粉丝列表响应:', res)
    const list = res.data?.fans || res.fans || []
    
    // 对于有 authorId 但没有学者名字的记录，可以补充获取
    // 目前后端已经返回了 nickname，如果需要更多信息可以扩展
    fans.value = list
    console.log('处理后的粉丝列表:', fans.value)
  } catch (error) {
    console.error('获取粉丝列表失败', error)
  } finally {
    fansLoading.value = false
  }
}

// 获取粉丝显示名称：如果粉丝绑定了学者，显示"学者名(用户名)"
const getFanDisplayName = (item) => {
  if (item.authorId && item.name && item.name !== item.nickname) {
    return `${item.name}(${item.nickname})`
  }
  return item.nickname || '未知用户'
}

// 点击粉丝跳转逻辑
const handleFanClick = (item) => {
  if (item.userId) {
    router.push(`/user/${item.userId}`)
  }
}

const handleUnfollow = async (item) => {
  try {
    await unfollow(item.id)
    ElMessage.success('已取消关注')
    follows.value = follows.value.filter(f => f.id !== item.id)
    
    // 更新 userStore 中的关注数量
    const currentCount = userStore.userInfo?.followsCount || 1
    userStore.updateUserInfo({ followsCount: Math.max(currentCount - 1, 0) })
  } catch (error) {
    console.error('取消关注失败', error)
    ElMessage.error('取消关注失败')
  }
}

watch(activeTab, (tab) => {
  if (tab === 'fans' && !fans.value.length) fetchFans()
})

onMounted(async () => {
  // 刷新用户信息以获取最新的关注/粉丝数量
  await userStore.checkAuth()
  // 获取关注列表
  fetchFollows()
})
</script>

<style lang="scss" scoped>
.follows-page {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 24px;
  }

  .follows-list, .fans-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 200px;
  }

  .follow-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--bg-light);
    border-radius: var(--radius-md);
    transition: background-color 0.2s;

    &:hover {
      background: #f0f7ff;
    }

    .follow-info {
      flex: 1;
      h4 { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
      p { font-size: 13px; color: var(--text-secondary); }
    }
  }
}
</style>
