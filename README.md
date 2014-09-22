
# sensor.js

智能手机浏览器上，通过HTML5使用手机的功能

概述
--------
HTML5提供了很多对硬件的使用功能。sensor.js是使用这些功能的抽象的库。可以让开发者通过简单的javascript api快速使用这些功能，而不用花大量时间在功能实现和屏蔽各种设备差异的细节上。

实例
------
#### Orientation

#### Shake

#### camera

####canvas(img擦一擦等)

####h5GPS

####touch(Hammer?)

Quickstart
----------


文档
-------------

### new Orientation(options).start();

Orientation会持续的取得手机的alpha, beta, gamma的值。

配置项        | 描述                                     | 默认值
------------- | -----------------------------------------|-----------
alphaThreshold| (number) alpha改变触发回调的临界值       | 0
betaThreshold | (number) beta 改变触发回调的临界值       | 0
gammaThreshold| (number) gamma改变触发回调的临界值       | 0
radians       | (boolean) 是否使用弧度值                 | false


值            | 描述
------------- | -----------------------------------------
alpha         | (number) 手机水平旋转的角度/弧度值
beta          | (number) 手机前后倾斜的角度/弧度值
gamma         | (number) 手机左右倾斜的角度/弧度值

用法
```javascript
require(['oientation'], function(oientation) {
    var ori = Orientation(function(data){
        console.log(data)
    });
    ori.start();
})
```


