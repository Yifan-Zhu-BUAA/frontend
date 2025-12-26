import request from '@/utils/request'

// 著作列表
export function getWorks(params) {
  return request.get('/achievements/works', { params })
}

// 著作详情
export function getWorkById(workId) {
  return request.get(`/achievements/works/${workId}`)
}

// 著作引用文献
export function getWorkReferences(workId, params) {
  return request.get(`/achievements/works/${workId}/references`, { params })
}

// 被引文献
export function getWorkCitedBy(workId, params) {
  return request.get(`/achievements/works/${workId}/cited-by`, { params })
}

// 相关著作
export function getWorkRelated(workId, params) {
  return request.get(`/achievements/works/${workId}/related`, { params })
}

// 高级搜索
export function advancedSearchWorks(searchRequest) {
  return request.post('/achievements/works/advanced-search', searchRequest)
}
