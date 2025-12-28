import request from '@/utils/request'

// 用户发起学者申请
export function createApplication(data, file) {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }))
  if (file) {
    formData.append('file', file)
  }
  return request.post('/application/applications', formData)
}

// 我的申请记录
export function getMyApplications(params) {
  return request.get('/application/applications/my', { params })
}

// 申请记录列表（管理员）
export function getApplications(params) {
  return request.get('/application/applications', { params })
}

// 待处理申请列表（管理员）
export function getPendingApplications(params) {
  return request.get('/application/applications', { params })
}

// 查看单条申请详情
export function getApplicationById(applicationId) {
  return request.get(`/application/applications/${applicationId}`)
}

// 审核申请
export function reviewApplication(applicationId, data) {
  return request.put(`/application/applications/${applicationId}/review`, data)
}

// 通过申请
export function approveApplication(applicationId) {
  return request.put(`/application/applications/${applicationId}/review`, { status: 1 })
}

// 拒绝申请
export function rejectApplication(applicationId) {
  return request.put(`/application/applications/${applicationId}/review`, { status: 2 })
}

// 用户发起成果认领
export function createClaim(data) {
  return request.post('/application/claims', data)
}

// 我的认领记录
export function getMyClaims(params) {
  return request.get('/application/claims/my', { params })
}

// 认领记录列表（管理员）
export function getClaims(params) {
  return request.get('/application/claims', { params })
}

// 待处理认领列表（管理员）
export function getPendingClaims(params) {
  return request.get('/application/claims', { params })
}

// 认领详情
export function getClaimById(cid) {
  return request.get(`/application/claims/${cid}`)
}

// 审核认领
export function reviewClaim(cid, data) {
  return request.put(`/application/claims/${cid}/review`, data)
}

// 通过认领
export function approveClaim(cid) {
  return request.put(`/application/claims/${cid}/review`, { status: 1 })
}

// 拒绝认领
export function rejectClaim(cid) {
  return request.put(`/application/claims/${cid}/review`, { status: 2 })
}

