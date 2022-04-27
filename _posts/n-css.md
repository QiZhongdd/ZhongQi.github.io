**bem**

BEM 是一種 CSS class 命名的設計模式，將介面切割成許多獨立的區塊，以區塊（Block）、元素（Element）和修飾子（Modifier）來命名，優點是以元件觀念進行開發，具有重用性。

menu 是區塊，menu__item 是 menu 的元素，而 menu__item--active 是 menu__item 的其中一種狀態

```
ul class="menu">
  <li class="menu__item">首頁</li>
  <li class="menu__item menu__item--active">關於我</li>
  <li class="menu__item">分類</li>
</ul>

```

**BFC: Block Formatting Context 简称 块级格式化上下文**
BFC的特点: BFC是一个绝对的独立空间，它的内部元素是不会影响到外部元素的!!!
BFC布局规则:
内部的Box会在垂直方向，按照从上到下的方式逐个排列。
Box垂直方向的距离由margin决定。属于同一个BFC的两个相邻Box的margin会发生重叠
每个元素的margin box的左边，与包含块border box的左边相接触(对于从左往右的格式化，否则相反)。即使存在浮动也是如此
BFC的区域不会与float box重叠
BFC就是页面上的一个隔离的独立容器，容器里面的子元素不会影响到外面的元素。反之也如此
计算BFC的高度时，浮动元素的高度也参与计算
元素首先需要是一个block元素，才能变成BFC；
触发BFC的条件:
根元素，body
float的值不为none
overflow不为visible；可以是hidden或auto或scroll
display的值设置为inline-block，flex或者inline-flex,table-cell,table-caption或者inline-table
position的值设置为absolute、fixed
因此通过将其中一个元素display属性设置为inline-block，width设置为100%是比较好的解决方式；既解决了margin穿透问题，又达到与display为block一样的效果。


**atomcss**

atomcss 遵循所有 CSS 类都有一个唯一的 CSS 规则,可以把结构层和表示层结合起来:比如当我们需要改变按钮颜色时，我们直接修改 HTML，而不是 CSS，这种紧密耦合在现代 CSS-in-JS 的 React 中也得到了承认，原子 CSS 的限制，通常手工编写原子 CSS，精心制定命名约定。但是很难保证这个约定易于使用、保持一致性，而且不会随着时间的推移而变得臃肿，同时也可能造成html变得更加庞大。
和 CSS-in-JS 比较
CSS-in-JS 和实用工具/原子 CSS  有密切关系。这两种方法都提倡使用标签进行样式化。以某种方式试图模仿内联样式，


**css优先级**

0000	!important
1000	内联样式 style="..."
100	id 选择器 #app
10	类、伪类、属性选择器
1	标签、伪元素选择器 span :after
0	通用选择器(*)、子选择器(>)、兄弟选择器(+


超越important

解析成200px;
```
width: 100px !important;
min-width: 200px;

```

**em和rem**

em是相对于父元素的单位，加入父元素的font-szie为16px,那么1em就为16px.
rem是相对于根节点html的单位，如果跟节点的font-szie为16px,那吗1rem就为16px.

**移动端为什么要使用rem**
移动端的设备宽度是不定的，如果我们使用固定的大小，那么在不同大小的设备上就会出现布局错乱、留白、残缺等现象的出现。加入设计稿刚好是750px，那么每个元素的大小开发按照设计稿的开发就可以了，如果实际的屏幕的宽度不为750px，那么就会造成错乱。这个时候就需要用到rem，如果1rem的宽度为100px。如果设计稿里有某个元素刚好为100px,那么写成1rem就行。但因为每个屏幕的大小都不一致，那么rem的大小需要动态的配置，rem的大小通常为屏幕的宽度/设计稿的宽度*100,选取100px为1r
m主要是为了方便计算

```
!(function(doc, win) {
    var docEle = doc.documentElement, //获取html元素
      event = "onorientationchange" in window ? "orientationchange" : "resize", //判断是屏幕旋转还是resize;
      fn = function() {
        var width = docEle.clientWidth;
        width && (docEle.style.fontSize = 100 * (width / 750) + "px"); //设置html的fontSize，随着event的改变而改变。
      };

    win.addEventListener(event, fn, false);
    doc.addEventListener("DOMContentLoaded", fn, false);

  }(document, window));

```

**1px如何解决**
- 使用0.5px，有兼容性的问题
- 使用border-image，没有兼容性的问题，改颜色不方便
- 通过viewport+rem实现，一套代码解决所有的问题，但也有兼容性的问题
- 伪元素加transform实现，	不支持圆角
- box-shadow模拟边框实现，兼容所有机型，但box-shadow不在盒模型中，需要预留位置

**display: none与visibility: hidden的区别**

display: none的元素不占据任何空间，visibility: hidden的元素空间保留；

display: none会影响CSS3的transition过渡效果，visibility: hidden不会；

display: none隐藏产生重绘 ( repaint ) 和回流 ( relfow )，visibility: hidden只会触发重绘；

株连性：display: none的节点和子孙节点元素全都不可见，visibility: hidden的节点的子孙节点元素可以设置 visibility: visible显示。(visibility: hidden属性值具有继承性，所以子孙元素默认继承了hidden而隐藏，但是当子孙元素重置为visibility: visible就不会被隐藏。)不管是visibility还是display:none都会保存在文档元素中，如果图片的话回发送请求。


**::before 和 ::after 中双冒号和单冒号**
单冒号（:）用于CSS3伪类，双冒号（::）用于CSS3伪元素。（伪元素由双冒号和伪元素名称组成）

双冒号是在当前规范中引入的，用于区分伪类和伪元素。不过浏览器需要同时支持旧的已经存在的伪元素写法， 比如:first-line、:first-letter、:before、:after等，而在 CSS3 中引入的伪元素则不允许再支持旧的单冒号的写法。

TIP

想让插入的内容出现在其它内容前，使用::before，否者，使用::after；

在代码顺序上，::after生成的内容也比::before生成的内容靠后。

如果按堆栈视角，::after生成的内容会在::before生成的内容之上。

伪类一般匹配的是元素的一些特殊状态，如hover、disabled等，而伪元素一般匹配的特殊的位置，比如after、before等。


**block，inline和inline-block概念和区别**

- display:block
block元素会独占一行，多个block元素会各自新起一行。默认情况下，block元素宽度自动填满其父元素宽度。
block元素可以设置width,height属性。块级元素即使设置了宽度,仍然是独占一行。
block元素可以设置margin和padding属性。
- display:inline
inline元素不会独占一行，多个相邻的行内元素会排列在同一行里，直到一行排列不下，才会新换一行，其宽度随元素的内容而变化，。
inline元素设置width,height属性无效。
inline元素的margin和padding属性，水平方向的padding-left, padding-right, margin-left, margin-right都产生边距效果；但竖直方向的padding-top, padding-bottom, margin-top, margin-bottom不会产生边距效果。
- display:inline-block
简单来说就是将对象呈现为inline对象，但是对象的内容作为block对象呈现。之后的内联对象会被排列在同一行内。每个行框盒子都会产生一个"幽灵空白节点,即一个宽度为 0 看不见的节点。解决方式img设置display为block；父容器（如示例中的div）font-size设置为0；


**设备像素、css 像素、设备独立像素、dpr、ppi 之间的区别**

设备像素一般就是手机的物理像素，设备独立像素与css的像素是等价的，设备像素与设备独立像素的比值称为dpr，在pc端dpr的比值为1比1.自从苹果四出来的retina屏幕dpr为2。而1px问题就是因为dpr不为1造成的。ppi指的是每英寸的物理像素的密度，ppi越大，屏幕的分辨率越大。


**layoutviewport、visualviewport 和 idealviewport 的区别**

如果把移动端的可视区域看作viewport的话那么某些网站就会因为屏幕过窄导致错乱。所以浏览器默认情况下把viewport设置成了一个较大的值比如980px，这样即使某些网站设计成pc端也能在移动端正常显示。ppk把这个浏览器的默认的viewport成为layoutviewport。layoutviewport的宽度是大于可试区域的，可视区域的宽度称为visualviewport。idealviewport是最适合移动端的viewport。idealviewport的宽度等于屏幕的宽度。只要把css中的某一元素的宽度设置成idealviewport，那这个元素的宽度就是设备的宽度。dealviewport的意义在于，无论在何种分辨率的屏幕下，那些针对idealviewport而设计的网站，不需要用户手动缩放，也不需要出现横向滚动条，都可以完美的呈现给用户。

设置idealviewport
```
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-sca
le=1.0,user-scalable=no"/>
 
```


**浏览器如何判断是否支持 webp 格式图片？**

宽高判断法。通过创建image对象，将其src属性设置为webp格式的图片，然后在onload事件中获取图片的宽高，如 果能够获取，则说明浏览器支持webp格式图片。如果不能获取或者触发了onerror函数，那么就说明浏览器不支持webp格 式的图片。


**什么是幽灵空白节点？**

幽灵空白节点是内联盒模型中非常重要的一个概念，具体指的是：在HTML5文档声明中，内联元素的所有解析和渲染表现就如同每个行框盒子的前面有一个空白节点一样。这个空白节点永远透明，不占据任何宽度，看不见也无法通过脚本获取，就好像幽灵一样，但又确确实实地存在，表现如同文本节点一样，因此，我们称之为幽灵空白节点


**transition 和 animation 的区别?**

transition关注的是CSSproperty的变化，property值和时间的关系是一个三次贝塞尔曲线。

animation作用于元素本身而不是样式属性，可以使用关键帧的概念，应该说可以实现更自由的动画效果。



**position**

- static: 让元素使用正常的布局行为，left、top、right、bottom和z-index都是无效的
- relative：相对定位，元素放置在未添加定位的位置，在不改变页面布局的情况下进行跳转。调整后会在原来的位置留白
- absolute：元素会被移出正常文档流，通过指定元素相对于最近的非 static 定位祖先元素的偏移，来确定元素位置。绝对定位的元素可以设置外边距（margins），且不会与其他边距合并。
- fix:元素会被移出正常文档流,而是通过指定元素相对于屏幕视口（viewport）的位置来指定元素位置。元素的位置在屏幕滚动时不会改变。fixed 属性会创建新的层叠上下文。当元素祖先的 transform, perspective 或 filter 属性非 none 时，容器由视口改为该祖先。
- sticky元素根据正常文档流进行定位，然后相对它的最近滚动祖先元素进行偏移，偏移值不会影响任何其他元素的位置。该值总是创建一个新的层叠上下文。当该祖先的overflow 是 hidden, scroll, auto, 或 overlay时），即便这个祖先不是最近的真实可滚动祖先。这有效地抑制了任何“sticky”行为

```
/*1.第一种方式是利用vw来实现*/
.square {
  width: 10%;
  height: 10vw;
  background: tomato;
}

/*2.第二种方式是利用元素的margin/padding百分比是相对父元素width的性质来实现*/

.square {
  width: 20%;
  height: 0;
  padding-top: 20%;
  background: orange;
}

/*3.第三种方式是利用子元素的margin-top的值来实现的*/
.square {
  width: 30%;
  overflow: hidden;
  background: yellow;
}

.square::after {
  content: "";
  display: block;
  margin-top: 100%;
}

```



移动端1px的问题
在写移动端时，需要在meta中设置init-scale以及max-scale为1，主要是为了保证移动端的viewport的宽度为设备的宽度。引起1px border变粗的原因是dpr（物理像素与独立像素的比值）不为1。解决的方式主要有以下几种。
- 根据设备像素比设置媒体查询，比如dpr为2的时候，将border设置为0.5。但ios8以下是不允许设置0.几px的
- 第二是根据viewport动态设置meta的init-scale以及max-scale。，如果dpr是2的话，那么scale为0.5；
- 使用border-images
- 第四种是使用transform以及伪元素befor或者after,再根据媒体查询以及dpr进行缩放。
