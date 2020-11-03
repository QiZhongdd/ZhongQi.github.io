---
layout: post
title: React-fiber的任务调度
subtitle: React-fiber的任务调度
date: 2020-08-24
author: Qi
header-img: img/404-bg.jpg
catalog: true
tags:
  - react
---

# 发起调度

> 无论首次更新还是后续更新都会调用scheduleUpdateOnFiber

**scheduleUpdateOnFiber**首先判断是否是同步任务如果是直接调用performSyncWorkOnRoot执行,不是的话调用ensureRootIsScheduled(root);

```
export function scheduleUpdateOnFiber(
  fiber: Fiber,
  expirationTime: ExpirationTime,
) {
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
  // onClick事件: currentPriorityLevel = UserBlockingPriority
  const priorityLevel = getCurrentPriorityLevel();
  if (expirationTime === Sync) {
    if (
      // Check if we're inside unbatchedUpdates
      (executionContext & LegacyUnbatchedContext) !== NoContext &&
      // Check if we're not already rendering
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      // ... 第一次render
    } else {
      ensureRootIsScheduled(root);
      schedulePendingInteractions(root, expirationTime);
      if (executionContext === NoContext) {
        flushSyncCallbackQueue();
      }
    }
  } else {
    // Schedule a discrete update but only if it's not Sync.
    if (
      (executionContext & DiscreteEventContext) !== NoContext &&
      // Only updates at user-blocking priority or greater are considered
      // discrete, even inside a discrete event.
      (priorityLevel === UserBlockingPriority ||
        priorityLevel === ImmediatePriority)
    ) {
      // This is the result of a discrete event. Track the lowest priority
      // discrete update per root so we can flush them early, if needed.
      if (rootsWithPendingDiscreteUpdates === null) {
        rootsWithPendingDiscreteUpdates = new Map([[root, expirationTime]]);
      } else {
        const lastDiscreteTime = rootsWithPendingDiscreteUpdates.get(root);
        if (
          lastDiscreteTime === undefined ||
          lastDiscreteTime > expirationTime
        ) {
          rootsWithPendingDiscreteUpdates.set(root, expirationTime);
        }
      }
    }
    // Schedule other updates after in case the callback is sync.
    ensureRootIsScheduled(root);
    schedulePendingInteractions(root, expirationTime);
  }
}

```

# 调度确保

> 确保FiberRoot节点已经被调度

- 如果有过期任务，立即调用performSyncWorkOnRoot同步更新
- 如果没有新的任务，那么退出调度
- 如果有历史任务，那么会比较优先级和过期时间
- - 如果过期时间相等，但历史任务的优先级较高，则退出调度
- - 新旧任务的过期时间不相等，旧任务的优先级较低，会取消旧任务
- 根据expirationTime的不同调用不同的scheduleCallback，最后将值返回给fiberRoot.callbackNode
- - expirationTime为sync调用scheduleSyncCallback
> scheduleSyncCallback将callback添加到syncQueue中如果还未发起调度, 会以Scheduler_ImmediatePriority执行调度Scheduler_scheduleCallback
- - expirationTime不为sync调用scheduleCallback
> 推断当前调度的优先级(legacymode 下都是ImmediatePriority)，执行调度Scheduler_scheduleCallback

# 执行调度Scheduler_scheduleCallback-》unstable_scheduleCallback

```
function unstable_scheduleCallback(priorityLevel, callback, options) {
  var currentTime = getCurrentTime();
  var startTime;
  var timeout;
  if (typeof options === 'object' && options !== null) {
    var delay = options.delay;
    if (typeof delay === 'number' && delay > 0) {
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
    timeout =
      typeof options.timeout === 'number'
        ? options.timeout
        : timeoutForPriorityLevel(priorityLevel);
  } else {
    timeout = timeoutForPriorityLevel(priorityLevel);
    startTime = currentTime;
  }
  var expirationTime = startTime + timeout;
  // 新建任务
  var newTask = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };
  if (enableProfiling) {
    newTask.isQueued = false;
  }
  if (startTime > currentTime) {
    // 延时任务
    // This is a delayed task.
    newTask.sortIndex = startTime;
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      // All tasks are delayed, and this is the task with the earliest delay.
      if (isHostTimeoutScheduled) {
        // Cancel an existing timeout.
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }
      // Schedule a timeout.
      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // 及时任务
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);
    if (enableProfiling) {
      markTaskStart(newTask, currentTime);
      newTask.isQueued = true;
    }
    // Schedule a host callback, if needed. If we're already performing work,
    // wait until the next time we yield.
    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
  }
  return newTask;
}

```
- 创建新的task,将callback添加到task.callback上
- 判断新的任务是否是及时任务
- - 及时任务添加到taskQueue中（只有taskQueue中的任务才会被调度执行）
- - 非及时任务添加到timerQueue中，（timerQueue中的任务通过advanceTimer判断添加到taskQueue中）
- requestHostCallback执行调度
- - 及时任务直接调用requestHostCallback(flushWork)
- - 定时器任务调用requestHostTimeout, 当定时器触发之后也会间接调用requestHostCallback(flushWork)
- - 创建MessageChannel， 调用port.postMessage,根据 MessageChannel的特性调用port.postMassage之后，会在宏任务里执行performWorkUntilDeadLine（下一次循环）



```
// 在超过deadline时执行任务
const performWorkUntilDeadline = () => {
  if (scheduledHostCallback !== null) {
    const currentTime = getCurrentTime();
    const hasTimeRemaining = true;
    try {
      // 执行回调, 返回是否还有更多的任务
      const hasMoreWork = scheduledHostCallback(hasTimeRemaining, currentTime);
      if (!hasMoreWork) {
        // 没有更多任务, 重置消息循环状态, 清空回调函数
        isMessageLoopRunning = false;
        scheduledHostCallback = null;
      } else {
        // 有多余的任务, 分离到下一次事件循环中再次调用performWorkUntilDeadline, 进行处理
        // If there's more work, schedule the next message event at the end
        // of the preceding one.
        port.postMessage(null);
      }
    } catch (error) {
      // If a scheduler task throws, exit the current browser task so the
      // error can be observed.
      port.postMessage(null);
      throw error;
    }
  } else {
    isMessageLoopRunning = false;
  }
  // Yielding to the browser will give it a chance to paint, so we can
  // reset this.
  needsPaint = false;
};
const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;
// 请求主线程回调, 最快也要下一次事件循环才会调用callback, 所以必然是异步执行
requestHostCallback = function(callback) {
  scheduledHostCallback = callback;
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    port.postMessage(null);
  }
};

```
> 当执行完scheduledHostCallback之后, 会返回一个boolean值表示是否还有新的任务, 如果有新任务, 会再次执行port.postMessage(null), 在下一次事件循环中继续执行回调(flushWork),scheduledHostCallback即flushWork, flushWork核心调用workLoop

# workLoop工作循环

- 逐一执行taskQueue中的任务, 直到任务被暂停或全部清空
- 判断调度环境，是否需要暂停，是否需要把控制权交给浏览器
- 退出循环，返回true则表示还有任务，回到performWorkUntilDeadline执行剩余的任务，如果没有则返回false退出调度

# 总结：
- 初始化调度之前先判读有没有同步任务，有则立即执行，如果没有则调用ensureRootIsScheduled初始化调度
- 初始化调度
- - 判断有没有过期任务，有过期任务立即执行。
- - 没有新任务则立即退出调度
- - 有旧任务，则与旧任务比较优先级和过期时间。过期时间相同，旧任务优先级较高，则推出调度。过期时间不同，新任务的优先级较高会取消旧任务
- 设置任务的优先级和回调函数
- 发起调度，区分延时任务（timerQueue）和及时任务(taskQueue)，如果存在及时任务，就
创建MessageChannel，根据MessageChannel的特性，调用port.postMassage之后，会在宏任务里执行performWorkUntilDeadLine执行调度
- 执行调度，循环执行任务队列taskQueue中的任务执行
- 结束调度判断scheduledHostCallback的返回值，返回true再次执行postMessage， 在下一次事件循环中继续执行回调(flushWork)，如为false. 结束调度.
