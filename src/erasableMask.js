/*******************************************************************************
*     File Name           :     src/erasableMask.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-21 15:45]
*     Last Modified       :     [2014-11-20 17:42]
*     Description         :     可擦除的遮罩功能
********************************************************************************/

define(['util', 'wave'], function(util, wave) {
    /**
     * 给元素添加可擦除的遮罩。
     * @module ErasableMask
     */

    /**
     * @constructor
     * @alias module:ErasableMask
     * @param {Element|string} el 需要遮罩的DOM节点 或 节点的id
     * @param {Object=|Function=} opt_options 配置项 参数为对象时是配置项；参数为函数时，做为配置项的callback值
     * @param {Function=} opt_options.callback 擦除一部分后的回调函数，函数会接收到擦除的百分比
     * @param {string=} opt_options.maskImage 用于遮罩的图片 默认不用图片
     * @param {number=} opt_options.width 遮罩宽度 默认为被遮罩的元素宽度
     * @param {number=} opt_options.height 遮罩高度 默认为被遮罩的元素高度
     * @param {number=} opt_options.left 遮罩style的left值 遮罩为绝对定位 默认0
     * @param {number=} opt_options.top 遮罩style的top值 遮罩为绝对定位 默认0
     * @param {string=} opt_options.color 遮罩层颜色 默认使用背景颜色为#666的遮罩
     * @param {number=} opt_options.alpha 遮罩的透明度 默认为100
     * @param {number=} opt_options.checkDistance 用于计算擦除部分的比例的计算点之间的间距，越小越精确，而执行效率越低
     * @param {number=} opt_options.radius 擦除半径大小
     * @param {number=} opt_options.eraseWidth 擦除宽度
     * @param {number=} opt_options.eraseHeight 擦除高度
     * @param {number=} opt_options.angle 旋转弧度，旋转角度，以弧度计。角度转换为弧度计算 degrees*Math.PI/180
     * @param {number=} opt_options.alphaRadius 擦除外边缘半透明渐变距离
     * @param {boolean=} opt_options.showPoint 显示计算点，默认false
     */
    var ErasableMask = function (el, opt_options) {
        var el = util.getElement(el);
        if (!el) {
            alert('必须要配置使用遮罩的DOM节点。');
            return;
        }

        this.maskedDom = el;

        /**
         * @private
         */
        this._configs = {
            'left': 0,
            'top': 0,
            'color': '#666',
            'alpha': 100,
            'checkDistance': 20,
            'radius': 20,
            'alphaRadius': 10,
            'showPoint': false
        };

        if (util.isFunction(opt_options)) {
            this.setCallback(opt_options);
        }
        else {
            util.extend(this._configs, opt_options || {}, true);
        }
    };

    var hasTouch = 'ontouchstart' in window;
    var startEvent = hasTouch ? 'touchstart' : 'mousedown';
    var moveEvent = hasTouch ? 'touchmove' : 'mousemove';
    var endEvent = hasTouch ? 'touchend' : 'mouseup';
    var leaveEvent = hasTouch ? 'touchcancel' : 'mouseleave';

    /**
     * 设置响应擦除面积百分比改变的回调函数
     * @param {Function} fn 回调函数
     * @return this
     */
    ErasableMask.prototype.setCallback = function(fn) {
        this._configs.callback = fn;
        return this;
    };


    /**
     * 获取用于计算相关尺寸的页面尺寸数据
     * @private
     */
    ErasableMask.prototype.detectViewport = function() {
        var configs = this._configs;
        var mDom = this.maskedDom;
        var viewHeight = document.documentElement.clientHeight;
        var width = configs.width ? configs.width :
                    mDom.offsetWidth - mDom.clientLeft - window.parseInt(getComputedStyle(mDom).borderRightWidth);
        var height = configs.height ? configs.height :
                     mDom.offsetHeight - mDom.clientTop - window.parseInt(getComputedStyle(mDom).borderBottomWidth);
        if (this.maskedDom === document.body) {
            this.maskWidth = width;
            this.maskHeight = height;
            this.calculHeight = viewHeight;
        }
        else {
            this.maskWidth = width;
            this.maskHeight = height;
            this.calculHeight = height;
        }
        this.transformStr = util.setCssPrefix('transform');
    };

    /**
     * 生成遮罩元素
     * @private
     */
    ErasableMask.prototype.generateMask = function() {
        this.maskCanvas = document.createElement('canvas');
        var cssStr = 'background-color: transparent;';
        cssStr += 'position: absolute;';
        cssStr += 'z-index: 2;';
        cssStr += 'left: ' + this._configs.left + 'px;';
        cssStr += 'top: ' + this._configs.top + 'px;';
        this.maskCanvas.style.cssText += cssStr;

        var maskedDomStyle = getComputedStyle(this.maskedDom);
        if ('absolute' !== maskedDomStyle.position && 'relative' !== maskedDomStyle.position) {
            this.maskedDom.style.position = 'relative';
        }
        this.originOverflow = maskedDomStyle.overflow || '';
        this.maskedDom.style.overflow = 'hidden';
        if (this._configs.alpha) {
            this.setOpacity(this._configs.alpha);
        }
        this.maskedDom.appendChild(this.maskCanvas);
    };

    /**
     * 设置遮罩元素透明度
     * @param {number} val 设置遮罩元素的透明度
     * @return this
     */
    ErasableMask.prototype.setOpacity = function(val) {
        this.maskCanvas.style.opacity = val / 100;
        this._configs.alpha = val;
        return this;
    };

    /**
     * 配置遮罩元素
     * @param {Function} cb 配置结束后的回调，在使用图片的时候要等待图片加载完毕再用图片做画笔
     * @private
     */
    ErasableMask.prototype.configMask = function(cb) {
        var that = this;
        var mDom = this.maskedDom;
        var configs = this._configs;

        this.detectViewport();

        // 处理刷子图片
        if (configs.eraseImage) {
            this.createEraseImage();
        }
        // 处理刷子Cover图片
        if (configs.eraseCoverImage) {
            this.createEraseCoverImage();
        }

        // 创建指数tip文本
        if (configs.eraseCoverText) {
            this.airIndexTip = this.buildAirIndexTip(this.maskWidth / 2 , this.calculHeight / 2, configs.eraseCoverImageWidth, configs.eraseCoverImageHeight);
            this.buildAirIndexText(configs.eraseCoverText, configs.eraseCoverTextDesc);
        }

        // 处理logo图片 // customize
        if (configs.logoImage) {
            this.handleLogo();
        }

        this.setMaskSize(cb);

    };

    /**
     * 设置遮罩的尺寸
     * @private
     */
    ErasableMask.prototype.setMaskSize = function (cb) {
        var that = this;
        var mDom = this.maskedDom;
        var configs = this._configs;

        this.maskCanvas.width = this.maskWidth;
        this.maskCanvas.height = this.maskHeight;
        var mDomRectRect = mDom.getBoundingClientRect();
        this._offsetX = mDomRectRect.left + document.body.scrollLeft + mDom.clientLeft;
        this._offsetY = mDomRectRect.top + document.body.scrollTop + mDom.clientTop;

        var ctx = this.maskCanvas.getContext('2d');
        if (configs.maskImage) {
            var that = this;
            var img = document.createElement('img');
            img.src = configs.maskImage;
            img.style.display = 'none';
            document.body && document.body.appendChild(img);
            img.addEventListener('load', function() {
                ctx.drawImage(img, 0, 0, that.maskWidth, that.maskHeight);
                ctx.globalCompositeOperation = 'destination-out';
                document.body && document.body.removeChild(img);
                img = null;
                that.generateCheckPoints();

                // 查看canvas是否被tainted
                try {
                    ctx.getImageData(0, 0, 1, 1);
                }
                catch (e) {
                    that.isTainted = true;
                }

                cb && cb(ctx);
            }, false);
        }
        else {
            ctx.fillStyle = configs.color;
            ctx.fillRect(0, 0, this.maskWidth, this.maskHeight);
            this.generateCheckPoints();
            ctx.globalCompositeOperation = 'destination-out';

            cb && cb(ctx);
        }
    };

    /**
     * 创建用于擦除的图片
     * @private
     */
    ErasableMask.prototype.createEraseImage = function () {
        var configs = this._configs;
        var angle = -configs.angle;

        this.eraseImage = this.createFloatImage(configs.eraseImage, this.maskWidth / 2 , this.calculHeight / 2,
                              configs.eraseImageWidth, configs.eraseImageHeight);
        if (angle && !configs.eraseCoverImage) {
            this.eraseImage.style[this.transformStr] = 'rotate(' + angle + 'deg)';
        }
    };

    /**
     * 创建覆盖在擦除图片上的提示文字
     * @private
     */
    ErasableMask.prototype.createEraseCoverImage = function () {
        var configs = this._configs;
        var angle = -configs.angle;
        this._isEraseCovered = true;
        var width = this.maskWidth;
        var height = this.calculHeight;
        this.eraseCoverImage = this.createFloatImage(configs.eraseCoverImage, width / 2 , height / 2,
                                   configs.eraseCoverImageWidth, configs.eraseCoverImageHeight);
        this.eraseCoverImage.style.zIndex = 4;

        var that = this;
        this.eraseCoverImage.addEventListener(startEvent, function(e) {
            that.maskedDom.removeChild(that.eraseCoverImage);
            that.maskedDom.removeChild(that.eraseCoverImageBg);
            that.eraseCoverImage = null;
            that.eraseCoverImageBg = null;
            if (that.airIndexTip) {
                that.maskedDom.removeChild(that.airIndexTip);
                that.airIndexTip = null;
            }
            that.eraseImage.style[that.transformStr] = 'rotate(' + angle + 'deg)';
            that._isEraseCovered = false;
            that.startErase(e);
        }, false);
        this.eraseCoverImage.addEventListener(moveEvent, this, false);
        this.eraseCoverImage.addEventListener(endEvent, this, false);

        // 发光波纹
        this.eraseCoverImageBg = this.createFloatDom('div', width / 2 , height / 2,
                                   80, 80, function (dom) {
            that.createAnim(dom, width / 2, height / 2);
            var cssStr = 'z-index: 3;background-color: #20b9e4; opacity: 0.4;border-radius:50px;';
            dom.style.cssText += cssStr;
        });
        this.eraseCoverImage.style.zIndex = 4;
    };


    /**
     * 创建发光波纹的动画
     * @private
     */
    ErasableMask.prototype.createAnim = function (dom, x, y) {
        if (this.preStyleDom) {
            document.head.removeChild(this.preStyleDom);
        }
        var sensorAddStyle = document.createElement('style');
        var sState = 'width:80px;height:80px;left:' + (x - 40) + 'px;' +
                    'top:' + (y - 40) + 'px;opacity: 0.4;border-radius:40px;';
        var mState = 'width:80px;height:80px;left:' + (x - 40) + 'px;' +
                    'top:' + (y - 40) + 'px;opacity: 0;border-radius:40px;';
        var eState = 'width:150px;height:150px;left:' + (x - 75) + 'px; ' +
                    'top:' + (y - 75) + 'px;opacity: 0;border-radius:75px;';

        this.preStyleDom = sensorAddStyle;
        this.preStyleIdx = this.preStyleIdx ? this.preStyleIdx + 1 : 1;

        sensorAddStyle.innerHTML = '@-webkit-keyframes sensorCoverBigger' + this.preStyleIdx + ' {' +
                '0%{' + sState + '}' +
                '90%{' + eState + '}' +
                '95%{' + mState + '}' +
                '100%{' + sState + '}}' +
                '@-moz-keyframes sensorCoverBigger {' +
                '0%{' + sState + '}' +
                '90%{' + eState + '}' +
                '95%{' + mState + '}' +
                '100%{' + sState + '}}' +
                '@keyframes sensorCoverBigger {' +
                '0%{' + sState + '}' +
                '90%{' + eState + '}' +
                '95%{' + mState + '}' +
                '100%{' + sState + '}}';
        var cssStr = '-webkit-animation:sensorCoverBigger' + this.preStyleIdx + ' 2s 1s forwards linear infinite;';
            cssStr += '-moz-animation:sensorCoverBigger' + this.preStyleIdx + ' 2s 1s forwards linear infinite;';
            cssStr += 'animation:sensorCoverBigger' + this.preStyleIdx + ' 2s 1s forwards linear infinite;';
        dom.style.cssText += cssStr;
        document.head.appendChild(sensorAddStyle);
    };
    /**
     * 处理logo customize
     * @private
     */
    ErasableMask.prototype.handleLogo = function () {
        var configs = this._configs;

        if (util.isString(configs.logoImage)) {
            if (configs.logoDom) {
                this.logoImage = util.getElement(configs.logoDom);
            }
            else {
                this.logoImage = document.createElement('div');
            }
            var cssStr = 'background-image: url(' + configs.logoImage + ');background-repeat: no-repeat;';
            cssStr += 'background-size: 100% 100%;';
            this.logoImage.style.cssText += cssStr;
            if (configs.logoLink) {
                var logoImageStyle = getComputedStyle(this.logoImage);
                if ('absolute' !== logoImageStyle.position && 'relative' !== logoImageStyle.position) {
                    this.logoImage.style.position = 'relative';
                }
                var link = document.createElement('a');
                link.href = configs.logoLink;
                link.style.cssText = 'position:absolute;width:100%;height:100%;'
                this.logoImage.appendChild(link);
            }
            if (!configs.logoDom) {
                this.maskedDom.appendChild(this.logoImage);
            }
        }
        else  {
            this.logoImage = configs.logoImage;
        }
        var offset = util.getOffset(this.logoImage);
        this._logoLeft = offset[0];
        this._logoTop = offset[1];

        var that = this;
        this.logoImage.addEventListener(startEvent, function() {
            if (that._configs.logoClickStart) {
                that.start();
            }
            if (that.onLogoClick) {
                that.onLogoClick();
            }
        }, false);
    };

    /**
     * 重新计算遮罩和内部元素的大小位置
     * @return this
     */
    ErasableMask.prototype.refreshMaskSize = function () {
        var configs = this._configs;
        this.detectViewport();
        this.setMaskSize();


        var width = this.maskWidth;
        var height = this.calculHeight;

        // 处理刷子图片
        if (this.eraseImage) {
            this.eraseImage.style.left = (width - configs.eraseImageWidth) / 2 + 'px';
            this.eraseImage.style.top = (height - configs.eraseImageHeight) / 2 + 'px';
        }

        // 处理刷子Cover图片
        if (this.eraseCoverImage) {
            this.eraseCoverImage.style.left = (width - configs.eraseCoverImageWidth) / 2 + 'px';
            this.eraseCoverImage.style.top = (height - configs.eraseCoverImageHeight) / 2 + 'px';
        }

        // 处理刷子Cover图片 背景波纹
        if (this.eraseCoverImageBg) {
            this.eraseCoverImageBg.style.left = (width / 2 - 40) + 'px';
            this.eraseCoverImageBg.style.top = (height / 2 - 40) + 'px';
            this.createAnim(this.eraseCoverImageBg, width / 2, height / 2);
        }

        // 处理指数tip文本
        if (this.airIndexTip) {
            this.airIndexTip.style.left = (width - configs.eraseCoverImageWidth) / 2 + 'px';
            this.airIndexTip.style.top = ((height + configs.eraseCoverImageHeight) / 2 - 20) + 'px';
        }

        // 处理logo图片 // customize
        if (this.logoImage) {
            var offset = util.getOffset(this.logoImage);
            this._logoLeft = offset[0];
            this._logoTop = offset[1];
        }

        return this;
    };

    /**
     * 开始响应擦除的动作，并监听已经被擦除了的面积百分比的改变
     * @return this
     */
    ErasableMask.prototype.start = function () {
        var that = this;
        if (!that.maskedDom) {
            return;
        }

        if (!that.maskCanvas) {
            that.generateMask();
        }

        function registerEvent(ctx) {
            if (that._configs.showPoint) {
                that.getErasePercent(true);
            }

            that.maskCanvas.addEventListener(startEvent, that, false);
            that.maskCanvas.addEventListener(moveEvent, that, false);
            that.maskCanvas.addEventListener(endEvent, that, false);
            that.maskCanvas.addEventListener(leaveEvent, that, false);

            if (that.eraseImage) {
                that.eraseImage.addEventListener(startEvent, that, false);
                that.eraseImage.addEventListener(moveEvent, that, false);
                that.eraseImage.addEventListener(endEvent, that, false);
            }
        }
        that.configMask(registerEvent);
        return this;
    };

    /**
     * 清除遮罩
     * @param {number} time 渐渐消失时间 毫秒
     * @param {Function} cb 消失结束后的回调
     * @return this
     */
    ErasableMask.prototype.clearMask = function (time, cb) {
        // remove events
        this.maskCanvas.removeEventListener(startEvent, this, false);
        this.maskCanvas.removeEventListener(moveEvent, this, false);
        this.maskCanvas.removeEventListener(endEvent, this, false);
        this.maskCanvas.removeEventListener(leaveEvent, this, false);

        if (this.eraseImage) {
            this.eraseImage.removeEventListener(startEvent, this, false);
            this.eraseImage.removeEventListener(moveEvent, this, false);
            this.eraseImage.removeEventListener(endEvent, this, false);
        }

        var ctx = this.maskCanvas.getContext('2d');

        var startTime = Date.now();
        var easing = wave('ease-out');

        var originOpacity = this._configs.alpha / 100 || 1;
        var toOpacity;
        var that = this;
        function doClear() {
            that.clearRainDrop();
            ctx.clearRect(0, 0, that.maskCanvas.width, that.maskCanvas.height);
            if (that.eraseCoverImage) {
                that.maskedDom.removeChild(that.eraseCoverImage);
                that.maskedDom.removeChild(that.eraseCoverImageBg);
                that.eraseCoverImage = null;
                that.eraseCoverImageBg = null;
            }
            if (that.airIndexTip) {
                that.maskedDom.removeChild(that.airIndexTip);
                that.airIndexTip = null;
            }
            cb();
        }
        function run() {
            if (!that.maskCanvas) {
                return;
            }
            var p = (Date.now() - startTime) / time;
            if (p > 1) {
                doClear();
                return;
            }
            else {
                toOpacity = (1 - easing(p)) * originOpacity;
                that.maskCanvas.style.opacity = toOpacity;
                that.setRainDropOpacity(toOpacity);
                util.nextFrame(run);
            }
        }

        if (time) {
            run();
        }
        else {
            doClear();
            cb();
        }

        return this;
    };


    /**
     * 停止响应擦除的动作
     * @return this
     */
    ErasableMask.prototype.stop = function () {
        if (!this.maskedDom) {
            return;
        }

        this.maskedDom.removeChild(this.maskCanvas);
        this.maskCanvas = null;
        this.maskedDom.style.overflow = this.maskedDom.originOverflow;
        return this;
    };

    /**
     * 接收并分发事件
     * @param {Event} event 事件对象
     * @return {Function} 处理事件的函数
     * @private
     */
    ErasableMask.prototype.handleEvent = function(event) {
        if (this._isEraseCovered) {
            return;
        }
        switch (event.type) {
            case startEvent:
                return this.startErase(event);
            case moveEvent:
                return this.doErase(event);
            case endEvent:
                return this.endErase(event);
            case leaveEvent:
                return this.endErase(event);
        }
    };

    /**
     * 处理手指按下事件
     * @param {Event} e 事件对象
     * @private
     */
    ErasableMask.prototype.startErase = function (e) {
        e.preventDefault();
        this._startedErase = true;
        this.eraseRecords = [];
    };

    /**
     * 处理手指擦除事件
     * @param {Event} e 事件对象
     * @private
     */
    ErasableMask.prototype.doErase = function (e) {
        e.preventDefault();
        if (this._startedErase) {
            if (e.changedTouches) {
                e = e.changedTouches[e.changedTouches.length - 1];
            }
            var x = (e.clientX + document.body.scrollLeft || e.pageX) - this._offsetX || 0;
            var y = (e.clientY + document.body.scrollTop || e.pageY) - this._offsetY || 0;


            if (this._configs.onStart && !this._firedOnStart) {
                this._configs.onStart(x, y);
                this._firedOnStart = true;
            }

            if (this.eraseImage) {
                this.eraseImage.style.left = (x - this.eraseImage.offsetWidth / 2) + 'px';
                this.eraseImage.style.top = (y - this.eraseImage.offsetHeight / 2) + 'px';
            }
            var eraseRadius = this._configs.radius;
            var ctx = this.maskCanvas.getContext('2d');
            ctx.beginPath();

            // 方
            if (this._configs.eraseWidth) {
                ctx.fillStyle = '#000';
                // this.eraseRect(ctx, x, y, this._configs.eraseWidth, this._configs.eraseHeight, -this._configs.angle);
                // 使用椭圆，擦除时边缘更平滑
                this.eraseOval(ctx, x, y, this._configs.eraseWidth, this._configs.eraseHeight, -this._configs.angle, this._configs.alphaRadius);
                ctx.fillStyle = '#000';
            }
            // 圆
            else if (eraseRadius) {
                this.eraseCircle(ctx, x, y, eraseRadius, this._configs.alphaRadius);
                ctx.fillStyle = '#000';
            }

            if (this.isTainted) {
                this.eraseRecords.push([x, y]);
            }

            this._prevX = x;
            this._prevY = y;
        }
        else {
            this._prevX = 0;
            this._prevY = 0;
        }
    };

    /**
     * 绘制canvas一个圆形范围
     * @param {Object} ctx canvas用于绘图的对象
     * @param {number} x 圆形的x坐标
     * @param {number} y 圆形的y坐标
     * @param {number} r 圆形的半径
     * @param {number} alpha 边缘模糊的长度
     * @private
     */
    ErasableMask.prototype.eraseCircle = function (ctx, x, y, r, alpha) {
        ctx.beginPath(); // 避免路径混淆

        // 边缘半透明 // 方形的TOBE CONTINUE
        if (alpha) {
            var totalRadius = r + alpha;
            var pat = ctx.createRadialGradient(x, y, r,
                                               x, y, totalRadius);
            pat.addColorStop(0, 'rgba(255, 255, 255, 1)');
            pat.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = pat;
            ctx.arc(x, y, totalRadius, 0, Math.PI * 2);
        }
        else {
            ctx.arc(x, y, r, 0, Math.PI * 2);
        }
        ctx.fill();
    };

    /**
     * 绘制canvas一个方形范围
     * @param {Object} ctx canvas用于绘图的对象
     * @param {number} x 方形的中心点x坐标
     * @param {number} y 方形的中心点y坐标
     * @param {number} w 方形的宽
     * @param {number} h 方形的高
     * @param {number} a 按中心点顺时针旋转角度
     * @private
     */
    ErasableMask.prototype.eraseRect = function (ctx, x, y, w, h, a) {
        if (a) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(a * Math.PI / 180);
            ctx.fillRect(-w / 2,  -h / 2, w, h); // 坐标点移到了[x, y]
            ctx.restore();
        }
        else {
            ctx.fillRect(x - w / 2, y - h / 2, w, h);
        }
    };

    /**
     * 绘制canvas一个椭圆形范围
     * @param {Object} ctx canvas用于绘图的对象
     * @param {number} x 椭圆形的中心点x坐标
     * @param {number} y 椭圆形的中心点y坐标
     * @param {number} w 椭圆形的宽
     * @param {number} h 椭圆形的高
     * @param {number} a 按中心点顺时针旋转角度
     * @param {number} alpha 边缘模糊的长度
     * @private
     */
    ErasableMask.prototype.eraseOval = function (ctx, x, y, w, h, a, alpha) {
        function fillOval(ox, oy, ow, oh) {
            var k = (ow / 0.6) / 2;
            var h = oh / 2;
            if (alpha) {
                h = h + alpha;
            }
            ctx.beginPath();
            ctx.moveTo(ox, oy - h);
            ctx.bezierCurveTo(ox + k, oy - h, ox + k, oy + h, ox, oy + h);
            ctx.bezierCurveTo(ox - k, oy + h, ox - k, oy - h, ox, oy - h);
            // 边缘半透明 椭圆下效果不咋滴
            if (alpha) {
                var totalWidth = 0;
                var totalHeight = oh + alpha;
                var pat = ctx.createRadialGradient(ox, oy, totalWidth,
                                                   ox, oy, totalHeight);
                pat.addColorStop(0, 'rgba(255, 255, 255, 1)');
                pat.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = pat;
            }
            ctx.fill();
            ctx.closePath();
        }
        if (a) {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(a * Math.PI / 180);
            fillOval(0, 0, w, h);// 坐标点移到了[x, y]
            ctx.restore();
        }
        else {
            fillOval(x, y, w, h);
        }
    };

    /**
     * 结束手指擦除事件
     * @param {Event} e 事件对象
     * @private
     */
    ErasableMask.prototype.endErase = function (e) {
        if (!this._startedErase) {
            return;
        }
        e.preventDefault();
        this._startedErase = false;
        this._firedOnStart = false;
        var erasePercent = this.getErasePercent();
        if (this._configs.callback) {
            this._configs.callback(erasePercent * 100, this._prevX, this._prevY);
        }
    };

    /**
     * 获取统计点列表
     * @private
     */
    ErasableMask.prototype.generateCheckPoints = function () {
        this.checkPoints = [];
        var canvasW = this.maskCanvas.width;
        var canvasH = this.calculHeight;
        var step = this._configs.checkDistance;
        var xPoints = Math.ceil(canvasW / step);
        var yPoints = Math.ceil(canvasH / step);
        var curX;
        var curY;
        for (var i = 0; i < xPoints; i++) {
            for (var j = 0; j < yPoints; j++) {
                if (i === xPoints - 1) {
                    curX = canvasW / 2 + (xPoints - 1) * step / 2;
                }
                else {
                    curX = window.parseInt(step / 2 + i * step);
                }
                if (j === yPoints - 1) {
                    curY = canvasH / 2 + (yPoints - 1) * step / 2;
                }
                else {
                    curY = window.parseInt(step / 2 + j * step);
                }
                // 数组最后一个值用来记录该点是否被擦除了
                this.checkPoints.push([curX, curY, 0]);
            }
        }
    };

    /**
     * 计算已经擦除了的比例
     * @param {boolean} showPoint 是否是显示统计点
     * @return {number=} 擦除面积百分比，用于显示统计点时不返回数据
     * @private
     */
    ErasableMask.prototype.getErasePercent = function (showPoint) {
        var canvasW = this.maskCanvas.width;
        var canvasH = this.maskCanvas.height;
        var ctx = this.maskCanvas.getContext('2d');
        var img;
        if (!this.isTainted) {
            img = ctx.getImageData(0, 0, canvasW, canvasH);
        }

        if (this.isTainted && !showPoint) {
            return this.getErasePercentByRecord();
        }

        var curX;
        var curY;
        var curColor;
        var transCount = 0;

        if (showPoint) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#000';
        }

        var points = this.checkPoints;
        var pointsLen = points.length;

        for (var i = 0; i < pointsLen; i++) {
            curX = points[i][0];
            curY = points[i][1];
            if (!this.isTainted) {
                curColor = this.getColorValue(img, curX, curY);
                if (0 === curColor[3]) {
                    transCount++;
                }
            }

            // 显示用于计算的点，用于测试
            if (showPoint) {
                ctx.fillRect(curX, curY, 1, 1);
            }
        }


        if (showPoint) {
            ctx.globalCompositeOperation = 'destination-out';
        }
        else {
            return transCount / pointsLen;
        }

    };

    /**
     * 由擦除点记录计算擦除面积
     * @return {number} 擦除面积百分比
     * @private
     */
    ErasableMask.prototype.getErasePercentByRecord = function () {
        var records = this.eraseRecords;
        var points = this.checkPoints;
        var pointsLen = points.length;

        var inTimes = 0;
        var caTimes = 0;

        var needCheckArr;
        for (var i = 0, recLen = records.length; i < recLen; i++) {
            needCheckArr = this.getNeedCheckArr(records[i]);
            for (var j = 0; j < pointsLen; j++) {
                inTimes++;
                if (points[j][2]) {
                    continue;
                }
                caTimes++;
                if (this._configs.radius >= this.calculateDis(records[i], points[j])) {
                    points[j][2] = 1;
                }
            }
        }
        //console.log(inTimes);
        //console.log(caTimes);

        var transCount = 0;
        for (var k = 0; k < pointsLen; k++) {
            if (points[k][2]) {
                transCount++;
            }
        }

        return transCount / pointsLen;
    };


    /**
     * 根据手指触摸坐标获得覆盖了的统计点的大致范围，用来减少计算次数 //TODO
     * @param {Array} point 手指当前按下的坐标点
     * @return {Array} 坐标数组
     * @private
     */
    ErasableMask.prototype.getNeedCheckArr = function (point) {
        // var firstCheckPoint = this.checkPoints[0];
        // var r = this._configs.radius;
        // var minX = point[0] - r;
    };

    /**
     * 计算两点之间的距离
     * @param {Array} pointA 第一个点的坐标
     * @param {Array} pointB 第二个点的坐标
     * @return {number} 距离数值
     * @private
     */
    ErasableMask.prototype.calculateDis = function (pointA, pointB) {
        return Math.sqrt(Math.pow(pointA[0] - pointB[0], 2) + Math.pow(pointA[1] - pointB[1], 2));
    };

    /**
     * 得到canvas生成的图像数据上某一点的颜色值
     * @param {ImageData} img canvas生成的ImageData对象
     * @param {number} x 验证点x坐标
     * @param {number} y 验证点y坐标
     * @return {Array} 颜色值
     * @private
     */
    ErasableMask.prototype.getColorValue = function (img, x, y) {
        var offset = (x + y * img.width) * 4;
        var red = img.data[offset];
        var green = img.data[offset + 1];
        var blue = img.data[offset + 2];
        var alpha = img.data[offset + 3];
        return [red, green, blue, alpha];
    };

    /**
     * 自动坠落的擦除(雨滴效果)
     * @param {string} src 雨滴图片
     * @param {number} x 开始坠落的中心x点
     * @param {number} y 开始坠落的中心y点
     * @param {number} w 雨滴宽度
     * @param {number} h 雨滴高度
     * @param {number} time 坠落时间毫秒
     * @param {number} distance 坠落距离
     * @return this
     */
    ErasableMask.prototype.rainDrop = function (src, x, y, w, h, time, distance) {
        if (!this.maskCanvas) {
            return;
        }
        var that = this;
        var ctx = this.maskCanvas.getContext('2d');
        var startTime = Date.now();
        var rainImage = that.createFloatImage(src, x + 1, y - 3, w + 6, h + 6);
        var easing = wave('ease-out');

        this.rainDrops = this.rainDrops || [];
        this.rainDrops.push(rainImage);
        var toY;
        function run() {
            if (!that.maskCanvas) {
                return;
            }
            var p = (Date.now() - startTime) / time;
            if (p > 1) {
                that.eraseRect(ctx, x, y + distance / 2, w, distance);
                that.eraseCircle(ctx, x, y + distance, w / 2);
                return;
            }
            else {
                toY = easing(p) * distance;
                that.eraseRect(ctx, x, y + easing(p) * distance / 2, w, toY);
                rainImage.style.top = (y + toY - 3) + 'px';
                util.nextFrame(run);
            }
        }
        this.eraseCircle(ctx, x, y, w / 2);

        run();
        return this;
    };

    /**
     * 清除雨滴
     * @return this
     */
    ErasableMask.prototype.clearRainDrop = function () {
        if (!this.rainDrops || !this.maskedDom) {
            return;
        }
        for (var i = 0, len = this.rainDrops.length; i < len; i++) {
            this.maskedDom.removeChild(this.rainDrops[i]);
        }
        this.rainDrops = [];
        return this;
    };

    /**
     * 设置雨滴雨滴透明度
     * @param {number} opacity 透明度值
     * @return this
     */
    ErasableMask.prototype.setRainDropOpacity = function (opacity) {
        if (!this.rainDrops || !this.maskedDom) {
            return;
        }
        for (var i = 0, len = this.rainDrops.length; i < len; i++) {
            this.rainDrops[i].style.opacity = opacity;
        }
        return this;
    };

    /**
     * 创建一个在浮在canvas上面的DOM元素
     * @param {string=|Element=} tag DOM标签或DOM对象 默认div
     * @param {number} x DOM元素放置的中心x点
     * @param {number} y DOM元素放置的中心y点
     * @param {number} w DOM元素宽度
     * @param {number} h DOM元素高度
     * @param {Function=} onBeforeAppend 元素插入前的回调
     * @return {Element} DOM对象
     * @private
     */
    ErasableMask.prototype.createFloatDom = function (tag, x, y, w, h, onBeforeAppend, zIndex) {
        var dom;
        var cssStr;
        if (!tag) {
            tag = 'div';
        }
        if (util.isString(tag)) {
            dom = document.createElement(tag);
        }
        else {
            dom = tag;
        }

        var cssStr = 'position: absolute;';
        cssStr += 'z-index: ' + (zIndex | 3) + ';';
        cssStr += 'left: ' + (x - w / 2) + 'px;';
        cssStr += 'top: ' + (y - h / 2) + 'px;';
        cssStr += 'width: ' + w + 'px;';
        cssStr += 'height: ' + h + 'px;';
        dom.style.cssText += cssStr;


        if (util.isFunction(onBeforeAppend)) {
            onBeforeAppend(dom);
        }

        this.maskedDom.appendChild(dom);
        return dom;
    };

    /**
     * 创建一个在浮在canvas上面的图片
     * @param {string|Element} src 图片地址或图片DOM对象
     * @param {number} x 图片放置的中心x点
     * @param {number} y 图片放置的中心y点
     * @param {number} w 图片宽度
     * @param {number} h 图片高度
     * @return {Element} 图片DOM对象
     * @private
     */
    ErasableMask.prototype.createFloatImage = function (src, x, y, w, h) {
        var img;
        var cssStr;
        var domTag = 'div';
        if (!util.isString(src)) {
            domTag = src;
        }
        img = this.createFloatDom(domTag, x, y, w, h, function(dom) {
            if (util.isString(src)) {
                var cssStr = 'background-image: url(' + src + ');background-repeat: no-repeat;';
                cssStr += 'background-size: 100% 100%;';
                dom.style.cssText += cssStr;
            }
        }, 3);

        return img;
    };

    /**
     * 旋转刷子到logo的位置 customize
     * @param {number} time 到logo位置的时间 毫秒
     * @param {Function} cb 到位置后的回调
     * @return this
     */
    ErasableMask.prototype.rotateEraseImage = function (time, cb) {
        var startTime = Date.now();
        var oriW = this.eraseImage.offsetWidth;
        var oriH = this.eraseImage.offsetHeight;
        var curX = window.parseInt(this.eraseImage.style.left);
        var curY = window.parseInt(this.eraseImage.style.top);
        var toX = this._logoLeft + this.logoImage.offsetWidth / 2;
        var toY = this._logoTop + this.logoImage.offsetHeight / 2;
        var curAngle = -this._configs.angle;
        var toAngle = curAngle;

        var easing = wave('ease-out');
        var cssStr;
        var that = this;
        function run() {
            if (!that.maskCanvas) {
                return;
            }
            var p = (Date.now() - startTime) / time;
            if (p > 1) {
                that.maskedDom.removeChild(that.eraseImage);
                that.eraseImage = null;
                cb();
                return;
            }
            else {
                toAngle = toAngle >= 360 ? 0 : toAngle + 20;
                cssStr = "left:" + (curX + (toX - curX) * easing(p)) + 'px;' +
                         "top:" + (curY + (toY - curY) * easing(p)) + 'px;' +
                         "width:" + oriW * (1 - easing(p)) + 'px;' +
                         "height:" + oriH * (1 - easing(p)) + 'px';
                that.eraseImage.style.cssText += cssStr;
                that.eraseImage.style[that.transformStr] = 'rotate(' + toAngle + 'deg)';
                util.nextFrame(run);
            }
        }
        if (time) {
            run();
        }
        else {
            this.maskedDom.removeChild(this.eraseImage);
            this.eraseImage = null;
            cb();
        }
    };

    /**
     * 创建空气指数tip customize
     * @param {number} x tip元素放置的中心x点
     * @param {number} y tip元素放置的中心y点
     * @param {number} w tip元素宽度
     * @param {number} h tip元素高度
     * @return this
     */
    ErasableMask.prototype.buildAirIndexTip = function (x, y, w, h) {
        var configs = this._configs;
        var airIndex = configs.eraseCoverText;
        var that = this;
        var tip = this.createFloatDom('div', x, y + h / 2 + 10, w, 50, function(dom) {
            var cssStr = 'font-size: 17px; color: #fff; text-align: center;';
            cssStr += 'text-shadow: 1px 1px 1px #040000;';
            cssStr += '-webkit-text-shadow: 1px 1px 1px #040000;';
            cssStr += '-moz-text-shadow: 1px 1px 1px #040000;';
            cssStr += 'line-height: 21px;';
            dom.style.cssText += cssStr;
        }, 4);
        return tip;
    };

    /**
     * 设置空气指数tip内容 customize
     * @param {string} value 指数值
     * @param {string} desc 值描述
     * @return this
     */
    ErasableMask.prototype.buildAirIndexText = function (value, desc) {
        this.airIndexTip.innerHTML = '<h3 style="padding: 0; margin: 0; line-height: 20px; font-size: 17px;">空气质量指数</h3><p style="margin:0;padding:5px 0;font-size: 24px;">' + value +
                    '<i style="display: inline-block; min-width: 50px; line-height: 16px;height: 16px; color: #fff; background-color: #0996d1;' +
                    'text-shadow: none;-webkit-text-shadow: none;-moz-text-shadow: none;' +
                    '-webkit-border-radius: 16px;-moz-border-radius: 16px;border-radius: 16px;margin-left:5px;font-style: normal;font-size: 13px;font-weight: normal;vertical-align: top;margin-top: 2px;padding: 0 5px;">' +
                    desc + '</i></p>';
        return this;
    };

    return ErasableMask;
});
