/**
 * @file 白屏检测webview的preloadjs
 * @auth zengqingzhuang@baidu.com
 */
const {ipcRenderer, remote} = require('electron');
// 默认地理位置信息
const coords = {
    accuracy: 31,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    latitude: 40.0411614,
    longitude: 116.26822299999999,
    speed: null
};
// 统计错误状态
const state = {};
function checkWhiteFuc() {
    let errCode = '';
    const address = `${window.location.protocol}//${window.location.hostname}`;
    if (address !== 'http://127.0.0.1') {
        return ipcRenderer.sendToHost({redirect: true});
    }
    const descObj = document.querySelector('meta[name=description]');
    const keysWordsObj = document.querySelector('meta[name=keywords]');
    if (!document.title) {
        errCode = 'emptyTitle';
    }
    else if (!descObj || !descObj.getAttribute('content')) {
        errCode = 'emptyMetaDesc';
    }
    else if (!keysWordsObj || !keysWordsObj.getAttribute('content')) {
        errCode = 'emptyMetaKey';
    }
    if (errCode) {
        return ipcRenderer.sendToHost({errCode});
    }
    const webStyle = document.getElementById('web-swan-page')
        ? getComputedStyle(document.getElementById('web-swan-page')) : null;
    const size = {
        bottomBarHeight: 0,
        topBarHeight: 0
    };
    if (webStyle) {
        size.bottomBarHeight = parseFloat(webStyle.marginBottom.replace('px', ''));
        size.topBarHeight = parseFloat(webStyle.marginTop.replace('px', ''));
    }
    size.headerHeight = document.querySelector('.web-swan-header')
        ? document.querySelector('.web-swan-header').offsetHeight : 0;
    ipcRenderer.sendToHost({state, size});
}
ipcRenderer.on('getPlainCloudData', (data, cloud) => {
    // 等待页面异步接口渲染完毕，因此需要延迟${waitTime}秒后开始检测
    setTimeout(() => {
        checkWhiteFuc();
    }, cloud.waitTime);
});
// 设置body、html背景色为白色
window.addEventListener('load', () => {
    document.querySelector('html').style.backgroundColor = '#FFF';
    document.body.style.backgroundColor = '#FFF';
});
// 捕获slave代码错误
window.addEventListener('error', err => {
    state.script = {
        code: 'scriptError',
        errMsg: `${err.message}, ${err.filename}, ${err.lineno}行，${err.colno}列`
    };
});
document.addEventListener('DOMContentLoaded', () => {
    const iframe = document.querySelector('iframe[name=webswan]');
    if (!iframe) {
        return;
    }
    const win = iframe.contentWindow;
    iframe.onload = () => {
        // 重写地理位置方法，返回默认位置
        win.navigator.geolocation.getCurrentPosition = function (cb) {
            cb({
                coords,
                timestamp: Date.now()
            });
        };
        // 捕获用户代码错误
        win.addEventListener('error', err => {
            state.script = {
                code: 'scriptError',
                errMsg: `${err.message}, ${err.filename}, ${err.lineno}行，${err.colno}列`
            };
        });
    };
});
// 捕获接口异常错误
remote.session.fromPartition('checkWhiteScreen').webRequest.onCompleted(context => {
    if (/^(http|https):\/\//.test(context.url) && context.statusCode === 418) {
        state.interface = { // 接口418错误
            code: 'interfaceFailed'
        };
    }
});
