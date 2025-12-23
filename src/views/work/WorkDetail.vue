<template>
  <div class="work-detail-page page-container" v-loading="loading">
    <!-- 著作基本信息 -->
    <div class="work-info card" v-if="work">
      <div class="work-header">
        <el-tag type="primary" size="large">{{ getTypeLabel(work.type) }}</el-tag>
        <div class="work-actions">
          <el-button @click="handleCollect">
            <el-icon><Star /></el-icon>
            收藏
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
      <h3 class="section-title">评论 ({{ commentsTotal }})</h3>
      
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
          <el-avatar :size="40">{{ comment.userNickname?.charAt(0) }}</el-avatar>
          <div class="comment-content">
            <div class="comment-header">
              <span class="user-name">{{ comment.userNickname }}</span>
              <span class="comment-time">{{ formatDate(comment.commentTime) }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
            <div class="comment-actions">
              <el-button text size="small" @click="handleLike(comment)">
                <el-icon><CaretTop /></el-icon>
                {{ comment.likes || 0 }}
              </el-button>
              <el-button text size="small">
                <el-icon><ChatLineRound /></el-icon>
                回复 ({{ comment.replyCount || 0 }})
              </el-button>
            </div>
          </div>
        </div>
        <el-empty v-if="!comments.length" description="暂无评论" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getWorkById, getWorkReferences, getWorkCitedBy, getWorkRelated } from '@/api/work'
import { getComments, createComment, likeComment } from '@/api/comment'
import { addToCollection, getFavourites } from '@/api/collection'
import { addHistory } from '@/api/collection'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const userStore = useUserStore()

const loading = ref(false)
const work = ref(null)

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
    }
  } catch (error) {
    console.error('获取著作信息失败', error)
  } finally {
    loading.value = false
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
    const res = await getComments(route.params.id, { page: 1, size: 20 })
    comments.value = res.data?.list || []
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

  try {
    // 获取收藏夹列表
    const res = await getFavourites()
    const favourites = res.data || []

    if (!favourites.length) {
      ElMessage.info('请先创建收藏夹')
      return
    }

    // 简单选择第一个收藏夹
    await addToCollection({
      fid: favourites[0].fid,
      achievementId: work.value.workId,
      title: work.value.title,
      authors: work.value.authorNames,
      journal: work.value.journal,
      date: work.value.publishTime
    })
    ElMessage.success('收藏成功')
  } catch (error) {
    console.error('收藏失败', error)
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
    await likeComment(comment.commentId)
    comment.likes = (comment.likes || 0) + 1
  } catch (error) {
    console.error('点赞失败', error)
  }
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

  .comment-form {
    margin-bottom: 24px;

    .el-button {
      margin-top: 12px;
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
        }

        .comment-time {
          font-size: 12px;
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
      }
    }
  }
}
</style>
