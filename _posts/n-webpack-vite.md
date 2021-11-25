原理：webpack打包输出的文件其实就是一个闭包，传入的参数是一个对象，健值为输出的文件路径，内容为eval包裹的文件内容；闭包内重写了模块加载的方式，自己定义了webpack_require方法，来实现模拟的commonjs。webpack是基于事件流的，通过一些列的插件来运行，利用tapable提供各种钩子来实现对于整个构建流程的把控。

webpack的构建流程
- 创建Compiler的实例，compile是webpack的运行入口用于控制构建流程，包含webpack的基本环境信息。
- 根据配置项转换成对应的插件，并初始化配置项。
- 执行compiler.runtime，创建compiliation的实例,compiliation是webpack的核心，存储构建的数据，用于控制数据的变化，每次构建都会生成compiliation的实例。
- 从entry开始递归分析依赖，对每个依赖块进行buildModule，通过不同的loader将不同类型的文件构建成webpack的模块。
- 将上面的结果转换成AST树。
- 遍历AST树，收集依赖。并保存在compiliation的dependence中。
- 生成chunk，不同的entry生成不同的chunk，动态导入也会生成自己的chunk。生成chunk还会进行优化
- 使用Template基于Compiliation的数据生成结果代码。


webpack的优化
- 使用多线程构建thread-loader、happy-pack已经废弃，
- 充分利用缓存，比如babel-loader开启缓存、terser-webpack-plugin开启缓存、cache-loader、hard-source-webpacl-plugin,webpack5默认有cache.
- 使用externals忽略需要构建的库，然后采用cdn引入
- 缩小查找范围、比如loader中添加exclude和include、使用别名、noParse忽略需要解析的库，比如jq、resolve.module指明存放的第三方模块路径。
- 利用代码分割将公共资源抽出，减少代码体积
- 对代码进行压缩，比如利用cssnao压缩css。
- webpack-deep-scope-plugin深度tree-shaking，tree-shaing的话不能删除class和function中的没有引用的属性。webpack-deep-scope-plugin可以做到。

webpack热更新原理

HMR能够在保持页面状态的情况下动态替换资源模块，提供顺畅的 Web 页面开发体验。在webpack的生态下启动热更新需要在dev-server中配置hot，同时会调用 module.hot.accept 接口，声明如何将模块安全地替换为最新代码。HMR核心流程：有以下几个步骤
- 使用 webpack-dev-server托管静态资源，同时以 Runtime 方式注入 HMR 客户端代码
- 浏览器加载页面后，与 WDS 建立 WebSocket 连接
- Webpack 监听到文件变化后，增量构建发生变更的模块，并通过 WebSocket 发送 hash 事件
- 浏览器接收到 hash 事件后，请求 manifest 资源文件，确认增量变更范围
- 浏览器加载发生变更的增量模块
- Webpack 运行时触发变更模块的 module.hot.accept 回调，执行代码变更逻辑


webpack的hash
webpack的hash有content-hash、hash、chunkhash

hash 是跟整个项目的构建相关，只要项目里有文件更改，整个项目构建的hash值都会更改，并且全部文件都共用相同的 hash 值。(粒度整个项目)
chunkhash是根据不同的入口进行依赖文件解析，构建对应的chunk(模块)，生成对应的 chunk 值。只有被修改的chunk(模块)在重新构建之后才会生成新的hash值，不会影响其它的chunk。(粒度 entry 的每个入口文件)
content-hash是跟每个生成的文件有关，每个文件都有一个唯一的 hash 值。当要构建的文件内容发生改变时，就会生成新的content-hash 值，且该文件的改变并不会影响和它同一个模块下的其它文件。(粒度每个文件的内容)

webpack 插件

插件是webpack运行到某个时间点需要执行的函数或者对象，webpack插件实现机制如下
- 创建:webpack在自己内部定义了各种hook，这些hook是基于tapable实现的，tapable是类似于eventEmitter的库
- 注册:插件将自己的方法注册到对应的hook上，交给webpack
- 触发: webpack运行到某个节点的时候会触发相关的一系列hook，从而执行插件

- 事件钩子会有不同的类型 SyncBailHook,AsyncSeriesHook,SyncHook 等,是基于tapable。

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

loader本身是接受一个字符串或者buffer，然后将字符串或者buffer在返回的过程。webpack会将加载的资源传入loader，交与 loader进行转换处理,再返回 
webpack与loader的区别

Loader直译为"加载器"。Webpack将一切文件视为模块，但是webpack原生是只能解析js文件，如果想将其他文件也打包的话，就会用到loader。 所以Loader的作用是让webpack拥有了加载和解析非JavaScript文件的能力。
Plugin直译为"插件"。Plugin可以扩展webpack的功能，让webpack具有更多的灵活性。 在 Webpack 运行的生命周期中会广播出许多事件，Plugin 可以监听这些事件，在合适的时机通过 Webpack 提供的 API 改变输出结果。

**实现一个简单的babel-loader**
  
- 利用loaderUtils获取loader的配置
- 利用acorn（ei corn）讲相关的文件内容转换成ast和魔术字符串，魔术字符串主要是为了转换内容。  
- 利用acorn-worker 从ast中获取到需要替换对应的节点的描述。并在魔术字符串中找到对应的内容进行替换
- 返回替换的内容

![Image text](/img/WechatIMG33.jpeg)



# ModuleFeduration

ModuleFeduration想做的事便是把多个无相互依赖、单独部署的应用合并为一个。也是一种微前端的解决方案。ModuleFeduration提供了能在当前应用中远程加载其他服务器上应用的能力，可以引出下面两个概念：host：引用了其他应用的应用。remote：被其他应用所使用的应用。使用mf有几个重要的属性，remotes远程应用名及其别名的映射，name模块名。filename构建输出的文件名称。exports被远程应用引用时可暴漏的资源路径以及别名，share与其他应用共享的第三方模块。主要原理
- mf会让webpack以filename作为文件名生成文件
- 其次，文件暴露了一个名为name的全局变量，其中包含了exposes以及shared中配置的内容
- 最后，作为host时，先通过remote init的时候将自身shared写入remote中，然后获取remote中expose的组件，而作为remote时，判断host中是否有可用的共享依赖，若有，则加载host的这部分依赖，若无，则加载自身依赖。





# Vite只做两件事

首先，一个用于承载资源服务的service；

第二个是使用esbuild预构建npm依赖包。之后就一直躺着，直到浏览器以http方式发送ESM规范的模块请求，Vite才开始“按需编译”被请求的模块。Vite 预设的前提是：现代浏览器大多数已经原生支持 ESM 规范， 开发环境下已经没有太大必要为了低版本兼容把大量的时间花在编译打包上了！

这么一对比，Webpack 是啥都做了，浏览器只要运行编译好的低版本(es5)代码就行；而 Vite 只处理问题的一部分，剩下的事情交由浏览器自行处理，那

Vite 还有很多值得一提的性能优化，整体梳理一下：

预编译：npm 包这类基本不会变化的模块，使用 Esbuild 在 「预构建」 阶段先打包整理好，减少 http 请求数
按需编译：用户代码这一类频繁变动的模块，直到被使用时才会执行编译操作
客户端强缓存：请求过的模块会被以 http 设置max-age缓存,immutable的 设置为强缓存，如果模块发生变化则用附加的版本 请求 使其失效
产物优化：相比于 Webpack ，Vite 直接锚定高版本浏览器，不需要在 build 产物中插入过多运行时与模板代码
内置更好的分包实现：不需要用户干预，默认启用一系列智能分包规则，尽可能减少模块的重复打包
更好的静态资源处理：Vite 尽量避免直接处理静态资源，而是选择遵循 ESM 方式提供服务，例如引入图片 import img from 'xxx.png' 语句，执行后 img 变量只是一个路径字符串。


Vite 的劣势

兼容性
无论是 dev 还是 build 都会直接打出 ESM 版本的代码包，这就要求客户浏览器需要有一个比较新的版本，这放在现在的国情下还是有点难度的。

不过 Vite 同时提供了一些弥补的方法，使用 build.polyfillDynamicImport 配置项配合 @vitejs/plugin-legacy 打包出一个看起来兼容性比较好的版本，我相信这一点会随时间慢慢被抹平。



**ESBuild为什么快**

Esbuild 是一个非常新的模块打包工具，它提供了与 Webpack、Rollup、Parcel 等工具「相似」的资源打包能力，却有着高的离谱的性能优势：
-  Esbuild 则选择使用 Go 语言编写，资源打包这种 CPU 密集场景下，Go 更具性能优势
-  多线程优势，Go 天生具有多线程运行能力
-  Esbuild，它仅仅提供了构建一个现代 Web 应用所需的最小功能集合，相当于圈了个范围，只能使用某些构建特性，像Ts 类型检查、Hot Module Replace都不支持
-  Esbuild 选择重写包括 js、ts、jsx、css 等语言在内的转译工具，它更能保证源代码在编译步骤之间的结构一致性，节省编译的时间。而在 Webpack 中使用 babel-loader 处理 JavaScript 代码时，可能需要经过多次数据转换


**对vite与webpack看法**


是否应该让 Vite 接管生产环境的构建？要知道它对于开发环境效率的提升是非常明显的，但是否真的适合生产环境？

个人觉得开发环境和生产环境得分开看，前者的痛点是效率，而后者的诉求是稳定、质量，这个时候我觉得相比 Vite 打包用的 Rollup，生产环境上 Webpack 是一个更好的选择。
但这样一来又会带来新的问题——两者的配置差异巨大，如何解决配置统一的问题？我个人对此持乐观态度，至少是有可能去实现的。或许真的当 Webpack 和 Vite 之间的配置差异能够被某个方案抹平的时候，Vite 可以适用于所有正在使用 Webpack 的项目，换句话说，当那一天真正到来的时候，在开发环境下，Vite 可以完全取代 Webpack 了。

**esbuild看法**

Esbuild 当下与未来都不能替代 Webpack，它不适合直接用于生产环境，而更适合作为一种偏底层的模块打包工具，需要在它的基础上二次封装，扩展出一套既兼顾性能又有完备工程化能力的工具链，例如 Snowpack, Vite, SvelteKit, Remix Run 等。


