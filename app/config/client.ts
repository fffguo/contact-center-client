const MB = 1024 * 1024;

export default {
    server: process.env.NODE_ENV === 'development' ? '//localhost:8080' : '',

    maxImageSize: MB * 3,
    maxBackgroundImageSize: MB * 5,
    maxAvatarSize: MB * 1.5,

    // client default system setting
    theme: {
        default: {
            primaryColor: '74, 144, 226',
            primaryTextColor: '247, 247, 247',
            backgroundImage: require('../chat/assets/images/background.jpg'),
            aero: false,
        },
        cool: {
            primaryColor: '5,159,149',
            primaryTextColor: '255, 255, 255',
            backgroundImage: require('../chat/assets/images/background-cool.jpg'),
            aero: false,
        },
    },
    sound: 'default',
    tagColorMode: 'fixedColor',

    /**
     * 前端监控: https://yueying.effirst.com/index
     * 值为监控应用id, 为空则不启用监控
     */
    frontendMonitorAppId: process.env.frontendMonitorAppId || '',
};
