<template>
  <div class="author-card" @click="goToDetail">
    <div class="card-header">
      <el-avatar :size="60" :src="author.avatar">
        {{ author.name?.charAt(0) }}
      </el-avatar>
      <div class="author-info">
        <h3 class="author-name">{{ author.name }}</h3>
        <p class="author-org">{{ author.organizationName || '暂无机构信息' }}</p>
      </div>
    </div>
    <div class="card-body">
      <p class="author-fields">
        <el-icon><Collection /></el-icon>
        <span>{{ formatFields(author.fields) || '暂无研究领域' }}</span>
      </p>
    </div>
    <div class="card-footer">
      <div class="stat-item">
        <span class="stat-value">{{ author.hIndex || author.hindex || 0 }}</span>
        <span class="stat-label">H指数</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ author.worksCount || 0 }}</span>
        <span class="stat-label">著作</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ formatNumber(author.cited) }}</span>
        <span class="stat-label">引用</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  author: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const goToDetail = () => {
  router.push(`/authors/${props.author.id}`)
}

const formatFields = (fields) => {
  if (!fields) return ''
  if (typeof fields === 'string') return fields
  if (Array.isArray(fields)) return fields.map(f => f.name || f).join('; ')
  return ''
}

const formatNumber = (num) => {
  if (!num) return 0
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}
</script>

<style lang="scss" scoped>
.author-card {
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
  gap: 16px;
  margin-bottom: 16px;

  .author-info {
    flex: 1;
    min-width: 0;
  }

  .author-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .author-org {
    font-size: 13px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.card-body {
  margin-bottom: 16px;

  .author-fields {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: var(--text-regular);
    line-height: 1.6;

    .el-icon {
      flex-shrink: 0;
      margin-top: 2px;
      color: var(--primary-color);
    }
  }
}

.card-footer {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid var(--border-lighter);

  .stat-item {
    text-align: center;

    .stat-value {
      display: block;
      font-size: 20px;
      font-weight: 600;
      color: var(--primary-color);
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
    }
  }
}
</style>
