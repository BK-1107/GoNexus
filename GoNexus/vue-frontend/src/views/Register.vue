<template>
  <div class="register-container">
    <!-- 注册卡片容器 -->
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <h2>注册</h2>
        </div>
      </template>
      
      <!-- 注册表单 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="80px"
      >
        <!-- 邮箱输入项 -->
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="registerForm.email"
            placeholder="请输入邮箱"
            type="email"
          />
        </el-form-item>

        <!-- 验证码输入项（包含发送验证码按钮） -->
        <el-form-item label="验证码" prop="captcha">
          <el-row :gutter="10">
            <el-col :span="16">
              <el-input
                v-model="registerForm.captcha"
                placeholder="请输入验证码"
              />
            </el-col>
            <el-col :span="8">
              <!-- 发送验证码按钮，包含 60s 倒计时逻辑 -->
              <el-button
                type="primary"
                :loading="codeLoading"
                :disabled="countdown > 0"
                @click="sendCode"
                style="width: 100%"
              >
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>

        <!-- 密码输入项 -->
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            placeholder="请输入密码"
            type="password"
            show-password
          />
        </el-form-item>

        <!-- 确认密码输入项 -->
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            placeholder="请再次输入密码"
            type="password"
            show-password
          />
        </el-form-item>

        <!-- 注册提交按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleRegister"
            style="width: 100%"
          >
            注册
          </el-button>
        </el-form-item>

        <!-- 返回登录页 -->
        <el-form-item>
          <el-button
            type="text"
            @click="$router.push('/login')"
            style="width: 100%"
          >
            已有账号？去登录
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../utils/api'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter()
    const registerFormRef = ref()
    const loading = ref(false)         // 注册按钮加载状态
    const codeLoading = ref(false)     // 发送验证码按钮加载状态
    const countdown = ref(0)           // 验证码倒计时（秒）

    // 响应式注册表单数据
    const registerForm = reactive({
      email: '',
      captcha: '',
      password: '',
      confirmPassword: ''
    })

    /**
     * 自定义校验规则：验证两次输入的密码是否一致
     */
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== registerForm.password) {
        callback(new Error('两次输入密码不一致'))
      } else {
        callback()
      }
    }

    // 表单验证规则定义
    const registerRules = {
      email: [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ],
      captcha: [
        { required: true, message: '请输入验证码', trigger: 'blur' }
      ],
      password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: '请确认密码', trigger: 'blur' },
        { validator: validateConfirmPassword, trigger: 'blur' } // 使用自定义校验器
      ]
    }

    /**
     * 发送邮箱验证码
     */
    const sendCode = async () => {
      if (!registerForm.email) {
        ElMessage.warning('请先输入邮箱')
        return
      }
      try {
        codeLoading.value = true
        // 调用后端发送验证码接口
        const response = await api.post('/user/captcha', { email: registerForm.email })
        if (response.data.status_code === 1000) {
          ElMessage.success('验证码发送成功')
          // 开启 60 秒倒计时
          countdown.value = 60
          const timer = setInterval(() => {
            countdown.value--
            if (countdown.value <= 0) {
              clearInterval(timer)
            }
          }, 1000)
        } else {
          ElMessage.error(response.data.status_msg || '验证码发送失败')
        }
      } catch (error) {
        console.error('Send code error:', error)
        ElMessage.error('验证码发送失败，请重试')
      } finally {
        codeLoading.value = false
      }
    }

    /**
     * 执行注册逻辑
     */
    const handleRegister = async () => {
      try {
        // 1. 触发 UI 层的全量校验
        await registerFormRef.value.validate()
        loading.value = true
        
        // 2. 发送注册请求
        const response = await api.post('/user/register', {
              email: registerForm.email,
              captcha: registerForm.captcha,
              password: registerForm.password
        })

        // 3. 处理注册结果
        if (response.data.status_code === 1000) {
          ElMessage.success('注册成功，请登录')
          // 注册成功后跳转至登录页
          router.push('/login')
        } else {
          ElMessage.error(response.data.status_msg || '注册失败')
        }
      } catch (error) {
        console.error('Register error:', error)
        ElMessage.error('注册失败，请重试')
      } finally {
        loading.value = false
      }
    }

    return {
      registerFormRef,
      loading,
      codeLoading,
      countdown,
      registerForm,
      registerRules,
      sendCode,
      handleRegister
    }
  }
}
</script>

<style scoped>
/* 整个页面的全屏背景容器 */
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 使用伪元素制作背景的浮动几何粒子特效（同登录页） */
.register-container::before {
  content: '';
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
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* 注册卡片样式：磨砂玻璃效果 */
.register-card {
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
  from { filter: brightness(1); }
  to { filter: brightness(1.2); }
}

.el-form-item {
  margin-bottom: 20px;
}

/* 输入框聚焦时的微交互：略微放大 */
.el-input {
  transition: all 0.3s ease;
}

.el-input:focus-within {
  transform: scale(1.02);
}

/* 验证码按钮所在行的淡入动画 */
.el-row {
  animation: fadeIn 0.6s ease-out 0.3s both;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 按钮悬浮时的流光和投影效果 */
.el-button {
  height: 44px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

/* 按钮内部横扫过的一道白光特效 */
.el-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.el-button:hover::before {
  left: 100%;
}

.el-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(64, 158, 255, 0.3);
}

.register-link {
  text-align: center;
  margin-top: 20px;
}
</style>