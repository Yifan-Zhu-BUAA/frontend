<template>
  <div class="messages-page card">
    <h2 class="page-title">我的消息</h2>

    <!-- Tab 切换 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="系统消息" name="system">
        <div class="messages-list" v-loading="loading">
          <div 
            class="message-item" 
            :class="{ unread: !msg.read }"
            v-for="msg in messages" 
            :key="msg.id"
            @click="handleRead(msg)"
          >
            <div class="msg-icon">
              <el-icon :size="24"><Bell /></el-icon>
            </div>
            <div class="msg-content">
              <h4>{{ msg.title }}</h4>
              <p>{{ msg.content }}</p>
              <span class="msg-time">{{ formatDate(msg.time) }}</span>
            </div>
            <el-tag v-if="!msg.read" type="danger" size="small">未读</el-tag>
          </div>
          <el-empty v-if="!messages.length" description="暂无系统消息" />

          <div class="pagination-wrapper" v-if="total > size">
            <el-pagination
              v-model:current-page="page"
              :page-size="size"
              :total="total"
              layout="prev, pager, next"
              background
              @current-change="fetchMessages"
            />
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="私信" name="private">
        <div class="private-messages" v-loading="privateLoading">
          <div 
            class="conversation-item"
            v-for="conv in conversations" 
            :key="conv.userId"
            @click="openChat(conv.userId)"
          >
            <el-avatar :size="48" :src="conv.avatar">
              {{ conv.nickname?.charAt(0) }}
            </el-avatar>
            <div class="conv-content">
              <div class="conv-header">
                <span class="nickname">{{ conv.nickname }}</span>
                <span class="time">{{ formatDate(conv.lastMessageTime) }}</span>
              </div>
              <p class="last-message">{{ conv.lastMessage }}</p>
            </div>
            <el-badge :value="conv.unreadCount" v-if="conv.unreadCount > 0" />
          </div>
          <el-empty v-if="!conversations.length" description="暂无私信">
            <el-button type="primary" @click="$router.push('/chat')">开始聊天</el-button>
          </el-empty>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMessages, markMessageRead } from '@/api/message'
import { getConversations } from '@/api/privateMessage'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const privateLoading = ref(false)
const activeTab = ref('system')

const messages = ref([])
const conversations = ref([])
const total = ref(0)
const page = ref(1)
const size = 20

const fetchMessages = async () => {
  loading.value = true
  try {
    const res = await getMessages({ page: page.value, size })
    messages.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error) {
    console.error('获取消息失败', error)
  } finally {
    loading.value = false
  }
}

const fetchConversations = async () => {
  privateLoading.value = true
  try {
    const res = await getConversations()
    conversations.value = res.data || []
  } catch (error) {
    console.error('获取私信列表失败', error)
  } finally {
    privateLoading.value = false
  }
}

const handleTabChange = (tab) => {
  if (tab === 'private' && conversations.value.length === 0) {
    fetchConversations()
  }
}

const handleRead = async (msg) => {
  if (msg.read) return
  try {
    await markMessageRead(msg.id)
    msg.read = true
  } catch (error) {
    console.error('标记已读失败', error)
  }
}

const openChat = (userId) => {
  router.push(`/chat/${userId}`)
}

const formatDate = (date) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'

onMounted(() => { fetchMessages() })
</script>

<style lang="scss" scoped>
.messages-page {
  .page-title {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 24px;
  }

  .messages-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .message-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    background: var(--bg-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: var(--primary-lightest);
    }

    &.unread {
      background: #fff;
      border-left: 3px solid var(--primary-color);
    }

    .msg-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--primary-lightest);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-color);
    }

    .msg-content {
      flex: 1;

      h4 { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
      p { font-size: 14px; color: var(--text-regular); margin-bottom: 4px; }
      .msg-time { font-size: 12px; color: var(--text-placeholder); }
    }
  }

  // 私信对话列表样式
  .private-messages {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .conversation-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--bg-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: var(--primary-lightest);
    }

    .conv-content {
      flex: 1;
      min-width: 0;

      .conv-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 4px;

        .nickname {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .time {
          font-size: 12px;
          color: var(--text-placeholder);
        }
      }

      .last-message {
        font-size: 14px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin: 0;
      }
    }
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 24px;
  }
}
</style>
