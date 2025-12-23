<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 检查本地存储的登录状态
onMounted(() => {
  userStore.checkAuth()
})
</script>

<style lang="scss">
#app {
  min-height: 100vh;
  background-color: var(--bg-color);
}
</style>
