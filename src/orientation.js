/*******************************************************************************
*     File Name           :     src/orientation.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-09-15 16:43]
*     Last Modified       :     [2014-09-23 15:52]
*     Description         :     监测移动设备倾斜角度
********************************************************************************/


define(['./util'], function(util) {
    /**
     * @constructor
     * @param {Object|Function} options 配置项 参数为对象时是配置项；参数为函数时，做为配置项的callback值
     * @param {number=} options.alphaThreshold 水平旋转alpha值改变触发回调的临界值
     * @param {number=} options.betaThreshold  前后倾斜beta 值改变触发回调的临界值
     * @param {number=} options.gammaThreshold 左右倾斜gamma值改变触发回调的临界值
     * @param {number=} options.timeInterval 监听倾斜值改变的时间间隔
     * @param {boolean=} options.radians 是否使用弧度值代替角度值
     */
    function Orientation(options) {
        /**
         * @type {boolean} 是否支持监听倾斜
         * @private
         */
        this._hasDeviceOrientation = 'ondeviceorientation' in window;
        /**
         * @type {Object}
         * @private
         */
        this._configs = {
            alphaThreshold: 0,
            betaThreshold: 0,
            gammaThreshold: 0,
            timeInterval: 300,
            radians: false
        };
        /**
         * @type {Object} 记录上一次的倾斜角度/弧度
         * @private
         */
        this._prevAngle = {
            alpha: 0,
            beta: 0,
            gamma: 0
        };
        if ('function' === typeof options) {
            this.setCallback(options);
        }
        else {
            util.extend(this._configs, options, true);
        }
    }

    /**
     * 设置响应倾斜的回调函数
     * @param {Function} fn 回调函数
     */
    Orientation.prototype.setCallback = function(fn) {
        this._configs.callback = fn;
    };

    /**
     * 开始手机翻转互动
     * @return {boolean} true: 支持并使用手机翻转, false: 不支持手机翻转
     */
    Orientation.prototype.start = function() {
        if (!this._hasDeviceOrientation) {
            return false;
        }
        this.lastOrientationTime = new Date();
        window.addEventListener('deviceorientation', this, false);
        return true;
    };

    // 停止检测手机翻转
    Orientation.prototype.stop = function () {
        if (this._hasDeviceOrientation) {
            window.removeEventListener('deviceorientation', this, false);
        }
    };

    /**
     * 翻转处理函数
     * @param {Event} event 事件对象
     */
    Orientation.prototype.deviceorientation = function(event) {
        var currentTime = new Date();
        var timeDifference = currentTime.getTime() - this.lastOrientationTime.getTime();
        if (timeDifference > this._configs.timeInterval) {
            this.lastOrientationTime = new Date();
            var angle = {
                alpha: util.isFirefox ? Math.round(-event.alpha) : Math.round(event.alpha),
                beta : util.isFirefox ? Math.round(-event.beta)  : Math.round(event.beta),
                gamma: util.isFirefox ? Math.round(-event.gamma) : Math.round(event.gamma)
            };
            if (this._configs.radians) {
                angle.alpha = angle.alpha * Math.PI / 180.0;
                angle.beta  = angle.beta  * Math.PI / 180.0;
                angle.gamma = angle.gamma * Math.PI / 180.0;
            }
            if (Math.abs(this._prevAngle.alpha - angle.alpha) >= this._configs.alphaThreshold ||
                Math.abs(this._prevAngle.beta  - angle.beta)  >= this._configs.betaThreshold  ||
                Math.abs(this._prevAngle.gamma - angle.gamma) >= this._configs.gammaThreshold
            ) {
                this._configs.callback && this._configs.callback(angle);
                this._prevAngle = angle;
            }
        }
    };

    /**
     * 接收并分发事件
     * @param {Event} event 事件对象
     * @return {Function} 处理事件的函数
     */
    Orientation.prototype.handleEvent = function(event) {
        if ('function' === typeof (this[event.type])) {
            return this[event.type](event);
        }
    };
    return Orientation;
});
