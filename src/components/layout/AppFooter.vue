<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-section">
          <h4>关于平台</h4>
          <p>学术成果分享平台致力于为科研人员提供便捷的学术成果检索、分享与交流服务。</p>
        </div>
        <div class="footer-section">
          <h4>快速链接</h4>
          <ul>
            <li><router-link to="/authors">学者检索</router-link></li>
            <li><router-link to="/works">著作检索</router-link></li>
            <li><router-link to="/institutions">机构检索</router-link></li>
            <li><router-link to="/concepts">研究概念</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>用户服务</h4>
          <ul>
            <li><router-link to="/user">个人中心</router-link></li>
            <li><router-link to="/user/collections">我的收藏</router-link></li>
            <li><router-link to="/user/applications">申请记录</router-link></li>
          </ul>
        </div>
        <div class="footer-section">
          <h4>联系我们</h4>
          <p>邮箱：support@academic.edu.cn</p>
          <p>地址：北京市海淀区学院路</p>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2025 学术成果分享平台 All Rights Reserved</p>
      </div>
    </div>
  </footer>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.app-footer {
  background: linear-gradient(180deg, #f5f9fc 0%, #e8f4fd 100%);
  border-top: 1px solid var(--border-lighter);
  margin-top: auto;
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 24px 20px;
}

.footer-content {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  padding-bottom: 30px;
  border-bottom: 1px solid var(--border-light);
}

.footer-section {
  h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--primary-dark);
    margin-bottom: 16px;
  }

  p {
    font-size: 14px;
    color: var(--text-secondary);
    line-height: 1.8;
  }

  ul {
    list-style: none;
    padding: 0;

    li {
      margin-bottom: 8px;

      a {
        font-size: 14px;
        color: var(--text-secondary);
        transition: color 0.3s;

        &:hover {
          color: var(--primary-color);
        }
      }
    }
  }
}

.footer-bottom {
  padding-top: 20px;
  text-align: center;

  p {
    font-size: 13px;
    color: var(--text-secondary);
  }
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }
}
</style>
