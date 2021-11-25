---
layout: post
title: vscode实现之EventEmitter
subtitle: vscode实现之EventEmitter
date: 2021-09-21
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - vscode
---

vscode 的 EventEmitter 实现在 src/vs/base/common/event 中，是响应式编程的一种，"响应式编程"采用了“订阅／观察者”设计模式，使订阅者可以将通知主动发送给各消费者。

# Event

Event 订阅事件，当调用了这个函数，表明监听了该函数对应的事件流。

- listener 订阅后发布动作触发的回调函数，参数为发布的数据
- thisArgs 回调函数执行时的 this
- disposables 卸载对应的监听器

```

export interface Event<T> {
	(listener: (e: T) => any, thisArgs?: any, disposables?: IDisposable[] | DisposableStore): IDisposable
}

```

# Emitter

Emitter 规定了 Event 如何进行发布，在 Emitter 中有两个重要的函数：

**get event**

get event 函数允许公众经过该函数订阅事件，它的主要任务是将相关的 listener 添加到\_listeners 中，\_listeners 是一个链表

```
get event(): Event<T> {
  ...
  const remove = this._listeners.push(!thisArgs ? listener : [listener, thisArgs])
  ...
}

```

**fire**

fire 用来发布事件，她会将 this.\_listeners 中的 listner 都拿出来执行一遍

```
	fire(event: T): void {

    ...

			for (let listener of this._listeners) {
				this._deliveryQueue.push([listener, event])
			}
			while (this._deliveryQueue.size > 0) {
				const [listener, event] = this._deliveryQueue.shift()!
        ...

        listener.call(undefined, event)
				...
			}
		}
	}

```

**EventEmitter 的使用**

首先实例化 Emitter，然后获取 event 函数后执行对相关的 lisnter 进行注册，调用 fire 执行 listner。

```
const emitter = new Emitter<void>(); // 首先实例化Emitter

const listener1 = emitter.event(() => counter1++);; // 获取event进行订阅，并注册相关的listner


emitter.fire();// 发布事件，执行对应的listener

```

# Event 的变形

在 Event 的 namespace 中还规定了有关 Event 的变形函数，丰富的事件处理能力。以下是相关的变形函数

**once**

once 用来接收一个 event，该 event 经过 once 变形以后只会派发一次。
once 执行的时候接受一个 eventA，返回另一个的 eventB,当 eventB 接受一个 listener 的时候，会将该 listener 封装传递给 eventA,作为 eventA 的 listener.

```
  // Event.once(emitter.event)(() => counter2++);
	export function once<T>(event: Event<T>/*A*/ ): Event<T> {
		return /*B*/(listener, thisArgs = null, disposables?) => {
			let didFire = false // 用来判断是否执行
			let result = event(/*A*/
				(e) => {
					 if (didFire) {
              return;// 如果已经执行，进行拦截
           }
          ...
          didFire = true;

					return listener.call(thisArgs, e) // 执行listener
				},
				null,
				disposables,
			)
			if (didFire) {
				result.dispose() // 如果执行完了对event 进行销毁
			}
			return result
		}
	}

```

**map/forEach/filter/reduce 以及 snapshot**

map 函数主要的作用是对 event 进行转换，最后订阅的是一个 EventC。EventB 只是一个中转站，它的 listener 并不会添加到 listenerLink 中。三者之间的订阅关系是 C 订阅 B，B 订阅 A，所以 B 的作用是使 C 和 A 的 listener 简历调用链

```
	export function map<I, O>(/*A*/ event: Event<I>, map: (i: I) => O): Event<O> {
		return snapshot(
			/*B*/ (listener, thisArgs = null, disposables?) =>
       // B 对 A 进行订阅，这里的listener是C中的listener
				event((i) => listener.call(thisArgs, map(i)), null, disposables),
		)
	}
 export function snapshot<T>(event: Event<T> /* B */): Event<T> {
        let listener: IDisposable;
        const emitter = new Emitter<T>({
            // C首次订阅的时候执行
            onFirstListenerAdd() {
                // C对B进行订阅
                listener = event(emitter.fire, emitter);
            },
            onLastListenerRemove() {
                listener.dispose();
            }
        });

        /* C */
        return emitter.event;
    }


```

而 forEach/filter/reduce 原理基本上都差不多
