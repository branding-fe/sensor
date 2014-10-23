/*******************************************************************************
*     File Name           :     src/erasableMask.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-21 15:45]
*     Last Modified       :     [2014-10-23 11:01]
*     Description         :     可擦除的遮罩功能
********************************************************************************/

define(['util'], function(util) {
    /**
     * @constructor
     * @param {Element|string} el 需要遮罩的DOM节点 或 节点的id
     * @param {Object=|Function=} opt_options 配置项 参数为对象时是配置项；参数为函数时，做为配置项的callback值
     * @param {Function=} opt_options.callback 擦除一部分后的回调函数，函数会接收到擦除的百分比
     * @param {string=} opt_options.image 用于遮罩的图片 默认不用图片
     * @param {number=} opt_options.width 遮罩宽度 默认为被遮罩的元素宽度
     * @param {number=} opt_options.height 遮罩高度 默认为被遮罩的元素高度
     * @param {number=} opt_options.left 遮罩style的left值 遮罩为绝对定位 默认0
     * @param {number=} opt_options.top 遮罩style的top值 遮罩为绝对定位 默认0
     * @param {string=} opt_options.color 遮罩层颜色 默认使用背景颜色为#666的遮罩
     * @param {number=} opt_options.transparent 遮罩的透明度 默认为100
     * @param {number=} opt_options.checkDistance 用于计算擦除部分的比例的计算点之间的间距，越小越精确，而执行效率越低
     * @param {boolean=} opt_options.showPoint 显示计算点，默认false
     */
    function ErasableMask(el, opt_options) {
        var el = util.getElement(el);
        if (!el) {
            alert('必须要配置使用遮罩的DOM节点。');
            return;
        }

        this.maskedDom = el;

        /**
         * @type {Object} 配置项
         * @private
         */
        this._configs = {
            'left': 0,
            'top': 0,
            'color': '#666',
            'transparent': 100,
            'checkDistance': 20,
            'showPoint': false
        };

        if ('function' === typeof opt_options) {
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
     * @return this 用于链式调用
     */
    ErasableMask.prototype.setCallback = function(fn) {
        this._configs.callback = fn;
        return this;
    };


    /**
     * 生成遮罩元素
     */
    ErasableMask.prototype.generateMask = function() {
        this.maskCanvas = document.createElement('canvas');
        var cssStr = 'background-color: transparent;';
        cssStr += 'position: absolute;';
        cssStr += 'left: ' + this._configs.left + ';';
        cssStr += 'top: ' + this._configs.top + ';';
        if (this._configs.transparent) {
            cssStr += 'opacity: ' + this._configs.transparent / 100 + ';';
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
        this._offsetX = mDom.offsetLeft + mDom.clientLeft;
        this._offsetY = mDom.offsetTop + mDom.clientTop;

        var ctx = this.maskCanvas.getContext('2d');
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, width, height);
        if (configs.maskImage) {
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
    };

    /**
     * 接收并分发事件
     * @param {Event} event 事件对象
     * @return {Function} 处理事件的函数
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

    /*
     * 处理手指按下事件
     * @param {Event} e 事件对象
     */
    ErasableMask.prototype.startErase = function (e) {
        e.preventDefault();
        this._startedErase = true;
    };

    /*
     * 处理手指擦除事件
     * @param {Event} e 事件对象
     */
    ErasableMask.prototype.doErase = function (e) {
        e.preventDefault();
        if (this._startedErase) {
            if (e.changedTouches) {
                e = e.changedTouches[e.changedTouches.length - 1];
            }
            var x = (e.clientX + document.body.scrollLeft || e.pageX) - this._offsetX || 0;
            var y = (e.clientY + document.body.scrollTop || e.pageY) - this._offsetY || 0;
            var ctx = this.maskCanvas.getContext('2d');
            ctx.beginPath();
            ctx.arc(x , y, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    /*
     * 结束手指擦除事件
     * @param {Event} e 事件对象
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

    /*
     * 计算已经擦除了的比例
     */
    ErasableMask.prototype.getErasePercent = function (showPoint) {
        var canvasW = this.maskCanvas.width;
        var canvasH = this.maskCanvas.height;
        var ctx = this.maskCanvas.getContext('2d');
        var img = ctx.getImageData(0, 0, canvasW, canvasH);
        var curX;
        var curY;
        var curColor;
        var step = this._configs.checkDistance;
        var xPoints = Math.ceil(this.maskCanvas.width / step);
        var yPoints = Math.ceil(this.maskCanvas.height / step);
        var transCount = 0;

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

                curColor = this.getColorValue(img, curX, curY);
                if (0 === curColor[3]) {
                    transCount++;
                }
                if (showPoint) { // 显示用于计算的点，用于测试
                    ctx.beginPath();
                    ctx.moveTo(curX, curY);
                    ctx.lineTo(curX, curY + 1);
                    ctx.closePath();
                    ctx.stroke();
                }
            }
        }

        return transCount / (xPoints * yPoints);
    };

    /*
     * 得到canvas生成的图像数据上某一点的颜色值
     */
    ErasableMask.prototype.getColorValue = function (img, x, y) {
        var offset = (x + y * img.width) * 4;
        var red = img.data[offset];
        var green = img.data[offset + 1];
        var blue = img.data[offset + 2];
        var alpha = img.data[offset + 3];
        return [red, green, blue, alpha];
    };

    /*
     * 清除遮罩
     */
    ErasableMask.prototype.clearMask = function () {
        var ctx = this.maskCanvas.getContext('2d');
        ctx.fillRect(0, 0, this.maskCanvas.width, this.maskCanvas.height);
    };

    // 停止响应擦除的动作
    ErasableMask.prototype.stop = function () {
        if (!this.maskedDom) {
            return;
        }

        this.maskCanvas.removeEventListener(startEvent, this, false);
        this.maskCanvas.removeEventListener(moveEvent, this, false);
        this.maskCanvas.removeEventListener(endEvent, this, false);
        this.maskCanvas.removeEventListener(leaveEvent, this, false);
    };

    return ErasableMask;
});
