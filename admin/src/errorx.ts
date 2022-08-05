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
export interface ErrorRespStruct {
  success: boolean;
  data: any | null;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
  traceMessage?: string;
}

// 请求成功发出且服务器也响应了状态码，但http原生状态代码超出了 2xx 的范围
export function RespStatusError(error: any): void {
  if (error.response) {
    message.error('None response! Please retry.');
    throw error;
  }
}


//ServerErrorHandler 服务器错误
export function ServerErrorHandler(error: any): void {
  if (!error.response) {
    message.error('None response! Please retry.');
    // notification.error({
    //   message: "无响应",
    //   description: codeMessage[503],
    // });
    throw error;
  }
}

//RequestError 网络正常，但请求失败，多发生于提交数据不合规范
export function RequestErrorHandler(error: any): void {
  const { response } = error;
  if (response && response.status) {
    const errorText = codeMessage[response.status] || response.statusText;
    const { status, url } = response;
    notification.error({
      message: `请求错误 ${status}: ${url}`,
      description: errorText,
    });
    throw error;
  }
}

/**ResponseErrorHandler 网络正常，但返回数据类型错误，多发生于服务器返回数据映射错误
*如果是服务器错误，检查后端业务代码排错
*如果是身份验证失败，前端需要给予提示，并push到登录页重新登录
*再就是前端代码类型没有约定好
*/
export function ResponseErrorHandler(error: any): void {
  if (error.name === 'TypeError') {
    //判断一下是不是token已经过期了引起的401错误
    const v = verifyTokenExp();
    //过滤验证码请求，该请求不需要token
    //表示token是正常的，那就是访问异常
    if (v === null || error.request.url.split('/')[4] === 'captcha') {
      notification.error({
        description: '服务器出现错误，请稍后重试',
        message: '访问异常',
      });
      throw error;
    }
    //表示都是token引起的问题
    notification.error({
      description: v,
      message: '没有权限',
    });
    throw error;
  }
}

/**LogicErrorHandler 网络正常，与服务器无关
 * 1.一般为逻辑代码请求提交数据有误，导致success 为 false 抛出的错误，导致检查业务代码排错
 * 2.【特例】登录时，提交的数据校验不通过，success 为 false 抛出的错误
 */
export function LogicErrorHandler(error: any): void {
  if (error.name === 'BizError') {
    const errorInfo: ErrorRespStruct | undefined = error.info;
    //如果有错误信息，就显示错误信息
    if (errorInfo) {
      const { errorMessage, showType, traceMessage } = errorInfo;
      showError(errorMessage, showType, traceMessage)
    }else{
      notification.error({
        description: error.message,
        message: "未知错误",
      });
    }

    throw error;
  }
}

//AbortErrorHandler 与网络无关，终止请求，大概率是没有权限，未登录或者登录已过期
export function AbortErrorHandler(error: any): void {
  if (error.name === 'AbortError') {
    message.warn('请求无权限，请先登录');
    throw error;
  }
}

/**
* verifyTokenExp 验证当前token
* 情况①：token不存在，返回未登录，请先登录
* 情况②：token存在，但已经过期，返回登录已过期，请重新登录
* 情况③：token存在，但没有过期，返回服务器错误，请稍后重试，这里返回null
* 情况④：token存在，但格式不对，被篡改，无法parse，返回无权访问，请先登录
*/
export function verifyTokenExp(): string | null {
  const token = localStorage.getItem('jwtToken') || '';
  if (token) {
    try {
      const jwt: API.JwtToken = JSON.parse(token);
      const expTime = new Date(jwt.access_expire);
      if (expTime < new Date()) {
        return '登录已经过期，请重新登录';
      }
      //token未过期
      return null;
    } catch (error) {
      localStorage.removeItem('jwtToken');
      return '无权访问，请先登录';
    }
  }
  return '未登录，请先登录';
}

function showError(errorMessage: string | undefined, showType: ErrorShowType | undefined, traceMessage: string | undefined = undefined) {
  if (traceMessage){
    notification.warn({
      message: errorMessage,
      description: traceMessage,
      placement: 'bottomRight',
    })
    console.info(traceMessage)
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
      notification.open({
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
 * 请求异常处理程序
 * AbortError 中断错误
 * TypeError 类型错误
 * BizError 业务错误
 */
export function errorxHandler(error: any) {
  //请求前被我们主动abort的请求错误，大概率是没有权限，未登录或者登录已过期
  AbortErrorHandler(error)
  //有响应，但响应错误，数据格式错误
  ResponseErrorHandler(error)
  //有响应，属于业务错误
  LogicErrorHandler(error)
  // Axios 的错误
  // 请求成功发出且服务器也响应了状态码，但http原生状态代码超出了 2xx 的范围
  RespStatusError(error)
  // 请求已经成功发起，但没有收到响应
  // \`error.request\` 在浏览器中是 XMLHttpRequest 的实例，
  // 而在node.js中是 http.ClientRequest 的实例
  //服务器错误,请求已经成功发起，但没有收到响应
  ServerErrorHandler(error)
  // 发送请求时出了点问题
  message.error('Request error, please retry.');
};

export const errorx = {
  //错误代码解释
  codeMessage,
  //错误处理
  errorxHandler,
  //服务器错误
  ServerErrorHandler,
  //身份验证错误
  AbortErrorHandler,
  //逻辑错误
  LogicErrorHandler,
  //请求错误
  RequestErrorHandler,
  //响应错误
  ResponseErrorHandler,
  //响应状态错误
  RespStatusError,
}
