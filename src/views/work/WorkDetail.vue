<template>
  <div class="work-detail-page page-container" v-loading="loading">
    <!-- 著作基本信息 -->
    <div class="work-info card" v-if="work">
      <div class="work-header">
        <el-tag type="primary" size="large">{{ getTypeLabel(work.type) }}</el-tag>
        <div class="work-actions">
          <el-button @click="handleCollect" :type="isCollected ? 'warning' : 'default'">
            <el-icon><StarFilled v-if="isCollected" /><Star v-else /></el-icon>
            {{ isCollected ? '已收藏' : '收藏' }}
          </el-button>
        </div>
      </div>

      <h1 class="work-title">{{ work.title }}</h1>

      <div class="work-meta">
        <div class="meta-item">
          <el-icon><User /></el-icon>
          <span class="authors">
            <template v-if="work.authors?.length">
              <span 
                v-for="(author, index) in work.authors" 
                :key="author.id"
              >
                <router-link :to="`/authors/${author.id}`">{{ author.name }}</router-link>
                <span v-if="index < work.authors.length - 1">, </span>
              </span>
            </template>
            <span v-else>{{ work.authorNames || '未知作者' }}</span>
          </span>
        </div>
        <div class="meta-item" v-if="work.journal">
          <el-icon><Notebook /></el-icon>
          <span>{{ work.journal }}</span>
        </div>
        <div class="meta-item" v-if="work.publishTime">
          <el-icon><Calendar /></el-icon>
          <span>{{ formatDate(work.publishTime) }}</span>
        </div>
        <div class="meta-item cited">
          <el-icon><DataLine /></el-icon>
          <span>{{ work.cited || 0 }} 次引用</span>
        </div>
      </div>

      <!-- 出版信息 -->
      <div class="publish-info" v-if="work.volume || work.issue || work.pages || work.doi">
        <div class="info-grid">
          <div class="info-item" v-if="work.volume">
            <span class="label">卷号：</span>
            <span class="value">{{ work.volume }}</span>
          </div>
          <div class="info-item" v-if="work.issue">
            <span class="label">期号：</span>
            <span class="value">{{ work.issue }}</span>
          </div>
          <div class="info-item" v-if="work.pages">
            <span class="label">页码：</span>
            <span class="value">{{ work.pages }}</span>
          </div>
          <div class="info-item" v-if="work.doi">
            <span class="label">DOI：</span>
            <a :href="`https://doi.org/${work.doi}`" target="_blank" class="value link">
              {{ work.doi }}
            </a>
          </div>
        </div>
      </div>

      <!-- 摘要 -->
      <div class="work-abstract" v-if="work.abstract">
        <h3>摘要</h3>
        <p>{{ work.abstract }}</p>
      </div>

      <!-- 关键词 -->
      <div class="work-keywords" v-if="work.keywords">
        <h3>关键词</h3>
        <div class="keywords-list">
          <el-tag v-for="keyword in parseKeywords(work.keywords)" :key="keyword">
            {{ keyword }}
          </el-tag>
        </div>
      </div>

      <!-- 研究概念 -->
      <div class="work-concepts" v-if="work.concepts?.length">
        <h3>相关概念</h3>
        <div class="concepts-list">
          <router-link 
            v-for="concept in work.concepts" 
            :key="concept.id"
            :to="`/concepts/${concept.id}`"
            class="concept-tag"
          >
            {{ concept.name }}
          </router-link>
        </div>
      </div>

      <!-- 机构 -->
      <div class="work-institutions" v-if="work.institutions?.length">
        <h3>相关机构</h3>
        <div class="institutions-list">
          <router-link 
            v-for="inst in work.institutions" 
            :key="inst.id"
            :to="`/institutions/${inst.id}`"
            class="institution-tag"
          >
            <el-icon><OfficeBuilding /></el-icon>
            {{ inst.name }}
          </router-link>
        </div>
      </div>
    </div>

    <!-- 引用关系 -->
    <div class="work-references card" v-if="work">
      <el-tabs v-model="refTab">
        <el-tab-pane label="参考文献" name="references">
          <div class="ref-list" v-loading="refLoading">
            <template v-if="references.length">
              <div class="ref-item" v-for="ref in references" :key="ref.workId">
                <router-link :to="`/works/${ref.workId}`" class="ref-title">
                  {{ ref.title }}
                </router-link>
                <p class="ref-meta">{{ ref.authors }} · {{ ref.journal }} · {{ formatDate(ref.publishTime) }}</p>
              </div>
            </template>
            <el-empty v-else description="暂无参考文献" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="被引用" name="citedBy">
          <div class="ref-list" v-loading="refLoading">
            <template v-if="citedBy.length">
              <div class="ref-item" v-for="ref in citedBy" :key="ref.workId">
                <router-link :to="`/works/${ref.workId}`" class="ref-title">
                  {{ ref.title }}
                </router-link>
                <p class="ref-meta">{{ ref.authors }} · {{ ref.journal }} · {{ formatDate(ref.publishTime) }}</p>
              </div>
            </template>
            <el-empty v-else description="暂无被引文献" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="相关著作" name="related">
          <div class="ref-list" v-loading="refLoading">
            <template v-if="relatedWorks.length">
              <div class="ref-item" v-for="ref in relatedWorks" :key="ref.workId">
                <router-link :to="`/works/${ref.workId}`" class="ref-title">
                  {{ ref.title }}
                </router-link>
                <p class="ref-meta">{{ ref.authors }} · {{ ref.journal }} · {{ formatDate(ref.publishTime) }}</p>
              </div>
            </template>
            <el-empty v-else description="暂无相关著作" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 评论区 -->
    <div class="work-comments card" v-if="work">
      <div class="comments-header">
        <h3 class="section-title">评论 ({{ commentsTotal }})</h3>
        <!-- 排序选择器 -->
        <el-select v-model="commentSort" placeholder="排序方式" size="small" @change="handleSortChange">
          <el-option label="按时间排序" value="time" />
          <el-option label="按点赞数排序" value="likes" />
        </el-select>
      </div>
      
      <!-- 发表评论 -->
      <div class="comment-form" v-if="userStore.isLoggedIn">
        <el-input
          v-model="commentContent"
          type="textarea"
          :rows="3"
          placeholder="发表您的评论..."
        />
        <el-button type="primary" @click="submitComment" :loading="submitting">
          发表评论
        </el-button>
      </div>
      <div class="login-tip" v-else>
        <router-link to="/login">登录</router-link> 后发表评论
      </div>

      <!-- 评论列表 -->
      <div class="comments-list" v-loading="commentsLoading">
        <div class="comment-item" v-for="comment in comments" :key="comment.commentId">
          <el-avatar 
            :size="40" 
            class="clickable-avatar"
            @click="viewUserProfile(comment.userId)"
          >
            {{ comment.nickname?.charAt(0) }}
          </el-avatar>
          <div class="comment-content">
            <div class="comment-header">
              <span class="user-name clickable" @click="viewUserProfile(comment.userId)">
                {{ comment.nickname }}
              </span>
              <span class="comment-time">{{ formatDate(comment.commentTime) }}</span>
            </div>
            <!-- 如果是回复其他评论，显示被回复的评论信息 -->
            <div class="parent-comment" v-if="comment.parentCommentId">
              <span class="reply-to">回复 @{{ comment.parentNickname }}：</span>
              <span class="parent-content">{{ truncateText(comment.parentContent, 50) }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
            <div class="comment-actions">
              <el-button 
                text 
                size="small" 
                @click="handleLike(comment)"
                :class="{ 'is-liked': comment.isLiked }"
              >
                <el-icon><CaretTop /></el-icon>
                {{ comment.likes || 0 }}
              </el-button>
              <el-button text size="small" @click="handleReply(comment)">
                <el-icon><ChatLineRound /></el-icon>
                回复
              </el-button>
              <el-button 
                text 
                size="small" 
                @click="toggleReplies(comment)"
                v-if="comment.replyCount > 0"
              >
                <el-icon><ArrowDown v-if="!comment.showReplies" /><ArrowUp v-else /></el-icon>
                {{ comment.showReplies ? '收起回复' : `查看回复 (${comment.replyCount})` }}
              </el-button>
            </div>
            <!-- 回复输入框 -->
            <div class="reply-form" v-if="replyingTo === comment.commentId">
              <el-input
                v-model="replyContent"
                type="textarea"
                :rows="2"
                :placeholder="'回复 ' + comment.nickname + '...'"
              />
              <div class="reply-actions">
                <el-button size="small" @click="cancelReply">取消</el-button>
                <el-button type="primary" size="small" @click="submitReply(comment)" :loading="submittingReply">
                  发送
                </el-button>
              </div>
            </div>
            <!-- 回复列表 -->
            <div class="replies-list" v-if="comment.showReplies && comment.replies?.length">
              <div class="reply-item" v-for="reply in comment.replies" :key="reply.commentId">
                <el-avatar 
                  :size="32" 
                  class="clickable-avatar"
                  @click="viewUserProfile(reply.userId)"
                >
                  {{ reply.nickname?.charAt(0) }}
                </el-avatar>
                <div class="reply-content">
                  <div class="reply-header">
                    <span class="user-name clickable" @click="viewUserProfile(reply.userId)">
                      {{ reply.nickname }}
                    </span>
                    <span class="reply-time">{{ formatDate(reply.commentTime) }}</span>
                  </div>
                  <!-- 如果回复的是其他回复，显示被回复评论信息 -->
                  <div class="parent-comment" v-if="reply.parentCommentId && reply.parentNickname">
                    <span class="reply-to">回复 @{{ reply.parentNickname }}：</span>
                    <span class="parent-content">{{ truncateText(reply.parentContent, 50) }}</span>
                  </div>
                  <p class="reply-text">{{ reply.content }}</p>
                  <div class="reply-actions">
                    <el-button 
                      text 
                      size="small" 
                      @click="handleLike(reply)"
                      :class="{ 'is-liked': reply.isLiked }"
                    >
                      <el-icon><CaretTop /></el-icon>
                      {{ reply.likes || 0 }}
                    </el-button>
                    <el-button text size="small" @click="handleReplyToReply(comment, reply)">
                      <el-icon><ChatLineRound /></el-icon>
                      回复
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-if="!comments.length" description="暂无评论" />
      </div>
    </div>

    <!-- 收藏夹选择对话框 -->
    <el-dialog v-model="showFavDialog" title="管理收藏" width="400px">
      <div class="fav-dialog-hint">选择要收藏到的收藏夹（可多选）</div>
      <el-checkbox-group v-model="selectedFids" class="fav-checkbox-group">
        <el-checkbox 
          v-for="fav in favouritesList" 
          :key="fav.fid" 
          :value="fav.fid"
          class="fav-checkbox-item"
        >
          <span class="fav-name">{{ fav.fName }}</span>
          <span class="fav-count">({{ fav.count || 0 }})</span>
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="showFavDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCollect" :loading="collectLoading">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getWorkById, getWorkReferences, getWorkCitedBy, getWorkRelated } from '@/api/work'
import { getComments, createComment, likeComment, unlikeComment, getCommentReplies } from '@/api/comment'
import { addToCollection, getFavourites, getMyCollections, removeCollectionByWork } from '@/api/collection'
import { addHistory } from '@/api/collection'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const work = ref(null)
const isCollected = ref(false)
const collectedFids = ref([])  // 记录已收藏到的收藏夹ID列表

// 收藏夹选择对话框
const showFavDialog = ref(false)
const favouritesList = ref([])
const selectedFids = ref([])  // 多选的收藏夹ID列表
const originalFids = ref([])  // 记录打开对话框时的原始选择
const collectLoading = ref(false)

const refTab = ref('references')
const refLoading = ref(false)
const references = ref([])
const citedBy = ref([])
const relatedWorks = ref([])

const commentsLoading = ref(false)
const comments = ref([])
const commentsTotal = ref(0)
const commentContent = ref('')
const submitting = ref(false)
// 回复相关
const replyingTo = ref(null)
const replyContent = ref('')
const submittingReply = ref(false)
// 排序相关
const commentSort = ref('time')

const fetchWork = async () => {
  loading.value = true
  try {
    const res = await getWorkById(route.params.id)
    work.value = res.data

    // 记录浏览历史
    if (userStore.isLoggedIn) {
      addHistory({
        workId: work.value.workId,
        title: work.value.title,
        publisher: work.value.journal,
        publishTime: work.value.publishTime
      }).catch(() => {})
      
      // 检查是否已收藏
      checkCollectionStatus()
    }
  } catch (error) {
    console.error('获取著作信息失败', error)
  } finally {
    loading.value = false
  }
}

// 检查该著作是否已被收藏（到哪些收藏夹）
const checkCollectionStatus = async () => {
  try {
    const res = await getMyCollections({ size: 1000 })
    const collections = res.data?.list || []
    // 找出该著作被收藏到的所有收藏夹
    const fids = collections
      .filter(c => c.achievementId === route.params.id)
      .map(c => c.fid)
      .filter(fid => fid != null)
    
    collectedFids.value = fids
    isCollected.value = fids.length > 0
  } catch (error) {
    // 忽略错误，保持默认未收藏状态
  }
}

const fetchReferences = async () => {
  refLoading.value = true
  try {
    const res = await getWorkReferences(route.params.id)
    references.value = res.data?.list || []
  } catch (error) {
    console.error('获取参考文献失败', error)
  } finally {
    refLoading.value = false
  }
}

const fetchCitedBy = async () => {
  refLoading.value = true
  try {
    const res = await getWorkCitedBy(route.params.id)
    citedBy.value = res.data?.list || []
  } catch (error) {
    console.error('获取被引文献失败', error)
  } finally {
    refLoading.value = false
  }
}

const fetchRelated = async () => {
  refLoading.value = true
  try {
    const res = await getWorkRelated(route.params.id)
    relatedWorks.value = res.data?.list || []
  } catch (error) {
    console.error('获取相关著作失败', error)
  } finally {
    refLoading.value = false
  }
}

const fetchComments = async () => {
  commentsLoading.value = true
  try {
    const res = await getComments(route.params.id, { page: 1, size: 20, sort: commentSort.value })
    comments.value = (res.data?.list || []).map(c => ({ ...c, showReplies: false, replies: [] }))
    commentsTotal.value = res.data?.total || 0
  } catch (error) {
    console.error('获取评论失败', error)
  } finally {
    commentsLoading.value = false
  }
}

const handleCollect = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  // 获取收藏夹列表并显示对话框
  try {
    const res = await getFavourites()
    favouritesList.value = res.data || []

    if (!favouritesList.value.length) {
      ElMessage.info('请先创建收藏夹')
      return
    }

    // 设置当前已收藏的收藏夹为选中状态
    selectedFids.value = [...collectedFids.value]
    originalFids.value = [...collectedFids.value]
    showFavDialog.value = true
  } catch (error) {
    console.error('获取收藏夹失败', error)
  }
}

// 确认收藏变更
const confirmCollect = async () => {
  collectLoading.value = true
  try {
    // 计算需要新增的收藏夹
    const toAdd = selectedFids.value.filter(fid => !originalFids.value.includes(fid))
    // 计算需要移除的收藏夹
    const toRemove = originalFids.value.filter(fid => !selectedFids.value.includes(fid))

    // 执行新增
    for (const fid of toAdd) {
      await addToCollection({
        fid,
        achievementId: work.value.workId,
        title: work.value.title,
        authors: work.value.authorNames,
        journal: work.value.journal,
        date: work.value.publishTime
      })
    }

    // 执行移除
    for (const fid of toRemove) {
      await removeCollectionByWork(fid, work.value.workId)
    }

    // 更新状态
    collectedFids.value = [...selectedFids.value]
    isCollected.value = selectedFids.value.length > 0
    showFavDialog.value = false

    if (toAdd.length > 0 && toRemove.length > 0) {
      ElMessage.success('收藏已更新')
    } else if (toAdd.length > 0) {
      ElMessage.success(`已添加到 ${toAdd.length} 个收藏夹`)
    } else if (toRemove.length > 0) {
      ElMessage.success(`已从 ${toRemove.length} 个收藏夹移除`)
    } else {
      showFavDialog.value = false
    }
  } catch (error) {
    console.error('操作失败', error)
    ElMessage.error('操作失败')
  } finally {
    collectLoading.value = false
  }
}

const submitComment = async () => {
  if (!commentContent.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }

  submitting.value = true
  try {
    await createComment({
      achievementId: route.params.id,
      content: commentContent.value.trim()
    })
    ElMessage.success('评论发表成功')
    commentContent.value = ''
    fetchComments()
  } catch (error) {
    console.error('发表评论失败', error)
  } finally {
    submitting.value = false
  }
}

const handleLike = async (comment) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }

  try {
    if (comment.isLiked) {
      // 取消点赞
      await unlikeComment(comment.commentId)
      comment.likes = Math.max(0, (comment.likes || 0) - 1)
      comment.isLiked = false
    } else {
      // 点赞
      await likeComment(comment.commentId)
      comment.likes = (comment.likes || 0) + 1
      comment.isLiked = true
    }
  } catch (error) {
    console.error('操作失败', error)
  }
}

// 排序变化处理
const handleSortChange = () => {
  fetchComments()
}

// 截取文本
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

// 切换显示回复列表
const toggleReplies = async (comment) => {
  if (comment.showReplies) {
    comment.showReplies = false
  } else {
    // 加载回复
    try {
      const res = await getCommentReplies(comment.commentId, { page: 1, size: 50 })
      comment.replies = res.data?.list || []
      comment.showReplies = true
    } catch (error) {
      console.error('获取回复失败', error)
      ElMessage.error('获取回复失败')
    }
  }
}

// 处理回复按钮点击
const handleReply = (comment) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  // 如果点击的是同一个评论，则关闭回复框
  if (replyingTo.value === comment.commentId) {
    replyingTo.value = null
    replyContent.value = ''
  } else {
    replyingTo.value = comment.commentId
    replyContent.value = ''
  }
}

// 取消回复
const cancelReply = () => {
  replyingTo.value = null
  replyContent.value = ''
}

// 提交回复
// 提交回复
const submitReply = async (parentComment) => {
  if (!replyContent.value.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  submittingReply.value = true
  try {
    await createComment({
      achievementId: route.params.id,
      content: replyContent.value.trim(),
      parentCommentId: parentComment.commentId
    })
    ElMessage.success('回复成功')
    replyContent.value = ''
    replyingTo.value = null
    // 更新父评论的回复数
    parentComment.replyCount = (parentComment.replyCount || 0) + 1
    // 如果回复列表已展开，刷新回复列表
    if (parentComment.showReplies) {
      try {
        const res = await getCommentReplies(parentComment.commentId, { page: 1, size: 50 })
        parentComment.replies = res.data?.list || []
      } catch (error) {
        console.error('刷新回复列表失败', error)
      }
    }
  } catch (error) {
    console.error('回复失败', error)
    ElMessage.error('回复失败，请重试')
  } finally {
    submittingReply.value = false
  }
}

// 回复某条回复
const handleReplyToReply = (parentComment, reply) => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  
  // 回复的目标是顶层评论，但要显示被回复的用户名
  replyingTo.value = parentComment.commentId
  replyContent.value = `@${reply.nickname} `
}

// 查看用户资料
const viewUserProfile = (userId) => {
  if (!userId) return
  router.push(`/user/${userId}`)
}

const getTypeLabel = (type) => {
  const types = {
    'paper': '论文',
    'book': '书籍',
    'article': '文章',
    'conference': '会议',
    'journal-article': '期刊论文'
  }
  return types[type] || type || '论文'
}

const formatDate = (date) => {
  if (!date) return '未知'
  return dayjs(date).format('YYYY-MM-DD')
}

const parseKeywords = (keywords) => {
  if (!keywords) return []
  if (typeof keywords === 'string') {
    // 后端返回的格式可能是双重编码的 JSON 字符串
    // 例如: "\"[\\\"Medicine\\\", \\\"AI\\\"]\""
    let parsed = keywords
    try {
      // 尝试解析外层 JSON
      parsed = JSON.parse(keywords)
      // 如果还是字符串，继续解析
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed)
      }
      // 如果是数组，直接返回（清理可能的引号）
      if (Array.isArray(parsed)) {
        return parsed.map(k => k.replace(/^["']|["']$/g, '').trim()).filter(Boolean)
      }
    } catch (e) {
      // JSON 解析失败，按分隔符拆分
    }
    // 按分隔符拆分
    return parsed.toString().split(/[;；,，]/).map(s => s.trim()).filter(Boolean)
  }
  return keywords
}

watch(refTab, (tab) => {
  switch (tab) {
    case 'references':
      if (!references.value.length) fetchReferences()
      break
    case 'citedBy':
      if (!citedBy.value.length) fetchCitedBy()
      break
    case 'related':
      if (!relatedWorks.value.length) fetchRelated()
      break
  }
})

onMounted(() => {
  fetchWork()
  fetchReferences()
  fetchComments()
})
</script>

<style lang="scss" scoped>
.work-detail-page {
  padding-top: 32px;
  padding-bottom: 48px;
}

.work-info {
  margin-bottom: 24px;

  .work-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .work-title {
    font-size: 28px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.4;
    margin-bottom: 16px;
  }

  .work-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border-lighter);

    .meta-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 14px;
      color: var(--text-secondary);

      .el-icon {
        color: var(--primary-color);
      }

      a {
        color: var(--primary-color);
      }

      &.cited {
        color: var(--primary-color);
        font-weight: 500;
      }
    }
  }

  .publish-info {
    margin-bottom: 20px;
    padding: 16px;
    background: var(--bg-light);
    border-radius: var(--radius-md);

    .info-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
    }

    .info-item {
      font-size: 14px;

      .label {
        color: var(--text-secondary);
      }

      .value {
        color: var(--text-primary);

        &.link {
          color: var(--primary-color);
        }
      }
    }
  }

  .work-abstract,
  .work-keywords,
  .work-concepts,
  .work-institutions {
    margin-bottom: 20px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
      color: var(--text-regular);
      line-height: 1.8;
    }
  }

  .keywords-list,
  .concepts-list,
  .institutions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .concept-tag,
  .institution-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: var(--primary-lightest);
    color: var(--primary-color);
    border-radius: 16px;
    font-size: 13px;
    transition: all 0.3s;

    &:hover {
      background: var(--primary-lighter);
    }
  }
}

.work-references {
  margin-bottom: 24px;

  .ref-list {
    min-height: 200px;
  }

  .ref-item {
    padding: 16px 0;
    border-bottom: 1px solid var(--border-lighter);

    &:last-child {
      border-bottom: none;
    }

    .ref-title {
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      display: block;
      margin-bottom: 4px;

      &:hover {
        color: var(--primary-color);
      }
    }

    .ref-meta {
      font-size: 13px;
      color: var(--text-secondary);
    }
  }
}

.work-comments {
  .section-title {
    margin-bottom: 20px;
  }

  .comments-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .section-title {
      margin-bottom: 0;
    }

    .el-select {
      width: 140px;
    }
  }

  .comment-form {
    margin-bottom: 24px;

    .el-button {
      margin-top: 12px;
    }
  }

  .clickable-avatar {
    cursor: pointer;
    transition: opacity 0.2s;

    &:hover {
      opacity: 0.8;
    }
  }

  .login-tip {
    padding: 16px;
    text-align: center;
    background: var(--bg-light);
    border-radius: var(--radius-md);
    margin-bottom: 24px;
    font-size: 14px;
    color: var(--text-secondary);

    a {
      color: var(--primary-color);
      font-weight: 500;
    }
  }

  .comment-item {
    display: flex;
    gap: 12px;
    padding: 16px 0;
    border-bottom: 1px solid var(--border-lighter);

    .comment-content {
      flex: 1;

      .comment-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;

        .user-name {
          font-weight: 500;
          color: var(--text-primary);
          
          &.clickable {
            cursor: pointer;
            
            &:hover {
              color: var(--primary-color);
            }
          }
        }

        .comment-time {
          font-size: 12px;
          color: var(--text-secondary);
        }
      }

      .parent-comment {
        background: var(--bg-light);
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        margin-bottom: 8px;
        font-size: 13px;
        color: var(--text-secondary);
        border-left: 3px solid var(--primary-color);

        .reply-to {
          color: var(--primary-color);
          font-weight: 500;
        }

        .parent-content {
          color: var(--text-secondary);
        }
      }

      .comment-text {
        font-size: 14px;
        color: var(--text-regular);
        line-height: 1.6;
        margin-bottom: 8px;
      }

      .comment-actions {
        display: flex;
        gap: 16px;

        .is-liked {
          color: var(--primary-color);
        }
      }

      .reply-form {
        margin-top: 12px;
        padding: 12px;
        background: var(--bg-light);
        border-radius: var(--radius-md);

        .reply-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 8px;
        }
      }

      .replies-list {
        margin-top: 12px;
        padding-left: 12px;
        border-left: 2px solid var(--border-lighter);

        .reply-item {
          display: flex;
          gap: 10px;
          padding: 10px 0;

          &:not(:last-child) {
            border-bottom: 1px solid var(--border-lighter);
          }

          .reply-content {
            flex: 1;

            .reply-header {
              display: flex;
              align-items: center;
              gap: 10px;
              margin-bottom: 6px;

              .user-name {
                font-weight: 500;
                font-size: 13px;
                color: var(--text-primary);
              }

              .reply-time {
                font-size: 11px;
                color: var(--text-secondary);
              }
            }

            .parent-comment {
              background: var(--bg-light);
              padding: 6px 10px;
              border-radius: var(--radius-sm);
              margin-bottom: 6px;
              font-size: 12px;
              color: var(--text-secondary);
              border-left: 2px solid var(--primary-color);

              .reply-to {
                color: var(--primary-color);
                font-weight: 500;
              }

              .parent-content {
                color: var(--text-secondary);
              }
            }

            .reply-text {
              font-size: 13px;
              color: var(--text-regular);
              line-height: 1.5;
              margin-bottom: 6px;
            }

            .reply-actions {
              display: flex;
              gap: 12px;

              .is-liked {
                color: var(--primary-color);
              }
            }
          }
        }
      }
    }
  }
}

.fav-dialog-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.fav-checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: transparent;
  }

  .fav-checkbox-item {
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color-light);
    transition: all 0.2s;
    margin: 0;
    height: auto;

    &:hover {
      background-color: var(--bg-color-page);
      border-color: var(--color-primary-light-5);
    }

    .fav-name {
      margin-right: 8px;
      font-weight: 500;
    }

    .fav-count {
      color: var(--text-secondary);
      font-size: 12px;
    }
  }
}
</style>
