**react事件机制**

react并不是将click事件绑定到div的真实dom上，而是在document处监听所有支持的事件，当事件发生冒泡至document时，react将事件内容封装并交由真正的处理函数运行，这样不仅减少了内存消耗，还能在组件挂载销毁时统一删除。冒泡至document是react的合成事件。具体流程：

react的事件机制主要有两个阶段：
事件注册阶段：收集相关的事件绑定到document中，但并不是所有的事件都会被收集比如form表单的submit、reset还有video和audio的媒体事件。
第二个阶段是执行阶段：它主要有以下几个步骤，第一个步骤是创建合成事件，并将原生事件包装到合成事件中，以原生事件的target为节点向上查找，如果fiber节点的tag=hostComponent则加入到path数组中。第二个阶段是捕获阶段，倒序遍历path数组，如果fiber节点还有onClickCapture属性，则添加到合成事件的dispatch_listner中。第三个步骤是收集冒泡的回调。顺序遍历path数组，如果找到了onClick回调，则添加到dispatch_listner，第四个步骤就是按顺序执行合成事件的dispatch_Listner。

React v17 中，React 不会再将事件处理添加到 document 上，而是将事件处理添加到渲染 React 树的根 DOM 容器中：这是因为在多版本并存的系统时，不同版本的事件系统是独立的，所以不同版本的 React 组件嵌套使用时，e.stopPropagation()无法正常工作，因为到document已经太晚，此时原声的原生 DOM 事件早已冒出document了。为了解决这个问题，React 17 不再往document上挂事件委托，而是挂到 DOM 容器上


**对react fiber的理解**

react fiber采用将任务采用分片式的方法处理，当运行完一段任务后，会查看有没有优先级更高的任务或者到期的任务，如果有那么就会立即执行，等到执行这些任务后会回到原来的任务继续执行。任务的分片依赖的是模拟实现了requestIdleCallback,该api会在线程空闲的时候执行相关的任务，如果设置了timeout，那么到时的任务就会被强制执行。fiber的本质是个链表，包括chile、sibiling、return、stateNode，多个fIber会组成fiberTree，由于链表的特性，可以快速的找到打断的任务，然后重新执行。fiber更新组件分发reconcile阶段，和commit阶段。reconcile阶段是在render之前，这个阶段的任务是可以被打断的如果有优先级和到时的任务会执行较高的任务，当执行完优先级别较高的任务后会回到原来的任务重新执行，所以这个阶段谁先执行由调度器决定,而commit阶段是在render之后对的，是不可以打断的，会依次执行。



react的调度过程

- 初始化调度之前先判读有没有同步任务，有则立即执行，如果没有则调用ensureRootIsScheduled进行初始化调度,调度的初始化首先会根据相关的规则进行调度
- - 判断有没有过期任务，有过期任务立即执行。
- - 没有新任务则立即退出调度
- - 有旧任务，则与旧任务比较优先级和过期时间。过期时间相同，旧任务优先级较高，则推出调度。过期时间不同，新任务的优先级较高会取消旧任务
- - 根据expirationTime执行不同的调度(scheduleSyncCallback或scheduleCallback), 最后将返回值设置到fiberRoot.callbackNode
- 在发起调度时会将及时任务和延时任务分别添加到taskQueue和timerQueue中，并设置相关的回调，及时任务为flushCallback,延时任务会设置定时器回调，将延时任务触发后变成及时任务。然后会触发requestHostcallback模拟实现了requestIdleCallback,requestHostCallback触发一个宏任务 performWorkUntilDeadline。首先判断否有富裕时间, 有则执行。执行该回调任务后，是否还有下一个回调任务,有则继续执行 port.postMessage(null)，进入下一个事件循环;
- 当检查到任务已经完成就会退出调度，如果检查到了timerQueue中有任务那么会在下一次事件循环中继续执行调度


不采用window.requestIdleCallback的原因：window.requestIdleCallback兼容情况一般。RequestIdleCallback 不重要且不紧急的定位。因为React渲染内容，并非是不重要且不紧急。不仅该api兼容一般，帧渲染能力一般，也不太符合渲染诉求，故React 团队自行实现。

**为什么使用宏任务：**

核心是将主进程让出，将浏览器去更新页面。利用事件循环机制，在下一帧宏任务的时候，执行未完成的任务，如果是微任务，对一个事件循环机制来说，在页面更新前，会将所有的微任务全部执行完，故无法达成将主线程让出给浏览器的目的。

**既然用了宏任务，那为什么不使用 setTimeout 宏任务执行呢?**

如果不支持MessageChannel的话，就会去用 setTimeout 来执行，只是退而求其次的办法。
现实情况是: 浏览器在执行 setTimeout() 和 setInterval() 时，会设定一个最小的时间阈值，一般是 4ms。


setState 是同步还是异步
setState是同步渲染还是异步渲染取决于ReactFiberWorkLoop（fiber的构建循环）的执行上下文环境。是否同步调用取决于是否进入flushSyncCallbackQueue，在legacy模式下，并且执行上下文为空的时候调用setState会进入flushSyncCallbackQueue，异步任务或者原生事件中当前的执行上下文为空。如果是合成事件中的回调或者是concurrent 模式下是异步的

state是用来管理内部状态的，只能通过setState和forceUpdate改变状态更新视图。setState最终也会走forceUpdate。每个类组件都有一个updater对象用于管理state的变化。调用setState传入partialState时，会将partialState存入updater中的pendingState。此时updater又会调用emitUpdate来决定是否立即更新，判断条件简单来说是否有nextProps，或者updateQueue的isPending是否开启，updateQueue用于管理updater，如果updateQueue的isPending为true，那么
就将当前的update直接加入updateQueue的队列中，开启isPending的方式是可以自定义方法和生命周期函数，当这些方法执行完毕更新update，调用update的componentUpdate，判断组件的shouldComponentUpdate决定是否调用forceUpdate进行更新

setState 只在合成事件和钩子函数中是“异步”的，在原生事件和 setTimeout 中都是同步的。
setState的“异步”并不是说内部由异步代码实现，其实本身执行的过程和代码都是同步的，只是合成事件和钩子函数的调用顺序在更新之前，导致在合成事件和钩子函数中没法立马拿到更新后的值，形式了所谓的“异步”，当然可以通过第二个参数 setState(partialState, callback) 中的callback拿到更新后的结果。
setState 的批量更新优化也是建立在“异步”（合成事件、钩子函数）之上的，在原生事件和setTimeout 中不会批量更新，在“异步”中如果对同一个值进行多次 setState ， setState 的批量更新策略会对其进行覆盖，取最后一次的执行，如果是同时 setState 多个不同的值，在更新时会对其进行合并批量更新。

react的useState和Class中的state有什么区别
首先class中的state是immutable的，得通过setState去修改，会产生一个新的引用，可以通过this.state获取新的数据。
useState产生的数据也是immutable的，通过数组的第二个参数修改值。在下次渲染时，原来的值会产生一个新的引用。它的本质是闭包，最新的值跟着最新的渲染改变，但旧的渲染里，状态依然是旧值。两者的状态值都会挂载到FiberNode的memorizeState中。但两者的数据结构是不相同的，类组件直接把state挂载到到memorizeState中，而hook是以链表的形式保存的，memorizeState是链表的头部。

useEffect的以链表的形式挂载到FiberNode的updateQueue中，在初始化阶段函数会依次调用useEffect，依次挂载到fiberNode的updateQueue中，链表的节点属性有tag(用来标识依赖项有没有改变)，create(用户用useEffect传入的函数体)，destroy(上树函数执行后生成的用来清除副作用的函数)，deps(依赖选项表)，next(下一个节点)。组件渲染完成后，依次调用链表执行
在update阶段，同样会依次调用useEffect语句，此时会判断传入的依赖列表，与链表节点的Effect.deps中保存的是否一致（基本数据结构是否相同，引用是否相同），如果一致那么就会在effect.tag上标记NoHookEffect。组件渲染完成后就会进入useEffect的执行阶段function commonHookEffectList。首先会遍历链表，如果遇到tag为NoHookEffect的节点就会跳过，如果destroy为函数类型，那么就执行清除副作用的函数，执行create，并将执行结果保存到destroy中。所以整体的流程是先清除上一轮的 effect，然后再执行本轮的 effect

react的优化：
- 使用React.memo缓存组件，这样只有当传入组件的状态只发生变化时才会重新渲染，如果传入的只和上一次没有发生变化，则返回缓存的组件：
- 使用useMemo和useCallback缓存相关的计算结果。
- memo 仅针对函数组件，对于 class 组件，我们可以使用 PureComponent 或者是自己书写 shouldComponentUpdate 是否需要重新渲染当前组件。
- 避免使用内联对象，在 JSX 中创建一个内联对象的时候，每次重新渲染都会重新生成一个新的对象，如果这里还存在了引用关系的话，会大大增加性能损耗，所以尽量避免使用内联对象
- 避免使用匿名函数，匿名函数可以更加方便的对函数进行传参，但是同内联对象一样，每一次重新渲染都会生成一个新的函数，所以我们应该尽量避免使用内联函数。
- 运用react.lazy延迟加载不必要的组件

useState和useReducer都是关于状态值的提取和更新，从本质上来说没有什么区别，背后都是一套逻辑。可以看做useState是useReducer的简化版。

对react-hook的理解
react-hook是16.8后的特性，主要解决了以下几个问题：组件状态逻辑复用的问题，在class组件中如果要共同状态逻辑需要通过高阶组件，这种方式比较繁琐。第二就是class中的this指向问题。第三就是难以记忆的生命周期。在react中，每次调用都会通过createWorkInprogressHook创建workInprogresshook表示运算hook，多个hook是以类似链表的形式进行串联的，而不是数组。所以在使用react hook不能再循环、条件语句中使用，同时react-hook不能相互嵌套。react hook有以下几个:
- useState：返回创建的状态和修改状态的函数
- useEffect：用来处理副作用的函数。主要有以下几种用法，第一就是在没有依赖的情况下，就是第二个参数为空数组，这个时候类似于componentDidMount，调用ajax。第二就是有依赖的情况下，当依赖发送变化后会触发。第三就是函数中返回一个函数，返回的函数会在卸载阶段执行
- useContext:useContext使用createContext创建的上下文
- useRef：创建ref对象，current属性指向初始化值
- useImperativeHandle:子组件暴露给父组件能通过ref调用的属性
- useMemo:创建一个记忆的纯函数，返回一个值。接受两个参数，第一个是函数，函数返回的值即useMemo返回的值。第二个是依赖，当依赖发生变化会触发函数。
- useCallback：类似于useMemo。但是它返回的是函数，接受的参数，当依赖的值变化后就会更改。
- useReducer:useState的替代方案，接受类型为（state,action）=>newState的的reducer。
- useLayoutEffect:当dom更新的时候会触发。
- useMutationEffect:当兄弟发生更新，react在执行改变其dom的时候会触发。



**react-router**

在单页应用中，一个web项目只有一个html页面，一旦页面加载完成之后，就不用因为用户的操作而进行页面的重新加载或者跳转,注意有两个特性，改变 url 且不让浏览器像服务器发送请求，在不刷新页面的前提下动态改变浏览器地址栏中的URL地址。主要分成了两种模式：hash模式和history 模式，history允许操作浏览器的曾经在标签页或者框架里访问的会话历史记录。React Router对应的hash模式和history模式对应的组件为：HashRouter，BrowserRouter。
主要原理是路由描述了 URL 与 UI之间的映射关系，这种映射是单向的，即 URL 变化引起 UI 更新（无需刷新页面），以hash模式为例子，改变hash值并不会导致浏览器向服务器发送请求，浏览器不发出请求，也就不会刷新页面，hash 值改变，触发全局 window 对象上的 hashchange 事件。所以 hash 模式路由就是利用 hashchange 事件监听 URL 的变化，从而进行 DOM 操作来模拟页面跳转。History 模式通过重写 a 标签的点击事件，阻止了默认的页面跳转行为，并通过 history API 无刷新地改变 url，最后渲染对应路由的内容。 
H5 引入的 pushState()和 replaceState()及 popstate事件 ，能够让我们在不刷新页面的前提下，修改 URL，并监听到 URL 的变化，为 history 路由的实现提供了基础能力。



什么要进行ssr
首先spa在启动的时候，首先要先加载js和css，待js加载完后然后开始执行，发送请求，将数据内容与资源渲染奥屏幕上。这会导致白屏时间较长。同时无法解决SEO的问题。所以就出现了SSR，SSR解决了上面的两个问题，但是比较复杂难以维护，并且对服务器的性能损耗比较大。

reactssr的原理：ssr依赖的是虚拟dom，因为Node中是不能操作dom对象的，react的ssr只能将虚拟dom转换成虚拟dom输出，然后通过js对象将虚拟dom进行挂载。

react-ssr的步骤
- 首先我们先利用koa渲染一段html，然后利用renderToString和renderToNodeStream渲染app应用相关的组件,渲染完成后放入root的div中，实现真正的服务端渲染
- 由于renderToString和renderToNodeStream只能处理html dom元素，不能处理逻辑，所以还需要利用webpack对客户端进行构建，引入构建后的js文件
- 对前后端的路由进行拆分，前端路由为 browRouter，后端路由 staticRouter，并分别绑定
- 这样基本完成了SSR，但是数据并没有跟随服务端一起渲染，需要客户端发送请求响应的数据然后再进行渲染
- 解决该完问题首先要对renderRoutes对路由进行渲染，然后对路由进行改造，在路由上添加一个loadData方法请求数据的加载，后端通过matchRoute匹配对应的路由，然后判断是否有loadData，然后进行加载。加载完后挂载到window上。也就是所谓的注水操作。
- 现在的问题是如果一个路由匹配到了多个界面，无法处理多级路由的数据。这个时候就得借助状态管理，比如redux，将loadData的数据保存在状态管理中。
- 最后客户端要进行判断，如果有数据那么就不需要进行加载loadData。

redux的了解
redux的数据都会存放在store中，必须通过指定的流才能去修改，首先view会通过派发action，reducer收到action后会根据不同state进行替换，然后通知相关的订阅，订阅收到通知后触发相关的事件。同时redux还提供了以下属性，combineReducer可以将多个reducer组合成一个reducer，在平时的开发中我们会根据模块定义多个reducer，最后利用combineReucer将多个reducer组合成一个。middleware，可以监听redux的状态或者对dispatch进行劫持，常见的有redux-saga、redux-thunk。middleware是根据组合函数将多个middleware组合在一起的。

mobx的了解
mobx是一个状态管理库，跟redux不同，它更加的简单且扩展性强，推崇任何源自应用状态的东西都可以自动的获得。它的核心原理是通过action触发state的变化，进而更新state的衍生对象computed和reaction。mobx有以下几个概念
- ObservableState:可观察的状态，存放应用数据，Observer是递归引用的，如果是对象和数组也是可观察的
- Computed values：计算值在相关的state数据发生变化时自动更新值
- reaction跟计算值很像，但它不是一个新的值，而是会产生副作用，比如打印、网络请求、更新组件树等
- actions:用来修改状态


vue3composition api

首先要了解一下 composition api 设计的好处有逻辑组合和复用、类型推导、打包尺寸等。

在 vue3.0 之前所有的组件都可以看做一个可选项的配置集合，通过 data、computed、methods、watch以及 created、mount 等生命周期函数，用这个可选项集合来声明一个组件。

这样写的好处是组织结构清晰，但是在逻辑复用上就不太友好了。我们都知道,js中最简洁清晰的复用方式就是将逻辑封装到一个函数中，然后函数与函数之间相互调用。
vue3.0 很好的支持了ts，而ts的最重要的一个特性就是类型推导，而函数相对于嵌套的对象来说对类型推导更加的友好。
另外，以函数形式组织的模块以具名方式导入使用，在tree-sharking的时候支持会更好。setup函数vue3中专门为组件提供的一个新属性，它是我们在使用vue3的composition-api的统一入口。在berforeCreatd和created之前执行。
有两种方式能创建响应式数据：reactive()和ref()。reactive()函数接收一个普通对象，返回一个响应式的数据对象。ref()函数将一个给定的值转为响应式的数据对象，它返回一个对象，响应式的数据值需要通过调用value属性访问，而在页面模板中则可直接访问。isRef()用来判断某个值是否为ref()函数创建出来的对象。
toRefs()函数可以将reactive创建出来的响应式对象转换为通过ref()创建出来的响应式对象。watch()函数用来监听某些数据的变化，从而触发某些特定的操作。computed()用来创建计算属性，computed()函数的返回值是一个ref的实例。在setup()函数中创建的watch()监听，会在当前组件被销毁的时候自动清除，新的生命周期函数需要按需导入，并且在攂斖瀉戩壒函数内使用。
```
beforeCreate() ☞ setup()
created() ☞ setup()
beforeMount() ☞ onBeforeMount()
mounted() ☞ onMounted()
beforeUpdate() ☞ onBeforeUpdate()
updated() ☞ onUpdated()
beforeDestory() ☞ onBeforeUnmount()
destoryed() ☞ onUnmounted()
errorCaptured() ☞ onErrorCaptured()

```
provider&inject
在vue2.x的时候，我们可以使用壒婨壗霫厲壧斖和厲攪孂斖巚瀉实现嵌套组件之间的数据传递，但是在vue3.x中需要在setup()函数内使用。

defineConponent
这个函数仅仅提供了类型推断，主要是为了更好的结合ts来使用，能为setup()函数中的props供完整的类型推断。




父beforeCreate->父created->父beforeMount->子beforeCreate->子created->子beforeMount->子mounted->父mounted
父beforeUpdate->子beforeUpdate->子updated->父updated
父beforeDestroy->子beforeDestroy->子destroyed->父destroyed

生命周期
beforeCreated:在实例初始化之后，数据观测(data observer) 和 event/watcher 事件配置之前被调用。
created:实例已经创建完成之后被调用。在这一步，实例已完成以下的配置：数据观测(data observer)，属性和方法的运算， watch/event 事件回调。然而，挂载阶段还没开始，$el 属性目前不可见。
beforeMount（）:在挂载开始之前被调用：相关的 render 函数首次被调用。
mount:el 被新创建的 vm.$el 替换，并挂载到实例上去之后调用该钩子。如果 root 实例挂载了一个文档内元素，当 mounted 被调用时 vm.$el 也在文档内。
beforeUpdate:数据更新时调用，发生在虚拟 DOM 重新渲染和打补丁之前。 你可以在这个钩子中进一步地更改状态，这不会触发附加的重渲染过程。
updated:由于数据更改导致的虚拟 DOM 重新渲染和打补丁，在这之后会调用该钩子。
当这个钩子被调用时，组件 DOM 已经更新，所以你现在可以执行依赖于 DOM 的操作。然而在大多数情况下，你应该避免在此期间更改状态，因为这可能会导致更新无限循环。

vue的异步任务队列
当vue的数据发生变化后，并不会马上对视图更新，首先会将watcher添加进缓冲队列。如果同一个watcher被触发多次，那么只会存入一次。这避免了不必要的重复计算和相同的dom操作。在nextTick中执行watcher，通知视图进行更新。nextTick首先会适配微任务，然后才是宏任务，这是因为在当前的事件循环中，微任务会优先于宏任务执行。适配顺序promise.then、messageChannel、setImmediate、setTimeout。

vue的Keep-alive
首先会拿到keep-alive下面的第一个子组件的name，判断当前name是否不在include或者在exclude中，那么会返回vnode。exclude的属性会比include的基本高
如果在include里面，那么会创建key值，key值由cid::tag组合。然后判断key值是否在缓存到数组中，如果在的话将key值从原来的地方删除并添加到尾部。如果不在的话直接添加到队列尾部。添加的时候如果超过了队列的限制大小，那么会将缓存队列的尾部的key值删除
将组件的keep-alive设置为true。组件加载的时候会根据createComponentInstance(第一次为undefined)和keep-alive判断是否需要执行crente和mount。如果keep-alive为true和createComponentInstance有值，那么就不会执行create和mout，直接patch,把缓存的对象直接插入目标元素中，完成视图更新
keep-alive运用了LRU缓存策略，LRU的核心策略是如果数据最近被访问，那么将来被访问的记录也比较高，一般由链表实现
首先会将新数据插入链表头部。
每当缓存命中，则将数据移到链表头部
链表满的时候，将链表尾部的数据丢弃

keep-alive组件子组件渲染机制：

1. 首次渲染：和普通组件一样执行正常的init生命周期钩子函数，同时将生成的vnode缓存到内存中；

2. 组件切换：切换到新组件时，旧组件不会销毁，而是变成未激活状态，即不会执行destroy相关的钩子函数，而是执行 deactivated 生命周期钩子函数，如果新组件不在缓存数组中，则执行首次渲染，否则执行缓存渲染；

3. 缓存渲染：缓存渲染即组件由未激活状态变成激活状态，因此不会执行created、mounted等钩子函数，而是执行 activated 生命周期钩子函数。


首先进行Vue的初始化，初始化Vue的实例成员以及静态成员。
当初始化结束之后，开始调用构造函数，在构造函数中调用this._init()，这个方法相当于我们整个Vue的入口。
在_init()中调用this.$mount()，共有两个this.$mount()。
     第一个this.$mount()是entry-runtime-with-compiler.js入口文件，这个$mount()的核心作用是帮我们把模板编译成render函数，但它首先会判断一下当前是否传入了render选项，如果没有传入的话，它会去获取我们的template选项，如果template选项也没有的话，他会把el中的内容作为我们的模板，然后把模板编译成render函数，它是通过compileToFunctions()函数，帮我们把模板编译成render函数的,当把render函数编译好之后，它会把render函数存在我们的options.render中。
src\platforms\web\entry-runtime-with-compiler.js
如果没有传递render，把模版编译成render函数
compileToFunction()生成render()渲染函数
options.render=render
     第二个this.$mount()是runtime/index.js中的this.$mount()方法，这个方法首先会重新获取el，因为如果是运行时版本的话，是不会走entry-runtime-with-compiler.js这个入口中获取el，所以如果是运行时版本的话，我们会在runtime/index.js的$mount()中重新获取el。
src\platforms\web\runtime\index.js
mountComponent()
接下来调用mountComponent(),mountComponent()是在src/core/instance/lifecycle.js中定义的，在mountComponent()中，首先会判断render选项，如果没有render，但是传入了模板，并且当前是开发环境的话会发送警告，警告运行时版本不支持编译器。接下来会触发beforeMount这个生命周期中的钩子函数，也就是开始挂载之前。
然后定义了updateComponent()，在这个方法中，定义了_render和_update，_render的作用是生成虚拟DOM，_update的作用是将虚拟DOM转换成真实DOM，并且挂载到页面上来。
再接下来就是创建Watcher对象，在创建Watcher时，传递了updateComponent这个函数，这个函数最终是在Watcher内部调用的。在Watcher创建完之后还调用了get方法，在get方法中，会调用updateComponent()。
然后触发了生命周期的钩子函数mounted,挂载结束，最终返回Vue实例。


vue-router的原理是更新视图而不重新请求界面，分别有hash、history、abstract模式。
默认是hash模式，基于浏览器history api，采用window.addEventListner('hashchange)监听hash值的变化，如果是push则直接加到浏览器历史栈顶。如果是replcae，则直接替换浏览器历史栈顶

history模式，使用window.onpopstate对浏览器地址进行监听，对浏览器的history api的pushState和replcaeState进行封装，当方法调用时，会对历史栈顶进行修改。从而实现无需跳转url加载界面。但刷新界面会走后端路由，所以需要服务端进行兜底。

abstract不涉及浏览器的历史栈，一般用于服务端。
hash模式和history模式分别通过window.addEventListner对hashChange和popState监听，进行相对应的操作。可以通过go、forward、back访问浏览器历史栈顶。

vue的mixin和extend
vue的minxin和extend都是为了扩展组件的选项和配置。mixin能够接受多个对象，这些选项会被合并到最终选项，mixin钩子会在调用组件自身的钩子之前被调用。extend主要是为了扩展单文件的组件。两种都在mergeOptions进行实现。在调用mergeOptions时首先会规范化相关的选项，判断调用的是extend还是mixin,然后调用不同的mergeOptions。mixin会对注入对象的属性依次遍历赋值到对象的原型中，最后返回新的options。而extend是采用继承的方式继承相关的属性。

vue的template到render的过程
vue的模板编译过程大概如下：template->ast->render。这个过程是在compileToFunction下完成的。首先它会用正则表达式匹配模板字符串，解析到开始标签、闭合标签、文本都会采取不同的回调来构建Ast。构建完AST后还会对静态文件节点进行优化，就是打标签，后续的渲染如果识别到了标记，那么就不会重新渲染，这对运行时模板的优化有很大的作用。然后会调用generate，将ast转换为render字符串，调用new Function生成render函数。

vue3template的过程
vue3的编译有三个阶段，分别是parse将模板字符串转化为抽象语法树AST、transform则对AST进行转换处理、codegen则根据函数字符串生成render函数字符串。

parse解析模板字符串分为两种情况一直是开始标签开头的字符符号，一种是不以开始标签开头的字符串，不以开头的字符串也有两种情况：他可能是文本或者模板字符串。通过正则表达式匹配以开始标签开头的字符串是元素开始标签、注释、文档声明、结束标签，梅解析完一个标签、文本vue就会生成AST节点，把已经解析完的字符串截断。vue会用一个栈来保存解析到的元素标签，栈的主要作用是保存已经解析了但还没解析完的标签，栈还有一个作用就是通过栈顶元素获取到父元素
在 transform 阶段，Vue 会对 AST 进行一些转换操作，主要是根据不同的 AST 节点添加不同的选项参数，这些参数在 codegen 阶段会用到。

vue的计算属性和普通属性的区别：
computed的属性是数据层到视图层的数据转换成映射，计算属性是基于他们的依赖进行缓存的，只有在相关的属性发生变化时，他们才会改变。如果声明的计算属性计算量非常大的时候，而且访问量比较多，那么我们可以采用计算属性。


vue2的双向绑定：
vue2在实例化的时候首先会遍历data的属性，然后采用Object.defineProperty对相关属性进行监听。在模板首次渲染的时候会获取data中的属性，触发get,这时会通知Watcher添加相关的依赖，所谓的依赖就是Watcher本身，一个组件对应一个Watcher。当属性发生变化时，会触发set,这时会通知相关的依赖进行相关的视图更新。视图不是立即更新的，vue首先会将watcher添加进缓冲队列中，当同一个Watcher被触发多次后，那么只会添加一次，这节省了大量的计算的多次的dom更新。当所有的属性修改完后，会在nextTick中相关的事件队列。nextTick首先会适配promise.the、MessageChannel、setImmediate、setTimeOut。

vue2对数组方法的修改：vue2中，类似于pop、push、unshift、reverse、sort等api会对数组造成移位，所以在进行这些操作时，会触发多次的set。所以vue2对这些数组的方法进行了重写。首先会获取到数组原生的方法，列出需要修改的原生方法，如果是有新增项的方法，首先会对新增项进行Object.defineproperty。然后执行原生的方法，执行完了再手动通知视图更新。最后用Object.defineProperty对拷贝的原型链对象相关的属性进行重新定义

computed原理：当组件初始化的时候，vue会很急computed和data建立两套不同的响应式系统，compute首先会调用initComputed创建一个watch实例和deps用收集依赖，当获取计算属性的时候会触发get函数，会调用watcher.depend收集相关的依赖，同时调用watcher.evalute称让自身称为其他属性的订阅者。当某个属性发生变化时，触发set，通知相关的依赖进行更改，完成响应式的更新



Object.defineProperty和Proxy的区别
1:Object.defineproperty只能劫持对象的属性，而Proxy直接代理对象。
2：Object.defineProperty对新增的属性不能监听，需要手动进行Observe，就是重新遍历对象，然后在调用Object.defineProperty对属性进行劫持。这也是Vue2对新增的属性需要调用Vue.set才能进行监听的原因。
3：Proxy的兼容性较差，目前没有完整的方案对Proxy的api进行polyfill;

vue3与vue2的对比
- 申明变量：vue3可以同过reactive声明响应式对象，也可以通过ref单独申明一个响应式的变量
- 增加了入口函数setUp，只有返回的方法和属性才能被视图引用，
- 生命周期发生了变更，beforeCreate和create有setup代替。其余的就名称发送了改变。
- 提供了tree-shaking，打包的时候去除了没用的模块，
- 更好的ts支持
- 响应式方式发生了改变，采用proxy。
- 重构了虚拟dom，保持兼容性，使dom脱离模板渲染,提升性能。



vue3：响应式的流程
- vue3初始化时会对相关的对象或者变量进行响应式处理，响应式处理采用的是proxy。
- 同时会执行一个effect函数，调用createReactiveEffect 将原来的 fn 转变成一个 reactvieEffect ，并将当前的 effect 挂到全局的 activeEffect 上，目的是为了一会与当前所依赖的属性做好对应关系。首次加载的时候，会将render作为fn传入，创建完reactiveEffect时，然后执行reactiveEffect，并且会执行render，在render的时候会触发proxy的get，调用track函数对依赖进行收集，所谓的依赖就是effect。
- 当属性发生修改时，会触发set,然后调用trigger，遍历effectStack，更新相关的视图

vuex:vuex是vue的状态器，使用时首先要用vue.use在beforeCreated阶段将store挂载在原型上。xuex主要有以下几种成分，store存储状态，mutaion修改状态，action进行异步操作，操作完后commit mutation修改状态。getters是state的衍生。与redux相比，vuex的状态改变后能立即更新视图，而redux不行，需要手动通知相关的订阅。同时vuex的state是可以直接修改的，而redux不行，每次调用reducer都得返回一个新的state去替换旧的state，所以vuex使用起来较简单，redux较繁琐

、key的作用主要是为了高效的更新虚拟dom，其原理是vue在patch过程中通过key可以精准判断两个节点是否是同一个，从而避免频繁更新不同元素，使得整个patch过程更加高效，减少dom操作量，提高性能。2、另外，若不设置key还可能在列表更新时候引发一些隐藏的bug。3、vue中在使用相同标签名元素的过渡切换时，也会使用到key属性，其目的也是为了让vue可以区分它们，否则vue只会替换其内部属性而不会触发过渡效果。


• vue key最好不要和index一样是为什么？
• 因为index是表示顺序、在新旧节点对比的过程中、会有sameNode的判断、这个判断是dom-diff这种优化的核心逻辑、
• 简单讲、就是在dom-diff之前会维护一个老节点的 key-index 的一个映射表、这个映射表是dom-diff优化过程的关键、
• 框架会通过新节点的key去这个映射表中找到对应的index、进行代码复用、
• 如果使用了index作为key、会导致新老节点的key是一样的、破坏了代码复用的这个考虑、让本来可以复用的节点变成了：
• 删除老节点、创建新节点这样的耗费性能的操作、
• 注意：最好使用数据中的某个具有唯一性的值作为key、比如item.id等

vue2:dom diff的过程
第一步：会在新的vnode和旧的vnode中添加开始指针和结束指针
第二步：会比较新的vnode和旧的vnode的开始节点是否相同
第三步：比较新的vnode和旧的vnode的结束节点是否相同
第四步：比较新的vnode的开始节点和旧的vnode的结束节点是否相同
第五步：比较新的vnode的结束节点和旧的vnode的开始节点是否相同
第六步：会在旧的vnode中查找是否有相同的节点
第七部：如果没有相同的节点，那么会在旧的vnode开始指针前插入一个新的节点
第八步：移动指针，继续比较，重复第二到第七的步骤
第九步：当找到相同的节点后，会进行递归，对子节点一层一层进行更细致的比较




vue3：dom diff的过程
- 新旧节点会从前往后比较，遇到相同的节点就进行patch，遇到不同的节点停止比较；
- 从后往前比较，相同节点进行patch，不同节点则停止进行比较
- 如何旧节点的比较完了，新节点中还有剩余的节点没进行比较，那么这些节点都是新节点，执行mount
- 如果新节点比较完了，旧节点中还有剩余的节点没进行比较，那么这些节点会被删除，执行unmount
- 如果新旧节点都还有节点没进行比较，首先找出需要删除的节点，进行unmount
- 然后找出新旧节点对应的关系，利用最长递增序列优化节点的新增和移动，这是
vue3diff的核心
所谓的最长增长子序列问题是指在一个给定的数值序列中，找到一个子序列，这个子序列元素的数值依次增长，并使这个最长子序列的长度尽可能地大。因为最后要呈现出来的顺序是新节点的顺序，移动是只要老节点移动，所以只要老节点保持最长顺序不变，通过移动、插入个别节点，就能够快速的构建出新的dom



vue2与vue3diff的比较
vue2中遍历新数据都会去旧的数据查找都是在循环的最后面，也就是说每次循环都会进行相关比较。
而vue3利用最长递增子序列优化了这一问题，直接找到需要移动的指针进行操作就行，
首尾的比较是为了对应节点移动的情况，通过最长递增子序列直接找到需要移动的节点，其余的就不需要在移动了

react-diff: 
react的diff是从reconcile开始的，首次渲染的时候current（当前视图对应的fiber tree）为null，调用mountChildFibers创建子节点的Fiber实例，如果不是首次渲染
就调用reconcileChildFibers去做diff，得出effect list。react使用了双缓存机制，
的算法，是层次遍历，算法是建立在节点的出插入、删除、移动等操作，都是在节点数的同一级中进行。构建diff
的过程中新的children有四种情况，如果是对象，直接调用reconcileSinglleElment进行递归的展平，删除节点时暂时不会真正被删除，只是
添加一个tag，在commit阶段删除。如果是文本节点，那么代表这个节点可以复用。第三种情况是找到key相同的节点
复用节点，如果没找到就把这个节点删除。最后就是把所有老数组元素按key或者index放map里，然后遍历新数组。
根据新数组的key或者index快速找到老数组里面是否有可复用的，所以key是给每一个vnode的唯一id,可以依靠key,更准确, 更快的拿到oldVnode中对应的vnode节点，高效和准确的更新节点

