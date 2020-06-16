---
layout: post
title: SharedArrayBuffer and Atomics（共享内存和原子）
subtitle: SharedArrayBuffer and Atomics（共享内存和原子）
date: 2020-05-09
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - ES新特性
---

# 简述

ES8 引入了两部分内容：新的构造函数 SharedArrayBuffer、具有辅助函数的命名空间对象 Atomics。共享内存是指多个线程并发读写数据，原子能够控制并发，确保多个有竞争关系的线程能够顺利执行

共享内存和原子也称为共享阵列缓冲区，它是更高级的并发抽象的基本构建块。它允许在多个工作者和主线程之间共享 SharedArrayBuffer 对象的字节（缓冲区是共享的，用以访问字节，将其包装在类型化的数组中）。这种共享有两个好处：
可以更快地在 web worker 之间共享数据
web worker 之间的协调变得更加简单和快速

# SharedArrayBuffer

> SharedArrayBuffer 顾名思义就是为线程间共享内存提供了一块内存缓冲区，你可以通过 postMessage 将线程 A 分配的 sab 发送给线程 B，然后两个线程就可以共同访问这块.

> 注意 sharedaraybuffer 在 2018 年 1 月 5 日被所有主流浏览器默认禁用，以响应 Spectre。Chrome 在 v67 平台上重新启用了它，在这些平台上，它的站点隔离功能可以防止幽灵式的漏洞。

> Spectre 漏洞是一个可以迫使用户操作系统上的其他程序访问其程序电脑存储器空间中任意位置的漏洞

```
const worker = new Worker('worker.js') //worker.js为另一个线程
var sab = new SharedArrayBuffer(1024)
worker.postMessage('sab')
```

> 在谷歌浏览器是不支持本地的 worker 的，解决办法是可以使用其他浏览器或者使用 http-server 本地启动一个服务

- SharedArrayBuffer 是不可以读写的要想对 SharedArrayBuffer 进行写入操作，要建立视图

```
//要想写入数据要建视图
const intArrBuffer = new Int32Array(sab)
for (let i = 0; i < intArrBuffer.length; i++) {
  intArrBuffer[i] = i
}
```

- worker.js 中对 intArrBuffer 进行修改操作，并传回主线程

```
----worker.js------
onmessage = function (e) {
  let arrBuffer = e.data
  arrBuffer[22] = 88
  postMessage(arrBuffer)
}

--- main.js----
worker.onmessage = function (e) {
  console.log('更改后的数据', intArrBuffer[22]) //直接拿值也是不可取的，如果有其他线程在操作该数据，会造成冲突
}
```

> 上面在 worker.js 中直接修改 arrBuffer 和在 main.js 中直接获取 intArrBuffer[22]是不可取的，如果有其他线程同时对 intArrBuffer[22]进行操作，就会造成冲突。这个时候就要用到 Atomics(原子)

# Atomics

> Atomics 对象提供了一组静态方法用来对 SharedArrayBuffer 对象进行原子操作,与一般的全局对象不同，Atomics 不是构造函数，因此不能使用 new 操作符调用，也不能将其当作函数直接调用。Atomics 的所有属性和方法都是静态的（与 Math 对象一样）。

**用 Atomics 对上面进行改造**

```
----worker.js------
onmessage = function (e) {
  let arrBuffer = e.data
  Atomics.store(arrBuffer,20,90)//通过原子进行修改。Atomics.store返回修改后的值 90
  Atomics.exchange(arrBuffer,20,100)//也是通过原子修改，返回替换的值 90
  postMessage(arrBuffer)
}

--- main.js----
worker.onmessage = function (e) {
  console.log('更改后的数据',  Atomics.load(intArrBuffer, 22)) //直接拿值也是不可取的，如果有其他线程在操作该数据，会造成冲突
}
```

**Atomics 的其他方法**

- Atomics.add()
  将指定位置上的数组元素与给定的值相加，并返回相加前该元素的值。

- Atomics.wait()检测数组中某个指定位置上的值是否仍然是给定值，是则保持挂起直到被唤醒或超时。

```
 //满足条件进入休眠状态，下面是arrBuffer[11]==11时进入休眠
  Atomics.wait(arrBuffer,11,11)//
```

- Atomics.wake()唤醒等待队列中正在数组指定位置的元素上等待的线程。返回值为成功唤醒的线程数量。

- Atomics.sub()
  将指定位置上的数组元素与给定的值相减，并返回相减前该元素的值

# 总结：
Atomics是保证多线程顺利进行的机制，假如当多线程操作同一数据时，会造成冲突。相当于两辆并行的车突然同一时间汇入一条线，难免会造成车祸。而Atomics能保证两辆并行的车在驶入同一条线时谁应该先执行，谁后执行。

# 参考

https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer
https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Atomics
