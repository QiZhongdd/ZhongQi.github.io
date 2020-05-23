---
layout: post
title: js原生实现-call、apply
subtitle: js原生实现-bind
date: 2020-05-17
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - js原生实现
---

#简述
在 js 中使用 call、apply 通常是为了改变函数的 this 指向，调用后函数会立即执行,call 和 apply 的区别在于 call 接受多个参数，apply 第二个参数接受的是一个数组。
**call、apply 的实现**

- 将函数作为传入向下文的属性
- 执行这个属性，得到结果。
- 删除这个属性。
- 返回结果

```

Function.prototype.call(context,...args){
  context.fn=this;
  let result=context.fn(...args);
  delete coontext.fn
  return result;
}


Function.prototype.apply(context,args){
  context.fn=this;
  let result=context.fn(...args);
  delete coontext.fn
  return result;
}

```
