<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand">
          <el-icon :size="48" color="#fff"><Reading /></el-icon>
          <h1>学术成果分享平台</h1>
          <p>探索学术世界，分享研究成果</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon><Search /></el-icon>
            <span>便捷的学术检索</span>
          </div>
          <div class="feature-item">
            <el-icon><Collection /></el-icon>
            <span>个性化收藏管理</span>
          </div>
          <div class="feature-item">
            <el-icon><ChatDotRound /></el-icon>
            <span>学术交流社区</span>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-form-container">
          <h2>欢迎回来</h2>
          <p class="subtitle">登录您的账户</p>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            size="large"
            @submit.prevent="handleLogin"
          >
            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                placeholder="请输入邮箱"
                prefix-icon="Message"
              />
            </el-form-item>

            <el-form-item prop="password">
              <el-input
                v-model="form.password"
                type="password"
                placeholder="请输入密码"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item>
              <div class="form-options">
                <el-checkbox v-model="rememberMe">记住我</el-checkbox>
                <el-link type="primary">忘记密码？</el-link>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="login-btn"
                @click="handleLogin"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>

          <div class="register-link">
            还没有账户？
            <router-link to="/register">立即注册</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const rememberMe = ref(false)

const form = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await userStore.login({
        email: form.email,
        password: form.password
      })
      ElMessage.success('登录成功')
      
      // 跳转到之前的页面或首页
      const redirect = route.query.redirect || '/'
      router.push(redirect)
    } catch (error) {
      console.error('登录失败', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E8F4FD 0%, #F5F9FC 100%);
}

.login-container {
  display: flex;
  width: 900px;
  min-height: 520px;
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.login-left {
  flex: 1;
  padding: 48px;
  background: linear-gradient(135deg, #4A90E2 0%, #2B68C0 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;

  .brand {
    text-align: center;
    margin-bottom: 48px;

    h1 {
      font-size: 24px;
      color: #fff;
      margin: 16px 0 8px;
    }

    p {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.8);
    }
  }

  .features {
    .feature-item {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #fff;
      padding: 12px 24px;
      margin-bottom: 8px;
      border-radius: var(--radius-md);
      background: rgba(255, 255, 255, 0.1);

      .el-icon {
        font-size: 20px;
      }
    }
  }
}

.login-right {
  flex: 1;
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-form-container {
  width: 100%;
  max-width: 340px;

  h2 {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .subtitle {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 32px;
  }

  .form-options {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .login-btn {
    width: 100%;
    height: 44px;
  }

  .register-link {
    text-align: center;
    margin-top: 24px;
    font-size: 14px;
    color: var(--text-secondary);

    a {
      color: var(--primary-color);
      font-weight: 500;
    }
  }
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
    width: 100%;
    margin: 16px;
  }

  .login-left {
    padding: 32px;
  }

  .login-right {
    padding: 32px;
  }
}
</style>
