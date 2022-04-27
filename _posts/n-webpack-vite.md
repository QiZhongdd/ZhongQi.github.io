原理：webpack打包输出的文件其实就是一个闭包，传入的参数是一个对象，健值为输出的文件路径，内容为eval包裹的文件内容，上线的时候是没有用eval的，本地开发主用eval主要是为了简单方便；闭包内重写了模块加载的方式，自己定义了webpack_require方法，来实现模拟的commonjs。webpack是基于事件流的，通过一些列的插件来运行，利用tapable提供各种钩子来实现对于整个构建流程的把控。
webpack的构建流程
- 创建Compiler的实例，compile是webpack的运行入口用于控制构建流程，包含webpack的基本环境信息，并初始化配置项。
- 执行compiler.runtime，创建compiliation的实例,compiliation是webpack的核心，存储构建的数据，用于控制数据的变化，每次构建都会生成compiliation的实例。
- 从entry开始递归分析依赖，对每个依赖块进行buildModule，通过不同的loader将不同类型的文件构建成webpack的模块。
- 将上面的结果转换成AST树。
- 遍历AST树，收集依赖。并保存在compiliation的dependence中。
- 生成chunk，不同的entry生成不同的chunk，动态导入也会生成自己的chunk。生成chunk还会进行优化
- 使用Template基于Compiliation的数据生成结果代码。


**webpack热更新原理hmr**

HMR能够在保持页面状态的情况下动态替换资源模块，提供顺畅的 Web 页面开发体验。在webpack的生态下启动热更新需要在dev-server中配置hot，同时会调用 module.hot.accept 接口，声明如何将模块安全地替换为最新代码。HMR核心流程：有以下几个步骤
- 使用 webpack-dev-server托管静态资源，同时以 Runtime 方式注入 HMR 客户端代码
- 浏览器加载页面后，与 WDS 建立 WebSocket 连接
- Webpack 监听到文件变化后，增量构建发生变更的模块，并通过 WebSocket 发送 hash 事件
- 浏览器接收到 hash 事件后，请求 manifest 资源文件，确认增量变更范围
- 浏览器加载发生变更的增量模块
- Webpack 运行时触发变更模块的 module.hot.accept 回调，执行代码变更逻辑


**chrome extension 热更新实现方式如下。**

配置 webpack server，将 bundle 写到磁盘。
通过 webpack plugin 暴露 compiler 对象。
为 webpack server 增加中间件，拦截 reload 请求，转化为 SSE（SSE 全称是 erver-sent Events，是在 HTML 5 中规范和定义的一种服务端推送方式），compiler 注册编译完成的钩子，在回调函数中通过 SSE 发送消息。
chrome extension 启动后，background 与 webpack server 建立连接，监听 reload 方法，收到 server 的通知后，执行 chrome 本身的 reload 方法，完成更新。


**webpack的hash**

webpack的hash有content-hash、hash、chunkhash

hash 是跟整个项目的构建相关，只要项目里有文件更改，整个项目构建的hash值都会更改，并且全部文件都共用相同的 hash 值。(粒度整个项目)
chunkhash是根据不同的入口进行依赖文件解析，构建对应的chunk(模块)，生成对应的 chunk 值。只有被修改的chunk(模块)在重新构建之后才会生成新的hash值，不会影响其它的chunk。(粒度 entry 的每个入口文件)
content-hash是跟每个生成的文件有关，每个文件都有一个唯一的 hash 值。当要构建的文件内容发生改变时，就会生成新的content-hash 值，且该文件的改变并不会影响和它同一个模块下的其它文件。(粒度每个文件的内容)。他适用于css,比如更改了某个入口文件，这个时候css并没有修改，这个时候使用chunkhash就不太合适了。

**webpack 插件**

插件是webpack运行到某个时间点需要执行的函数或者对象，webpack插件实现机制如下
- 创建:webpack在自己内部定义了各种hook，这些hook是基于tapable实现的，tapable是类似于eventEmitter的库
- 注册:插件将自己的方法注册到对应的hook上，交给webpack
- 触发: webpack运行到某个节点的时候会触发相关的一系列hook，从而执行插件
- 事件钩子会有不同的类型 SyncBailHook,AsyncSeriesHook,SyncHook 等,是基于tapable。

**tapable**
细说的话就得从webpack cli说起了先检查webpack-cli，如果没有的话就去install，install需要判断是否有yarn活install，yarn 可以通过yarn log判断。然后webpack cli对entry做初始化，判断是单模块还是多模块。初始化模块后要用compile，compile是基于tapable的，在compile里面模块之间的调度都是通过tapable的hook完成的，hook有异步的也有同步的。然后new compiliaton，看你是单入口还是多入口。如果是单入口的话，就执行单入口的独立脚步。在执行之前需要执行所有的插件，因为plugin有compilation刚初始化的hooks，如果使用plugin比较早的生命周期的话那吗就出发了，运用call 绑定compoiliation把compilation丢进去了。如果没有的话那么comliliation回去分析chunk，这是webpack最核心的了。chunk有同步和异步的，然后去parser模块分析依赖，分析完毕后交给依赖模块和module模块，最后生成template生成我们的代码。


**vue文件依赖解析**

使用vue-loader，然后分析vue里面的东西，要装vue-template编译template模块转换成虚拟dom，然后分析vue的style模块，如果分析到style模块就交给自己的style,如果分析到了script模块，那么就能交给webpack去编译，相当于把webpack模块拆开了

**实现htmlAfterPlugin**

改插件基于html-webpack-plugin插件，html-webpack-plugin在想html文件中是无法改变相关css和js的插入位置的，
所以htmlAfterPlugin是为了解决该问题而实现的。主要适用于平时使用swig等模板语言进行多界面的开发。实现思路如下
- 创建基于compiler.hooks.compilation的插件
- 然后在html-webpack-plugin的beforeAssetTagGeneration钩子获取到相关需要注入的资源
- 获取html-webpack-plugin的beforeEmit钩子，该钩子是处于注入到html前，能够获取到html内容，对相关html内容进行替换


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



# ModuleFeduration mf

ModuleFeduration想做的事便是把多个无相互依赖、单独部署的应用合并为一个。也是一种微前端的解决方案。ModuleFeduration提供了能在当前应用中远程加载其他服务器上应用的能力，可以引出下面两个概念：host：引用了其他应用的应用。remote：被其他应用所使用的应用。使用mf有几个重要的属性，remotes远程应用名及其别名的映射，name模块名。filename构建输出的文件名称。exports被远程应用引用时可暴漏的资源路径以及别名，share与其他应用共享的第三方模块。主要原理
- mf会让webpack以filename作为文件名生成文件
- 其次，文件暴露了一个名为name的全局变量，其中包含了exposes以及shared中配置的内容
- 最后，作为host时，先通过remote init的时候将自身shared写入remote中，然后获取remote中expose的组件，而作为remote时，判断host中是否有可用的共享依赖，若有，则加载host的这部分依赖，若无，则加载自身依赖。

# chunk、module、bundle

module，chunk 和 bundle 其实就是同一份逻辑代码在不同转换场景下的取了三个名字：
对于一份同逻辑的代码，当我们手写下一个一个的文件，它们无论是 ESM 还是 commonJS 或是 AMD，他们都是 module ；
当我们写的 module 源文件传到 webpack 进行打包时，webpack 会根据文件引用关系生成 chunk 文件，webpack 会对这个 chunk 文件进行一些操作；
webpack 处理好 chunk 文件后，最后会输出 bundle 文件，这个 bundle 文件包含了经过加载和编译的最终源文件，所以它可以直接在浏览器中运行。

# Vite只做两件事

首先，建立一个用于承载资源服务的service；

第二个是使用esbuild预构建npm依赖包。之后就一直躺着，直到浏览器以http方式发送ESM规范的模块请求，Vite才开始“按需编译”被请求的模块。Vite 预设的前提是：现代浏览器大多数已经原生支持 ESM 规范， 开发环境下已经没有太大必要为了低版本兼容把大量的时间花在编译打包上了！

这么一对比，Webpack 是啥都做了，浏览器只要运行编译好的低版本(es5)代码就行；而 Vite 只处理问题的一部分，剩下的事情交由浏览器自行处理，

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


**tree-shaking原理**

使用tree-shaking首先需要满足三个条件，遵循esm模块规范，esm模块规范要求所有的导入导出语句只能出现在模块顶层，且导入导出的模块名必须为字符串常量，ESM 下模块之间的依赖关系是高度确定的，与运行状态无关，编译工具只需要对 ESM 模块做静态分析，就可以从代码字面量中推断出哪些模块值未曾被其它模块使用，这是实现 Tree Shaking 技术的必要条件。配置optimization.usedExports为true启动标记功能，启动代码优化功能，需要在为生产环境使用、 optimization.minimize = true和 optimization.minimizer数组。
Webpack 中，Tree-shaking 的实现一是先「标记」出模块导出值中哪些没有被用过，二是使用 Terser 删掉这些没被用到的导出语句。过程大致可划分为三个步骤：
Make（构建阶段） 阶段，收集模块导出变量并记录到模块依赖关系图中
Seal（打包） 阶段，遍历模块依赖关系图,标记模块导出的变量有没有被使用，
生产阶段时，若变量没有被其它模块使用则删除对应的导出语句。

有副作用的的不会被tree-shaking删掉，所谓的副作用不只是调用了函数，比如使用了原型链、给window加了属性、立即执行函数引用了外部变量,经过bable其它的打包一下，也有可能会产生副作用。比如对于类的作用也会有问题，当我们没有引入babel的时候，遵循函数的方式进行shaking，但是引入babel之后，转化成ES5，会挂载到函数的原型上，就会产生副作用，从而没办法达到想要的结果。当然我们可以配置sideEffects为false,sideEffects主要是让 webpack 去除 tree shaking 带来副作用的代码。不管有没有副作用，只要没有被引用，都会被清除。但是会引申出另一个问题，如果配置了，那么很多简单引用都会被忽略，比如引入一个css。所以为什么那么多脚手架都不会去配置这个参数，并不能保证开发者能保证代码都没有副作用.sideEffects可以是一个数组，表示当前的这些文件有副作用，从而不tree-shaking.


**webpack的优化**

- 使用持久化缓存， Webpack5 场景下设置 cache.type = 'filesystem' 即可开启，开启持久化缓存，Webpack5 会将首次构建出的 Module、Chunk、ModuleGraph 等对象序列化后保存到硬盘中，后面再运行的时候就可以跳过一些耗时的编译动作，直接复用缓存信息。webpack 4可以使用cache-loader，开启babel-loader和eslint-loader的缓存。
- 使用多进程打包，比如使用happy-pack，thread-loader。可以开启terser的并行压缩，行确实能够提升系统运行效率，但 Node 单线程架构下，所谓的并行计算都只能依托与派生子进程执行，而创建进程这个动作本身就有不小的消耗 —— 大约 600ms，因此需要按实际需求使用上述多进程方案。
- 减少编译范围、编译步骤提升 Webpack 性能，使用最新版本 Webpack、Node，配置 resolve 控制资源搜索范围，针对 npm 包设置 module.noParse 跳过编译步骤，配置 module.rules.exclude 或 module.rules.include 降低 Loader 工作量，配置 watchOption.ignored 减少监听文件数量，慎重选择 source-map 值，开发环境使用 eval ，确保最佳编译速度，生产环境使用source-map，获取最高质量，但我们不可以让用户访问到source-map，比如上传到服务器的时候不上传source-map，或者在服务区配置静止用户访问，在nginx配置map对应的location。优化 ts 类型检查逻辑，类型检查涉及 AST 解析、遍历以及其它非常消耗 CPU 的操作，会给工程化流程引入性能负担，必要时开发者可选择关闭编译主进程中的类型检查功能，同步用 fork-ts-checker-webpack-plugin 插件将其剥离到单独进程执行，
- 配置分包，SplitChunksPlugin 通过 module 被引用频率、chunk 大小、包请求数三个维度决定是否执行分包操作，这些决策都可以通过 optimization.splitChunks 配置项调整定制，基于这些维度我们可以实现：单独打包某些特定路径的内容，例如 node_modules 打包为 vendors，单独打包使用频率较高的文件，还可以配置缓存组。Webpack 内部包含三种类型的 Chunk：Initial Chunk：基于 Entry 配置项生成的 Chunk，Async Chunk：异步模块引用，如 import(xxx) 语句对应的异步 Chunk，Runtime Chunk：只包含运行时代码的 Chunk。通过设置SplitChunksPlugin为all表示对所有类型的chunk都能进行分割。还可以设置使用频率minchunk以及分包大小 minSize、maxSize进行分包。
- 使用swc和esbuild，他们分别用go和rust写的。但他们的生态不如babel完整，有些npm包可能不能编译。
- webpack自身也做了一些优化，比如使用了v8-compile-cache 用于对编译中间结果持久化，加快整体执行时间。

**拆包策略**

- react、vue这些工具包可以单独抽出来，采用强缓存。
- antd、element单独一个包设置强缓存。
- 把nodemodule抽成一个独立的包，采用离线截至的缓存，比如localstorage、indexdb等。这里有个问题就是修改了内容以后，要让离线内容更新。
- runtime代码可以直接注入到html。
- 可以把公用的包单独抽出来,设置协商缓存。
- 异步的包可以单独抽成一恶搞chunk，然后使用quicklink加载，他能根据系统烦不烦忙、网络快不快、是否在视图窗口提前加载对应的包。


**v8-compile-cache**

v8 是一个 JIT(Just in time) 编译器。与传统的解释器一行一行执行不同的是，JIT 会在执行脚本前，对源码先解析（parsing）、再编译（compiling)，速度相比前者提升了不少。但解析和编译仍然消耗时间。v8为了能将中间结果缓存起来，就支持了 code caching 的功能。减少二次执行的构建时间，加快脚本的整体执行速度。因为node.js 通过 require 来连接代码，v8-compile-cache的主要作用就是对所有 require 的 module 进行编译并缓存结果。v8-compile-cache 的使用很简单，直接require就行，首先会检查用户是否开启了code caching，如果支持就做持久化，持久化的时候首先在硬盘生成写入地址，然后存储生成的二进制 code caching，建立一个map对象存储脚本到二进制文件的映射。最后将require hook和存储的二进制文件关联起来。关联的时候会重写原生模块的require方法，在require方法内部先创建一个node的 wrapper function，然后对文件内容生成散列，接着读取已经生成 code cache。然后给 vm.Script 去执行。vm.Script 并不会运行脚本，只负责编译，最后返回一个 compiledWraper包装到 module.exports。




**externals**
externals和libraryTarget的关系
libraryTarget配置如何暴露 library。如果不设置library,那这个library就不暴露。就相当于一个自执行函数
externals是决定的是以哪种模式去加载所引入的额外的包
libraryTarget决定了你的library运行在哪个环境，哪个环境也就决定了你哪种模式去加载所引入的额外的包。也就是说，externals应该和libraryTarget保持一致。library运行在浏览器中的，你设置externals的模式为commonjs，那代码肯定就运行不了了。
如果是应用程序开发，一般是运行在浏览器环境libraryTarget可以不设置，externals默认的模式是global，也就是以全局变量的模式加载所引入外部的库。