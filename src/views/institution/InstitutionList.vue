<template>
  <div class="institution-list-page page-container">
    <div class="page-header">
      <h1>机构列表</h1>
      <p>了解各研究机构及其学术成果</p>
    </div>

    <div class="filter-section card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索机构名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>搜索
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="institution-list" v-loading="loading">
      <div class="list-header">
        <span class="total">共 {{ total }} 个机构</span>
      </div>

      <div class="institution-grid" v-if="institutions.length">
        <InstitutionCard v-for="inst in institutions" :key="inst.id" :institution="inst" />
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
          @size-change="fetchInstitutions"
          @current-change="fetchInstitutions"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import InstitutionCard from '@/components/cards/InstitutionCard.vue'
import { getInstitutions } from '@/api/institution'

const loading = ref(false)
const institutions = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(12)

const filters = reactive({ keyword: '' })

const fetchInstitutions = async () => {
  loading.value = true
  try {
    const res = await getInstitutions({
      keyword: filters.keyword,
      page: page.value,
      size: size.value
    })
    institutions.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('获取机构列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchInstitutions()
}

const resetFilters = () => {
  filters.keyword = ''
  page.value = 1
  fetchInstitutions()
}

onMounted(() => {
  fetchInstitutions()
})
</script>

<style lang="scss" scoped>
.institution-list-page {
  padding-top: 32px;
  padding-bottom: 48px;
}

.page-header {
  margin-bottom: 24px;
  h1 { font-size: 28px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
  p { font-size: 14px; color: var(--text-secondary); }
}

.filter-section {
  margin-bottom: 24px;
  :deep(.el-form-item) { margin-bottom: 0; }
}

.institution-list {
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    .total { font-size: 14px; color: var(--text-secondary); }
  }

  .institution-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }
}

@media (max-width: 1200px) {
  .institution-list .institution-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .institution-list .institution-grid { grid-template-columns: 1fr; }
}
</style>
