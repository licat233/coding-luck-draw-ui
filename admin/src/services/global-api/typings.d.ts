declare namespace API {
  type BaseResp = {
    success: boolean
    message: string
    data?: any
    //如果是失败响应，附带trace信息
    trace?: string
  }
  type JwtToken = {
    access_token: string
    access_expire: number
  }
}
