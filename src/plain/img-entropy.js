/**
 * @file 图像熵白屏检测算法
 * @auth zengqingzhuang@baidu.com
 */
const chunk = require('lodash/chunk');
const getPixels = require('./get-pixels');
module.exports = src => {
    return getPixels(src).then(pixels => {
        const data = {};
        const groups = chunk(pixels, 4);
        groups.forEach(items => {
            const key = items.slice(0, 3).toString();
            data[key] = data[key] ? ++data[key] : 1;
        });
        const ret = Object.keys(data).reduce((total, key) => {
            const p = data[key] / groups.length;
            total += p * -Math.log(p);
            return total;
        }, 0);
        return ret;
    }).catch(() => {
        return '';
    });
};
