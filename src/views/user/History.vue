<template>
  <div class="history-page card">
    <div class="page-header">
      <h2 class="page-title">浏览历史</h2>
      <el-popconfirm title="确定清空所有浏览历史吗？" @confirm="handleClear">
        <template #reference>
          <el-button type="danger" plain :disabled="!histories.length">清空历史</el-button>
        </template>
      </el-popconfirm>
    </div>

    <div class="history-list" v-loading="loading">
      <div class="history-item" v-for="item in histories" :key="item.hid">
        <div class="item-info" @click="router.push(`/works/${item.workId}`)">
          <h4>{{ item.title }}</h4>
          <p>{{ item.publisher }} · {{ formatDate(item.publishTime) }}</p>
          <span class="view-time">浏览于 {{ formatDate(item.viewTime) }}</span>
        </div>
        <el-button text type="danger" @click="handleDelete(item.hid)">
          <el-icon><Delete /></el-icon>
        </el-button>
      </div>
      <el-empty v-if="!histories.length" description="暂无浏览历史" />

      <div class="pagination-wrapper" v-if="total > size">
        <el-pagination
          v-model:current-page="page"
          :page-size="size"
          :total="total"
          layout="prev, pager, next"
          background
          @current-change="fetchHistories"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getHistories, deleteHistory, clearHistories } from '@/api/collection'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const histories = ref([])
const total = ref(0)
const page = ref(1)
const size = 20

const fetchHistories = async () => {
  loading.value = true
  try {
    const res = await getHistories({ page: page.value, size })
    histories.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('获取浏览历史失败', error)
  } finally {
    loading.value = false
  }
}

const handleDelete = async (hid) => {
  try {
    await deleteHistory(hid)
    ElMessage.success('删除成功')
    histories.value = histories.value.filter(h => h.hid !== hid)
  } catch (error) {
    console.error('删除失败', error)
  }
}

const handleClear = async () => {
  try {
    await clearHistories()
    ElMessage.success('已清空')
    histories.value = []
    total.value = 0
  } catch (error) {
    console.error('清空失败', error)
  }
}

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'

onMounted(() => { fetchHistories() })
</script>

<style lang="scss" scoped>
.history-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .page-title { font-size: 20px; font-weight: 600; }

  .history-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: var(--bg-light);
    border-radius: var(--radius-md);

    .item-info {
      cursor: pointer;
      &:hover h4 { color: var(--primary-color); }

      h4 { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
      p { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; }
      .view-time { font-size: 12px; color: var(--text-placeholder); }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}
</style>
