<template>
  <div class="home-page">
    <!-- Hero 区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">探索学术世界</h1>
        <p class="hero-subtitle">发现优秀学者、前沿研究与学术成果</p>
        <div class="hero-search">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索学者、著作、机构、研究概念..."
            size="large"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
            <template #append>
              <el-button type="primary" size="large" @click="handleSearch">
                搜索
              </el-button>
            </template>
          </el-input>
        </div>
        <div class="hot-keywords">
          <span class="label">热门搜索：</span>
          <el-tag 
            v-for="keyword in hotKeywords" 
            :key="keyword"
            effect="plain"
            class="keyword-tag"
            @click="searchKeyword = keyword; handleSearch()"
          >
            {{ keyword }}
          </el-tag>
        </div>
      </div>
      <div class="hero-bg">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
        <div class="circle circle-3"></div>
      </div>
    </section>

    <!-- 统计数据 -->
    <section class="stats-section">
      <div class="page-container">
        <div class="stats-grid">
          <div class="stat-card" v-for="stat in stats" :key="stat.label">
            <el-icon :size="36"><component :is="stat.icon" /></el-icon>
            <div class="stat-info">
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 快速入口 -->
    <section class="quick-entry-section">
      <div class="page-container">
        <h2 class="section-title">快速入口</h2>
        <div class="entry-grid">
          <div 
            v-for="entry in entries" 
            :key="entry.path"
            class="entry-card"
            @click="router.push(entry.path)"
          >
            <div class="entry-icon" :style="{ background: entry.color }">
              <el-icon :size="32" color="#fff"><component :is="entry.icon" /></el-icon>
            </div>
            <h3>{{ entry.title }}</h3>
            <p>{{ entry.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 热门学者 -->
    <section class="hot-authors-section">
      <div class="page-container">
        <div class="section-header">
          <h2 class="section-title">热门学者</h2>
          <el-button text type="primary" @click="router.push('/authors')">
            查看更多 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="authors-grid" v-loading="loadingAuthors">
          <AuthorCard 
            v-for="author in hotAuthors" 
            :key="author.id"
            :author="author"
          />
        </div>
      </div>
    </section>

    <!-- 最新著作 -->
    <section class="recent-works-section">
      <div class="page-container">
        <div class="section-header">
          <h2 class="section-title">最新著作</h2>
          <el-button text type="primary" @click="router.push('/works')">
            查看更多 <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
        <div class="works-grid" v-loading="loadingWorks">
          <WorkCard 
            v-for="work in recentWorks" 
            :key="work.workId"
            :work="work"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AuthorCard from '@/components/cards/AuthorCard.vue'
import WorkCard from '@/components/cards/WorkCard.vue'
import { getAuthors } from '@/api/author'
import { getWorks } from '@/api/work'

const router = useRouter()

const searchKeyword = ref('')
const hotKeywords = ['人工智能', '机器学习', '深度学习', '计算机视觉', '自然语言处理']

const stats = [
  { icon: 'User', value: '10,000+', label: '学者' },
  { icon: 'Document', value: '50,000+', label: '著作' },
  { icon: 'OfficeBuilding', value: '500+', label: '机构' },
  { icon: 'Connection', value: '1,000+', label: '研究概念' }
]

const entries = [
  { 
    path: '/authors', 
    icon: 'User', 
    title: '学者检索', 
    desc: '查找优秀学者及其研究成果',
    color: 'linear-gradient(135deg, #4A90E2 0%, #3A7BD5 100%)'
  },
  { 
    path: '/works', 
    icon: 'Document', 
    title: '著作检索', 
    desc: '搜索论文、书籍等学术成果',
    color: 'linear-gradient(135deg, #67C23A 0%, #52A630 100%)'
  },
  { 
    path: '/institutions', 
    icon: 'OfficeBuilding', 
    title: '机构检索', 
    desc: '了解各研究机构及其学者',
    color: 'linear-gradient(135deg, #E6A23C 0%, #D4912C 100%)'
  },
  { 
    path: '/concepts', 
    icon: 'Connection', 
    title: '概念图谱', 
    desc: '探索研究领域的知识结构',
    color: 'linear-gradient(135deg, #F56C6C 0%, #E34D4D 100%)'
  }
]

const hotAuthors = ref([])
const recentWorks = ref([])
const loadingAuthors = ref(false)
const loadingWorks = ref(false)

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/search',
      query: { keyword: searchKeyword.value.trim() }
    })
  }
}

const fetchHotAuthors = async () => {
  loadingAuthors.value = true
  try {
    const res = await getAuthors({ page: 1, size: 4 })
    hotAuthors.value = res.data?.list || []
  } catch (error) {
    console.error('获取热门学者失败', error)
  } finally {
    loadingAuthors.value = false
  }
}

const fetchRecentWorks = async () => {
  loadingWorks.value = true
  try {
    const res = await getWorks({ page: 1, size: 6 })
    recentWorks.value = res.data?.list || []
  } catch (error) {
    console.error('获取最新著作失败', error)
  } finally {
    loadingWorks.value = false
  }
}

onMounted(() => {
  fetchHotAuthors()
  fetchRecentWorks()
})
</script>

<style lang="scss" scoped>
.home-page {
  background: var(--bg-color);
}

// Hero 区域
.hero-section {
  position: relative;
  padding: 80px 24px;
  background: linear-gradient(180deg, #E8F4FD 0%, #F5F9FC 100%);
  overflow: hidden;

  .hero-content {
    position: relative;
    z-index: 1;
    max-width: 700px;
    margin: 0 auto;
    text-align: center;
  }

  .hero-title {
    font-size: 48px;
    font-weight: 700;
    background: linear-gradient(135deg, #4A90E2 0%, #2B68C0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 16px;
  }

  .hero-subtitle {
    font-size: 18px;
    color: var(--text-secondary);
    margin-bottom: 32px;
  }

  .hero-search {
    max-width: 600px;
    margin: 0 auto 24px;

    :deep(.el-input-group__append) {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      
      .el-button {
        color: #fff;
      }
    }

    :deep(.el-input__wrapper) {
      box-shadow: var(--shadow-md);
    }
  }

  .hot-keywords {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;

    .label {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .keyword-tag {
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background-color: var(--primary-lightest);
        border-color: var(--primary-color);
        color: var(--primary-color);
      }
    }
  }

  .hero-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;

    .circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.1;
    }

    .circle-1 {
      width: 400px;
      height: 400px;
      background: var(--primary-color);
      top: -100px;
      left: -100px;
    }

    .circle-2 {
      width: 300px;
      height: 300px;
      background: var(--primary-light);
      bottom: -50px;
      right: 10%;
    }

    .circle-3 {
      width: 200px;
      height: 200px;
      background: var(--primary-dark);
      top: 50%;
      right: -50px;
    }
  }
}

// 统计数据
.stats-section {
  margin-top: -40px;
  position: relative;
  z-index: 2;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .stat-card {
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-md);

    .el-icon {
      color: var(--primary-color);
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
      }

      .stat-label {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }
}

// 快速入口
.quick-entry-section {
  padding: 60px 0;

  .entry-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .entry-card {
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    padding: 32px 24px;
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-normal);
    border: 1px solid var(--border-lighter);

    &:hover {
      transform: translateY(-8px);
      box-shadow: var(--shadow-lg);
    }

    .entry-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
    }

    h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 8px;
    }

    p {
      font-size: 14px;
      color: var(--text-secondary);
    }
  }
}

// 热门学者
.hot-authors-section {
  padding: 40px 0;
  background: var(--bg-light);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .authors-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
    min-height: 200px;
  }
}

// 最新著作
.recent-works-section {
  padding: 60px 0;

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .works-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    min-height: 200px;
  }
}

// 响应式
@media (max-width: 1200px) {
  .stats-section .stats-grid,
  .quick-entry-section .entry-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .hot-authors-section .authors-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .recent-works-section .works-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 60px 16px;

    .hero-title {
      font-size: 32px;
    }
  }

  .stats-section .stats-grid,
  .quick-entry-section .entry-grid,
  .hot-authors-section .authors-grid,
  .recent-works-section .works-grid {
    grid-template-columns: 1fr;
  }
}
</style>
