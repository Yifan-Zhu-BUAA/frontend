<template>
  <div class="patent-detail-page page-container" v-loading="loading">
    <div class="patent-info card" v-if="patent">
      <div class="info-header">
        <el-tag :type="patent.status === '授权' ? 'success' : 'warning'" size="large">{{ patent.status }}</el-tag>
        <el-tag type="info" size="large">{{ patent.type }}</el-tag>
      </div>

      <h1>{{ patent.name }}</h1>

      <div class="info-grid">
        <div class="info-item"><span class="label">申请号：</span><span class="value">{{ patent.applicationNumber }}</span></div>
        <div class="info-item"><span class="label">专利号：</span><span class="value">{{ patent.patentNumber || '-' }}</span></div>
        <div class="info-item"><span class="label">申请人：</span><span class="value">{{ patent.applicant }}</span></div>
        <div class="info-item"><span class="label">发明人：</span><span class="value">{{ patent.inventor }}</span></div>
        <div class="info-item"><span class="label">申请日期：</span><span class="value">{{ formatDate(patent.applicationDate) }}</span></div>
        <div class="info-item"><span class="label">公开日期：</span><span class="value">{{ formatDate(patent.publicationDate) }}</span></div>
        <div class="info-item"><span class="label">授权日期：</span><span class="value">{{ formatDate(patent.grantDate) }}</span></div>
      </div>

      <div class="abstract-section" v-if="patent.abstract">
        <h3>摘要</h3>
        <p>{{ patent.abstract }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getPatentById } from '@/api/achievement'
import dayjs from 'dayjs'

const route = useRoute()
const loading = ref(false)
const patent = ref(null)

const fetchPatent = async () => {
  loading.value = true
  try {
    const res = await getPatentById(route.params.id)
    patent.value = res.data
  } catch (error) {
    console.error('获取专利信息失败', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'

onMounted(() => { fetchPatent() })
</script>

<style lang="scss" scoped>
.patent-detail-page { padding-top: 32px; padding-bottom: 48px; }

.patent-info {
  .info-header { display: flex; gap: 12px; margin-bottom: 16px; }
  h1 { font-size: 28px; font-weight: 600; margin-bottom: 24px; line-height: 1.4; }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 20px;
    background: var(--bg-light);
    border-radius: var(--radius-md);
    margin-bottom: 24px;

    .info-item {
      font-size: 14px;
      .label { color: var(--text-secondary); }
      .value { color: var(--text-primary); }
    }
  }

  .abstract-section {
    h3 { font-size: 16px; font-weight: 600; margin-bottom: 12px; }
    p { font-size: 14px; color: var(--text-regular); line-height: 1.8; }
  }
}
</style>
