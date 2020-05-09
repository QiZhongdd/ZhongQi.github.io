---
layout: post
title: polyfill跟shim的区别
subtitle: polyfill跟shim的区别
date: 2020-05-09
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - js
---

# shim

> 一个 shim 就是一个库，他将一个新的 api 引入到旧的环境中，只依靠旧的环境执行。

# polyfill

> 一个 polyfill 就是用在浏览器上 api 的 shim,我们通常检查是否存在这个 api，如果不存在就引入对应的 polyfill,然后旧的浏览器就可以使用这个 api 了。

**polyfill 跟 shim 的区别：polyfill 只能用在浏览器上，shim 不止可以用在浏览器上，还可以用在 node 环境或者其他环境**

> .es5-shim 是一个 shim(而不是 polyfill)的例子, 它在 ECMAScript 3 的引擎上实现了 ECMAScript 5 的新特性,而且在 Node.js 上和在浏览器上有完全相同的表现(译者注:因为它能在 Node.js 上使用,不光浏览器上,所以它不是 polyfill).
