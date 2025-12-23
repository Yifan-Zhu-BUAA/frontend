<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <h1>404</h1>
      <p>抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-lightest) 0%, #fff 100%);
}

.not-found-content {
  text-align: center;

  h1 {
    font-size: 120px;
    font-weight: 700;
    color: var(--primary-color);
    line-height: 1;
    margin-bottom: 16px;
    text-shadow: 4px 4px 0 var(--primary-light);
  }

  p {
    font-size: 20px;
    color: var(--text-secondary);
    margin-bottom: 32px;
  }
}
</style>
