/*******************************************************************************
*     File Name           :     src/shake.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-09-23 10:53]
*     Last Modified       :     [2014-10-23 17:30]
*     Description         :     监测移动设备摇晃
********************************************************************************/


define(['util'], function(util) {
    /**
     * @constructor
     * @param {Object=|Function=} opt_options 配置项 参数为对象时是配置项；参数为函数时，做为配置项的callback值
     * @param {number=} opt_options.threshold 各个方向加速度值改变触发回调的临界值
     * @param {number=} opt_options.timeInterval 监听加速度值改变的时间间隔
     */
    function Shake(opt_options) {

        /**
         * @type {boolean} 是否支持监听加速运动
         * @private
         */
        this._hasDeviceMotion = 'ondevicemotion' in window;

        /**
         * @type {Object} 配置项
         * @private
         */
        this._configs = {
            threshold : 10,
            timeInterval: 500
        };

        /**
         * @type {Object} 记录上一次各个方向的加速度
         * @private
         */
        this._prevAcceleration = {
            x: null,
            y: null,
            z: null
        };

        if (util.isFunction(opt_options)) {
            this.setCallback(opt_options);
        }
        else {
            util.extend(this._configs, opt_options || {}, true);
        }
    }

    /**
     * 设置响应加速度改变的回调函数
     * @param {Function} fn 回调函数
     * @return this 用于链式调用
     */
    Shake.prototype.setCallback = function(fn) {
        this._configs.callback = fn;
        return this;
    };


    /**
     * 开始监听手机加速度的改变
     * @return {boolean} this: 手机加速度监听对象, false: 不支持监听手机加速度
     */
    Shake.prototype.start = function () {
        this._lastTime = new Date();
        if (this._hasDeviceMotion) {
            window.addEventListener('devicemotion', this, false);
            return this;
        }
        else {
            return false;
        }
    };

    /** 停止检测手机加速度
     * @return this 用于链式调用
     */
    Shake.prototype.stop = function () {
        if (this._hasDeviceMotion) {
            window.removeEventListener('devicemotion', this, false);
        }
        this._prevAcceleration.x = null;
        this._prevAcceleration.y = null;
        this._prevAcceleration.z = null;
        return this;
    };

    /**
     * 加速运动事件处理函数
     * @param {Event} event 事件对象
     */
    Shake.prototype.devicemotion = function (event) {
        var current = event.accelerationIncludingGravity;
        var currentTime = new Date();
        var timeDifference = currentTime.getTime() - this._lastTime.getTime();
        var deltaX = 0;
        var deltaY = 0;
        var deltaZ = 0;

        if ((this._prevAcceleration.x === null) && (this._prevAcceleration.y === null) &&
            (this._prevAcceleration.z === null)) {
            this._prevAcceleration.x = current.x;
            this._prevAcceleration.y = current.y;
            this._prevAcceleration.z = current.z;
            return;
        }

        deltaX = Math.abs(this._prevAcceleration.x - current.x);
        deltaY = Math.abs(this._prevAcceleration.y - current.y);
        deltaZ = Math.abs(this._prevAcceleration.z - current.z);

        var isShake = (deltaX > this._configs.threshold) || (deltaY > this._configs.threshold) ||
            (deltaZ > this._configs.threshold);
        if (isShake) {
            if (timeDifference > this._configs.timeInterval) {
                this._lastTime = new Date();
                if (!util.isFunction(this._configs.callback)) {
                    throw new TypeError('callback is not set or not a function!');
                }
                this._configs.callback({
                    x: current.x,
                    y: current.y,
                    z: current.z
                });
                this._prevAcceleration.x = current.x;
                this._prevAcceleration.y = current.y;
                this._prevAcceleration.z = current.z;
            }
        }
    };

    /**
     * 接收并分发事件
     * @param {Event} event 事件对象
     * @return {Function} 处理事件的函数
     */
    Shake.prototype.handleEvent = function (event) {
        if (util.isFunction(this[event.type])) {
            return this[event.type](event);
        }
    };

    return Shake;
});
