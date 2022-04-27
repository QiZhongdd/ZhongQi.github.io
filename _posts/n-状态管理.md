
**mobx的了解**
mobx是一个状态管理库，跟redux不同，它更加的简单且扩展性强，推崇任何源自应用状态的东西都可以自动的获得。它的核心原理是通过action触发state的变化，进而更新state的衍生对象computed和reaction。mobx有以下几个概念。
- ObservableState:可观察的状态，存放应用数据，Observer是递归引用的，如果是对象和数组也是可观察的
- Computed values：计算值在相关的state数据发生变化时自动更新值
- reaction跟计算值很像，但它不是一个新的值，而是会产生副作用，比如打印、网络请求、更新组件树等
- actions:用来修改状态
  
像后来出现mobx-react-lite是第一个用于react-hook的状态管理，我们如果使用mobx-react-lite通常是根mobx-react-tree使用，但他们没流行起来主要有两个原因吧，第一个是使用了闭包，如果管理不规范可能会造成内存泄漏。第二是他使用了generator去把控状态的过渡，generator会有性能的问题。
  

**redux**
redux的数据都会存放在store中，必须通过指定的流才能去修改，首先view会通过派发action，reducer收到action后会根据不同state进行替换，然后通知相关的订阅，订阅收到通知后触发相关的事件。同时redux还提供了以下属性，在平时的开发中我们会根据模块定义多个reducer，可以利用combineReucer将多个reducer组合成一个。middleware，可以监听redux的状态或者对dispatch进行劫持，常见的有redux-saga、redux-thunk。middleware是根据组合函数将多个middleware组合在一起的。


**recoil**
recoil也是一个状态管理工具吧，他只能用于react。采用分散管理原子状态的设计模式。 提出了一个新的状态管理单位 Atom，为了能够监听到状态的变化，使用了观察者模式。当一个 Atom 被更新时，每个被订阅的组件都会用新的值来重新渲染，重新渲染主要是通过在对应hook通过updateState({})来强制刷新state，从而触发rerender，更新试图。同时他有相对应的缓存机制，只要依赖不发生改变那么就不会去重新计算相关的值。虽然Recoil宣称的高性能原子式状态管理非常诱人，但不能忽视的是Reocil本身设计相当复杂，为了适用于更复杂的大型场景，Recoil拥有高达数十个APIs，上手成本不低。而且为了规避Context API的问题，Reocil使用了useRef API来存放状态并在内部管理状态订阅和更新，严格意义上状态也并不算在React Tree中，同样面临着外部状态的Concurrent Mode兼容性问题。但Context API这种能在React Tree中很方便地共享状态并且天然兼容未来Concurrent Mode的方案还是很香的，在意识到性能问题后React社区也提出[useContextSelecotr]

**jotai**

jotai是一个清量级的状态管理，集成到项目中只有2kb左右，像redux和mobx都达到了上百kb，他也是一种原子状态管理，借鉴了recoil的设计思想，既然主打的是轻量级原子式状态管理，Jotai打包体积远小于Recoil。并且核心API仅有3个：atom，Provider和useAtom
Jotai中的atom不需要Recoil中的string key，而是用的Object Reference。使用上更直观方便，但也损失了debug上直接利用string key的便利。，Jotai的atom存放在React Context中，利用use-context-selector来避免重复渲染问题。同时他也集成了immer，为操作深层次对象提供了便利。

**zustand**

也是另外一种状态管理。被称为组件外的状态。他的本质是用一个对象管理状态，他的状态是不跟react的的调度机制绑定在一起的。也是采用的观察者模式吧，当改变对应的state后，通过updateState({})去通知相关的组件强刷

**xstate**

XState也不是真正意义上的状态管理库，，但它非常有用！
XState用JavaScript实现了状态机和状态图。当很难推理出一个系统可以采取的所有不同组合和状态时，状态机是一个很好的解决方案。比如随着我们的业务和项目越来越复杂，各种各样的业务状态导致的 flag 变量的剧增：即便是自己，写多了这种变量，也很难清楚的知道每个 flag 是干什么用的。
各种判断业务状态的 if/else：if/else 嵌套地狱估计在很多大型的业务产品中都能看到吧。还有内部的各种逻辑判断，，即便问 PD，时间久了她也不知道了。还有因此可能导致一些意识不到的 Bug。通过状态模式的话可以解决这个问题，状态模式主要解决的是，当控制一个对象状态转换的条件表达式过于复杂时的情况。把状态的判断逻辑转移到表示不同状态的一系列类当中，减少相互间的依赖，可以把复杂的判断逻辑简化。用状态机可以安全的控制业务状态流程的把控，同时她不跟react和vue绑定在一起。我们可以把自己的业务封装成一个lib包，在这个包用xtate去维护业务逻辑，将业务逻辑月ui组件和业务组件节藕。lib包只要将state和数据传递给组件就行了。这样也能提高开发协作方面的效率吧，业务的同学维护lib业务包，组件开发的同学维护相对应的组件就行，他对应的状态图是一个很好的交流工具。
出状态机的四大概念。

第一个是 State ，状态。一个状态机至少要包含两个状态。例如上面自动门的例子，有 open 和 closed 两个状态。

第二个是 Event ，事件。事件就是执行某个操作的触发条件或者口令。对于自动门，“按下开门按钮”就是一个事件。

第三个是 Action ，动作。事件发生以后要执行动作。例如事件是“按开门按钮”，动作是“开门”。编程的时候，一个 Action 一般就对应一个函数。

第四个是 Transition ，变换。也就是从一个状态变化为另一个状态。例如“开门过程”就是一个变换。


但他也有一些问题，需要学习新的东西，状态机是一种范式的转化，且容易有抵触心里，不愿意走出舒适圈。新的格式、新的重构技术、新的调试工具、部分人觉得可视化这种东西，没什么用。虽然大多数人听过状态机，但实际的编程中离它遥远，所以并不熟悉它。编程方式的转换，很多人需要弄清楚原来的代码，现在该如何去写，如何映射。必须有人基于这种模式实践过，对它非常了解才可以。如果从来没用过它，使用这种模式会无从下手。


xstate与redux的对比

- 定位：redux只是一个数据状态的管理，解决的事组件间的通行问题，xstate关注的状态驱动，当然也可以解决组件的通信问题，比较抽象吧，更多的是行为的解释吧。
- redux维护状态的变量事随意的，可以随便更改。xstate的状态是有限的，状态直接的流转是固定的，相当于只能从一个状态流转到另一个状态。
  
- 代码组织上，redux的业务逻辑需要自行组织且分布在不同的地方，当组件的状态变多的时候状态管理和行为逻辑的代码往往会变得混乱，难于维护；而xstate的话可以自己维护，仍然具有较好的逻辑性，且便于扩展和维护；

**Concurrent Mode支持**
外部状态方案在React的Concurrent Mode（并发模式）中会存在兼容性问题就是指的tearing （撕裂），即在同一次渲染中状态不一致。因为在Concurrent Mode中，同一次render过程不像是过去那样是阻塞性的，而是可以被中断和恢复的。在同一层级下，如果一个child组件在render时读取了一个外部状态，而一个新的事件中断render并更新了这个状态，那么后续的child组件开始render时读取到的就是不一样的状态。关于tearing的更多细节可以看React 18的这个讨论。在React 18发布计划公布以后，React官方发了一篇公告来说明Concurrent Mode对第三方库的影响和修改建议。其中提到三个避免tearing的方式和阶段：

Level 1: 检测到外部状态不一致就让React进行re-render（use-subscription）。该方法还是可能会有短暂的UI不一致（首次render），而且下一次的re-render会是同步的从而享受不到Concurrent Mode带来的性能和体验提升。
Level 2: render时检测到外部状态不一致就让中断该render并进行re-render（useMutableSource 提案）。该方法好处是完全不会像Level 1那样出现tearing现象，但因为中断并重新调度了re-render，性能还是不如纯Concurrent Mode。
Level 3: 使用React内置的状态（state和context），或者外部状态在状态突变时有一个immutable的数据引用snapshots（还处于实验性质）。该方法始终render一致的UI，不会出现tearing，同时享受到Concurrent Mode的全部特性。
因为useMutableSource仍处于提案状态，还没有正式推出，所以大部分用到外部状态的状态管理库都或多或少有tearing。Jotai目前是处于第一阶段，但其实已经用到了部分useMutableSource的特性，所以作者也表示只要React正式推出该API，Jotai就能到达第二阶段。等第三阶段的那个实验性方法通过后，理论上在Jotai的API中加入immutable限制也能够完美兼容Concurrent Mode。
