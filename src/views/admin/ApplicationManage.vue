<template>
  <div class="application-manage card">
    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="筛选状态" clearable @change="fetchData">
        <el-option label="待处理" :value="0" />
        <el-option label="已通过" :value="1" />
        <el-option label="已拒绝" :value="2" />
      </el-select>
    </div>

    <el-table :data="applications" v-loading="loading" border stripe>
      <el-table-column prop="applicationId" label="申请ID" width="80" />
      <el-table-column prop="userId" label="用户ID" width="100" />
      <el-table-column prop="authorName" label="学者姓名" />
      <el-table-column prop="institutionName" label="机构" />
      <el-table-column prop="field" label="研究领域" />
      <el-table-column prop="proof" label="证明材料" width="120">
        <template #default="{ row }">
          <template v-if="row.proof">
            <el-button type="primary" size="small" link @click="viewProof(row.proof)">
              查看材料
            </el-button>
          </template>
          <span v-else class="no-proof">未上传</span>
        </template>
      </el-table-column>
      <el-table-column prop="applicationTime" label="申请时间" width="160">
        <template #default="{ row }">{{ formatDate(row.applicationTime) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">拒绝</el-button>
          </template>
          <span v-else class="processed">已处理</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper" v-if="total > size">
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="prev, pager, next"
        background
        @current-change="fetchData"
      />
    </div>

    <!-- 证明材料预览弹窗 -->
    <el-dialog v-model="proofDialogVisible" title="证明材料预览" width="700px">
      <div class="proof-preview">
        <img v-if="isImage(currentProof)" :src="getProofUrl(currentProof)" alt="证明材料" class="proof-image" />
        <iframe v-else-if="isPdf(currentProof)" :src="getProofUrl(currentProof)" class="proof-pdf"></iframe>
        <div v-else class="proof-link">
          <el-button type="primary" @click="downloadProof">下载查看</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPendingApplications, approveApplication, rejectApplication } from '@/api/application'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const applications = ref([])
const total = ref(0)
const page = ref(1)
const size = 20
const filterStatus = ref(null)

const proofDialogVisible = ref(false)
const currentProof = ref('')

const viewProof = (proof) => {
  currentProof.value = proof
  proofDialogVisible.value = true
}

const getProofUrl = (proof) => {
  // 如果是相对路径，拼接后端地址
  if (proof.startsWith('/')) {
    return `http://localhost:8090${proof}`
  }
  return proof
}

const isImage = (proof) => {
  if (!proof) return false
  const ext = proof.toLowerCase()
  return ext.endsWith('.jpg') || ext.endsWith('.jpeg') || ext.endsWith('.png') || ext.endsWith('.gif')
}

const isPdf = (proof) => {
  if (!proof) return false
  return proof.toLowerCase().endsWith('.pdf')
}

const downloadProof = () => {
  window.open(getProofUrl(currentProof.value), '_blank')
}

const fetchData = async () => {
  loading.value = true
  try {
    console.log('开始获取申请列表...')
    console.log('当前 token:', localStorage.getItem('token'))
    const res = await getPendingApplications({
      page: page.value - 1,  // Spring Data 分页从0开始
      size,
      status: filterStatus.value
    })
    console.log('API 返回结果:', res)
    // request.js 已经转换为 { list, total } 格式
    applications.value = res.data?.list || []
    total.value = res.data?.total || 0
    console.log('解析后的 applications:', applications.value, '总数:', total.value)
  } catch (error) {
    console.error('获取申请列表失败', error)
    ElMessage.error('获取申请列表失败: ' + (error.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('确定通过该学者认证申请吗？', '确认')
    await approveApplication(row.applicationId)
    ElMessage.success('已通过')
    row.status = 1
  } catch (error) {
    if (error !== 'cancel') console.error('操作失败', error)
  }
}

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm('确定拒绝该学者认证申请吗？', '确认')
    await rejectApplication(row.applicationId)
    ElMessage.success('已拒绝')
    row.status = 2
  } catch (error) {
    if (error !== 'cancel') console.error('操作失败', error)
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

onMounted(() => { fetchData() })
</script>

<style lang="scss" scoped>
.application-manage {
  .filter-bar {
    margin-bottom: 16px;
  }

  .processed {
    color: var(--text-secondary);
    font-size: 13px;
  }

  .no-proof {
    color: var(--text-placeholder);
    font-size: 12px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}

.proof-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;

  .proof-image {
    max-width: 100%;
    max-height: 500px;
    object-fit: contain;
  }

  .proof-pdf {
    width: 100%;
    height: 500px;
    border: none;
  }

  .proof-link {
    text-align: center;
  }
}
</style>
