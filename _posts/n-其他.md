js的装箱和拆箱：
所谓的装箱就是把js的原始数据类型值包装成对象，所以我们可以在基本数据类似上获取属性和方法。当装箱使用完毕后，会进行拆箱，拆箱就是恢复到原来的数据值。所以此时string instanceof String是false

原型链：
原型（prototype）是一个普通的对象，为构造函数的实例提供了共享的属性和方法。每个对象都有一个_proto_，指向构造函数的原型对象。所谓的原型链式是指获取一个实例对象的属性和方法是，会依次从实例本身、构造函数原型、构造函数的原型的原型一层一层向上查找，一直到Object.prototype。

现有大的Object.prototype,然后构造出Function.prototype,然后在用Function.prototype构造出Object和Function。


性能优化的相关指标：FP首次绘制、FCP首次有内容的绘制、FMP首次有意义的绘制、TTFB首字节加载的时间、TTI可交互的时间，交互响应的时间不能大于100会有延迟感、LCP记录视窗内最大内容的绘制时间，会随着渲染时间变化而变化，在首次交互的时候会停止记录。FID首次交互延迟记录，在FCP到TTI用户交互的响应时间的延迟。TBT（Total Blocking Time）阻塞总时间，记录在 FCP 到 TTI 之间所有⻓任务的阻塞时间总和。CLS累计位移偏移，CLS 代表了⻚⾯的稳定，CLS 值⼀⼤的话会让⽤户觉得⻚⾯体验做的很差。


GPU而不是CPU区别
首先CPU和GPU都包含了DRAM、Control、ALU、Cahce，但两者的设计结构不一样，CPU包含了一大块的Control和Cache,Alu数量较少。大的缓存也可以降低延时。保存很多的数据放在缓存里面，当访问数据如果缓存里面存在，那么就可以直接从缓存里面获取。复杂的逻辑控制单元（Control）。当程序含有多个分支的时候，它通过提供分支预测的能力来降低延时。CPU 擅长各种复杂的逻辑运算，但不擅长数学运行。而GPU是基于大的吞吐量设计，有较多的alu和线程，但是缓存较少， 缓存的目的不是保存后面需要访问的数据的,而是为线程服务的，所以GPU擅长的是大规模并行计算。而栅格化是要处理多个图块的，并且做的事情都是一样的，比较适合采用GPU的并行计算。


移动端1px的问题
在写移动端时，需要在meta中设置init-scale以及max-scale为1，主要是为了保证移动端的viewport的宽度为设备的宽度。引起1px border变粗的原因是dpr（物理像素与独立像素的比值）不为1。解决的方式主要有以下几种。
- 根据设备像素比设置媒体查询，比如dpr为2的时候，将border设置为0.5。但ios8以下是不允许设置0.几px的
- 第二是根据viewport动态设置meta的init-scale以及max-scale。，如果dpr是2的话，那么scale为0.5；
- 使用border-images
- 第四种是使用transform以及伪元素befor或者after,再根据媒体查询以及dpr进行缩放。


webworker的作用是为了javascript创建多线程环境，运行主线程建立一个worker线程，将一些任务交给后者运行。webworker一旦使用，就不会被主线程的任务所打断，这也造成了webworker比较耗费性能，所以用完了就得关闭。
webworker的限制主要有以下内容：分配给线程的脚步文件必须与主线程同源。不能操作dom对象，也无法操作window、parent这些对象。Worker但是可以操作location、navigator对象。
worker和主线程不在同一个上下文环境，那么他们不能直接通信，必须通过消息完成。
worker线程不能执行alert和confirm方法，但可以发送ajax请求。
Worker 线程无法读取本地文件，它所加载的脚本必须来自网络，用importScripts()加载脚本。
webworker传输的内容可以是文本、对象也可以是二进制数据，这种通信是拷贝的关系，即修改了数据也不会影响到主线程。

serviceworkw主要用于离线缓存，使用的使用sw首先会进行注册、解析执行、激活、然后监听对应的fetch请求，对相关的请求进行拦截。serviceworker更新的时候会在注册的后面多了一个waiting阶段，在waitng阶段判断是否有skipWaiting，如果没有的话要关闭终端才能更新，有的话可以直接更新。一般开发的时候都会在install阶段声明skipwaiting。更新sw主要有两种方式，跟下sw的url，通常会在url添加hash值，第二种是更新sw里面的内容。我们可以使用workbox，workbox会自动帮我们跟新sw的hash和内容。





为什么需要模块化

js 是函数级的作用域，如果多个函数需要共享变量，那么会将变量提到全局作用域中，但这会造成变量全局污染和依赖混乱的问题，所以就需要模块化来解决上述的问题
主要的模块有以下几种。
- commonjs 是node的模块依赖规范，使用export或者module.exports导出模块，export的本质是module.export，exports倒出一个对象，假如想导出一个变量或者函数可以使用module.exports中。commonjs可以运行时动态加载，首次加载对应的模块时首会缓存在内部的一个大的module中，然后再执行。执行的顺序是父子父，下次加载的时候直接从缓存中获取，不会执行。这种方式解决了循环引用的问题。
- esmodule通过import导入模块，export导出模块。只能在文件的顶端进行导入，并且导入的变量是一个常量。不能动态导入。所以esmodule的规范是高度稳定的，three-shaking的原理也是基于esmodule的这个原理。esmodule的导入的模块是提前加载并执行的，优先执行子模块，然后在执行父模块。esm的实现主要有三个步骤，首先确定模块从哪里下载，然后从url中提取或者从文件系统中提取，最后解析想对应的模块记录，解析模块记录会采用深度优先后序遍历，找到最底层的export，将export的连接到内存中，然后向上查找到对应的import,也将import链接到对应的内存，这也解决了循环引用的问题
- AMD 是 RequireJS 在推广过程中对模块定义的规范化产出。CMD 是 SeaJS 在推广过程中对模块定义的规范化产出。对于依赖的模块，AMD 是提前执行，CMD 是延迟执行。不过 RequireJS 从 2.0 开始，也改成可以延迟执行. CMD 推崇依赖就近，AMD 推崇依赖前置



**对jsbridge的了解**

就是JavaScript(H5)与Native通信的桥梁，通过JSBridge与Native通信，赋予了JavaScript操作Native的能力，同时也给了Native调用JavaScript的能力。
JSBridge与Native间通信原理

在H5中JavaScript调用Native的方式主要用两种

1.注入API，注入Native对象或方法到JavaScript的window对象中(可以类比于RPC调用)。

2.拦截URL Schema，客户端拦截WebView的请求并做相应的操作(可以类比于JSONP)。


**实现一个脚手架**

- 使用 commander 设置运行命令以及启动脚手架
- 使用 inquirer.js 设置交互语句，询问用户创建项目需要哪些功能，然后获取到用户选择的功能以及配置
- 根据用户的选择合适的模版，进行渲染
- - 获取到用户选择模版的 package.json，合并构建输出的对应的package.json
- - 获取到用模版文件使用 ejs 进行渲染输出，ejs 能给根据用户的选择决定某些模块是否渲染
- - 使用 codemod 将相关的 options 和 import 插入到指定的文件。vuecodemod 将入口文件先转换成 ast，然后再 ast 中将相关的 import 和 options 插入到 AST 中，在将 ast 重新渲染
- 将渲染完的文件进行输出
- 运行安装命令


函数式编程

函数式编程作为声明式编程的一种形式，与命令式编程相对，命令式编程可以通过if-else控制流程，但函数式不能，所以需要函数组合子，组合子可以组合其他函数，组合子一般不包含变量和业务逻辑，他们的主要目的是管理函数的执行过程，并在链式调用中去处理中间结果，常见的组合子有compose、trycatch、map、reduce、filter、reverse、sort、curry。函数式编程来源于范畴论，最早是为了解决数学问题而诞生。范畴论认为，同一个范畴的所有成员，就是不同状态的"变形"，通过态射，一个成员可以变形成另一个成员。我们可以把物件理解为集合，态射理解为函数，通过函数，来规定范畴中成员之间的关系，函数扮演管道的角色，一个值进去，一个新值出来，没有其他副作用。函数不仅可以在用一个范畴之间转换，也能将一个范畴转换为另一个范畴。这就涉及到了函子。通常为了保证函数的尽可能纯粹性，副作用会使用函子进行统一管理。所谓的函子是函数式编程最基本的单位，它首先是一个范畴，包含了值和映射关系，它的映射关系就将当前函子转换为另一个函子，常见的有maybe菡子用于处理值为null的情况、either菡子用于错误处理，Either 函子有左值和右值，右值用来处理正常情况，左值用来处理异常情况、、IO 函子。它把不纯的操作（IO、网络请求、DOM）包裹在这个函数内，从而延迟这个操作的执行，相当于把这个副作用排到函子外部，这样函子是纯的。函数式风格包含了多种特性，典型的如函数一等公民、纯函数、副作用、柯里化、组合等。











**跨页面通信有多少种方式**

- 使用broadcastChannerl,BroadCast Channel 可以帮我们创建一个用于广播的通信频道，它的API和用法都非常简单。
- 使用service worker，Service Worker 是一个可以长期运行在后台的 Worker，能够实现与页面的双向通信。多页面共享间的 Service Worker 可以共享。service worker本身不具备通信的功能，所以我们要做一定的改造，将其改造成消息中转站，在 Service Worker 中监听了message事件，获取页面发送的信息。然后获取当前注册了该 Service Worker 的所有页面，通过调用每个页面的postMessage方法，向页面发送消息。
- 使用localstorage，同时利用storage-event去监听 LocalStorage 变化。
- Shared Worker 是 Worker 家族的另一个成员。普通的 Worker 之间是独立运行、数据互不相通；而多个 Tab 注册的 Shared Worker 则可以实现数据共享。
- 对于不同源的页面可以使用一个用户不可见的iframe作为桥，先利用post-message 向iframe发送消息，然后在让iframe利用上面的几种方式向同源的页面发送消息。


function get (source, path, defaultValue = undefined) {
  // a[3].b -> a.3.b
  const paths = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let result = source
  for (const p of paths) {
    result = Object(result)[p]
    if (result === undefined) {
      return defaultValue
    }
  }
  return result
}





**如何进行性能分析**

- 利用performance面板进行录制，如果是录制交互时的操作，可以暂停，录制前可以进行配置，比如网络环境、cpu核数
- 录制完后有报告主要有三大块，概览面板、性能指标面板和详情面板。
- 概览面板有将几个关键指标，诸如页面帧速 (FPS)、CPU 资源消耗、网络请求流量、V8 内存使用量 (堆内存) 等，按照时间顺序做成图表的形式展现出来，这就是概览面板，，如果 FPS 图表上出现了红色块，那么就表示红色块附近渲染出一帧所需时间过久，帧的渲染时间过久，就有可能导致页面卡顿。如果 CPU 图形占用面积太大，表示 CPU 使用率就越高，那么就有可能因为某个 JavaScript 占用太多的主线程时间，从而影响其他任务的执行。如果 V8 的内存使用量一直在增加，就有可能是某种原因导致了内存泄漏。当然还有想fp、LCP、DOMContentLoaded、Onload 等事件产生的时间点。
- 概览面板来定位到可能存在问题的时间节点,需要利用性能面板查看具体的原因，在性能面板中，记录了非常多的性能指标项，比如 Main 指标记录渲染主线程的任务执行过程，Compositor 指标记录了合成线程的任务执行过程，GPU 指标记录了 GPU 进程主线程的任务执行过程。有了这些详细的性能数据，就可以帮助我们轻松地定位到页面的性能问题。
- 通过性能面板的分析，我们知道了性能面板记录了多种指标的数据信息，并且以图形的形式展现在性能面板上。如果想要查看这些记录的详细信息，就需要引入详情面板了。


# babel
Babel 是一个工具链，主要用于在旧的浏览器或环境中将 ES6+的 代码转换为向后兼容版本的代码。主要有一下几个核心库，@babel/core 是整个 babel 的核心，它负责调度 babel 的各个组件来进行代码编译，是整个行为的组织者和调度者。@babel/preset-env，这是一个预设的插件集合，包含了一组相关的插件，Bable中是通过各种插件来指导如何进行代码转换。该插件包含所有的翻译规则，@babel/preset-env，可以根据选项参数来灵活地决定提供哪些插件，有三个关键的参数，target参数决定了我们项目需要适配到的环境,useBuiltIns决定 preset-env 如何处理 polyfills,一般使用usage， babel 会根据用户代码的使用情况，并根据 targets 自行注入相关 polyfills。corejs: corejs 并不是特殊概念,所有浏览器新 feature 的 polyfill 都会维护在 corejs-3。,@babel/preset-env只是提供了语法转换的规则，但是它并不能弥补浏览器缺失的一些新的功，此时就需要polyfill弥补低版本浏览器缺失的这些新功能。polyfill是在全局变量上挂载目标浏览器缺失的功能，因此在开发类库，第三方模块或者组件库时，就不能再使用babel-polyfill了，否则可能会造成全局污染，此时应该使用@babel/plugin-transform-runtime。transform-runtime的转换是非侵入性的，也就是它不会污染你的原有的方法。遇到需要转换的方法它会另起一个名字，否则会直接影响使用库的业务代码。我们在使用webpack打包js时，webpack并不知道应该怎么去调用这些规则去编译js。这时就需要babel-loader了，它作为一个中间桥梁，通过调用babel/core中的api来告诉webpack要如何处理js。


babel执行编译
- 首先是执行 normalizeFile 方法，该方法的作用就是将 code 转化为抽象语法树，JS 转换为 AST 的过程依赖于 @babel/parser，但如果我们需要自定义语法，或者是修改/扩展这些规则的时候，可以通过插件的方式自己写一个 parser 来覆盖默认的。
- 接着执行 transformFile 方法，该方法入参有我们的插件列表，使用 traverse 遍历 AST 节点，在遍历过程中执行插件。根据插件修改 AST 的内容。首先执行插件的 pre 方法，等待所有插件的 pre 方法都执行完毕后，在去执行visitor 中的方法，visitor会在遇到相应的节点或属性的时候才执行，为了优化，babel 将多个 visitor 合并成一个，最后执行插件的 post 方法。

```
module.exports = (babel) => {
  return {
    pre(path) {
      this.runtimeData = {}
    },
    visitor: {},
    post(path) {
      delete this.runtimeData
    }
  }
}

```

- AST 转换完毕后，需要将 AST 重新生成 code。@babel/generator 提供了默认的 generate 方法，生成目标代码





deepClone 解决循环引用

function isObject(obj) {
  return (typeof obj === "object" || typeof obj === "function") && obj !== null;
}
function cloneDeep(source, hash = new WeakMap()) {
  if (!isObject(source)) return source;
  if (hash.has(source)) return hash.get(source); // 新增代码，查哈希表

  var target = Array.isArray(source) ? [] : {};
  hash.set(source, target); // 新增代码，哈希表设值


  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (isObject(source[key])) {
        target[key] = cloneDeep(source[key], hash); // 新增代码，传入哈希表
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}


weakmap、weakset、set、map的区别

在开发的过程中，如果我们想让垃圾回收器回收一个对象，我们可以将这个对象的引用设置为null，这个时候就垃圾回收器就可以回收这个对象了，但是如果将一个对象设置为另外一个对象的属性或者值，这个时候在将前面那个对象设置为null，这样前面那个对象任然不可以被释放。所有当map的建值是对象的时候或者set储存了对象的时候，这个对象用完设置成null时是没办法使用的。所以有了weakmap,weakset

WeakSet 与 Set 的区别：

WeakSet 只能储存对象引用，不能存放值，而 Set 对象都可以
WeakSet 对象中储存的对象值都是被弱引用的，即垃圾回收机制不考虑 WeakSet 对该对象的应用，如果没有其他的变量或属性引用这个对象值，则这个对象将会被垃圾回收掉（不考虑该对象还存在于 WeakSet 中），所以，WeakSet 对象里有多少个成员元素，取决于垃圾回收机制有没有运行，运行前后成员个数可能不一致，遍历结束之后，有的成员可能取不到了（被垃圾回收了），WeakSet 对象是无法被遍历的（ES6 规定 WeakSet 不可遍历），也没有办法拿到它包含的所有元素

WeakMap 对象是一组键值对的集合，其中的键是弱引用对象，而值可以是任意。
注意，WeakMap 弱引用的只是键名，而不是键值。键值依然是正常引用。
WeakMap 中，每个键对自己所引用对象的引用都是弱引用，在没有其他引用和该键引用同一对象，这个对象将会被垃圾回收（相应的key则变成无效的），所以，WeakMap 的 key 是不可枚举的。


**nginx:**
nginx 在应用程序中的作用：解决跨域、请求过滤、配置 gzip和缓存、负载均衡、静态资源服务器

反向代理和正向代理

所谓的代理是指服务端和客户端之间有一层代理服务器，代理接受客户端的请求转发给服务端，然后将服务端的响应转发给客户端。代理分为正向代理和反向代理。所谓的正向代理是对客户端服务的，将客户端的请求代理到特定的机器上，对服务端来说他并不知道来自哪个机器上。反向代理是为服务器服务的，反向代理可以帮助服务器接收来自客户端的请求，帮助服务器做请求转发，负载均衡等。对客户端来说并不知道他访问的是代理服务器，而服务器知道反向代理在为他服务。

nginx 的结构

- main:nginx的全局配置，对全局生效。
- events: 配置影响 nginx 服务器或与用户的网络连接。
- http：可以嵌套多个 server，配置代理，缓存，日志定义等绝大多数功能和第三方模块的配置。
- server：配置虚拟主机的相关参数，一个 http 中可以有多个 server。
- location：配置请求的路由，以及各种页面的处理情况。
- upstream：配置后端服务器具体地址，负载均衡配置不可或缺的部分。


```
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;

events {
  worker_connections 1024;
}

http {
    server {
        listen 80;
        location  path {
            ...
        }
    }

    server {
        location  path {
            ...
        }
    }
}

```

配置负载均衡默认是轮询策略，将所有客户端请求轮询分配给服务端，这种策略是可以正常工作的，但是如果其中某一台服务器压力太大，出现延迟，会影响所有分配在这台服务器下的用户。还可以配置最小连接数策略、最快响应时间策略、客户端 ip 绑定，来自同一个 ip的请求永远只分配一台服务器，有效解决了动态网页存在的 session 共享问题。

```
upstream balanceServer {
    server 10.1.22.33:12345;
    server 10.1.22.34:12345;
    server 10.1.22.35:12345;
}


server {
    server_name  fe.server.com;
    listen 80;
    location /api {
        proxy_pass http://balanceServer;
    }
}

```



**请求阶段**
- 利用preconnect和dns-prefect进行预链接和预解析。请求的很大一部分时间都花在了链接上，特别是进行安全链接的情况下，需要dns解析、证书的验证、服务器间的重定向等。使用预链接和dns预解析能够降低用户的感知时间，并且这不会对服务端造成什么影响
- 避免使用重定向，如果资源地址发生了变化，那么直接采用变化的地址
- 对静态资源配置http缓存策略，如果是js的话可以保持在localstorage和indexdb里面。
- 降低传输载核的大小，对于js和css需要压缩，去除无效的代码。对于图片可以采用webp，有些浏览器不支持webp，需要降级，一般采用探测图片的宽高，在图片onload的时候查看图片的宽高，如果不符合预期，则加载jpeg或者png，配置gzip的传输。
- 减少请求数量，一个域名下tcp的链接数只能同时发起6个，多了6个需要排队等待。对于图标可以使用雪碧图或者font-icon，js或者css能合并就合并。
- 使用http2就不会有tcp的链接限制了
- 降低服务端的响应时间，提高服务端的性能，提高cpu和内存。如果使用了服务端渲染，例如react可以使用renderToNodeStream提高传输效率。

**解析阶段**

- 对于关键的js可以考虑使用内链，这样就不需要进行网络加载了。所谓的关键js是影响dom的解析和渲染的。对于非关键的js可以存放至cdn或者使用async、defer进行异步加载。
- css也是，核心的css可以直接内链，非核心的css可以使用preload预加载
- 去除无效的css，无效的css可以直接通过source面板中的coverage查看。
- 避免过多的dom,过多的dom会延长解析和渲染的时间，同时如果用户交互的话会造成延迟，因为他要去查找和计算。平时写代码需要注意，一些交互才会产生的dom那么交互时在产生。
- font字体，有些浏览器的文本会在网络字体加载完成后才会显示，可以配置font-display:wrap在加载之前使用系统字体。也可以使用preload预加载。
- 降低关键资源的请求链时间，关键资源就是所谓的影响页面渲染的js和css。提升关键资源的请求顺序，对于一些js可以延迟加载，比如组件的懒加载，react组件可以使用quicklink，他会在根据线程是否空闲或者是否在视窗范围进行预加载

**其他**

- css动画绘制的开始的时机可以使用requestAnimationFrame进行绘制
- 避免引起重绘和重排，使用gpu硬件加速、分层。
- 对dom的操作要进行读写分离。dom的读写也会引起重绘和重拍。


 

puppteer的screenshot是捕获到网络图片，然后再用image-diff做图片比较




docker

docker是一个虚拟容器，和普通的进程没什么区别，主要用来操作镜像，docker有几个重要的概念，第一个是镜像类似于虚拟机里面的快照，但比快照轻量多了，镜像是分层的，有基础镜像、中间件镜像、应用镜像，这三者之间依次叠加。所以当我们在构建镜像的时候每一个基础命令就是一个镜像层，书写命令的的时候能合并就合并。容器相当于镜像的实例化，应用是在容器中运行的，容器就是一个个独立的封闭的集装箱，但是也需要对外提供服务的，所以Docker允许公开容器的特定端口，在启动Docker的时候，我们就可以将容器的特定端口映射到宿主机上面的任意一个端口。仓库用来保存镜像。使用docker的好处主要有以下几种。
- 构建容易分发简单，只需要构建镜像文件，有了这个镜像，那么想复制到哪运行都可以，完全和平台无关了，不需要考虑环境。
- 同时Docker这种容器技术隔离出了独立的运行空间，不会和其他应用争用系统资源，所以不需要考虑应用之间相互影响。

```
启动docker容器
 docker run -d -p 2222:22 --name 容器名 镜像名
 -d 守护容器，就是后台运行，退出命令窗口容器也不会停止
 -it 交互式容器 退出命令窗口容器就停止运行了
 -p宿主机端口和容器端口映射
 8081:80 宿主机端口:容器公开的端口

```