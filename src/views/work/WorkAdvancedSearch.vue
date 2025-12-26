<template>
  <div class="advanced-search-page page-container">
    <div class="page-header">
      <h1>
        <el-icon><Search /></el-icon>
        著作高级搜索
      </h1>
      <p class="page-description">通过多个条件组合搜索学术著作，支持标题、摘要、作者、机构等多维度检索</p>
    </div>

    <!-- 搜索条件构建器 -->
    <el-card class="search-builder-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span><el-icon><Filter /></el-icon> 搜索条件</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="addCondition"
            :icon="Plus"
          >
            添加条件
          </el-button>
        </div>
      </template>      <!-- 条件列表 -->
      <div v-if="searchConditions.length === 0" class="empty-conditions">
        <el-empty description="暂无搜索条件，请点击下方按钮添加条件开始构建查询">
          <el-button type="primary" @click="addCondition">添加条件</el-button>
        </el-empty>
      </div>

      <div v-else class="conditions-list">
        <div 
          v-for="(condition, index) in searchConditions" 
          :key="condition.id"
          class="condition-item"
        >
          <!-- 逻辑连接符 -->
          <div v-if="index > 0" class="logic-connector">
            <el-select v-model="condition.logic" size="small" style="width: 80px">
              <el-option label="且" value="AND" />
              <el-option label="或" value="OR" />
            </el-select>
          </div>

          <!-- 条件内容 -->
          <div class="condition-content">
            <!-- NOT 取反 -->
            <el-checkbox v-model="condition.not" class="not-checkbox">
              NOT
            </el-checkbox>

            <!-- 字段选择 -->
            <el-select 
              v-model="condition.field" 
              placeholder="选择字段" 
              size="large"
              style="width: 160px"
              @change="handleFieldChange(condition)"
            >
              <el-option-group label="基本信息">
                <el-option label="标题" value="title" />
                <el-option label="摘要" value="abstract" />
                <el-option label="关键词" value="keywords" />
                <el-option label="DOI" value="doi" />
                <el-option label="期刊" value="journal" />
                <el-option label="类型" value="type" />
              </el-option-group>
              <el-option-group label="作者">
                <el-option label="作者名称" value="authorName" />
                <el-option label="作者ID" value="authorId" />
              </el-option-group>
              <el-option-group label="机构">
                <el-option label="机构名称" value="institutionName" />
                <el-option label="机构ID" value="institutionId" />
              </el-option-group>
              <el-option-group label="概念">
                <el-option label="概念名称" value="conceptName" />
                <el-option label="概念ID" value="conceptId" />
              </el-option-group>
              <el-option-group label="时间与引用">
                <el-option label="发表年份" value="publishYear" />
                <el-option label="被引次数" value="cited" />
              </el-option-group>
            </el-select>

            <!-- 操作符选择 -->
            <el-select 
              v-model="condition.operator" 
              placeholder="操作符" 
              size="large"
              style="width: 120px"
            >
              <el-option 
                v-for="op in getAvailableOperators(condition.field)" 
                :key="op.value"
                :label="op.label" 
                :value="op.value" 
              />
            </el-select>

            <!-- 值输入 -->
            <template v-if="condition.operator === 'between'">
              <el-input 
                v-model="condition.value" 
                placeholder="最小值"
                size="large"
                style="width: 140px"
                :type="getInputType(condition.field)"
              />
              <span class="between-separator">到</span>
              <el-input 
                v-model="condition.value2" 
                placeholder="最大值"
                size="large"
                style="width: 140px"
                :type="getInputType(condition.field)"
              />
            </template>
            <el-input 
              v-else
              v-model="condition.value" 
              :placeholder="getPlaceholder(condition.field)"
              size="large"
              style="flex: 1; min-width: 200px"
              :type="getInputType(condition.field)"
              clearable
            />

            <!-- 删除按钮 -->
            <el-button 
              type="danger" 
              size="large"
              :icon="Delete"
              circle
              @click="removeCondition(index)"
            />
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons" v-if="searchConditions.length > 0">
        <el-button @click="resetConditions" :icon="RefreshLeft">重置条件</el-button>
        <el-button type="primary" @click="performSearch" :loading="searching" :icon="Search">
          执行搜索
        </el-button>
      </div>
    </el-card>

    <!-- 搜索结果 -->
    <el-card class="results-card" v-if="searchPerformed" shadow="hover">
      <template #header>
        <div class="card-header">
          <div>
            <span><el-icon><List /></el-icon> 搜索结果</span>
            <el-tag v-if="searchResult" type="info" style="margin-left: 10px">
              共 {{ searchResult.totalElements }} 条结果
            </el-tag>
          </div>
          <div v-if="searchResult" class="search-summary">
            <el-text type="info" size="small">
              {{ searchResult.searchSummary }} · 耗时 {{ searchResult.searchTimeMs }}ms
            </el-text>
          </div>
        </div>
      </template>

      <div v-loading="searching">
        <!-- 结果列表 -->
        <div v-if="searchResult && searchResult.works.length > 0" class="works-list">
          <div v-for="work in searchResult.works" :key="work.workId" class="work-item">
            <div class="work-header">
              <h3 class="work-title" @click="goToWork(work.workId)">
                {{ work.title }}
              </h3>
              <el-tag v-if="work.type" size="small">{{ work.type }}</el-tag>
            </div>
            
            <div class="work-meta">
              <span v-if="work.authors && work.authors.length">
                <el-icon><User /></el-icon>
                {{ work.authors.slice(0, 5).map(a => a.name).join(', ') }}
                <span v-if="work.authors.length > 5">等{{ work.authors.length }}人</span>
              </span>
              <span v-if="work.publishYear">
                <el-icon><Calendar /></el-icon>
                {{ work.publishYear }}年
              </span>
              <span v-if="work.cited !== undefined">
                <el-icon><Reading /></el-icon>
                被引 {{ work.cited }} 次
              </span>
              <span v-if="work.journal">
                <el-icon><Document /></el-icon>
                {{ work.journal }}
              </span>
            </div>

            <div v-if="work.abstract" class="work-abstract">
              {{ truncateText(work.abstract, 200) }}
            </div>

            <div v-if="work.concepts && work.concepts.length" class="work-concepts">
              <el-tag 
                v-for="concept in work.concepts.slice(0, 5)" 
                :key="concept.id"
                size="small"
                type="info"
                effect="plain"
              >
                {{ concept.name }}
              </el-tag>
            </div>
          </div>

          <!-- 分页 -->
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              :total="searchResult.totalElements"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handlePageChange"
            />
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty v-else description="未找到符合条件的著作" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  Search, Filter, Plus, Delete, RefreshLeft, List,
  User, Calendar, Reading, Document 
} from '@element-plus/icons-vue'
import { advancedSearchWorks } from '@/api/work'

const router = useRouter()

// 搜索条件
const searchConditions = ref([])
let conditionIdCounter = 0

// 搜索状态
const searching = ref(false)
const searchPerformed = ref(false)
const searchResult = ref(null)

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 字段类型映射
const fieldTypes = {
  title: 'string',
  abstract: 'string',
  keywords: 'string',
  authorName: 'string',
  authorId: 'string',
  institutionName: 'string',
  institutionId: 'string',
  conceptName: 'string',
  conceptId: 'string',
  journal: 'string',
  doi: 'string',
  type: 'string',
  publishYear: 'number',
  cited: 'number'
}

// 操作符选项
const stringOperators = [
  { label: '包含', value: 'contains' },
  { label: '等于', value: 'equals' },
  { label: '开头是', value: 'startsWith' },
  { label: '结尾是', value: 'endsWith' }
]

const numberOperators = [
  { label: '等于', value: 'equals' },
  { label: '大于', value: 'greaterThan' },
  { label: '小于', value: 'lessThan' },
  { label: '范围', value: 'between' }
]

// 获取字段可用的操作符
function getAvailableOperators(field) {
  const type = fieldTypes[field]
  if (type === 'number') {
    return numberOperators
  }
  return stringOperators
}

// 获取输入框类型
function getInputType(field) {
  return fieldTypes[field] === 'number' ? 'number' : 'text'
}

// 获取占位符
function getPlaceholder(field) {
  const placeholders = {
    title: '输入标题关键词',
    abstract: '输入摘要关键词',
    keywords: '输入关键词',
    authorName: '输入作者姓名',
    authorId: '输入作者ID',
    institutionName: '输入机构名称',
    institutionId: '输入机构ID',
    conceptName: '输入概念名称',
    conceptId: '输入概念ID',
    journal: '输入期刊名称',
    doi: '输入DOI',
    type: '输入类型',
    publishYear: '输入年份',
    cited: '输入被引次数'
  }
  return placeholders[field] || '输入值'
}

// 添加条件
function addCondition() {
  searchConditions.value.push({
    id: conditionIdCounter++,
    field: 'title',
    operator: 'contains',
    value: '',
    value2: '', // 用于 between 操作符
    not: false,
    logic: 'AND' // 与前一个条件的逻辑关系
  })
}

// 移除条件
function removeCondition(index) {
  searchConditions.value.splice(index, 1)
}

// 重置条件
function resetConditions() {
  searchConditions.value = []
  searchPerformed.value = false
  searchResult.value = null
  currentPage.value = 1
}

// 字段改变时重置操作符
function handleFieldChange(condition) {
  const operators = getAvailableOperators(condition.field)
  if (!operators.find(op => op.value === condition.operator)) {
    condition.operator = operators[0].value
  }
  condition.value = ''
  condition.value2 = ''
}

// 执行搜索
async function performSearch() {
  // 验证条件
  const validConditions = searchConditions.value.filter(c => {
    if (!c.field || !c.operator) return false
    if (c.operator === 'between') {
      return c.value && c.value2
    }
    return c.value
  })

  if (validConditions.length === 0) {
    ElMessage.warning('请至少添加一个有效的搜索条件')
    return
  }

  searching.value = true
  
  try {
    // 构建请求
    const request = {
      conditions: validConditions.map((c, index) => ({
        field: c.field,
        operator: c.operator,
        value: c.value,
        value2: c.operator === 'between' ? c.value2 : undefined,
        not: c.not,
        logic: index === 0 ? 'AND' : c.logic
      })),
      page: currentPage.value - 1, // 后端从0开始
      size: pageSize.value,
      sortBy: 'cited', // 默认按被引次数排序
      sortOrder: 'desc'
    }

    const response = await advancedSearchWorks(request)
    
    if (response.code === 200) {
      searchResult.value = response.data
      searchPerformed.value = true
      ElMessage.success('搜索完成')
    } else {
      ElMessage.error(response.message || '搜索失败')
    }
  } catch (error) {
    console.error('搜索出错:', error)
    ElMessage.error('搜索出错，请稍后重试')
  } finally {
    searching.value = false
  }
}

// 分页改变
function handlePageChange(page) {
  currentPage.value = page
  performSearch()
}

function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1
  performSearch()
}

// 跳转到著作详情
function goToWork(workId) {
  router.push({ name: 'WorkDetail', params: { id: workId } })
}

// 文本截断
function truncateText(text, maxLength) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}
</script>

<style scoped>
.advanced-search-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-description {
  color: #666;
  font-size: 14px;
}

.search-builder-card,
.results-card {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.card-header span {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-summary {
  font-weight: normal;
}

.empty-conditions {
  padding: 40px 0;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.condition-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.logic-connector {
  padding-left: 48px;
}

.condition-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  flex-wrap: wrap;
}

.not-checkbox {
  min-width: 60px;
}

.between-separator {
  padding: 0 8px;
  color: #666;
}

.action-buttons {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.works-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.work-item {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.work-item:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.work-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.work-title {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
  margin: 0;
  transition: color 0.3s;
}

.work-title:hover {
  color: #409eff;
}

.work-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.work-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.work-abstract {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 12px;
}

.work-concepts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-container {
  margin-top: 24px;
  display: flex;
  justify-content: center;
}
</style>
