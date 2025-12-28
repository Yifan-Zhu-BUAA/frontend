<template>
  <div class="author-detail-page page-container" v-loading="loading">
    <!-- 学者基本信息 -->
    <div class="author-profile card" v-if="author">
      <div class="profile-header">
        <el-avatar :size="100" :src="author.avatar">
          {{ author.name?.charAt(0) }}
        </el-avatar>
        <div class="profile-info">
          <h1 class="author-name">{{ author.name }}</h1>
          <p class="author-org" v-if="author.organizationName">
            <el-icon><OfficeBuilding /></el-icon>
            <router-link v-if="author.organizationId" :to="`/institutions/${author.organizationId}`">
              {{ author.organizationName }}
            </router-link>
            <span v-else>{{ author.organizationName }}</span>
          </p>
          <p class="author-email" v-if="author.email">
            <el-icon><Message /></el-icon>
            {{ author.email }}
          </p>
          <p class="author-orcid" v-if="author.orcid">
            <el-icon><Link /></el-icon>
            ORCID: {{ author.orcid }}
          </p>
        </div>
        <div class="profile-actions">
          <el-button v-if="!isFollowed" type="primary" @click="handleFollow">
            <el-icon><Plus /></el-icon>
            关注
          </el-button>
          <el-button v-else type="info" plain @click="handleUnfollow">
            <el-icon><Check /></el-icon>
            已关注
          </el-button>
          <el-button v-if="author && (author.uid || author.userId)" type="default" @click="goToUserPage" style="margin-left: 12px;">
            前往用户页
          </el-button>
        </div>
      </div>

      <div class="profile-fields" v-if="formatFields(author.fields)">
        <h4>研究领域</h4>
        <div class="fields-list">
          <el-tag v-for="field in parseFields(author.fields)" :key="field">
            {{ field }}
          </el-tag>
        </div>
      </div>

      <div class="profile-stats">
        <div class="stat-item">
          <span class="stat-value">{{ author.hIndex || author.hindex || 0 }}</span>
          <span class="stat-label">H指数</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ author.worksCount || 0 }}</span>
          <span class="stat-label">著作数量</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">{{ formatNumber(author.cited) }}</span>
          <span class="stat-label">总引用数</span>
        </div>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="author-tabs card" v-if="author">
      <el-tabs v-model="activeTab">
        <!-- 著作 -->
        <el-tab-pane label="著作" name="works">
          <template #label>
            <span><el-icon><Document /></el-icon> 著作 ({{ worksTotal }})</span>
          </template>
          <div class="tab-content" v-loading="tabLoading">
            <div class="works-list" v-if="works.length">
              <WorkCard v-for="work in works" :key="work.workId" :work="work" />
            </div>
            <el-empty v-else description="暂无著作" />
            <el-pagination
              v-if="worksTotal > 10"
              v-model:current-page="worksPage"
              :page-size="10"
              :total="worksTotal"
              layout="total, prev, pager, next, jumper"
              background
              @current-change="fetchWorks"
            />
          </div>
        </el-tab-pane>

        <!-- 合著者 -->
        <el-tab-pane label="合著者" name="coauthors">
          <template #label>
            <span><el-icon><Connection /></el-icon> 合著者 ({{ coauthorsTotal }})</span>
          </template>
          <div class="tab-content" v-loading="tabLoading">
            <div class="coauthors-list" v-if="coauthors.length">
              <div 
                class="coauthor-item card" 
                v-for="coauthor in coauthors" 
                :key="coauthor.coauthorId"
                @click="goToAuthor(coauthor.coauthorId)"
              >
                <el-avatar :size="48">{{ coauthor.name?.charAt(0) }}</el-avatar>
                <div class="coauthor-info">
                  <h4>{{ coauthor.name }}</h4>
                  <p>{{ coauthor.organizationName || '暂无机构信息' }}</p>
                </div>
                <div class="coauthor-count">
                  <span class="count">{{ coauthor.count }}</span>
                  <span class="label">次合作</span>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无合著者" />
            <el-pagination
              v-if="coauthorsTotal > 12"
              v-model:current-page="coauthorsPage"
              :page-size="12"
              :total="coauthorsTotal"
              layout="total, prev, pager, next, jumper"
              background
              @current-change="fetchCoauthors"
            />
          </div>
        </el-tab-pane>

        <!-- 专利 -->
        <el-tab-pane label="专利" name="patents">
          <template #label>
            <span><el-icon><Medal /></el-icon> 专利</span>
          </template>
          <div class="tab-content" v-loading="tabLoading">
            <div class="patents-list" v-if="patents.length">
              <div class="patent-item card" v-for="patent in patents" :key="patent.id">
                <h4>{{ patent.name }}</h4>
                <p><span class="label">申请号：</span>{{ patent.applicationNumber }}</p>
                <p><span class="label">申请人：</span>{{ patent.applicant }}</p>
                <el-tag :type="getPatentStatusType(patent.status)">{{ patent.status }}</el-tag>
              </div>
            </div>
            <el-empty v-else description="暂无专利" />
          </div>
        </el-tab-pane>

        <!-- 奖项 -->
        <el-tab-pane label="奖项" name="awards">
          <template #label>
            <span><el-icon><Trophy /></el-icon> 奖项</span>
          </template>
          <div class="tab-content" v-loading="tabLoading">
            <div class="awards-list" v-if="awards.length">
              <div class="award-item card" v-for="award in awards" :key="award.id">
                <h4>{{ award.title }}</h4>
                <p><span class="label">颁发机构：</span>{{ award.issuer }}</p>
                <p><span class="label">颁发日期：</span>{{ formatDate(award.awardDate) }}</p>
              </div>
            </div>
            <el-empty v-else description="暂无奖项" />
          </div>
        </el-tab-pane>

        <!-- 项目 -->
        <el-tab-pane label="项目" name="projects">
          <template #label>
            <span><el-icon><Briefcase /></el-icon> 项目</span>
          </template>
          <div class="tab-content" v-loading="tabLoading">
            <div class="projects-list" v-if="projects.length">
              <div class="project-item card" v-for="project in projects" :key="project.id">
                <h4>{{ project.projectName }}</h4>
                <p><span class="label">主持人：</span>{{ project.host }}</p>
                <p><span class="label">资助机构：</span>{{ project.fundingAgency }}</p>
                <p><span class="label">时间：</span>{{ formatDate(project.startDate) }} - {{ formatDate(project.endDate) }}</p>
              </div>
            </div>
            <el-empty v-else description="暂无项目" />
          </div>
        </el-tab-pane>

        <!-- 相似学者 -->
        <el-tab-pane label="相似学者" name="similar">
          <template #label>
            <span><el-icon><UserFilled /></el-icon> 相似学者</span>
          </template>
          <div class="tab-content" v-loading="similarLoading">
            <div class="similar-authors-list" v-if="similarAuthors.length">
              <div 
                class="similar-author-item card" 
                v-for="similar in similarAuthors" 
                :key="similar.id"
                @click="goToAuthor(similar.id)"
              >
                <el-avatar :size="48">{{ similar.name?.charAt(0) }}</el-avatar>
                <div class="similar-author-info">
                  <h4>{{ similar.name }}</h4>
                  <p class="org">{{ similar.organizationName || '暂无机构信息' }}</p>
                  <div class="stats">
                    <span><el-icon><Document /></el-icon> {{ similar.worksCount || 0 }} 著作</span>
                    <span><el-icon><Reading /></el-icon> {{ formatNumber(similar.cited) }} 引用</span>
                    <span class="h-index">H: {{ similar.hIndex || similar.hindex || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无相似学者推荐" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 专家合作关系网络图 -->
    <AuthorNetwork 
      v-if="author && coauthors.length > 0"
      :centerAuthor="author"
      :coauthors="coauthors"
    />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WorkCard from '@/components/cards/WorkCard.vue'
import AuthorNetwork from '@/components/AuthorNetwork.vue'
import { 
  getAuthorById, 
  getAuthorWorks, 
  getAuthorCoauthors,
  getAuthorPatents,
  getAuthorAwards,
  getAuthorProjects,
  getRecommendedAuthors
} from '@/api/author'
import { follow, unfollow, checkFollowStatus, getMyFollows } from '@/api/follow'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const isFollowed = ref(false)
const followId = ref(null)

const loading = ref(false)
const tabLoading = ref(false)
const author = ref(null)
const activeTab = ref('works')

const works = ref([])
const worksPage = ref(1)
const worksTotal = ref(0)

const coauthors = ref([])
const coauthorsPage = ref(1)
const coauthorsTotal = ref(0)

const patents = ref([])
const awards = ref([])
const projects = ref([])

// 相似学者
const similarAuthors = ref([])
const similarLoading = ref(false)

const fetchAuthor = async () => {
  loading.value = true
  try {
    const res = await getAuthorById(route.params.id)
    author.value = res.data
    // 检查关注状态
    await checkFollow()
  } catch (error) {
    console.error('获取学者信息失败', error)
  } finally {
    loading.value = false
  }
}

const fetchWorks = async () => {
  tabLoading.value = true
  try {
    const res = await getAuthorWorks(route.params.id, { page: worksPage.value, size: 10 })
    works.value = res.data?.list || []
    worksTotal.value = res.data?.total || 0
  } catch (error) {
    console.error('获取著作失败', error)
  } finally {
    tabLoading.value = false
  }
}

const checkFollow = async () => {
  try {
    const res = await checkFollowStatus(route.params.id)
    console.log('检查关注状态响应:', res)
    isFollowed.value = res.data?.isFollowed || false
    // 如果已关注，获取followId
    if (isFollowed.value) {
      const followsRes = await getMyFollows({ page: 0, size: 100 })
      console.log('获取关注列表响应:', followsRes)
      const followList = followsRes.data?.follows || []
      // 使用 authorId 匹配
      const currentFollow = followList.find(f => f.authorId === route.params.id)
      console.log('当前作者ID:', route.params.id, '匹配到的关注:', currentFollow)
      if (currentFollow) {
        followId.value = currentFollow.id
      }
    }
  } catch (error) {
    console.error('检查关注状态失败', error)
  }
}

const fetchCoauthors = async () => {
  tabLoading.value = true
  try {
    // 获取更多合著者用于关系网络图（最多20个）
    const res = await getAuthorCoauthors(route.params.id, { page: coauthorsPage.value, size: 20 })
    coauthors.value = res.data?.list || []
    coauthorsTotal.value = res.data?.total || 0
  } catch (error) {
    console.error('获取合著者失败', error)
  } finally {
    tabLoading.value = false
  }
}

const fetchPatents = async () => {
  tabLoading.value = true
  try {
    const res = await getAuthorPatents(route.params.id, { page: 1, size: 20 })
    patents.value = res.data?.list || []
  } catch (error) {
    console.error('获取专利失败', error)
  } finally {
    tabLoading.value = false
  }
}

const fetchAwards = async () => {
  tabLoading.value = true
  try {
    const res = await getAuthorAwards(route.params.id, { page: 1, size: 20 })
    awards.value = res.data?.list || []
  } catch (error) {
    console.error('获取奖项失败', error)
  } finally {
    tabLoading.value = false
  }
}

const fetchProjects = async () => {
  tabLoading.value = true
  try {
    const res = await getAuthorProjects(route.params.id, { page: 1, size: 20 })
    projects.value = res.data?.list || []
  } catch (error) {
    console.error('获取项目失败', error)
  } finally {
    tabLoading.value = false
  }
}

// 获取相似学者推荐
const fetchSimilarAuthors = async () => {
  similarLoading.value = true
  try {
    const res = await getRecommendedAuthors(route.params.id, 12)
    similarAuthors.value = res.data || []
  } catch (error) {
    console.error('获取相似学者失败', error)
  } finally {
    similarLoading.value = false
  }
}

const handleFollow = async () => {
  try {
    await follow({ 
      idTo: route.params.id, 
      type: 'author',
      authorName: author.value?.name,
      authorInst: author.value?.organizationName
    })
    ElMessage.success('关注成功')
    isFollowed.value = true
    await checkFollow()
  } catch (error) {
    console.error('关注失败', error)
    ElMessage.error('关注失败')
  }
}

const handleUnfollow = async () => {
  try {
    if (!followId.value) {
      // 如果没有followId，先获取
      await checkFollow()
    }
    if (followId.value) {
      await unfollow(followId.value)
      ElMessage.success('已取消关注')
      isFollowed.value = false
      followId.value = null
    }
  } catch (error) {
    console.error('取消关注失败', error)
    ElMessage.error('取消关注失败')
  }
}

const formatFields = (fields) => {
  if (!fields) return ''
  if (typeof fields === 'string') return fields
  if (Array.isArray(fields)) return fields.map(f => f.name || f).join('; ')
  return ''
}

const parseFields = (fields) => {
  if (!fields) return []
  if (typeof fields === 'string') return fields.split(/[;；,，]/).map(s => s.trim()).filter(Boolean)
  if (Array.isArray(fields)) return fields.map(f => f.name || f)
  return []
}

const formatNumber = (num) => {
  if (!num) return 0
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num
}

const formatDate = (date) => {
  if (!date) return '未知'
  return dayjs(date).format('YYYY-MM-DD')
}

const getPatentStatusType = (status) => {
  if (status === '授权') return 'success'
  if (status === '申请中') return 'warning'
  return 'info'
}

watch(activeTab, (tab) => {
  switch (tab) {
    case 'works':
      if (!works.value.length && worksTotal.value > 0) fetchWorks()
      break
    case 'coauthors':
      if (!coauthors.value.length && coauthorsTotal.value > 0) fetchCoauthors()
      break
    case 'patents':
      if (!patents.value.length) fetchPatents()
      break
    case 'awards':
      if (!awards.value.length) fetchAwards()
      break
    case 'projects':
      if (!projects.value.length) fetchProjects()
      break
    case 'similar':
      if (!similarAuthors.value.length) fetchSimilarAuthors()
      break
  }
})

// 跳转到学者页面并刷新数据
const goToAuthor = (authorId) => {
  if (authorId === route.params.id) return
  router.push(`/authors/${authorId}`)
}

// 跳转到用户页面（放在 script setup 内，兼容 uid 或 userId）
const goToUserPage = () => {
  if (author.value && (author.value.uid || author.value.userId)) {
    const uid = author.value.uid || author.value.userId
    router.push(`/user/${uid}`)
  } else {
    // 后端未返回关联用户 id 时提示
    ElMessage.warning('当前学者未绑定用户或用户ID不可用')
  }
}

// 监听路由参数变化，重新加载数据
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    // 重置所有数据
    author.value = null
    works.value = []
    worksPage.value = 1
    worksTotal.value = 0
    coauthors.value = []
    coauthorsPage.value = 1
    coauthorsTotal.value = 0
    patents.value = []
    awards.value = []
    projects.value = []
    similarAuthors.value = []
    activeTab.value = 'works'
    
    // 重新加载数据
    fetchAuthor()
    fetchWorks()
    fetchCoauthors()
  }
})

onMounted(() => {
  fetchAuthor()
  // 同时获取著作和合著者数据，确保 Tab 标签显示正确的总数
  fetchWorks()
  fetchCoauthors()
})
</script>

<style lang="scss" scoped>
.author-detail-page {
  padding-top: 32px;
  padding-bottom: 48px;
}

.author-profile {
  margin-bottom: 24px;

  .profile-header {
    display: flex;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 24px;

    .profile-info {
      flex: 1;

      .author-name {
        font-size: 28px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 12px;
      }

      p {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;

        .el-icon {
          color: var(--primary-color);
        }

        a {
          color: var(--primary-color);
        }
      }
    }
  }

  .profile-fields {
    margin-bottom: 24px;

    h4 {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 12px;
    }

    .fields-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .profile-stats {
    display: flex;
    gap: 48px;
    padding-top: 24px;
    border-top: 1px solid var(--border-lighter);

    .stat-item {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 32px;
        font-weight: 600;
        color: var(--primary-color);
      }

      .stat-label {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }
}

.author-tabs {
  :deep(.el-tabs__item) {
    .el-icon {
      margin-right: 4px;
    }
  }

  .tab-content {
    min-height: 300px;
  }

  .works-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }

  .coauthors-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .coauthor-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    cursor: pointer;

    .coauthor-info {
      flex: 1;

      h4 {
        font-size: 15px;
        font-weight: 500;
        color: var(--text-primary);
      }

      p {
        font-size: 13px;
        color: var(--text-secondary);
      }
    }

    .coauthor-count {
      text-align: center;

      .count {
        display: block;
        font-size: 20px;
        font-weight: 600;
        color: var(--primary-color);
      }

      .label {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
  }

  .patents-list,
  .awards-list,
  .projects-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .patent-item,
  .award-item,
  .project-item {
    padding: 16px;

    h4 {
      font-size: 16px;
      font-weight: 500;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    p {
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 4px;

      .label {
        color: var(--text-regular);
      }
    }
  }

  // 相似学者列表样式
  .similar-authors-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .similar-author-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .similar-author-info {
      flex: 1;
      min-width: 0;

      h4 {
        font-size: 15px;
        font-weight: 500;
        color: var(--text-primary);
        margin-bottom: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .org {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 8px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .stats {
        display: flex;
        gap: 12px;
        font-size: 12px;
        color: var(--text-regular);

        span {
          display: flex;
          align-items: center;
          gap: 4px;

          .el-icon {
            font-size: 14px;
          }
        }

        .h-index {
          font-weight: 600;
          color: var(--primary-color);
        }
      }
    }
  }
}

@media (max-width: 1200px) {
  .author-tabs .works-list,
  .author-tabs .patents-list,
  .author-tabs .awards-list,
  .author-tabs .projects-list {
    grid-template-columns: 1fr;
  }

  .author-tabs .coauthors-list,
  .author-tabs .similar-authors-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .profile-stats {
    justify-content: center;
  }

  .author-tabs .coauthors-list,
  .author-tabs .similar-authors-list {
    grid-template-columns: 1fr;
  }
}
</style>
