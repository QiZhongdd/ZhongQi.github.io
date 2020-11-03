---
layout: post
title: React Hook的使用总结
subtitle: React Hook的使用总结
date: 2020-08-22
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - react
---

# Hook 的简介

Hook 是 React 16.8 中的新增功能。可以无需编写类即可使用状态和其他 React 功能。
**Hook 的使用规则**

- 要在顶层使用，不要在循环，条件或嵌套函数中调用 Hook。
- 不能再 class 组件中使用挂钩

# 相关的 Hook

**useState**

- useState 用来存储状态，类似于 class 中对的 state
- count 表示状态名称
- setCount 表示设置状态的函数
- useState(0)，创建 state,并且将 count 的初始值为 0。

```
 1:  import React, { useState } from 'react';
 2:
 3:  function Example() {
 4:    const [count, setCount] = useState(0);
 5:
 6:    return (
 7:      <div>
 8:        <p>You clicked {count} times</p>
 9:        <button onClick={() => setCount(count + 1)}>
10:         Click me
11:        </button>
12:      </div>
13:    );
14:  }
```

**useEffect**
使用该 Hook，您可以执行的功能组件的副作用。它综合了 componentDidMount、componentDidUpdate、componenetWillUnmount 的功能

```
import React, { useState, useEffect } from 'react';

function Example() {
  const [count, setCount] = useState(0);

  //初始化和更新都会执行，综合了componentDidMount、componentDidUpdate
  useEffect(() => {
    document.title = `You clicked ${count} times`;
  });

  //只有初始化的时候才会执行，类似于componentDidMount
  useEffect(() => {
    document.title = `You clicked ${count} times`;
  },[]);

  //只有count改变了才会执行，类似于componentDidUpdate
  useEffect(() => {
    document.title = `You clicked ${count} times`;
  },[count]);

  //在useEffect中用return返回一个函数，返回的函数会在即将卸载组件的时候使用，类似于componentWillUnmount
   useEffect(()=>{
        return ()=>{
            console.log('componentWillUnmount')
        }
    })
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}
```

**useContext**

- useContext 用来接收上下文对象，主要用在隔代传值
- 要与 createContext.Provider 配合使用

```
import React, { useContext } from "react";
const themes = {
  light: {
    foreground: "blue",
    background: "red",
  },
  dark: {
    foreground: "green",
    background: "yellow",
  },
};

const ThemeContext = React.createContext();

export default function App() {
  return (
    <ThemeContext.Provider value={themes.dark}>
      <Toolbar />
    </ThemeContext.Provider>
  );
}

function Toolbar(props) {
  return (
    <div>
      <ThemedButton />
    </div>
  );
}

function ThemedButton() {
  const theme = useContext(ThemeContext);
  return (
    <button style={{ background: theme.background, color: theme.foreground }}>
      I am styled by theme context!
    </button>
  );
}


```

**useMemo**
返回一个记忆值,传递“创建”函数和一系列依赖项。useMemo 仅在其中一个依赖项已更改时才重新计算存储的值。此优化有助于避免对每个渲染进行昂贵的计算

- useMemo 跟 React.Memo 功能一样，类似于生命周期的 shouldComponentUpdate
- useMemo 只用当 a 或者 b 的值变化时才会再次执行，更新 memoizedValue

```
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

**useCallback**
useCallback 类似于 useMemo，不过 useCallback 返回的是一个回调,仅在其中一个依赖项已更改时才更改。当将回调传递给依赖于引用相等性的优化子组件以防止不必要的渲染

- useCallback(fn, deps)等价于 useMemo(() => fn, deps)。

```
const memoizedCallback = useCallback(
  () => {
    doSomething(a, b);
  },
  [a, b],
);
```

**useReducer**
useReducer 实现了类似 redux 的功能


```
const initialState = {count: 0};

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {count: state.count + 1};
    case 'decrement':
      return {count: state.count - 1};
    default:
      throw new Error();
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <>
      Count: {state.count}
      <button onClick={() => dispatch({type: 'decrement'})}>-</button>
      <button onClick={() => dispatch({type: 'increment'})}>+</button>
    </>
  );
}
```

**useRef**
useRef 返回一个可变的 ref 对象，我们最常用的就是用 ref 获取对象进行操作。

```
function TextInputWithFocusButton() {
  const inputEl = useRef(null);
  const onButtonClick = () => {
    // `current` points to the mounted text input element
    inputEl.current.focus();
  };
  return (
    <>
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
```

**useImperativeHandle**

- useImperativeHandle 的作用是，在 hook 中实现父组件调用子组件中的函数或方法。

- 要搭配 React.forwardRef 将子组件包裹

```
import React, { useImperativeHandle, useState, useRef } from "react";

function FancyInput(props, ref) {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current.focus();
    },
  }));
  return <input ref={inputRef} />;
}
FancyInput = React.forwardRef(FancyInput);

export default function Father(props) {
  const ref = useRef();
  const [childA, setChildA] = useState();
  const handleGetA = () => {
    console.log(ref.current);
    setChildA(ref.current);
  };

  return (
    <div>
      <FancyInput ref={ref} />
      <button onClick={handleGetA}>获取子组件a的值：{childA}</button>
    </div>
  );
}

```

# 建立自己的 Hook

我们可以建立自己的 Hook,在自己的 Hook 中可以使用其他 Hook。建立了自己的 Hook 就可以供所有的函数组件使用，实现类似高阶组件的功能，可以共享逻辑。

- 建立自己的 Hook 必须以“ use” 开头命名自定义 Hook
- 使用相同的 Hook 的两个组件的状态不会共享

```
import { useState, useEffect } from 'react';

function useFriendStatus(friendID) {
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    function handleStatusChange(status) {
      setIsOnline(status.isOnline);
    }

    ChatAPI.subscribeToFriendStatus(friendID, handleStatusChange);
    return () => {
      ChatAPI.unsubscribeFromFriendStatus(friendID, handleStatusChange);
    };
  });

  return isOnline;
}

function FriendListItem(props) {
  const isOnline = useFriendStatus(props.friend.id);

  return (
    <li style={{ color: isOnline ? 'green' : 'black' }}>
      {props.friend.name}
    </li>
  );
}
```
