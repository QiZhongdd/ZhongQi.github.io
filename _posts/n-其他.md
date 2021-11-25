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
Worker 线程无法读取本地文件，它所加载的脚步必须来自网络。
主线程可以通过postMessage方法发送消息，onMessage接受消息。terminate()关闭.子线程通过addEventListner监听message获得主线程的消息，通过postMessage发送给消息。
importScripts()加载脚本。
webworker传输的内容可以是文本、对象也可以是二进制数据，这种通信是拷贝的关系，即修改了数据也不会影响到主线程。浏览器内部的通信机制是将内容进行串行化（将对象存储到介质中，如文件，内存缓存，）或者以二进制进行传输，然后再把串行化的字符串交给worker。


serviceworker
serviceworker主要是用于将静态资源缓存到本地，通过拦截代理请求，读取本地文件，加快访问速度。pw上兼容性不太好，移动安卓支持良好，ios要12+,但sw并不会影响正常运行，项目上还是能投入生产。
主要有以下几个特性：
- serviceworker拥有自己独立的线程
- 离线缓存静态资源
- 拦截代理请求和响应
- 可自定义响应内容
- 通过postMessage向主线程发送消息
- 无法操作dom
- 必须在https或localhost
- 通过promise异步实现
- serviceWorker一旦安装完成后，就会一直存在，除非手动卸载。
使用的时候有以下几个步骤
- 检测是否支持serviceworker
- 通过regester在主线程注册，然后就会安装serviceWorker，缓存静态资源
- 安装成功后就会激活，激活后主要进行缓存清理，更新service worker
- 卸载
- 注意事项:
如果需要更新，在install中使用skipWaiting会强制更新。可以使用fecth去进行请求拦截，缓存未匹配对应的request。
webpack中使用webpack-sw-plugin


为什么需要模块化

js 是函数级的作用域，如果多个函数需要共享变量，那么会将变量提到全局作用域中，但这会造成变量全局污染和依赖混乱的问题，所以就需要模块化来解决上述的问题

commonjs 

每个模块文件上都包含 module，exports，require、\_filename、\_dirname 的变量

- module 记录当前模块信息。
- require 引入模块的方法。
- exports 当前模块导出的属性

在编译的时候，commonjs 对代码快都进行了包装,在 Commonjs 规范下模块中，会形成一个包装函数，我们写的代码将作为包装函数的执行上下文，使用的 require ，exports ，module 本质上是通过形参的方式传递到包装函数中的。
commonjs 是同步加载并执行，采用深度遍历，执行的顺序为父-》子-》父。在初次加载的时候先缓存然后执行，下次加载的时候会直接从缓存中获取，这也避免了循环引用。


**ES6 module 特性**

- esmodule 是静态的，不能放在块计作用域、条件语句中，代码发生编译时
- 导出的值是动态绑定的，可以通过导出的方法修改，不能直接将导出的值之间修改
- esmodule 是提前加载并执行，执行的顺序是字模块-》父模块
- esmodule 的静态属性可以容易实现 tree-shaking.
- esmodule 的动态加载可以很轻松的实现代码分割，避免一次性加载大量 js 文件，造成首次加载白屏时间过长的情况
- esmodule 可以同时导出和引入多个属性


**tree shaking 实现**

ES6 module 的引入和导出是静态的，import 会自动提升到代码的顶层，所以不能放在块级作用域和条件语句中。并且导入的名称不能为字符串或者条件语句中。这种静态语法在编译的过程中就确定了导入和到处的关系所以更方便查找依赖和 tree shaking。

tree shaking 是 webpack 中的实现,用来删除无效的代码，利用的是 ES module 是的静态语法。



对于 ESM实现原理 ，这个过程包含三个阶段：


构建
- 首先会确定从哪里下载该模块的文件，也称为模块的定位
- 然后提取文件，从 URL 或者文件系统下载。
- 解析为模块记录

实例化

JS 引擎会为每个模块记录创建 模块环境记录（module environment record），用来关联模块实例和模块的导入/导出值。引擎会先采用 深度优先后序遍历（depth first post-order traversal），将模块及其依赖的导出 export 连接到内存中，然后逐层返回再把模块相对应的导入 import 连接到内存的同一位置。这也解释了为什么导出模块的值变更时，导入模块也能捕捉到该值的变更。，实例化只是 JS 引擎在内存中绑定模块间关系，并没有执行任何代码，也就是说这些连接好的内存空间中并没有存储变量值，然而，在此过程中导出函数将会被初始化，即所谓的 函数具有提升作用。

这使循环依赖的问题自然而然地被解决：

JS 引擎不需要关心是否存在循环依赖，只需要在代码运行的时候，从内存空间中读取该导出值。

运行

运行代码，从而把内存空间填充为真实值。



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
- - 使用 vue-codemod 将相关的 options 和 import 插入到指定的文件。vuecodemod 将入口文件先转换成 ast，然后再 ast 中将相关的 import 和 options 插入到 AST 中，在将 ast 重新渲染
- 将渲染完的文件进行输出
- 运行安装命令


```
lodash.get
// function find(obj,str){
//   var arr = str.split('.')
//   try {
//     let index = 0
//     var temp = obj[arr[index]]
//     while(temp && index<arr.length-1){
//       index++
//       temp = temp[arr[index]]
//       if(!temp){
//         return undefined
//       }
//     }
//     return temp
//   } catch (error) {
//     return undefined
//   }
// }
// var t = find(obj,'a.b.c')
// console.log(t)

```

```
function lodashGet(obj,str){
  const arr=str.split('.');
  try{
    let index=0;
    let temp=obj[arr[index]]
    while(temp&&index<arr.length-1){
      index++;
      temp=temp[arr[index]]
      if(!temp)return undefined;
    }
  }catch(){
    return undefined;
  } 
}
```