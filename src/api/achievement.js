import request from '@/utils/request'

// 专利列表
export function getPatents(params) {
  return request.get('/achievements/patents', { params })
}

// 专利详情
export function getPatentById(patentId) {
  return request.get(`/achievements/patents/${patentId}`)
}

// 奖项列表
export function getAwards(params) {
  return request.get('/achievements/awards', { params })
}

// 奖项详情
export function getAwardById(awardId) {
  return request.get(`/achievements/awards/${awardId}`)
}

// 项目列表
export function getProjects(params) {
  return request.get('/achievements/projects', { params })
}

// 项目详情
export function getProjectById(projectId) {
  return request.get(`/achievements/projects/${projectId}`)
}
