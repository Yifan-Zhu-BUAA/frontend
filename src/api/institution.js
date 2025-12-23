import request from '@/utils/request'

// 机构列表
export function getInstitutions(params) {
  return request.get('/achievements/institutions', { params })
}

// 机构详情
export function getInstitutionById(institutionId) {
  return request.get(`/achievements/institutions/${institutionId}`)
}

// 机构内学者
export function getInstitutionAuthors(institutionId, params) {
  return request.get(`/achievements/institutions/${institutionId}/authors`, { params })
}

// 机构内著作
export function getInstitutionWorks(institutionId, params) {
  return request.get(`/achievements/institutions/${institutionId}/works`, { params })
}
