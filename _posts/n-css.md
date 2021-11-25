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

**atomcss**

atomcss 遵循所有 CSS 类都有一个唯一的 CSS 规则,可以把结构层和表示层结合起来:比如当我们需要改变按钮颜色时，我们直接修改 HTML，而不是 CSS，这种紧密耦合在现代 CSS-in-JS 的 React 中也得到了承认，原子 CSS 的限制，通常手工编写原子 CSS，精心制定命名约定。但是很难保证这个约定易于使用、保持一致性，而且不会随着时间的推移而变得臃肿，同时也可能造成html变得更加庞大。
和 CSS-in-JS 比较
CSS-in-JS 和实用工具/原子 CSS  有密切关系。这两种方法都提倡使用标签进行样式化。以某种方式试图模仿内联样式，