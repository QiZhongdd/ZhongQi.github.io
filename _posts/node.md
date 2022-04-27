**node的优缺点以及如何处理高并发**

Nodejs 与操作系统交互，我们在 JavaScript 中调用的方法，最终都会通过 process.binding 传递到 C/C++ 层面，最终由他们来执行真正的操作。Node.js 即这样与操作系统进行互动。、Nodejs 所谓的单线程，只是主线程是单线程，所有的网络请求或者异步任务都交给了内部的线程池去实现，本身只负责不断的往返调度，由事件循环不断驱动事件执行。单线程可以处理高并发的原因，得益于 libuv 层的事件循环机制，和底层线程池实现。所以I/O 密集型处理是 Nodejs 的强项，因为 Nodejs 的 I/O 请求都是异步的（如：sql 查询请求、文件流操作操作请求、http 请求...）缺点就是不擅长 cpu 密集型的操作（复杂的运算、图片的操作），node控制并发的注意又三种方法
eventproxy：eventproxy是使用类似递归的方式，让每次最大同时请求数量控制在设定的值
async.queue：通过callback通知queue任务执行完成，可以执行下一个了
async.mapLimit：原理基本与queue相类似 有点不同的是queue可以拿到各个时间点的监听事件





# node性能测试

上线之前首先要压力测试配合linux命令找到性能瓶颈，然后进行node性能分析，进行优化。上线后要进行监控，如果出现异常要报警。

**压力测试配合linux命令找到性能瓶颈**
压力测试可以使用webbench和ab,重点关注qps和吞吐量，如果吞吐量与网卡的吞吐量相同，那么瓶颈就是在网卡，如果不是那么可能就是cpu、内存、硬盘,可以在压测的时候使用linux的top命令去查看内存和cpu的占用，硬盘可以使用iostat用来查看，iostat是用来io设备的带宽，还有一个性能瓶颈是在后端服务器上，假如node层的吞吐量大于服务端的吞吐量，那么瓶颈就是服务端。通常瓶颈是node层cpu运算能力上，比如做一些字符串的js运算都有可能成为性能瓶颈，这体现在cpu占用100%或者机器的负载达到了100%。如果是node层的问题那么可能就是某一段代码写的不够好，浪费了大量的性能。所以需要找到哪一段代码消耗了大量的性能。

**Node性能分析**

Node自带性能分析工具profile，根据profile生成的log可以查看到js运算以及c++运算的耗时、重点需要关注heavy botton up，该栏是按调用栈来划分的，能看到每一个函数占他父的调用的比例。

也可以用chrome devtool去调试node,因为node跟chrome都是用的v8，在performance中的使用快照可以查看到相关调用栈的耗时，也可以通过ip查看远端服务器的运算情况

clinic可以根据可视化图表查看到事件循环的时间、cpu使用情况、代码每一段调用的耗时。一般使用与大项目


一些案例：
- 避免大量的IO读写，比如每一个请求都进行读写操作，考虑下能不能优化只读写一次
- 使用buffer进行传输，在进行传输渲染的时候不先转换成utf8而是直接进行buffer传输会提高效率，因为传输给body的是字符串，但node的最终还是要将字符串转成buffer传输给c++，最终c++输出去body还是buffer。
  
**内存管理**

新生代容量小，回收快，老生代容量大，回收慢。减少内存使用也是提高性能的手段，如果有内存泄露会导致服务性能大大降低。所以上线时需要检查是否有内存泄露。
也可以使用chorme devtool的快照对比压测时和压测后的内存使用情况，如果压测后的内存大于压测时的内存表示内存泄漏。可以用comparison对比两个快照的情况。

# 性能优化

性能优化的准则是减少不必要的计算，需要思考的是在用户能感知到的时间能这段代码是不是有必要的，能不能挪到其他地方去运算，或者能不能空间换时间，尽可能挪到程序启动的时候运行。比如模版字符串在启动的时候就进行编译运算，当用户请求的时候将编译好的字符串返回回去。

1.动静分离

node处理静态文件能力并不突出，将图片、字体、样式表和多媒体等静态文件都引导到专业的静态文件服务器上，让node曾只处理动态请求即可。这个过程可以用 nginx 或者专业的cdn 来处理。

2.启用缓存

提升性能其实羞不多只有两个途经，一是提升服务的速度，二是避免不必要的计算。前者提升的性能在海量流量面前终有瓶颈，但后者却能够在访问量越大是收益越多。避免不必要的计算，应用场景最多的就是缓存。可以使用redis、开启https缓存策略。

3.多进程架构

通过多进程架构,不仅可以充分利用多核cpu, 更是可以建立机制让node 进程更加健壮，可以使用pm2进程管理。

4.代码层的优化

使用新版本的node就能提升性能的提升 每个版本的性能提升来自两个方面v8 的版本更新；node 内部代码的更新优化。

5.使用fast-json-stringify加快json序列化，在json序列化时需要识别大量字段类型，根据不同的字段类型进行不同的操作，如果已经提前通过schema知道每个字段的类型，那么就不需要遍历、识别字段类型，而可以直接用序列化对应的字段，这就大大减少了计算开销，这就是fast-json-stringify 的原理。

6.正确的编写异步代码





# node的性能监控

性能监控主要分为两大类，一类是业务逻辑型的监控，第二种是日志型的监控。
性能监控主要分为以下几种
- 日志监控，可以通过监控日志的异常，将新增异常的数量类型反应出来。监控日志还可以监控pv和uv知道访问高峰
- 响应时间监控：一旦某个子系统异常或者出现性能瓶颈，那么就会导致响应时间的延长，响应时长可以通过nginx反向代理或者着自行产生日志进行监控
- 监控进程：监控日志和响应时常都是运行状态，所以监控进程是比前两者更为紧要的任务，监控进程一般是检査操作系统中运行的应用进程数，比如对于采用多进程架构的node应用，就需要检査工作进程的数,如果低于预估值，就应当发出报警。
- 监控磁盘异常：磁盘监控主要是监控磁盘的用量。由于日志频繁写的缘故，磁盘空间渐渐被用光。一且磁盘不够用，将会引发系统的各种问题，给磁盘的使用量设置一个上限，一旦磁盘用量超过警戒值，服务器的管理者就应诙整理日志或清理磁盘。
- 内存监控，正常的内存应该是有升有将的，如果内存只是上升，那么就是出现了内存泄露的状况，可以对内存使用设置一个监控值，一旦内存大过这个值那么意外者出现了内存泄漏。
- 网络监控：但还是需要对流量进行监控并设量上限值。即便应用突然受到用户的青昧，流量暴涨时也能通过数值感知到网站的宣传是否有效，一旦流量超过警戒值，开发者就应当找出流量增长的原因。网络流量监控的两个主要指标是流入流量和流出流量。

# node错误监控

错误分类
- 当语法错误或者运行错误会触发js错误
- 当读写文件发生错误时会出现系统错误
- 除 js 错误和系统错误外，还可以自定义错误。

生成日志可以使用log4j、connect中间件，错误监控平台还可以用sentry。



**简单实现一个koa**

koa的步骤
- 建立koa类,因为koa是要new使用的。
- 创建app.use，用来注册中间件
- 创建app.lisnter，主要是使用http.createServer进行创建，httpServer会接受一个callback，它是http的回调函数，主要用来处理网络请求。对于一个请求来说，它要穿个一个个中间件，以递归的形式去执行相关的中间件，在执行中间件的时候如果有next函数，那么会创建一个promise，等到下一个中间件执行完毕后才会执行next后面的代码。
- 调用createContext，根据req和res创建ctx这个上下文，req是httpServer的请求描述符，而ctx中的request对req进行了扩展，response和res也是如此。
- ctx创建完毕后，那么就处理相关的请求，将ctx传递给回调函数


**cluster**

Node.js是单线程的，一个单独的Node.js进程无法充分利用多核,cluster模块，很方便的做到充分利用多核机器。cluster模块封装了创建子进程、进程间通信、服务负载均衡。有两类进程，master进程和worker进程，master进程是主控进程，它负责启动worker进程，worker是子进程、干活的进程。Node.js 多进程模型基于round-robin，主要思路是master进程创建socket，绑定好地址以及端口后再进行监听。该socket的文件描述符不传递到各个worker进程。Master进程收到客户端请求后，Cluster 模块会通过监听内部TCP服务器的connection事件，在监听器函数里，负载均衡地挑选出一个worker，向其发送newconn内部消息以及一个客户端句柄，Worker进程在接收到了newconn内部消息后，根据传递过来的句柄，调用实际的业务逻辑处理并返回。worker进程会于master进程共用一个端口，这是因为master进程在fork worker进程时，会为其附上环境变量NODE_UNIQUE_ID，是一个从零开始的递增数，随后Node.js在初始化时，会根据该环境变量，来判断该进程是否为cluster模块fork出的工作进程，若是，则执行workerInit()函数来初始化环境，在workerInit函数中，定义了cluster._getServer方法，这个方法主要干了两件事，第一件是向master进程注册该worker，若master进程是第一次接收到监听此端口和描述符下的worker，则起一个内部TCP服务器，来承担监听该端口/描述符的职责，随后在master中记录下该worker。第二件是Hack掉worker进程中的net.Server中的listen方法里监听端口/描述符的部分，使其不再承担职责。所以不会出现端口被重复监听报错，是由于在worker进程中，最后执行监听端口操作的方法，已被cluster模块主动覆盖。






**Buffer模块**

Buffer类是随Node内核一起发布的核心库。Buffer为Node带来了一种存储原始数据的方法，可以让node处理二进制数据，每当需要在node中处理I/O操作中移动的数据时，就有可能使用Buffer库。Buffer 和 Javascript 字符串对象之间的转换需要显式地调用编码方法来完成，常用的有ascii、base64、utf8等，Buffer对象的内存分配不是在V8的堆内存中，是在Node的C++层面实现内存的申请。说到 Buffer 就不得不提到 Buffer 的 8k 池,在buffer模块中，allocate() 和 fromString() 两个函数直接与8k池相关，allocate() 和 fromString() 都是分为大于 4k 和小于 4k 两种情况来处理。小于 4k 时，先检查8k池的剩余容量，如果大于剩余容量调用 createPool()，创建一个新的8k池，然后修正 poolOffset，poolOffset 只能为 8 的倍数，createPool() 内部调用 createUnsafeArrayBuffer() 来获取一个对应大小的 ArrayBuffer 实例，ArrayBuffer 是 raw binary data，所以它是不安全的，存在泄漏内存中敏感信息的危险。大于4kb直接创建一个 createUnsafeArrayBuffer()。

Buffer.from() 和 Buffer.alloc(): 取到原始 buffer 后，对原始数据进行了替换，所以它们是 safe 的
Buffer.allocUnsafe() 和 Buffer.allocUnsafeSlow(): 直接使用原始 buffer，所以它们是 unsafe 的



**为什么使用bff**
- 削减后端的压力，比如后端会传很多的字段，但我们其实用不到那么多，那么我们可以进行削减，这对前端是比较重要，前端性能最核心的就是数据量需要小，加快传输速度。但这样回导致多了一层http，这是比较致命的，http请求的时候还会有一些tcp链接的这些时间，我们可以使用socket进行通信，削减掉这一层，使用socket还有一个好处是进行全双工的通信。
- 第二个就是如果我们不是特别要求站点的秒开率，只是为了展示一些b端的项目，那么可以在中间做一个render，有点类似同源，不让前端接口跨域.做了一个真假路由的混用，api路由后面的属于数据，其他的属于html界面，这样就不需要nginx，直接和node融入到一块了。如果想做的深入一点的话，那么我们还可以进行同构，让view直接输出

保证node服务的稳定性，丢给pm2。当然也不能把所有的丢个pm2，比如监控我们可以采用其他的，像minio，对服务端的错误、内存、qps、cpu进行监测，要近可能的catch到所有的error，比如我们的fetch要去封装，像我们不管服务端饭后50几或者40几的状态吗都返回一个空的json，不让他报错。想错误监控的话如果使用的koa可以用onerror进行，还有就是promise的reject的错误、业务逻辑的错误、全局蹦了，全局崩了可以用process.on进行监控。当然如果qps比较大的话，那么纯node还是顶不值的。像我们网约车那边的qps高峰的时候能达到30万，他们管控的是下单，他们用的是go，当然node也可以去弄，就需要使用webassembly,这样成本就太大了，失去了本来的意义。



**socket**

socket并不是一个协议，他是应用层与传输层的一个抽象层，它把tcp/ip层复杂的操作抽象为几个简单的接口进行供应用层进行调用，以实现进程在网络中通信。socket是全双工的。socket是一个特殊的文件，他只有文件描述符，进程可以打开一个socket，并且可以像文件一样进行读写操作，不必关心数据在网络是如何传输的，socket是链接在tcp链接的两端。socket是基于tcp实现的，**绑定进程**通过传输层的协议和端口号的唯一标识绑定这个端口的进程。**绑定端口**服务端在启动端口时会绑定一个端口进行服务，而客户端在链接请求的时候会被随机分配一个端口。

**socket和websocket的区别**
socket是应用层和传输层的抽象，将复杂的Tcp/ip协议影藏在socket的接口后，只对应用层暴露简单的接口。而websocke是应用层协议，他是基于tcp实现的，同时接住了http协议建立连接。
websocket的连接过程
- 服务端与客户端建立tcp连接、建立http连接
- 客户端像服务端发起一个http请求，请求头中得包含upgrate：websocket，connection:upgrate，表示升级到webscoket连接
- 服务端进行回应，回应的响应头也包含upgrate：websocket，connection:upgrate，。表示同意升级协议，然后用websocke进行通信


**koa中间件**

koa中间件的核心是洋葱模型，通过use进行注册多个中间件放入数组中，然后中间件数组中中间件的执行方式是通过递归的方式进行处理的，调用dispatch函数，从第一函数开始执行，有next的时候创建一个promise,等到下一个中间件执行完毕后才执行next后面的代码，当第二个中间件有next的时候依然会创建一个promise，等下一个中间件执行完毕。
```

function compose(middleware){
 return function (context, next) {
    let index = -1 //记录上一次执行中间件的位置
    return dispatch(0)
    function dispatch (i) {
      // 理论上 i 会大于 index，因为每次执行一次都会把 i递增，
      // 如果相等或者小于，则说明next()执行了多次
      if (i <= index) return Promise.reject(new Error('next() called multiple times'))
      index = i
      let fn = middleware[i]
      if (i === middleware.length) fn = next
      if (!fn) return Promise.resolve()
      try { 
        return Promise.resolve(fn(context, function next () {
          return dispatch(i + 1)
        }))
      } catch (err) {
        return Promise.reject(err)
      }
    }
  }
}

```



**pm2的优势**

一般监控 node 有几种方案：

supervisor: 一般用作开发环境的使用,终端关闭了程序也会停止；
forever: 管理多个站点，一般每个站点的访问量不大的情况，不需要监控；
PM2: 网站的访问量比较大，需要完整的监控页面。

pm2的优势
后台运行(关掉cmd窗口依然运行)
0 秒停机重载，维护升级时不需要停机
Linux (stable) & MacOSx (stable) & Windows (stable).多平台支持
进程守护 (停止不稳定的进程，避免无限循环)
使用了cluster模式可以实现负载均衡，就是由于多实例机制，可以保证服务器的容错性，就算出现异常也不会使多个服务实例同时崩溃。
实时控制台检测，监视每个node进程的CPU和内存的使用情况。
提供 HTTP API,远程控制和实时的接口API ( nodejs 模块,允许和PM2进程管理器交互 )
不仅仅可以启动node程序，对于一般的脚本程序同样可以


