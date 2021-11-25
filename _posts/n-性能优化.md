# 利用网络看板做性能分析

在下载信息中有DOMContentLoad和Load.
- DOMContentLoad表示DOM已经解析完毕，说明css、js、html已经加载完毕
- Load表明已经加载完所有的信息（包括图像、音频）

**Queuing** 

Queuing表示请求排队的时间，排队有以下几种情况

- TCP排队，一个域名只能同时6个TCP链接，超过后得等待
- 页面请求资源是有优先级的，比如css、js、html的优先级比较高，而音频、图片、视频的优先级较低
- 网络进程在为数据分配磁盘空间时，新的 HTTP 请求也需要短暂地等待磁盘分配结束。

**Stalled**

表示停滞，有一些原因可能导致请求停滞

**Waiting**

waiting也表示第一字节时间(TTFB)，TTFB越短，表示响应时间越快

**ContentLoad**
第一字节时间到接收完所有字节的时间


**waiting时间过长**

- 服务器生成页面数据的时间过久。解决方法是合理使用缓存，提高服务的响应速度
- 网络的原因，可以使用cdn访问静态资源
- 发送请求头时带上了多余的用户信息。比如带了一些cookie,服务器收到这些cookie后会进行处理，加大了服务器的压力。

**Initial connection/SSL**

表示TCP链接的时间，如果用来Https,还表示TSL/SSL握手的时间

**ContentLoad过长**

有可能是字节数太多的原因导致的。这时候你就需要减少文件大小，比如压缩、去掉源码中不必要的注释等方法。


# js和css是如何延长白屏的时间

- 当html解析器在解析时遇到script的标签，那么会暂停解析，直接执行js，因为接下来的 JavaScript 可能要修改当前已经生成的 DOM 结构。
- 如果是外联的script标签,还会涉及到下载，js的下载也会阻塞解析。现代浏览器在字节流后会开启一个预解析的过程，如果识别到了js和css后那么会提前下载这些文件
- 如果还引用了外部的css，在执行js之前，还需要等到css下载并生成stylesheet后才能执行js，因为js脚本可能操作stylesheet。


**通常情况下的瓶颈主要体现在下载 CSS 文件、下载 JavaScript 文件和执行 JavaScript。**

**优化手段**

- 不操作dom的js文件使用async和defer。async 标志的脚本文件一旦加载完成，会立即执行,同时多个async能够同时加载；而使用了 defer 标记的脚本文件，需要在 DOMContentLoaded 事件之前执行，多个defer串行加载。
- 通过内联 JavaScript、内联 CSS 来移除这两种类型的文件下载，这样获取到 HTML 文件之后就可以直接开始渲染流程了。
- 但并不是所有的场合都适合内联，那么还可以尽量减少文件大小，比如通过 webpack 等工具移除一些不必要的注释，并压缩 JavaScript 文件。
- 对于大的 CSS 文件，可以通过媒体查询属性，将其拆分为多个不同用途的 CSS 文件，这样只有在特定的场景下才会加载特定的 CSS 文件。


# css动画为什么高效

生成任意一帧的方式，有重排、重绘和合成三种方式。通常渲染路径越长，生成图像花费的时间就越多。所以这三种方式的耗时重排>重绘>合成，并且重排一定会导致重绘、合成。重绘会导致合成。需要重点关注的是，合成操作是在合成线程上完成的，这也就意味着在执行合成操作时，是不会影响到主线程执行的。这就是为什么经常主线程卡住了，但是 CSS 动画依然能执行的原因。
Web 应用的时候，可能经常需要对某个元素做几何形状变换、透明度变换或者一些缩放操作，如果使用 JavaScript 来写这些效果，会牵涉到整个渲染流水线，所以 JavaScript 的绘制效率会非常低下。这时你可以使用will-change， 来告诉渲染引擎你会对该元素做一些特效变换，使用will-change的元素会单独变成一层，那么在做css动画时只要去操作对应图层就可以了。



# 性能监控之获取网页跳转阶段的相关事件

- 根据 performance.time 获取到加载网页的各个阶段的时间，比如
  白屏时间可以用 reponsetstar-navigationStart 获取
     //页面onload时间
  loadTime: n.loadEventEnd - n.navigationStart || 0,
  fetchTime: responseEnd - n.fetchStart,

- 获取到的 performance 还跟用户的网络环境有关，可以通过 window.navigator 获取用户的环境状态，比如 connection、内存、cpu 核数。用户的网速还可以用请求图片的方式，在前端开始请求和收到响应两个时间点分别通过 Date.now 标记 start 和 end，因为 Date.now 得出的是 1970 年 1 月 1 日(UTC)到当前时间经过的毫秒数,所以我们通过 end - start 求出时间差（ms），然后通过计算：文件大小（KB） \* 1000 /( end -start )，就可以计算出网速了(KB/S）。图片请求可以用 onload 监听请求图片结束，或者用 ajax 请求。

在集合完数据后，使用 requestIdlecallback 进行数组的发送

error 监控：
全局 error 监听：window.onerror
promise:监听 unhandlerRejection
网络：监听 error，如果 event.target 不等于 window 就是 error;

错误数据上报使用 navigator.sendBeacon，navigator.sendBeacon 会在页面关闭的时候上传数据，并且不会延迟页面跳转的时间

错误定位：

将 soucemap 上传到监控平台，可以主动上传，也远程编译利用 rsync 进行传输、还可以通过手写 webpack 插件在编译的时候进行上传

先定位编译后的错误地址获取到报错的行数和列数
使用 souce-map 中的 originalPositionFor查找对应的源码位置，然后在用codeframe从sourcecontent中获取到对应的代码片段。




性能监控之获取 fp lcp fcp cls ttb(long-task)

利用 performance.oberver 获取到性能条目，比如 paint 包括 fp fcp，first input delay,lastContentpaint:lcp layout-shift 累计得到页面的 cls,resource 获取得到相关资源的加载时间，比如图片、js 等。ttb 是指长耗时任务，从 resource 中获取到的资源好使大于 50ms 的就是长时的任务

本地存储

可以使用 window.navigator.storage.estimate 获取本地存储的状态，该接口只能在 https 中使用

UV（Unique visitor）
是指通过互联网访问、浏览这个网页的自然人。访问您网站的一台电脑客户端为一个访客。00:00-24:00 内相同的客户端只被计算一次。一天内同个访客多次访问仅计算一个 UV。
在用户访问网站时，可以生成一个随机字符串+时间日期，保存在本地。在网页发生请求时（如果超过当天 24 小时，则重新生成），把这些参数传到后端，后端利用这些信息生成 UV 统计报告。

PV（Page View）
即页面浏览量或点击量，用户每 1 次对网站中的每个网页访问均被记录 1 个 PV。用户对同一页面的多次访问，访问量累计，用以衡量网站用户访问的网页数量。

页面停留时间
传统网站
用户在进入 A 页面时，通过后台请求把用户进入页面的时间捎上。过了 10 分钟，用户进入 B 页面，这时后台可以通过接口捎带的参数可以判断出用户在 A 页面停留了 10 分钟。
SPA
可以利用 router 来获取用户停留时间，拿 Vue 举例，通过 router.beforeEach destroyed 这两个钩子函数来获取用户停留该路由组件的时间。

浏览深度
通过 document.documentElement.scrollTop 属性以及屏幕高度，可以判断用户是否浏览完网站内容。

页面跳转来源
通过 document.referrer 属性，可以知道用户是从哪个网站跳转而来。

小结
通过分析用户数据，我们可以了解到用户的浏览习惯、爱好等等信息，想想真是恐怖，毫无隐私可言。


# sourcemap的字段介绍

```
 {
   version : 3, // sourcemap的版本
   file: "add.js", // 转换后的文件
   sourceRoot : "", // 转换前的文件的目录，如果与转换前的目录在同一个位置那么为空
   sources: ["add.ts"], // 转换前的文件，该项是一个数组，表示可能存在多个文件合并
   names: [], // 转换前所有的变量名，多用与minifer场景
   sourcesContent: [ // 原始文件内容
    "const add = (x:number,y:number) => {\n  return x+y;\n}"
  ]
  mappings: "AAAA,IAAM,GAAG,GAAG,UAAC,CAAQ,EAAC,CAAQ;IAC5B,OAAO,CAAC,GAAC,CAAC,CAAC;AACb,CAAC,CAAA",
 }

```

**mapping**

mapping主要记录了行列与源文件的映射信息。
- “;”分割代表一行，每一行有多个segment，代表该行所在列的映射信息
- 每一个segment又包含了多个file,表示列的不同的映射信息。
- - 第一位转换后代码所在的列号，如果是当前行的segmentn是一个，那么是个绝对值，其余的是相对于上一个的相对值
- - 第二个表示属于souce属性的哪一个文件，相对于前一个segment的位置，下一行的segment中仍是相对于上一行的最后一个
- - 表示这个属于转换前代码的第几行，也是个相对值，下一行的第一个相对于上一行最后一个
- - 表示这个属于转换前代码的第几列，也是相对值
- - 表示这个位置属于names属性中的哪一个变量，相对位置