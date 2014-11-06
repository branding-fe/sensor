/*******************************************************************************
*     File Name           :     src/erasableMask.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-21 15:45]
*     Last Modified       :     [2014-11-06 18:14]
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
     * @param {string=} opt_options.image 用于遮罩的图片 默认不用图片
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
     * 生成遮罩元素
     * @private
     */
    ErasableMask.prototype.generateMask = function() {
        this.maskCanvas = document.createElement('canvas');
        var cssStr = 'background-color: transparent;';
        cssStr += 'position: absolute;';
        cssStr += 'z-index: 2;';
        cssStr += 'left: ' + this._configs.left + ';';
        cssStr += 'top: ' + this._configs.top + ';';
        if (this._configs.alpha) {
            cssStr += 'opacity: ' + this._configs.alpha / 100 + ';';
        }
        this.maskCanvas.style.cssText += cssStr;

        var maskedDomStyle = getComputedStyle(this.maskedDom);
        if ('absolute' !== maskedDomStyle.position && 'relative' !== maskedDomStyle.position) {
            this.maskedDom.style.position = 'relative';
        }
        this.originOverflow = maskedDomStyle.overflow;
        this.maskedDom.style.overflow = 'hidden';
        this.maskedDom.appendChild(this.maskCanvas);
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
        var angle = -this._configs.angle;
        var transformStr = util.setCssPrefix('transform');

        var width = configs.width ? configs.width :
                    mDom.offsetWidth - mDom.clientLeft - window.parseInt(getComputedStyle(mDom).borderRight);
        var height = configs.height ? configs.height :
                     mDom.offsetHeight - mDom.clientTop - window.parseInt(getComputedStyle(mDom).borderBottom);

        // 处理刷子图片
        if (configs.eraseImage) {
            this.eraseImage = this.createFloatImage(configs.eraseImage, width / 2 , height / 2,
                                  configs.eraseImageWidth, configs.eraseImageHeight);
            if (angle && !configs.eraseCoverImage) {
                this.eraseImage.style[transformStr] = 'rotate(' + angle + 'deg)';
            }
        }
        // 处理刷子Cover图片
        if (configs.eraseCoverImage) {
            this._isEraseCovered = true;
            this.eraseCoverImage = this.createFloatImage(configs.eraseCoverImage, width / 2 , height / 2,
                                       configs.eraseCoverImageWidth, configs.eraseCoverImageHeight);
            this.eraseCoverImage.style.zIndex = 4;
            this.eraseCoverImage.addEventListener(startEvent, function(e) {
                that.maskedDom.removeChild(that.eraseCoverImage);
                that.eraseImage.style[transformStr] = 'rotate(' + angle + 'deg)';
                that._isEraseCovered = false;
                that.startErase(e);
            }, false);
            this.eraseCoverImage.addEventListener(moveEvent, this, false);
        }


        // 处理logo图片 // customize
        if (configs.logoImage) {
            this.logoImage = document.createElement('div');
            var cssStr = 'background-image: url(' + configs.logoImage + ');background-repeat: no-repeat;';
            cssStr += 'background-size: 100% 100%;';
            cssStr += 'position: absolute;';
            cssStr += 'z-index: 1;';
            cssStr += configs.logoStyle;
            this.logoImage.style.cssText += cssStr;
            this.maskedDom.appendChild(this.logoImage);
            this._logoLeft = this.logoImage.offsetLeft;
            this._logoTop = this.logoImage.offsetTop;

            if (this._configs.logoClickStart) {
                this.logoImage.addEventListener(startEvent, function() {
                    that.start();
                }, false);
            }
        }

        this.maskCanvas.width = width;
        this.maskCanvas.height = height;
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
                var pat = ctx.createPattern(img, 'repeat');
                ctx.fillStyle = pat;
                ctx.fillRect(0, 0, width, height);
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

                cb(ctx);
            });
        }
        else {
            ctx.fillStyle = configs.color;
            ctx.fillRect(0, 0, width, height);
            this.generateCheckPoints();
            ctx.globalCompositeOperation = 'destination-out';

            cb(ctx);
        }
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
        // remve events
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
        function run() {
            if (!that.maskCanvas) {
                return;
            }
            var p = (Date.now() - startTime) / time;
            if (p > 1) {
                that.clearRainDrop();
                ctx.clearRect(0, 0, that.maskCanvas.width, that.maskCanvas.height);
                cb();
                return;
            }
            else {
                toOpacity = (1 - easing(p)) * originOpacity;
                that.maskCanvas.style.opacity = toOpacity;
                util.nextFrame(run);
            }
        }

        if (time) {
            run();
        }
        else {
            this.clearRainDrop();
            ctx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
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
        console.log(event.type);
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
            else if (this._configs.radius) {
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
        var canvasH = this.maskCanvas.height;
        var step = this._configs.checkDistance;
        var xPoints = Math.ceil(this.maskCanvas.width / step);
        var yPoints = Math.ceil(this.maskCanvas.height / step);
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
        console.log(inTimes);
        console.log(caTimes);

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
        if (util.isString(src)) {
            img = document.createElement('div');
            var cssStr = 'background-image: url(' + src + ');background-repeat: no-repeat;';
        }
        else {
            img = src;
        }

        cssStr += 'background-size: 100% 100%;';
        cssStr += 'position: absolute;';
        cssStr += 'z-index: 3;';
        cssStr += 'left: ' + (x - w / 2) + 'px;';
        cssStr += 'top: ' + (y - h / 2) + 'px;';
        cssStr += 'width: ' + w + 'px;';
        cssStr += 'height: ' + h + 'px;';
        img.style.cssText += cssStr;

        this.maskedDom.appendChild(img);
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
        var transformStr = util.setCssPrefix('transform');
        var curAngle = -this._configs.angle;
        var toAngle = curAngle;

        var easing = wave('ease-out');
        var that = this;
        function run() {
            if (!that.maskCanvas) {
                return;
            }
            var p = (Date.now() - startTime) / time;
            if (p > 1) {
                that.maskedDom.removeChild(that.eraseImage);
                cb();
                return;
            }
            else {
                that.eraseImage.style.left = (curX + (toX - curX) * easing(p)) + 'px';
                that.eraseImage.style.top = (curY + (toY - curY) * easing(p)) + 'px';
                that.eraseImage.style.width = oriW * (1 - easing(p)) + 'px';
                that.eraseImage.style.height = oriH * (1 - easing(p)) + 'px';
                toAngle = toAngle >= 360 ? 0 : toAngle + 20;
                that.eraseImage.style[transformStr] = 'rotate(' + toAngle + 'deg)';
                util.nextFrame(run);
            }
        }
        run();
    };


    return ErasableMask;
});
