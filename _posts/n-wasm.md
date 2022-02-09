
wasm
wasm 是一种基于堆栈式可移值的二进制指令集合，Wasm 模块的二进制数据也是以 Section 的形式被安排和存放的。所有 Section 都具有的通用“头部”结构，头部包括id和长度信息等等，以及各个 Section 所专有的、不同的有效载荷部分。
- Type Section,主要用来描述“函数类型”
- Start Section初始化过程完成后，需要首先被宿主环境执行的函数。
- Global Section，个 Section 中主要存放了整个模块中使用到的全局数据（变量）信息。
- Custom Section，这个 Section 主要用来存放一些与模块本身主体结构无关的数据，比如调试信息、source-map 信息等等
- Import Section 和 Export Section，import Section 主要用于作为 Wasm 模块的“输入接口”。在这个 Section 中，定义了所有从外界宿主环境导入到模块对象中的资源，这些资源将会在模块的内部被使用。。Export Section，我们可以将一些资源导出到虚拟机所在的宿主环境中
- Function Section与 Code Section.Function Section 中其实存放了这个模块中所有函数对应的函数类型信息。这些类型信息是由我们先前介绍的 Type Section 来描述的。而在 Code Section 中存放的则是每个函数的具体定义，也就是实现部分。
- table-section使用Table 结构中存放类型为 “anyfunc” 的函数指针，并且还可以通过指令 “call_indirect” 来调用这些函数指针所指向的函数，这就可以了。Table Section 是没有与任何内容相关联的，从二进制角度来看，在 Table Section 中，只存放了用于描述某个 Table 属性的一些元信息，Table Section 所描述的 Table 对象填充实际的数据，我们还需要使用名为 Element Section 的 Section 结构.
- memory-section,Memory Section，我们可以描述一个 Wasm 模块内所使用的线性内存段的基本情况，比如这段内存的初始大小、以及最大可用大小等等,通过浏览器等宿主环境提供的比如 WebAssembly.Memory 对象，我们可以直接将一个 Wasm 模块内部使用的线性内存结构，以“对象”的形式从模块实例中导出。而被导出的内存对象，可以根据宿主环境的要求，做任何形式的变换和处理，或者也可以直接通过 Import Section ，再次导入给其他的 Wasm 模块来进行使用。在 Memory Section 中，也只是存放了描述模块线性内存属性的一些元信息，如果要为线性内存段填充实际的二进制数据，我们还需要使用另外的 Data Section

在现阶段 Wasm 的 MVP 标准中，我们需要通过各类 JavaScript API 与 Web API 来在 Web 平台上与 Wasm 代码（模块）进行交互。这些 API 均只能够通过 JavaScript 代码来进行调用。而所有这些需要与 Wasm 模块直接进行的交互（互操作），都是由包含有 API 调用的 Glue Code 代码完成的。
目前 Wasm 的 MVP 标准中，我们也同样无法直接在 Wasm 字节码中操作 HTML 页面上的 DOM 元素。因此，对于这部分 Web 框架最核心的功能，便也是需要通过借助 Glue Code 调用 Web API 来帮助我们完成的。而当 Glue Code 的代码越来越多时，JavaScript 函数与 Wasm 导出函数之间的相互调用会更加频繁，在某些情况下，这可能会产生严重的性能损耗。因此结合现实情况来看，wasm更适合于计算密集大量的纯数学计算逻辑。

Wasm 浏览器加载流程

“Fetch” 阶段。作为一个客户端 Web 应用，在这个阶段中，我们需要将被使用到的 Wasm 二进制模块，从网络上的某个位置通过 HTTP 请求的方式，加载到浏览器中。

Compile” 阶段。在这个阶段中，浏览器会将从远程位置获取到的 Wasm 模块二进制代码，编译为可执行的平台相关代码和数据结构。这些代码可以通过 “postMessage()” 方法，在各个 Worker 线程中进行分发，以让 Worker 线程来使用这些模块，进而防止主线程被阻塞。

“Instantiate” 阶段。在这个阶段中，浏览器引擎开始执行在上一步中生成的代码。这个阶段Wasm 模块可以通过定义 “Import Section” 来使用外界宿主环境中的一些资源。这一阶段完成后，我们便可以得到一个动态的、保存有状态信息的 Wasm 模块实例对象。

“Call”。顾名思义，在这一步中，我们便可以直接通过上一阶段生成的动态 Wasm 模块对象，来调用从 Wasm 模块内导出的方法


wasm-pack将rust编译成wasm包，在编译好的 WebAssembly 代码基础上运行 wasm-bindgen，生成一个 JavaScript 文件将 WebAssembly 文件包装成一个模块以便 npm 能够识别它。创建一个文件夹并将 JavaScript 文件和生成的 WebAssembly 代码移到其中。





