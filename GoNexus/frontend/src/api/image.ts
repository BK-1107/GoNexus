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
  }
}
