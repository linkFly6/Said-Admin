import { throttle } from '../service/utils'

export interface PlayerOption {
  /**
   * 是否自动播放
   */
  autoplay?: boolean

  /**
   * 音频播放源
   */
  src?: string

  /**
   * 是否显示控制面板
   */
  controls?: boolean

  /**
   * 是否循环播放
   */
  loop?: boolean

  /**
   * 默认值为 "none"
   * 枚举属性：
   * none: 示意用户可能不会播放该音频，或者服务器希望节省带宽；换句话说，该音频不会被缓存
   * metadata: 示意即使用户可能不会播放该音频，但获取元数据 (例如音频长度) 还是有必要的
   * auto: 示意用户可能会播放音频；换句话说，如果有必要，整个音频都将被加载，即使用户不期望使用
   * 空字符串 : 等效于auto属性
   */
  preload?: 'none' | 'metadata' | 'auto' | ''
}

/**
 * 音乐播放器
 * 参考资料：
 * - https://segmentfault.com/a/1190000008932943
 * - https://www.fedrobots.com/?search=76050
 * - https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/audio
 * - https://segmentfault.com/q/1010000000390733
 * 获取缓冲区范围参见这里：http://www.w3school.com.cn/tags/av_prop_buffered.asp
 */
export class Player {

  /**
   * 歌曲播放的 url
   */
  private src: string

  /**
   * audio 生成的 element
   */
  public $elem: HTMLAudioElement

  constructor(option: PlayerOption = {}) {
    this.$elem = document.createElement('audio')
    if (option.src) {
      this.$elem.src = option.src
    }
    if (option.autoplay) {
      this.$elem.autoplay = true
    }
    if (option.controls) {
      this.$elem.controls = true
    }
    if (option.loop) {
      this.$elem.loop = true
    }
    // 默认 preload 会节省带宽
    this.$elem.preload = option.preload == null ? 'none' : option.preload

    document.body.appendChild(this.$elem)
  }

  /**
   * 监听事件
   * @param event 
   * @param listener 
   */
  on<K extends keyof HTMLMediaElementEventMap>
    (event: K, listener: (this: HTMLAudioElement, ev: HTMLMediaElementEventMap[K]) => any) {
    this.$elem.addEventListener(event, listener)
    return this
  }

  /**
   * 监听播放中事件，会在 v8 任务队列允许的情况下尽可能快的执行
   * 也就是 1s 可能会执行多次
   * @param listener 事件函数
   */
  onTimeupdate(listener: (
    /**
     * 进度百分比
     */
    progress: number,
    /**
     * 当前播放时间(s)
     */
    currentTime: number,
    /**
     * 总时长(s)
     */
    duration: number) => any) {
    // 为了性能做个 200ms 的节流
    this.on('timeupdate', throttle(e => {
      const progress = this.$elem.duration ?
        // 因为如果是懒加载资源的话， play 之后才会开始播放音乐
        this.$elem.currentTime / this.$elem.duration * 100 : 0
      listener.call(this, progress, this.$elem.currentTime, this.$elem.duration || 0)
    }, 200))
  }

  /**
   * 监听播放结束事件
   * @param listener 
   */
  onEnded(listener: (ev: HTMLMediaElementEventMap['ended']) => any) {
    return this.on('ended', listener)
  }

  /**
   * 播放
   * @param url 如果传入了 url，则重置 url 进行播放
   */
  play(src?: string) {
    if (src) {
      this.src = src
      this.$elem.src = src
    } else if (!this.$elem.src) { // 还没有设置 src
      this.$elem.src = this.src
    }
    this.$elem.play()
    return this
  }

  /**
   * 暂停播放
   */
  pause() {
    this.$elem.pause()
    return this
  }

  /**
   * 设置是否循环播放
   * @param isLoop 
   */
  loop(isLoop: boolean) {
    this.$elem.loop = isLoop
  }

  /**
   * 停止播放
   */
  stop() {
    this.$elem.pause()
    this.$elem.currentTime = 0
  }

  /**
   * 设置 audio 的属性值，要求设置的值必须在 audio 中存在
   * @param name 
   * @param value 
   */
  set(name: string, value: any) {
    if (name in this.$elem) {
      this.$elem[name] = value
    }
    return this
  }

  /**
   * 获取 audio 的属性值
   * @param name 
   */
  get<T = any>(name: string): T {
    return this.$elem[name] as T
  }


  /**
   * 销毁这个 player 对象，如果不再使用 player 对象，请销毁这个对象
   */
  destroy() {
    document.body.removeChild(this.$elem)
  }
}