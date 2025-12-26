import request from '@/utils/request'

// 我的关注列表
export function getMyFollows(params) {
  return request.get('/social/users/me/follows', { params })
}

// 我的粉丝列表
export function getMyFans(params) {
  return request.get('/social/users/me/fans', { params })
}

// 关注
export function follow(data) {
  return request.post('/social/follows', data)
}

// 关注用户（别名）
export function followUser(data) {
  return request.post('/social/follows', data)
}

// 取消关注
export function unfollow(followId) {
  return request.delete(`/social/follows/${followId}`)
}

// 取消关注用户（通过 authorId）
export function unfollowUser(idTo) {
  return request.delete(`/social/follows/author/${idTo}`)
}

// 检查关注状态
export function checkFollowStatus(idTo) {
  return request.get(`/social/follows/check/${idTo}`)
}
