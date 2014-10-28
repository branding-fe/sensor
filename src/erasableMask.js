/*******************************************************************************
*     File Name           :     src/erasableMask.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-21 15:45]
*     Last Modified       :     [2014-10-28 17:22]
*     Description         :     可擦除的遮罩功能
********************************************************************************/

define(['util'], function(util) {
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
    }

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
        this.maskedDom.appendChild(this.maskCanvas);
    };

    /**
     * 配置遮罩元素
     * @param {Function} cb 配置结束后的回调，在使用图片的时候要等待图片加载完毕再用图片做画笔
     * @private
     */
    ErasableMask.prototype.configMask = function(cb) {
        var mDom = this.maskedDom;
        var configs = this._configs;

        var width = configs.width ? configs.width :
                    mDom.offsetWidth - mDom.clientLeft - window.parseInt(getComputedStyle(mDom).borderRight);
        var height = configs.height ? configs.height :
                     mDom.offsetHeight - mDom.clientTop - window.parseInt(getComputedStyle(mDom).borderBottom);

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

                cb();
            });
        }
        else {
            ctx.fillStyle = configs.color;
            ctx.fillRect(0, 0, width, height);
            ctx.globalCompositeOperation = 'destination-out';
            cb();
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

        function registerEvent() {
            if (that._configs.showPoint) {
                that.getErasePercent(true);
            }
            that.maskCanvas.addEventListener(startEvent, that, false);
            that.maskCanvas.addEventListener(moveEvent, that, false);
            that.maskCanvas.addEventListener(endEvent, that, false);
            that.maskCanvas.addEventListener(leaveEvent, that, false);
        }
        that.configMask(registerEvent);
        return this;
    };

    /**
     * 清除遮罩
     * @return this
     */
    ErasableMask.prototype.clearMask = function () {
        var ctx = this.maskCanvas.getContext('2d')
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
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

        this.maskCanvas.removeEventListener(startEvent, this, false);
        this.maskCanvas.removeEventListener(moveEvent, this, false);
        this.maskCanvas.removeEventListener(endEvent, this, false);
        this.maskCanvas.removeEventListener(leaveEvent, this, false);
        this.maskedDom.removeChild(this.maskCanvas);
        this.maskCanvas = null;
        return this;
    };

    /**
     * 接收并分发事件
     * @param {Event} event 事件对象
     * @return {Function} 处理事件的函数
     * @private
     */
    ErasableMask.prototype.handleEvent = function(event) {
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
            var eraseRadius = this._configs.radius;
            var ctx = this.maskCanvas.getContext('2d');
            ctx.beginPath();

            // 边缘半透明
            if (this._configs.alphaRadius) {
                var totalRadius = eraseRadius + this._configs.alphaRadius;
                var pat = ctx.createRadialGradient(x, y, eraseRadius,
                                                   x, y, totalRadius);
                pat.addColorStop(0, 'rgba(255, 255, 255, 1)');
                pat.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = pat;
                ctx.arc(x , y, totalRadius, 0, Math.PI * 2);
            }
            else  {
                ctx.arc(x , y, eraseRadius, 0, Math.PI * 2);
            }
            ctx.fill();

            if (this.isTainted) {
                this.eraseRecords.push([x, y]);
            }
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
        var erasePercent = this.getErasePercent();
        if (this._configs.callback) {
            this._configs.callback(erasePercent * 100);
        }
    };

    /**
     * 获取统计点列表
     * @private
     */
    ErasableMask.prototype.generateCheckPoints = function (showPoint) {
        this.checkPoints = [];
        var canvasW = this.maskCanvas.width;
        var canvasH = this.maskCanvas.height;
        var step = this._configs.checkDistance;
        var xPoints = Math.ceil(this.maskCanvas.width / step);
        var yPoints = Math.ceil(this.maskCanvas.height / step);
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
                this.checkPoints.push([curX, curY ,0]);
            }
        }
    }

    /**
     * 计算已经擦除了的比例
     * @private
     */
    ErasableMask.prototype.getErasePercent = function (showPoint) {
        var canvasW = this.maskCanvas.width;
        var canvasH = this.maskCanvas.height;
        var ctx = this.maskCanvas.getContext('2d');
        if (!this.isTainted) {
            var img = ctx.getImageData(0, 0, canvasW, canvasH);
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
            curY = points[i][1]
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
     * @private
     */
    ErasableMask.prototype.getErasePercentByRecord = function () {
        var records = this.eraseRecords;
        var points = this.checkPoints;
        var pointsLen = points.length;
        for (var i = 0, recLen = records.length; i < recLen; i++) {
            for (var j = 0; j < pointsLen; j++) {
                if (points[j][2]) {
                    continue;
                }
                if (this._configs.radius >= this.calculateDis(records[i], points[j])) {
                    points[j][2] = 1;
                }
            }
        }

        var transCount = 0;
        for (var k = 0; k < pointsLen; k++) {
            if (points[k][2]) {
                transCount++;
            }
        }

        return transCount / pointsLen;
    };

    /**
     * 计算两点之间的距离
     * @private
     */
    ErasableMask.prototype.calculateDis = function (pointA, pointB) {
        return Math.sqrt(Math.pow(pointA[0] - pointB[0], 2) + Math.pow(pointA[1] - pointB[1], 2));
    };

    /**
     * 得到canvas生成的图像数据上某一点的颜色值
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


    return ErasableMask;
});
