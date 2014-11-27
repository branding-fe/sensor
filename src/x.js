/*******************************************************************************
*     File Name           :     src/x.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-21 10:04]
*     Last Modified       :     [2014-11-27 10:56]
*     Description         :     Ajax请求和JSONP请求方法
********************************************************************************/

define(['sensor/util'], function(util) {
    /**
     * @constructor
     * @param {Object=|Function=} opt_options 配置项 参数为对象时是配置项；参数为函数时，做为配置项的callback值
     */
    function X(opt_options) {
        /**
         * @type {Object} 配置项
         * @private
         */
        this._configs = {
            varsEncode: false,
            method: 'get',
            dataType: 'json',
            timeOut: 15 /* timeout in seconds;*/
        };
        util.extend(this._configs, opt_options || {}, true);
        return this.reset();
    }

    // 记录JSONP请求次数
    var jsonpIdx = 0;

    /*
     * 重置请求
     * return {Object} X对象
     */
    X.prototype.reset = function() {
        clearTimeout(this.timer);
        this.loading = false;
        this.data = '';
        return this;
    };

    /*
     * 发起JSONP请求
     * return {Object} X对象
     */
    X.prototype.jsonp = function(url, data) {
        var that = this;
        var jsonp = 'Sensor_x_jsonp' + jsonpIdx++;
        var head = document.head;
        var script = document.createElement('script');
        window[jsonp] = function(a) {
            that.response = a;
            delete window[jsonp];
            that.reset().onLoad();
            head.removeChild(script);
        };
        url = url.replace(/=\?/, '=' + jsonp) + (!data ? '' : '&' + data);
        script.src = url;
        script.onerror = function(e) {
            that.onFail();
        };
        head.appendChild(script);
    };

    /*
     * 发起Ajax请求
     * return {Object} X对象
     */
    X.prototype.send = function(url, data) {
        var that = this;
        if (/=\?/.test(url)) {
            return that.ajaxJSONP(url, data);
        }
        if (that.loading) {
            return;
        }
        var options = that.options;
        var xmlhttp = that.xmlhttp || (window.XMLHttpRequest ? new XMLHttpRequest() : false);
        if (xmlhttp) {
            that.xmlhttp = xmlhttp;
            that.loading = true;
            that.onStart();
            xmlhttp.onreadystatechange = function() {
                if (4 === this.readyState && 0 !== this.status) {
                    if (!that.timer) {
                        return;
                    }
                    var resp = this.responseText;
                    if ('json' === options.dataType) {
                        that.response = JSON.parse(resp);
                    }
                    else {
                        that.response = resp;
                    }
                    that.reset().onLoad();
                    xmlhttp.onreadystatechange = function() {};
                    xmlhttp = null;
                    that = null;
                }
            };
        }
        else {
            that.onFail();
            return that;
        }

        if (options.method.toLowerCase() === 'get') {
            if (data) {
                if (url.match(/\?.*=/)) {
                    data = '&' + data;
                }
                else if (data[0] !== '?') {
                    data = '?' + data;
                }
            }
            else {
                data = '';
            }

            url += data;
            xmlhttp.open('get', url, true);
            xmlhttp.send();
        }
        else {
            xmlhttp.open('post', url, true);
            xmlhttp.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xmlhttp.send(data);
        }

        that.timer = setTimeout(
            function() {
                that._onTimeout.apply(that);
            }, options.timeOut * 1000);
        return that;
    };

    /*
     * 终止请求
     */
    X.prototype.abort = function(url, data) {
        if (this.loading) {
            this.xmlhttp.abort();
            this.reset();
            this.loading = false;
        }
    };

    /*
     * 请求超时
     * @private
     */
    X.prototype._onTimeout = function(url, data) {
        this.abort();
        this.onTimeout = false;
    };

    // 配置覆盖
    X.prototype.onStart = function() {};
    // 配置覆盖
    X.prototype.onLoad = function() {};
    // 配置覆盖
    X.prototype.onFail = function() {};
    // 配置覆盖
    X.prototype.onTimeout = function() {};

    return X;
});
