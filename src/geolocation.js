/*******************************************************************************
*     File Name           :     src/geolocation.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-10 17:49]
*     Last Modified       :     [2014-10-21 13:19]
*     Description         :     地理位置获取接口
********************************************************************************/


define(['./util'], function(util) {
    /**
     * @constructor
     * @param {Object=|Function=} opt_options 配置项 参数为对象时是配置项；参数为函数时，做为配置项的callback值
     */
    function Geolocation(opt_options) {
        /**
         * @type {Object} 配置项
         * @private
         */
        this._configs = {};

        if ('function' === typeof opt_options) {
            this.setCallback(opt_options);
        }
        else {
            util.extend(this._configs, opt_options || {}, true);
        }
    }

    // 错误信息
    var errorMessage = {
        'NOT_SUPPORTED': '当前浏览器不支持GPS定位。',
        'PERMISSION_DENIED': '用户拒绝了定位请求。',
        'POSITION_UNAVAILABLE': '定位信息不可用。',
        'TIMEOUT': '定位超时。',
        'UNKNOWN_ERROR': '未知错误，无法定位。'
    };

    /**
     * 判断浏览器是否支持获取当前位置
     * @return {boolean}
     */
    Geolocation.prototype.isEnable = function(fn) {
        return !!navigator.geolocation;
    };

    /**
     * 设置获取到经纬度的回调函数
     * @param {Function} fn 回调函数
     */
    Geolocation.prototype.setCallback = function(fn) {
        this.callback = fn;
        return this;
    };

    /**
     * 处理返回的经纬度相关信息
     * @param {Object} pos 经纬度相关信息
     */
    Geolocation.prototype.handlePos = function(pos) {
        // 返回的数据
        var resp;
        var errMsg;
        // 请求出错
        if (pos.code) {
            switch (pos.code) {
                case 'NOT_SUPPORTED':
                    errMsg = errorMessage.NOT_SUPPORTED;
                    break;
                case pos.PERMISSION_DENIED:
                    errMsg = errorMessage.PERMISSION_DENIED;
                    break;
                case pos.POSITION_UNAVAILABLE:
                    errMsg = errorMessage.POSITION_UNAVAILABLE;
                    break;
                case pos.TIMEOUT:
                    errMsg = errorMessage.TIMEOUT;
                    break;
                case pos.UNKNOWN_ERROR:
                    errMsg = errorMessage.UNKNOWN_ERROR;
                    break;
            }
            resp = {
                'errorMessage': errMsg
            };
        }
        else {
            resp = pos.coords;
            resp.timestamp = pos.timestamp;
        }
        this.callback.call(null, resp);
    };

    /**
     * 开始获取定位信息
     * @param {Function} fn 回调函数
     */
    Geolocation.prototype.start = function() {
        var that = this;
        if (this.isEnable()) {
            navigator.geolocation.getCurrentPosition(
                function(pos) {
                    that.handlePos(pos);
                },
                function(error) {
                    that.handlePos(error);
                }
            );
        }
        else {
            this.handlePos();
        }
    };

    return Geolocation;
});
