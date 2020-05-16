---
layout: post
title: EventLoop
subtitle: EventLoop
date: 2020-05-15
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - js
---

# 宏任务（MacroTask）和微任务(MicroTask)

JS 任务分为**宏任务（MacroTask）**和**微任务(MicroTask)**

- 宏任务：setTimeOut、setInterval、setImmediate（浏览器暂时不支持，只有 IE10 支持，具体可见 MDN）、I/O、UI Rendering、js 脚本执行
- 微任务：Process.nextTick（Node 独有）、Promise、MutationObserver（用来监听 DOM 的变动）

# 浏览器中的 EventLoop

js 单线程的任务分为同步任务和异步任务，同步任务在主线程上排队执行，只有前一个任务执行完后才会执行下一个任务。异步任务不进入主线程，而是进入任务队列。主线程从"任务队列"中读取事件，这个过程是循环不断。异步任务的执行机制如下：

- 所有同步任务在主线程执行，形成一个执行栈。当函数执行的时候，会被添加到栈的顶部，当函数执行栈执行完成后，就会从栈顶移出。
- 主线程之外，还存在一个"任务队列"（task queue）。只要异步任务有了运行结果，就在"任务队列"之中放置一个事件。
- 一旦执行栈的同步任务执行完毕，系统就会将任务队列的异步任务读取到执行栈中执行。
- 主线程不断重复上面的第三步。

![Image text](https://user-gold-cdn.xitu.io/2020/5/15/17216d139392eede?w=1250&h=1086&f=png&s=368701)

**主线程不断从任务队列读取事件就被称为 EventLoop**

EventLoop 在浏览器中的运行，以一个例子为例：

```
console.log('start');
setTimeout(() => {
  console.log('timeout');
 Promise.resolve().then(() => {
  console.log('resolve2');
});
});
Promise.resolve().then(() => {
  console.log('resolve1');
});
console.log('end');
```

1:整个 script 是一个宏任务，将同步代码压入执行栈进行执行，先打印 start 和 end.
2：setTimeout 作为一个宏任务加入宏任务队列
3：promise.then 作为一个作为一个微任务，加入微任务队列，打印 resolve1。
4：待本次宏任务执行完后，检查微任务队列是否为空，发现有个 promise.then 微任务。
5：进入下一个宏任务，setTimeOut,执行 setTimeOut 发现有个微任务 promise.then，加入微任务队列。
6：将微任务队列的 promise 执行。打印 resolve2

练习题：

```
console.log('script start')

async function async1() {
  await async2()
  console.log('async1 end')
}
async function async2() {
  console.log('async2 end')
}
async1()

setTimeout(function() {
  console.log('setTimeout')
}, 0)

new Promise(resolve => {
  console.log('Promise')
  resolve()
})
  .then(function() {
    console.log('promise1')
  })
  .then(function() {
    console.log('promise2')
  })

console.log('script end')
```

执行结果：script start-》async2 end-》Promise-》script end-》async1 end-》promise1=》promise2=》setTimeout

# Node 中的 EventLoop

![Image text](https://user-gold-cdn.xitu.io/2020/5/15/17218b5e45863604?w=1718&h=672&f=png&s=340138)

根据上图，Node.js 的运行机制如下。

- V8 解析 js 脚本
- 解析后调用 Node API.
- LIBUV 负责 Node API 的执行，他将不同的任务分给不同的线程，形成一个 EventLoop,以异步的形式将执行结果返回给 V8 引擎。
- V8 引擎将结果返回给用户

**EventLoop 的流程图**
![Image text](https://user-gold-cdn.xitu.io/2020/5/15/17218bc8a5ff447c?w=1272&h=734&f=png&s=137637)

**timer:** 执行定时器阶段。如果当前阶段定时器到时间了，就执行想应得回掉函数

**pending callbacks**如果第一阶段结束了这时候 nodejs 会进入到 I/O 异常的回调阶段。比如说 TCP 连接遇到 ECONNREFUSED，就会在这个时候执行回调，并且在 check 阶段结束后，进入关闭事件的回调阶段。如果一个 socket 或句柄（handle）被突然关闭，例如 socket.destroy()， 'close' 事件的回调就会在这个阶段执行。

** idle,prepare** 预备空闲阶段，poll 前。

**poll 阶段（轮询)**，在 node 中难免会进行一些异步操作，比如 I/O,网络 I/O，当这些 I/O 执行完后，会通过 data、connect 等通知主线程进行轮询阶段。到达这阶段后：

- 如果 poll 队列不为空的时候，事件循环肯定是先遍历队列并同步执行回调，直到队列清空或执行回调数达到系统上限。

**poll 队列为空的时候，这里有两种情况。**

- 如果代码已经被 setImmediate()设定了回调，那么事件循环直接结束 poll 阶段进入 check 阶段来执行 check 队列里的回调。

**如果代码没有被设定 setImmediate()设定回调：**

- 如果有被设定的 timers，那么此时事件循环会检查 timers，如果有一个或多个 timers 下限时间已经到达，那么事件循环将绕回 timers 阶段，并执行 timers 的有效回调队列。
- 如果没有被设定 timers，这个时候事件循环是阻塞在 poll 阶段等待回调被加入 poll 队列。

**注：setImmediate()具有最高优先级，只要 poll 队列为空，代码被 setImmediate()，无论是否有 timers 达到下限时间，setImmediate()的代码都先执行。**

**check 阶段**是用来执行 setImmediate

**close callbacks** 关闭事件的回调阶段，比如上文提到的 socket 的关闭就是在此执行。执行完后进入下一个 eventloop;

**node11 版本之前和之后的差别**

- 在 node11 版本之后的执行顺序是 timer1、promise1、timer2、promise2，跟浏览器保持一致

- 在 node11 版本之前 timer、timer2、promise1、promise2。**node11 版本之前，定时器执行完后，发现队首仍然是定时器，不会先执行微任务，而是执行定时器，待定时器执行完后才继续执行微任务。**

```
setTimeout(()=>{
    console.log('timer1')
    Promise.resolve().then(function() {
        console.log('promise1')
    })
}, 0)
setTimeout(()=>{
    console.log('timer2')
    Promise.resolve().then(function() {
        console.log('promise2')
    })
}, 0)
```

# node 的 EventLoop 与浏览器 EventLoop 的区别

两者最主要的区别在于浏览器中的微任务是在每个相应的宏任务中执行的，而 nodejs 中的微任务是在不同阶段之间执行的。

# process.nextTick

process.nextTick 总是在执行栈结束后下一女 EventLoop 之前执行，他指定的任务总是在异步任务之前执行。

```
process.nextTick(function A() {
  console.log(1);
  process.nextTick(function B(){console.log(2);});
});

setTimeout(function timeout() {
  console.log('TIMEOUT FIRED');
}, 0)
```

上述代码由于 process.nextTick 方法指定的回调函数，总是在当前"执行栈"的尾部触发，所以不仅函数 A 比 setTimeout 指定的回调函数 timeout 先执行，而且函数 B 也比 timeout 先执行。这说明，如果有多个 process.nextTick 语句（不管它们是否嵌套），将全部在当前"执行栈"执行。

# setTimeOut 与 setImmediate 的区别

- setImmediate 在 check 阶段执行。
- setTimeout 安排在经过最小（ms）后运行的脚本，在 timer 阶段执行。

我们会发现 setTimeout 和 setImmediate 在 Node 环境下执行是靠“随缘法则”的，谁先执行取决于当前的上下文环境和进程性能。

```
setTimeout(() => {
    console.log('setTimeout');
}, 0);
setImmediate(() => {
    console.log('setImmediate');
})
```

执行的结果是这样子的：

![Image text](https://user-gold-cdn.xitu.io/2020/5/16/1721b40ec2ad4b87?w=1048&h=574&f=png&s=349545)
出现这种情况的原因

- 首先进入 timer 阶段，如果当前我们的进程性能一般，进入 timer 阶段 1ms 已结过去了（setTimeout(fn, 0)等价于 setTimeout(fn, 1)），那么在 timer 阶段会立即执行 setTimeOut.
- 如果进入 timer 阶段还没有 1ms，那么在 timer 阶段不会执行 setTimeout,直接进入 poll 阶段。
- 在 poll 阶段，由于回调队列是空的，检查到了 setImmediate，poll 阶段结束，进入 check 阶段执行 setImmdiate.
- 进入下一次 eventloop，执行 setTimeout

**如果在 I / O 周期内移动两个调用，则始终首先执行立即回调：**

```
const fs = require('fs');

fs.readFile(__filename, () => {
  setTimeout(() => {
    console.log('timeout');
  }, 0);
  setImmediate(() => {
    console.log('immediate');
  });
});
```

执行结果总是**immediate->timeout**,出现这样的情况。

- fs.readFile 的回调总是在 poll 阶段执行.
- 当回调执行完毕后发现有 setImmediate,poll 阶段结束，进入 check 阶段执行 immediate.
- 执行完 immediate 后进入下一个 eventloop 执行 setTimeout

# 参考

https://segmentfault.com/a/1190000013102056

http://www.ruanyifeng.com/blog/2014/10/event-loop.html

https://juejin.im/post/5c3d8956e51d4511dc72c200
