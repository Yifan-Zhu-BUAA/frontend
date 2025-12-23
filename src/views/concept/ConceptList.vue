<template>
  <div class="concept-list-page page-container">
    <div class="page-header">
      <h1>研究概念</h1>
      <p>探索研究领域的知识结构</p>
    </div>

    <div class="filter-section card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="搜索概念名称" clearable @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="filters.level" placeholder="全部级别" clearable style="width: 120px">
            <el-option label="Level 0" :value="0" />
            <el-option label="Level 1" :value="1" />
            <el-option label="Level 2" :value="2" />
            <el-option label="Level 3" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch"><el-icon><Search /></el-icon>搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="concept-list" v-loading="loading">
      <div class="list-header">
        <span class="total">共 {{ total }} 个概念</span>
      </div>

      <div class="concept-grid" v-if="concepts.length">
        <ConceptCard v-for="concept in concepts" :key="concept.id" :concept="concept" />
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
          @size-change="fetchConcepts"
          @current-change="fetchConcepts"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import ConceptCard from '@/components/cards/ConceptCard.vue'
import { getConcepts } from '@/api/concept'

const loading = ref(false)
const concepts = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(12)

const filters = reactive({ keyword: '', level: '' })

const fetchConcepts = async () => {
  loading.value = true
  try {
    const params = { keyword: filters.keyword, page: page.value, size: size.value }
    if (filters.level !== '') params.level = filters.level
    const res = await getConcepts(params)
    concepts.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('获取概念列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => { page.value = 1; fetchConcepts() }
const resetFilters = () => { filters.keyword = ''; filters.level = ''; page.value = 1; fetchConcepts() }

onMounted(() => { fetchConcepts() })
</script>

<style lang="scss" scoped>
.concept-list-page { padding-top: 32px; padding-bottom: 48px; }
.page-header { margin-bottom: 24px; h1 { font-size: 28px; font-weight: 600; margin-bottom: 8px; } p { font-size: 14px; color: var(--text-secondary); } }
.filter-section { margin-bottom: 24px; :deep(.el-form-item) { margin-bottom: 0; } }
.concept-list {
  .list-header { display: flex; justify-content: space-between; margin-bottom: 20px; .total { font-size: 14px; color: var(--text-secondary); } }
  .concept-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .pagination-wrapper { display: flex; justify-content: center; margin-top: 32px; }
}
@media (max-width: 1200px) { .concept-list .concept-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .concept-list .concept-grid { grid-template-columns: 1fr; } }
</style>
