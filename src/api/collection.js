import request from '@/utils/request'

// 获取我的所有收藏夹 (后端路径有重复)
export function getFavourites() {
  return request.get('/collection/favourites/favourites/my')
}

// 新建收藏夹
export function createFavourite(data) {
  return request.post('/collection/favourites/favourites', data)
}

// 修改收藏夹
export function updateFavourite(fid, data) {
  return request.put(`/collection/favourites/favourites/${fid}`, data)
}

// 删除收藏夹
export function deleteFavourite(fid) {
  return request.delete(`/collection/favourites/favourites/${fid}`)
}

// 向收藏夹添加成果
export function addToCollection(data) {
  return request.post('/collection/collections', data)
}

// 从收藏夹移除成果
export function removeFromCollection(cid) {
  return request.delete(`/collection/collections/${cid}`)
}

// 按收藏夹ID和成果ID移除收藏
export function removeCollectionByWork(fid, achievementId) {
  return request.delete(`/collection/collections`, { params: { fid, achievementId } })
}

// 获取某收藏夹内成果列表
export function getCollectionItems(fid, params) {
  return request.get(`/collection/favourites/${fid}/collections`, { params })
}

// 我的所有收藏成果
export function getMyCollections(params) {
  return request.get('/collection/collections/my', { params })
}

// 记录浏览历史
export function addHistory(data) {
  return request.post('/collection/histories/histories', data)
}

// 我的浏览历史列表
export function getHistories(params) {
  return request.get('/collection/histories/histories/my', { params })
}

// 删除单条历史
export function deleteHistory(hid) {
  return request.delete(`/collection/histories/histories/${hid}`)
}

// 清空历史
export function clearHistories() {
  return request.delete('/collection/histories/histories/my')
}
