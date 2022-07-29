export default [
  {
    path: '/user',
    layout: false,
    routes: [{ name: '登录', path: '/user/login', component: './User/Login' }],
  },
  { path: '/welcome', name: '欢迎', icon: 'smile', component: './Welcome' },
  {
    path: '/admin',
    name: '管理页',
    icon: 'crown',
    access: 'canAdmin',
    routes: [
      { path: '/admin/sub-page', name: '二级管理页', icon: 'smile', component: './Welcome' },
    ],
  },
  { name: '查询表格', icon: 'table', path: '/list', component: './TableList' },
  { icon: 'table', path: '/adminer', component: './Adminer' },
  { icon: 'table', path: '/project', component: './Project' },
  { icon: 'table', path: '/activity', component: './Activity' },
  { icon: 'table', path: '/prize', component: './Prize' },
  { icon: 'table', path: '/lucker', component: './Lucker' },
  { path: '/', redirect: '/welcome' },
  { path: '*', component: './404' },
];
