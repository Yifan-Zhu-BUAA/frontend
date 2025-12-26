<template>
  <div class="claim-manage card">
    <div class="filter-bar">
      <el-select v-model="filterStatus" placeholder="筛选状态" clearable @change="fetchData">
        <el-option label="待处理" :value="0" />
        <el-option label="已通过" :value="1" />
        <el-option label="已拒绝" :value="2" />
      </el-select>
    </div>

    <el-table :data="claims" v-loading="loading" border stripe>
      <el-table-column prop="cid" label="认领ID" width="80" />
      <el-table-column prop="uid" label="用户ID" width="100" />
      <el-table-column prop="workId" label="著作ID" />
      <el-table-column prop="reason" label="认领理由" show-overflow-tooltip />
      <el-table-column prop="time" label="申请时间" width="160">
        <template #default="{ row }">{{ formatDate(row.time) }}</template>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPendingClaims, approveClaim, rejectClaim } from '@/api/application'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const claims = ref([])
const total = ref(0)
const page = ref(1)
const size = 20
const filterStatus = ref(null)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await getPendingClaims({
      page: page.value - 1,  // Spring Data 分页从0开始
      size,
      status: filterStatus.value
    })
    // request.js 已经转换为 { list, total } 格式
    claims.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('获取认领列表失败', error)
  } finally {
    loading.value = false
  }
}

const handleApprove = async (row) => {
  try {
    await ElMessageBox.confirm('确定通过该成果认领申请吗？', '确认')
    await approveClaim(row.cid)
    ElMessage.success('已通过')
    row.status = 1
  } catch (error) {
    if (error !== 'cancel') console.error('操作失败', error)
  }
}

const handleReject = async (row) => {
  try {
    await ElMessageBox.confirm('确定拒绝该成果认领申请吗？', '确认')
    await rejectClaim(row.cid)
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
.claim-manage {
  .filter-bar {
    margin-bottom: 16px;
  }

  .processed {
    color: var(--text-secondary);
    font-size: 13px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}
</style>
