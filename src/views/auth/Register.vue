<template>
  <div class="register-page">
    <div class="register-container">
      <div class="register-left">
        <div class="brand">
          <el-icon :size="48" color="#fff"><Reading /></el-icon>
          <h1>学术成果分享平台</h1>
          <p>加入我们，开启学术之旅</p>
        </div>
        <div class="features">
          <div class="feature-item">
            <el-icon><User /></el-icon>
            <span>创建个人学术档案</span>
          </div>
          <div class="feature-item">
            <el-icon><Star /></el-icon>
            <span>收藏感兴趣的成果</span>
          </div>
          <div class="feature-item">
            <el-icon><Connection /></el-icon>
            <span>关注学术动态</span>
          </div>
        </div>
      </div>

      <div class="register-right">
        <div class="register-form-container">
          <h2>创建账户</h2>
          <p class="subtitle">填写信息完成注册</p>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            size="large"
            @submit.prevent="handleRegister"
          >
            <el-form-item prop="email">
              <el-input
                v-model="form.email"
                placeholder="请输入邮箱"
                prefix-icon="Message"
              />
            </el-form-item>

            <el-form-item prop="nickname">
              <el-input
                v-model="form.nickname"
                placeholder="请输入昵称"
                prefix-icon="User"
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

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="form.confirmPassword"
                type="password"
                placeholder="请确认密码"
                prefix-icon="Lock"
                show-password
              />
            </el-form-item>

            <el-form-item prop="fields">
              <div class="fields-section">
                <div class="fields-label">研究领域（可选）</div>
                <div class="fields-tags-wrapper">
                  <el-tag
                    v-for="(field, index) in fieldsList"
                    :key="index"
                    closable
                    @close="handleRemoveField(index)"
                    class="field-tag"
                  >
                    {{ field }}
                  </el-tag>
                  <el-popover
                    v-if="inputVisible"
                    :visible="showSuggestions && suggestions.length > 0"
                    placement="bottom-start"
                    :width="220"
                    :show-arrow="false"
                  >
                    <template #reference>
                      <el-input
                        ref="inputRef"
                        v-model="inputValue"
                        class="field-input"
                        size="default"
                        @input="handleSearchFields"
                        @keyup.enter="handleInputConfirm"
                        @blur="handleInputBlur"
                        placeholder="输入搜索或创建"
                      />
                    </template>
                    <div class="suggestions-list">
                      <div
                        v-for="item in suggestions"
                        :key="item.conceptId"
                        class="suggestion-item"
                        @mousedown.prevent="selectSuggestion(item)"
                      >
                        {{ item.name }}
                      </div>
                    </div>
                  </el-popover>
                  <el-button v-if="!inputVisible" class="add-field-btn" @click="showInput">
                    <el-icon><Plus /></el-icon> 添加
                  </el-button>
                </div>
              </div>
            </el-form-item>

            <el-form-item>
              <el-button
                type="primary"
                :loading="loading"
                class="register-btn"
                @click="handleRegister"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>

          <div class="login-link">
            已有账户？
            <router-link to="/login">立即登录</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '@/api/auth'
import { getConcepts } from '@/api/concept'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const router = useRouter()

const formRef = ref(null)
const loading = ref(false)

const form = reactive({
  email: '',
  nickname: '',
  password: '',
  confirmPassword: '',
  fields: ''
})

// 研究领域标签相关
const inputVisible = ref(false)
const inputValue = ref('')
const inputRef = ref(null)
const suggestions = ref([])
const showSuggestions = ref(false)
let searchTimeout = null

// 将 fields 字符串转换为数组
const fieldsList = computed(() => {
  if (!form.fields) return []
  return form.fields.split(/[;；]/).map(s => s.trim()).filter(Boolean)
})

// 显示输入框
const showInput = () => {
  inputVisible.value = true
  suggestions.value = []
  nextTick(() => {
    inputRef.value?.focus()
  })
}

// 搜索研究领域
const handleSearchFields = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  
  if (!inputValue.value.trim()) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const res = await getConcepts({ keyword: inputValue.value, page: 1, size: 30 })
      const data = res.data?.data || res.data
      let items = data?.list || data?.items || []
      
      // 按相关性排序
      const query = inputValue.value.toLowerCase()
      items = items.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase()
        const nameB = (b.name || '').toLowerCase()
        
        if (nameA === query && nameB !== query) return -1
        if (nameB === query && nameA !== query) return 1
        
        const aStarts = nameA.startsWith(query)
        const bStarts = nameB.startsWith(query)
        if (aStarts && !bStarts) return -1
        if (bStarts && !aStarts) return 1
        
        return nameA.indexOf(query) - nameB.indexOf(query)
      })
      
      suggestions.value = items.slice(0, 10)
      showSuggestions.value = suggestions.value.length > 0
    } catch (e) {
      suggestions.value = []
      showSuggestions.value = false
    }
  }, 300)
}

// 选择建议
const selectSuggestion = (item) => {
  const newFields = [...fieldsList.value, item.name]
  form.fields = newFields.join(';')
  inputVisible.value = false
  inputValue.value = ''
  suggestions.value = []
  showSuggestions.value = false
}

// 输入框失焦
const handleInputBlur = () => {
  setTimeout(() => {
    if (inputValue.value.trim()) {
      const newFields = [...fieldsList.value, inputValue.value.trim()]
      form.fields = newFields.join(';')
    }
    inputVisible.value = false
    inputValue.value = ''
    suggestions.value = []
    showSuggestions.value = false
  }, 150)
}

// 确认输入
const handleInputConfirm = () => {
  if (inputValue.value.trim()) {
    const newFields = [...fieldsList.value, inputValue.value.trim()]
    form.fields = newFields.join(';')
  }
  inputVisible.value = false
  inputValue.value = ''
  suggestions.value = []
  showSuggestions.value = false
}

// 删除标签
const handleRemoveField = (index) => {
  const newFields = [...fieldsList.value]
  newFields.splice(index, 1)
  form.fields = newFields.join(';')
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应在2-20个字符之间', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleRegister = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      await register({
        email: form.email,
        nickname: form.nickname,
        password: form.password,
        fields: form.fields
      })
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } catch (error) {
      console.error('注册失败', error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #E8F4FD 0%, #F5F9FC 100%);
}

.register-container {
  display: flex;
  width: 900px;
  min-height: 580px;
  background: var(--bg-white);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.register-left {
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

.register-right {
  flex: 1;
  padding: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-form-container {
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

  .register-btn {
    width: 100%;
    height: 44px;
  }

  .login-link {
    text-align: center;
    margin-top: 24px;
    font-size: 14px;
    color: var(--text-secondary);

    a {
      color: var(--primary-color);
      font-weight: 500;
    }
  }
  
  .fields-section {
    width: 100%;
    
    .fields-label {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }
  }
  
  .fields-tags-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    padding: 8px 12px;
    background: var(--bg-light);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-light);
    min-height: 44px;
    width: 100%;
    
    .field-tag {
      margin: 0;
    }
    
    .field-input {
      width: 120px;
      flex-shrink: 0;
    }
    
    .add-field-btn {
      border-style: dashed;
      color: var(--text-secondary);
    }
  }
}

.suggestions-list {
  max-height: 200px;
  overflow-y: auto;
  
  .suggestion-item {
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    font-size: 13px;
    
    &:hover {
      background: var(--primary-lighter);
      color: var(--primary-color);
    }
  }
}

@media (max-width: 768px) {
  .register-container {
    flex-direction: column;
    width: 100%;
    margin: 16px;
  }

  .register-left {
    padding: 32px;
  }

  .register-right {
    padding: 32px;
  }
}
</style>
