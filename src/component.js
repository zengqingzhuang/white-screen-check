/**
 * @file 白屏检查
 * @auth zengqingzhuang@baidu.com
 */

const Component = require('san').Component;
const join = require('path').join;
const plainState = require('./plain/state');

class Plain extends Component {
    initData() {
        return {
            src: '',
            isShow: false,
            plainState,
            preloadPath: join(__dirname, 'plain', 'preload.js'),
            anchor: this.getAnchor.bind(this),
            constraints: [{to: 'window', attachment: 'together', pin: true}],
            seoCodes: ['emptyTitle', 'emptyMetaDesc', 'emptyMetaKey']
        };
    }

    /**
     * 显示框
     *
     * @param {Element} target - 需要挂靠的元素
     * @param {Object} detail - toolbar配置信息
     */
    show(target, detail) {
        this.data.set('target', target);
        this.data.set('isShow', true);
    }

    closePopover() {
        this.data.set('isShow', false);
        this.data.get('destroy')();
    }

    openSeoUrl() {
        this.data.get('openExternal')('https://smartprogram.baidu.com/docs/develop/api/seo/#setPageInfo/');
    }

    getAnchor() {
        return this.data.get('target');
    }
}

Plain.computed = {
    isShowSeoLink() {
        if (this.data.get('seoCodes').includes(this.data.get('plainCode'))) {
            return true;
        }
        return false;
    }
};

Plain.template = `
    <div>
        <ui-popover
            open="{=isShow=}"
            anchorOrigin="bc"
            targetOrigin="tc"
            getAnchor="{{anchor}}"
            constraints="{{constraints}}"
            excludeSelf="{{false}}"
            overlayClass="plain-overlay-hack"
        >
            <ui-card title="首页白屏检测">
                <div class="plain">
                    <div s-if="!plainCode" class="plain-loading">
                        <ui-icon spin name="loading" scale="{{2}}"></ui-icon>
                        <p>正在检测，请稍后...</p>
                    </div>  
                    <div s-if="plainCode" class="plain-content">
                        <div>{{plainState[plainCode].errMsg}}</div>
                        <span s-if="isShowSeoLink" on-click="openSeoUrl">如何设置页面基础信息</span>
                        <div class="publish-end-btn" on-click="closePopover">确定</div>
                    </div>
                </div>
            </ui-card>
        </ui-popover>
    </div>
`;

module.exports = Plain;
