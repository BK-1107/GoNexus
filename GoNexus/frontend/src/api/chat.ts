import client from './client'

export const chatApi = {
  // 获取会话列表
  getSessions: () => client.get('/AI/chat/sessions'),
  
  // 获取聊天历史
  getHistory: (sessionId: string) => client.post('/AI/chat/history', { 
    sessionId: sessionId 
  }),
  
  // 发送消息 (普通非流式)
  sendMessage: (sessionId: string, content: string) => client.post('/AI/chat/send', { sessionId: sessionId, content }),
  
  // 创建并发送消息 (普通非流式)
  createSessionAndSend: (content: string) => client.post('/AI/chat/send-new-session', { content }),

  // 删除会话
  deleteSession: (sessionId: string) => client.delete(`/AI/chat/session/${sessionId}`),
}
