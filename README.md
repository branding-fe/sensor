
# sensor.js

在智能移动设备浏览器上，通过HTML5的api使用移动设备的功能。

概述
--------
HTML5提供了很多对硬件的使用功能。sensor.js是使用这些功能的抽象的库。可以让开发者通过简单的javascript api快速使用这些功能，而不用花大量时间在功能实现和屏蔽各种设备差异的细节上。


实例
------
#### [Orientation](http://dev046.baidu.com:8096/examples/orientation.html)

#### [Shake](http://dev046.baidu.com:8096/examples/shake.html)

#### camera

####canvas(img擦一擦等)

####h5GPS

####touch(Hammer?)


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

用法
```javascript
//使用amd js加载工具
require(['oientation'], function(Orientation) {
    // options为函数时就作为配置项的callback配置项
    var ori = new Orientation(function(data){
        console.log(data)
    });
    ori.start();
})
```

### 摇一摇 Shake

Shake会监听移动设备的摇晃动作。
