import request from '@/utils/request'

// 获取成果评论列表
export function getComments(achievementId, params) {
  return request.get(`/social/achievements/${achievementId}/comments`, { params })
}

// 发表评论
export function createComment(data) {
  return request.post('/social/comments', data)
}

// 删除评论
export function deleteComment(commentId) {
  return request.delete(`/social/comments/${commentId}`)
}

// 点赞评论
export function likeComment(commentId) {
  return request.post(`/social/comments/${commentId}/likes`)
}

// 取消点赞
export function unlikeComment(commentId) {
  return request.delete(`/social/comments/${commentId}/likes`)
}

// 我点赞过的评论
export function getMyLikedComments(params) {
  return request.get('/social/users/me/likes/comments', { params })
}
