---
layout: post
title:  编写webpack插件和loader
subtitle: 编写webpack插件loader
date: 2020-09-25
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - webpack
---

# 插件

插件是webpack运行到某个时间点需要执行的函数或者对象，webpack插件实现机制如下
- 创建:webpack在自己内部定义了各种hook，这些hook是基于tapable实现的，tapable是类似于eventEmitter的库
- 注册:插件将自己的方法注册到对应的hook上，交给webpack
- 触发: webpack运行到某个节点的时候会触发相关的一系列hook，从而执行插件

如下一个简单例子

```
const pluginName = 'ConsoleLogOnBuildWebpackPlugin';

class ConsoleLogOnBuildWebpackPlugin {
    apply(compiler) {
        //将插件在compiler中的hook触发,compilation是new Synhook传过来compilation对象
        compiler.hooks.run.tap(pluginName, (compilation) => {
            console.log(' 🔥🔥🔥 webpack 构建过程开始！');
        });
    }
}
module.exports = ConsoleLogOnBuildWebpackPlugin;

```
- 事件钩子会有不同的类型 SyncBailHook,AsyncSeriesHook,SyncHook 等,是基于tapable。
- 如果是异步事件钩子,那么就使用tapPromise和tapAsync，tapPrimise要求返回一个promise，以便能处理异步，而 tapAsync 则需要用 callback 来返回结果
- 除了同步和异步的,名称带有 parallel 的,注册的事件函数会并行调用,名称带有 bail 的,注册的事件函数会被顺序调用,直至一个处理方法有返回值名称带有 waterfall的,每个注册的事件函数,会将上一个方法的返回结果作为输入参数。
![Image text](/img/WechatIMG389.png)

**异步事件**

- tapPromise

```
const pluginName = 'ConsoleLogOnBuildWebpackPlugin';

class ConsoleLogOnBuildWebpackPlugin {
    apply(compiler) {
        //将插件在compiler中的hook触发,compilation是new Synhook传过来compilation对象
        compiler.hooks.done.tapPromise(pluginName, (stats) => {
            return new Promise((resolve,reject)=>{
                console.log(' 🔥🔥🔥 webpack 构建过程开始！');
            })
            
        });
    }
}
module.exports = ConsoleLogOnBuildWebpackPlugin;

```

- tapAsync


```
const pluginName = 'ConsoleLogOnBuildWebpackPlugin';

class ConsoleLogOnBuildWebpackPlugin {
    apply(compiler) {
        //将插件在compiler中的hook触发,compilation是new Synhook传过来compilation对象
        compiler.hooks.done.tapAsync(pluginName, (stats,callback) => {
                console.log(' 🔥🔥🔥 webpack 构建过程开始！');
                callback()
        });
    }
}
module.exports = ConsoleLogOnBuildWebpackPlugin;

```

**实现htmlAfterPlugin**

改插件基于html-webpack-plugin插件，html-webpack-plugin在想html文件中是无法改变相关css和js的插入位置的，
所以htmlAfterPlugin是为了解决该问题而实现的。主要适用于平时使用swig等模板语言进行多界面的开发。实现思路如下
- 创建基于compiler.hooks.compilation的插件
- 然后在html-webpack-plugin的beforeAssetTagGeneration钩子获取到相关需要注入的资源
- 获取html-webpack-plugin的beforeEmit钩子，该钩子是处于注入到html前，能够获取到html内容，对相关html内容进行替换


```
const HtmlWebpackPlugin = require('html-webpack-plugin');
const pluginName = 'HtmlAfterPlugin';

const assetsHelp = (data) => {
  const js = [];
  const css = [];
  const getAssetsName = {
    css: (item) => `<link rel="stylesheet" href="${item}">`,
    js: (item) => `<script class="lazyload-js" src="${item}"></script>`,
  };
  for (let jsitem of data.js) {
    js.push(getAssetsName.js(jsitem));
  }
  for (let cssitem of data.css) {
    css.push(getAssetsName.css(cssitem));
  }
  return {
    js,
    css,
  };
};

class HtmlAfterPlugin {
  constructor() {
    this.jsarr = [];
    this.cssarr = [];
  }
  apply(compiler) {
    compiler.hooks.compilation.tap(pluginName, (compilation) => {
      HtmlWebpackPlugin.getHooks(compilation).beforeAssetTagGeneration.tapAsync(
        pluginName,
        (htmlPligunData, cb) => {
          const { js, css } = assetsHelp(htmlPligunData.assets);
          this.cssarr = css;
          this.jsarr = js;
          cb(null, htmlPligunData);
        }
      );
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        pluginName,
        (data, cb) => {
          let _html = data.html;
          _html = _html.replace('<!--injectjs-->', this.jsarr.join(''));
          _html = _html.replace('<!--injectcss-->', this.cssarr.join(''));
          _html = _html.replace(/@components/g, '../../../components');
          _html = _html.replace(/@layouts/g, '../../layouts');
          data.html = _html;
          cb(null, data);
        }
      );
    });
  }
}

module.exports = HtmlAfterPlugin;


```

# Loader
loader本身是接受一个字符串或者buffer，然后将字符串或者buffer在返回的过程。webpack会将加载的资源传入loader，交与 loader 处理,再返回 

```
const loaderUtils = require('loader-utils')
const path = require('path')
module.exports = function (source) {
    // 获取loader配置
    onst loaderOptions = loaderUtils.getOptions(this);
    return source.replace('adddada', 'myloader')   
}

```

- 转换步骤是异步的loader

```
module.exports = function(source) {
    // 告诉 Webpack 本次转换是异步的，Loader 会在 callback 中回调结果
    var callback = this.async();
    setTimeout(source, function(err, result, sourceMaps, ast) {
        // 通过 callback 返回异步执行后的结果
        callback(err, result, sourceMaps, ast);
    },1000);
};

```

- 处理二进制数据 Webpack传给Loader的原内容都是UTF-8格式编码的字符串。 但有些场景下Loader不是处理文本文件，而是处理二进制文件，例如file-loader，就需要Webpack给Loader传入二进制格式的数据。

```
module.exports = function(source) {
    // 在 exports.raw === true 时，Webpack 传给 Loader 的 source 是 Buffer 类型的
    source instanceof Buffer === true;
    // Loader 返回的类型也可以是 Buffer 类型的
    // 在 exports.raw !== true 时，Loader 也可以返回 Buffer 类型的结果
    return source;
};
// 通过 exports.raw 属性告诉 Webpack 该 Loader 是否需要二进制数据 
module.exports.raw = true;

```




