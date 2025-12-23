<template>
  <div class="institution-detail-page page-container" v-loading="loading">
    <div class="institution-profile card" v-if="institution">
      <div class="profile-header">
        <div class="inst-logo">
          <el-image v-if="institution.imgUrl" :src="institution.imgUrl" fit="contain">
            <template #error>
              <el-icon :size="60" color="#4A90E2"><OfficeBuilding /></el-icon>
            </template>
          </el-image>
          <el-icon v-else :size="60" color="#4A90E2"><OfficeBuilding /></el-icon>
        </div>
        <div class="profile-info">
          <h1>{{ institution.name }}</h1>
          <a v-if="institution.homepageUrl" :href="institution.homepageUrl" target="_blank" class="homepage-link">
            <el-icon><Link /></el-icon>
            访问官网
          </a>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(institution.worksCount) }}</span>
          <span class="stat-label">著作数量</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(institution.citedByCount) }}</span>
          <span class="stat-label">总引用数</span>
        </div>
      </div>
    </div>

    <div class="institution-tabs card" v-if="institution">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="学者" name="authors">
          <template #label>
            <span><el-icon><User /></el-icon> 学者 ({{ authorsTotal }})</span>
          </template>
          <div class="tab-content" v-loading="tabLoading">
            <div class="authors-grid" v-if="authors.length">
              <AuthorCard v-for="author in authors" :key="author.id" :author="author" />
            </div>
            <el-empty v-else description="暂无学者" />
            <el-pagination
              v-if="authorsTotal > pageSize"
              v-model:current-page="authorsPage"
              :page-size="pageSize"
              :total="authorsTotal"
              layout="total, prev, pager, next, jumper"
              background
              class="pagination"
              @current-change="fetchAuthors"
            />
          </div>
        </el-tab-pane>
        <el-tab-pane label="著作" name="works">
          <template #label>
            <span><el-icon><Document /></el-icon> 著作 ({{ worksTotal }})</span>
          </template>
          <div class="tab-content" v-loading="tabLoading">
            <div class="works-grid" v-if="works.length">
              <WorkCard v-for="work in works" :key="work.workId" :work="work" />
            </div>
            <el-empty v-else description="暂无著作" />
            <el-pagination
              v-if="worksTotal > pageSize"
              v-model:current-page="worksPage"
              :page-size="pageSize"
              :total="worksTotal"
              layout="total, prev, pager, next, jumper"
              background
              class="pagination"
              @current-change="fetchWorks"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AuthorCard from '@/components/cards/AuthorCard.vue'
import WorkCard from '@/components/cards/WorkCard.vue'
import { getInstitutionById, getInstitutionAuthors, getInstitutionWorks } from '@/api/institution'

const route = useRoute()
const loading = ref(false)
const tabLoading = ref(false)
const institution = ref(null)
const activeTab = ref('authors')

const pageSize = 12

const authors = ref([])
const authorsPage = ref(1)
const authorsTotal = ref(0)

const works = ref([])
const worksPage = ref(1)
const worksTotal = ref(0)

const fetchInstitution = async () => {
  loading.value = true
  try {
    const res = await getInstitutionById(route.params.id)
    institution.value = res.data
  } catch (error) {
    console.error('获取机构信息失败', error)
  } finally {
    loading.value = false
  }
}

const fetchAuthors = async () => {
  tabLoading.value = true
  try {
    const res = await getInstitutionAuthors(route.params.id, { page: authorsPage.value, size: pageSize })
    authors.value = res.data?.list || []
    authorsTotal.value = res.data?.total || 0
  } catch (error) {
    console.error('获取学者失败', error)
  } finally {
    tabLoading.value = false
  }
}

const fetchWorks = async () => {
  tabLoading.value = true
  try {
    const res = await getInstitutionWorks(route.params.id, { page: worksPage.value, size: pageSize })
    works.value = res.data?.list || []
    worksTotal.value = res.data?.total || 0
  } catch (error) {
    console.error('获取著作失败', error)
  } finally {
    tabLoading.value = false
  }
}

const formatNumber = (num) => {
  if (!num) return 0
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}

watch(activeTab, (tab) => {
  if (tab === 'authors' && !authors.value.length && authorsTotal.value > 0) fetchAuthors()
  if (tab === 'works' && !works.value.length && worksTotal.value > 0) fetchWorks()
})

onMounted(() => {
  fetchInstitution()
  // 同时获取学者和著作数据，确保 Tab 标签显示正确的总数
  fetchAuthors()
  fetchWorks()
})
</script>

<style lang="scss" scoped>
.institution-detail-page { padding-top: 32px; padding-bottom: 48px; }

.institution-profile {
  margin-bottom: 24px;

  .profile-header {
    display: flex;
    align-items: center;
    gap: 24px;
    margin-bottom: 24px;

    .inst-logo {
      width: 100px;
      height: 100px;
      border-radius: var(--radius-lg);
      background: var(--bg-light);
      display: flex;
      align-items: center;
      justify-content: center;
      .el-image { width: 80px; height: 80px; }
    }

    .profile-info {
      h1 { font-size: 28px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
      .homepage-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--primary-color);
        font-size: 14px;
      }
    }
  }

  .profile-stats {
    display: flex;
    gap: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--border-lighter);

    .stat-item {
      text-align: center;
      .stat-value { display: block; font-size: 32px; font-weight: 600; color: var(--primary-color); }
      .stat-label { font-size: 14px; color: var(--text-secondary); }
    }
  }
}

.institution-tabs {
  .tab-content { min-height: 300px; }
  .authors-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
  .works-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
  .pagination { margin-top: 24px; justify-content: center; }
}

@media (max-width: 1200px) {
  .institution-tabs .authors-grid { grid-template-columns: repeat(2, 1fr); }
  .institution-tabs .works-grid { grid-template-columns: 1fr; }
}
</style>
