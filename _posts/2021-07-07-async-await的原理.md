---
layout: post
title: async/await的原理
subtitle: async/await的原理
date: 2020-12-09
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - 浏览器
---

# 简介

async/await是生成器generator的语法糖，是generator配合promise以及执行器生成的。

# 生成器fooerator及协程

**fooerator**

生成器函数是一个带星号函数，而且是可以暂停执行和恢复执行的，执行机制如下。

- 在生成器函数遇到yield关键字，将返回yield后面的内容给外部，并暂停该函数的执行。
- 外部函数可以通过next方法恢复生成器函数的执行

```

function* fooDemo() {
    console.log("开始执行第一段")
    yield 'fooerator 2'

    console.log("开始执行第二段")
    yield 'fooerator 2'

    console.log("开始执行第三段")
    yield 'fooerator 2'

    console.log("执行结束")
    return 'fooerator 2'
}

console.log('main 0')
let foo = fooDemo()
console.log(foo.next().value)
console.log('main 1')
console.log(foo.next().value)
console.log('main 2')
console.log(foo.next().value)
console.log('main 3')
console.log(foo.next().value)
console.log('main 4')

//打印顺序如下
main 0
开始执行第一段

fooerator 2
开始执行第二段
main 1

fooerator 2
开始执行第三段
main 3

fooerator 4
开始执行第四段
main 4

```

**协程**

协程是比线程更轻量级的存在，可以把协程理解成跑在线程上的任务，一个线程上可以有多个协程，但同时只能跑一个协程。比如跑着A协程，但启动B协程，那么A携程会暂停执行。同时因为是A协程启动B携程，那么A是B的父携程，同时切换到B协程时，A协程的数据会被暂存下来，B是不可以改变的。

- 调用let foo = fooDemo()为携程A
- 执行foo.next()切换成携程B
- console.log(value)和main1为携程A
...以此循环切换

![Image text](/img/5ef98bd693bcd5645e83418b0856e437.webp)


**async/await运行解释**

async/await是generator的语法糖，所以它的运行机制跟fooerator类似。先看一到面试题。
```
let a = 0; 
let yideng = async () => { 
a = a + await 10; 
console.log(a) 
} 
yideng(); 
console.log(++a);

```
**上面的代码打印出1和10，为什么不是1，11呢？**
 - yideng是父协程，a=a+ 是子协程，调用yideng后，会保留yideng的调用栈信息。
 - 遇到await后相当于遇到fooerator的yield，会返回主协程,await返回的是一个promise，是个微任务，所以此时会先打印出++a,但是之前的引擎已经保留了主协程的调用栈信息，调用栈里面a的值不会发生变化，相当于把之前a的值锁住这里了，此时调用栈里面的值还是0。所以最后得到的还是10

# async/await的原理

简单的说async/await是fooerarto的语法糖可以看成是fooerator、promise、执行器co结合的生成的
```

function* foo() {
    let response1 = yield fetch('https://www.geekbang.org')
    console.log('response1')
    console.log(response1)
    let response2 = yield fetch('https://www.geekbang.org/test')
    console.log('response2')
    console.log(response2)
}
co(foo());

```
**async**

async是一个异步执行会返回一个promise的函数

**await**

- 当执行的时候会创建一个foo协程，在foo中执行1
- 遇到await的时候会创建一个promise,然后会将任务交给微任务队列，同时暂停foo携程的执行，然后将线程的控制权交给父协程，并且将promise对象返回给父携程
- 父协程要做的一件事是调用 promise_.then 来监控 promise 状态的改变。

![Image text](/img/8dcd8cfa77d43d1fb928d8b001229b94.webp)


```

async function foo() {
    console.log(1)
    let a = await 100
    console.log(a)
    console.log(2)
}
console.log(0)
foo()
console.log(3)

```



# 总结
 - foo 协程和父协程是在主线程上交互执行的，并不是并发执行的，它们之前的切换是通过 yield 和 foo.next 来配合完成的。
 - 当在 foo 协程中调用了 yield 方法时，JavaScript 引擎会保存 foo 协程当前的调用栈信息，并恢复父协程的调用栈信息。同样，当在父协程中执行 foo.next 时，JavaScript 引擎会保存父协程的调用栈信息，并恢复 foo 协程的调用栈信息。





