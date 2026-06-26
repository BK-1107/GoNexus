import client from './client'

export const imageApi = {
  // 调用后端真实识图接口
  recognize: (file: File) => {
    const formData = new FormData()
    formData.append('image', file) // 后端控制器字段名是 "image"
    return client.post('/image/recognize', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  saveToMemory: (file: File, result: string) => {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('result', result)
    return client.post('/AI/chat/session/from-vision', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  generatePrompt: (analysis: string) => client.post('/image/prompt', {
    analysis,
    target: 'stable-diffusion',
  })
}
