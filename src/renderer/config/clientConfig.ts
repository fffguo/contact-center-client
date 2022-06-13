class ClientConfig {
  web = {
    // gateway 配置地址
    // 后端接口地址，仅修改此地址即可
    host:
      process.env.NODE_ENV === 'production'
        ? 'https://im.xbcs.top'
        : 'http://localhost:8080',
  };

  kibanaBae = {
    baseUrl:
      process.env.NODE_ENV === 'production'
        ? 'https://xbcs.top:5601'
        : 'http://192.168.50.105:5601',
  };

  // jwt 配置
  oauth = {
    jwks: '/.well-known/jwks.json',
    path: '/oauth/token',
    clientId: 'Xsrr8fXfGJ',
    clientSecret: 'K&wroZ4M6z4@a!W62q$*Dks',
    grant_type: 'password',
    scope: 'staff',
    // json-storage 存储名称
    tokenName: 'jwt.token',
    // localStorage 存储名称
    accessTokenName: 'jwt.access_token',
  };

  // clientId 配置
  headers = {
    Authorization: `Basic ${window.btoa(
      `${this.oauth.clientId}:${this.oauth.clientSecret}`
    )}`,
  };

  graphql = {
    // webSocket 不在使用
    webSocketLink: `${this.web.host}/subscriptions`,
    graphql: '/graphql',
  };

  websocket = {
    path: '/socket.io',
    namespace: '/im/staff',
  };

  im = {
    path: '/im',
  };

  bot = {
    path: '/bot',
  };

  customer = {
    path: '/customer',
  };

  dispatcher = {
    path: '/dispatcher',
  };

  s3 = {
    path: '/s3',
  };

  message = {
    path: '/message',
  };

  status = {
    path: '/status',
  };

  staff = {
    path: '/staff',
  };

  kibana = {
    loginUrl: `${this.kibanaBae.baseUrl}/internal/security/login`,
    defaultSpaceUrl: `${this.kibanaBae.baseUrl}/api/spaces/space/default`,
    dashboardUrl:
      `${this.kibanaBae.baseUrl}/app/dashboards#/view/$dashboardId?embed=true&` +
      '_g=(filters%3A!()%2CrefreshInterval%3A(pause%3A!t%2Cvalue%3A0)%2C' +
      'time%3A(from%3Anow%2Fd%2Cto%3Anow%2Fd))' +
      '&show-query-input=true&show-time-filter=true',
  };
}
const clientConfig = new ClientConfig();

export function getUploadS3ChatImgPath() {
  return `${clientConfig.web.host}${clientConfig.s3.path}/chat/img/${window.orgId}`;
}
export function getUploadS3ChatFilePath() {
  return `${clientConfig.web.host}${clientConfig.s3.path}/chat/file/${window.orgId}`;
}
export function getUploadS3StaffImgPath() {
  return `${clientConfig.web.host}${clientConfig.s3.path}/staff/img/${window.orgId}`;
}
export function getDownloadS3ChatImgPath() {
  return `${clientConfig.web.host}`;
}
export function getDownloadS3ChatFilePath() {
  return `${clientConfig.web.host}`;
}
export function getDownloadS3StaffImgPath() {
  return `${clientConfig.web.host}`;
}

export function getDashboardUrlById(dashboardId: string) {
  return clientConfig.kibana.dashboardUrl.replace('$dashboardId', dashboardId);
}

export default clientConfig;
