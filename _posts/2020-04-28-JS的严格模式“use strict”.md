---
layout: post
title: JS的严格模式“use strict”
subtitle: JS的严格模式“use strict”
date: 2020-04-28
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - JS
---

# 1.概述

> 除了正常运行模式，ECMAscript 5 添加了第二种运行模式："严格模式"（strict mode）。顾名思义，这种模式使得 Javascript 在更严格的条件下运行。支持严格模式的浏览器:
> Internet Explorer 10 +、 Firefox 4+ Chrome 13+、 Safari 5.1+、 Opera 12+。

**严格模式的目的**

- 消除 Javascript 语法的一些不合理、不严谨之处，减少一些怪异行为;
- 消除代码运行的一些不安全之处，保证代码运行的安全；
- 提高编译器效率，增加运行速度；
- 为未来新版本的 Javascript 做好铺垫。

# 2.严格模式的声明

- 针对整个 js 脚本文件，在脚本文件的开头使用"use strict",代表整个脚本文件都将使用严格模式

```
<script>
  "use strict";
  console.log("这是严格模式。");
</script>
```

- 在函数中使用严格模式，代表着只在该函数中使用严格模式

```
function strict(){
  "use strict";
  return "这是严格模式。";
}
```

- 脚本文件的变通写法,因为第一种调用方法不利于文件合并，所以更好的做法是，借用第二种方法，将整个脚本文件放在一个立即执行的匿名函数之中。

```
(function (){
   "use strict";
})();
```

# 3.语法和行为改变

**全局变量显式声明**

> 在正常模式中，如果一个变量没有声明就赋值，默认是全局变量。严格模式禁止这种用法，严格模式下变量都必须先用 var 命令声明，否则报错

```
"use strict";
v = 1; // 报错，v未声明
for(i = 0; i < 2; i++) { // 报错，i未声明
}
```

**静态绑定**

> javascript 允许"动态绑定"，即某些属性和方法到底属于哪一个对象，不是在编译时确定的，而是在运行时（runtime）确定的。严格模式对动态绑定做了一些限制。某些情况下，只允许静态绑定。也就是说，属性和方法到底归属哪个对象，在编译阶段就确定。这样做有利于编译效率的提高，也使得代码更容易阅读，更少出现意外。

- 禁止使用 with 语句,在使用 with 时，无法决定变量的归属

```
"use strict";
    var v = 1;
    with (o){ // 语法错误
     v = 2;
}
```

- 严格模式下使用 evel，evel 中的变量只属于 evel 而不是全局。而在正常模式下，evel 中的作用域取决于 evel，如果 evel 在全局，那么就是全局作用域，如果时在函数中，那就属于函数作用域。

```
"use strict";
 var x = 2;
 console.info(eval("var x = 5; x")); // 5
 console.info(x); // 2,在非严格模式下为5
```

**this 的指向**

> 在非严格模式下，在全局作用域中 this 是指向 window 的，而在严格模式下，this 是指向 undefined;

```
  function f() {
    return !this;　　// 返回false，因为"this"指向全局对象，"!this"就是false
  }


  function f() {
    "use strict";
    return !this;// 返回true，因为严格模式下，this的值为undefined，所以"!this"为true
  }

```

**禁止用 delete 删除变量和不可删除的属性**

- 严格模式下无法删除变量。只有 configurable 设置为 true 的对象属性，才能被删除。

```
<script type="text/javascript">
  "use strict";
  var x;
  delete x; // 语法错误

  var o = Object.create(null, {
    'x': {
      value: 1,
      configurable: true
    }
  });
  delete o.x; // 删除成功
</script>
```

- 禁止删除不可删除的属性

```
"use strict";
delete Object.prototype; // 报错
```

**显式报错**

- 正常模式下，对一个对象的只读属性进行赋值，不会报错，只会默默地失败。严格模式下，将报错。

```
<script type="text/javascript">
  "use strict";
  var o = {};
  Object.defineProperty(o, "v", { value: 1, writable: false });
  o.v = 2; // 报错
</script>
```

- 严格模式下，对一个使用 getter 方法读取的属性进行赋值，会报错。

```
<script type="text/javascript">
  "use strict";

  var o = {

    get v() { return 1; }

  };

  o.v = 2; // 报错
</script>
```

- 严格模式下，对禁止扩展的对象添加新属性，会报错。

```
<script type="text/javascript">
  "use strict";
  var o = {};
  Object.preventExtensions(o);
  o.v = 1; // 报错
</script>
```

** 禁止在函数内部遍历调用栈**

```
  function f1() {

    "use strict";

    f1.caller; // 报错

    f1.arguments; // 报错

  }
  f1();
```

**重名错误**

- 对象不能有重名的属性
  > 正常模式下，如果对象有多个重名属性，最后赋值的那个属性会覆盖前面的值。严格模式下，这属于语法错误,但在有些浏览器中是不报错的，比如 chrome。

```
<script type="text/javascript">
  "use strict";
  var o = {
    p: 1,
    p: 2
  }; // 语法错误
</script>
```

- 函数不能有重名的参数
  > 正常模式下，如果函数有多个重名的参数，可以用 arguments[i]读取。严格模式下，这属于语法错误。

```
<script type="text/javascript">
  "use strict";

  function f(a, a, b) { // 语法错误
    return;
  }
</script>
```

** 禁止八进制表示法**

> 正常模式下，整数的第一位如果是 0，表示这是八进制数，比如 0100 等于十进制的 64。严格模式禁止这种表示法，整数第一位为 0，将报错。

```
"use strict";
var n = 0100; // 语法错误
```

**arguments 对象的限制**

- 不允许对 arguments 赋值

```
  "use strict";
  arguments++; // 语法错误
  var obj = { set p(arguments) { } }; // 语法错误
  try { } catch (arguments) { } // 语法错误
  function arguments() { } // 语法错误
  var f = new Function("arguments", "'use strict'; return 17;"); // 语法错误
```

- arguments 不再追踪参数的变化

```
<script type="text/javascript">
  function f(a) {
    a = 2;
    return [a, arguments[0]];
  }

  f(1); // 正常模式为[2,2]
  function f(a) {
    "use strict";
    a = 2;
    return [a, arguments[0]];
  }
  f(1); // 严格模式为[2,1]
</script>
```

- 禁止使用 arguments.callee,意味着匿名函数无法调用自身

```
 "use strict";

  var f = function () { return arguments.callee; };

  f(); // 报错
```

**函数必须声明在顶层**

> 严格模式只允许在全局作用域或函数作用域的顶层声明函数。也就是说，不允许在非函数的代码块内声明函数。

```
<script type="text/javascript">
  "use strict";

  if (true) {

    function f() { } // 语法错误

  }

  for (var i = 0; i < 5; i++) {

    function f2() { } // 语法错误

  }
</script>
```

**保留关键字**

> 为了向将来 Javascript 的新版本过渡，严格模式新增了一些保留字：implements, interface, let, package, private, protected, public, static, yield、class, enum, export, extends, import, super、const 使用这些词作为变量名将会报错

# 参考文档

https://ruanyifeng.com/blog/2013/01/javascript_strict_mode.html
