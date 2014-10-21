/*******************************************************************************
*     File Name           :     src/erasableMask.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-21 15:45]
*     Last Modified       :     [2014-10-21 18:11]
*     Description         :     可擦除的遮罩功能
********************************************************************************/

define(['util'], function(util) {
    /**
     * @constructor
     * @param {Element|string} el 需要遮罩的DOM节点 或 节点的id
     * @param {Object=|Function=} opt_options 配置项 参数为对象时是配置项；参数为函数时，做为配置项的callback值
     * @param {number=} opt_options.maskImage 用于遮罩的图片 默认不用图片
     * @param {number=} opt_options.color 遮罩层颜色 默认使用背景颜色为#666的遮罩
     * @param {number=} opt_options.maskTransparent 遮罩的透明度 默认为50
     */
    function ErasableMask(el, opt_options) {
        if ('[object String]' === Object.prototype.toString.call(el)) {
            el = document.getElementById(el);
        }
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
            color: '#666',
            maskTransparent: 50
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
        this.maskedDom.appendChile(this.maskCanvas);
    };

    /**
     * 配置遮罩元素
     * @param {Function} cb 配置结束后的回调，在使用图片的时候要等待图片加载完毕再用图片做画笔
     */
    ErasableMask.prototype.configMask = function(cb) {
        var width = this.maskedDom.offsetWidth;
        var height = this.maskedDom.offsetHeight;
        this.maskCanvas.width = width;
        this.maskCanvas.height = height;
        var ctx = this.maskCanvas.getContext('2d');
        if (this._configs.maskImage) {
            var img = document.createElement('img');
            img.src = this._configs.maskImage;
            document.body && document.body.appendChild(img);
            img.addEventListener('load', function() {
                var pat = ctx.createPattern(img, "repeat");
                ctx.fillStyle = pat;
                ctx.fillRect(0, 0, width, height):
                cb();
            });
        }
        else {
            ctx.fillStyle = this._configs.color;
            ctx.fillRect(0, 0, width, height):
            cb();
        }
    };

    /**
     * 开始响应擦除的动作，并监听已经被擦除了的面积百分比的改变
     * @return {boolean} this
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
            that.maskCanvas.addEventListener(startEvent, that, false);
            that.maskCanvas.addEventListener(moveEvent, that, false);
            that.maskCanvas.addEventListener(endEvent, that, false);
        }
        that.configMask(registerEvent);
    };

    /**
     * 接收并分发事件
     * @param {Event} event 事件对象
     * @return {Function} 处理事件的函数
     */
    ErasableMask.prototype.handleEvent = function(event) {
        switch(event.type) {
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
        if(this._startedErase) {
            if(e.changedTouches){
                e=e.changedTouches[e.changedTouches.length-1];
            }
            var x = (e.clientX + document.body.scrollLeft || e.pageX) - offsetX || 0,
            y = (e.clientY + document.body.scrollTop || e.pageY) - offsetY || 0;
            var ctx = this.maskCanvas.getContext('2d');
            with(ctx) {
                beginPath()
                arc(x, y, 20, 0, Math.PI * 2);
                fill();
            }
        }
    };

    /*
     * 结束手指擦除事件
     * @param {Event} e 事件对象
     */
    ErasableMask.prototype.endErase = function (e) {
        e.preventDefault();
        this._startedErase = false;
    };

    // 停止响应擦除的动作
    ErasableMask.prototype.stop = function () {
        if (!this.maskedDom) {
            return;
        }

        this.maskCanvas.removeEventListener(startEvent, this, false);
        this.maskCanvas.removeEventListener(moveEvent, this, false);
        this.maskCanvas.removeEventListener(endEvent, this, false);
    };
});
