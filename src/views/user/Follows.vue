<template>
  <div class="follows-page card">
    <h2 class="page-title">我的关注</h2>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="我关注的" name="follows">
        <div class="follows-list" v-loading="loading">
          <div class="follow-item" v-for="item in follows" :key="item.id">
            <el-avatar :size="48">{{ item.name?.charAt(0) }}</el-avatar>
            <div class="follow-info">
              <h4>{{ item.name }}</h4>
              <p>{{ item.organizationName || '暂无机构信息' }}</p>
            </div>
            <el-button type="danger" plain size="small" @click="handleUnfollow(item)">
              取消关注
            </el-button>
          </div>
          <el-empty v-if="!follows.length" description="暂无关注" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="我的粉丝" name="fans">
        <div class="fans-list" v-loading="fansLoading">
          <div class="follow-item" v-for="item in fans" :key="item.uid">
            <el-avatar :size="48">{{ item.nickname?.charAt(0) }}</el-avatar>
            <div class="follow-info">
              <h4>{{ item.nickname }}</h4>
              <p>{{ item.fields || '暂无信息' }}</p>
            </div>
          </div>
          <el-empty v-if="!fans.length" description="暂无粉丝" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getMyFollows, getMyFans, unfollow } from '@/api/follow'
import { ElMessage } from 'element-plus'

const activeTab = ref('follows')
const loading = ref(false)
const fansLoading = ref(false)

const follows = ref([])
const fans = ref([])

const fetchFollows = async () => {
  loading.value = true
  try {
    const res = await getMyFollows({ page: 0, size: 50 })
    console.log('获取关注列表响应:', res)
    console.log('关注列表数据:', res.data)
    follows.value = res.data?.follows || []
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
    const res = await getMyFans({ page: 1, size: 50 })
    fans.value = res.data?.list || []
  } catch (error) {
    console.error('获取粉丝列表失败', error)
  } finally {
    fansLoading.value = false
  }
}

const handleUnfollow = async (item) => {
  try {
    await unfollow(item.id)
    ElMessage.success('已取消关注')
    follows.value = follows.value.filter(f => f.id !== item.id)
  } catch (error) {
    console.error('取消关注失败', error)
  }
}

watch(activeTab, (tab) => {
  if (tab === 'fans' && !fans.value.length) fetchFans()
})

onMounted(() => { fetchFollows() })
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

    .follow-info {
      flex: 1;
      h4 { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
      p { font-size: 13px; color: var(--text-secondary); }
    }
  }
}
</style>
