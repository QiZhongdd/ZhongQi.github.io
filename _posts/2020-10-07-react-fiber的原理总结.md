---
layout: post
title: React-fiber的原理总结
subtitle: React-fiber的原理总结
date: 2020-08-24
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - react
---

# Fiber出现的背景

在recat16之前，react的底层使用了递归，递归不能被打断，如果是一个层级很深的组件，react渲染要花费几十毫秒或者几百毫秒的时间，这就会导致主线程一直被react的渲染所占用，当有用户交互的时候，就会造成页面卡顿或者假死的现象。

# Fiber算法的原理

Fiber架构用了分片的方式解决上面的问题，就是把一个任务分成很多小片，当分配给这个小片的时间用尽的时候，就检查有没有新的、优先级更高的任务，如果有就先执行新的任务，没有就继续做原来的任务。这种方式被称为异步渲染。

Fiber将组件更新分为两个时期：

**reconcillation(协调时期)**

在render之前的生命周期被称为reconcillation(协调时期)，是可以被打断的，每隔一段时间都会去判断有没有更重要的任务。react这个过程会在workingProgressTree上复用当前的fiber异步的构建新的fiber tree，标记出需要更新的节点，放入到队列中(updateQueue)。由于在这个阶段的任务是可以打断的，如果当前的组件只渲染到一半（willMount、willUpdate），react发现有更重要的任务，那么他会放弃执行了一半的任务，去执行更重要的任务，执行完更重要的任务后采用callback的形式回到原来的一半任务那里，重新执行该任务，所以react在阶段的生命周期可能被执行多次。所以在这一阶段得保证是纯函数，必须保证每次执行的任务结果都是一样的。协调阶段的声明周期

- constructor
- componentWillMount(废弃)
- componentWillReceiveProps（废弃）
- static getDeviceStateFromProps
- shouldComponentUpdate
- compoenetWillUpdate
- render



**commit提交阶段**

该阶段在render之后，是不能暂停的，一直到界面更新完成。该阶段主要是为了正确的处理副作用，所以必须保证只能执行一次，不能中断。commit阶段的生命周期：
- getSnatshotBeforeUpdate
- componentDidMount
- componentDidUpdate
- componentWillUnmount



# fiber是如何实现分片的

requestIdleCallback在主线程空闲的时候才会执行相关函数队列。react将优先级较低的任务放入requestIdleCallback队列中，如果主线程中一直有任务执行那么requestIdleCallback就一直不会执行。这个时候可以通过设置timerout强制执行。意思就是说如果超过了这个时间，那么就会立即执行当前的requestIdleCallback

>MDN解释：window.requestIdleCallback()方法将在浏览器的空闲时段内调用的函数排队。这使开发者能够在主事件循环上执行后台和低优先级工作，而不会影响延迟关键事件，如动画和输入响应。函数一般会按先进先调用的顺序执行，然而，如果回调函数指定了执行超时时间timeout，则有可能为了在超时前执行函数而打乱执行顺序。

# fiber的数据结构

fiber的本质是个链表，有child（指向子节点）、sibing(兄弟节点)、return(指向父节点)、stateNode(节点实例)，从而构建fiber tree

![Image text](/img/WechatIMG2118.png)

updateQueue（更新队列）是一个链表，有first属性和last属性，指向第一个和最后一个update对象，每一个fiber都有updateQueue指向其对应的更新队列。

每个fiber（当前的fiber称为current）都有alternate属性，开始时指向自己的clone体，updtae的变化会更新到alternate上，更新完毕，alternate代替current。


# fiber的本质

fiber实现了自己的调用栈，以链表的形式形成组件树，可以灵活的暂停、继续和丢弃先前的任务，实现这一方式利用的是requestIdleCallBack这API，在主线程空闲时间段计算。为了达到这一目的，就得利用调度器（Scheduler）来进行任务的分配。react的调度查看另一篇有关调度器的文章。

