---
layout: post
title: redux的源码解读
subtitle: redux的源码解读
date: 2020-08-22
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - react
---

# 总体思路
- 利用useContext代替react-redux的Provider,将store的state传给传个相应的子组件。在子组件中可以利用useContext获取state
- 利用useReducer创建reducer，useReducer还返回了dispatch方法，通过dispatch可以更新state，state更新了Provide中的value也会发生变化，组件中的value也会发生改变

# 实现步骤

- 创建store，store的目的主要是供外部访问，并且管理state、useContext等

```
function createStore(reducer, initialState, middlewares) {
  const store = {
    _state: initialState,
    getState: () => {
      return store._state;
    }
  };

  return {
    store
  };
}

```

- 利用createContext创建Proivder，并在store中添加useContext

```
import React from 'react';
const { useContext, createContext, useReducer } = React;

function createStore(reducer, initialState, middlewares) {
  const storeContext = createContext();
  const store = {
    _state: initialState,
    getState: () => {
      return store._state;
    },
    useContext:useContext
  };

  const Provider = props => {
    return <storeContext.Provider {...props} value={store._state} />;
  };

  return {
    store,
    Provider
  };
}
```
- 利用useReducer创建reducer，并获取到dispatch和state，同时将dispatch提供给store，供外部改变状态。

```
function createStore(reducer, initialState, middlewares) {
  const storeContext = createContext();

  const store = {
    _state: initialState,
    getState: () => {
      return store._state;
    },
    useContext: () => {
      return useContext(storeContext);
    },
    dispatch: undefined
  };

  const Provider = props => {
    const [state, dispatch] = useReducer(reducer, store._state);

    // 实现异步操作，可以 dispatch 一个 function
    store.dispatch = async action => {
      if (typeof action === 'function') {
        await action(dispatch, state);
      } else {
        dispatch(action);
      }
    };

    // 重置 store 中的数据
    store._state = state;

    return <storeContext.Provider {...props} value={state} />;
  };

  return {
    Provider,
    store
  };
}

```

- 利用符合函数对中间件进行处理，这跟redux实现的方式一样

```

import React from 'react';
const { useContext, createContext, useReducer } = React;

//middleWare的格式store=>next=>action=>{}
function createStore(initState={},reducer,middleWares){
    const context=createContext();
    const store={
        _state:initState,
        dispatch:undefined,
        getState:()=>store.state,
        useContext:useContext(context)
    }
    function compose(...fns){
        if(fns.length===0)return args=>args;
        if(fns.length===1)return fns[0];
        const fn=fns.reduce((a,b)=>(...args)=>a(b(...args)));
        return fn
    }
    

    const Provider=(props)=>{
        const [state,dispatch]=useReducer(reducer,store.state);
        store.dispatch=action=>{

            if(typeof action==='function'){
                await action(dispatch,state)
            }else{
               dispatch(action);
            }
        }
        store._state = state;
        const chain=middlewares.map(item=>item(store));
        store.dispatch=compose(chain)(store.dispatch)
       return  <context.Provider {...props} value={state}>
            
        </context.Provider>
    }
    return {store,Provider}
}

```