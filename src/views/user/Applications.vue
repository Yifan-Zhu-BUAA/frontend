<template>
  <div class="applications-page card">
    <h2 class="page-title">我的申请</h2>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="学者申请" name="applications">
        <el-button type="primary" size="small" @click="showApplyDialog = true" style="margin-bottom: 16px">
          <el-icon><Plus /></el-icon>发起申请
        </el-button>
        <div class="applications-list" v-loading="loading">
          <div class="app-item" v-for="app in applications" :key="app.applicationId">
            <div class="app-info">
              <h4>申请绑定学者：{{ app.authorName }}</h4>
              <p>机构：{{ app.institutionName }} · 领域：{{ app.field }}</p>
              <span class="app-time">申请时间：{{ formatDate(app.applicationTime) }}</span>
            </div>
            <el-tag :type="getStatusType(app.status)">{{ getStatusText(app.status) }}</el-tag>
          </div>
          <el-empty v-if="!applications.length" description="暂无申请记录" />
        </div>
      </el-tab-pane>
      <el-tab-pane label="成果认领" name="claims">
        <div class="claims-list" v-loading="claimsLoading">
          <div class="app-item" v-for="claim in claims" :key="claim.cid">
            <div class="app-info">
              <h4>认领著作ID：{{ claim.workId }}</h4>
              <p>理由：{{ claim.reason }}</p>
              <span class="app-time">申请时间：{{ formatDate(claim.time) }}</span>
            </div>
            <el-tag :type="getStatusType(claim.status)">{{ getStatusText(claim.status) }}</el-tag>
          </div>
          <el-empty v-if="!claims.length" description="暂无认领记录" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 申请对话框 -->
    <el-dialog v-model="showApplyDialog" title="申请成为学者" width="500px">
      <el-form :model="applyForm" label-width="100px">
        <el-form-item label="学者ID">
          <el-input v-model="applyForm.authorId" placeholder="请输入要绑定的学者ID" />
        </el-form-item>
        <el-form-item label="学者姓名">
          <el-input v-model="applyForm.authorName" placeholder="请输入学者姓名" />
        </el-form-item>
        <el-form-item label="机构名称">
          <el-input v-model="applyForm.institutionName" placeholder="请输入所在机构" />
        </el-form-item>
        <el-form-item label="研究领域">
          <el-input v-model="applyForm.field" placeholder="请输入研究领域" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApplyDialog = false">取消</el-button>
        <el-button type="primary" @click="submitApplication" :loading="submitting">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { getMyApplications, getMyClaims, createApplication } from '@/api/application'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const activeTab = ref('applications')
const loading = ref(false)
const claimsLoading = ref(false)
const submitting = ref(false)

const applications = ref([])
const claims = ref([])

const showApplyDialog = ref(false)
const applyForm = reactive({
  authorId: '',
  authorName: '',
  institutionName: '',
  field: ''
})

const fetchApplications = async () => {
  loading.value = true
  try {
    const res = await getMyApplications({ page: 1, size: 50 })
    applications.value = res.data?.list || []
  } catch (error) {
    console.error('获取申请记录失败', error)
  } finally {
    loading.value = false
  }
}

const fetchClaims = async () => {
  claimsLoading.value = true
  try {
    const res = await getMyClaims({ page: 1, size: 50 })
    claims.value = res.data?.list || []
  } catch (error) {
    console.error('获取认领记录失败', error)
  } finally {
    claimsLoading.value = false
  }
}

const submitApplication = async () => {
  if (!applyForm.authorId || !applyForm.authorName) {
    ElMessage.warning('请填写必要信息')
    return
  }

  submitting.value = true
  try {
    await createApplication(applyForm)
    ElMessage.success('申请提交成功')
    showApplyDialog.value = false
    Object.keys(applyForm).forEach(k => applyForm[k] = '')
    fetchApplications()
  } catch (error) {
    console.error('提交失败', error)
  } finally {
    submitting.value = false
  }
}

const getStatusType = (status) => {
  if (status === 0) return 'warning'
  if (status === 1) return 'success'
  return 'danger'
}

const getStatusText = (status) => {
  if (status === 0) return '待处理'
  if (status === 1) return '已通过'
  return '已拒绝'
}

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'

watch(activeTab, (tab) => {
  if (tab === 'claims' && !claims.value.length) fetchClaims()
})

onMounted(() => { fetchApplications() })
</script>

<style lang="scss" scoped>
.applications-page {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 24px;
  }

  .applications-list, .claims-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 200px;
  }

  .app-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 16px;
    background: var(--bg-light);
    border-radius: var(--radius-md);

    .app-info {
      h4 { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
      p { font-size: 14px; color: var(--text-regular); margin-bottom: 4px; }
      .app-time { font-size: 12px; color: var(--text-placeholder); }
    }
  }
}
</style>
