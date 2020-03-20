/**
 * @file 白屏检查
 * @auth zengqingzhuang@baidu.com
 */

const Plain = require('./component');
const plainImgEntropy = require('./plain/img-entropy');
const plainImgBlock = require('./plain/img-block');
const plainState = require('./plain/state');
const join = require('path').join;
const os = require('os');

module.exports = class {
    constructor(context) {
        this.context = context;
        this.checking = false; // 是否正在检测中
        this.appJsonPath = join(this.context.info.projectInfo.smartProgramDir, 'app.json');
    }

    attach(el) {
        this.component = new Plain({
            data: {
                openExternal: this.context.util.shell.openExternal,
                destroy: this.destroy.bind(this)
            }
        });
        this.component.attach(el);
    }

    onAttach() {
        this.context.event.on('show', async data => {
            if (this.checking) {
                this.component.data.set('isShow', true);
                return;
            }
            this.checking = true;
            this.component.data.set('plainCode', '');
            this.appJson = await this.context.util.fs.readJson(this.appJsonPath);
            this.component.show(document.querySelector(data.selector), data.detail);
            this.checkFirstPage();
        });
    }

    checkFirstPage() {
        const {event, util} = this.context;
        util.request({
            url: `https://b.bdstatic.com/searchbox/icms/searchbox/js/swan-web-config.js?x-bs-version=${Date.now()}`,
            json: true
        }).then(async data => {
            if (data.isCheck) {
                this.plainCloudData = data;
                const rets = await event.send('swan-web.createWebOutPath', {
                    'input': this.context.info.projectInfo.smartProgramDir
                });
                if (rets[0] && rets[0].errno === 0) {
                    return this.startLocalServer(rets[0].data);
                }
                event.send('plain.error', {
                    status: plainState.webCompile.status,
                    errMsg: plainState.webCompile.errMsg
                });
            }
            this.component.closePopover();
        }).catch(() => {
            this.component.closePopover();
        });
    }

    /**
     * 启动本地server
     *
     * @param {Object} rootPath - web产出路径
     */
    startLocalServer(rootPath) {
        this.context.util.net.createServer({
            rootPath,
            type: 'static'
        }).then(server => {
            if (server) {
                this.localServer = server;
                return this.createPlainWebView(server.url);
            }
            this.context.event.send('plain.error', {
                status: plainState.serverUnStart.status,
                errMsg: plainState.serverUnStart.errMsg
            });
            this.component.closePopover();
        });
    }

    /**
     * 创建webview用于白屏检测
     *
     * @param {string} url - 页面地址
     */
    createPlainWebView(url) {
        let webView = document.getElementById('checkWhiteScreen');
        if (!webView) {
            webView = document.createElement('webview');
            webView.addEventListener('did-fail-load', () => {
                this.component.closePopover();
            });
            webView.id = 'checkWhiteScreen';
            webView.partition = 'checkWhiteScreen';
            webView.addEventListener('ipc-message', this.checkPlainWebView.bind(this));
            webView.style.width = '320px';
            webView.style.height = '480px';
            webView.style.position = 'absolute';
            webView.style.zIndex = '-10000';
            webView.useragent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 11_4 like Mac OS X)'
            + ' AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15F79 swan%2F1.13.8%28slave%29'
            + ' swandevtools baiduboxapp/11.2.0 Baiduspider (Baidu; P2 11.4)';
            webView.disablewebsecurity = true;
            webView.webpreferences = 'webSecurity=0';
            webView.preload = join(__dirname, 'plain', 'preload.js');
            webView.addEventListener('dom-ready', () => {
                webView.send('getPlainCloudData', this.plainCloudData);
            });
            document.body.appendChild(webView);
        }
        webView.src = url;
    }

    checkPlainWebView(data) {
        const customData = data.channel;
        if (customData.redirect) { // 页面跳转
            this.destroy();
            return this.component.closePopover();
        }
        const errCode = customData.errCode;
        if (errCode) { // seo检查未通过
            this.context.event.send('plain.error', {
                status: plainState[errCode].status,
                errMsg: plainState[errCode].errMsg
            });
            return this.component.data.set('plainCode', errCode);
        }
        const dpr = window.devicePixelRatio;
        let y = customData.size.headerHeight * dpr;
        let height = 480 * dpr - y;
        if (this.appJson.tabBar && this.appJson.tabBar.list && this.appJson.tabBar.list.length > 0) { // 设置了tabbar
            const pos = this.appJson.tabBar.position || 'bottom';
            if (pos === 'top') {
                y += customData.size.topBarHeight * dpr;
                height -= customData.size.topBarHeight * dpr;
            }
            else {
                height -= customData.size.bottomBarHeight * dpr;
            }
        }
        this.execCheckCalculate(y, height, customData.state);
    }

    /**
     * 执行白屏检测算法
     *
     * @param {number} y - 截图纵坐标
     * @param {number} height - 截图高度
     * @param {Object} state - 错误状态
     */
    execCheckCalculate(y, height, state) {
        const webView = document.getElementById('checkWhiteScreen');
        const dpr = window.devicePixelRatio;
        const {fs, toast} = this.context.util;
        webView.capturePage({
            x: 0,
            y,
            width: 320 * dpr,
            height
        }, async res => {
            const resizedImg = res.resize({width: res.getSize().width / dpr / dpr});
            const fileName = join(os.tmpdir(), 'plain.png');
            await fs.writeFile(fileName, resizedImg.toPNG());
            Promise.all([plainImgBlock(fileName, this.context.util), plainImgEntropy(fileName)]).then(rets => {
                fs.unlink(fileName, () => {});
                if (rets[0] > this.plainCloudData.whiteRate || rets[1] <= this.plainCloudData.entropyValue) { // 白屏
                    this.plainErrorReporter(state);
                    this.component.data.set('plainCode', 'whiteFailed');
                }
                else {
                    this.context.event.send('plain.finish', {});
                    this.component.closePopover();
                    toast.success('小程序检测成功，未发现任何异常');
                }
            }).catch(() => {
                this.component.closePopover();
            });
        });
    }

    /**
     * 白屏检测报错打点统计
     *
     * @param {Object} state - preloadjs检测出状态
     * @return {boolean} - 终止程序
     */
    plainErrorReporter(state) {
        if (!state.script && !state.interface) {
            return this.context.event.send('plain.error', {
                status: plainState.whiteFailed.status,
                errMsg: plainState.whiteFailed.errMsg
            });
        }
        if (state.script) {
            this.context.event.send('plain.error', {
                status: plainState[state.script.code].status,
                errMsg: state.script.errMsg
            });
        }
        if (state.interface) {
            this.context.event.send('plain.error', {
                status: plainState[state.interface.code].status,
                errMsg: plainState[state.interface.code].errMsg
            });
        }
    }

    /**
     * 销毁无用的数据、服务
     *
     */
    destroy() {
        if (this.localServer) {
            this.localServer.close();
            this.localServer = null;
        }
        this.checking = false;
    }
};
