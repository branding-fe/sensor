# sensor.js

在智能移动设备浏览器上，通过HTML5的api使用移动设备的功能。

概述
--------
HTML5提供了很多对硬件的使用功能。sensor.js是使用这些功能的抽象的库。可以让开发者通过简单的javascript api快速使用这些功能，而不用花大量时间在功能实现和屏蔽各种设备差异的细节上。


实例
------
这里: http://sensor.jishub.com 可以看到功能实例DEMO。

#### 倾斜 Orientation
你可以通过控制移动设备的倾斜控制页面上的球的滚动。

#### 摇一摇 Shake
通过摇晃移动设备改变页面的颜色。

#### 定位 Geolocation
获取你当前的经纬度，打开百度地图显示当前的位置。需要手动确认开启位置检测。

#### 擦一擦 ErasableMask
把某个元素使用可擦除的遮罩遮住，手指擦除遮罩面积达到或超过百分之40就清除全部遮罩。

#### camera

#### touch(Hammer?)


文档
-------------

### 倾斜 Orientation

Orientation会持续的取得移动设备的alpha, beta, gamma的值。

配置项        | 描述                                     | 默认值
------------- | -----------------------------------------|-----------
callback      | (Function) 角度/弧度改变的回调函数       | 0
alphaThreshold| (number) alpha改变触发回调的临界值       | 0
betaThreshold | (number) beta 改变触发回调的临界值       | 0
gammaThreshold| (number) gamma改变触发回调的临界值       | 0
timeInterval  | (number) 判断倾斜值变化的时间间隔(毫秒)  | 300
radians       | (boolean) 是否使用弧度值                 | false


返回倾斜值    | 描述
------------- | -----------------------------------------
alpha         | (number) 移动设备水平旋转的角度/弧度值
beta          | (number) 移动设备前后倾斜的角度/弧度值
gamma         | (number) 移动设备左右倾斜的角度/弧度值

用法:
```javascript
//使用amd js加载工具
require(['oientation'], function(Orientation) {
    // options为函数时就作为配置项的callback配置项
    new Orientation(function(data){
        //处理data...
    }).start();
})
```

### 摇一摇 Shake

Shake会监听移动设备的摇晃动作，会返回触发事件时各个方向的加速度值(考虑重力加速度)。

配置项        | 描述                                          | 默认值
------------- | ----------------------------------------------|-----------
callback      | (Function) 摇晃设备的回调函数                 | -
threshold     | (number) 各个方向加速度值改变触发回调的临界值 | 10
timeInterval  | (number) 判断加速度值变化的时间间隔(毫秒)     | 500


返回值        | 描述
------------- | -----------------------------------------
x             | (number) x轴加速度(考虑重力加速度)
y             | (number) y轴加速度(考虑重力加速度)
z             | (number) z轴加速度(考虑重力加速度)

用法:
```javascript
//使用amd js加载工具
require(['shake'], function(Shake) {
    new Shake(function(data){
        //处理data...
    }).start();
})
```


### 定位 GPS

获取用户设备GPS定位经纬度。

配置项          | 描述                                                 | 默认值
--------------- | -----------------------------------------------------|-----------
callback        | (Function) 获取到经纬度或转换过的经纬度后的回调函数  | -

返回值          | 描述
--------------- | -----------------------------------------
errorMessage    | (string) 如果定位没有成功，提示错误信息
latitude        | (number) 纬度值
longitude       | (number) 经度值
accuracy        | (number) 定位精度
altitude        | (number) 相对于海平面的海拔高度
altitudeAccuracy| (number) 海拔精度
heading         | (number) 方向，从正北开始以度计
speed           | (number) 速度，以米/每秒计
timestamp       | (number) 响应的日期/时间

用法:
```javascript
//使用amd js加载工具
require(['geolocation'], function(Geolocation) {
    new Geolocation(function(data){
        //处理data...
        if (!data.errorMessage) {
            var lat = data.latitude;
            var lon = data.longitude;
        }
    }).start();
})
```


### 可擦除遮罩 ErasableMask

给元素添加可擦除的遮罩。

配置项          | 描述                                                                           | 默认值
--------------- | -------------------------------------------------------------------------------|-----------
el              | (Element|string) 需要遮罩的DOM节点 或 节点的id                                 | -
callback        | (Function) 擦除一部分后的回调函数，函数会接收到擦除的百分比                    | -
image           | (string) 用于遮罩的图片 默认不用图片                                           | -
width           | (number) 遮罩宽度                                                              | 被遮罩的元素宽度(不包括border)
height          | (number) 遮罩高度                                                              | 被遮罩的元素高度(不包括border)
left            | (number) 遮罩style的left值 遮罩为绝对定位                                      | 0
top             | (number) 遮罩style的top值 遮罩为绝对定位                                       | 0
color           | (string) 遮罩层颜色 默认使用背景颜色为#666的遮罩                               | #666
transparent     | (number) 遮罩的透明度 默认不透明                                               | 100
checkDistance   | (number) 用于计算擦除部分的比例的计算点之间的间距，越小越精确，而执行效率越低  | 20
showPoint       | (boolean) 显示计算点，一般在测试的时候才用                                     | false


返回值                      | 描述
--------------------------- | -----------------------------------------
percent(返回值本身)         | (number) 擦除的面积占整个遮罩的百分比

用法:
```javascript
//使用amd js加载工具
require(['erasableMask'], function(Mask) {
    var bodyStyle = document.body.style;
    // 禁止浏览器默认选中内容
    bodyStyle.mozUserSelect = 'none';
    bodyStyle.webkitUserSelect = 'none';

    var perStr;
    var mask = new Mask('imgWrap', {
        width: 500,
        height: 400,
        maskImage: '../images/pet2.jpg',
        showPoint: false,
        callback: function(percent) {
            perStr = '擦除百分比为：' + Math.floor(percent) + '%';
            console.log(perStr);
            if (percent >= 40) {
                mask.clearMask();
                mask.stop();
            }
        }
    });
    mask.start();

})();

```


参考
------
* https://developer.mozilla.org/en-US/docs/tag/Sensors
* http://blog.csdn.net/hursing/article/details/9046837
* http://blog.csdn.net/hursing/article/details/9061991
* http://www.w3schools.com/html/html5_geolocation.asp
