/**
 * @file 获取像素点
 * @auth zengqingzhuang@baidu.com
 */
const canvas = document.createElement('canvas');
module.exports = src => {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.src = src;
        image.crossOrigin = 'Anonymous';
        image.onload = function () {
            canvas.width = this.width;
            canvas.height = this.height;
            const context = canvas.getContext('2d');
            context.drawImage(image, 0, 0);
            resolve(context.getImageData(0, 0, this.width, this.height).data);
        };
        image.onerror = function () {
            reject('');
        };
    });
};
