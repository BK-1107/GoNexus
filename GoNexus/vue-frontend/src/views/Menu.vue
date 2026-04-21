<template>
  <div class="menu-container">
    <el-header class="header">
      <h1>AI应用平台</h1>
      <el-button type="danger" @click="handleLogout">退出登录</el-button>
    </el-header>
    <el-main class="main">
      <div class="menu-grid">
        <el-card class="menu-item" @click="$router.push('/ai-chat')">
          <div class="card-content">
            <el-icon size="48" color="#409eff"><ChatDotRound /></el-icon>
            <h3>AI聊天</h3>
            <p>与AI进行智能对话</p>
          </div>
        </el-card>
        <el-card class="menu-item" @click="$router.push('/image-recognition')">
          <div class="card-content">
            <el-icon size="48" color="#67c23a"><Camera /></el-icon>
            <h3>图像识别</h3>
            <p>上传图片进行AI识别</p>
          </div>
        </el-card>
      </div>
    </el-main>
  </div>
</template>

<script>
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ChatDotRound, Camera } from '@element-plus/icons-vue'

export default {
  name: 'MenuView',
  components: {
    ChatDotRound,
    Camera
  },
  setup() {
    const router = useRouter()

    const handleLogout = async () => {
      try {
        await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        localStorage.removeItem('token')
        ElMessage.success('退出登录成功')
        router.push('/login')
      } catch {
        // 用户取消操作
      }
    }

    return {
      handleLogout
    }
  }
}
</script>

<style scoped>
.menu-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

.menu-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.05)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="90" cy="40" r="0.8" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  animation: grainMove 30s linear infinite;
}

@keyframes grainMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(100px, 100px); }
}

.header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 30px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 2;
}

.header h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  background: linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.el-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  transition: all 0.3s ease;
}

.el-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
}

.main {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: 1;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 40px;
  max-width: 900px;
  width: 100%;
  padding: 40px;
  animation: gridFadeIn 1s ease-out;
}

@keyframes gridFadeIn {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  cursor: pointer;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  position: relative;
  overflow: hidden;
  animation: cardSlideIn 0.8s ease-out both;
}

.menu-item:nth-child(1) { animation-delay: 0.1s; }
.menu-item:nth-child(2) { animation-delay: 0.2s; }

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(60px) rotateX(10deg);
  }
  to {
    opacity: 1;
    transform: translateY(0) rotateX(0deg);
  }
}

.menu-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  transition: left 0.6s;
}

.menu-item:hover::before {
  left: 100%;
}

.menu-item:hover {
  transform: translateY(-15px) scale(1.05);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.card-content {
  text-align: center;
  padding: 50px 30px;
  position: relative;
  z-index: 1;
}

.el-icon {
  display: block;
  margin: 0 auto 20px;
  transition: all 0.3s ease;
}

.menu-item:hover .el-icon {
  transform: scale(1.2) rotate(5deg);
}

.card-content h3 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.menu-item:hover h3 {
  color: #409eff;
  transform: translateY(-5px);
}

.card-content p {
  margin: 0;
  color: #7f8c8d;
  font-size: 16px;
  line-height: 1.6;
  transition: all 0.3s ease;
}

.menu-item:hover p {
  color: #34495e;
  transform: translateY(-3px);
}
</style>