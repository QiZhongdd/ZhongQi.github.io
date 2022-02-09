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

减少内存使用
buffer是node.js自己做的一个对象，不受v8的控制，buffer的分配策略有两种，大于8kb和小于8kb。buffer对应的c++char数组。如果小于8kb的buffer,只会实例化一次char.加入当前定义的buffer为2kb,那么会分配2kb的char给buffer。下次使用小于8kb的buffer不会在实例化char，继续分配一部分给buffer，如果当前的char用完了，那么会在实例化一个char继续分配。在使用期间，如果有一个buffer销毁，在char里面的空间也会释放。


# cluster多进程优化

  
使用cluster启动多个子进程运行多个http服务。fork多个进程意味着会把代码和内存复制一遍，如果占满了cpu，可能会导致事件循环或者其他计算没有做到及时处理。所以不要把进程数与cpu核数相同。pm2的原理就是如此。要对进程进行守护，一旦有个进程失效，可以在一段时间后进行重启。或者可以每隔一段时间给子进程发送消息，看下子进程有没有回复，如果没有回复可能意味着字进程进入假死状态，应该杀掉该进程。

使用多个进程启动多个http服务，意味这端口号相同，正常情况下是会报错的，但cluster模块不会，这是因为启动的其实是主进程，在cluster模块中一旦监听到有新的请求进来，那么会将相关的请求分发给子进程。相当于维护了一个事件池，一旦有子进程空闲，那么会从事件池取出一个事件进行分发。

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




# koa

**简单实现一个koa**

koa的步骤
- 建立koa类,因为koa是要new使用的。
- 创建app.use，用来注册中间件
- 创建app.lisnter，主要是使用http.createServer进行创建，httpServer会接受一个callback，它是http的回调函数，主要用来处理网络请求。对于一个请求来说，它要穿个一个个中间件，以递归的形式去执行相关的中间件，在执行中间件的时候如果有next函数，那么会创建一个promise，等到下一个中间件执行完毕后才会执行next后面的代码。
- 调用createContext，根据req和res创建ctx这个上下文，req是httpServer的请求描述符，而ctx中的request对req进行了扩展，response和res也是如此。
- ctx创建完毕后，那么就处理相关的请求，将ctx传递给回调函数

**实现一个洋葱模型**

```
function compose(middleware){
 return function (context, next) {
    // last called middleware #
    let index = -1
    return dispatch(0)
    function dispatch (i) {
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

其他实现一个函数式编程compose

```
function compose(func){
  if (funcs.length === 0) {
    return arg => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funs.reverse().reduce((a,b)=>(...args)=>a(b(...args)))
}

```




**node child_process**

child_process 是Node的一个十分重要的模块，通过它可以实现创建多进程，以利用单机的多核计算资源。虽然，node天生是单线程单进程的，但是有了child_process模块，可以在程序中直接创建子进程，并使用主进程和子进程之间实现通信。Node 中实现了 IPC 通信的是管道技术，父进程在创建子进程前创建IPC通道并监听, 用环境变量NODE_CHANNEL_FD告诉子进程的IPC的文件描述符。子进程在启动的过程中连接IPC的文件描述符，建立连接后父子进程就可以自由的进行全双工的通信了。ChildProcess 类的实例，通过调用 ChildProcess#send 方法，我们可以实现与子进程的通信，可以支持传递 net.Server ，net.Socket 等多种句柄，使用它，我们可以很轻松的实现在进程间转发 TCP socket。传递过程大概如下主进程：传递消息和句柄。将消息包装成内部消息，使用 JSON.stringify 序列化为字符串。然后序列化句柄。将序列化后的字符串和句柄发送给 IPCchannel 。子进程使用 JSON.parse 反序列化消息字符串为消息对象。触发内部消息事件internalMessage监听器。，将传递来的句柄使用  方法反序列化为 JavaScript 对象。
带着消息对象中的具体消息内容和反序列化后的句柄对象，触发用户级别事件







**cluster**

Node.js是单线程的，一个单独的Node.js进程无法充分利用多核,cluster模块，很方便的做到充分利用多核机器。cluster模块封装了创建子进程、进程间通信、服务负载均衡。有两类进程，master进程和worker进程，master进程是主控进程，它负责启动worker进程，worker是子进程、干活的进程。Node.js 多进程模型基于round-robin，主要思路是master进程创建socket，绑定好地址以及端口后再进行监听。该socket的文件描述符不传递到各个worker进程。Master进程收到客户端请求后，Cluster 模块会通过监听内部TCP服务器的connection事件，在监听器函数里，负载均衡地挑选出一个worker，向其发送newconn内部消息以及一个客户端句柄，Worker进程在接收到了newconn内部消息后，根据传递过来的句柄，调用实际的业务逻辑处理并返回。worker进程会于master进程共用一个端口，这是因为master进程在fork worker进程时，会为其附上环境变量NODE_UNIQUE_ID，是一个从零开始的递增数，随后Node.js在初始化时，会根据该环境变量，来判断该进程是否为cluster模块fork出的工作进程，若是，则执行workerInit()函数来初始化环境，在workerInit函数中，定义了cluster._getServer方法，这个方法主要干了两件事，第一件是向master进程注册该worker，若master进程是第一次接收到监听此端口和描述符下的worker，则起一个内部TCP服务器，来承担监听该端口/描述符的职责，随后在master中记录下该worker。第二件是Hack掉worker进程中的net.Server中的listen方法里监听端口/描述符的部分，使其不再承担职责。所以不会出现端口被重复监听报错，是由于在worker进程中，最后执行监听端口操作的方法，已被cluster模块主动覆盖。






Buffer模块

Buffer类是随Node内核一起发布的核心库。Buffer为Node带来了一种存储原始数据的方法，可以让node处理二进制数据，每当需要在node中处理I/O操作中移动的数据时，就有可能使用Buffer库。Buffer 和 Javascript 字符串对象之间的转换需要显式地调用编码方法来完成，常用的有ascii、base64、utf8等，Buffer对象的内存分配不是在V8的堆内存中，是在Node的C++层面实现内存的申请。说到 Buffer 就不得不提到 Buffer 的 8k 池,在buffer模块中，allocate() 和 fromString() 两个函数直接与8k池相关，allocate() 和 fromString() 都是分为大于 4k 和小于 4k 两种情况来处理。小于 4k 时，先检查8k池的剩余容量，如果大于剩余容量调用 createPool()，创建一个新的8k池，然后修正 poolOffset，poolOffset 只能为 8 的倍数，createPool() 内部调用 createUnsafeArrayBuffer() 来获取一个对应大小的 ArrayBuffer 实例，ArrayBuffer 是 raw binary data，所以它是不安全的，存在泄漏内存中敏感信息的危险。大于4kb直接创建一个 createUnsafeArrayBuffer()。

Buffer.from() 和 Buffer.alloc(): 取到原始 buffer 后，对原始数据进行了替换，所以它们是 safe 的
Buffer.allocUnsafe() 和 Buffer.allocUnsafeSlow(): 直接使用原始 buffer，所以它们是 unsafe 的







# 其他

**上传文件content-type用什么类型，文件内容是一次性传过来的吗**

上次文件用的multipart/form-data，文件内容是以stream的形式一点一点传过来的。http模块的createServer的request实现了readableStream接口，这个信息流可以被监听，也可以与其他流进行对接。我们只要在监听data和end对流进行拼接。







为什么使用bff，
- 削减后端的压力，比如后端会传很多的字段，但我们其实用不到那么多，那么我们可以进行削减，这对前端是比较重要，前端性能最核心的就是数据量需要小，加快传输速度。但这样回导致多了一层http，这是比较致命的，http请求的时候还会有一些tcp链接的这些时间，我们可以使用socket进行通信，削减掉这一层，使用socket还有一个好处是进行全双工的通信。
- 第二个就是如果我们不是特别要求站点的秒开率，只是为了展示一些b端的项目，那么可以在中间做一个render，有点类似同源，不让前端接口跨域.做了一个真假路由的混用，api路由后面的属于数据，其他的属于html界面，这样就不需要nginx，直接和node融入到一块了。如果想做的深入一点的话，那么我们还可以进行同构，让view直接输出

使用vue或者react同构进行模版引擎那么会比其他模版引擎慢。所有的模版引擎就是一个大的function，最后一个render进行输出，比如koa-swig，对服务端渲染来说最关键的就是输出一个stream,像koa-swig做的好的原因是因为他比较纯粹，就是一个stream的输出，同时还做了缓存，然后在基于buffer或者big-pipe进行输出，这也是服务端渲染的基本诉求。但对于react和vue进行服务端渲染他们不想使用模版引擎，那如果使用了koa-swig,又使用了他们的自身的模版引擎，相当于两个模版引擎。这样就难以统一，向vue2这一块做的比较糟糕的原因是因为，在用render进行输出的时候它还进行了一次diff，这没有任何意义，而且他的keep-alive是基于lru的，而这后端没有，相当于缓存机制没有，字符输出也没有。而且他的template会常驻gc，导致node无法回收，node那里有那吗内存给他使用。而react相对于vue来说要好点，但也要将服务端的string和本地的组件进行调和。因为要共用redux、recoil这些状态管理，比如服务端的值是1，在前端的需要用setTimeOut改成10，那么需要采用前端的值，所有需要进行调和，这样就又浪费了一段性能。

保证node服务的稳定性，丢给pm2。当然也不能把所有的丢个pm2，比如监控我们可以采用其他的，像minio，对服务端的错误、内存、qps、cpu进行监测，要近可能的catch到所有的error，比如我们的fetch要去封装，像我们不管服务端饭后50几或者40几的状态吗都返回一个空的json，不让他报错。想错误监控的话如果使用的koa可以用onerror进行，还有就是promise的reject的错误、业务逻辑的错误、全局蹦了，全局崩了可以用process.on进行监控。当然如果qps比较大的话，那么纯node还是顶不值的。像我们网约车那边的qps高峰的时候能达到30万，他们管控的是下单，他们用的是go，当然node也可以去弄，就需要使用webassembly,这样成本就太大了，失去了本来的意义。


node 内存泄漏的情况

- 使用了比较大的全局变量，比如有些时候我们会将用户每次请求的数据都保存在了一个全局变量中做缓存，随着请求的增加导致这个变量越来越大，如果需要保存数据的话我们可以保存在redis或者数据库中。
- 使用了闭包
- 使用了promise，promise会常驻内存，直到他resolve或者reject后才会被清除。解决方案就是限制 Promise 运行的时间，主要的原理是将一个用setTimeOut resove的promise和我们真实任务的promise放到promise.race中，等到timeout到了以后执行resolve,然后就会被释放