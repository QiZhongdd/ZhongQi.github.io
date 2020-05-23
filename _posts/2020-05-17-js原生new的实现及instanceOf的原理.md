---
layout: post
title: js原生实现-new以及instanceof
subtitle: js原生实现-new以及instanceof
date: 2020-05-17
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - js原生实现
---

# new 的实现原理

- 新建一个空对象。
- 空对象的*proto*指向构造函数的 prototype.
- 传入相应的参数执行函数并改变构造函数的指向。
- 返回这个新对象

```
function new(Fn){
  var obj={};
  obj._proto_=Fn.prototype;
  let args=Array.prototype.slice.call(arguments,1);
  let result=Fn.apply(obj,args);
  return typeof obj==='object'?result:obj
}
```

# instanceof 的原理

instanceof 主要是判断一个构造函数的 prototype 属性所指向的对象是否存在另外一个要检测对象的原型链上

- 他的原理是判断 a 的原型链（**proto**）上是否有 B.prototype，若有返回 true

```
  function instanceof(L,R){
  var o=R.prototype;
  L=L._proto_;
  while(true){
  if(L=null)return false;
  if(L===o)return true;
  L=L._proto_;
  }
  }
```
