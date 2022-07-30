declare namespace API {
  type BaseResp = {
    success: boolean
    message: string
    data?: any
    //如果是失败响应，附带trace信息
    trace?: string
  }
  type JwtToken = {
    token: string
    expire: number
  }
}