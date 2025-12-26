<template>
  <div class="chat-page">
    <div class="chat-container">
      <!-- 对话列表 -->
      <div class="conversations-sidebar card">
        <div class="sidebar-header">
          <h3>私信</h3>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" />
        </div>
        <div class="conversations-list" v-loading="conversationsLoading">
          <div 
            v-for="conv in conversations" 
            :key="conv.userId"
            class="conversation-item"
            :class="{ active: currentUserId === conv.userId }"
            @click="selectConversation(conv.userId)"
          >
            <el-avatar :size="48" :src="conv.avatar">
              {{ conv.nickname?.charAt(0) }}
            </el-avatar>
            <div class="conversation-info">
              <div class="conversation-header">
                <span class="nickname">{{ conv.nickname }}</span>
                <span class="time">{{ formatTime(conv.lastMessageTime) }}</span>
              </div>
              <div class="last-message">
                {{ conv.lastMessage }}
              </div>
            </div>
            <el-badge :value="conv.unreadCount" v-if="conv.unreadCount > 0" />
          </div>
          <el-empty v-if="!conversations.length" description="暂无对话" :image-size="80" />
        </div>
      </div>

      <!-- 聊天窗口 -->
      <div class="chat-window card">
        <template v-if="currentUserId">
          <!-- 聊天头部 -->
          <div class="chat-header">
            <el-avatar :size="40" :src="currentUser?.avatar">
              {{ currentUser?.nickname?.charAt(0) }}
            </el-avatar>
            <span class="chat-title">{{ currentUser?.nickname }}</span>
            <el-button text @click="viewUserProfile">
              <el-icon><User /></el-icon>
              查看资料
            </el-button>
          </div>

          <!-- 消息列表 -->
          <div class="messages-container" ref="messagesContainer" v-loading="messagesLoading">
            <div 
              v-for="msg in messages" 
              :key="msg.messageId"
              class="message-item"
              :class="{ 'is-mine': isMine(msg) }"
            >
              <el-avatar :size="36" :src="getMessageAvatar(msg)">
                {{ getMessageNickname(msg)?.charAt(0) }}
              </el-avatar>
              <div class="message-content">
                <div class="message-info">
                  <span class="nickname">{{ getMessageNickname(msg) }}</span>
                  <span class="time">{{ formatTime(msg.sendTime) }}</span>
                </div>
                <div class="message-text">{{ msg.content }}</div>
              </div>
            </div>
            <el-empty v-if="!messages.length" description="暂无消息" :image-size="100" />
          </div>

          <!-- 输入框 -->
          <div class="chat-input">
            <el-input
              v-model="messageContent"
              type="textarea"
              :rows="3"
              placeholder="输入消息..."
              @keydown.enter.ctrl="sendMessage"
            />
            <el-button type="primary" @click="sendMessage" :loading="sending">
              发送 (Ctrl+Enter)
            </el-button>
          </div>
        </template>
        <el-empty v-else description="选择一个对话开始聊天" :image-size="150" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useMessageStore } from '@/stores/message'
import { getConversations, getConversation, sendPrivateMessage, getUnreadPrivateCount, markPrivateMessageAsRead } from '@/api/privateMessage'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

const conversationsLoading = ref(false)
const messagesLoading = ref(false)
const sending = ref(false)

const conversations = ref([])
const messages = ref([])
const messageContent = ref('')
const currentUserId = ref(null)
const unreadCount = ref(0)
const messagesContainer = ref(null)

const currentUser = computed(() => {
  return conversations.value.find(c => c.userId === currentUserId.value)
})

// 获取对话列表
const fetchConversations = async () => {
  conversationsLoading.value = true
  try {
    const res = await getConversations()
    conversations.value = res.data || []
    
    // 获取未读消息数
    const countRes = await getUnreadPrivateCount()
    unreadCount.value = countRes.data || 0
  } catch (error) {
    console.error('获取对话列表失败', error)
  } finally {
    conversationsLoading.value = false
  }
}

// 选择对话
const selectConversation = async (userId) => {
  currentUserId.value = userId
  await fetchMessages()
}

// 获取消息列表
const fetchMessages = async () => {
  if (!currentUserId.value) return
  
  messagesLoading.value = true
  try {
    const res = await getConversation(currentUserId.value, { page: 1, size: 100 })
    // 处理分页数据，Spring Page 返回的是 content 字段
    const data = res.data?.content || res.data?.list || []
    messages.value = data.reverse()
    
    // 标记未读消息为已读
    await markMessagesAsRead(data)
    
    await nextTick()
    scrollToBottom()
    
    // 更新对话列表和未读数
    fetchConversations()
  } catch (error) {
    console.error('获取消息失败', error)
  } finally {
    messagesLoading.value = false
  }
}

// 标记消息为已读
const markMessagesAsRead = async (messageList) => {
  const currentUid = userStore.userInfo?.uid
  // 找出对方发给我的未读消息
  const unreadMessages = messageList.filter(msg => 
    Number(msg.receiverId) === Number(currentUid) && msg.status === 0
  )
  
  if (unreadMessages.length === 0) return
  
  // 批量标记已读
  for (const msg of unreadMessages) {
    try {
      await markPrivateMessageAsRead(msg.messageId)
    } catch (e) {
      console.error('标记已读失败', e)
    }
  }
  
  // 刷新全局未读消息数量
  await messageStore.refreshUnreadCount()
}

// 发送消息
const sendMessage = async () => {
  if (!messageContent.value.trim()) {
    ElMessage.warning('请输入消息内容')
    return
  }

  sending.value = true
  try {
    await sendPrivateMessage({
      receiverId: currentUserId.value,
      content: messageContent.value.trim()
    })
    
    messageContent.value = ''
    await fetchMessages()
    fetchConversations() // 更新对话列表
  } catch (error) {
    console.error('发送消息失败', error)
    ElMessage.error('发送失败，请重试')
  } finally {
    sending.value = false
  }
}

// 查看用户资料
const viewUserProfile = () => {
  router.push(`/user/${currentUserId.value}`)
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 判断是否是自己发送的消息
const isMine = (msg) => {
  const currentUid = userStore.userInfo?.uid
  // 确保类型一致进行比较
  return Number(msg.senderId) === Number(currentUid)
}

// 获取消息头像
const getMessageAvatar = (msg) => {
  // 如果是自己发的消息，显示自己的头像；否则显示对方头像
  return isMine(msg) ? msg.senderAvatar : msg.senderAvatar
}

// 获取消息昵称
const getMessageNickname = (msg) => {
  // 显示发送者的昵称
  return msg.senderNickname
}

// 格式化时间
const formatTime = (date) => {
  if (!date) return ''
  const now = dayjs()
  const msgTime = dayjs(date)
  
  if (now.diff(msgTime, 'day') === 0) {
    return msgTime.format('HH:mm')
  } else if (now.diff(msgTime, 'day') === 1) {
    return '昨天 ' + msgTime.format('HH:mm')
  } else if (now.diff(msgTime, 'day') < 7) {
    return msgTime.format('ddd HH:mm')
  } else {
    return msgTime.format('MM-DD HH:mm')
  }
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    currentUserId.value = parseInt(newId)
    fetchMessages()
  }
}, { immediate: true })

onMounted(() => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  fetchConversations()
  
  // 如果路由中有userId参数，直接打开该对话
  if (route.params.id) {
    currentUserId.value = parseInt(route.params.id)
    fetchMessages()
  }
})
</script>

<style lang="scss" scoped>
.chat-page {
  height: calc(100vh - 120px);
  padding: 24px;
}

.chat-container {
  display: flex;
  height: 100%;
  gap: 16px;
}

.conversations-sidebar {
  width: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .sidebar-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-lighter);
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .conversations-list {
    flex: 1;
    overflow-y: auto;
  }

  .conversation-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--border-lighter);
    position: relative;

    &:hover {
      background-color: var(--bg-light);
    }

    &.active {
      background-color: var(--primary-light-9);
      border-left: 3px solid var(--primary-color);
    }

    .conversation-info {
      flex: 1;
      min-width: 0;

      .conversation-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 4px;

        .nickname {
          font-weight: 500;
          color: var(--text-primary);
        }

        .time {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }

      .last-message {
        font-size: 13px;
        color: var(--text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.chat-window {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .chat-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-lighter);
    display: flex;
    align-items: center;
    gap: 12px;

    .chat-title {
      flex: 1;
      font-size: 16px;
      font-weight: 500;
    }
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background-color: var(--bg-light);
  }

  .message-item {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;

    &.is-mine {
      flex-direction: row-reverse;

      .message-content {
        align-items: flex-end;

        .message-info {
          flex-direction: row-reverse;
        }

        .message-text {
          background-color: var(--primary-color);
          color: white;
        }
      }
    }

    .message-content {
      max-width: 60%;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .message-info {
        display: flex;
        gap: 8px;
        font-size: 12px;
        color: var(--text-secondary);

        .nickname {
          font-weight: 500;
        }
      }

      .message-text {
        padding: 10px 14px;
        border-radius: 8px;
        background-color: white;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        word-break: break-word;
        line-height: 1.5;
      }
    }
  }

  .chat-input {
    padding: 16px;
    border-top: 1px solid var(--border-lighter);
    background-color: white;

    .el-button {
      margin-top: 8px;
      float: right;
    }
  }
}
</style>
