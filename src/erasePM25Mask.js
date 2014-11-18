/*******************************************************************************
*     File Name           :     src/erasePM25Mask.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-11-18 13:46]
*     Last Modified       :     [2014-11-18 17:58]
*     Description         :     Erase pm2.5 mask with erasableMask
********************************************************************************/


define(['erasableMask'], function(Mask) {
    // 根据质量指数设置雾霾透明度
    function getOpacity(idx) {
        if (idx <= 50) {
            return 20;
        }
        if (idx >= 350) {
            return 100;
        }
        return 100 - (350 - idx) * (80 / 300);
    }


    var bodyStyle = document.body.style;
    var originUserSelect = bodyStyle.mozUserSelect || bodyStyle.webkitUserSelect;
    bodyStyle.mozUserSelect = 'none';
    bodyStyle.webkitUserSelect = 'none';
    // 雾霾图片
    var maskImage = 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/pm_fog_big.png';
    // 瓶子图片
    var bottleImg = 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/pm_bottle.png';
    // 瓶子遮盖提示图片
    var coverImg = 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/pm_tip.png';
    // logo图片
    var logoImg = 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/pm_logo.png';
    // 水滴图片
    var waterImg = 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/waterdrop.png';
    var airIndex = 130;
    var airIndexText = '轻度污染';

    var mask;
    var rainDrops = 0;
    // 生成雨滴 最多生成5个
    function genRain (x, y, w, h, t, d, l) {
        if (rainDrops >= 5) {
            return;
        }
        rainDrops++;
        setTimeout(function() {
            mask.rainDrop(waterImg, x, y, w, h, t, d);
        }, l);
    }

    var stopFlag = 0;
    // 结束Rain
    function stopRain () {
        stopFlag++;
        if (stopFlag >= 2) {
            mask.stop();
            rainDrops = 0;
            // perDom.innerHTML = '';
            stopFlag = 0;
            bodyStyle.mozUserSelect = originUserSelect;
            bodyStyle.webkitUserSelect = originUserSelect;
        }
    }



    function generateMask (airIdx, airText, logoDom) {
        if (airText != '优' && airText != '良') {
            airText += '污染';
        }
        // 第一个参数为被遮罩的DOM元素或DOM元素id
        mask = new Mask(document.body, {
            alpha: getOpacity(airIdx), // 雾霾透明度
            alphaRadius: 10, // 擦除雾霾时的边缘模糊距离
            radius: 100, // 计算擦除半径
            eraseWidth: 50, // 擦除宽度
            eraseHeight: 140, // 擦除高度
            angle: 45, // 擦除区块逆时针偏转角度
            eraseImage: bottleImg, // 用于擦除的瓶子图片
            eraseImageWidth: 49, // 瓶子宽度
            eraseImageHeight: 134, // 瓶子高度
            eraseCoverImage: coverImg, // 瓶子遮盖提示图片
            eraseCoverImageWidth: 142, // 瓶子遮盖图片宽度
            eraseCoverImageHeight: 196, // 瓶子遮盖图片高度
            eraseCoverText: airIdx, // 空气指数
            eraseCoverTextDesc: airText, // 空气指数对应的文字
            logoDom: logoDom,
            logoImage: 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/pm_logo.png', // logo图片
            logoClickStart: true, // 是否点击logo重新生成遮罩
            maskImage: maskImage, // 遮罩图片
            // color: '#ddd', // 纯色遮罩 用图片时不需要该配置
            // showPoint: true,
            onStart: function(x, y) { // 开始擦除，参数是开始擦除的部分相对遮罩的位置
                genRain(x - 10, y + 30, 14, 14, 4000, 400, 200);
                genRain(x - 35, y + 20, 10, 10, 4000, 500, 1000);
            },
            callback: function(percent, x, y) { // 擦除中的回调，参数为擦除百分比和擦除当前位置相对遮罩的位置
                if (percent >= 5) {
                    genRain(x, y + 20, 8, 8, 4000, 400, 200);
                }
                if (percent >= 15) {
                    genRain(x, y + 30, 12, 12, 5000, 600, 200);
                }
                if (percent >= 25) {
                    genRain(x + 20, y + 20, 9, 9, 5000, 500, 200);
                }
                if (percent >= 40) {

                    mask.clearMask(2000, stopRain);
                    mask.rotateEraseImage(2000, stopRain);
                    // perDom.innerHTML = '已清除全部遮罩';
                }
            }
        });

        // 等页面渲染ok
        setTimeout(function() {
            mask.start();
        }, 100)
    }


    return generateMask;
});
