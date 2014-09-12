
# sensor.js

智能机浏览器中通过HTML5使用手机的功能

概述
--------
HTML5提供了很多对硬件的使用功能。sensor.js是使用这些功能的抽象的库。她可以让开发者通过简单的javascript快速使用这些功能，而不用去了解实现和屏蔽各种设备差异的细节。

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

### sensor.orientation([options], callback)

Orientation fires continuously, and emits alpha, beta, and gamma data from the device.

Options       | Description                              | Default
------------- | -----------------------------------------|-----------
alphaThreshold| (number) Threshold for changes in delta  | 0
betaThreshold | (number) Threshold for changes in beta   | 0
gammaThreshold| (number) Threshold for changes in gamma  | 0
radians       | (boolean) True to emit values in radians | false


Data          | Description                               
------------- | -----------------------------------------
alpha         | (number) degree/radian value for direction the device is pointed 
beta          | (number) degree/radian value for device's front-back tilt
gamma         | (number) degree/radian value for device's left-right tilt  

Sample Usage:
```javascript
sense.orientation(function(data){
    console.log(data)
});
```


