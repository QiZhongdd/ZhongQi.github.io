---
layout: post
title: Web Component
subtitle: Web Component
date: 2020-09-10
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - 编程基础
---

# 简介

Web Components它主要由Custom elements、Shadow Dom、HTML templates组成，他们可以一起创建并定制封装的元素，可以进行代码复用，不必担心代码冲突

**Custom elements**
一组js的Api，允许自定义custom elements及其行为，然后可以在界面中使用它,使用的时候界面会正常显示相对应的元素

```
class WordCount extends HTMLParagraphElement {
  constructor() {
    // 必须首先调用 super 方法
    super();

    // 元素的功能代码写在这里

    ...
  }
}

customElements.define('word-count', WordCount, { extends: 'p' });

```

这个元素叫做 word-count，它的类对象是 WordCount, 继承自 <p> 元素.

**Shadow DOM**
用于将封装的“影子”DOM树附加到元素（与主文档DOM分开呈现）并控制其关联的功能。通过这种方式，您可以保持元素的功能私有，不用担心该元素的功能和css样式影响到其他地方的样式和功能

```
<div id="container"></div>
<script>
  const container = document.getElementById("container");
  const shadow = container.attachShadow({ mode: "open" });//open外部可以获取到dom,close不行

  // 添加一个button
  const button = document.createElement("button");
  button.textContent = "hello";

  // 插入 shadow dom
  shadow.appendChild(button);
</script>

```

**Html Template**

HTML templates（HTML模板）： <template> 和 <slot> 不会显示在html界面上，他们的作用主要是当做模板供Custom element结构的基础被多次重用。
```
<template id="my-paragraph">
  <p>My paragraph</p>
</template>

let template = document.getElementById('my-paragraph');
let templateContent = template.content;
document.body.appendChild(templateContent);

```
# 结合使用

```
<html lang="en">
  <body>

    <template id="common-title">
      <h1><slot name="title"></slot></h1>
      <p>hello-world component</p>
    </template>

    <hello-world data-title="my-title">
      <span slot="title">自定义 title</span>
    </hello-world>

    <script>
      // 1、创建一个自定义标签
      // 2、创建 template
      // 3、shadow dom 封装、隔离组件
      class HelloWorld extends HTMLElement {
        constructor() {
          super();
          // 获取 template
          const template = document.getElementById("common-title");
          // shadow dom
          const shadow = this.attachShadow({ mode: "open" });
          shadow.appendChild(template.content);

          // 绑定事件
          this.addEventListener("click", () => {
            alert("click");
          });

          // 获取自定义属性
          const title = this.getAttribute("data-title");
          console.warn("title:", title);
          // 将自定义属性赋值
          this.childNodes[1].textContent = title;
        }
      }
      customElements.define("hello-world", HelloWorld);
    </script>
  </body>
</html>
```