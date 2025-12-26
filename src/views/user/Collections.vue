<template>
  <div class="collections-page card">
    <div class="page-header">
      <h2 class="page-title">我的收藏</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>新建收藏夹
      </el-button>
    </div>

    <!-- 收藏夹列表（手风琴展开） -->
    <div class="favourites-list" v-loading="loading">
      <div
        class="favourite-group"
        v-for="fav in favourites"
        :key="fav.fid"
      >
        <!-- 收藏夹标题行 -->
        <div
          class="favourite-header"
          :class="{ active: activeFid === fav.fid }"
          @click="toggleFavourite(fav)"
        >
          <div class="fav-info">
            <el-icon class="arrow-icon" :class="{ expanded: activeFid === fav.fid }">
              <ArrowRight />
            </el-icon>
            <el-icon class="folder-icon"><Folder /></el-icon>
            <span class="fav-name">{{ fav.fName }}</span>
            <span class="fav-count">({{ fav.count || 0 }})</span>
          </div>
          <div class="fav-actions" @click.stop>
            <el-button text size="small" @click="editFavourite(fav)">
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-popconfirm title="确定删除该收藏夹吗？" @confirm="deleteFav(fav.fid)">
              <template #reference>
                <el-button text size="small" type="danger">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
        
        <!-- 展开的收藏内容 -->
        <div class="favourite-content" v-show="activeFid === fav.fid">
          <div v-if="itemsLoading && activeFid === fav.fid" class="loading-content">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>
          <template v-else>
            <div class="items-list" v-if="collectionItems.length">
              <div class="item-card" v-for="item in collectionItems" :key="item.cid">
                <div class="item-info" @click="router.push(`/works/${item.achievementId}`)">
                  <h4>{{ item.title }}</h4>
                  <p>{{ item.authors }} · {{ item.journal }} · {{ item.date }}</p>
                </div>
                <el-button text type="danger" size="small" @click="removeItem(item.cid, fav)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div class="empty-content" v-else>
              <span>该收藏夹为空</span>
            </div>
          </template>
        </div>
      </div>
      <el-empty v-if="!favourites.length" description="暂无收藏夹" />
    </div>

    <!-- 新建/编辑对话框 -->
    <el-dialog v-model="showCreateDialog" :title="editingFav ? '编辑收藏夹' : '新建收藏夹'" width="400px">
      <el-form :model="favForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="favForm.fname" placeholder="请输入收藏夹名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="favForm.description" type="textarea" :rows="3" placeholder="可选描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveFavourite" :loading="savingFav">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getFavourites, createFavourite, updateFavourite, deleteFavourite, getCollectionItems, removeFromCollection } from '@/api/collection'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const itemsLoading = ref(false)
const savingFav = ref(false)

const favourites = ref([])
const activeFid = ref(null)
const collectionItems = ref([])

const showCreateDialog = ref(false)
const editingFav = ref(null)
const favForm = reactive({ fname: '', description: '' })

const fetchFavourites = async () => {
  loading.value = true
  try {
    const res = await getFavourites()
    favourites.value = res.data || []
  } catch (error) {
    console.error('获取收藏夹失败', error)
  } finally {
    loading.value = false
  }
}

// 切换展开/收起收藏夹
const toggleFavourite = async (fav) => {
  if (activeFid.value === fav.fid) {
    // 如果当前已展开，则收起
    activeFid.value = null
    collectionItems.value = []
  } else {
    // 先设置加载状态和展开
    const prevFid = activeFid.value
    activeFid.value = fav.fid
    itemsLoading.value = true
    collectionItems.value = []
    
    try {
      const res = await getCollectionItems(fav.fid, { page: 1, size: 50 })
      // 确保还是当前展开的收藏夹
      if (activeFid.value === fav.fid) {
        collectionItems.value = res.data?.list || []
      }
    } catch (error) {
      console.error('获取收藏内容失败', error)
      console.error('获取收藏内容失败', error)
    } finally {
      itemsLoading.value = false
    }
  }
}

const editFavourite = (fav) => {
  editingFav.value = fav
  favForm.fname = fav.fName
  favForm.description = fav.description || ''
  showCreateDialog.value = true
}

const saveFavourite = async () => {
  if (!favForm.fname.trim()) {
    ElMessage.warning('请输入收藏夹名称')
    return
  }

  savingFav.value = true
  try {
    if (editingFav.value) {
      await updateFavourite(editingFav.value.fid, favForm)
      ElMessage.success('修改成功')
    } else {
      await createFavourite(favForm)
      ElMessage.success('创建成功')
    }
    showCreateDialog.value = false
    editingFav.value = null
    favForm.fname = ''
    favForm.description = ''
    fetchFavourites()
  } catch (error) {
    console.error('保存失败', error)
  } finally {
    savingFav.value = false
  }
}

const deleteFav = async (fid) => {
  try {
    await deleteFavourite(fid)
    ElMessage.success('删除成功')
    if (activeFid.value === fid) {
      activeFid.value = null
      collectionItems.value = []
    }
    fetchFavourites()
  } catch (error) {
    console.error('删除失败', error)
  }
}

const removeItem = async (cid, fav) => {
  try {
    await removeFromCollection(cid)
    ElMessage.success('移除成功')
    collectionItems.value = collectionItems.value.filter(i => i.cid !== cid)
    // 更新收藏夹的数量
    if (fav) {
      fav.count = Math.max(0, (fav.count || 1) - 1)
    }
  } catch (error) {
    console.error('移除失败', error)
  }
}

onMounted(() => { fetchFavourites() })
</script>

<style lang="scss" scoped>
.collections-page {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .page-title { font-size: 20px; font-weight: 600; }

  .favourites-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .favourite-group {
    border: 1px solid var(--border-lighter);
    border-radius: var(--radius-md);
    overflow: hidden;
    transition: all 0.3s;

    &:hover {
      border-color: var(--primary-light);
    }
  }

  .favourite-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 16px;
    cursor: pointer;
    transition: all 0.3s;
    background: #fff;

    &:hover {
      background: var(--primary-lightest);
    }

    &.active {
      background: var(--primary-lightest);
      border-bottom: 1px solid var(--border-lighter);
    }

    .fav-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .arrow-icon {
        color: var(--text-secondary);
        transition: transform 0.3s;
        font-size: 12px;

        &.expanded {
          transform: rotate(90deg);
        }
      }

      .folder-icon { color: var(--primary-color); }
      .fav-name { font-weight: 500; }
      .fav-count { color: var(--text-secondary); font-size: 13px; }
    }

    .fav-actions { opacity: 0; transition: opacity 0.3s; }
    &:hover .fav-actions { opacity: 1; }
  }

  .favourite-content {
    background: var(--bg-light);
    padding: 12px 16px;

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .item-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background: #fff;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-lighter);
      transition: all 0.2s;

      &:hover {
        border-color: var(--primary-light);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      }

      .item-info {
        flex: 1;
        cursor: pointer;
        min-width: 0;

        &:hover h4 { color: var(--primary-color); }

        h4 { 
          font-size: 14px; 
          font-weight: 500; 
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        p { 
          font-size: 12px; 
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }
    }

    .empty-content {
      text-align: center;
      padding: 20px;
      color: var(--text-secondary);
      font-size: 13px;
    }

    .loading-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 24px;
      color: var(--text-secondary);
      font-size: 13px;

      .el-icon {
        font-size: 16px;
        color: var(--primary-color);
      }
    }
  }
}
</style>
