/*******************************************************************************
*     File Name           :     src/erasePM25Mask.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-12-26 15:23]
*     Last Modified       :     [2015-02-26 19:03]
*     Description         :     Erase pm2.5 mask with erasableMask
********************************************************************************/

define(['sensor/erasableMask', 'sensor/env'], function(Mask, Env) {
    // 加载百度统计代码
    var genBaiduLog = function(configs) {
        var hm = document.createElement("script");
        hm.src = configs.log_src;
        var parent = (document.head || document.getElementsByTagName('head')[0] || document.body);
        parent.insertBefore(hm, parent.firstChild);
    }

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
            _hmt.push(['_trackEvent', cat, cat + '-' + action, cat + '-' + label]);
        }
        else { // 等待统计代码加载完
            tongjiHash.push([cat, cat + '-' + action, cat + '-' + label]);
            checkTongji();
        }
    }

    // 等待百度统计代码加载完，发送未加载前存储的需要发送的统计信息
    function checkTongji() {
        if (window['_hmt']) {
            hashLen = tongjiHash.length;
            if (hashLen > 0) {
                for (var i = 0; i < hashLen; i++) {
                    _hmt.push(['_trackEvent', tongjiHash[i][0], tongjiHash[i][1], tongjiHash[i][2]]);
                }
                tongjiHash = [];
            }
        }
        else {
            setTimeout( function () {
                if (checkTongji) {
                    checkTongji();
                }
            }, 500);
        }
    }

    // localStorage设置广告可以重新开启时间
    function setStore(itemName, day) {
        if (localStorage && itemName) {
            var toDate = new Date();
            toDate.setDate(toDate.getDate() + day);
            toDate.setHours(0);
            toDate.setMinutes(0);
            toDate.setSeconds(0);
            localStorage.setItem(itemName, toDate.getTime());
        }
    }

    // 通过localStorage判断是否需要打开广告
    // ios5 android2.3及以下不出广告
    function openAd(itemName) {
        if (localStorage && itemName) {
            var nowDate = new Date().getTime();
            var storDate = localStorage.getItem(itemName) * 1;
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

        if (Env.browser.firefox) {
            return false;
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

    // 生成logo
    function genLogo(dom, src, linkHref, configs) {
        var logoImage = document.getElementById(dom);
        var cssStr = 'background-image: url(' + src + ');background-repeat: no-repeat;';
        cssStr += 'background-position: top right;';
        cssStr += 'background-size: ' + (configs.logoWidth || 41) + 'px ' + (configs.logoHeight || 28) + 'px;';
        logoImage.style.cssText += cssStr;

        var logoImageStyle = getComputedStyle(logoImage);
        if ('absolute' !== logoImageStyle.position && 'relative' !== logoImageStyle.position) {
            logoImage.style.position = 'relative';
        }
        var link = document.createElement('a');
        link.href = linkHref;
        link.target = '_blank';
        link.style.cssText = 'position:absolute;width:100%;height:100%;';
        logoImage.appendChild(link);


        link.addEventListener(startEvent, function() {
            bd_tongji(configs.log_name, 'mobile', 'logo_click');
            bd_jingsuan(configs.log_logo_click);
        }, false);
    }


    var bodyStyle = document.body.style;
    var originUserSelect = bodyStyle.mozUserSelect || bodyStyle.webkitUserSelect;
    bodyStyle.mozUserSelect = 'none';
    bodyStyle.webkitUserSelect = 'none';
    // 水滴图片
    var waterImg = 'http://bs.baidu.com/public01/bcs-sensor/images/pm2.5/waterdrop.png';
    var closeImg = 'http://bs.baidu.com/public01/bcs-sensor/images/ysld/icon_delate.png';
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


    // ysld configs
    // 雾霾配置项
    var configs = {

        // 雾霾指数
        airIndex: airIndex,

        // 雾霾指数对应的文字
        airIndexText: airIndexText,

        // logo放置的dom id
        logoDom: 'logo',

        // logo图片
        logoImage: '//bs.baidu.com/public01/bcs-sensor/examples/ysld2/logo75x40.png',

        // logo点击跳转链接地址
        logoLink: 'http://www.el-lady.com.cn/node/166?utm_source=baiduPM2.5&utm_medium=cpt&utm_campaign=R1&utm_group=20150101',

        // logo图片宽度
        logoWidth: 50,

        // logo图片高度
        logoHeight: 28,

        // 雾霾图片  // 320 * 480 80K以内 png
        maskImage: '//bs.baidu.com/public01/bcs-sensor/examples/ysld2/pm_fog_big.png',

        // 遮罩上部位置
        top: 90,

        // 擦除雾霾时的边缘模糊距离
        alphaRadius: 10,

        // 擦除半径
        radius: 140,

        // 擦除宽度 擦除图片为长方形时配置
        //eraseWidth: 52.5,

        // 擦除高度 擦除图片为长方形时配置
        //eraseHeight: 130,

        // 擦除区块逆时针偏转角度 擦除图片为长方形时配置
        //angle: -25,

        // 用于擦除的图片
        eraseImage: '//bs.baidu.com/public01/bcs-sensor/examples/ysld2/bottle.png',

        // 遮盖提示图片
        coverImg: '//bs.baidu.com/public01/bcs-sensor/examples/ysld2/pm_tip.png',

        // 雾霾后面垫的图片 // 320 * 200 80K以内 png
        //backgroundImage: '//bs.baidu.com/public01/bcs-sensor/images/volvo/in_car2.png',

        // 百度统计链接地址
        log_src: '//hm.baidu.com/hm.js?5ee8a91a3fd5f238d7debb1734a3695a',

        // 百度统计统计名称
        log_name: 'wise-pm2.5-ysld-20141226',

        // 精算: 显示logo
        log_logo_show: 'http://click.hm.baidu.com/mkt.gif?ai=dd8fbbcf6a9ab9813b34dc4dcb9352d4&et=0&r=' + new Date().getTime(),

        // 精算: 点击logo
        log_logo_click: 'http://click.hm.baidu.com/clk?b409ca8df68b53aec7950be3a277558f',

        // 精算: 打开浮层
        log_open: 'http://click.hm.baidu.com/mkt.gif?ai=24e87606a23cc5bbb591e4c47dbfba45&et=0',

        // 精算: 用户交互
        log_start: 'http://click.hm.baidu.com/mkt.gif?ai=97b9895f56179b261e77599603470109&et=0',

        // localStorage名称用户记录展示之后不再展示的截止时间
        localStorageName: 'search_pm25_ysld2_close',

        // 未点关闭多少个自然天不显示
        not_show_without_close: 1,

        // 点关闭后多少个自然天不显示
        not_show_with_close: 7
    };

    if (location.href.indexOf('tn=zbios') > -1) {
        configs.top = 0;
    }

    var generated = false;
    function generateMask (airIdx, airText, logoDom, maskedDom) {
        configs.airIndex = airIdx || configs.airIndex;
        configs.airIndexText = airText || configs.airIndexText;
        configs.logoDom = logoDom || configs.logoDom;
        configs.maskedDom = maskedDom;

        genBaiduLog(configs);

        var airIdx = configs.airIndex;
        var airText = configs.airIndexText;
        var logoDom = configs.logoDom;
        var logoImage = configs.logoImage; // logo图片
        var logoLink = configs.logoLink;
        var logoWidth = configs.logoWidth || 41;
        var logoHeight = configs.logoHeight || 28;
        // 擦除区块逆时针偏转角度 擦除图片为长方形时配置
        var imgAngle = configs.angle || 45;
        // 雾霾图片
        var maskImage = configs.maskImage;
        // 遮罩上部位置
        var maskTop = configs.top || 0;
        // 瓶子图片
        var bottleImg = configs.eraseImage;
        // 瓶子高度
        var bottleHeight = configs.eraseHeight;
        // 瓶子宽度
        var bottleWidth = configs.eraseWidth;
        // 瓶子遮盖提示图片
        var coverImg = configs.coverImg;
        // 背景底图
        var backgroundImage = configs.backgroundImage;
        // 背景底图宽度
        var backgroundImageWidth = configs.backgroundImageWidth || 320;
        // 背景底图高度
        var backgroundImageHeight = configs.backgroundImageHeight || 152;

        genLogo(logoDom, logoImage, logoLink, configs);
        bd_jingsuan(configs.log_logo_show);
        bd_tongji(configs.log_name, 'mobile', 'logo_show');

        if (generated || airIdx <= 100) {
            return;
        }

        if (!openAd(configs.localStorageName)) {
            return;
        }

        generated = true;
        setStore(configs.localStorageName, configs.not_show_without_close);

        bd_jingsuan(configs.log_open);
        bd_tongji(configs.log_name, 'mobile', 'open');

        window.addEventListener('resize', function() {
            if (!mask.maskCanvas) {
                return;
            }
            mask.refreshMaskSize();
        }, false);

        // 大搜单页模式时，hash改变时消除遮罩
        window.addEventListener('hashchange', function() {
            mask.clearMask(0, stopRain);
            mask.rotateEraseImage(0, stopRain);
        }, false);

        // 第一个参数为被遮罩的DOM元素或DOM元素id
        mask = new Mask(configs.maskedDom || document.body, {
            alpha: getOpacity(airIdx), // 雾霾透明度
            alphaRadius: 10, // 擦除雾霾时的边缘模糊距离
            radius: 80, // 计算擦除半径
            eraseWidth: 50, // 擦除宽度
            eraseHeight: 140, // 擦除高度
            angle: imgAngle, // 擦除区块逆时针偏转角度
            eraseImage: bottleImg, // 用于擦除的瓶子图片
            eraseImageWidth: bottleWidth, // 瓶子宽度
            eraseImageHeight: bottleHeight, // 瓶子高度
            eraseCoverImage: coverImg, // 瓶子遮盖提示图片
            eraseCoverImageWidth: 142, // 瓶子遮盖图片宽度
            eraseCoverImageHeight: 196, // 瓶子遮盖图片高度
            eraseCoverText: airIdx, // 空气指数
            eraseCoverTextDesc: airText, // 空气指数对应的文字
            backgroundImage: backgroundImage, // 背景底图
            backgroundImageWidth: backgroundImageWidth, // 背景底图宽度
            backgroundImageHeight: backgroundImageHeight, // 背景底图高度
            logoDom: logoDom,
            logoWidth: logoWidth,
            logoHeight: logoHeight,
            logoClickStart: false, // 是否点击logo重新生成遮罩
            onLogoClick: function() {
                bd_tongji(configs.log_name, 'mobile', 'logo_click');
                bd_jingsuan(configs.log_logo_click);
            },
            maskImage: maskImage, // 遮罩图片
            top: maskTop,
            closeImg: closeImg,
            onStart: function(x, y) { // 开始擦除，参数是开始擦除的部分相对遮罩的位置
                genRain(x - 10, y + 30, 14, 14, 4000, 400, 200);
                genRain(x - 35, y + 20, 10, 10, 4000, 500, 1000);
                bd_tongji(configs.log_name, 'mobile', 'start');
                bd_jingsuan(configs.log_start);
            },
            onClose: function() {
                mask.clearMask(0, stopRain);
                mask.rotateEraseImage(0, stopRain);
                setStore(configs.localStorageName, configs.not_show_with_close);
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
