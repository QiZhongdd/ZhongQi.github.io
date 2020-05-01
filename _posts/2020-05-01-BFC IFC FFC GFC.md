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

# 2.IFC

> IFC(Inline Formatting Contexts)直译为"内联格式化上下文"，IFC 的 line
> box（线框）高度由其包含行内元素中最高的实际高度计算而来（不
> 受到竖直方向的 padding/margin 影响)

> CSS 内联盒子模型主要是用来渲染内容的，它决定了页面中的文本，图片等内联元素如何显示。

**内联盒子模型**
![](https://user-gold-cdn.xitu.io/2020/5/1/171cfc7a7dbf49d7?w=1438&h=562&f=png&s=298706)
CSS 中的内联盒子模型可以分为以下几个部分：

- 内容区域(content area):
  内容区域指一种围绕文字看不见的盒子，其大小仅受字符本身特性控制。我们可以把文本选中的背景色区域作为内容区域
- 内联盒子(inline box):内联盒子不会让内容成块显示，而是排成一行，该盒子又可以细分为内联盒子和匿名内联盒子两类:内联盒子，用 span、a 和 em 等标签包裹的盒子。匿名内联盒子，直接写的文字部分。匿名内联盒子，直接写的文字部分。

- 行框盒子(line box)行框盒子是由一个一个内联盒子组成的，每一行就是一个行框盒子。<p> 标签中的每一行就是一个行框盒子，每个行框盒子又是由一个一个内联盒子组成的。如果文字超长，会自动换行，新的一行，就会被创建成一个全新的行框盒子，每一行都是一个行框盒子。
- 包含盒子(containing box)。包含盒子是由一个一个行框盒子组成的，包裹着行框盒子。<p>标签就是一个包含盒子，此盒子由一行一行的行框盒子组成。
- 幽灵空白节点(strut)。幽灵空白节点指的是：在 HTML 文档声明中，内联元素的所有解析和渲染表现就如同每个行框盒子的前面有一个空白节点一样。

**IFC 内部元素排列规则**

我们先看一下行内元素的对齐线，也就是垂直方向上的对齐方式，可以通过 vertical-align 进行控制,默认是 vettical-align:baseline。
![](https://user-gold-cdn.xitu.io/2020/5/1/171cfea9f874b61e?w=1326&h=486&f=png&s=181186)

![](https://user-gold-cdn.xitu.io/2020/5/1/171cff1b7bb46223?w=1592&h=556&f=png&s=136794)

**普通内联元素导致的图片间隙问题**

第一个问题，也就是最常见的内联图片元素，导致的间隙问题，如图所示。
![](https://user-gold-cdn.xitu.io/2020/5/1/171d005d068c3164?w=816&h=482&f=png&s=489554)

```
<div style="background-color:#e5edff;">
  <img src="https://image.zhangxinxu.com/image/study/s/s256/mm1.jpg" />
</div>
```

案例中有一个 div 和一张图片，可以看到图片底部到 div 底部出现了明显的间隙，这是为什么呢？

我们先把图片后面增加一个文本节点，可以看到，其实是由于文本节点高度把这个 div 撑大了。。
![](https://user-gold-cdn.xitu.io/2020/5/1/171d00a5b884482f?w=708&h=514&f=png&s=487190)

```
<div style="background-color:#e5edff;">
  <img src="https://image.zhangxinxu.com/image/study/s/s256/mm1.jpg" />
  <span style="background-color: red;">x</span>
</div>
```

产生问题的原因:

- 普通内联元素(非 inline-block)的高度是由 line-height 决定的
- 默认的内联元素都是基限对齐，也就是 x 的下边沿。
- 图片是一个 inline-block 元素，它的基线是图片 margin 的下沿，也将是图片的下边沿
- 所以这里的图片就和 x 的下边缘对齐了。
- 文本节点也是有高度的，并根据高度会产生行距，即上下间隙，所以就撑大了 div。

解决方案

- 将 line-height 设成足够小，比如设成 O,这样就就不会将 div 扩大
- 将 img 设成块状元素
- 将 vertical-align 设成 bottom、top、middle
- 将 font-size 设成足够小，间接的计算出 line-height 设成 0

**inline-block 内联元素导致的对齐问题**

![](https://user-gold-cdn.xitu.io/2020/5/1/171d01e4fd38b597?w=878&h=514&f=png&s=31352)

```
//图中代码
<div style="background-color:#e5edff">
  <div
    style="display:inline-block;width: 100px;height: 100px;background-color: orange"
  >
    content
  </div>
  <div
    style="display:inline-block;width: 100px;height: 100px;background-color: red"
  ></div>
</div>
```

div 中包含 2 个 inline-block 的盒子，一个盒子中包含内容，另一个却没有包含，呈现出来的样子就是一种错位的样子。
![](https://user-gold-cdn.xitu.io/2020/5/1/171d0235a883d25b?w=826&h=462&f=png&s=29177)

我们使用同样的方式，在父级 div 后面增加一个文本节点，并加上背景图。

![](https://user-gold-cdn.xitu.io/2020/5/1/171d025600cac2ef?w=826&h=470&f=png&s=29289)

现在第一个盒子的 content 文本，第二个盒子的底部，以及 x 的下边缘都在一条直线上。

- 内联元素的排列方式，默认是按基线对齐。
- 没有内容的 inline-block 元素的基线是 margin box 的底部，也就是方块的底部。
- 有内容的 inline-block 元素的基线就是元素里面最后一行内联元素的基线。
- 所以这里的 content 就和第二个盒子的底部对齐了，div 就被撑大了。

解决方案

- 给第二个盒子加个;nbsp;
- 改变两个盒子的 vetical-align（middle、top、bottom），一定要同时改变。

# 3.GFC

> GFC(GridLayout Formatting Contexts)直译为"网格布局格式化上下文"，
> 当为一个元素设置 display 值为 grid 的时候，此元素将会获得一个独立
> 的渲染区域，我们可以通过在网格容器（grid container）上定义网格
> 定义行（grid definition rows）和网格定义列（grid definition columns）
> 属性各在网格项目（grid item）上定义网格行（grid row）和网格列
> （grid columns）为每一个网格项目（grid item）定义位置和空间。

# 4.FFC

> FFC(Flex Formatting Contexts)直译为"自适应格式化上下文"，display 值
> 为 flex 或者 inline-flex 的元素将会生成自适应容器（flex container），
