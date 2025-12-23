import request from '@/utils/request'

// 概念列表
export function getConcepts(params) {
  return request.get('/achievements/concepts', { params })
}

// 概念详情
export function getConceptById(conceptId) {
  return request.get(`/achievements/concepts/${conceptId}`)
}

// 概念下著作
export function getConceptWorks(conceptId, params) {
  return request.get(`/achievements/concepts/${conceptId}/works`, { params })
}

// 相关概念
export function getRelatedConcepts(conceptId, params) {
  return request.get(`/achievements/concepts/${conceptId}/related-concepts`, { params })
}

// 祖先概念
export function getConceptAncestors(conceptId) {
  return request.get(`/achievements/concepts/${conceptId}/ancestors`)
}
