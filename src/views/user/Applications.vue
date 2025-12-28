<template>
  <div class="applications-page card">
    <h2 class="page-title">我的申请</h2>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="学者申请" name="applications">
        <el-button type="primary" size="small" @click="openApplyDialog" style="margin-bottom: 16px">
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
    <el-dialog v-model="showApplyDialog" title="申请成为学者" width="560px" @close="resetApplyForm">
      <el-form :model="applyForm" label-width="100px">
        <!-- 学者搜索 -->
        <el-form-item label="搜索学者" required>
          <el-select
            v-model="selectedAuthor"
            filterable
            remote
            reserve-keyword
            placeholder="输入学者姓名搜索"
            :remote-method="searchAuthors"
            :loading="searchLoading"
            value-key="id"
            style="width: 100%"
            @change="onAuthorSelect"
            clearable
            @clear="clearSelectedAuthor"
          >
            <el-option
              v-for="author in authorOptions"
              :key="author.id"
              :label="author.name"
              :value="author"
            >
              <div class="author-option">
                <span class="author-name">{{ author.name }}</span>
                <span class="author-org">{{ author.organizationName || '未知机构' }}</span>
              </div>
            </el-option>
          </el-select>
          <div class="search-tip">
            <el-icon><InfoFilled /></el-icon>
            <span>输入学者姓名进行搜索，选中后自动填充信息</span>
          </div>
        </el-form-item>

        <!-- 选中的学者信息卡片 -->
        <div v-if="selectedAuthor" class="selected-author-card">
          <div class="author-card-header">
            <el-icon><User /></el-icon>
            <span>已选择学者</span>
          </div>
          <div class="author-card-body">
            <div class="info-row">
              <span class="label">姓名：</span>
              <span class="value">{{ selectedAuthor.name }}</span>
            </div>
            <div class="info-row">
              <span class="label">机构：</span>
              <span class="value">{{ selectedAuthor.organizationName || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">研究领域：</span>
              <span class="value">{{ selectedAuthor.fields || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">H指数：</span>
              <span class="value">{{ selectedAuthor.hIndex ?? '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">论文数：</span>
              <span class="value">{{ selectedAuthor.worksCount ?? '-' }}</span>
            </div>
          </div>
        </div>

        <!-- 未选择学者时的提示 -->
        <div v-if="!selectedAuthor" class="empty-tip">
          <el-empty description="请搜索并选择您要认证的学者" :image-size="80" />
        </div>

        <!-- 证明材料上传 -->
        <el-form-item label="证明材料">
          <el-upload
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :file-list="fileList"
            accept=".jpg,.jpeg,.png,.pdf"
          >
            <template #trigger>
              <el-button type="primary">选择文件</el-button>
            </template>
            <template #tip>
              <div class="el-upload__tip">
                只能上传 jpg/png/pdf 文件，且不超过 5MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApplyDialog = false">取消</el-button>
        <el-button type="primary" @click="submitApplication" :loading="submitting" :disabled="!selectedAuthor">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { getMyApplications, getMyClaims, createApplication } from '@/api/application'
import { getAuthors } from '@/api/author'
import { ElMessage } from 'element-plus'
import { InfoFilled, User } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const activeTab = ref('applications')
const loading = ref(false)
const claimsLoading = ref(false)
const submitting = ref(false)

const applications = ref([])
const claims = ref([])

const showApplyDialog = ref(false)

// 学者搜索相关
const searchLoading = ref(false)
const authorOptions = ref([])
const selectedAuthor = ref(null)

const applyForm = reactive({
  authorId: '',
  authorName: '',
  institutionName: '',
  field: ''
})

const fileList = ref([])
const uploadFile = ref(null)

const handleFileChange = (file) => {
  uploadFile.value = file.raw
}

const handleFileRemove = () => {
  uploadFile.value = null
}

// 打开申请对话框
const openApplyDialog = () => {
  resetApplyForm()
  showApplyDialog.value = true
}

// 重置申请表单
const resetApplyForm = () => {
  selectedAuthor.value = null
  authorOptions.value = []
  Object.keys(applyForm).forEach(k => applyForm[k] = '')
  fileList.value = []
  uploadFile.value = null
}

// 搜索学者
const searchAuthors = async (query) => {
  if (!query || query.length < 1) {
    authorOptions.value = []
    return
  }
  
  searchLoading.value = true
  try {
    const res = await getAuthors({ keyword: query, page: 1, size: 20 })
    // 处理返回数据，支持多种格式
    const data = res.data?.data || res.data
    authorOptions.value = data?.list || data?.items || []
  } catch (error) {
    console.error('搜索学者失败', error)
    authorOptions.value = []
  } finally {
    searchLoading.value = false
  }
}

// 选择学者后自动填充
const onAuthorSelect = (author) => {
  if (author) {
    applyForm.authorId = author.id
    applyForm.authorName = author.name
    applyForm.institutionName = author.organizationName || ''
    applyForm.field = author.fields || ''
  }
}

// 清除选择的学者
const clearSelectedAuthor = () => {
  selectedAuthor.value = null
  Object.keys(applyForm).forEach(k => applyForm[k] = '')
}

const fetchApplications = async () => {
  loading.value = true
  try {
    const res = await getMyApplications({ page: 0, size: 50 })
    const data = res.data
    applications.value = data?.content || data?.list || (Array.isArray(data) ? data : [])
  } catch (error) {
    console.error('获取申请记录失败', error)
  } finally {
    loading.value = false
  }
}

const fetchClaims = async () => {
  claimsLoading.value = true
  try {
    const res = await getMyClaims({ page: 0, size: 50 })
    // Spring Data Page 格式：res.data.content
    const data = res.data
    claims.value = data?.content || data?.list || (Array.isArray(data) ? data : [])
  } catch (error) {
    console.error('获取认领记录失败', error)
  } finally {
    claimsLoading.value = false
  }
}

const submitApplication = async () => {
  // 验证：必须选择学者
  if (!selectedAuthor.value || !applyForm.authorId) {
    ElMessage.warning('请选择要认证的学者')
    return
  }

  submitting.value = true
  try {
    await createApplication(applyForm, uploadFile.value)
    ElMessage.success('申请提交成功，请等待管理员审核')
    showApplyDialog.value = false
    resetApplyForm()
    fetchApplications()
  } catch (error) {
    console.error('提交失败', error)
    ElMessage.error('提交失败，请稍后重试')
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

// 学者搜索下拉选项样式
.author-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  .author-name {
    font-weight: 500;
  }
  
  .author-org {
    font-size: 12px;
    color: var(--text-placeholder);
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

// 搜索提示
.search-tip {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-placeholder);
  
  .el-icon {
    color: var(--el-color-info);
  }
}

// 已选择学者卡片
.selected-author-card {
  margin: 16px 0;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  overflow: hidden;
  
  .author-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    font-weight: 500;
    
    .el-icon {
      font-size: 16px;
    }
  }
  
  .author-card-body {
    padding: 16px;
    background: var(--el-bg-color);
    
    .info-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 14px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        color: var(--text-placeholder);
        width: 80px;
        flex-shrink: 0;
      }
      
      .value {
        color: var(--text-primary);
        word-break: break-all;
      }
    }
  }
}

// 未选择学者时的空状态提示
.empty-tip {
  margin: 20px 0;
}
</style>
