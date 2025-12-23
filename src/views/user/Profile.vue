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
        <el-input v-model="form.fields" type="textarea" :rows="3" placeholder="多个领域用分号分隔" />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="handleSave" :loading="saving">保存修改</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { updateProfile } from '@/api/auth'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const formRef = ref(null)
const saving = ref(false)

const form = reactive({
  nickname: '',
  email: '',
  avatar: '',
  fields: ''
})

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度应在2-20个字符之间', trigger: 'blur' }
  ]
}

const handleAvatarChange = (file) => {
  // 这里可以实现头像上传逻辑
  const reader = new FileReader()
  reader.onload = (e) => {
    form.avatar = e.target.result
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
}
</style>
