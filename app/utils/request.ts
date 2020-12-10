import axios from 'axios';
import { getToken } from 'app/electron/jwtStorage';
import tokenConfig from 'app/config/clientConfig';

const axiosInstance = axios.create({
  baseURL: tokenConfig.web.host, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 5000, // request timeout
});

axiosInstance.interceptors.request.use(
  async (config) => {
    // do something before request is sent
    const token = await getToken();
    if (token) {
      // let each request carry token
      // ['X-Token'] is a custom headers key
      // please modify it according to the actual situation
      config.headers.Authorization = `Bearer ${token.access_token}`;
    }
    return config;
  },
  (error) => {
    // do something with request error
    console.log(error); // for debug
    return Promise.reject(error);
  }
);

// Add a response interceptor
axios.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    console.log(error); // for debug
    return Promise.reject(error);
  }
);

export default axiosInstance;
