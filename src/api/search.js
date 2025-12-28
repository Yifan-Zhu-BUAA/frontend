import request from '@/utils/request'

/**
 * 获取搜索建议
 * @param {string} query - 搜索关键词
 * @param {string} type - 搜索类型 (all, work, author, institution, concept)
 * @returns {Promise}
 */
export function getSearchSuggestions(query, type = 'all') {
  return request({
    url: '/api/search/suggestions',
    method: 'get',
    params: { query, type }
  })
}

/**
 * 综合搜索
 * @param {Object} params - 搜索参数
 * @returns {Promise}
 */
export function searchAll(params) {
  return request({
    url: '/api/search',
    method: 'get',
    params
  })
}

/**
 * 搜索成果
 * @param {Object} params - 搜索参数
 * @returns {Promise}
 */
export function searchWorks(params) {
  return request({
    url: '/api/achievements/works/search',
    method: 'get',
    params
  })
}

/**
 * 搜索作者
 * @param {Object} params - 搜索参数
 * @returns {Promise}
 */
export function searchAuthors(params) {
  return request({
    url: '/api/achievements/authors/search',
    method: 'get',
    params
  })
}

/**
 * 搜索机构
 * @param {Object} params - 搜索参数
 * @returns {Promise}
 */
export function searchInstitutions(params) {
  return request({
    url: '/api/achievements/institutions/search',
    method: 'get',
    params
  })
}

/**
 * 搜索概念/领域
 * @param {Object} params - 搜索参数
 * @returns {Promise}
 */
export function searchConcepts(params) {
  return request({
    url: '/api/achievements/concepts/search',
    method: 'get',
    params
  })
}
