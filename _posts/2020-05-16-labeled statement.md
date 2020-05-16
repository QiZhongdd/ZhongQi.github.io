---
layout: post
title: Labeled Statement
subtitle: Labeled Statement
date: 2020-05-16
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - js
---

# 简述

Javascript 中标签(label)是一个标识符。标签可以与变量重名，它是一个独立的语法元素（既不是变量，也不是类型），其作用是标识”标签化语句（labeled statement)”。标签可以声明在语句或者语句块之前，从而使这个语句或者语句块“标签化”。

**声明方式：**

```
label2:{
   var i = 1, j = 2;
   var k = i + j;
}
```

# 用法

首先明确一个原则，在 JavaScript 中，**语句优先**。

```
{
 a:1
}
```

在上面的 js 代码中执行会得到“1”，这是因为如果一段代码既能够以语句的方式解析（相当于一个执行语句），也能用语法的方式解析，在 JS 中，**会优先按语句来解析**。"{}"既可以看成代码块，也可以看成对象，按照上面的写法它会优先按语句解析，所以会得到"1"。

如果在浏览器控制台输入{a:1}会得到"{a:1}",**这是错误的，console 是经过处理的**。如果想得到正确的结果可以去 watch 中查看。

![Image text](https://user-gold-cdn.xitu.io/2020/5/16/1721e00c8f6bf0cf?w=834&h=448&f=png&s=109937)

**js 中有另外三个字改变执行流程，分别是 continue、break、return**，其中 break 和 continue 可以和标签(label)一起使用

```
aa : {
    for (var i = 0; i < 10; i++) {
        console.log(i);
        for (var j = 0; j < 5; j++) {
            console.log(j);
            if (j === 2) break aa;
        }
    }
}

console.log('done');
```

按上面的例子，正常情况下，break 的作用只是跳出里面的 for 循环，外层循环不会跳出，但是**由于在开始时用了声明式标签"aa:",所以会跳出整个循环，相当于回到 aa:,然后执行下面的 console.log('done'),当然，这种写法是完全不提倡的，这里只是用来说明 JS 中的 Label Statement 这个特性，千万不要这样写代码**

# "()"的作用

**在中如果使用了"()"，会将里面的语句按表达式解析**（相当于定义变量），例如在 eval 中在（）与不（）会得到不同的结果

```
var str = '{"name": "liu", "age": 20}';
var obj = eval('(' + str + ')');

console.log(obj);
```

我们知道，eval(str)会把接收到的字符串在当前上下文中执行，所以上面的句子是会打印出 obj 的，如果不加括号：

```
eval('{"name": "liu", "age": 20}')
```

这里的执行语句相当于

```
'{"name": "liu", "age": 20}'
```

上面的结果会报错，是因为",”表达式要求每一项都必须是表达式，这里不满足要求。所以会报错。

![Image text](https://user-gold-cdn.xitu.io/2020/5/16/1721e1299bc00e7e?w=1034&h=370&f=png&s=142019)

**这也是立即执行函数的原理**：小括号把函数声明变成了函数表达式，后面再跟一个小括号表示调用。

```
(function () {
    console.log('IIFE');
})()
```

# 总结：

- 在 js 中使用 labeled statement 主要是进行语句标签化。
- 如果一段代码既能以语句解析，也能按语法解析，会优先按照语句解析。
- "（）"会将里面的语句进行表达式化
- ","逗号表达式必须满足所有语句都是表达式，或者会报错

# 参考

https://segmentfault.com/a/1190000014127816
