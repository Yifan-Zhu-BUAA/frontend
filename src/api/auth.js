import request from '@/utils/request'

// 用户注册
export function register(data) {
  return request.post('/auth/register', data)
}

// 用户登录
export function login(data) {
  return request.post('/auth/login', data)
}

// 获取当前用户信息
export function getCurrentUser() {
  return request.get('/social/users/me')
}

// 获取指定用户信息
export function getUserById(uid) {
  return request.get(`/social/users/${uid}`)
}

// 更新个人资料
export function updateProfile(data) {
  return request.put('/social/users/me', data)
}
