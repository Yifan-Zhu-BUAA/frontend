import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 创建 axios 实例
const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(  (response) => {
    const res = response.data
    
    // 兼容多种响应格式
    // 格式1: { code: 0/200, msg/message: 'success', data: {...} }
    if (res.code !== undefined) {
      // 兼容 code: 0 和 code: 200 作为成功响应
      if (res.code === 0 || res.code === 200) {
        // 处理 Spring Data 分页格式转换为统一格式
        if (res.data && res.data.content !== undefined) {
          res.data = {
            list: res.data.content,
            total: res.data.totalElements,
            page: res.data.number + 1, // Spring 页码从0开始
            size: res.data.size
          }
        }
        // 统一 code 为 200
        res.code = 200
        return res
      }
      // 处理错误响应 (兼容 msg 和 message)
      const errMsg = res.msg || res.message || '请求失败'
      // 不显示某些预期的业务错误
      if (res.code !== 101) { // 101 = 用户不存在，可能是正常情况
        ElMessage.error(errMsg)
      }
      return Promise.reject(new Error(errMsg))
    }
    
    // 格式2: 直接返回数据对象，如 { token: 'xxx' } 或 { uid: 1, ... }
    // 包装成统一格式返回
    return { code: 0, data: res, msg: 'success' }
  },
  (error) => {
    // 处理 HTTP 错误
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(error.response.data?.msg || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

export default request
