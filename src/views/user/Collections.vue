<template>
  <div class="collections-page card">
    <div class="page-header">
      <h2 class="page-title">我的收藏</h2>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>新建收藏夹
      </el-button>
    </div>

    <!-- 收藏夹列表 -->
    <div class="favourites-list" v-loading="loading">
      <div
        class="favourite-item"
        :class="{ active: activeFid === fav.fid }"
        v-for="fav in favourites"
        :key="fav.fid"
        @click="selectFavourite(fav)"
      >
        <div class="fav-info">
          <el-icon><Folder /></el-icon>
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
      <el-empty v-if="!favourites.length" description="暂无收藏夹" />
    </div>

    <!-- 收藏内容 -->
    <div class="collections-content" v-if="activeFid" v-loading="itemsLoading">
      <h3>{{ activeFavName }} 的内容</h3>
      <div class="items-list">
        <div class="item-card" v-for="item in collectionItems" :key="item.cid">
          <div class="item-info" @click="router.push(`/works/${item.achievementId}`)">
            <h4>{{ item.title }}</h4>
            <p>{{ item.authors }} · {{ item.journal }} · {{ item.date }}</p>
          </div>
          <el-button text type="danger" @click="removeItem(item.cid)">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <el-empty v-if="!collectionItems.length" description="该收藏夹为空" />
      </div>
    </div>

    <!-- 新建/编辑对话框 -->
    <el-dialog v-model="showCreateDialog" :title="editingFav ? '编辑收藏夹' : '新建收藏夹'" width="400px">
      <el-form :model="favForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="favForm.fName" placeholder="请输入收藏夹名称" />
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
const activeFavName = ref('')
const collectionItems = ref([])

const showCreateDialog = ref(false)
const editingFav = ref(null)
const favForm = reactive({ fName: '', description: '' })

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

const selectFavourite = async (fav) => {
  activeFid.value = fav.fid
  activeFavName.value = fav.fName
  itemsLoading.value = true
  try {
    const res = await getCollectionItems(fav.fid, { page: 1, size: 50 })
    collectionItems.value = res.data?.list || []
  } catch (error) {
    console.error('获取收藏内容失败', error)
  } finally {
    itemsLoading.value = false
  }
}

const editFavourite = (fav) => {
  editingFav.value = fav
  favForm.fName = fav.fName
  favForm.description = fav.description || ''
  showCreateDialog.value = true
}

const saveFavourite = async () => {
  if (!favForm.fName.trim()) {
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
    favForm.fName = ''
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

const removeItem = async (cid) => {
  try {
    await removeFromCollection(cid)
    ElMessage.success('移除成功')
    collectionItems.value = collectionItems.value.filter(i => i.cid !== cid)
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
    border-bottom: 1px solid var(--border-lighter);
    padding-bottom: 20px;
    margin-bottom: 20px;
  }

  .favourite-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.3s;

    &:hover, &.active {
      background: var(--primary-lightest);
    }

    &.active {
      border-left: 3px solid var(--primary-color);
    }

    .fav-info {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon { color: var(--primary-color); }
      .fav-name { font-weight: 500; }
      .fav-count { color: var(--text-secondary); font-size: 13px; }
    }

    .fav-actions { opacity: 0; transition: opacity 0.3s; }
    &:hover .fav-actions { opacity: 1; }
  }

  .collections-content {
    h3 { font-size: 16px; margin-bottom: 16px; }

    .items-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .item-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: var(--bg-light);
      border-radius: var(--radius-md);

      .item-info {
        cursor: pointer;
        &:hover h4 { color: var(--primary-color); }

        h4 { font-size: 15px; font-weight: 500; margin-bottom: 4px; }
        p { font-size: 13px; color: var(--text-secondary); }
      }
    }
  }
}
</style>
