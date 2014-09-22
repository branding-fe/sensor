/*******************************************************************************
*     File Name           :     src/orientation.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-09-15 16:43]
*     Last Modified       :     [2014-09-22 18:15]
*     Description         :     监测手机倾斜角度
********************************************************************************/


define(function() {
    var util = require('util');
    function Orientation(options) {
        this.hasDeviceOrientation = 'ondeviceorientation' in window;

        this.configs = {
            alphaThreshold: 0,
            betaThreshold: 0,
            gammaThreshold: 0,
            timeInterval: 300,
            radians: false
        };
        this.prevAngle = {
            alpha: 0,
            beta: 0,
            gamma: 0
        };
        if ('function' == typeof options) {
            util.extend(this.configs, {callback: options}, true);
        }
        else {
            util.extend(this.configs, options, true);
        }
    };

    /**
     * 开始手机翻转互动
     * @return {boolean} true: 支持并使用手机翻转, false: 不支持手机翻转
     */
    Orientation.prototype.start = function() {
        if (!this.hasDeviceOrientation) {
            return false;
        }
        this.lastOrientationTime = new Date();
        window.addEventListener('deviceorientation', this, false);
        return true;
    };

    // 停止检测手机翻转
    Orientation.prototype.stop = function () {
        if (this.hasDeviceOrientation) { window.removeEventListener('deviceorientation', this, false); }
    };

    // 翻转处理函数
    Orientation.prototype.deviceorientation = function(e) {
        var currentTime = new Date();
        timeDifference = currentTime.getTime() - this.lastOrientationTime.getTime();
        if (timeDifference > this.configs.timeInterval) {
            this.lastOrientationTime = new Date();
            var angle = {
                alpha: util.isFirefox ? Math.round(-e.alpha) : Math.round(e.alpha),
                beta : util.isFirefox ? Math.round(-e.beta)  : Math.round(e.beta),
                gamma: util.isFirefox ? Math.round(-e.gamma) : Math.round(e.gamma)
            };
            if (this.configs.radians) {
                angle.alpha = angle.alpha * Math.PI / 180.0;
                angle.beta  = angle.beta  * Math.PI / 180.0;
                angle.gamma = angle.gamma * Math.PI / 180.0;
            }
            if (Math.abs(this.prevAngle['alpha'] - angle['alpha']) >= this.configs.alphaThreshold ||
                Math.abs(this.prevAngle['beta']  - angle['beta'])  >= this.configs.betaThreshold  ||
                Math.abs(this.prevAngle['gamma'] - angle['gamma']) >= this.configs.gammaThreshold
            ) {
                this.configs['callback'] && this.configs['callback'](angle);
                this.prevAngle = angle;
            }
        }
    };

    Orientation.prototype.handleEvent = function(e) {
        if ('function' === typeof (this[e.type])) {
            return this[e.type](e);
        }
    };
    return Orientation;
});
