import { observable, computed, observe } from 'mobx'
import { ImageType } from '../types/image'
import { AdminRule } from '../types/admin'

/**
 * 文章类
 */
export class Article {
  _id: string
  title: string
  context: string
  key: string
  author: {
    _id?: string,
    nickName: string,
    avatar?: string,
    email?: string,
    bio?: string,
    rule: AdminRule
  }
  summary: string
  fileName: string
  poster: {
    _id: string
    size: number
    fileName: string
    type: ImageType
    name: string
    key: string
  }
  song: {
    _id: string
    key: string
    title: string
    mimeType: string
    size: number
    artist: string
    album: string
    duration: number
    image: {
      _id: string
      size: number
      fileName: string
      type: ImageType
      name: string
      key: string
    }
  }
  other: {
    xml: string
    html: string
    summaryHTML: string
  }
  info: {
    likeCount: number
    createTime: number
    updateTime: number
  }
}

export class ArticleStore {
  @observable articles: Article[] = []
}
