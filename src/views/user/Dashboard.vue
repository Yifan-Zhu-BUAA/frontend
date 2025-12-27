<template>
  <div class="dashboard-page">
    <div class="dashboard-container" v-loading="loading">
      <!-- 欢迎区域 -->
      <div class="welcome-section">
        <h1 class="welcome-title">欢迎回来，{{ userStore.nickname }}！</h1>
        <p class="welcome-subtitle">这是您的个人学术门户，展示您的学术成就和影响力</p>
      </div>

      <!-- 未认领学者的提示 -->
      <div v-if="!hasAuthor && !loading" class="no-author-tip">
        <el-alert
          title="您还未认领学者身份"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>认领学者身份后，即可在个人门户中查看您的学术成就和影响力数据</p>
            <el-button type="primary" @click="router.push('/user/applications')" style="margin-top: 8px;">
              立即申请认领
            </el-button>
          </template>
        </el-alert>
      </div>

      <!-- 学术概览卡片 -->
      <div class="overview-cards" v-if="hasAuthor">
        <div class="stat-card">
          <div class="stat-icon works">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ authorInfo?.worksCount || 0 }}</div>
            <div class="stat-label">著作数量</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon citations">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(authorInfo?.cited || 0) }}</div>
            <div class="stat-label">总引用数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon h-index">
            <el-icon :size="32"><DataLine /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ authorInfo?.hIndex || 0 }}</div>
            <div class="stat-label">H指数</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon follows">
            <el-icon :size="32"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userStore.userInfo?.fansCount || 0 }}</div>
            <div class="stat-label">粉丝数</div>
          </div>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="charts-section" v-if="hasAuthor">
        <!-- 引用趋势 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>引用趋势</h3>
            <el-button text type="primary" @click="router.push('/user/achievements')">
              查看详情 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div ref="citationChartRef" class="chart-container"></div>
        </div>

        <!-- 研究领域分布 - 饼图 -->
        <div class="chart-card">
          <div class="card-header">
            <h3>研究领域分布</h3>
            <el-button text type="primary" @click="router.push('/user/achievements')">
              查看详情 <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          <div ref="fieldChartRef" class="chart-container"></div>
        </div>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-access">
        <h2 class="section-title">快捷入口</h2>
        <div class="quick-cards">
          <div class="quick-card" @click="router.push('/user/achievements/works')">
            <div class="quick-icon">
              <el-icon :size="28"><Document /></el-icon>
            </div>
            <div class="quick-content">
              <h4>我的著作</h4>
              <p>查看和管理您的学术著作</p>
            </div>
          </div>

          <div class="quick-card" @click="router.push('/user/achievements/patents')">
            <div class="quick-icon">
              <el-icon :size="28"><Medal /></el-icon>
            </div>
            <div class="quick-content">
              <h4>我的专利</h4>
              <p>查看您的专利成果</p>
            </div>
          </div>

          <div class="quick-card" @click="router.push('/user/achievements/awards')">
            <div class="quick-icon">
              <el-icon :size="28"><Trophy /></el-icon>
            </div>
            <div class="quick-content">
              <h4>我的奖项</h4>
              <p>展示获得的学术奖项</p>
            </div>
          </div>

          <div class="quick-card" @click="router.push('/user/achievements/projects')">
            <div class="quick-icon">
              <el-icon :size="28"><Briefcase /></el-icon>
            </div>
            <div class="quick-content">
              <h4>我的项目</h4>
              <p>查看参与的科研项目</p>
            </div>
          </div>

          <div class="quick-card" @click="router.push('/user/collections')">
            <div class="quick-icon">
              <el-icon :size="28"><Star /></el-icon>
            </div>
            <div class="quick-content">
              <h4>我的收藏</h4>
              <p>查看收藏的内容</p>
            </div>
          </div>

          <div class="quick-card" @click="router.push('/user/follows')">
            <div class="quick-icon">
              <el-icon :size="28"><Connection /></el-icon>
            </div>
            <div class="quick-content">
              <h4>我的关注</h4>
              <p>管理关注的学者</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getAuthorById, getCitationTrends, getFieldDistribution } from '@/api/author'
import { getCurrentUser } from '@/api/auth'
import * as echarts from 'echarts'

const router = useRouter()
const userStore = useUserStore()

const citationChartRef = ref(null)
const fieldChartRef = ref(null)
let citationChart = null
let fieldChart = null

// 加载状态
const loading = ref(false)
const hasAuthor = ref(false)

// 学者信息（从API获取）
const authorInfo = ref({
  worksCount: 0,
  cited: 0,
  hIndex: 0,
  fields: '',
  organizationName: ''
})

// 刷新用户信息（获取最新的authorId）
const refreshUserInfo = async () => {
  try {
    console.log('开始刷新用户信息...')
    const res = await getCurrentUser()
    console.log('getCurrentUser返回数据:', res)
    console.log('用户数据:', res.data)
    console.log('authorId:', res.data?.authorId)
    userStore.userInfo = res.data
    localStorage.setItem('userInfo', JSON.stringify(res.data))
  } catch (error) {
    console.error('刷新用户信息失败', error)
  }
}

// 获取学者信息
const fetchAuthorInfo = async () => {
  // 先刷新用户信息，确保获取最新的authorId
  await refreshUserInfo()
  
  const authorId = userStore.userInfo?.authorId
  console.log('fetchAuthorInfo中的authorId:', authorId)
  
  if (!authorId) {
    console.log('authorId不存在，设置hasAuthor为false')
    hasAuthor.value = false
    return
  }
  
  loading.value = true
  try {
    console.log('开始获取学者信息，authorId:', authorId)
    const res = await getAuthorById(authorId)
    console.log('getAuthorById返回数据:', res)
    authorInfo.value = res.data
    hasAuthor.value = true
    
    // 更新图表数据
    updateChartsWithRealData(res.data)
  } catch (error) {
    console.error('获取学者信息失败', error)
    hasAuthor.value = false
  } finally {
    loading.value = false
  }
}

// 使用真实数据更新图表
const updateChartsWithRealData = async (authorData) => {
  const authorId = userStore.userInfo?.authorId
  if (!authorId) return

  console.log('updateChartsWithRealData - citationChart存在:', !!citationChart)
  console.log('updateChartsWithRealData - fieldChart存在:', !!fieldChart)

  // 获取引用趋势数据（单独 try-catch，不影响其他数据加载）
  try {
    const citationRes = await getCitationTrends(authorId)
    console.log('引用趋势数据:', citationRes.data)
    
    if (citationRes.data && citationRes.data.length > 0) {
      const years = citationRes.data.map(item => item.year)
      const citationCounts = citationRes.data.map(item => item.citationCount)
      
      // 如果图表还未初始化，先初始化
      if (!citationChart && citationChartRef.value) {
        initCitationChart()
      }
      
      if (citationChart) {
        console.log('正在更新引用趋势图表...')
        citationChart.setOption({
          xAxis: {
            data: years
          },
          series: [{
            data: citationCounts
          }]
        })
      }
    }
  } catch (error) {
    console.warn('获取引用趋势数据失败，该功能暂不可用', error)
  }

  // 获取研究领域分布数据（单独 try-catch）
  try {
    const fieldRes = await getFieldDistribution(authorId)
    console.log('研究领域分布数据:', fieldRes.data)
    
    if (fieldRes.data && fieldRes.data.length > 0) {
      // 只取前10个研究领域，避免图表过于拥挤
      const topFields = fieldRes.data.slice(0, 10)
      const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#ffecd2', '#a8edea', '#d299c2', '#89f7fe', '#66a6ff']
      
      const fieldData = topFields.map((item, index) => ({
        value: item.workCount,
        name: item.field,
        itemStyle: {
          color: colors[index % colors.length]
        }
      }))
      
      // 如果图表还未初始化，先初始化
      if (!fieldChart && fieldChartRef.value) {
        initFieldChart()
      }
      
      if (fieldChart) {
        console.log('正在更新研究领域图表...')
        fieldChart.setOption({
          series: [{
            data: fieldData
          }]
        })
      }
    }
  } catch (error) {
    console.warn('获取研究领域分布数据失败', error)
  }
}

const formatNumber = (num) => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万'
  }
  return num.toLocaleString()
}

const initCitationChart = () => {
  if (!citationChartRef.value) return

  citationChart = echarts.init(citationChartRef.value)
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLine: {
        lineStyle: {
          color: '#E4E7ED'
        }
      },
      axisLabel: {
        color: '#606266'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#E4E7ED'
        }
      },
      axisLabel: {
        color: '#606266'
      },
      splitLine: {
        lineStyle: {
          color: '#F5F7FA'
        }
      }
    },
    series: [
      {
        name: '引用数',
        type: 'line',
        smooth: true,
        data: [],
        itemStyle: {
          color: '#4A90E2'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(74, 144, 226, 0.3)' },
            { offset: 1, color: 'rgba(74, 144, 226, 0.05)' }
          ])
        }
      }
    ]
  }
  citationChart.setOption(option)
}

const initFieldChart = () => {
  if (!fieldChartRef.value) return

  fieldChart = echarts.init(fieldChartRef.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}篇 ({d}%)'
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20,
      textStyle: {
        color: '#606266',
        fontSize: 12
      }
    },
    series: [
      {
        name: '研究领域',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        labelLine: {
          show: false
        },
        data: []
      }
    ]
  }
  fieldChart.setOption(option)
}

const handleResize = () => {
  citationChart?.resize()
  fieldChart?.resize()
}

onMounted(() => {
  // 延迟初始化图表，确保DOM已渲染
  setTimeout(() => {
    initCitationChart()
    initFieldChart()
    // 图表初始化后再获取学者信息
    fetchAuthorInfo()
  }, 100)

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  citationChart?.dispose()
  fieldChart?.dispose()
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.dashboard-page {
  min-height: calc(100vh - 140px);
  background: var(--bg-color);
}

.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

.welcome-section {
  text-align: center;
  margin-bottom: 40px;

  .welcome-title {
    font-size: 32px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  .welcome-subtitle {
    font-size: 16px;
    color: var(--text-secondary);
  }
}

.no-author-tip {
  margin-bottom: 32px;
  
  :deep(.el-alert) {
    padding: 20px;
    
    .el-alert__description {
      margin-bottom: 12px;
    }
  }
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 32px;

  .stat-card {
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-md);
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.works {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      &.citations {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }

      &.h-index {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        color: white;
      }

      &.follows {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        color: white;
      }
    }

    .stat-content {
      .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 4px;
      }

      .stat-label {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }
  }
}

.charts-section {
  margin-bottom: 32px;

  .chart-card {
    background: var(--bg-white);
    border-radius: var(--radius-lg);
    padding: 24px;
    box-shadow: var(--shadow-sm);

    &.full-width {
      width: 100%;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .chart-container {
      height: 250px;
    }
  }
}

.quick-access {
  margin-bottom: 32px;

  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 20px;
  }

  .quick-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;

    .quick-card {
      background: var(--bg-white);
      border-radius: var(--radius-lg);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      cursor: pointer;
      transition: all 0.3s;
      box-shadow: var(--shadow-sm);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .quick-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        background: var(--primary-lightest);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-color);
        flex-shrink: 0;
      }

      .quick-content {
        h4 {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        p {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-container {
    padding: 20px 16px;
  }

  .welcome-section {
    .welcome-title {
      font-size: 24px;
    }

    .welcome-subtitle {
      font-size: 14px;
    }
  }

  .overview-cards {
    grid-template-columns: 1fr;
  }

  .charts-section {
    grid-template-columns: 1fr;
  }

  .quick-cards {
    grid-template-columns: 1fr;
  }
}
</style>