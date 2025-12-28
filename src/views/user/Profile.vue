<template>
  <div class="profile-page card">
    <h2 class="page-title">个人资料</h2>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="100px" class="profile-form">
      <el-form-item label="头像">
        <el-upload
          class="avatar-uploader"
          action="#"
          :show-file-list="false"
          :auto-upload="false"
          @change="handleAvatarChange"
        >
          <el-avatar :size="80" :src="form.avatar">
            {{ form.nickname?.charAt(0) }}
          </el-avatar>
          <div class="upload-tip">点击更换头像</div>
        </el-upload>
      </el-form-item>

      <el-form-item label="昵称" prop="nickname">
        <el-input v-model="form.nickname" placeholder="请输入昵称" />
      </el-form-item>

      <el-form-item label="邮箱">
        <el-input v-model="form.email" disabled />
      </el-form-item>

      <el-form-item label="研究领域" prop="fields">
        <div class="fields-tags">
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
            :width="200"
            :show-arrow="false"
          >
            <template #reference>
              <el-input
                ref="inputRef"
                v-model="inputValue"
                class="field-input"
                size="small"
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
          <el-button v-if="!inputVisible" class="add-field-btn" size="small" @click="showInput">
            <el-icon><Plus /></el-icon> 添加领域
          </el-button>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSave" :loading="saving">保存修改</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { updateProfile } from '@/api/auth'
import { getConcepts } from '@/api/concept'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const formRef = ref(null)
const saving = ref(false)

const form = reactive({
  nickname: '',
  email: '',
  avatar: '',
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

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应在2-20个字符之间', trigger: 'blur' }
  ]
}

const handleAvatarChange = (file) => {
  // 压缩图片后转为 Base64
  const maxSize = 200 // 最大宽高 200px
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      // 创建 canvas 压缩图片
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height
      
      // 等比例缩放
      if (width > height && width > maxSize) {
        height = (height * maxSize) / width
        width = maxSize
      } else if (height > maxSize) {
        width = (width * maxSize) / height
        height = maxSize
      }
      
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      
      // 转为 Base64，质量 0.8
      form.avatar = canvas.toDataURL('image/jpeg', 0.8)
    }
    img.src = e.target.result
  }
  reader.readAsDataURL(file.raw)
}

const handleSave = async () => {
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      await updateProfile({
        nickname: form.nickname,
        avatar: form.avatar,
        fields: form.fields
      })
      userStore.updateUserInfo({
        nickname: form.nickname,
        avatar: form.avatar,
        fields: form.fields
      })
      ElMessage.success('保存成功')
    } catch (error) {
      console.error('保存失败', error)
    } finally {
      saving.value = false
    }
  })
}

onMounted(() => {
  const userInfo = userStore.userInfo || {}
  form.nickname = userInfo.nickname || ''
  form.email = userInfo.email || ''
  form.avatar = userInfo.avatar || ''
  form.fields = userInfo.fields || ''
})
</script>

<style lang="scss" scoped>
.profile-page {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-lighter);
  }

  .profile-form {
    max-width: 500px;
  }

  .avatar-uploader {
    cursor: pointer;

    .upload-tip {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 8px;
    }
  }
  
  .fields-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    
    .field-tag {
      margin: 0;
    }
    
    .field-input {
      width: 150px;
    }
    
    .add-field-btn {
      border-style: dashed;
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
</style>
