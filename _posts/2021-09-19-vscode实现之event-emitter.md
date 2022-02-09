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

  // 将事件添加到listeners中
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

**forEach**

forEach函数接受一个event和一个'each'函数，返回另一个相同的event，并为每个元素调用'each'函数。

```
	export function forEach<I>(event: Event<I>, each: (i: I) => void): Event<I> {
		return snapshot((listener, thisArgs = null, disposables?) =>
			event(
				(i) => {
					each(i)
					listener.call(thisArgs, i)
				},
				null,
				disposables,
			),
		)
	}

```

**filter**

filter使用了函数的重载，给定一个event和一个'filter'函数，转换为如果filter返回true执行原来的event.

```
export function filter<T, U>(event: Event<T | U>, filter: (e: T | U) => e is T): Event<T>
	export function filter<T>(event: Event<T>, filter: (e: T) => boolean): Event<T>
	export function filter<T, R>(event: Event<T | R>, filter: (e: T | R) => e is R): Event<R>
	export function filter<T>(event: Event<T>, filter: (e: T) => boolean): Event<T> {
		return snapshot((listener, thisArgs = null, disposables?) =>
			event((e) => filter(e) && listener.call(thisArgs, e), null, disposables),
		)
	}

```

**reduce**

给定一个事件和一个“merge”函数，返回另一个映射每个元素的事件,以及通过“merge”函数得到的累积结果。类似于“map”.

```
export function reduce<I, O>(event: Event<I>, merge: (last: O | undefined, event: I) => O, initial?: O): Event<O> {
		let output: O | undefined = initial

		return map<I, O>(event, (e) => {
			output = merge(output, e)
			return output
		})
	}

```
**signal**

这个函数仅仅是做了一下类型转换，让订阅者忽略事件的参数

```
	export function signal<T>(event: Event<T>): Event<void> {
		return event as Event<any> as Event<void>
	}

```

**any**
any也使用了函数的重载，这个方法会在 events 中任意一个 Event 派发事件的时候派发一个事件。

```
	export function any<T>(...events: Event<T>[]): Event<T>
	export function any(...events: Event<any>[]): Event<void>
	export function any<T>(...events: Event<T>[]): Event<T> {
		return (listener, thisArgs = null, disposables?) =>
			combinedDisposable(...events.map((event) => event((e) => listener.call(thisArgs, e), null, disposables)))
	}

```

**debounce**

对 Event 链条上的事件做防抖处理。listener会对 debounce 时间内对数据做归并处理，定时器到期时就调用 emitter.fire 向下游继续发送事件。

```

	export function debounce<I, O>(
		event: Event<I>,
		merge: (last: O | undefined, event: I) => O,
		delay: number = 100,
		leading = false,
		leakWarningThreshold?: number,
	): Event<O> {
    .....................

		const emitter = new Emitter<O>({
			leakWarningThreshold,
			onFirstListenerAdd() {
				subscription = event((cur) => {
					numDebouncedCalls++
					output = merge(output, cur)

					if (leading && !handle) {
						emitter.fire(output)
						output = undefined
					}

					clearTimeout(handle)
					handle = setTimeout(() => {
						const _output = output
						output = undefined
						handle = undefined
						if (!leading || numDebouncedCalls > 1) {
							emitter.fire(_output!)
						}

						numDebouncedCalls = 0
					}, delay)
				})
			},
		  ................................
      q
		})

		return emitter.event
	}


```

**stopWatch**

一个记录耗时的 Event，当它收到第一个事件时，会把这个事件转换为它从创建到收到该事件的耗时。

```
	export function stopwatch<T>(event: Event<T>): Event<number> {
		const start = new Date().getTime()
		return map(once(event), (_) => new Date().getTime() - start)
	}

```

**latch**

这个 Event 仅有当事件确实发生变化时，才会向下游发送事件。

```
	export function latch<T>(event: Event<T>, equals: (a: T, b: T) => boolean = (a, b) => a === b): Event<T> {
		let firstCall = true
		let cache: T

		return filter(event, (value) => {
			const shouldEmit = firstCall || !equals(value, cache)
			firstCall = false
			cache = value
			return shouldEmit
		})
	}

```
**buffer**

在没有人订阅buffer event时，会缓存所有收到的事件，并在收到订阅时将已经缓存的事件全部发送出去。

```
	export function buffer<T>(event: Event<T>, nextTick = false, _buffer: T[] = []): Event<T> {
		let buffer: T[] | null = _buffer.slice()

    let listener: IDisposable | null = event((e) => {
			if (buffer) {
        // 进行缓存
				buffer.push(e)
			} else {
				emitter.fire(e)
			}
		})    

    // 收到订阅时，执行emitter
		const flush = () => {
			if (buffer) {
				buffer.forEach((e) => emitter.fire(e))
			}
			buffer = null
		}
      ...
		})

		return emitter.event
	}

```

**fromPromise**

将 Promise 转换为事件。通过 shouldEmit 确保 Promise 不会因为已经 resolve 而在订阅发生之前就开始派发事件

```

 export function fromPromise<T = any>(promise: Promise<T>): Event<undefined> {
        const emitter = new Emitter<undefined>();
        let shouldEmit = false;

        promise
            .then(undefined, () => null)
            .then(() => {
                if (!shouldEmit) {
                    setTimeout(() => emitter.fire(undefined), 0);
                } else {
                    emitter.fire(undefined);
                }
            });

        shouldEmit = true;
        return emitter.event;
    }

```
**Relay**

这个类提供了切换上游 Event 的方法。当设置 Relay 的 input 属性时，就会切换监听的 Event，而下游的 Event 监听的是 Relay 的 Emitter，因此无需重新设置监听。

```
export class Relay<T> implements IDisposable {
    // ...

    set input(event: Event<T>) {
        this.inputEvent = event;

        if (this.listening) {
            this.nputEventListener.dispose();
            this.inputEventListener = event(this.emitter.fire, this.emitter);
        }
    }

    // ...
}

```