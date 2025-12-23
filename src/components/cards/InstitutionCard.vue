<template>
  <div class="institution-card" @click="goToDetail">
    <div class="card-header">
      <div class="inst-logo">
        <el-image 
          v-if="institution.imgUrl" 
          :src="institution.imgUrl" 
          fit="contain"
        >
          <template #error>
            <el-icon :size="40" color="#4A90E2"><OfficeBuilding /></el-icon>
          </template>
        </el-image>
        <el-icon v-else :size="40" color="#4A90E2"><OfficeBuilding /></el-icon>
      </div>
      <div class="inst-info">
        <h3 class="inst-name">{{ institution.name }}</h3>
        <a 
          v-if="institution.homepageUrl" 
          :href="institution.homepageUrl" 
          target="_blank" 
          class="inst-url"
          @click.stop
        >
          <el-icon><Link /></el-icon>
          官网
        </a>
      </div>
    </div>
    <div class="card-footer">
      <div class="stat-item">
        <span class="stat-value">{{ formatNumber(institution.worksCount) }}</span>
        <span class="stat-label">著作</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ formatNumber(institution.citedByCount) }}</span>
        <span class="stat-label">总引用</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  institution: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const goToDetail = () => {
  router.push(`/institutions/${props.institution.id}`)
}

const formatNumber = (num) => {
  if (!num) return 0
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}
</script>

<style lang="scss" scoped>
.institution-card {
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

  .inst-logo {
    width: 60px;
    height: 60px;
    border-radius: var(--radius-md);
    background: var(--bg-light);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .el-image {
      width: 50px;
      height: 50px;
    }
  }

  .inst-info {
    flex: 1;
    min-width: 0;

    .inst-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .inst-url {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
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
