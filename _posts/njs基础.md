**迭代器**

Iterator迭代器提供统一的接口，为不同的数据结构提供统一的访问机制(目前Map、
Set、Array支持Iterator),object是不支持的，所以不支持for of循环，如果需要支持的话可以添加，Symbol.iterator属性。
```
function* entries(obj) {
  for (let key of Object.keys(obj)) {
    yield [key, obj[key]];
  }
}

```


js的装箱和拆箱：
所谓的装箱就是把js的原始数据类型值包装成对象，这个是js实现的，所以我们可以在基本数据类似上获取属性和方法。当装箱使用完毕后，会进行拆箱，拆箱就是恢复到原来的数据值。所以此时string instanceof String是false

原型链：
原型（prototype）是一个普通的对象，为构造函数的实例提供了共享的属性和方法。每个对象都有一个_proto_，指向构造函数的原型对象。所谓的原型链式是指获取一个实例对象的属性和方法是，会依次从实例本身、构造函数原型、构造函数的原型的原型一层一层向上查找，一直到Object.prototype。

现有大的Object.prototype,然后构造出Function.prototype,然后在用Function.prototype构造出Object和Function。

由于js代码在执行时会被V8解析，这时会用不同的模板处理Js中的对象和函数，会用ObjectTemplate用来创建对象，返回值是ObjectTemplate的实例，FunctionTemplate用来创建函数，返回值是返FunctionTemplate的实例，PrototypeTemplate用来创建函数原型，返回值是ObjectTemplate的实例。所以Js中的对象原型可以这么判断，除了自定义构造函数实例外，所有的对象的原型都会指向Object.Prototype。自定义的构造函数的实例对应的是构造函数的原型。而函数的原型会指向Function.prototype

