/*******************************************************************************
*     File Name           :     src/orientation.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-09-15 16:43]
*     Last Modified       :     [2014-11-12 18:09]
*     Description         :     监测移动设备倾斜角度
********************************************************************************/


define(['util'], function(util) {
    /**
     * Orientation会持续的取得移动设备的alpha, beta, gamma的值。
     * @module Orientation
     */

    /**
     * @constructor
     * @alias module:Orientation
     * @param {Object=|Function=} opt_options 配置项 参数为对象时是配置项；参数为函数时，做为配置项的callback值
     * @param {Function=} opt_options.callback 获取倾斜值的回调函数
     * @param {number=} opt_options.alphaThreshold 水平旋转alpha值改变触发回调的临界值
     * @param {number=} opt_options.betaThreshold  前后倾斜beta 值改变触发回调的临界值
     * @param {number=} opt_options.gammaThreshold 左右倾斜gamma值改变触发回调的临界值
     * @param {number=} opt_options.timeInterval 监听倾斜值改变的时间间隔
     * @param {boolean=} opt_options.radians 是否使用弧度值代替角度值
     */
    var Orientation = function (opt_options) {

        /**
         * @type {boolean} 是否支持监听倾斜
         * @private
         */
        this._hasDeviceOrientation = 'ondeviceorientation' in window;

        /**
         * @type {Object} 配置项
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

        if (util.isFunction(opt_options)) {
            this.setCallback(opt_options);
        }
        else {
            util.extend(this._configs, opt_options || {}, true);
        }
    }

    /**
     * 设置响应倾斜的回调函数
     * @param {Function} fn 回调函数
     * @return this
     */
    Orientation.prototype.setCallback = function(fn) {
        this._configs.callback = fn;
        return this;
    };

    /**
     * 开始手机翻转互动
     * @return {Object|boolean} this: 手机翻转对象, false: 不支持手机翻转
     */
    Orientation.prototype.start = function() {
        if (!this._hasDeviceOrientation) {
            return false;
        }
        this._lastOrientationTime = new Date();
        window.addEventListener('deviceorientation', this, false);
        return this;
    };

    /**
     * 停止检测手机翻转
     * @return this
     */
    Orientation.prototype.stop = function () {
        if (this._hasDeviceOrientation) {
            window.removeEventListener('deviceorientation', this, false);
        }
        return this;
    };

    /**
     * 翻转事件处理函数
     * @param {Event} event 事件对象
     * @private
     */
    Orientation.prototype.deviceorientation = function(event) {
        var currentTime = new Date();
        var timeDifference = currentTime.getTime() - this._lastOrientationTime.getTime();
        if (timeDifference > this._configs.timeInterval) {
            this._lastOrientationTime = new Date();
            var alpha = util.isFirefox ? Math.round(-event.alpha) : Math.round(event.alpha);
            var beta = util.isFirefox ? Math.round(-event.beta)  : Math.round(event.beta);
            var gamma = util.isFirefox ? Math.round(-event.gamma) : Math.round(event.gamma);
            if (this._configs.radians) {
                alpha = alpha * Math.PI / 180.0;
                beta  = beta  * Math.PI / 180.0;
                gamma = gamma * Math.PI / 180.0;
            }
            if (Math.abs(this._prevAngle.alpha - alpha) >= this._configs.alphaThreshold ||
                Math.abs(this._prevAngle.beta  - beta)  >= this._configs.betaThreshold  ||
                Math.abs(this._prevAngle.gamma - gamma) >= this._configs.gammaThreshold
            ) {
                if (!util.isFunction(this._configs.callback)) {
                    throw new TypeError('callback is not set or not a function!');
                }
                this._configs.callback({
                    alpha: alpha,
                    beta: beta,
                    gamma: gamma
                });
                this._prevAngle.alpha = alpha;
                this._prevAngle.beta = beta;
                this._prevAngle.gamma = gamma;
            }
        }
    };

    /**
     * 接收并分发事件
     * @param {Event} event 事件对象
     * @return {Function} 处理事件的函数
     * @private
     */
    Orientation.prototype.handleEvent = function(event) {
        if (util.isFunction(this[event.type])) {
            return this[event.type](event);
        }
    };

    return Orientation;
});
