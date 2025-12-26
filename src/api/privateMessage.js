import request from '@/utils/request'

// 获取用户信息
export function getUserInfo(userId) {
  return request.get(`/social/users/${userId}`)
}

// 发送私信
export function sendPrivateMessage(data) {
  return request.post('/social/private-messages', data)
}

// 获取与某用户的对话
export function getConversation(userId, params) {
  return request.get(`/social/private-messages/conversation/${userId}`, { params })
}

// 获取所有对话列表
export function getConversations() {
  return request.get('/social/private-messages/conversations')
}

// 标记消息为已读
export function markPrivateMessageAsRead(messageId) {
  return request.put(`/social/private-messages/${messageId}/read`)
}

// 获取未读私信数量
export function getUnreadPrivateCount() {
  return request.get('/social/private-messages/unread-count')
}
