import client from './client'

export const fileApi = {
  // 上传图片/文件
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post('/file/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  // 删除知识库文件
  deleteKnowledge: (filename: string) => {
    return client.delete('/file/knowledge', {
      params: { filename }
    })
  }
}
