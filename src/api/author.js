import request from '@/utils/request'

// 学者列表
export function getAuthors(params) {
  return request.get('/achievements/authors', { params })
}

// 学者详情
export function getAuthorById(authorId) {
  return request.get(`/achievements/authors/${authorId}`)
}

// 学者著作列表
export function getAuthorWorks(authorId, params) {
  return request.get(`/achievements/authors/${authorId}/works`, { params })
}

// 学者专利列表
export function getAuthorPatents(authorId, params) {
  return request.get(`/achievements/authors/${authorId}/patents`, { params })
}

// 学者奖项列表
export function getAuthorAwards(authorId, params) {
  return request.get(`/achievements/authors/${authorId}/awards`, { params })
}

// 学者项目列表
export function getAuthorProjects(authorId, params) {
  return request.get(`/achievements/authors/${authorId}/projects`, { params })
}

// 学者合著关系
export function getAuthorCoauthors(authorId, params) {
  return request.get(`/achievements/authors/${authorId}/coauthors`, { params })
}

// 推荐相关学者
export function getRecommendedAuthors(authorId, limit = 10) {
  return request.get(`/achievements/recommend/authors/${authorId}`, { params: { limit } })
}

// 为用户推荐学者（个性化推荐）
export function getRecommendedAuthorsForUser(limit = 10, refresh = null) {
  const params = { limit }
  if (refresh !== null) {
    params.refresh = refresh
  }
  return request.get('/achievements/recommend/user/authors', { params })
}
