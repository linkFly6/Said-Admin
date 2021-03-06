import * as React from 'react'
import {
  Form,
  Row,
  Col,
  Icon,
  Input,
  Modal,
  message,
  Button,
  Popconfirm
} from 'antd'
import { FormComponentProps } from 'antd/lib/form/Form'
import { ImageModel, ImageType } from '../../types/image'
import { ImageComponent } from '../images/images'
import * as s from './song.styl'
import { observer, inject } from 'mobx-react'
import { SongStore } from '../../store/song'
import { Store } from '../../service/utils/store'
import { debounce } from '../../service/utils/index'
import { SongModel } from '../../types/song'
import { parseTime } from '../../service/utils/format'
import { createFormItem } from '../../components/common'

const songStore = new Store('other.view.song')

/**
 * 存在 store 中的 key
 * 用户最后一次选择的图片类型(过滤项)
 */
const SONGCACHENAME = 'songCache'


/**
 * 创建一个存储到 Store 的方法，进行函数节流
 */
const save2Local = debounce<(value: SongModel) => void>((value: any) => {
  saveCache(value)
}, 300)


export const saveCache = (data: SongModel) => {
  songStore.val(SONGCACHENAME, data)
}

export const hasCache = () => {
  return songStore.has(SONGCACHENAME)
}


const FormItem = createFormItem({})


interface StateProps extends FormComponentProps {
  songStore: SongStore,
  onSuccess?: (song: SongModel) => void,
  onCancel?: () => void,
  /**
   * 可以指定除 store 之外的对象
   * 也可以通过它来让组件重置
   */
  song?: SongModel | null
}

interface ComponentState {
  /**
   * 选择图片框是否显示
   */
  selectImageModalVisible: boolean,
  /**
   * 正在使用的专辑封面图
   */
  image: ImageModel | null,
  /**
   * 选择中的专辑封面图
   */
  selectImage: ImageModel | null,
  /**
   * 是否显示图片未选择的错误
   */
  showImageSelectError: boolean,
  /**
   * 本地填写的缓存
   */
  cache: SongModel,

  // 加载中
  btnCancelIsLoading: boolean,
  btnSaveIsLoading: boolean
}

/**
 * 新增音乐组件
 */
@inject((allStores: any) => ({
  admin: allStores.store.admin,
  songStore: allStores.store.song,
}))
@observer
class SongFormComponent extends React.Component<StateProps, ComponentState> {

  state: ComponentState = {
    image: null,
    selectImageModalVisible: false,
    selectImage: null,
    showImageSelectError: false,
    cache: {} as any,
    btnCancelIsLoading: false,
    btnSaveIsLoading: false,
  }

  setStore = (name: string, value: any) => {
    const data = { ...this.state.cache }
    data[name] = value
    this.setState({
      cache: data,
    })
    save2Local(data)
  }


  // 不能挂载到 componentDidMount，因为这时候页面已经渲染了， cache 为空会导致逻辑出错
  componentWillMount() {
    const cache = songStore.val(SONGCACHENAME) || {}
    this.setState({
      cache,
      image: cache.image ? cache.image : null,
      selectImage: cache.image ? cache.image : null
    })
  }

  /**
   * 生成保存到 store 的函数
   */
  createHandelChangeSaveToLocal = (name: string) => {
    return (e: React.ChangeEvent<any>) => {
      this.setStore(name, e.target.value)
    }
  }

  /**
   * componentWillReceiveProps 会一直触发
   * http://react-china.org/t/react-componentwillreceiveprops-updata-render/16469
   * @param nextProps 
   */
  componentWillReceiveProps(nextProps: StateProps) {
    /**
     * 如果这里不加 this.state.cache.name 的的判断，componentWillReceiveProps 会在输入框的 change/blur 之后各种执行（没找到原因）
     * 从而导致这里是 props 一直覆盖 state
     * 所以这里判断如果有 cache 就不更新了
     */
    if (nextProps.song && !this.state.cache.name) {
      this.setState({
        cache: nextProps.song,
        image: nextProps.song.image ? nextProps.song.image : null,
        selectImage: nextProps.song.image ? nextProps.song.image : null
      })
    }
    return true
  }

  /**
   * 关闭或取消选择图片
   */
  handleCloseSelectImageModal = () => {
    this.setState({
      selectImageModalVisible: false,
      // selectImage: null,
      showImageSelectError: !this.state.image
    })
  }

  /**
   * 确认选择图片，选择图片的容器点击确定之后
   */
  handleOKSelectImageModal = () => {
    if (!this.state.selectImage) {
      message.error('请选择歌曲封面图片(-10000)')
      return
    }
    this.setStore('image', this.state.selectImage)
    this.setState({
      selectImageModalVisible: false,
      image: this.state.selectImage,
      // 清空掉选择的图片
      selectImage: null,
    })
  }

  /**
   * 显示选择图片容器
   */
  handleShowSelectImageModal = () => {
    this.setState({
      selectImageModalVisible: true
    })
  }

  /**
   * 选择图片（注意，不是确认选择，而是每进行一次选择动作都会进行触发的事件）
   */
  handleSelectImage = (image: ImageModel) => {
    this.setState({
      selectImage: image,
    })
  }

  /**
   * 重置组件状态
   */
  reset = () => {
    songStore.clear()
    this.setState({
      image: null,
      selectImageModalVisible: false,
      selectImage: null,
      showImageSelectError: false,
      cache: {} as any,
      btnCancelIsLoading: false,
      btnSaveIsLoading: false,
    })
  }

  /**
   * 删除文件
   */
  handleCancelAddSong = () => {
    this.setState({
      btnCancelIsLoading: true
    })
    this.props.songStore.removeSongFile(this.state.cache.name).then(returns => {
      if (this.props.onCancel) {
        this.props.onCancel()
      }
      this.setState({
        btnCancelIsLoading: false
      })
      if (returns.success) {
        message.warn('已取消')
        this.reset()
      }
    })
  }

  /**
   * 新增歌曲（补充歌曲详细信息）
   */
  handleAddSong = () => {
    this.props.form.validateFields((err, field: {
      title: string,
      artist: string,
      album: string,
    }) => {
      if (!this.state.image) {
        this.setState({
          showImageSelectError: true,
        })
      }
      if (err || !this.state.image) {
        return
      }
      this.setState({
        btnSaveIsLoading: true,
      })
      const image = this.state.image
      const cache = this.state.cache
      this.props.songStore.saveToList({
        _id: void 0 as any,
        url: void 0 as any,
        name: cache.name,
        key: cache.key,
        mimeType: cache.mimeType,
        size: +cache.size,
        duration: +cache.duration,
        title: field.title,
        artist: field.artist,
        album: field.album,
        image,
      }).then(returns => {
        if (this.props.onSuccess) {
          this.props.onSuccess(returns.data)
        }
        this.setState({
          btnSaveIsLoading: false,
        })
        if (returns.success) {
          message.success('添加成功')
          this.reset()
        }
      })
    })
  }



  render() {
    const getFieldDecorator = this.props.form.getFieldDecorator
    const image = this.state.image ?
      (
        <div
          className={s.formImage}
          style={
            this.state.image ? { backgroundImage: `url(${this.state.image.thumb})` } : {}
          }
        />
      ) : (
        <Icon
          type="picture"
          className={s.iconLarge}
        >
          点击选择歌曲封面
        </Icon>
      )
    return (
      <Form layout="vertical">
        <Row gutter={24}>
          <Col
            span={12}
          >
            <Modal
              title="选择歌曲封面"
              width={'80%'}
              closable={false}
              visible={this.state.selectImageModalVisible}
              onCancel={this.handleCloseSelectImageModal}
              onOk={this.handleOKSelectImageModal}
              okText="确定"
              cancelText="取消"
            >
              <ImageComponent
                imageType={ImageType.Music}
                image={void 0 as any}
                mode="select"
                onSelect={this.handleSelectImage}
                selectImage={this.state.image}
              />
            </Modal>
            <div
              className={`${s.formImageBox} ${this.state.showImageSelectError ? s.error : ''}`}
              onClick={() => { this.handleShowSelectImageModal() }}
            >
              {
                image
              }
            </div>
          </Col>
          <Col
            span={12}
          >
            <FormItem>
              {
                getFieldDecorator(
                  'title',
                  {
                    validateTrigger: ['onChange'],
                    rules: [{ required: true, message: '请输入歌曲名称' }],
                    // initialValue: this.state.cache.title
                  })(
                  <Input
                    placeholder="歌曲名称"
                    autoComplete="off"
                    onChange={this.createHandelChangeSaveToLocal('title')}
                  />
                  )
              }
            </FormItem>
            <FormItem>
              {
                getFieldDecorator(
                  'artist',
                  {
                    validateTrigger: ['onChange', 'onBlur'],
                    rules: [{ required: true, message: '请输入歌手名称' }],
                    // initialValue: this.state.cache.artist
                  })(
                  <Input
                    placeholder="歌手名称"
                    autoComplete="off"
                    onChange={this.createHandelChangeSaveToLocal('artist')}
                  />
                  )
              }
            </FormItem>
            <FormItem>
              {
                getFieldDecorator(
                  'album',
                  {
                    validateTrigger: ['onChange', 'onBlur'],
                    rules: [{ required: true, message: '请输入专辑名称' }],
                    // initialValue: this.state.cache.album
                  })(
                  <Input
                    placeholder="专辑名称"
                    autoComplete="off"
                    onChange={this.createHandelChangeSaveToLocal('album')}
                  />
                  )
              }
            </FormItem>
            <FormItem>
              <Input
                placeholder="歌曲时长"
                autoComplete="off"
                disabled
                value={parseTime(Math.round(this.state.cache.duration))}
              />
            </FormItem>
          </Col>
        </Row>
        <div className={s.formSongContent}>
          <Popconfirm
            title="将会删除上传到文件，确认是否取消？"
            onConfirm={this.handleCancelAddSong}
            okText="是"
            cancelText="否"
          >
            <Button type="danger" loading={this.state.btnCancelIsLoading}>取消</Button>
          </Popconfirm>
          <Button type="primary" loading={this.state.btnSaveIsLoading} onClick={this.handleAddSong}>确定</Button>
        </div>
      </Form >
    )
  }
}

export default Form.create({
  /**
   * 初始化表单的值，因为 antd 表单 input 的 initialValue 只有初次生效
   * 导致了这个表单多次打开，默认显示的值都是第一次的，所以在这里进行数据 merge 到表单
   * 数据的来源可以是 props，也可以是 cache
   * mapPropsToFields 参见：https://ant.design/components/form-cn/#components-form-demo-global-state
   * @param prop 
   */
  mapPropsToFields(props: StateProps) {
    let data = props.song || songStore.val(SONGCACHENAME) as SongModel
    if (data) {
      return {
        title: Form.createFormField({
          value: data.title
        }),
        artist: Form.createFormField({
          value: data.artist
        }),
        album: Form.createFormField({
          value: data.album
        }),
      }
    }
    return {}
  }
})(SongFormComponent) as any