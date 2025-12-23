<template>
  <div class="work-card" @click="goToDetail">
    <div class="card-header">
      <div class="work-type-tag">
        <el-tag size="small" type="primary">{{ getTypeLabel(work.type) }}</el-tag>
      </div>
      <h3 class="work-title">{{ work.title }}</h3>
    </div>
    <div class="card-body">
      <p class="work-authors">
        <el-icon><User /></el-icon>
        <span>{{ work.authors || '未知作者' }}</span>
      </p>
      <p class="work-journal">
        <el-icon><Notebook /></el-icon>
        <span>{{ work.journal || '未知期刊' }}</span>
      </p>
      <p v-if="work.abstract" class="work-abstract">
        {{ truncateText(work.abstract, 120) }}
      </p>
    </div>
    <div class="card-footer">
      <div class="meta-info">
        <span class="publish-date">
          <el-icon><Calendar /></el-icon>
          {{ formatDate(work.publishTime) }}
        </span>
      </div>
      <div class="cited-count">
        <el-icon><DataLine /></el-icon>
        <span>{{ work.cited || 0 }} 次引用</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'

const props = defineProps({
  work: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const goToDetail = () => {
  router.push(`/works/${props.work.workId}`)
}

const getTypeLabel = (type) => {
  const types = {
    'paper': '论文',
    'book': '书籍',
    'article': '文章',
    'conference': '会议',
    'journal-article': '期刊论文'
  }
  return types[type] || type || '论文'
}

const formatDate = (date) => {
  if (!date) return '未知'
  return dayjs(date).format('YYYY-MM-DD')
}

const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '...' : text
}
</script>

<style lang="scss" scoped>
.work-card {
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
  margin-bottom: 12px;

  .work-type-tag {
    margin-bottom: 8px;
  }

  .work-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.5;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
}

.card-body {
  margin-bottom: 12px;

  p {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13px;
    color: var(--text-regular);
    margin-bottom: 8px;

    .el-icon {
      flex-shrink: 0;
      margin-top: 2px;
      color: var(--primary-color);
    }
  }

  .work-abstract {
    color: var(--text-secondary);
    line-height: 1.6;
    margin-top: 12px;
  }
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-lighter);

  .meta-info {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--text-secondary);

    .el-icon {
      color: var(--primary-light);
    }
  }

  .cited-count {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--primary-color);
    font-weight: 500;
  }
}
</style>
