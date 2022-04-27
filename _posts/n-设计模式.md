
**策略**
js的策略模式：策略模式的目的就是将算法的使用与算法的实现分离开来。策略模式包含策略类和环境类，策略类由具体的算法实现，环境类将请求委托给策略类。使用策略模式的具体场景：多个if/else 、表单的验证

```
   var strategies = {
      isNonEmpty: function (value, errorMsg) { // 不为空
        if (value === '') {
          return errorMsg;
        }
      },
      minLength: function (value, length, errorMsg) { // 限制最小长度
        if (value.length < length) {
          return errorMsg;
        }
      },
      isMobile: function (value, errorMsg) { // 手机号码格式
        if (!/(^1[3|5|8][0-9]{9}$)/.test(value)) {
          return errorMsg;
        }
      }
    };
```
**单例**
单例模式：单例模式是一种常用的模式，有一些对象我们往往只需要一个比如线程池、全局缓存、浏 览器中的 window 对象等。单例模式应用比较广泛，例如当我们单击登录按钮的时候，页面中会出现一个登录浮窗，而这个登录浮窗是唯一的，无论单击多少 次登录按钮，这个浮窗都只会被创建一次，那么这个登录浮窗就适合用单例模式来创建。

- 饿汉模式在类加载的时候就对实例进行创建，实例在整个程序周期都存在。它的好处是只在类加载的时候创建一次实例，不会存在多个线程创建多个实例的情况，避免了多线程同步的问题。它的缺点也很明显，即使这个单例没有用到也会被创建，而且在类加载之后就被创建，内存就被浪费了。这种实现方式适合单例占用内存比较小，在初始化时就会被用到的情况。但是，如果单例占用的内存比较大，或单例只是在某个特定场景下才会用到，使用饿汉模式就不合适了，这时候就需要用到懒汉模式进行延迟加载。

- 懒汉模式中单例是在需要的时候才去创建的，如果单例已经创建，再次调用获取接口将不会重新创建新的对象，而是直接返回之前创建的对象。适用于：如果某个单例使用的次数少，并且创建单例消耗的资源较多，那么就需要实现单例的按需创建，这个时候使用懒汉模式就是一个不错的选择。
缺点：但是这里的懒汉模式并没有考虑线程安全问题，在多个线程可能会并发调用它的getInstance()方法，导致创建多个实例，因此需要加锁解决线程同步问题

```
var singleIntance=function (name){
    this.name=name;
}
// 懒汉模式
singleIntance.getSingleIntance=function(name){
    var instance=null;
    return function(){
        if(!instance){
            instance=new singleIntance()
        }
        return instance;
    }
}
```

代理模式：为其他对象提供一种代理以控制对这个对象的访问。

```
let agent = new Proxy(star, {
    get: function (target, key) {
        if (key === 'phone') {
            // 返回经纪人自己的手机号
            return '18611112222'
        }
        if (key === 'price') {
            // 明星不报价，经纪人报价
            return 120000
        }
        return target[key]
    },
    set: function (target, key, val) {
        if (key === 'customPrice') {
            if (val < 100000) {
                // 最低 10w
                throw new Error('价格太低')
            } else {
                target[key] = val
                return true
            }
        }
    }
})
```

**职责链**
职责链模式：所谓的职责链模式是使多个对象处理一个请求，从而避免请求的发送者和接受者之间的耦合关系。将这些对象形成一个链，并沿着这条链传递该请求，直到有一个对象处理它位置。

```
const callbackList=[];
let i=0;
let pushCallback=(fn)=>{
    callbackList.push(fn)
}
let next=()=>{
    i++;
    callbackList[i]&&callbackList[i]()
}
pushCallback(()=>{
    console.log(1)
    next()
})
pushCallback((=>{
    console.log(2)
}))
callbackList[0]()

```

**工厂**
工厂模式：工厂模式是指不对外暴露创建对象的逻辑，通过使用一个共同的接口来指向新创建的对象。

```

```

**发布订阅**

发布订阅模式：定义一对多的关系，多个对象同时监听一个主题对象，当主题对象发生变化后，监听对象及时更新。

class Event{
    constructor(){
        this.clienList={}
    }
    addListner(key,fn){
        if(!this.clientList[key]){
            this.clientList[key]=[]
        }
        this.clientList[key].push(fn)
    }
    trigger(){
        var key=[].shift.call(arguments),/
        let fns=this.clienList[key]
        if(!fns||!fns.length){
            return 
        }
        fns.forEach(fn=>{
            fn.apply(this,arguments)
        })
    }
}

**IOC**

开始之前，先简单了解一下 DI 和 IOC 的概念,如果对依赖注入不够了解可以自行查阅下相关的资料。

- DI 全称 Dependency Injection，依赖注入是 IOC 的具体实现。主要是借助“第三方容器”实现具有依赖关系的对象之间的解耦。
- IOC 全称 Inversion Of Control，控制反转是面向对象编程的一种设计思想，主要用来降低代码之间的耦合度。

# SOLOD
SOLID是指单一功能原则、开闭原则、里式替换原则、接口隔离、依赖反转。
- 单一功能原则（s）：是指一个类只做一个类型的责任。当这个类型需要承担其他类型的责任时，就需要分解这个类。常见的方法是一个大类去去管理多个小类。比如USER类分别去管理注册用户类、登录类等
- 开闭原则（O):所谓的开闭原则是指类或者接口的功能可以扩展，但不能去修改。
- 里式替换原则（L）：所谓的里式替换原则就是子类可以替换他们的基类。大白话就是子类替代父类，代码一样能正常运行
- 接口隔离原则（I）：不能强迫用户去依赖那些他们不使用的接口，所以使用多个专门的接口总是要好于使用单一的总接口
- 依赖反转（D）：高层模块不能依赖于底层模块，二者都应该依赖于抽象，抽象接口不能依赖于具体的实现。而具体的实现应该依赖于抽象接口