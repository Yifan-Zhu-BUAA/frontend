import request from '@/utils/request'

// 我的消息列表
export function getMessages(params) {
  return request.get('/social/messages', { params })
}

// 消息详情
export function getMessageById(msgId) {
  return request.get(`/social/messages/${msgId}`)
}

// 标记消息为已读
export function markMessageRead(msgId) {
  return request.put(`/social/messages/${msgId}/read`)
}

// 未读消息数量
export function getUnreadCount() {
  return request.get('/social/messages/unread-count')
}
