<template>
  <div class="author-list-page page-container">
    <div class="page-header">
      <h1>学者列表</h1>
      <p>发现优秀学者，探索学术成果</p>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-section card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索学者姓名/研究方向"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="研究领域">
          <el-input
            v-model="filters.fields"
            placeholder="输入研究领域"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            搜索
          </el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 学者列表 -->
    <div class="author-list" v-loading="loading">
      <div class="list-header">
        <span class="total">共 {{ total }} 位学者</span>
        <el-select v-model="sortBy" placeholder="排序方式" style="width: 160px">
          <el-option label="默认排序" value="" />
          <el-option label="H指数最高" value="hIndex" />
          <el-option label="著作最多" value="worksCount" />
          <el-option label="引用最多" value="cited" />
        </el-select>
      </div>

      <div class="author-grid" v-if="authors.length">
        <AuthorCard v-for="author in authors" :key="author.id" :author="author" />
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
          @size-change="fetchAuthors"
          @current-change="fetchAuthors"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import AuthorCard from '@/components/cards/AuthorCard.vue'
import { getAuthors } from '@/api/author'

const loading = ref(false)
const authors = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(12)
const sortBy = ref('')

const filters = reactive({
  keyword: '',
  fields: ''
})

const fetchAuthors = async () => {
  loading.value = true
  try {
    const res = await getAuthors({
      keyword: filters.keyword,
      fields: filters.fields,
      sort: sortBy.value,
      page: page.value,
      size: size.value
    })
    authors.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('获取学者列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchAuthors()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.fields = ''
  page.value = 1
  fetchAuthors()
}

watch(sortBy, () => {
  fetchAuthors()
})

onMounted(() => {
  fetchAuthors()
})
</script>

<style lang="scss" scoped>
.author-list-page {
  padding-top: 32px;
  padding-bottom: 48px;
}

.page-header {
  margin-bottom: 24px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
  }
}

.filter-section {
  margin-bottom: 24px;

  :deep(.el-form-item) {
    margin-bottom: 0;
  }
}

.author-list {
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .total {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }

  .author-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 32px;
  }
}

@media (max-width: 1200px) {
  .author-list .author-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .author-list .author-grid {
    grid-template-columns: 1fr;
  }
}
</style>
