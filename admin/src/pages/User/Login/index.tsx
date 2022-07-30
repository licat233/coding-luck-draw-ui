import Footer from '@/components/Footer';
import { login, loginByEmail } from '@/services/global-api/admin';
import { LoginReq, LoginByEmailReq } from '@/services/global-api/adminComponents';
import { CaptchaInfo,CaptchaReq } from '@/services/global-api/captchaComponents';
import { mathCaptcha } from '@/services/global-api/captcha';
import { getFakeCaptcha } from '@/services/ant-design-pro/login';
import {
  AlipayCircleOutlined,
  LockOutlined,
  MailOutlined,
  TaobaoCircleOutlined,
  UserOutlined,
  WeiboCircleOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import {
  LoginForm,
  ProFormCaptcha,
  ProFormCheckbox,
  ProFormText,
} from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Alert, message, Tabs, Input } from 'antd';
import React, { useState, useEffect } from 'react';
import styles from './index.less';

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<Record<string, string | boolean>>({ status: false, type: 'account' });
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const [captcha, setCaptcha] = useState<CaptchaInfo>({ captcha_id: "", base64_image: "" });

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();

    if (userInfo) {
      await setInitialState((s) => ({ ...s, currentUser: userInfo }));
    }
  };

  const captchaParams: CaptchaReq = {
    height: 60,
    width: 150,
    BgColor: {
      R: 254,
      G: 254,
      B: 254,
      A: 254,
    },
  };

  const getCaptchaImage = async () => {
    if (userLoginState.status) return;
    try {
      const result = await mathCaptcha(captchaParams);
      setCaptcha((result as API.BaseResp).data as CaptchaInfo);
    } catch (error) {
      // notification.error({
      //   message: '获取验证码失败！',
      //   description: (error as any).info.errorMessage,
      //   placement: 'bottomRight',
      // });
      message.error('获取验证码失败！');
    }
  };

  useEffect(() => {
    if (captcha.base64_image === "") {
      getCaptchaImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captcha]);

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      let resp: unknown;
      if (type === 'account') {
        // 登录
        resp = await login({ ...values as LoginReq });
      } else if (type === 'email') {
        // 登录
        resp = await loginByEmail({ ...values as LoginByEmailReq });
      } else {
        throw new Error('Invalid login type');
      }
      const msg = resp as API.BaseResp;

      if (msg.success) {
        // const defaultLoginSuccessMessage = '登录成功！';
        // message.success(defaultLoginSuccessMessage);
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        return;
      }

      // console.log(msg); // 如果失败去设置用户错误信息

      setUserLoginState({ status: msg.success, type: type });
    } catch (error) {
      getCaptchaImage();
      // const defaultLoginFailureMessage = '登录失败，请重试！';
      // console.log(error);
      // message.error(defaultLoginFailureMessage);
    }
  };

  const { status, type: loginType } = userLoginState;
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <LoginForm
          logo={<img alt="logo" src="/logo.svg" />}
          title="Ant Design"
          subTitle={'Ant Design 是西湖区最具影响力的 Web 设计规范'}
          initialValues={{
            autoLogin: true,
            passport: 'licat',
            password: 'licat233',
          }}
          actions={[
            '其他登录方式 :',
            <AlipayCircleOutlined key="AlipayCircleOutlined" className={styles.icon} />,
            <TaobaoCircleOutlined key="TaobaoCircleOutlined" className={styles.icon} />,
            <WeiboCircleOutlined key="WeiboCircleOutlined" className={styles.icon} />,
          ]}
          onFinish={async (values) => {
            await handleSubmit({...values, captcha_id: captcha.captcha_id});
          }}
        >
          <Tabs activeKey={type} onChange={setType}>
            <Tabs.TabPane key="account" tab={'账户密码登录'} />
            <Tabs.TabPane key="mobile" tab={'手机号登录'} />
          </Tabs>
          {status === 'error' && loginType === 'account' && (
            <LoginMessage content={'错误的用户名和密码'} />
          )}
          {type === 'account' && (
            <>
              <ProFormText
                name="passport"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined className={styles.prefixIcon} />,
                }}
                placeholder={'用户名: admin or user'}
                rules={[
                  {
                    required: true,
                    message: '用户名是必填项！',
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                placeholder={'密码: ant.design'}
                rules={[
                  {
                    required: true,
                    message: '密码是必填项！',
                  },
                ]}
              />
              <Input.Group compact className={styles.captchagrounp}>
                <div className={styles.captchainput}>
                  <ProFormText
                    name="solution"
                    fieldProps={{
                      size: 'large',
                      prefix: <SafetyCertificateOutlined className={styles.prefixIcon} />,
                    }}
                    allowClear={true}
                    width="xs"
                    placeholder="验证码"
                    rules={[
                      {
                        required: true,
                        message: '请输入验证码！',
                      },
                      {
                        pattern: /^-?\d{1,4}$/,
                        message: '验证码格式错误！',
                      },
                    ]}
                  />
                </div>
                <div className={styles.captchaimg} onClick={getCaptchaImage}>
                  <img src={captcha?.base64_image || ''} />
                </div>
              </Input.Group>
            </>
          )}

          {status === 'error' && loginType === 'email' && <LoginMessage content="验证码错误" />}
          {type === 'email' && (
            <>
              <ProFormText
                fieldProps={{
                  size: 'large',
                  prefix: <MailOutlined className={styles.prefixIcon} />,
                }}
                name="email"
                placeholder={'请输入邮箱地址！'}
                rules={[
                  {
                    required: true,
                    message: '邮箱地址是必填项！',
                  },
                  {
                    pattern: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
                    message: '不合法的邮箱地址！',
                  },
                ]}
              />
              <ProFormCaptcha
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined className={styles.prefixIcon} />,
                }}
                captchaProps={{
                  size: 'large',
                }}
                placeholder={'请输入验证码！'}
                captchaTextRender={(timing, count) => {
                  if (timing) {
                    return `${count} ${'秒后重新获取'}`;
                  }

                  return '获取验证码';
                }}
                name="captcha"
                rules={[
                  {
                    required: true,
                    message: '验证码是必填项！',
                  },
                ]}
                onGetCaptcha={async (phone) => {
                  const result = await getFakeCaptcha({
                    phone,
                  });

                  if (result === false) {
                    return;
                  }

                  message.success('获取验证码成功！验证码为：1234');
                }}
              />
            </>
          )}
          <div
            style={{
              marginBottom: 24,
            }}
          >
            <ProFormCheckbox noStyle name="autoLogin">
              自动登录
            </ProFormCheckbox>
            <a
              style={{
                float: 'right',
              }}
            >
              忘记密码 ?
            </a>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
