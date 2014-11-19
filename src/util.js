/*******************************************************************************
*     File Name           :     src/util.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-09-15 15:49]
*     Last Modified       :     [2014-11-19 15:29]
*     Description         :     工具类
********************************************************************************/

define(function() {
    // 获得css属性的前缀
    function prefix(style) {
        if (vender === '') {
            return style;
        }

        style = style.charAt(0).toUpperCase() + style.substr(1);
        return vender + style;
    }

    var dummyStyle = document.createElement('div').style;
    var vender = (function() {
        var vendors = 't,webkitT,MozT,msT,OT'.split(',');
        var t;
        var i = 0;
        var l = vendors.length;

        for (; i < l; i++) {
            t = vendors[i] + 'ransform';
            if (t in dummyStyle) {
                return vendors[i].substr(0, vendors[i].length - 1);
            }
        }

        return false;
    })();

    /**
     * @type {Function}
     * @param {Function} callback 下一次重绘时的回调函数
     * @return {number} 定时标记用于取消回调的执行
     * 在页面的下一个repaint时调用回调
     */
    var nextFrame = (function() {
        return window.requestAnimationFrame ||
            window[vender + 'RequestAnimationFrame'] ||
            function(callback) {
                return setTimeout(callback, 1000 / 60);
            };
    })();

    /**
     * @type {Function}
     * @param {id} number requestAnimationFrame执行后的标记
     * 取消requestAnimationFrame回调
     */
    var cancelFrame = (function() {
        return window.cancelRequestAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window[vender + 'RequestAnimationFrame'] ||
            clearTimeout;
    })();

    /**
     * @type {Object}
     * 是否是firefox浏览器
     */
    var isFirefox = /firefox/i.test(navigator.userAgent);

    var _toString = Object.prototype.toString;

    /**
     * @type {Function}
     * @param {*} object 需要判断的对象
     * @return {boolean}
     * 判断输入对象是否是函数
     */
    var isFunction = function (object) {
        return ('[object Function]' === _toString.call(object));
    };

    /**
     * @type {Function}
     * @param {*} object 需要判断的对象
     * @return {boolean}
     * 判断输入对象是否是字符串
     */
    var isString = function (object) {
        return ('[object String]' === _toString.call(object));
    };

    /**
     * @type {Function}
     * @param {*} object 需要判断的对象
     * @return {boolean}
     * 判断输入对象是否是数组
     */
    var isArray = function (object) {
        return ('[object Array]' === _toString.call(object));
    };

    /**
     * @type {Function}
     * @param {*} object 传入的DOM相关的内容
     * @return {boolean}
     * 根据输入内容返回DOM元素，传入字符串就作为DOM的id，传入DOM元素返回本身
     */
    var getElement = function (object) {
        if (isString(object)) {
            return document.getElementById(object);
        }
        return object;
    };


    /**
     * @type {Function}
     * @param {Element} dom 传入的DOM相关的内容
     * @return {Array}
     * 根据输入内容返回DOM元素，传入字符串就作为DOM的id，传入DOM元素相对body左上角的偏移量
     */
    var getOffset = function (dom) {
        if (isString(object)) {
            return document.getElementById(object);
        }
        return object;
    };

    /**
     * 将源对象的所有属性拷贝到目标对象中
     * 1.目标对象中，与源对象key相同的成员默认将会被覆盖。
     * 2.源对象的prototype成员不会拷贝。
     * @param {Object} target 目标对象
     * @param {Object} source 源对象
     * @param {boolean} override 是否覆盖
     * @return {Object} 目标对象
     */
    function extend(target, source, override) {
        for (var p in source) {
            if (source.hasOwnProperty(p)) {
                if (!override && target.hasOwnProperty(p)) {
                    continue;
                }
                target[p] = source[p];
            }
        }
        return target;
    }


    /**
     * 工具类
     * @exports util
     */
    var util = {
        /** 在页面的下一个repaint时调用回调 */
        nextFrame: function (fn) {
            return nextFrame(fn);
        },
        /** 取消requestAnimationFrame回调 */
        cancelFrame: function (index) {
            cancelFrame(index);
        },
        /** 为css样式名添加浏览器前缀 */
        setCssPrefix: prefix,
        /** 为css样式名添加浏览器前缀 */
        styleVender: vender,
        /** 判断浏览器是否为Firefox */
        isFirefox: isFirefox,
        /** 判断验证对象是否为Function */
        isFunction: isFunction,
        /** 判断验证对象是否为String */
        isString: isString,
        /** 判断验证对象是否为Array */
        isArray: isArray,
        /** 获取DOM对象，传入字符型时做为id处理 */
        getElement: getElement,
        /** 获取DOM对象相对body左上角的偏移量，传入字符型时做为id处理 */
        getOffset: getOffset,
        /** 将源对象的所有属性拷贝到目标对象中 */
        extend: extend
    };

    return util;
});
