/**
 * @file 白屏检测提示信息
 * @auth zengqingzhuang@baidu.com
 */
module.exports = {
    serverUnStart: {
        status: 1001,
        errMsg: '本地server启动失败'
    },
    emptyTitle: {
        status: 1002,
        errMsg: '检测到小程序首页缺少页面基础信息'
    },
    emptyMetaDesc: {
        status: 1003,
        errMsg: '检测到小程序首页缺少页面基础信息'
    },
    emptyMetaKey: {
        status: 1004,
        errMsg: '检测到小程序首页缺少页面基础信息'
    },
    whiteFailed: {
        status: 1006,
        errMsg: '检测到小程序首页疑似白屏，请在”预览“-”WEB预览“中查看'
    },
    interfaceFailed: {
        status: 1007,
        errMsg: '检测到小程序首页疑似白屏，请在”预览“-”WEB预览“中查看'
    },
    scriptError: {
        status: 1008,
        errMsg: '检测到小程序首页疑似白屏，请在”预览“-”WEB预览“中查看'
    },
    webCompile: {
        status: 1010,
        errMsg: 'web产出编译失败'
    }
};
