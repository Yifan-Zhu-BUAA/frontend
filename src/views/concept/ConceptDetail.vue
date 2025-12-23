<template>
  <div class="concept-detail-page page-container" v-loading="loading">
    <div class="concept-profile card" v-if="concept">
      <div class="profile-header">
        <div class="concept-icon">
          <el-image v-if="concept.imageUrl" :src="concept.imageUrl" fit="cover">
            <template #error><el-icon :size="48" color="#4A90E2"><Connection /></el-icon></template>
          </el-image>
          <el-icon v-else :size="48" color="#4A90E2"><Connection /></el-icon>
        </div>
        <div class="profile-info">
          <h1>{{ concept.name }}</h1>
          <el-tag :type="getLevelType(concept.level)">Level {{ concept.level }}</el-tag>
        </div>
      </div>

      <p class="concept-desc" v-if="concept.description">{{ concept.description }}</p>

      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(concept.worksCount) }}</span>
          <span class="stat-label">相关著作</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(concept.citedByCount) }}</span>
          <span class="stat-label">被引用</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ concept.hIndex || 0 }}</span>
          <span class="stat-label">H指数</span>
        </div>
      </div>

      <div class="related-concepts" v-if="concept.relatedConcepts?.length">
        <h4>相关概念</h4>
        <div class="concepts-tags">
          <router-link v-for="c in concept.relatedConcepts" :key="c.id" :to="`/concepts/${c.id}`" class="concept-tag">
            {{ c.name }}
          </router-link>
        </div>
      </div>

      <div class="ancestor-concepts" v-if="concept.ancestors?.length">
        <h4>上位概念</h4>
        <el-breadcrumb separator="/">
          <el-breadcrumb-item v-for="a in concept.ancestors" :key="a.id">
            <router-link :to="`/concepts/${a.id}`">{{ a.name }}</router-link>
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>

    <div class="concept-works card" v-if="concept">
      <h3 class="section-title">相关著作</h3>
      <div class="works-grid" v-loading="worksLoading">
        <WorkCard v-for="work in works" :key="work.workId" :work="work" />
      </div>
      <el-empty v-if="!works.length && !worksLoading" description="暂无相关著作" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import WorkCard from '@/components/cards/WorkCard.vue'
import { getConceptById, getConceptWorks } from '@/api/concept'

const route = useRoute()
const loading = ref(false)
const worksLoading = ref(false)
const concept = ref(null)
const works = ref([])

const fetchConcept = async () => {
  loading.value = true
  try {
    const res = await getConceptById(route.params.id)
    concept.value = res.data
  } catch (error) {
    console.error('获取概念信息失败', error)
  } finally {
    loading.value = false
  }
}

const fetchWorks = async () => {
  worksLoading.value = true
  try {
    const res = await getConceptWorks(route.params.id, { page: 1, size: 12 })
    works.value = res.data?.list || []
  } catch (error) {
    console.error('获取著作失败', error)
  } finally {
    worksLoading.value = false
  }
}

const getLevelType = (level) => {
  if (level <= 1) return 'danger'
  if (level <= 2) return 'warning'
  return 'primary'
}

const formatNumber = (num) => {
  if (!num) return 0
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}

onMounted(() => {
  fetchConcept()
  fetchWorks()
})
</script>

<style lang="scss" scoped>
.concept-detail-page { padding-top: 32px; padding-bottom: 48px; }

.concept-profile {
  margin-bottom: 24px;

  .profile-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 20px;

    .concept-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--primary-lightest);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      .el-image { width: 100%; height: 100%; }
    }

    .profile-info {
      h1 { font-size: 28px; font-weight: 600; margin-bottom: 8px; }
    }
  }

  .concept-desc {
    font-size: 14px;
    color: var(--text-regular);
    line-height: 1.8;
    margin-bottom: 20px;
  }

  .profile-stats {
    display: flex;
    gap: 48px;
    padding: 20px 0;
    border-top: 1px solid var(--border-lighter);
    border-bottom: 1px solid var(--border-lighter);
    margin-bottom: 20px;

    .stat-item {
      text-align: center;
      .stat-value { display: block; font-size: 28px; font-weight: 600; color: var(--primary-color); }
      .stat-label { font-size: 14px; color: var(--text-secondary); }
    }
  }

  .related-concepts, .ancestor-concepts {
    margin-bottom: 16px;
    h4 { font-size: 14px; color: var(--text-secondary); margin-bottom: 12px; }
  }

  .concepts-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .concept-tag {
    padding: 4px 12px;
    background: var(--primary-lightest);
    color: var(--primary-color);
    border-radius: 16px;
    font-size: 13px;
    &:hover { background: var(--primary-lighter); }
  }
}

.concept-works {
  .section-title { margin-bottom: 20px; }
  .works-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; min-height: 200px; }
}

@media (max-width: 1200px) { .concept-works .works-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 768px) { .concept-works .works-grid { grid-template-columns: 1fr; } }
</style>
