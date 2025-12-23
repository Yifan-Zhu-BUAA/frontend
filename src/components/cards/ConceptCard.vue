<template>
  <div class="concept-card" @click="goToDetail">
    <div class="card-header">
      <div class="concept-icon">
        <el-image 
          v-if="concept.imageUrl" 
          :src="concept.imageUrl" 
          fit="cover"
        >
          <template #error>
            <el-icon :size="32" color="#4A90E2"><Connection /></el-icon>
          </template>
        </el-image>
        <el-icon v-else :size="32" color="#4A90E2"><Connection /></el-icon>
      </div>
      <div class="concept-info">
        <h3 class="concept-name">{{ concept.name }}</h3>
        <el-tag size="small" :type="getLevelType(concept.level)">
          Level {{ concept.level }}
        </el-tag>
      </div>
    </div>
    <div v-if="concept.description" class="card-body">
      <p class="concept-desc">{{ truncateText(concept.description, 100) }}</p>
    </div>
    <div class="card-footer">
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
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  concept: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const goToDetail = () => {
  router.push(`/concepts/${props.concept.id}`)
}

const getLevelType = (level) => {
  if (level <= 1) return 'danger'
  if (level <= 2) return 'warning'
  if (level <= 3) return 'primary'
  return 'info'
}

const formatNumber = (num) => {
  if (!num) return 0
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}
</script>

<style lang="scss" scoped>
.concept-card {
  background: var(--bg-white);
  border-radius: var(--radius-lg);
  padding: 20px;
  cursor: pointer;
  transition: all var(--transition-normal);
  border: 1px solid var(--border-lighter);

  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-md);
    border-color: var(--primary-lighter);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;

  .concept-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--primary-lightest);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;

    .el-image {
      width: 100%;
      height: 100%;
    }
  }

  .concept-info {
    flex: 1;
    min-width: 0;

    .concept-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.card-body {
  margin-bottom: 12px;

  .concept-desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.6;
  }
}

.card-footer {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid var(--border-lighter);

  .stat-item {
    text-align: center;

    .stat-value {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-color);
    }

    .stat-label {
      font-size: 11px;
      color: var(--text-secondary);
    }
  }
}
</style>
