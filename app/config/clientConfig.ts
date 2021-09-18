export default {
  web: {
    // gateway 配置地址
    // 后端接口地址，仅修改此地址即可
    host: 'http://localhost:8800',
  },
  // jwt 配置
  oauth: {
    jwks: '/.well-known/jwks.json',
    path: '/oauth/token',
    clientId: 'user_client',
    clientSecret: 'test_secret',
    grant_type: 'password',
    scope: 'staff',
    // json-storage 存储名称
    tokenName: 'jwt.token',
    // localStorage 存储名称
    accessTokenName: 'jwt.access_token',
  },
  // clientId 配置
  headers: {
    Authorization: 'Basic dXNlcl9jbGllbnQ6dGVzdF9zZWNyZXQ=',
  },
  graphql: {
    // webSocket 不在使用
    webSocketLink: 'ws://localhost:8880/subscriptions',
    graphql: '/graphql',
  },
  websocket: {
    path: '/socket.io',
    namespace: '/im/staff',
  },
  im: {
    path: '/im',
  },
  bot: {
    path: '/bot',
  },
  customer: {
    path: '/customer',
  },
  dispatcher: {
    path: '/dispatcher',
  },
  oss: {
    path: '/oss',
  },
  message: {
    path: '/message',
  },
  status: {
    path: '/status',
  },
  staff: {
    path: '/staff',
  },
};
