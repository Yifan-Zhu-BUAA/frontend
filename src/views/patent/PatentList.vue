<template>
  <div class="patent-list-page page-container">
    <div class="page-header">
      <h1>专利列表</h1>
      <p>浏览专利成果</p>
    </div>

    <div class="filter-section card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="搜索专利名称/申请人" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="申请中" value="申请中" />
            <el-option label="授权" value="授权" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="patent-list" v-loading="loading">
      <div class="list-header">
        <span class="total">共 {{ total }} 项专利</span>
      </div>

      <div class="patent-grid" v-if="patents.length">
        <div class="patent-card card" v-for="patent in patents" :key="patent.id" @click="router.push(`/patents/${patent.id}`)">
          <div class="patent-header">
            <el-tag :type="patent.status === '授权' ? 'success' : 'warning'" size="small">{{ patent.status }}</el-tag>
            <el-tag type="info" size="small">{{ patent.type }}</el-tag>
          </div>
          <h3 class="patent-name">{{ patent.name }}</h3>
          <p class="patent-info"><span class="label">申请号：</span>{{ patent.applicationNumber }}</p>
          <p class="patent-info"><span class="label">申请人：</span>{{ patent.applicant }}</p>
          <p class="patent-info"><span class="label">申请日期：</span>{{ formatDate(patent.applicationDate) }}</p>
        </div>
      </div>
      <el-empty v-else description="暂无数据" />

      <div class="pagination-wrapper" v-if="total > 0">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[12, 24, 48]"
          layout="total, sizes, prev, pager, next, jumper"
          background
          @size-change="fetchPatents"
          @current-change="fetchPatents"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPatents } from '@/api/achievement'
import dayjs from 'dayjs'

const router = useRouter()
const loading = ref(false)
const patents = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(12)

const filters = reactive({ keyword: '', status: '' })

const fetchPatents = async () => {
  loading.value = true
  try {
    const res = await getPatents({ ...filters, page: page.value, size: size.value })
    patents.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('获取专利列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { page.value = 1; fetchPatents() }
const resetFilters = () => { filters.keyword = ''; filters.status = ''; page.value = 1; fetchPatents() }
const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '未知'

onMounted(() => { fetchPatents() })
</script>

<style lang="scss" scoped>
.patent-list-page { padding-top: 32px; padding-bottom: 48px; }
.page-header { margin-bottom: 24px; h1 { font-size: 28px; font-weight: 600; margin-bottom: 8px; } p { font-size: 14px; color: var(--text-secondary); } }
.filter-section { margin-bottom: 24px; :deep(.el-form-item) { margin-bottom: 0; } }

.patent-list {
  .list-header { display: flex; justify-content: space-between; margin-bottom: 20px; .total { font-size: 14px; color: var(--text-secondary); } }
  .patent-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .pagination-wrapper { display: flex; justify-content: center; margin-top: 32px; }
}

.patent-card {
  cursor: pointer;
  transition: all var(--transition-normal);
  &:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); }

  .patent-header { display: flex; gap: 8px; margin-bottom: 12px; }
  .patent-name { font-size: 16px; font-weight: 600; margin-bottom: 12px; line-height: 1.4; }
  .patent-info { font-size: 13px; color: var(--text-secondary); margin-bottom: 4px; .label { color: var(--text-regular); } }
}

@media (max-width: 1200px) { .patent-list .patent-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .patent-list .patent-grid { grid-template-columns: 1fr; } }
</style>
