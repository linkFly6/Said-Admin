/**
 * 图片类型枚举
 */
export enum ImageType {
  /**
   * 系统图
   */
  System = 0,
  /**
   * Blog图
   */
  Blog = 1,
  /**
   * Music图
   */
  Music = 2,
  /**
   * 文章图片
   */
  Article = 3,
  /**
   * Icon
   */
  Icon = 4,
  /**
   * 页面引用图
   */
  Page = 5,
  /**
   * 实验室图
   */
  Lab = 6,
  /**
   * 其他图
   */
  Other = 7
}


/**
 * 图片 Model
 */
export interface ImageModel {
  _id: string,
  /**
   * 图片 md5
   */
  name: string,
  /**
   * 图片文件名 => demo.jpg
   */
  fileName: string,
  /**
   * 图片大小
   */
  size: number,
  /**
   * 图片类型
   */
  type: ImageType,
  /**
   * 存储图片名称，该名称对应为资源路径
   * 例如完整路径为 https://tasaid.com/static/blog/demo.jpg
   * 则存储路径为 static/blog/demo.jpg(注意不带前面的 /)
   * 因为这个 name 对应的七牛云存储的文件 key
   */
  key: string,
  /**
   * 前端属性，后端数据库不存储，图片 url
   */
  url: string
  /**
   * 前端属性，后端数据库不存储，图片缩略图 url
   */
  thumb: string
}