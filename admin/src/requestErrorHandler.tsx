import { message, notification } from 'antd';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌、用户名、密码错误）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  405: '请求方法不被允许。',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护中...',
  504: '网关超时。',
  0: '未知错误'
};

// 错误处理方案： 错误类型
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ResponseErrorStruct {
  success: boolean;
  data?: any;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
  traceMessage?: string;
}

/** ***************************************************************************** */

function showError(errorMessage: string | undefined, showType: ErrorShowType | undefined, traceMessage: string | undefined = undefined) {
  if (traceMessage) {
    notification.error({
      message: errorMessage,
      description: traceMessage,
      placement: 'bottomRight',
    })
    return
  }
  switch (showType) {
    case ErrorShowType.SILENT:
      // do nothing
      break;
    case ErrorShowType.WARN_MESSAGE:
      message.warn(errorMessage);
      break;
    case ErrorShowType.ERROR_MESSAGE:
      message.error(errorMessage);
      break;
    case ErrorShowType.NOTIFICATION:
      // 分情况，如果是dev模式，则可显示traceMessage
      notification.warn({
        description: traceMessage,
        message: errorMessage,
      });
      break;
    case ErrorShowType.REDIRECT:
      // TODO: redirect
      break;
    default:
      message.error(errorMessage);
  }
}


/**
 * 自定义错误处理
 * 错误情况分析：
 * ① 本地网络错误，无法访问服务器：name: "AxiosError"，code: "ERR_NETWORK"
 * ② 发起请求时，本地校验token exp后abort请求：name: "AbortError"
 * ③ 服务器响应状态码非200：name: "AxiosError"，code: "ERR_BAD_REQUEST"
 * ④ 服务器响应状态码200，但success为false：name: "BizError"，message: "请求失败"
 * ⑤ 服务器响应状态码200，但没有response.body
 * ⑥ 服务器响应状态码200，但response.body不符合errorStruct规范
 */

function RequestErrorHandler(error: any, opts: any) {
  if (opts?.skipErrorHandler) throw error;
  //case：①
  if (error?.name === "AxiosError" && error?.code === "ERR_NETWORK") {
    message.error("无网络！")
    throw error
  }
  //case：②
  if (error?.name === "AbortError") {
    message.error("网络请求被终止")
    throw error
  }
  //case：③
  if (error?.name === "AxiosError" && error?.code === "ERR_BAD_REQUEST") {
    message.error("服务器响应失败")
    console.log(error)
    throw error
  }
  //case：④
  if (error?.name === "BizError") {
    if (!error?.info?.errorCode) {
      message.error("请求失败")
      throw error
    }
    const info: ResponseErrorStruct = error.info
    if (!info.errorCode) {
      message.error(codeMessage[0])
      throw error
    }
    const errorMessage = info.errorMessage || codeMessage[info.errorCode];
    if (!errorMessage) {
      notification.error({
        message: "未知错误",
        description: error.message,
      })
      throw error
    }
    showError(errorMessage, error.info.showType, error.info.traceMessage)
    throw error
  }
  //case：⑤
  if (!error.response) {
    message.error("无响应数据")
    throw error
  }
  //case：⑥
  if (typeof error.success === 'undefined') {
    message.error("后端响应格式错误")
    throw error
  }
  //其它未知的错误
  notification.error({
    message: "请求失败",
    description: "未知的错误: " + error?.message
  })
  throw error
}

export default RequestErrorHandler;
