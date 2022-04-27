# 度小满1面

**继承的几种方式的优缺点**
- 原型链继承-》缺点没有办法传给父类传参，多个实例会公用一个父类
- 构造函数继承。这种方式值继承了父类的属性，没有继承原型的属性，
- 组合继承，将上面的一起组合，但实例化了两次父类
- 原型继承：跟原型链继承一样，不同的是会在内部创建一个函数然后继承
- 寄生继承：利用Objec.create去创造一个对象返回函数。缺点跟父类一样
- 寄生组合继承，最完美的继承，同时远行链也会保持一致
```
function parent(){
  this.name=name
}

function child(){
  parent.apply(this)
}

chile.prototype=Object.create(parent,{
  constructor:{
    value:parent
  }
})


function extend(subClass,superClass){
  if(typeof superClass=='function' || typeof superClass!=='null){
    throw new error('error')
  }
  subClass.prototype=Object.create(superClass.prototype,{
    constructor:{
      value: subClass,
     enumerable: false,
     writable:true,
     configurable: true
    }
  })
  // 子类继承父类的静态属性方法
  superClass&&Object.setPrototypeOf(subClass,superClass);
} 

```
**面向对象的了解**

特性封装、继承、多态遵循SOLID是指单一功能原则、开闭原则、里式替换原则、接口隔离、依赖反转。
- 单一功能原则（s）：是指一个类只做一个类型的责任。当这个类型需要承担其他类型的责任时，就需要分解这个类。常见的方法是一个大类去去管理多个小类。比如USER类分别去管理注册用户类、登录类等
-  开闭原则（O):所谓的开闭原则是指类或者接口的功能可以扩展，但不能去修改。
-  里式替换原则（L）：所谓的里式替换原则就是子类可以替换他们的基类。大白话就是子类替代父类，代码一样能正常运行
- 接口隔离原则（I）：不能强迫用户去依赖那些他们不使用的接口，所以使用多个专门的接口总是要好于使用单一的总接口
- 依赖反转（D）：高层模块不能依赖于底层模块，二者都应该依赖于抽象，抽象接口不能依赖于具体的实现。而具体的实现应该依赖于抽象接口


// 深拷贝，考虑递归

```

function isObject(obj){
 return (typeof obj === "object" || typeof obj === "function") && obj !== null;
}

function deepClone(source,hash=new WeakMap()){
  if(hash.has(source)){
    return hash.get(source)
  }
  const target=Array.isArray(source)?[]:{}
  hash.set(source,target)
  for(let key in source){
    if(Object.prototype.hasOwnProperty.call(source,key)){
      if(isObject(source[key])){
        target[key]=deepClone(source[key],hash)
      }else{
        target[key]=source[key]
      }
    }
  }
}

```


function Hoc(WrapperComponent){
  return class extends React.Component{
      constructor(props){
        super(props)
        this.state={
          name:''
        }
        this.onChange=this.onChange.bind(this);
      }
      onChange(e){

      }
     render(){
       const newProps={
         name:{
           value:this.state.name,
           handler:this.onchange
         }
       }
       return <>
          <WrapperComponent {...props} {...newProps}></WrapperComponent>
       </>
     }
  }
}


function isPrimitive=(val:any)=>val!==Object(val)

import {isEqual} from 'react-fast-compare';

function useDeepCompareEffect(effect,deps){
  const ref=useRef();
  if(!isEqual(ref.current,deps)){
    ref.current=deps;
  }
  useEffect(effect,ref.current)
}



这个框架的 API 设计是从 Ractive 那边传承过来的（自然跟 Vue 也非常像），但这不是重点。Svelte 的核心思想在于『通过静态编译减少框架运行时的代码量』。举例来说，当前的框架无论是 React Angular 还是 Vue，不管你怎么编译，使用的时候必然需要『引入』框架本身，也就是所谓的运行时 (runtime)。但是用 Svelte 就不一样，一个 Svelte 组件编译了以后，所有需要的运行时代码都包含在里面了，除了引入这个组件本身，你不需要再额外引入一个所谓的框架运行时！