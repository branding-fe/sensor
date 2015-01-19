/*******************************************************************************
*     File Name           :     src/erasePM25Mask.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-11-18 13:46]
*     Last Modified       :     [2014-11-27 17:47]
*     Description         :     Erase pm2.5 mask with erasableMask
********************************************************************************/

define(['sensor/erasableMask', 'sensor/env'], function(Mask, Env) {
    (function() {
        var hm = document.createElement("script");
        hm.src = "//hm.baidu.com/hm.js?d7cdf65b6ea89fd0a30a2e7b1fe7448c";
        var parent = (document.head || document.getElementsByTagName('head')[0] || document.body);
        parent.insertBefore(hm, parent.firstChild);
    })();


    /**
    * 百度精算
    */
    function bd_jingsuan(url) {
        var img = document.createElement('img');
        img.src = url;
        img.style.display = 'none';
        document.body.appendChild(img);
        img.addEventListener('load', function() {
            document.body.removeChild(img);
        });
    }

    /**
    * 百度统计
    */
    var tongjiHash = [];
    var hashLen;
    var hasTouch = 'ontouchstart' in window;
    var startEvent = hasTouch ? 'touchstart' : 'mousedown';
    function bd_tongji(cat, action, label) {
        if (window['_hmt']) {
            _hmt.push(['_trackEvent', cat, action, label]);
            hashLen = tongjiHash.length;
            if (hashLen > 0) {
                for (var i = 0; i < hashLen; i++) {
                    _hmt.push(['_trackEvent', tongjiHash[i][0], tongjiHash[i][1], tongjiHash[i][2]]);
                }
                tongjiHash = [];
            }
        }
        else {
            tongjiHash.push([cat, action, label]);
        }
    }

    // localStorage设置广告可以重新开启时间
    function setStore(day) {
        if (localStorage) {
            var toDate = new Date();
            toDate.setDate(toDate.getDate() + day);
            toDate.setHours(0);
            toDate.setMinutes(0);
            toDate.setSeconds(0);
            localStorage.setItem('search_pm25_close', toDate.getTime());
        }
    }

    // 通过localStorage判断是否需要打开广告
    // ios5 android2.3及以下不出广告
    function openAd() {
        if (localStorage) {
            var nowDate = new Date().getTime();
            var storDate = localStorage.getItem('search_pm25_close') * 1;
            if (storDate && nowDate < storDate) {
                return false;
            }
        }
        if (Env && Env.os) {
            if (Env.os.ios && parseFloat(Env.os.version) <= 5) {
                return false;
            }
            if (Env.os.android && parseFloat(Env.os.version) <= 2.3) {
                return false;
            }
        }
        return true;
    }


    // 根据质量指数设置雾霾透明度
    function getOpacity(idx) {
        if (idx <= 200) {
            return 70;
        }
        if (idx >= 350) {
            return 100;
        }
        return 100 - (350 - idx) * (30 / 300);
    }


    function genLogo(dom, src, linkHref) {
        var logoImage = document.getElementById(dom);
        var cssStr = 'background-image: url(' + src + ');background-repeat: no-repeat;';
        cssStr += 'background-position: 4px 3px;';
        cssStr += 'background-size: 41px 28px;';
        logoImage.style.cssText += cssStr;

        var logoImageStyle = getComputedStyle(logoImage);
        if ('absolute' !== logoImageStyle.position && 'relative' !== logoImageStyle.position) {
            logoImage.style.position = 'relative';
        }
        var link = document.createElement('a');
        link.href = linkHref;
        link.style.cssText = 'position:absolute;width:100%;height:100%;'
        logoImage.appendChild(link);


        link.addEventListener(startEvent, function() {
            bd_tongji('wise-pm2.5-20141125', 'mobile', 'logo_click');
            bd_jingsuan('http://click.hm.baidu.com/clk?572bf2137c2a77365bc2e58749f6d2d3');
        }, false);
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
    var closeImg = 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/icon_delate.png';
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


    var generated = false;
    function generateMask (configs) {
        var airIdx = configs.airIndex;
        var airText = configs.airIndexText;
        var logoDom = configs.logoDom;

        var logoImage = 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/pm_logo.png'; // logo图片
        var logoLink = 'http://ap.larocheposay.com.cn/mobile/index.html?utm_source=Baidu&utm_medium=alading&utm_term=&utm_content=&utm_campaign=lrp-ap-20141021';
        var logoWidth = configs.logoWidth;
        var logoHeight = configs.logoHeight;
        genLogo(logoDom, logoImage, logoLink);
        if (generated || airIdx <= 100) {
            return;
        }

        if (!openAd()) {
            return;
        }

        generated = true;
        setStore(1);

        bd_jingsuan('http://click.hm.baidu.com/mkt.gif?ai=19ce4a28eb2d6bb027ef967003030c85&et=0');
        bd_jingsuan('http://click.hm.baidu.com/mkt.gif?ai=787912153e7e1e2592c9a2fa38943242&et=0');
        setTimeout(function() { // 等待统计代码加载完
            bd_tongji('wise-pm2.5-20141125', 'mobile', 'open');
        }, 200);

        window.addEventListener('resize', function() {
            if (!mask.maskCanvas) {
                return;
            }
            mask.refreshMaskSize();
        }, false);

        // 第一个参数为被遮罩的DOM元素或DOM元素id
        mask = new Mask(document.body, {
            alpha: getOpacity(airIdx), // 雾霾透明度
            alphaRadius: 10, // 擦除雾霾时的边缘模糊距离
            radius: 80, // 计算擦除半径
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
            logoWidth: logoWidth,
            logoHeight: logoHeight,
            //logoImage: 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/pm_logo.png', // logo图片
            //logoLink: 'http://ap.larocheposay.com.cn/mobile/index.html?utm_source=Baidu&utm_medium=alading&utm_term=&utm_content=&utm_campaign=lrp-ap-20141021',
            logoClickStart: false, // 是否点击logo重新生成遮罩
            onLogoClick: function() {
                bd_tongji('wise-pm2.5-20141125', 'mobile', 'logo_click');
                bd_jingsuan('http://click.hm.baidu.com/clk?572bf2137c2a77365bc2e58749f6d2d3');
            },
            maskImage: maskImage, // 遮罩图片
            closeImg: closeImg,
            onStart: function(x, y) { // 开始擦除，参数是开始擦除的部分相对遮罩的位置
                genRain(x - 10, y + 30, 14, 14, 4000, 400, 200);
                genRain(x - 35, y + 20, 10, 10, 4000, 500, 1000);
                bd_tongji('wise-pm2.5-20141125', 'mobile', 'start');
                bd_jingsuan('http://click.hm.baidu.com/mkt.gif?ai=9c66cd2cebcde14bb150850a6a625756&et=0');
            },
            onClose: function() {
                mask.clearMask(0, stopRain);
                mask.rotateEraseImage(0, stopRain);
                setStore(7);
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
                }
            }
        });
        mask.start();
    }


    return generateMask;
});
