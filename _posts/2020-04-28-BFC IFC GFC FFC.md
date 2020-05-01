---
layout: post
title: 跨域相关的总结
subtitle: 跨域相关的总结
date: 2020-04-28
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - CSS
---

# 1.BFC

**什么是 BFC**

> BFC 简称‘块格式化上下文’。它是一个独立的渲染区域，只有 Block-level-box 参与，它规定了 Block-level-box 如何布局，并且与这个区域外的毫不相干。

**Box css 的基本单位**

> Box 是 css 布局的基本单位，就是一个界面有很多 box 组成，元素的类型和 display 决定了 box 的类型，不同类型的 box 会参与不同的 Formatting Context(一个决定如何渲染的容器)。因此 box 内会有不同的渲染方式，主要有以下两种 box。

- Block-level-box:display 属性为 block, list-item, table 的元素，会生成 block-level box。并且参与 block fomatting context；
- Inline-level-box:display 属性为 inline, inline-block, inline-table 的元素，会生成
  inline-level box。并且参与 inline formatting context；
  **Formatting context**
  > Formatting context 是 W3C CSS2.1 规范中的一个概念。它是页面中的一块渲
  > 染区域，并且有一套渲染规则，它决定了其子元素将如何定位，以及和其他
  > 元素的关系和相互作用。最常见的 Formatting context 有 Block fomatting
  > context (简称 BFC)和 Inline formatting context (简称 IFC) 。

**生成 BFC 的元素**

- 根元素
- float 属性不为 none
- position 为 absolute 或 fixed
- display 为 inline-block, table-cell, table-caption, flex, inline-flex
- overflow 不为 visible

** BFC 的规则及运用 **

- 每个元素的 margin box 与包含快的左边的 boder 相抵触，即使存在浮动也是如此

```
<style>
 body {
 width: 300px;
 position: relative;
 }
 .aside {
 width: 100px;
 height: 150px;
 float: left;
 background: #f66;
 }
 .main {
 height: 200px;
 background: #fcc;
 }
</style>
<body>
 <div class="aside"></div>
 <div class="main"></div>
</body>
```

![](https://user-gold-cdn.xitu.io/2020/5/1/171cec3c1b5cb14a?w=326&h=208&f=png&s=29757)

- BFC 的区域不会与浮动元素重叠。相关的运用就是‘自适应两栏布局’

```
<style>
 body {
 width: 300px;
 position: relative;
 }
 .aside {
 width: 100px;
 height: 150px;
 float: left;
 background: #f66;
 }
 .main {
 height: 200px;
 background: #fcc;
 overflow:hidden;//通过触发BFC
 }
</style>
<body>
 <div class="aside"></div>
 <div class="main"></div>
</body>
```

![](https://user-gold-cdn.xitu.io/2020/5/1/171cec77b21a02b9?w=360&h=226&f=png&s=33022)

- 计算 BFC 的高度时，浮动元素也参与计算。相关的运用‘清楚内部浮动’

```
<style>
 .par {
 border: 5px solid #fcc;
 width: 300px;
 overflow:hiddem;
 }
 .child {
 border: 5px solid #f66;
 width:100px;
 height: 100px;
 float: left;
 }
</style>
<body>
 <div class="par">
 <div class="child"></div>
 <div class="child"></div>
 </div>
</body>
```

![](https://user-gold-cdn.xitu.io/2020/5/1/171ceca7aa0e1442?w=302&h=206&f=png&s=5040)

- Box 垂直方向的距离由 margin 决定。属于同一个 BFC 的两个相
  邻 Box 的 margin 会发生重叠.为了避免重叠，可以生成两个 BFC 区域

```
p {
 color: #f55;
 background: #fcc;
 width: 200px;
 line-height: 100px;
 text-align:center;
 margin: 100px;
 }
</style>
<body>
 <p>Haha</p>
 <p>Hehe</p>
</body>
```

![](https://user-gold-cdn.xitu.io/2020/5/1/171cecfac1150c8d?w=300&h=382&f=png&s=77455)

> 为了防止 margin 重叠，可以在 p 标签中在包裹一个 div，然后在生成一块 BFC 区域

```
<style>
  p {
   color: #f55;
   background: #fcc;
   width: 200px;
   line-height: 100px;
   text-align:center;
   margin: 100px;

   }
   .wrper{
    overflow: hidden;
   }
  </style>
  <body>
   <p>Haha</p>
   <div class="wraper">
   <p>He</p>
  </div>
</html>
```

![](https://user-gold-cdn.xitu.io/2020/5/1/171ced13edc4c365?w=324&h=434&f=png&s=84583)

#2.IFC

> IFC(Inline Formatting Contexts)直译为"内联格式化上下文"，IFC 的 line
> box（线框）高度由其包含行内元素中最高的实际高度计算而来（不
> 受到竖直方向的 padding/margin 影响)

#3.GFC

> GFC(GridLayout Formatting Contexts)直译为"网格布局格式化上下文"，
> 当为一个元素设置 display 值为 grid 的时候，此元素将会获得一个独立
> 的渲染区域，我们可以通过在网格容器（grid container）上定义网格
> 定义行（grid definition rows）和网格定义列（grid definition columns）
> 属性各在网格项目（grid item）上定义网格行（grid row）和网格列
> （grid columns）为每一个网格项目（grid item）定义位置和空间。

#4.FFC

> FFC(Flex Formatting Contexts)直译为"自适应格式化上下文"，display 值
> 为 flex 或者 inline-flex 的元素将会生成自适应容器（flex container）
