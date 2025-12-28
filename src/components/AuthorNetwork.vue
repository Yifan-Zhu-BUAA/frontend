<template>
  <div class="author-network-container card">
    <h3 class="network-title">
      <el-icon><Share /></el-icon>
      专家合作关系网络
    </h3>
    
    <div class="network-wrapper" ref="networkContainer">
      <svg ref="svgRef" class="network-svg">
        <!-- 连接线 -->
        <g class="links">
          <line
            v-for="(link, index) in links"
            :key="'link-' + index"
            :x1="link.source.x"
            :y1="link.source.y"
            :x2="link.target.x"
            :y2="link.target.y"
            class="link-line"
            :style="{ strokeWidth: Math.max(1.5, link.value / 2) + 'px' }"
          />
        </g>
        
        <!-- 节点 -->
        <g class="nodes">
          <g
            v-for="node in nodes"
            :key="'node-' + node.id"
            class="node-group"
            :style="{ transform: `translate(${node.x}px, ${node.y}px)` }"
            @click="handleNodeClick(node)"
            @mouseenter="handleNodeHover(node, $event)"
            @mouseleave="handleNodeLeave"
          >
            <circle
              :r="node.radius"
              :class="['node-circle', { 'center-node': node.isCenter }]"
            />
            <!-- 节点内的名字 -->
            <text
              class="node-name"
              text-anchor="middle"
              dominant-baseline="middle"
              :font-size="node.isCenter ? 14 : Math.max(10, node.radius / 3)"
            >
              {{ getDisplayName(node.name, node.isCenter) }}
            </text>
          </g>
        </g>
      </svg>
      
      <!-- 悬浮信息框 -->
      <transition name="tooltip-fade">
        <div
          v-if="hoveredNode"
          class="node-tooltip"
          :style="tooltipStyle"
        >
          <div class="tooltip-header">
            <el-avatar :size="36">{{ hoveredNode.name?.charAt(0) }}</el-avatar>
            <div class="tooltip-title">
              <h4>{{ hoveredNode.name }}</h4>
              <p>{{ hoveredNode.organization || '暂无机构信息' }}</p>
            </div>
          </div>
          <div class="tooltip-content">
            <div class="tooltip-stat" v-if="!hoveredNode.isCenter">
              <span class="stat-value">{{ hoveredNode.count || 0 }}</span>
              <span class="stat-label">次合作</span>
            </div>
            <div class="tooltip-stat" v-if="hoveredNode.worksCount">
              <span class="stat-value">{{ hoveredNode.worksCount }}</span>
              <span class="stat-label">著作数</span>
            </div>
            <div class="tooltip-stat" v-if="hoveredNode.hIndex">
              <span class="stat-value">{{ hoveredNode.hIndex }}</span>
              <span class="stat-label">H指数</span>
            </div>
          </div>
          <div class="tooltip-footer">
            <el-icon><Pointer /></el-icon> 点击查看详情
          </div>
        </div>
      </transition>
    </div>
    
    <div class="network-legend">
      <div class="legend-item">
        <span class="legend-dot center"></span>
        <span>当前学者</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot collaborator"></span>
        <span>合作学者（大小表示合作次数）</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  centerAuthor: {
    type: Object,
    required: true
  },
  coauthors: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()
const networkContainer = ref(null)
const svgRef = ref(null)
const nodes = ref([])
const links = ref([])
const hoveredNode = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

const tooltipStyle = computed(() => ({
  left: `${tooltipPosition.value.x}px`,
  top: `${tooltipPosition.value.y}px`
}))

// 获取显示名字
const getDisplayName = (name, isCenter) => {
  if (!name) return ''
  if (isCenter) {
    return name.length > 6 ? name.slice(0, 6) : name
  }
  return name.length > 4 ? name.slice(0, 4) : name
}

// 计算节点位置 - 不规则放射状布局
const calculateLayout = () => {
  if (!networkContainer.value) return
  
  const container = networkContainer.value
  const width = container.clientWidth
  const height = 500
  const centerX = width / 2
  const centerY = height / 2
  
  // 最多显示15个合作者，保持图形美观
  const displayCoauthors = props.coauthors.slice(0, 15)
  
  if (displayCoauthors.length === 0) {
    nodes.value = []
    links.value = []
    return
  }
  
  // 计算最大合作次数用于归一化
  const maxCount = Math.max(...displayCoauthors.map(c => c.count || 1), 1)
  const minCount = Math.min(...displayCoauthors.map(c => c.count || 1), 1)
  
  // 创建中心节点
  const centerNode = {
    id: props.centerAuthor.id || props.centerAuthor.authorId,
    name: props.centerAuthor.name,
    organization: props.centerAuthor.organizationName,
    worksCount: props.centerAuthor.worksCount,
    hIndex: props.centerAuthor.hIndex || props.centerAuthor.hindex,
    x: centerX,
    y: centerY,
    radius: 55,
    isCenter: true
  }
  
  // 创建合作者节点 - 不规则放射状布局
  const coauthorNodes = displayCoauthors.map((coauthor, index) => {
    const total = displayCoauthors.length
    
    // 基础角度，添加随机偏移让布局更自然
    const baseAngle = (2 * Math.PI * index) / total - Math.PI / 2
    const angleOffset = (Math.random() - 0.5) * 0.3 // 随机角度偏移
    const angle = baseAngle + angleOffset
    
    // 根据合作次数计算节点大小 (25-45)
    const normalizedCount = (coauthor.count || 1 - minCount) / (maxCount - minCount || 1)
    const nodeRadius = 25 + normalizedCount * 20
    
    // 根据合作次数计算距离 - 合作次数多的离中心更近
    const baseDistance = Math.min(width, height) * 0.32
    const distanceVariation = (1 - normalizedCount) * 50 + Math.random() * 30
    const distance = baseDistance + distanceVariation
    
    return {
      id: coauthor.coauthorId || coauthor.id,
      name: coauthor.name,
      organization: coauthor.organizationName,
      count: coauthor.count,
      worksCount: coauthor.worksCount,
      hIndex: coauthor.hIndex,
      x: centerX + distance * Math.cos(angle),
      y: centerY + distance * Math.sin(angle),
      radius: nodeRadius,
      isCenter: false
    }
  })
  
  nodes.value = [centerNode, ...coauthorNodes]
  
  // 创建连接线
  links.value = coauthorNodes.map(node => ({
    source: centerNode,
    target: node,
    value: node.count || 1
  }))
}

// 处理节点点击
const handleNodeClick = (node) => {
  if (node.id) {
    router.push(`/authors/${node.id}`)
  }
}

// 处理节点悬浮
const handleNodeHover = (node, event) => {
  hoveredNode.value = { ...node }
  
  const rect = networkContainer.value.getBoundingClientRect()
  let x = event.clientX - rect.left + 20
  let y = event.clientY - rect.top - 20
  
  // 防止提示框超出容器边界
  const tooltipWidth = 220
  const tooltipHeight = 160
  
  if (x + tooltipWidth > rect.width) {
    x = event.clientX - rect.left - tooltipWidth - 20
  }
  if (y + tooltipHeight > rect.height) {
    y = rect.height - tooltipHeight - 10
  }
  if (y < 10) {
    y = 10
  }
  
  tooltipPosition.value = { x, y }
}

// 处理鼠标离开
const handleNodeLeave = () => {
  hoveredNode.value = null
}

// 监听窗口大小变化
const handleResize = () => {
  calculateLayout()
}

// 监听数据变化
watch(() => [props.centerAuthor, props.coauthors], () => {
  nextTick(() => {
    calculateLayout()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    calculateLayout()
  })
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.author-network-container {
  margin-top: 24px;
  padding: 24px;
  
  .network-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 20px;
    
    .el-icon {
      color: var(--primary-color);
    }
  }
  
  .network-wrapper {
    position: relative;
    width: 100%;
    height: 500px;
    background: linear-gradient(135deg, #f8fbff 0%, #eef5fc 50%, #f5f9fd 100%);
    border-radius: var(--radius-lg);
    overflow: hidden;
    
    .network-svg {
      width: 100%;
      height: 100%;
    }
    
    .link-line {
      stroke: var(--primary-lighter);
      stroke-opacity: 0.5;
      transition: stroke-opacity 0.3s ease;
    }
    
    .node-group {
      cursor: pointer;
      
      &:hover {
        .node-circle {
          filter: brightness(1.15) drop-shadow(0 0 12px rgba(74, 144, 226, 0.6));
        }
      }
    }
    
    .node-circle {
      fill: var(--primary-color);
      stroke: #fff;
      stroke-width: 3px;
      transition: filter 0.3s ease;
      filter: drop-shadow(0 3px 6px rgba(74, 144, 226, 0.25));
      
      &.center-node {
        fill: var(--primary-dark);
        stroke: var(--primary-lighter);
        stroke-width: 4px;
        filter: drop-shadow(0 4px 10px rgba(58, 123, 213, 0.4));
      }
    }
    
    .node-name {
      fill: #fff;
      font-weight: 500;
      pointer-events: none;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
  }
  
  .node-tooltip {
    position: absolute;
    background: #fff;
    border-radius: var(--radius-md);
    box-shadow: 0 8px 24px rgba(74, 144, 226, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 14px;
    width: 220px;
    z-index: 100;
    pointer-events: none;
    border: 1px solid var(--border-lighter);
    
    .tooltip-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--border-lighter);
      
      .el-avatar {
        background: var(--primary-color);
        color: #fff;
        font-weight: 600;
      }
      
      .tooltip-title {
        flex: 1;
        min-width: 0;
        
        h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        p {
          font-size: 11px;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }
    
    .tooltip-content {
      display: flex;
      justify-content: space-around;
      margin-bottom: 10px;
      
      .tooltip-stat {
        text-align: center;
        
        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: var(--primary-color);
          line-height: 1.2;
        }
        
        .stat-label {
          font-size: 11px;
          color: var(--text-secondary);
        }
      }
    }
    
    .tooltip-footer {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 11px;
      color: var(--text-placeholder);
      padding-top: 8px;
      border-top: 1px dashed var(--border-lighter);
      
      .el-icon {
        font-size: 12px;
      }
    }
  }
  
  .tooltip-fade-enter-active,
  .tooltip-fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  
  .tooltip-fade-enter-from,
  .tooltip-fade-leave-to {
    opacity: 0;
    transform: translateY(-5px);
  }
  
  .network-legend {
    display: flex;
    justify-content: center;
    gap: 32px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-lighter);
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--text-secondary);
      
      .legend-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        
        &.center {
          background: var(--primary-dark);
          border: 2px solid var(--primary-lighter);
        }
        
        &.collaborator {
          background: var(--primary-color);
          border: 2px solid #fff;
        }
      }
    }
  }
}
</style>
