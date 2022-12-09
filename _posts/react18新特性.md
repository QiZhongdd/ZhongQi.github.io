# react 生成 jsx 的新方式

原来是用 react.createElement,18 使用 react/jsx-runtime 生成的体积更小。
https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html

tearing
https://github.com/reactwg/react-18/discussions/69
https://github.com/reactwg/react-18/discussions/70 (撕裂只会影响外部的状态库，也就是不会影响 useState)

# react17 lans 和 react 18 的 transition

举个常见的例子，一个文本框输入，没输入一次改变 state，重新渲染视图，在 react 17 和 16 之前 中这种每输入一次都会创建一个 fiber task，那么前面的任务的优先级会相对没有那么高，16 的时候等到过期的时候会立即执行，在 17 的时候会使用 lans 会将这些任务进行合并。而 18 的 transition 会将渲染任务往后排，不要影响用户的输入，但这会带来所谓的撕裂问题(tearing)，比如在渲染三个列表时，当渲染完第二个后在文本狂输入会打断第三个的渲染，这时第一、第二个的列表跟第三个的 state 就会不一样，造成撕裂...。解决撕裂的方式是当不在输入空闲的时候，全部重新渲染一遍。Jotail 上来就 render 一次，就是为了解决这个问题，担心引入的外部状态不一致，采用双渲染机制(定义状态的时候又会渲染一次)。但 recoil 只初始化组件的时候渲染一次，但是会在使用 useRecoilState_TRANSTIION_SUPPORT_UNSTABLE 时触发下面的 setText 时渲染两次，通过这种方式解决撕裂问题。该特性在 recoil 马上发版。在 17 之前使用 useRecoilState 指会渲染一次

import {
RecoilRoot,
atom,
selector,
useRecoilState,
useRecoilState*TRANSTIION_SUPPORT_UNSTABLE as useRecoilState2,
useRecoilValue,
} from 'recoil';
// import { atom, useAtom } from 'jotai';
const textState = atom({
key: 'textState', // unique ID (with respect to other atoms/selectors)
default: '老袁 666', // default value (aka initial value)
});
export const Demo1 = () => {
// const textAtom = atom('hello');
const [txt, setTxt] = useState('测试页面');
// const text = useRecoilValue(textState);
const [text, setText] = useRecoilState(textState);
// const [uppercase] = useAtom(textAtom);
// setTxt(Math.random().toString());
console.log('页面渲染 🐻', ++c);
useEffect(() => {}, []);
return (
<>
{/* <h1>{uppercase}</h1> \_/}

<h2 onClick={(e) => setText(Math.random().toString())}>{text}</h2>
<div onClick={() => setTxt(Math.random().toString())}>{txt}</div>
</>
);
};

# other

react 的严格模式会将组件中的 console.log()打印两次，第二次是由(react developers )打印出来的，主要是为了让用户“看见”，在生产环境不会影响性能。

```
export const Demo = () => {
  // const textAtom = atom('hello');
  console.log('页面渲染🐻', ++c);
  useEffect(() => {}, []);
  return (
    <>
      <h2 onClick={(e) => setText(Math.random().toString())}>{text}</h2>
      <div onClick={() => setTxt(Math.random().toString())}>{txt}</div>
    </>
  );
};
```

## wdyr

为什么要对对 rerender 修复和意外触发的 useEffect 进行修复：执行 js 需要消耗 cpu 和内存，如何组件非常大或者代码逻辑非常复杂，就有可能触发 long task 的执行，有可能会导致内存泄漏,造成页面渲染和交互卡顿，降低用户体验。

## react-router v6

React.lazy() 在打开页面如果匹配的路由中有组件异步加载回来的时候会将 fiber 最顶级的 组件下面所有的组件都渲染一次，早成 rerender。它担心的 lazy 组件有一些状态和其他有交互，不然会出现异步组件的状态已经改了，其他没有进行重绘。但如果打开页面的路由的页面没有异步组件，切换路由去加载其他异步组件不会出现这问题，可以利用这特性进行优化，保证默认的路由是同步的。

## zustand

zustand/vanilla 用于脱离 react 执行，脱离了 react-hook 的束缚
在 react 中使用 zustand 获取对应的状态
