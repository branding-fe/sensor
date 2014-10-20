/*******************************************************************************
*     File Name           :     src/geolocation.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-10 17:49]
*     Last Modified       :     [2014-10-20 18:13]
*     Description         :     地理位置获取接口
********************************************************************************/


define(function(util) {
    /**
     * @constructor
     */
    function Geolocation(opt_options) {
        if ('function' === typeof opt_options) {
            this.setCallback(opt_options);
        }
        else {
            util.extend(this._configs, opt_options || {}, true);
        }
    }
    var ErrMessages = {
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
     * 处理返回的经纬度
     * @param {Function} fn 回调函数
     */
    Geolocation.prototype.handlePos = function(pos) {
        console.log(this);
    };

    /**
     * 开始获取定位信息
     * @param {Function} fn 回调函数
     */
    Geolocation.prototype.start = function() {
        if (this.isEnable()) {
            navigator.geolocation.getCurrentPosition(this.handlePos, this.handlePos);
        }
        else {
            this.handlePos({
                'errorMessage': ErrMessages['NOT_SUPPORTED']
            });
        }
    };

    return Geolocation;
});
