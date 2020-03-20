/**
 * @file 纯白块数白屏检测算法
 * @auth zengqingzhuang@baidu.com
 */
const os = require('os');
const getPixels = require('./get-pixels');
const join = require('path').join;
const chunk = require('lodash/chunk');
const blockWidth = 40; // 裁剪区块宽度
const blockHeight = 60; // 裁剪区块高度
const whiteValue = '255,255,255'; // 纯白色
module.exports = (src, {fs, nativeImage}) => {
    return new Promise(async res => {
        const image = nativeImage.createFromPath(src);
        const {width, height} = image.getSize();
        const rows = parseInt(height / blockHeight, 10);
        const columns = parseInt(width / blockWidth, 10);
        const total = rows * columns;
        const blockList = [];
        let misCount = 0;
        for (let i = 0; i < total; i++) {
            let fileName = join(os.tmpdir(), `plain_${i}.png`);
            blockList.push(new Promise(async resolve => {
                const cropImg = image.crop({
                    x: i % columns * blockWidth,
                    y: parseInt(i / columns, 10) * blockHeight,
                    width: blockWidth,
                    height: blockHeight
                });
                await fs.writeFile(fileName, cropImg.toPNG());
                getPixels(fileName).then(pixels => {
                    fs.unlink(fileName, () => {});
                    const groups = chunk(pixels, 4);
                    for (let m = 0; m < groups.length; m++) {
                        if (groups[m].slice(0, 3).toString() !== whiteValue) {
                            resolve({
                                isWhite: false
                            });
                            return false;
                        }
                    }
                    resolve({
                        isWhite: true
                    });
                });
            }));
        }
        const rets = await Promise.all(blockList);
        rets.forEach(ret => {
            ret.isWhite && ++misCount;
        });
        res(misCount / total);
    }).then(rate => {
        return rate;
    }).catch(() => {
        return 0;
    });
};
