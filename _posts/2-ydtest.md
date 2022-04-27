- 下面代码会出现什么问题，怎么解决。

一直re-render，死循环，原因是那个所谓的全局索引和不可变，setState时候需要去render组件。

使用setTimeOut。setTimeout可以状态逃离(逃离批处理)，逃离了状态管理树。

// 使用zustand，zustand 是组件外的状态，脱离了react的状态管理。当state发生变化后，通过updateState({})(强更新)更新一下，重新渲染。

// immer的话可以re-render的话可以比较前后的状态值，如果值相同的话不会重新setState.

```

const x=()=>{
  const [num,setNum]=useState(Math.random())
  setNum(1);

  // 下面的两个setTimeOut的两个批处理会交替执行。
  setTimeout(()=>{
    setNum(2)
  },0)
  setTimeout(()=>{
    setNum(2)
  },0)
  return <h1>{num}</h1>
}

```

- react hook 无法在条件或者函数嵌套中使用，请实现技术方案解决。



- 熟悉的状态管理



- react 的性能优化，项目中取得收益有哪些。




