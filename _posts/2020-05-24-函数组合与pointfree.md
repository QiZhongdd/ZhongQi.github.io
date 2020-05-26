---
layout: post
title: 函数组合
subtitle: 函数组合
date: 2020-05-20
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - 函数式编程
  - js原生实现
---

# 函数组合 Compose

所谓的函数组合就是将多个个函数组合在一起。一个函数的执行结果传给另一个函数执行。这些函数都是**一元函数**，下面是 compose 的最常见的例子。

```
function a(x){
  return x*2
}
function g(x){
  return x+1;
}
var compose=function(f,g){
  return function(x){
    f(g(x))
  }
}
compose(a,g);
```

上面的代码有个缺点就是一次只能传入两个函数，不能传入多个函数。
**compose 函数的特点是从右到左执行，而不是从外到右执行，这样提高了代码的可读性，同时需要 compose 处理的函数只能接受一个参数（除了第一个执行的函数），当有多个参数的函数时，这时就需要借用柯里化先对函数处理**

# compose 的实现

```
function compose(){
   var args = arguments;
   var start = args.length - 1;
  return function(){
    let i=start;
     let result=args[start].apply(this,arguments)
    while(i--){
      result=args[i].call(this,result);
    }
    return result;
  }
}
```

# pointfree

所谓的 pointfree 就是无需提及将要操作的参数时什么样的，通过一系列的组合运算得到自己想要的数据

```
// 需求：输入 'kevin daisy kelly'，返回 'K.D.K'

// 非 pointfree，因为提到了数据：name
var initials = function (name) {
    return name.split(' ').map(compose(toUpperCase, head)).join('. ');
};
// pointfree
// 先定义基本运算
var split = curry(function(separator, str) { return str.split(separator) })
var head = function(str) { return str.slice(0, 1) }
var toUpperCase = function(str) { return str.toUpperCase() }
var join = curry(function(separator, arr) { return arr.join(separator) })
var map = curry(function(fn, arr) { return arr.map(fn) })

var initials = compose(join('.'), map(compose(toUpperCase, head)), split(' '));

initials("kevin daisy kelly");
```

从上面的例子可以得出函数的组成 compose 和柯里化 curry 非常有助于实现 pointfree，**合成函数时，如果基本函数的参数有多个，需要用柯里化转换**。如果我们想自己不手写基础函数，那么我们可以使用 ramda.js 这个库

**ponitfree 的本质**
pointfree 就是将基础的函数组合成复杂点的函数，基本不用管传入的数据是什么样，只是组合运算

pointfree 能让我们的代码更简洁，减少命名，提高代码复用。
