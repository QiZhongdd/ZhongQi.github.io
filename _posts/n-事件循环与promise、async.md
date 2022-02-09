**浏览器中的事件循环**

简单的说event loop就是调用栈不断的从消息队列和任务队列读取并执行任务的过程。
渲染进程只有一个主线程用来执行js任务和ui的渲染，要让这些任务顺利执行就需要有一个统一的机制就是事件循环与消息队列。假如没有事件循环，线程在执行任务期间有新的任务添加进来，线程是没有办法执行新添加的任务，所以引入了事件循环，循环一次结束后判断有没有新的任务。而传入的新任务就需要由消息队列去从其他线程进行接受。如果在执行消息队列的任务时有优先级较高的任务，那么会将优先级较高的任务添加到任务队列，待执行完当前消息队列的任务会优先执行任务队列的任务再去执行其他消息队列中的任务。消息队列中的任务对应的就是宏任务，任务队列对应的就是微任务。宏任务有 渲染事件（如解析 DOM、计算布局、绘制）、用户的交互、setTimeOut、JavaScript 脚本执行事件、网路请求完成、文件对的读写，微任务有promise、mutaionobserver。宏任务相比微任务，宏任务的时间粒度比较大，执行时间不能精确控制，对一些高实时性的任务就不能满足了，比如监听dom的变化，mutationobserver利用的就是异步+微任务的原理。同时在同一个宏任务中，创建的微任务的执行优先级是高于微任务的。


node中的eventloop:
node执行过程：v8引擎解析js、解析后的代码调用胶水代码，然后传递给libuv交给不同的线程执行执行，形成一个evetloop，以异步的形式将执行结果返回给v8。，v8引擎将结果返回给用户。
libuv中的事件循环有以下阶段：
- updateTime:获取以下系统时间，以保证之后的timer有记时的标的，避免过多的系统调用影响性能
- timers:检查是否有timers，执行到期的的timer类似setTimeout和setInterval
- IO/CALLBACK:执行到期I/O事件的回调，比如网络i/o，文件i/o。
- idle/prepare：这个阶段会处理一下内部的操作，如果节点处理为active状态，每次事件循环都会执行
- IO/poll阶段同时调用各平台提供的i/o多路复用接口，执行IO的回调，轮询队列中的事件，如果poll队列不为空，那么会同步执行队列中的任务，知道队列为空，如果poll队列为空·，有setImmediate直接进入check阶段。没有就等到callback添加到队列然后执行。当然如果有到期的timer那么会执行到期的timer
- check阶段：执行setImmediate
- close/callback,关闭I/O的操作，比如文件描述符的关闭、连接断开等


在 node11 之前，因为每一个事件循环阶段完成后都会去检查 nextTick 队列，如果里面有任务，会让这部分任务优先于微任务执行。

在 node11 之后，process.nextTick 被视为是微任务的一种.



node执行顺序:process.nextTick->promise.then->宏任列->setImmediate，node11以后执行顺序跟浏览器一样。



**async/await**

async/await是generator的语法糖，它的运行机制与generator相似。运行机制依靠的是协程任务的切换，协程是比线程更轻量的存在，可以理解为跑在线程上的任务。一个线程可以有多个携程，但只能运行一个携程。

yideng是父携程，遇到async会创建子携程，这个时候会保存父携程a的调用站信息。遇到await会退出子携程。这个时候会将控制权交给父携程。await是异步的所以会先执行++a。但awiait执行完毕后有会讲控制权交给子携程。但是之前的引擎已经保留了主协程的调用栈信息，调用栈里面a的值不会发生变化。所以会打印出10.

```
let a = 0; 
let yideng = async () => { 
a = a + await 10; 
console.log(a) // 10
} 
yideng(); 
console.log(++a);// 1

```

**实现一个async/await**

```
function Request(){
  return new Promise((resolve,reject)=>{
    setTimeout(function(){
      resolve(2)
    },2000)
  })
}

function* gen(){
  const res1=yield Request()
  console.log(res1)
  const res2=yield Request();
  console.log(res2)
}

function co(generator){
  return new Promise(function(resolve){
    const gen=generator();
    function onFulfilled(res){
      const {done,value:promise}=gen.next(res);
      if(done)resolve()
      promise&&promise.then(onFulfilled)
    }
    onFulfilled()
  })
}
co(gen)

```


**实现一个promise.finally**

```
Promise.prototype.finally=function(cb){
 const p=this.constructor;
 return this.then(
   value=>p.then(cb()).then(()=>value),
   err=>p.then(cb()).then(()=>throw err)
 )
}

```

**实现一个promise.all**

```
Promise.prototype.all = function(promises) {
  let results = [];
  let promiseCount = 0;
  let promisesLength = promises.length;
  return new Promise(function(resolve, reject) {
    for (let val of promises) {
      Promise.resolve(val).then(function(res) {
        promiseCount++;
        results[i] = res;
        // 当所有函数都正确执行了，resolve输出所有返回结果。
        if (promiseCount === promisesLength) {
          return resolve(results);
        }
      }, function(err) {
        return reject(err);
      });
    }
  });
};

```

**实现一个allsetled**

```
function allSettled(promises) {
  if (promises.length === 0) return Promise.resolve([])
  
  
  return new Promise((resolve, reject) => {
    const result = []
    let unSettledPromiseCount = _promises.length
    
    _promises.forEach((promise, index) => {
      Promise.resolve(promise).then((value) => {
        result[index] = {
          status: 'fulfilled',
          value
        }
        
        unSettledPromiseCount -= 1
        // resolve after all are settled
        if (unSettledPromiseCount === 0) {
          resolve(result)
        }
      }, (reason) => {
        result[index] = {
          status: 'rejected',
          reason
        }
        
        unSettledPromiseCount -= 1
        // resolve after all are settled
        if (unSettledPromiseCount === 0) {
          resolve(result)
        }
      })
    })
  })
}

```

**实现一个promise**

```
const stateArr = ['pending', 'fulfilled', 'rejected']; // 三种状态
class MyPromise {
    constructor(callback) {
        this.state = stateArr[0]; // 当前状态
        this.value = null; // 完成时的返回值
        this.reason = null; // 失败原因
        this.resolveArr = [];
        this.rejectArr = [];
        
        callback(this.resolve, this.reject); // 调用此function
    }
    
    // callback中执行的resolve方法
    resolve = (value) => {
        setTimeout(()=> { // 异步执行所有的回调函数
        // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
                this.state = stateArr[1]; // 更新状态为 fulfilled
                this.value = value; // 写入最终的返回值
               
                this.resolveArr.forEach(fun => fun(value)) // 循环执行then已插入的resolve方法
            }
        })
    }
    
    // callback中执行的reject方法
    reject = (reason) => {
     setTimeout(()=> { 
        // 判断状态是否需要是pending
            if (this.state === stateArr[0]) {
               this.state = stateArr[1]; // 更新状态为 fulfilled
               this.reason = reason; // 写入最终的返回值
               
               this.rejectArr.forEach(fun => fun(reason)) // 循环执行then已插入的reject方法
            }
     })
    }
    
    // then方法
    then = (onFulilled, onRejected) => {
        // 判断onFulilled 和 onRejected是否是一个函数，如果不是函数则忽略它
        onFulilled = typeof onFulilled === 'function' ? onFulilled : (value) => value;
        onRejected = typeof onRejected === 'function' ? onRejected : (reason) => reason;

        // 如果状态为pending
        if (this.state === stateArr[0]) {
            return new MyPromise((resolve, reject) => {
                // 插入成功时调用的函数
                this.resolveArr.push((value) => {
                    try {
                        const result = onFulilled(value);
                        if (result instanceof MyPromise) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch(err) {
                        reject(err);
                    }
                })
                
                // 插入失败时调用的函数
                this.rejectArr.push((value) => {
                    try {
                        const result = onRejected(value);
                        if (result instanceof MyPromise) {
                            result.then(resolve, reject);
                        } else {
                            resolve(result);
                        }
                    } catch(err) {
                        reject(err)
                    }
                })
            })
            
        }
        
        // 如果状态是fulfilled
        if (this.state === stateArr[1]) {
            // then返回的必须是一个promise
            return new MyPromise((resolve, reject) => {
                try {
                    const result = onFulilled(this.value); // 执行传入的onFulilled方法
                    
                    // 如果onFulilled返回的是一个Promise,则调用then方法
                    if (result instanceof MyPromise) {
                        result.then(resolve, reject);
                    } else {
                        resolve(result);
                    }
                } catch(err) {
                    reject(err);
                }
            })
        }
        
        // 如果状态是rejected
        if (this.state === stateArr[2]) {
            // then返回的必须是一个promise
            return new MyPromise((resolve, reject) => {
                try {
                    const result = onRejected(this.reason); // 执行传入的onRejected方法
                    
                    // 如果onRejected返回的是一个Promise,则调用then方法
                    if (result instanceof MyPromise) {
                        result.then(resolve, reject);
                    } else {
                        resolve(result);
                    }
                } catch(err) {
                    reject(err);
                }
            })
        }
    }
}


```


```
4,1,3,6,8,2,7,5
async function async1() {
    console.log('1');
    await async2();
    console.log('2');
  }
  async function async2() {
    console.log('3');
  }
  console.log('4');
  setTimeout(function () {
    console.log('5');
  }, 0)
  async1();
  new Promise(function (resolve) {
    console.log('6');
    resolve();
  }).then(function () {
    console.log('7');
  });
  console.log('8') 

```

Array.prototype.call=function(context,...args){
  const fn=symbol();
  context[fn]=this;
  const res=context[fn](...args);

  context.delete(fn);
  return res;
}

