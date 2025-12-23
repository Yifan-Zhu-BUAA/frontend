<template>
  <div class="search-page page-container">
    <div class="search-header">
      <h1>搜索结果</h1>
      <p class="search-info">
        关键词: <span class="keyword">{{ keyword }}</span>
        <span v-if="totalCount"> · 共找到 {{ totalCount }} 条结果</span>
      </p>
    </div>

    <!-- 搜索类型切换 -->
    <div class="search-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="学者" name="authors">
          <template #label>
            <span><el-icon><User /></el-icon> 学者 ({{ authorTotal }})</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="著作" name="works">
          <template #label>
            <span><el-icon><Document /></el-icon> 著作 ({{ workTotal }})</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="机构" name="institutions">
          <template #label>
            <span><el-icon><OfficeBuilding /></el-icon> 机构 ({{ institutionTotal }})</span>
          </template>
        </el-tab-pane>
        <el-tab-pane label="概念" name="concepts">
          <template #label>
            <span><el-icon><Connection /></el-icon> 概念 ({{ conceptTotal }})</span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 搜索结果 -->
    <div class="search-results" v-loading="loading">
      <!-- 学者结果 -->
      <template v-if="activeTab === 'authors'">
        <div class="results-grid results-grid-4" v-if="authors.length">
          <AuthorCard v-for="author in authors" :key="author.id" :author="author" />
        </div>
        <el-empty v-else description="没有找到相关学者" />
      </template>

      <!-- 著作结果 -->
      <template v-if="activeTab === 'works'">
        <div class="results-grid results-grid-3" v-if="works.length">
          <WorkCard v-for="work in works" :key="work.workId" :work="work" />
        </div>
        <el-empty v-else description="没有找到相关著作" />
      </template>

      <!-- 机构结果 -->
      <template v-if="activeTab === 'institutions'">
        <div class="results-grid results-grid-3" v-if="institutions.length">
          <InstitutionCard v-for="inst in institutions" :key="inst.id" :institution="inst" />
        </div>
        <el-empty v-else description="没有找到相关机构" />
      </template>

      <!-- 概念结果 -->
      <template v-if="activeTab === 'concepts'">
        <div class="results-grid results-grid-3" v-if="concepts.length">
          <ConceptCard v-for="concept in concepts" :key="concept.id" :concept="concept" />
        </div>
        <el-empty v-else description="没有找到相关概念" />
      </template>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="totalCount > 0">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="totalCount"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthorCard from '@/components/cards/AuthorCard.vue'
import WorkCard from '@/components/cards/WorkCard.vue'
import InstitutionCard from '@/components/cards/InstitutionCard.vue'
import ConceptCard from '@/components/cards/ConceptCard.vue'
import { getAuthors } from '@/api/author'
import { getWorks } from '@/api/work'
import { getInstitutions } from '@/api/institution'
import { getConcepts } from '@/api/concept'

const route = useRoute()
const router = useRouter()

const keyword = computed(() => route.query.keyword || '')
const activeTab = ref('authors')
const page = ref(1)
const size = ref(12)
const loading = ref(false)

const authors = ref([])
const works = ref([])
const institutions = ref([])
const concepts = ref([])

const authorTotal = ref(0)
const workTotal = ref(0)
const institutionTotal = ref(0)
const conceptTotal = ref(0)

const totalCount = computed(() => {
  switch (activeTab.value) {
    case 'authors': return authorTotal.value
    case 'works': return workTotal.value
    case 'institutions': return institutionTotal.value
    case 'concepts': return conceptTotal.value
    default: return 0
  }
})

const handleTabChange = () => {
  page.value = 1
  fetchData()
}

const fetchData = async () => {
  if (!keyword.value) return
  
  loading.value = true
  try {
    switch (activeTab.value) {
      case 'authors':
        const authorsRes = await getAuthors({ keyword: keyword.value, page: page.value, size: size.value })
        authors.value = authorsRes.data?.list || []
        authorTotal.value = authorsRes.data?.total || 0
        break
      case 'works':
        const worksRes = await getWorks({ keyword: keyword.value, page: page.value, size: size.value })
        works.value = worksRes.data?.list || []
        workTotal.value = worksRes.data?.total || 0
        break
      case 'institutions':
        const instRes = await getInstitutions({ keyword: keyword.value, page: page.value, size: size.value })
        institutions.value = instRes.data?.list || []
        institutionTotal.value = instRes.data?.total || 0
        break
      case 'concepts':
        const conceptRes = await getConcepts({ keyword: keyword.value, page: page.value, size: size.value })
        concepts.value = conceptRes.data?.list || []
        conceptTotal.value = conceptRes.data?.total || 0
        break
    }
  } catch (error) {
    console.error('搜索失败', error)
  } finally {
    loading.value = false
  }
}

const fetchAllCounts = async () => {
  if (!keyword.value) return
  
  try {
    const [authorsRes, worksRes, instRes, conceptRes] = await Promise.all([
      getAuthors({ keyword: keyword.value, page: 1, size: 1 }),
      getWorks({ keyword: keyword.value, page: 1, size: 1 }),
      getInstitutions({ keyword: keyword.value, page: 1, size: 1 }),
      getConcepts({ keyword: keyword.value, page: 1, size: 1 })
    ])
    
    authorTotal.value = authorsRes.data?.total || 0
    workTotal.value = worksRes.data?.total || 0
    institutionTotal.value = instRes.data?.total || 0
    conceptTotal.value = conceptRes.data?.total || 0
  } catch (error) {
    console.error('获取统计失败', error)
  }
}

watch(() => route.query.keyword, () => {
  page.value = 1
  fetchData()
  fetchAllCounts()
})

onMounted(() => {
  fetchData()
  fetchAllCounts()
})
</script>

<style lang="scss" scoped>
.search-page {
  padding-top: 32px;
  padding-bottom: 48px;
}

.search-header {
  margin-bottom: 24px;

  h1 {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .search-info {
    font-size: 14px;
    color: var(--text-secondary);

    .keyword {
      color: var(--primary-color);
      font-weight: 500;
    }
  }
}

.search-tabs {
  margin-bottom: 24px;

  :deep(.el-tabs__item) {
    .el-icon {
      margin-right: 4px;
    }
  }
}

.search-results {
  min-height: 400px;
}

.results-grid {
  display: grid;
  gap: 24px;

  &.results-grid-4 {
    grid-template-columns: repeat(4, 1fr);
  }

  &.results-grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

@media (max-width: 1200px) {
  .results-grid.results-grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
  .results-grid.results-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .results-grid {
    grid-template-columns: 1fr !important;
  }
}
</style>
