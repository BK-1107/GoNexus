<template>
  <div class="image-recognition-container">
    <!-- 左侧会话列表 -->
    <div class="session-list">
      <div class="session-list-header">
        <span>图像识别</span>
      </div>
      <ul class="session-list-ul">
        <li class="session-item active">
          图像识别助手
        </li>
      </ul>
    </div>

    <!-- 右侧聊天区域 -->
    <div class="chat-section">
      <div class="top-bar">
        <button class="back-btn" @click="$router.push('/menu')">← 返回</button>
        <h2>AI 图像识别助手</h2>
      </div>

      <div class="chat-messages" ref="chatContainerRef">
        <div
          v-for="(message, index) in messages"
          :key="index"
          :class="['message', message.role === 'user' ? 'user-message' : 'ai-message']"
        >
          <div class="message-header">
            <b>{{ message.role === 'user' ? '你' : 'AI' }}:</b>
          </div>
          <div class="message-content">
            <span>{{ message.content }}</span>
            <img v-if="message.imageUrl" :src="message.imageUrl" alt="上传的图片" />
          </div>
        </div>
      </div>

      <div class="chat-input">
        <form @submit.prevent="handleSubmit">
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            required
            @change="handleFileSelect"
          />
          <button type="submit" :disabled="!selectedFile">发送图片</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, nextTick } from 'vue'
import api from '../utils/api'

export default {
  name: 'ImageRecognition',
  setup() {
    const messages = ref([])
    const selectedFile = ref(null)
    const fileInputRef = ref()
    const chatContainerRef = ref()

    const handleFileSelect = (event) => {
      selectedFile.value = event.target.files[0]
    }

    const handleSubmit = async () => {
      if (!selectedFile.value) return

      const file = selectedFile.value
      const imageUrl = URL.createObjectURL(file)

      // Add user message to UI
      messages.value.push({
        role: 'user',
        content: `已上传图片: ${file.name}`,
        imageUrl: imageUrl,
      })

      await nextTick()
      scrollToBottom()

      // Create FormData
      const formData = new FormData()
      formData.append('image', file)

      try {
        const response = await api.post('/image/recognize', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })


        if (response.data && response.data.class_name) {
             const aiText = `识别结果: ${response.data.class_name}`
            messages.value.push({
                role: 'assistant',
                content: aiText,
            })
        } else {
             messages.value.push({
                 role: 'assistant',
                 content: `[错误] ${response.data.status_msg || '识别失败'}`,
             })
        }
      } catch (error) {
        console.error('Upload error:', error)
        messages.value.push({
          role: 'assistant',
          content: `[错误] 无法连接到服务器或上传失败: ${error.message}`,
        })
      } finally {

        URL.revokeObjectURL(imageUrl)

            await nextTick()
        scrollToBottom()


        selectedFile.value = null
        if (fileInputRef.value) {
          fileInputRef.value.value = ''
        }
      }
    }

    const scrollToBottom = () => {
      if (chatContainerRef.value) {
        chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight
      }
    }

    return {
      messages,
      selectedFile,
      fileInputRef,
      chatContainerRef,
      handleFileSelect,
      handleSubmit
    }
  }
}
</script>

<style scoped>
.image-recognition-container {
  height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  color: #222;
}

.image-recognition-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.08)"/><circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.08)"/><circle cx="40" cy="60" r="1" fill="rgba(255,255,255,0.06)"/><circle cx="60" cy="30" r="1.5" fill="rgba(255,255,255,0.06)"/></svg>');
  animation: float 20s ease-in-out infinite;
  opacity: 0.25;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

.session-list {
  width: 280px;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.08);
  position: relative;
  z-index: 2;
}

.session-list-header {
  padding: 20px;
  text-align: center;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.06) 0%, rgba(103, 194, 58, 0.06) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.session-list-ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.session-item {
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.03);
  transition: all 0.2s ease;
  position: relative;
  color: #2c3e50;
}

.session-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  box-shadow: inset 0 0 20px rgba(102, 126, 234, 0.2);
}

/* chat section */
.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.top-bar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #2c3e50;
  display: flex;
  align-items: center;
  padding: 12px 24px;
  box-shadow: 0 2px 14px rgba(0, 0, 0, 0.06);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  gap: 12px;
}

.back-btn {
  background: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: #2c3e50;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.32);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.top-bar h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  position: relative;
  z-index: 1;
}

/* scrollbar */
.chat-messages::-webkit-scrollbar {
  width: 8px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.12);
  border-radius: 8px;
}
.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.message {
  max-width: 70%;
  padding: 14px 18px;
  border-radius: 18px;
  line-height: 1.6;
  word-wrap: break-word;
  position: relative;
  animation: messageSlideIn 0.28s ease-out;
  font-size: 15px;
  box-sizing: border-box;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.user-message {
  align-self: flex-end;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.16);
}

.user-message::after {
  content: '';
  position: absolute;
  bottom: -6px;
  right: 18px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #764ba2;
}

.ai-message {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  color: #2c3e50;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.ai-message::after {
  content: '';
  position: absolute;
  bottom: -6px;
  left: 18px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid rgba(255, 255, 255, 0.95);
}

.message-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.message-header b {
  font-weight: 600;
}

/* message content */
.message-content {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-content img {
  max-width: 250px;
  border-radius: 12px;
  display: block;
  margin-top: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.message-content img:hover {
  transform: scale(1.05);
}

/* input area */
.chat-input {
  padding: 24px;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(8px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}

.chat-input form {
  display: flex;
  gap: 20px;
}

.chat-input input[type="file"] {
  flex: 1;
  border: 2px dashed #d9d9d9;
  border-radius: 12px;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.8);
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.chat-input input[type="file"]:hover {
  border-color: #409eff;
  background: rgba(64, 158, 255, 0.05);
}

.chat-input input[type="file"]::file-selector-button {
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 8px 16px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-weight: 600;
  margin-right: 12px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
}

.chat-input input[type="file"]::file-selector-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.chat-input button {
  padding: 15px 30px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.chat-input button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.chat-input button:disabled {
  background: #ccc;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}
</style>