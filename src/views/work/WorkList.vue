<template>
  <div class="work-list-page page-container">
    <div class="page-header">
      <h1>著作列表</h1>
      <p>探索学术论文、书籍等学术成果</p>
    </div>

    <!-- 搜索筛选 -->
    <div class="filter-section card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="关键词">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索标题/摘要/关键词"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 120px">
            <el-option label="论文" value="paper" />
            <el-option label="书籍" value="book" />
            <el-option label="期刊文章" value="journal-article" />
            <el-option label="会议论文" value="conference" />
          </el-select>
        </el-form-item>
        <el-form-item label="发表时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 240px"
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

    <!-- 著作列表 -->
    <div class="work-list" v-loading="loading">
      <div class="list-header">
        <span class="total">共 {{ total }} 篇著作</span>
        <el-select v-model="sortBy" placeholder="排序方式" style="width: 160px">
          <el-option label="默认排序" value="" />
          <el-option label="最新发表" value="publishTime" />
          <el-option label="引用最多" value="cited" />
        </el-select>
      </div>

      <div class="work-grid" v-if="works.length">
        <WorkCard v-for="work in works" :key="work.workId" :work="work" />
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
          @size-change="fetchWorks"
          @current-change="fetchWorks"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, computed } from 'vue'
import WorkCard from '@/components/cards/WorkCard.vue'
import { getWorks } from '@/api/work'

const loading = ref(false)
const works = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(12)
const sortBy = ref('')
const dateRange = ref([])

const filters = reactive({
  keyword: '',
  type: ''
})

const fetchWorks = async () => {
  loading.value = true
  try {
    const params = {
      keyword: filters.keyword,
      type: filters.type,
      sort: sortBy.value,
      page: page.value,
      size: size.value
    }
    if (dateRange.value?.length === 2) {
      params.publishStart = dateRange.value[0]
      params.publishEnd = dateRange.value[1]
    }
    const res = await getWorks(params)
    works.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('获取著作列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchWorks()
}

const resetFilters = () => {
  filters.keyword = ''
  filters.type = ''
  dateRange.value = []
  page.value = 1
  fetchWorks()
}

watch(sortBy, () => {
  fetchWorks()
})

onMounted(() => {
  fetchWorks()
})
</script>

<style lang="scss" scoped>
.work-list-page {
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

.work-list {
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

  .work-grid {
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
  .work-list .work-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .work-list .work-grid {
    grid-template-columns: 1fr;
  }
}
</style>
