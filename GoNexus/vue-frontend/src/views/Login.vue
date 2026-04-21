<template>
  <div class="login-container">
    <!-- 登录卡片容器，使用 Element Plus 的 el-card 组件 -->
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>登录</h2>
        </div>
      </template>

      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="80px"
      >
        <!-- 用户名输入项 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <!-- 密码输入项 -->
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            placeholder="请输入密码"
            type="password"
            show-password
          />
        </el-form-item>

        <!-- 登录按钮操作栏 -->
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleLogin"
            style="width: 100%"
          >
            登录
          </el-button>
        </el-form-item>

        <!-- 跳转注册操作栏 -->
        <el-form-item>
          <el-button
            type="text"
            @click="$router.push('/register')"
            style="width: 100%"
          >
            还没有账号？去注册
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import api from "../utils/api"; // 引入封装好的 axios 实例

export default {
  name: "LoginView",
  setup() {
    const router = useRouter(); // 路由实例，用于跳转页面
    const loginFormRef = ref(); // 绑定表单 DOM 实例，用于调用 validate 校验方法
    const loading = ref(false); // 控制登录按钮的加载状态

    // 响应式表单数据
    const loginForm = ref({
      username: "",
      password: "",
    });

    // 表单验证规则
    const loginRules = {
      username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
      password: [
        { required: true, message: "请输入密码", trigger: "blur" },
        { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
      ],
    };

    /**
     * 处理登录逻辑
     */
    const handleLogin = async () => {
      try {
        // 1. 发送请求前先进行表单字段合法性校验
        await loginFormRef.value.validate();
        loading.value = true; // 开启按钮加载状态

        // 2. 调用后端登录 API 接口
        const response = await api.post("/user/login", {
          username: loginForm.value.username,
          password: loginForm.value.password,
        });

        // 3. 处理响应结果 (假设 1000 为后端定义的登录成功状态码)
        if (response.data.status_code === 1000) {
          // 将登录成功的 Token 存储到本地，用于后续鉴权
          localStorage.setItem("token", response.data.token);
          ElMessage.success("登录成功");

          // 登录成功，跳转至主功能菜单页
          router.push("/menu");
        } else {
          // 业务逻辑错误，显示后端返回的错误消息
          ElMessage.error(response.data.status_msg || "登录失败");
        }
      } catch (error) {
        console.error("Login error:", error);
        ElMessage.error("登录失败，请重试");
      } finally {
        loading.value = false; // 无论成功失败，最后都关闭加载状态
      }
    };

    return {
      loginFormRef,
      loading,
      loginForm,
      loginRules,
      handleLogin,
    };
  },
};
</script>

<style scoped>
/* 整个页面的全屏背景容器 */
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 使用伪元素制作背景的浮动几何粒子特效 */
.login-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="40" cy="60" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="60" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>');
  animation: float 20s ease-in-out infinite;
}

/* 背景粒子漂浮动画 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

/* 登录卡片样式：磨砂玻璃效果 */
.login-card {
  width: 420px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: slideIn 0.8s ease-out;
  position: relative;
  z-index: 1;
}

/* 入场动画：从下方滑入 */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.card-header {
  text-align: center;
  padding: 30px 0 20px 0;
}

/* 标题渐变发光文字效果 */
.card-header h2 {
  margin: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 28px;
  font-weight: 600;
  animation: glow 2s ease-in-out infinite alternate;
}

/* 呼吸式发光动画 */
@keyframes glow {
  from {
    filter: brightness(1);
  }
  to {
    filter: brightness(1.2);
  }
}

.el-form-item {
  margin-bottom: 24px;
}

/* 输入框聚焦时的微交互：略微放大 */
.el-input {
  transition: all 0.3s ease;
}

.el-input:focus-within {
  transform: scale(1.02);
}

/* 按钮悬浮时的流光和阴影效果 */
.el-button {
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 按钮内部横扫过的一道白光特效 */
.el-button::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  transition: left 0.5s;
}

.el-button:hover::before {
  left: 100%;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.3);
}

.login-link {
  text-align: center;
  margin-top: 20px;
  animation: fadeIn 1s ease-out 0.5s both;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
