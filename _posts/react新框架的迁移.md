- 组件库(yd-com)

- 核心对外业务库 yd-lib
- - @yideng/utils
- - @yideng/order
- - @yideng/buy

  - - 对业务库进行抽象，每个领域都是一个包。可以对外调用
  - - - 带来的问题
  - - - 以前核心业务放在主战里面，驱动状态很容易，现在核心业务抽出去了，核心业务相互编排的时候怎么保证核心业务以流是的形式执行相关的业务呢，怎么保证讲数据派发到想触发的逻辑呢。这两个带来的问题就是组件外状态。需要有一个东西把 react-hook 的能力外放到一个没有 react 的环境（叶就是摆拖 react-hook 的限制）。也就是在纯 ts 的环境能够监听到纯 ts 的状态的变化，也能够触发 react 的状态的变化
  - - - 组件外状态还会带来流程的问题，我们的业务都有相关的流程，所以需要用有限状态机来解决
        私仓 -》微前端 -》微服务 -》数据编排 -》@yideng

- interface 【驱动中心，其他所有都是为了 interface 服务,】(id-interface)

  - - 接口层，组装业务逻辑与组件，类似数据编排，管控流程
  - - 可以使用线程并行计算和 react 18 的 conrund mod ，应用会比较顺畅

- 私仓
  - 可以发布组件与核心业务库

# yideng lib

**lerna 的配置**

```
  "npmClient": "pnpm", // 使用pnpm
  "packages": ["packages/*"],
  "version": "independent",// 独立版本
  "command": {
    "publish": {
      "conventionalCommits": true,
      "message": "[skip ci] chore: release"
    }
  },
  "useWorkspaces": true, // 使用workspaces，采用这个命令开发基本上跟lerna无关了，lerna的包管理、法包pnpm 的workspaces 都能做，使用lerna主要是为了与pnpm 想辅相成有些pnpm 做不了比如下面的案例。
  "ignoreChanges": ["**/node_modules/**", "**/__snapshots__/**"]


pnpm 不能发布多个包，lerna能做的事：假如b依赖a包,a改动发包，b依赖a,b也会重新发包。因为lerna 不建议独立发包，但是其实也是可以单独发包的
a
b -> a


```

**私仓**

私仓可以利用 verdaccio

**打包以及发包**

- 如果内部自己使用可以不编译
- 如果外部使用一定要进行编译，因为不能缺少 node_modules 中的包，microbundle 啥都不用做，自动编译多种 module。
- ts 打包编译的时候每个文件都要生存.d.ts，要使用 api-extractor 把这些声明文件合成一个。

**调试**

开发调试不需要反复发包，本地多个包调试可以用 lerna add 命令 eg:

```
lerna add @yideng/core package/demos/ 表示将@yideng/core 添加到 package/demos 走本地的包。lerna add 首先如果远程有的话，会先从远程拉。 但是lerna 不支持别名,可以用pnpm。使用别名主要是为了开发的时候方便多个环境调试


```

npm 包别名

npm i laoyuan npm:koa //表示 koa 包的别名为 laoyuan
pnpm add laoyuan@yideng/core -filter @yideng/common laoyuan 别名

demos/进行调试，这样就不需要反复发包和 install 了。

lerna remove 只会删除 node_modules 中的包，但不会删除 package.json 中的 dependencies

**pnpm 本地调试**

pnpm add @yideng/core -filter @yideng/common 将本地的表示将@yideng/core 添加到 yideng/common,package.json 的 dependencies 会变成。

```
dependencies{
  @yideng/core:'workspace:^1.0.0'
}
```

<!-- workspace:会在发包的时候自动替换 ，workspace:是 pnpm 的协议, 发包 的时候它会将 workspace:改掉，然后用 pnpm pack 打个包以 pnpm publish 发布包。所以 pnpm 只能单独发包(得确定下)。 -->

发包要写个脚本
如果需要别名

- pnpm add @yideng/core -filter @yideng/common
- 去掉 workspace:
- publish 自动更新 package.json 中的包文件

# other

majestic 包 能够手点执行 jest 单元测试脚本

![Image text](/img/WechatIMG12.jpeg)
