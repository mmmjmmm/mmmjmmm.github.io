---
title: React
publishedAt: 2026-08-12
type: note
tags:
  - React
  - 八股
  - 面试
draft: false
---

# 什么是 React？React 与传统直接操作 DOM 的程序有什么不同？请说明 React 的设计目标、核心理念（包括组件化、声明式 UI、单向数据流）以及这样设计带来的优势与可能的缺点

- React 是一个 **用于构建用户界面的 JavaScript 库**，由 Facebook 开发。

- 它的设计目标是通过 **声明式编程** 和 **组件化思想**，让 UI 开发更直观和可维护。

- 与传统命令式 DOM 操作相比，React 使用 **Virtual DOM 和 diff 算法** 来最小化实际 DOM 更新，提高性能和跨平台能力。

- React 遵循 **单向数据流**，父组件通过 props 传递数据给子组件，使状态管理和调试更可预测。

- React 还推崇函数式编程风格：相同的输入产生相同的输出，有助于构建可测试、可复用的 UI。

- **优势**：声明式开发、组件复用、性能优化、生态活跃、跨平台。

- **不足**：仅聚焦视图层、需要额外库补齐功能、学习成本较高、Virtual DOM 并非所有场景下都是最快的。

# React State 不可变性原则

在 React 中，不可变性是指**数据一旦被创建，就不能被修改**。React 推崇使用不可变数据的原则，这意味着在更新数据时，应该**创建新的数据对象**而不是直接修改现有的数据。

以下是理解 React 中不可变性原则的几个关键点：

1. **数据一旦创建就不能被修改**：在 React 中，组件的状态（state）和属性（props）应该被视为不可变的。一旦创建了状态或属性对象，就不应该直接修改它们的值。这样可以确保组件的数据在更新时是不可变的，从而避免意外的数据改变和副作用。

2. **创建新的数据对象**：当需要更新状态或属性时，应该创建新的数据对象。这可以通过使用对象展开运算符、数组的 `concat()`、`slice()` 等方法，或者使用不可变数据库（如 `Immutable.js`、`Immer` 等）来创建新的数据副本。

3. **比较数据变化**：React 使用 `Virtual DOM` 来比较前后两个状态树的差异，并仅更新需要更新的部分。通过使用不可变数据，React 可以更高效地进行比较，因为**它可以简单地比较对象引用是否相等，而不必逐个比较对象的属性**。

> - 如果你直接修改 state：例如 `stateObj.name = 'new'`，对象本身的引用没有改变。React 在进行**浅比较**时，会认为 `oldState === newState`，从而跳过组件的重新渲染，导致 UI 显示与数据状态不一致。

4. **性能优化**：使用不可变数据可以带来性能上的优势。由于 React 可以更轻松地比较前后状态的差异，可以减少不必要的重新渲染和组件更新，提高应用的性能和响应性。

> - React 和许多生态库（如 Redux）内部都严重依赖于不可变性来优化性能。例如：
>
>   - React\.memo, useMemo, useCallback：这些优化钩子都依赖于**浅比较**来判断是否需要重新计算或渲染。
>
>   - 在 Redux 中，`connect` 和 `useSelector` 也是通过**浅比较**来决定组件是否需要更新。

不可变性的原则在 React 中有以下好处：

- **简化数据变更追踪**：由于数据不可变，可以更轻松地追踪数据的变化。这样可以更好地理解代码的行为和数据的流动。

- **避免副作用**：可变数据容易引发副作用和难以追踪的 bug。通过使用不可变数据，可以避免许多与副作用相关的问题。

- **方便的历史记录和回滚**：不可变数据使得记录和回滚应用状态的历史变得更容易。可以在不改变原始数据的情况下，创建和保存不同时间点的数据快照。

> React State 的不可变性原则要求我们永远不要直接修改当前的 state，而是要通过 `setState` 或 state setter 函数去返回一个全新的值来替换它。
>
> 这么做的核心原因有三个：
>
> 1. React 的渲染机制依赖于此：React 使用浅比较来快速判断状态是否变化。对于对象和数组，它只比较引用（内存地址）。如果直接修改原状态，引用不变，React 会错误地认为没有变化，从而跳过重新渲染，导致 UI 与数据不同步。
>
> 2. 保证状态更新的可预测性：不可变性使得每次状态变化都产生一个全新的数据快照，这使得状态流变得清晰可追溯，非常利于调试。
>
> 3. 性能优化：`React.memo`、`useMemo` 等优化手段都依赖于不可变性来进行高效的浅比较，避免不必要的计算和渲染。
>
> 在实践中，我们使用扩展运算符（`...`）、`array.map()`、`array.filter()` 等不会修改原值而是返回新值的方法来遵守这一原则。对于非常复杂的嵌套状态，可以使用 Immer 这样的库来简化不可变更新的写法。

# JSX本质

> JSX 是 JavaScript XML 的缩写，它是一种 语法糖，其本质是 `React.createElement(component, props, ...children)` 函数的语法糖，它让你可以用类 HTML 的标记写 UI，最终会被编译（Babel）成普通的 JavaScript 对象，即 React 元素（React Element）。

## 从 JSX 到真实 DOM

1. **编译时 \(Babel 的职责\)**

- Babel 将 JSX 代码进行编译，生成 `React.createElement(component, props, ...children)` 函数

```JavaScript
// JSX 写法
const element = <h1 className="title">Hello, React!</h1>;

// 编译后（旧的 classic runtime）
const element = React.createElement(
  'h1',
  { className: 'title' },
  'Hello, React!'
);
```

2. **React\.createElement 的作用**

- `React.createElement()` 函数执行后，并不会直接返回一个DOM元素。它会返回一个**轻量级的JavaScript对象**，这个对象就是** React Element**（React 元素）。

```JavaScript
{
  $$typeof: Symbol.for('react.element'), // React 用来识别元素对象的标识
  type: 'div',       // 原生元素：字符串；组件：函数或类
  key: null,         // 列表/数组中的 key（用于调和），不是组件 props
  ref: null,         // 特殊引用，单独处理
  props: { id: 'a', children: 'Hello' },
  _owner: null       // 内部调试/追踪用途
}
```

> 元素对象包含 **`$$typeof: Symbol.for('react.element')`** 来区分元素类型。

3. **虚拟DOM \(Virtual DOM\)**

- **虚拟DOM就是由这些React Element对象构成的树形结构**。

- **初始渲染**：React拿到虚拟DOM树后，通过`ReactDOM.render`（或新版`createRoot`）将虚拟DOM映射到真实DOM，创建实际的HTML元素并插入到页面中。

- **状态变化**：当组件的状态（`state`）或属性（`props`）变化时，React会重新调用组件的`render`函数，生成一个新的虚拟DOM树。

4. **协调 \(Reconciliation\) 与渲染**

- React会将新的虚拟DOM树与上一次的虚拟DOM树进行对比（这个过程叫做“Diffing”或“协调”），找出两者之间的最小差异。

- 然后，React会通过 ReactDOM（对于Web项目）这个渲染器，将这些差异高效地应用到真实的浏览器DOM上（这个过程叫做“提交”）。这样就避免了直接操作真实DOM带来的巨大性能开销。

> JSX 是 JavaScript XML 的缩写，它是一种语法糖，其本质是 `React.createElement` 函数的语法糖。
>
> 在编译阶段，Babel 等工具会将 JSX 代码转换为一系列的 `React.createElement()` 调用。这个函数执行后会返回一个普通的 JavaScript 对象，也就是 React Element。这个对象描述了最终想要在页面上渲染的UI结构，包含了类型、属性和子元素等信息。
>
> 这些 React Element 对象构成了虚拟DOM树。当状态变化时，React 会生成新的虚拟DOM树，并通过 Diff 算法与旧的树进行对比，计算出最小的变化，最后再由 ReactDOM 将这些变化高效地更新到真实的DOM上。
>
> 所以，**JSX 的核心价值在于提供了一种声明式、直观且高效的UI描述方式**，但它本身最终会被编译成纯粹的JavaScript逻辑来执行。

---

## 为什么 React 使用 JSX

JSX 本质就是写 React 元素对象的语法糖，避免了手写 React\.createElement的繁琐。与传统模板语言不同，JSX 是 JavaScript 的语法扩展，不需要额外的解析器，天然支持完整的 JS 作用域和逻辑复用

---

## Babel 插件如何实现 JSX 到 JS 的编译

- 编译器先解析代码为 AST

- 插件识别 JSX 节点并替换成 `React.createElement` 或新 runtime 的 `_jsx` 调用

- 最终输出标准 JavaScript，无需浏览器原生支持 JSX

### 旧 Classic Runtime

- 必须 `import React from 'react'`，因为 JSX 会被编译为 `React.createElement` 调用。

- 每个 JSX 元素都依赖 `React` 对象。

```JavaScript
// 必须 import React
import React from 'react';
const element = <h1>Hello</h1>; // 编译为 React.createElement('h1', null, 'Hello')
```

### 新的 Automatic Runtime（React 17\+）

- 不再需要显式导入 React。

- Babel 会自动引入 `jsx` / `jsxs` / `jsxDEV` 方法（来自 `react/jsx-runtime`）来生成 React Element。

- `jsx` 函数返回的结果与 `React.createElement` 等价（仍然是 React Element 对象）。

- 编译后效率更高，bundle 体积略小，支持更灵活的类型推导。

```JavaScript
// 无需 import React
const element = <h1>Hello</h1>;

// 编译后类似：
import { jsx as _jsx } from "react/jsx-runtime";
const element = _jsx("h1", { children: "Hello" });
```

# 为什么 React 元素有一个 $$typeof 属性

`$$typeof` 是一个内部属性，它的值是一个 `Symbol`，用于唯一标识一个对象是“合法的 React 元素”。React 使用它来确保无法通过注入伪造的 JSON 对象来欺骗 React 渲染恶意内容。它的存在几乎完全是为了**防御服务器端 XSS 攻击**。

## React 元素

1. JSX 代码被 Babel 编译

```JavaScript
const element = <h1 className="greeting">Hello, world</h1>;
```

```JavaScript
const element = React.createElement(
  'h1',
  { className: 'greeting' },
  'Hello, world'
);
```

2. `React.createElement()` 函数调用会返回一个普通的 JavaScript 对象

```JavaScript
// 这就是一个 React 元素对象
{
  type: 'h1',
  key: null,
  ref: null,
  props: {
    className: 'greeting',
    children: 'Hello, world'
  },
  // 关键属性！
  $$typeof: Symbol.for('react.element')
}
```

---

## 如果没有 `$$typeof`

假设你的应用允许用户输入内容，并且服务器意外地将用户输入的 JSON 字符串作为数据返回，而没有进行转义或清理。

一个恶意用户可能提交以下内容作为他的“用户名”：

```JSON
{
  "type": "div",
  "props": {
    "dangerouslySetInnerHTML": {
      "__html": "<script>alert('XSS Attack!'); yourDataSentToEvilServer()</script>"
    }
  },
  "ref": null,
  "key": null
}
```

如果服务器的 API 错误地将这个 JSON 对象（而不是字符串）返回给客户端，而客户端代码又直接将其作为子元素渲染：

```JavaScript
// 假设 serverData 是服务器返回的上述恶意对象
function Profile({ userData }) {
  return (
    <div>
      Username: {userData.username} // 这里期望是一个字符串，但收到了一个对象！
    </div>
  );
}
```

如果没有 `$$typeof`，会发生什么？

1. React 在渲染 `{userData.username}` 时，发现它是一个对象。

2. React 会检查这个对象的结构：它有 `type`，有 `props`，看起来完全像一个合法的 React 元素对象。

3. React 会信任地使用这个对象，执行 `React.createElement(‘div’, {dangerouslySetInnerHTML: {__html: ‘...’}})`。

4. 结果就是，`dangerouslySetInnerHTML` 中的恶意脚本会被执行，导致 XSS 攻击。

---

## `$$typeof` 和 `symbol` 如何解决问题

```JSON
{
  "type": "div",
  "props": { "dangerouslySetInnerHTML": { "__html": "<script>bad()</script>" } },
  "ref": null,
  "key": null,
  "$$typeof": "这不是一个真正的Symbol，只是一个字符串"
}
```

1. 服务器将这个对象序列化为 JSON 字符串 `‘{“type”: “div”, “props”: ..., “$$typeof”: “...”}’` 发送给客户端。

2. 客户端浏览器使用 `JSON.parse()` 解析这个字符串。`JSON.parse` **会忽略掉它不认识的类型（如 ****`Symbol`****、****`函数`****），只会生成字符串、数字、数组和纯对象**。

3. 解析后，客户端得到的对象中的 `$$typeof` 属性**是一个字符串**，而不是真正的 `Symbol`。

4. 当 React 开始渲染这个对象时，它会检查对象的 `$$typeof` 属性

5. React 发现 `element.$$typeof`（一个字符串）不等于 `Symbol.for(‘react.element’)`（一个唯一的 Symbol），于是立即将其识别为非法对象并拒绝渲染，从而彻底阻止了这次 XSS 攻击。

---

> `$$typeof`属性是 React 中一个巧妙的安全设计：
>
> 1. 目的：它是一个防伪标记，用于区分合法的 React 元素和通过 JSON 等途径注入的伪造对象。
>
> 2. 实现：其值是一个 `Symbol`，利用 `Symbol` 的唯一性和 JSON 无法传输 `Symbol` 的特性来构建防御机制。
>
> 3. 结果：它有效地防止了一种特定但危险的服务器端 XSS 攻击，即攻击者通过注入伪造的 React 元素对象来执行任意代码，从而极大地提升了 React 应用的安全性。

# 虚拟DOM的优点

1. **性能优化**：

   - 通过Diffing算法，React避免了不必要的DOM操作，只更新实际变化的部分。

   - 批量更新减少了浏览器的重排和重绘。

2. **开发体验提升**：

   - 开发者无需手动操作DOM，只需关心组件的state和props，React会自动处理UI更新。

   - JSX的声明式语法让代码更直观，开发者只需要描述“UI应该是什么样”，而不需要操心“如何更新”。

3. **跨平台支持**：

   - 虚拟DOM是一个抽象层，与具体渲染环境无关。这让React可以不仅用于浏览器（ReactDOM），还能用于其他平台，比如React Native（用于移动端开发）。

4. **一致性**：

   - 虚拟DOM确保了UI始终与状态同步，减少了手动DOM操作可能导致的bug。

# React合成事件机制

> React合成事件是React模拟的一套跨浏览器的事件系统。它并不是原生DOM事件，而是**React封装的一个事件对象**。它提供一致的 API（如 `preventDefault()`、`stopPropagation()` 等），并且由 React 的事件系统统一分发与管理。开发者在组件中拿到的 `e`（或 `event`）通常是 SyntheticEvent。它通过**事件委托**的方式，将所有事件都统一绑定在`root`（React 17之前是`document`）节点上，并由React来统一管理和分发。

## 为什么需要合成事件？

1. **跨浏览器兼容性**：不同浏览器（尤其是旧版IE）的事件对象存在差异。合成事件提供了一个统一的事件接口，屏蔽了底层浏览器的差异，开发者无需再关注兼容性问题。例如，无论什么浏览器，都可以通过 `event.preventDefault()` 来阻止默认行为。

> **阻止默认行为：** IE 是 `e.returnValue = false`，标准浏览器是 `e.preventDefault()`。
>
> **获取事件目标：** IE 是 `e.srcElement`，标准浏览器是 `e.target`。
>
> **获取按键：** `e.which` vs `e.keyCode` vs `e.key`。

2. **性能优化**：这是最关键的原因。如果为每个`<button>`都绑定一个原生的`onclick`事件，会造成大量的内存消耗。

- React采用**事件委托（Event Delegation）** 机制：

  - 在React 17之前，几乎所有事件都被委托到 `document` 上。

  - 在React 17及之后，事件被委托到**渲染React树的根DOM节点**（即`ReactDOM.createRoot`挂载的那个节点）。

  - 无论页面上有多少个事件处理函数，**React都只在根节点上绑定一个事件监听器**。这极大地减少了内存开销。

  > **为什么 React 17 要改？** 主要是为了**微前端**和**渐进式迁移**。如果页面上有两个或多个 React 版本（或一个 React 和一个 jQuery），它们都去抢 `document` 的事件控制权，就会引发冲突。React 17 把控制权“缩小”到自己的应用根节点，互不干扰。

3. **便于事件池化（Event Pooling）**：在React 17之前，合成事件对象会被放入一个池中（Event Pool）进行复用。这意味着事件处理函数执行完后，合成事件对象的所有属性都会被清空重置，以供后续事件使用。因此，在异步操作中无法访问到事件对象（除非调用`event.persist()`）。（注：React 17中已废弃此特性）

## 合成事件的工作流程

1. **挂载时：** React 应用启动，在**根节点 \(Root\)** 上调用 `rootNode.addEventListener('click', ...)`，只绑定**一个**监听器。

2. **触发：** 你点击了应用深处的一个 `<button>`。这个原生的 `click` 事件开始在 DOM 树中冒泡。

3. **捕获：** 它冒泡到了 React 的**根节点 \(Root\)**。

4. **分发 \(Dispatch\)：** 根节点上**唯一**的 React 监听器被触发。这个监听器被称为 **Event Dispatcher（事件分发器）**。

5. **查找：**

   - 分发器拿到原生的 `event` 对象，通过 `event.target`（即你点的那个 `<button>`）知道事件源。

   - React 在创建 DOM 节点时，会在上面用 `__reactFiber$` 和 `__reactProps$` 这样的内部属性，**悄悄地**关联了 Fiber 节点和 props。

   - 分发器根据 `event.target` 上的内部属性，找到对应的 Fiber 节点。

6. **模拟冒泡：**

   - 分发器**不会**依赖原生的 DOM 冒泡（因为事件已经冒泡到顶了）。

   - 它会从 `event.target` 对应的 Fiber 节点开始，**在 React 内部（即 Fiber 树）**，一路“向上”遍历到根节点。

   - 它会收集这条路径上所有“父 Fiber”的 `onClick` 和 `onClickCapture` 处理器。

7. **执行：**

   - 它会**模拟 W3C 的捕获和冒泡阶段**。

   - 首先，按顺序（从根到目标）执行所有 `onClickCapture` 处理器。

   - 然后，按顺序（从目标到根）执行所有 `onClick` 处理器。

**这就是为什么 ****`return false;`**** 在 React 事件中无效：** 在原生 DOM 中，`onclick="return false"` 可以阻止默认行为。但在 React 中，你的 `onClick` 只是被分发器调用的一个**普通函数**。`return false` 没有任何意义。你必须显式调用 `e.preventDefault()`。

8. **清理**

   - 事件处理函数执行完毕后，合成事件对象会被**销毁**（在React 17及之后）或放回事件池（在React 17之前）。

> React合成事件是React为了实现跨浏览器兼容和性能优化而自己封装的一套事件系统。它的核心原理是**事件委托**。
>
> 它的工作流程是：
>
> 1. 事件绑定：React不会将事件处理函数直接绑定到具体的DOM元素上，而是在根节点上为每种事件类型绑定一个唯一的事件监听器。
>
> 2. 事件触发：当事件发生时，原生事件冒泡到根节点，触发React的监听器。
>
> 3. 事件分发：React根据事件源`target`找到对应的组件，模拟出事件在组件树中的捕获和冒泡路径，并创建一个合成事件对象（`SyntheticEvent`）。
>
> 4. 事件执行：React按照组件树的顺序，依次触发收集到的路径上的事件处理函数。
>
> 5. 清理：事件处理函数执行完成后，合成事件对象被销毁。
>
> 这么做主要有三个好处：
>
> 1. 兼容性：合成事件提供了统一的API，屏蔽了浏览器间的事件差异，开发者无需处理兼容问题。
>
> 2. 性能：通过事件委托，大大减少了内存开销，避免了直接绑定大量事件监听器带来的性能问题。
>
> 3. 控制力：使React能够实现一些高级特性，如事件池化（17之前）、以及更符合React理念的事件传播机制。

## 合成事件包装器 \(The Wrapper\)

在上面第 7 步执行处理器时，React 传给你的 `e` 不是原生事件，而是 `SyntheticEvent`。

- 它**包装**了原生事件，你可以通过 **`e.nativeEvent`** 访问到它。

- 它**抹平了** API 差异，如 `e.target`, `e.key`, `e.preventDefault()`, `e.stopPropagation()`。

**`e.stopPropagation()`**** 的特殊性：** 当你调用 `e.stopPropagation()` 时，它阻止的**不是**原生 DOM 事件的冒泡（那个早就在第 3 步完成了），它只是告诉 React 的**事件分发器**：“好了，不用再往上遍历 Fiber 树了，停止执行后续的 React 处理器。”

如果你想阻止事件冒泡到 `document` 上的其他监听器（比如 jQuery 绑定的），你需要调用 `e.nativeEvent.stopImmediatePropagation()`。

# setState和batchUpdate（批量更新）机制

## setState

> `setState()` 并**不是同步地立即更新组件状态和重新渲染**。它是一个请求，通知 React：“这个组件的状态可能需要更新了”。React 会将这个更新请求排入 Fiber 的 `updateQueue`，然后 React 调度器根据优先级与批处理一起执行渲染（同步或异步取决于上下文/调度策略）。

### useState 底层语义

1. **状态存储在 Fiber 节点上**

   - 每个函数组件对应一个 **Fiber 对象**

   - Fiber 上有一个 `memoizedState` 指针，指向 **hooks 链表的头节点**

   - 每个 useState 返回的 `[state, setState]` 对应链表中的一个 Hook 节点

   - **每个 Hook 节点保存当前状态和更新队列**

2. **多次渲染中状态保持**

   - 当组件重新渲染时：

     - React 沿着 hooks 链表顺序访问每个 Hook 节点

     - 保持上一次的 `state` 值

     - 新的渲染中调用 `useState` 时，React 会复用 Fiber 上对应 Hook 节点，而不是重新初始化状态

3. **更新队列（queue）机制**

   - `setState` 并不直接修改状态，而是 **将更新操作加入该 Hook 的更新队列**

   - 在下一个渲染周期执行时，依次处理更新队列，得到新的 state

### 直接更新和函数式更新

1. 直接更新

```JavaScript
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(count + 1); // 这次更新基于 count = 0，计算结果是 1
  setCount(count + 1); // 这次更新同样基于 count = 0，计算结果还是 1
  setCount(count + 1); // 同样基于 count = 0，计算结果依然是 1
};
```

> React 内部的处理逻辑：
>
> 1. React 将这三个更新操作放入队列。
>
> 2. 当准备计算新状态时，React 看到这三个更新都是**直接提供了新值**。
>
> 3. React 会忽略掉前两个，只采用队列中的最后一个新值（因为它们都是要直接替换状态的命令）。
>
> 4. 最终，`count` 被更新为 `1`，只进行了一次有效的更新。
>
> 关键点： 在每次调用 `setCount(count + 1)` 时，你传递的都是一个固定的值（`0 + 1 = 1`）。对于 React 来说，这相当于连续三次命令：“把状态设置为 1”。它自然会只执行最后一次。
>
> 多次传值只取最后一次

2. 函数式更新

```JavaScript
const [count, setCount] = useState(0);

const handleClick = () => {
  setCount(c => c + 1); // 接收当前状态 0，返回 0 + 1 = 1
  setCount(c => c + 1); // 接收上一步的结果 1，返回 1 + 1 = 2
  setCount(c => c + 1); // 接收上一步的结果 2，返回 2 + 1 = 3
};
```

> React 内部的处理逻辑：
>
> 1. React 将这三个更新函数放入队列。
>
> 2. 当准备计算新状态时，React 会按顺序遍历这个队列。
>
> 3. 它取出第一个更新函数，将当前的 state（`0`）作为参数 `c` 传入，得到结果 `1`。
>
> 4. 它取出第二个更新函数，将上一步的结果（`1`）作为参数 `c` 传入，得到结果 `2`。
>
> 5. 它取出第三个更新函数，将上一步的结果（`2`）作为参数 `c` 传入，得到结果 `3`。
>
> 6. 最终，`count` 被更新为 `3`。所有更新都依次生效了。
>
> 关键点： 你传递的不是一个值，而是一个指令（函数）。React 会保证在最终计算状态时，按顺序执行这些指令，并且每一次执行都能接收到前一次计算的最新结果。
>
> 多次指令需要顺序执行

---

## 批量更新

批量更新是 `setState` “异步”行为的根本原因。它是指 React 会将多个 `setState` 调用合并为一次更新，从而只触发一次重新渲染。

### 为什么需要批量更新？

- **性能优化**：这是最主要的原因。每次渲染（Render）都涉及虚拟 DOM 的创建和 Diff 比较，成本很高。如果每次 `setState` 都立即触发渲染，连续调用多次 `setState` 会导致不必要的性能浪费。批量更新将多次状态变化合并，极大地减少了渲染次数。

### 在哪些场景下会批量更新？

- **React 事件监听器**：在 React 合成事件（如 `onClick`, `onChange`）的处理函数中，所有的 `setState` 都会被批量更新。

- **生命周期钩子**：在生命周期钩子（如 `componentDidMount`）中，`setState` 也会被批量处理。

> React 事件处理函数执行结束后，生命周期函数执行结束后，React 擦开始批量处理队列中的更新，进行重新渲染

### 什么时候不会批量更新

- **异步代码的回调中（微任务/宏任务）**

这是不会被批量处理的情况，也是容易产生困惑的地方。一旦代码脱离了 React 的事件系统，**进入了浏览器原生的异步任务队列**，`setState` 就会立即触发更新。

- 宏任务中（如 `setTimeout`, `setInterval`, AJAX 回调）:

```JavaScript
handleClick = () => {
  // 在 React 事件中，批量更新有效
  this.setState({ a: 1 });

  setTimeout(() => {
    // 这里已经脱离了 React 事件上下文！
    this.setState({ b: 2 }); // 会立即触发一次更新
    this.setState({ c: 3 }); // 会立即触发另一次更新？
    console.log(this.state); // 可能打印的是 {a:1, b:2} 或 {a:1, b:2, c:3}，取决于 React 版本
  }, 0);
};
// 注意：在 React 17 及之前，setTimeout 中的多个 setState 可能不会被批量处理。
// 在 React 18 中，得益于新的并发特性，几乎所有场景下的 setState 都会被自动批量处理，包括 setTimeout、Promise 等。
```

- 微任务中（如 `Promise.then`, `async/await`）:

```JavaScript
handleClick = async () => {
  // 在 React 事件中
  this.setState({ a: 1 });

  await Promise.resolve();
  // 这里也脱离了 React 事件上下文，属于微任务回调
  this.setState({ b: 2 }); // 在 React 17 中会立即更新，在 React 18 中会被批量处理
};
```

**关键点**：** React 18 引入了自动批处理（Automatic Batching）**，它将所有更新——无论其来源（事件处理函数、定时器、Promise）——都进行批处理，直到一个更大的“时机”（如浏览器的一次绘制周期结束）。这使得行为更加一致和可预测。而在 React 17 及更早版本中，批处理主要局限于 React 事件内部。

如果你想在 React 18 中强制同步刷新（极少需要），可以**使用 ****`flushSync`****。**

```JavaScript
import { flushSync } from 'react-dom';

// 在React 18中，即使在setTimeout中，默认也是批处理的
setTimeout(() => {
  // 使用 flushSync 强制退出批处理，进行同步更新
  flushSync(() => {
    this.setState({ count: this.state.count + 1 });
  });
  // 此时状态已同步更新
  console.log(this.state.count);
}, 1000);
```

### 示例

> 在`React 18`之前，`setState`在`React`的合成事件中是合并更新的，在`setTimeout`的原生事件中是同步按序更新的。例如

```JavaScript
handleClick = () => {
  this.setState({ age: this.state.age + 1 });
  console.log(this.state.age); // 0
  this.setState({ age: this.state.age + 1 });
  console.log(this.state.age); // 0
  this.setState({ age: this.state.age + 1 });
  console.log(this.state.age); // 0
  setTimeout(() => {
    // setTimout 从宏任务队列中取出开始执行时，上面的批更新操作完成了，this.state.age = 1
    this.setState({ age: this.state.age + 1 });
    console.log(this.state.age); // 2
    this.setState({ age: this.state.age + 1 });
    console.log(this.state.age); // 3
  });
};

```

> 而在`React 18`中，不论是在合成事件中，还是在宏任务中，都是会合并更新

```JavaScript
function handleClick() {
  setState({ age: state.age + 1 }, onePriority);
  console.log(state.age);// 0
  setState({ age: state.age + 1 }, onePriority);
  console.log(state.age); // 0
  setTimeout(() => {
    setState({ age: state.age + 1 }, towPriority);
    console.log(state.age); // 1
    setState({ age: state.age + 1 }, towPriority);
    console.log(state.age); // 1
  });
}
```

---

## 调用 setState 之后发生了什么

### **调用 setState 之后的核心流程**

1. **触发更新请求**

   - 调用 `this.setState(partialState)` 后，React 会将这个更新封装成一个 `update` 对象，并放入组件对应的 Fiber 节点的 `updateQueue`。

   - **注意：setState 本身并不会立即改变 this\.state！**

2. **调度更新（Scheduler 队列）**

   - React 根据当前的更新优先级（例如用户交互高优先级，数据请求低优先级）决定何时执行更新。

   - React 16 之后使用了 **异步可中断的调度（Fiber架构）**，而不是同步递归渲染。

3. **Reconciliation（协调/Diff 阶段）**

   - React 从根 Fiber 开始遍历组件树，重新计算需要更新的 Fiber 节点。

   - 新旧虚拟DOM（Virtual DOM）比较，确定哪些组件要重新渲染、哪些 DOM 节点需要修改。

4. **Commit（提交阶段）**

   - 所有变化计算完成后，进入提交阶段（同步），将 Diff 的结果真正渲染到真实 DOM。

   - 提交阶段不能被打断（保证 UI 一致性）。

5. **生命周期回调 / 副作用执行**

   - Class组件执行 `componentDidUpdate` 或 Hooks 的 `useEffect`、`useLayoutEffect` 回调。

   - 确保渲染后的副作用逻辑运行。

---

### **同步 vs 异步更新（批量更新机制）**

- **在 React 17 及之前：**

  - **生命周期函数 / 合成事件** 中的 `setState` 是**异步批量更新**（多次调用会合并）。

  - **原生事件 / setTimeout** 中的 `setState` 是**同步更新**（因为 React 无法控制原生调用栈）。

- **React 18 之后（Concurrent Mode）：**

  - 所有 `setState` 默认都是异步调度（批量更新更彻底）。

  - `flushSync()` 可以强制同步更新。

---

## 状态管理和调度系统

这是一个非常棒的问题，它触及了 React 运行机制的**两个核心**：**状态管理**和**调度系统**。

你观察到的“异步”现象，其实是 React 出于**性能**和**一致性**考虑而设计的**批量更新（Batching）和调度（Scheduling）**机制的结果。

我会为你详细分解 `setState` 的工作原理，以及它为什么表现为“异步”。

### `setState` 的工作原理：一次更新的旅程

无论你用的是 `this.setState` \(Class\) 还是 `setCount` \(Hooks\)，它们底层的原理是统一的。我们以 `setCount(1)` 为例：

**第 1 步：调用 ****`setState`**** 并创建“更新”** 当你调用 `setCount(1)` 时，React **不会**立即做任何事。

相反，它会：

1. **创建一个 ****`Update`**** 对象：** 这是一个包含新状态（`payload: 1`）的小型 JS 对象。

2. **分配一个 ****`Lane`**** \(泳道\)：** React 18\+ 的 `Lanes` 模型会给这个 `Update` 分配一个优先级。普通 `setState` 获得的是 `DefaultLane`。

**第 2 步：将“更新”放入队列 \(Enqueue\)** React 找到与 `setCount` 关联的组件 Fiber 节点，并在这个 Fiber 内部的 `Hook` 对象上，找到 `queue`（更新队列）。

它把这个新的 `Update` 对象**放入这个队列中**。

- **比喻：** 你不是在“执行”一个命令，你是在“提交一张待办工单”（`Update` 对象）到一个“待办事项列表”（`queue`）中。

**第 3 步：调度渲染 \(Schedule Render\)** 提交“工单”后，React 会告诉它的**调度器 \(Scheduler\)**：“嘿，我收到了一个 `DefaultLane` 的新工作，请在你有空的时候安排一次渲染。”

**第 4 步：渲染阶段 \(Render Phase\) \- 可中断** 稍后，调度器获得浏览器主线程的控制权，开始执行“渲染阶段”。

1. React 从根节点开始遍历 Fiber 树。

2. 当它到达你的组件时，它调用 `renderWithHooks`。

3. 它找到 `useState` 对应的 `Hook` 对象，并**处理它的 ****`queue`**（那个“待办事项列表”）。

4. React 会**计算**队列中所有的 `Update` 对象（例如，`0 + 1 = 1`），得出**最终状态 ****`1`**。

5. `useState` 返回 `[1, setCount]`。

6. 你的组件函数用新状态 `1` 执行完毕，返回新的 JSX。

7. React 继续 Diffing，找出 DOM 变更。

**第 5 步：提交阶段 \(Commit Phase\) \- 不可中断** React 拿到了所有 DOM 变更，然后**同步地**将其应用到真实 DOM 上。此时，屏幕才会更新。

---

### 为什么是“异步”的？（两大核心原因）

你所说的“异步”，在 React 语境中，更准确的词是**“非立即执行”或“可调度的” \(Scheduled\)**。

它不是像 `Promise` 那样的宏任务/微任务异步，而是 React **故意**不立即执行，而是选择“稍后”处理。

为什么？

**原因一（首要原因）：性能 \- 批量更新 \(Batching\)**

这是最核心的答案。**`setState`**** 是“异步”的，是为了实现批量更新。**

想象一下，`setState` 是“同步”的（立即渲染）：

```JavaScript
function handleClick() {
  // 假设 count=0, name="A"

  // 1. 调用 setCount(1)
  setCount(count + 1);
  // 同步执行：React 立即重新渲染组件 (Rerender 1)
  // DOM 更新为 count = 1

  // 2. 调用 setName("B")
  setName("B");
  // 同步执行：React 立即再次重新渲染组件 (Rerender 2)
  // DOM 更新为 name = "B"
}
```

一次点击导致了**两次**代价高昂的重新渲染。这是灾难性的性能浪费。

**React 的“批量更新”解决方案：**

React 会在 `handleClick` 这样的事件处理器中“打开一个批次”。

```JavaScript
function handleClick() {
  // React: "OK，我开始一个批次..."

  // 1. 调用 setCount(1)
  setCount(count + 1);
  // React: "收到！把 'set count to 1' 的工单放入队列。"

  // 2. 调用 setName("B")
  setName("B");
  // React: "收到！把 'set name to B' 的工单放入队列。"

}
// handleClick 函数执行完毕
// React: "OK，批次结束。我来看看队列里有什么..."
// React: "有两个工单，我把它们合并，只触发一次重新渲染！"

// React 调度一次渲染：
// Render 阶段：计算出最终状态 count=1, name="B"
// Commit 阶段：一次性更新 DOM
```

**原因二：状态一致性 \(Consistency\)**

批量更新还保证了状态和 `props` 在一次渲染中是**一致**的，不会出现“中间态”或“UI 撕裂”。

如果 `setState` 是同步的，可能会发生：

1. `setCount(1)` \-\> 立即渲染。

2. 在这次渲染中，某个子组件读取了 `count`（新值 `1`）和 `name`（旧值 `"A"`）。

3. `setName("B")` \-\> 再次渲染。

4. 子组件读取 `count`（新值 `1`）和 `name`（新值 `"B"`）。

在第 2 步中，UI 处于一个“半新半旧”的撕裂状态 \(`count` 是新的, `name` 是旧的\)，这是不应该的。

批量更新确保了 `count` 和 `name` 的更新被“原子化”地应用在**同一次**渲染中，组件永远不会读到这种“中间态”。

---

### “异步”的演进：React 17 vs React 18

这个“异步”的行为在 React 18 中发生了重要变化：

- **React 17 \(及以前\):** 批量更新**只**在 React 事件处理器（`onClick` 等）中生效。

  - 如果你在 `setTimeout`, `Promise.then` 或原生事件监听器中调用 `setState`，它是**同步**的（会立即触发渲染），因为那时 React 的“批次”已经结束了。

- **React 18 \(****`createRoot`****\)：** 引入了**自动批量更新 \(Automatic Batching\)**。

  - 现在，**所有**的 `setState` 默认都是“异步”和“批量”的，**无论**它们在哪里被调用（包括 `setTimeout` 和 `Promise`）。

  - 这使得 `setState` 的行为更加一致和可预测。

---

### “异步”带来的陷阱与解决方案

这个机制导致了一个最著名的陷阱：**闭包陷阱**。

**陷阱：****`setState`**** 无法立即获取新值**

```JavaScript
function handleClick() {
  // 假设 count = 0
  setCount(count + 1); // 1. 提交 "set to 0 + 1" 的工单

  // "异步"的后果：count 在这一行 *仍然* 是 0
  console.log(count); // 打印 0

  setCount(count + 1); // 2. 提交 "set to 0 + 1" 的工单
  console.log(count); // 仍然打印 0
}
// 最终，React 处理队列，两次都是 "set to 1"，结果是 1，而不是 2！
```

**为什么？** `count` 变量是在 `handleClick` 函数创建时从渲染“快照”中捕获的，它的值就是 `0`。`setState` 只是去“排队”，并不会改变这个闭包里的 `count` 变量。

**解决方案：函数式更新**

如果你需要基于**上一个状态**来计算**新状态**，**永远**使用函数式更新：

```JavaScript
function handleClick() {
  // 1. 提交一个“函数工单”
  setCount(prevCount => {
    // prevCount 会是队列中最新的值
    return prevCount + 1;
  });

  // 2. 提交*另一个“函数工单”
  setCount(prevCount => {
    return prevCount + 1;
  });
}
```

# useState 闭包陷阱

函数组件每次渲染（状态 /props 变化时），都会重新执行整个组件函数，且每次执行时的状态 / 变量都会形成一个独立的 “闭包作用域”—— 闭包陷阱的本质就是：代码中引用的状态 / 变量，是 “旧闭包作用域” 中的旧值，而非最新的状态 / 变量。

```JavaScript
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // ❌ 陷阱在这里：这个回调函数是在组件第一次挂载时创建的
      // 它闭包捕获的 count 永远是最初的 0
      console.log("当前 count:", count);
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []); // 注意：依赖项是空的

  return <h1>{count}</h1>;
}
```

1. 组件渲染，`count` 是 `0`。

2. `useEffect` 运行，创建了一个定时器。

3. 定时器的回调函数“记住了”当时的 `count` 是 `0`。

4. 1秒后，执行 `setCount(0 + 1)`，页面变 `1`。

5. 又过1秒，回调函数**依然**拿着当时抓到的 `count = 0`，再次执行 `setCount(0 + 1)`。

**结果：** 页面永远停留在 `1`，控制台疯狂打印 `0`。

```JavaScript
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(timer);
}, [count]); // ✅ count 变了就重来
```

```JavaScript
useEffect(() => {
  const timer = setInterval(() => {
    // prev 代表 React 内部当前最实时的状态，不依赖外部闭包
    setCount(prev => prev + 1);
  }, 1000);
  return () => clearInterval(timer);
}, []); // ✅ 即使依赖为空，逻辑也正确
```

# 组件渲染和更新过程

> React 的一次渲染/更新分为 **两个逻辑阶段**：
>
> 1. **Render（又叫 Reconciliation / render\-phase）**：在内存中“构建/计算”新的 UI 描述（构建 work\-in\-progress Fiber 树、计算下一轮 state/props、生成 effect list）。这个阶段**可以被中断/暂停/重启**（Fiber 的时间切片与并发能力）。
>
> 2. **Commit（commit\-phase）**：把 render 阶段计算出的变更“一次性”应用到 DOM / host 环境并触发生命周期/同步副作用（refs、useLayoutEffect、componentDidMount/Update 等）；这个阶段**不可中断**，必须同步完成。

## **初次渲染（Mount 阶段）详细流程**

1. **创建根容器和 Root Fiber**

- 当调用 `ReactDOM.createRoot(container)` 或 `ReactDOM.render(element, container)` 时，React 会创建一个 **FiberRoot**（对应整个应用）和一个 **HostRootFiber**（根组件对应的 Fiber 节点）。

- 这个 Root Fiber 会保存应用的更新队列、优先级调度信息，以及指向 DOM 容器的引用。

---

2. **调度更新任务**

- React 调用内部的 `scheduleUpdateOnFiber` 方法，把一次渲染任务交给 Scheduler。

- Scheduler 是一个任务调度器，会根据优先级决定是立即执行（同步模式）还是延迟分片执行（并发模式）。

- 在初次渲染中，通常是高优先级的同步执行。

---

3. **beginWork 阶段（构建 Fiber 树的递阶段）**

- React 从根 Fiber 开始遍历组件树：

  1. 如果是 **函数组件**，直接调用函数得到 JSX 元素；

  2. 如果是 **类组件**，实例化类组件并调用其 render 方法；

  3. 如果是 **原生 DOM 节点**，直接记录标签类型和属性。

- 对每一个虚拟 DOM 元素，React 会创建一个对应的 **Fiber 节点**（保存类型、props、stateNode 等信息）。

- 这个阶段的特点是：

  - **自顶向下递归**，构建 **workInProgress Fiber 树**；

  - **可以被打断**，因为 Fiber 把渲染拆分为一个个小单元。

---

4. **completeWork 阶段（构建 Fiber 树的归阶段）**

- 当子组件 Fiber 构建完成后，React 会回到父组件 Fiber：

  1. 确定真实 DOM 节点（如果是 HostComponent）；

  2. 处理 DOM 属性、样式等；

  3. 把需要插入 DOM 的操作收集到 effectList（副作用链表）。

- 这个阶段是 **自底向上归并** Fiber 树，准备好一切变更描述。

- 同样也 **可以被打断**。

---

5. **commit 阶段（同步提交，不可中断）**

- 当整棵 workInProgress Fiber 树构建完成，进入提交阶段：

  1. 把所有 effectList 中的 DOM 操作一次性应用到真实 DOM；

  2. 调用 `componentDidMount` 或 `useLayoutEffect` 回调；

  3. 调度 `useEffect` 回调异步执行。

- 此时 Fiber 树切换：

  - `workInProgress` → `current`，表示渲染完成。

- 这个阶段 **必须同步完成**，因为涉及真实 DOM 变更和用户可见的 UI。

---

## **更新（Update 阶段）详细流程**

1. **触发更新**

- 当调用 `setState` 或 `useState` 时：

  1. React 会创建一个 **update 对象**，里面包含新的状态（或状态计算函数）、更新优先级、回调等；

  2. 这个 update 会被放进组件对应 Fiber 节点的 **updateQueue** 链表中；

  3. 调用 `scheduleUpdateOnFiber`，把更新任务交给 Scheduler。

---

2. **调度任务**

- Scheduler 根据当前浏览器帧率和任务优先级，决定是立即同步执行还是分片异步执行（React 18 的并发特性）。

- 高优先级任务（如用户输入）会打断低优先级任务（如列表渲染）。

---

[React](https://ucnjui1gbcuc.feishu.cn/wiki/JUoywI2bCi3qDkkSqH5cATCBnTb#share-ZHlLdskJvod66qxBj2DcJlbrndf)

3. **beginWork 阶段（计算新 Fiber 树）**

- React 再次从根 Fiber 开始遍历组件树：

  1. 对比新旧虚拟 DOM 元素（Diff 算法）；

  2. 对比新旧 Fiber 节点（根据 key 和 type 判断复用还是销毁）；

  3. 执行更新逻辑：类组件调用 `render`，函数组件执行函数重新生成 JSX；

  4. 生成新的 workInProgress Fiber 树。

- 同样可以被打断，以保证高优先级任务优先。

---

4. **completeWork 阶段（生成 DOM 变更描述）**

- 自底向上遍历 Fiber 树：

  1. 确定需要新增、删除、更新的 DOM 节点；

  2. 生成副作用列表（effectList），描述所有 DOM 操作；

  3. 把更新后的状态保存到 fiber\.memoizedState，等待 commit。

---

5. **commit 阶段（同步执行 DOM 更新）**

- 当所有变更都准备好后：

  1. 一次性执行所有 DOM 更新，避免多次回流重绘；

  2. 调用 `componentDidUpdate` 或 `useLayoutEffect` 回调；

  3. 触发异步的 `useEffect` 回调；

  4. 切换 Fiber 树：workInProgress → current。

- 这个阶段是同步的、不可中断的，因为 UI 需要一次性更新到最新状态。

> 在触发阶段，setState 创建一个 update 对象，放入 Fiber 的 updateQueue，由 Scheduler 调度。进入渲染阶段后，React 从根节点开始遍历构造新的 Fiber 树。首先根据节点类型，调用函数组件或类组件的 render 函数，生成新的React元素，将新的React元素列表和 Fiber 节点进行对比，判断当前是生成新的节点，删除节点、复用节点或者更新节点，然后为这个Fiber节点打上标签，生成workInProgress Fiber树。当这个节点及其子节点都处理完成后，将这个节点的副作用和子节点的副作用链表连接起来，形成 effect list。进入更新阶段时，遍历effect list 中的fiber节点进行操作，并一次性应用到 DOM 上

# Diff 算法相关

> 计算出`Virtual DOM`中真正变化的部分，并只针对该部分进行原生`DOM`操作，而非重新渲染整个页面。

## **为什么需要 Diff 算法？**

React 在更新 UI 时，需要根据新旧虚拟 DOM 树计算最小的变更，然后高效更新真实 DOM。

- **直接比较两棵树的最优解是 O\(n³\)**（非常慢）；

- React 通过限制条件（同层比较）将复杂度降低为 **O\(n\)**，大大提高性能。

---

## Diff 策略

1. **跨层比较：Tree Diff**

React 只会对相同层级的节点进行比较，而不会跨层级去比较。如果一个元素节点在前后两次更新中跨越了层级，那么 `React` 不会尝试复用它。

- 操作：如果发现同一个位置的节点类型不同（例如从 `<div>` 变为 `<span>`），React 会直接拆卸（unmount）整个旧的组件树并重建（mount）新的组件树。

2. **相同类型比较：Component Diff**

如果是相同类型的组件（或DOM节点），React 会**继续比较其属性和子节点**。

- **DOM 元素**：如果节点是相同类型的 HTML 元素（如都是 `<div>`），React 会只**更新该节点上发生变化的属性（如 ****`className`****, ****`style`****）**。

- **组件元素**：如果节点是相同类型的 React 组件，React 会**更新该组件的 props 并触发其更新生命周期（如 ****`render`**** 方法），然后递归地对子节点进行 Diff**。

3. **列表比较：Element Diff（最复杂，最关键）**

当处理列表子节点时，React 会使用 Key 来优化比较过程。

- **无 key 或 key 不唯一**

  - React 按顺序一一比较：

    - 如果节点类型相同 → 复用；

    - 否则销毁并重新创建。

  - 缺点：**移动元素时效率低，因为无法识别元素是否只是换了位置**。

- **有稳定且唯一的 key**

  - React 先用 key 建立新旧节点的映射关系：

    1. 遍历旧列表，创建 key 和 node 的映射表

    2. 遍历新节点 → 找到对应旧节点（key 相同 → 复用；key 不存在 → 新增）；

    3. 遍历旧节点 → 没被复用的 → 删除；

  - 如果同一个 key 的节点位置不同，React 不会重新创建，只是记录移动操作，提高性能。

> ### 列表 Diff 的详细过程（有 Key 时）
>
> 假设我们有旧列表 `[A, B, C]`（Key 为 `a, b, c`），新列表为 `[D, A, C, B]`。
>
> 1. 建立映射：React 首先会遍历旧列表，创建一个 `{key: node}` 的映射表：`{a: A, b: B, c: C}`。
>
> 2. 遍历新列表：React 遍历新列表的每一个节点（D, A, C, B）。
>
> 3. 查找节点：对于新列表的每个 Key，去旧的映射表中查找。
>
>    - `D`（新）：在旧映射中没找到 Key `d` → 标记为新增。
>
>    - `A`：在旧映射中找到 Key `a` → 判断为可复用的节点。记录下它的位置。
>
>    - `C`：找到 Key `c` → 可复用。
>
>    - `B`：找到 Key `b` → 可复用。
>
> 4. 确定操作：React 现在知道：
>
>    - 需要新建 `D` 节点。
>
>    - 需要移动 `A`, `C`, `B` 节点的位置。
>
> 5. 计算最小移动路径：React 使用一种算法（类似于求最长递增子序列）来计算如何用最少的移动操作，将旧的节点序列 `[A, B, C]` 重新排列成新的序列 `[D, A, C, B]`。
>
> 6. 执行DOM操作：最终，React 会生成一个操作序列：`在开头插入D，将B移动到末尾`。然后一次性将这些操作应用到真实DOM上。

> React 的 Diff 算法是其高性能渲染的核心。它通过三个核心策略，将传统的 O\(n³\) 复杂度问题优化到了 O\(n\)：
>
> 1. Tree Diff：只在相同层级的节点间进行比较。如果节点类型不同，直接拆卸整个子树并重建，避免了昂贵的跨层级递归。
>
> 2. Component Diff：对于相同类型的组件或DOM节点，React 会递归地Diff其子节点，并且只更新发生变化的属性。
>
> 3. Element Diff：这是处理列表的关键。React 强烈建议为列表项提供稳定的唯一Key。通过Key，React可以建立新旧节点的映射关系，精确地识别出哪些节点是新增、删除或需要移动的，从而复用节点，并用最少的移动操作完成列表更新。
>
> 正是因为这些策略，特别是Key的优化，使得React能够计算出对真实DOM的最小化操作，最终实现了高效更新。而使用index作为Key会破坏这一机制，导致性能下降和潜在的状态bug。

### 场景一：Diffing by Element Type \(按“类型”比较\)

这是 React Diff 的第一个、也是最粗暴的规则。

**规则：** 当 `current` Fiber 和 `new` Element 的**根节点类型不同**时，React 会放弃比较。

**执行流程：**

1. **判断类型：**

   - `<div>` vs `<p>` \-\> **不同**

   - `<MyComponent>` vs `<div>` \-\> **不同**

   - `<MyComponent>` vs `<YourComponent>` \-\> **不同**

2. **执行动作：**

   - React 会**销毁** `current` Fiber 及其**所有子孙** Fiber。

   - 对于 Class 组件，会触发 `componentWillUnmount`。

   - 对于 Function 组件，会触发所有 `useEffect` 和 `useLayoutEffect` 的**清理函数 \(destroy\)**。

   - 这个旧 Fiber 会被标记为 **`Deletion`**** \(删除\)**。

   - 然后，React 会为 `new` Element 及其所有子孙**从零开始创建**新的 Fiber 树。

   - 所有新 Fiber 都会被标记为 **`Placement`**** \(插入\)**。

**后果：** 这是一个非常昂贵的操作。这就是为什么你**绝对不应该**在组件的顶层使用不稳定的逻辑来切换元素类型（例如 `loading ? <div /> : <section />`），这会导致状态和 DOM 完全丢失和重建。

---

### 场景二：Diffing Same Element Types \(按“属性”比较\)

**规则：** 当 `current` Fiber 和 `new` Element 的**类型相同**时，React 会“复用”这个节点。

**执行流程：**

- **Case A: 对于 ****`HostComponent`**** \(DOM 节点, e\.g\., ****`<div>`****\)**

  1. **复用 DOM：** React 会**保留** `current.stateNode`（即真实的 DOM 节点）。

  2. **Diff 属性：** React 会遍历 `current.memoizedProps` \(旧属性\) 和 `new.props` \(新属性\)。

  3. 它会找出所有**变更、添加、删除**的属性（例如 `className` 变了，`style` 变了，`onClick` 句柄变了）。

  4. **生成工作：** 它将这些变更编译成一个 `updatePayload` 数组（例如 `['className', 'new-class']`）。

  5. **标记：** 它给这个 `workInProgress` Fiber 打上一个 **`Update`**** \(更新\)** 的 `flags`（副作用标记）。

  6. **递归：** 然后，React **继续向下**，对 `children` \(子节点\) 重复这个 Diffing 过程。

- **Case B: 对于 ****`FunctionComponent`**** 或 ****`ClassComponent`**

  1. **复用实例：** React 会**保留**组件实例。

  2. **传递 Props：** 它会把 `new.props` 传递给组件。

  3. **重新渲染：** React 会**执行**这个函数组件（或调用类组件的 `render`），获取**新**的 JSX \(children\)。

  4. **递归：** 然后，React **继续向下**，拿这个**新**的 JSX 去和 `current.child` \(旧的子 Fiber\) 进行 Diffing。

---

### 场景三：Diffing Children \(递归地比较子节点\)

这是 Diff 算法**最复杂、最核心**的部分。React 必须协调一个**子节点列表**。

这里有两种情况：

#### 情况 A: 简单（无 Key）的子节点

这是 React 的默认行为。如果你不提供 `key`，React 会**按索引 \(index\)** 进行比较。

- `old: [<div>A</div>, <div>B</div>]`

- `new: [<div>A</div>, <div>B</div>, <div>C</div>]`

  1. `old[0]` vs `new[0]` \(A vs A\)：相同，复用。

  2. `old[1]` vs `new[1]` \(B vs B\)：相同，复用。

  3. `old[2]` \(null\) vs `new[2]` \(C\)：`new[2]` 是新的，标记 `Placement`。

- `old: [<div>A</div>, <div>B</div>]`

- `new: [<div>C</div>, <div>A</div>, <div>B</div>]` **\(在开头插入\)**

  1. `old[0]` \(A\) vs `new[0]` \(C\)：**类型相同，但内容不同**。React 认为这是**更新**。它会把 A 的 DOM 节点**复用**，然后把内容从 "A" 改成 "C"。

  2. `old[1]` \(B\) vs `new[1]` \(A\)：**类型相同，内容不同**。React 把 B 的 DOM 节点**复用**，内容从 "B" 改成 "A"。

  3. `old[2]` \(null\) vs `new[2]` \(B\)：`new[2]` 是新的，标记 `Placement`，创建新 DOM 节点 "B"。

**后果：** 这种按索引 Diff 的方式极其低效。在列表开头插入一个元素，会导致**所有**元素都被“更新”，而不是简单地“插入”一个新元素。

#### 情况 B: 复杂（有 Key）的子节点

这就是 `key` 属性的用武之地。`key` 告诉 React：“这个元素（例如 `key="user-123"`）在逻辑上是**同一个**，无论它在列表中的哪个位置”。

React 的 Keyed Diff 算法是一个**多轮**处理过程：

**第一轮：线性扫描 \(Linear Scan\)**

React 会同时遍历 `current` Fiber 列表和 `newChildren` \(JSX\) 列表，**按索引**比较。

1. 初始化 `oldIndex = 0`, `newIndex = 0`。

2. **循环：** 比较 `old[oldIndex]` 和 `new[newIndex]`。

3. **如果 ****`key`**** 和 ****`type`**** 都相同：**

   - 说明节点**可能**没动。

   - 复用 \(Clone\) 这个 Fiber，标记 `Update`（如果 `props` 变了）。

   - `oldIndex++`, `newIndex++`，继续循环。

4. **如果 ****`key`**** 或 ****`type`**** 不同：**

   - **停止循环**。

**此轮结束时：** 所有在两个列表开头*连续匹配*的节点都已被处理。

**第二轮：收集旧节点 \(Collect Old Nodes\)**

React 会从 `oldIndex`（即第一轮中断的地方）开始，遍历**所有剩余**的 `current` Fiber，并将它们放入一个 `Map` 中，结构为 `Map<key, Fiber>`。

**第三轮：处理新节点 \(Process New Nodes\)**

React 会从 `newIndex`（第一轮中断的地方）开始，遍历**所有剩余**的 `newChildren` \(JSX\)。

对于每一个 `newChild`：

1. 获取 `newChild.key`。

2. 在 `Map` 中查找：`const oldFiber = map.get(newChild.key);`

3. **Case A: ****`oldFiber`**** 不存在 \(Map 中没有这个 key\)**

   - **结论：** 这是一个**新插入**的元素。

   - **动作：** React 会创建一个新 Fiber，并标记为 **`Placement`**。

4. **Case B: ****`oldFiber`**** 存在 \(Map 中找到了这个 key\)**

   - **结论：** 这是一个**移动**或**更新**的元素。

   - **动作：**

     - React 会**复用**这个 `oldFiber`（克隆它为 `wip` Fiber）。

     - 如果 `props` 变了，标记为 **`Update`**。

     - **重要：** 即使 `props` 没变，这个节点**也必须被标记为 ****`Placement`**。为什么？因为它不在第一轮的线性扫描中被匹配，说明它的**位置（索引）一定发生了变化**，需要被移动。

     - 最后，从 `Map` 中删除这个 `key`：`map.delete(newChild.key);`。

**第四轮：清理 \(Cleanup\)**

第三轮结束后，`Map` 中**仍然存在**的所有 Fiber，都是在旧列表中存在、但在新列表中已消失的节点。

- **结论：** 这些都是需要**删除**的元素。

- **动作：** React 遍历 `Map` 中所有剩余的 Fiber，并给它们**全部**标记为 **`Deletion`**。

### 总结 \(Diffing 的产物\)

这个极其复杂的 Diffing 算法（尤其是 Keyed 部分），全部发生在“渲染阶段”的 `beginWork` 中。

它的**产物**不是 DOM 操作。

它的产物是一个**新的 ****`workInProgress`**** Fiber 树**，以及一个**扁平的 ****`effectList`****（副作用列表）**。

这个列表上的 Fiber 节点，都带着明确的`flags`（副作用标记）：

- **`Placement`**: 告诉“提交阶段”需要执行 `appendChild` 或 `insertBefore`。

- **`Update`**: 告诉“提交阶段”需要更新 DOM 属性或文本。

- **`Deletion`**: 告诉“提交阶段”需要执行 `removeChild`。

# 关于Fiber

## 为什么需要 Fiber？

1. **React 15 之前的问题（Stack Reconciler）**

   - **递归渲染**：当组件状态或 props 变化时，React 从根组件开始，递归遍历整个组件树，计算每个组件的更新。

   - **同步执行**：整个渲染过程是同步的，即一旦开始，就必须一次性完成，不能暂停。这意味着 React 会占用浏览器的主线程（JavaScript 线程），直到渲染结束。

   - **主线程阻塞**：浏览器主线程被长时间占用，无法响应用户输入、动画或布局计算，导致界面卡顿（jank）。

   - **无法优先级管理**：所有更新任务平等对待，用户点击（高优先级）可能被数据加载（低优先级）阻塞。

2. **目标：使渲染过程可中断、可恢复、可优先级调度。**

   - **核心思想：** 把渲染工作拆成小任务，按帧调度，优先执行高优先级任务（如用户交互）。

   - **解决方案：** 用 Fiber 架构重写协调（Reconciler），使 React 拥有“时间切片”和“任务优先级”。

> 关键特性
>
> - 增量渲染（把渲染任务拆分成块，匀到多帧）
>
> - 更新时能够暂停，终止，复用渲染任务
>
> - 给不同类型的更新赋予优先级
>
> - 并发方面新的基础能力
>
> 增量渲染用来解决掉帧的问题，渲染任务拆分之后，每次只做一小段，做完一段就把时间控制权交还给主线程，而不像之前长时间占用

---

## Fiber 核心思想

Fiber 的核心思想是：**将不可中断的同步更新过程，变为可中断的异步更新过程**。

### 工作分片（Unit of Work）

Fiber 将整个渲染更新过程分解成一个个小的**工作单元**（这就是 “Fiber” 名字的由来，可以理解为“纤维”，即很细小的任务）。React 每次只执行一个工作单元，执行完后会看看是否还有剩余时间。如果有，就继续执行下一个；如果没有，就把控制权交还给浏览器，让浏览器去处理更紧急的事情（如用户输入），等浏览器空闲了再继续执行。

这个“检查是否有时间”的机制，就是利用浏览器的 `requestIdleCallback` API（或其 polyfill）来实现的。

放屁，使用的是messagechannel，到底是谁给我说的rIC

> 处理一个 fiber 节点就是一个工作单元
>
> 调度器利用 requestIdleCallback（或 polyfill，如 setTimeout）检测浏览器空闲时间。

### Fiber 节点（Fiber Node）

在 Fiber 架构中，React 不再直接递归操作虚拟 DOM 树，而是为每个虚拟 DOM 节点创建一个对应的 **Fiber 节点**。这些 Fiber 节点通过以下指针连接起来，形成一颗 Fiber 树：

- `child`: 指向第一个子节点

- `sibling`: 指向下一个兄弟节点

- `return`: 指向父节点

这种链表结构使得遍历过程可以被**中断和恢复**。因为你知道当前节点的下一个节点是谁（`child` 或 `sibling`），父节点是谁（`return`），所以即使中途停下来，之后也能轻松地找到下一个要处理的节点。

一个 Fiber 节点就是一个 JavaScript 对象，它包含了：

- 组件的类型（函数/类/原生DOM）

- 对应的真实 DOM 节点

- 本次更新带来的 props、state

- 副作用（Effect）标记 **EffectTag**（如：需要插入、更新、删除DOM）

- 与其他 Fiber 节点的连接指针（child, sibling, return）

- 更新队列 `updateQueue`（存放需要处理的状态更新）

> - **updateQueue 是 Fiber 节点上存放待处理更新（状态更新）的链表结构。**
>
> - 每次调用 setState / useState，会生成一个 Update 对象插入对应组件的 updateQueue。
>
> - 每个 Update 包含：
>
>   - `action`（object 或函数），
>
>   - `lane`（优先级标识），
>
>   - 其它元数据（回调、eagerState 标志等）。
>
> - React 在 render 阶段遍历 updateQueue，合并更新，计算新的 state，渲染新 UI。

```TypeScript
type Fiber = {
  tag: WorkTag,              // 节点类型（FunctionComponent、HostComponent 等）
                             // 0 = FunctionComponent, 3 = HostRoot, 5 = HostComponent (<div>)
  key: string | null,        // 唯一标识，用于列表 diff
  elementType: any,          // JSX 类型（可能是 function、class、string）
  type: any,                 // 组件类型（与 elementType 类似）
  stateNode: any,            // 对应的真实 DOM 或 Class 实例

  return: Fiber | null,      // 指向父 Fiber
  child: Fiber | null,       // 第一个子 Fiber
  sibling: Fiber | null,     // 右侧兄弟 Fiber

  index: number,             // 兄弟节点中的位置（用于列表 diff）

  pendingProps: any,         // 本次更新即将使用的 props，刚从 React Element 传来的新 props
  memoizedProps: any,        // 上次渲染时使用的 props
  memoizedState: any,        // 上次渲染完成后的 state
                             // 存储 state。
                             // 对 FunctionComponent: 这是一个 Hooks 链表 (HookA -> HookB)
                             // 对 HostComponent: 存储 props (e.g., {onClick: fn})
  updateQueue: any,          // 状态更新队列（用于 setState/useState）
                             // 对 FunctionComponent: 这是一个 Effects 链表 (EffectA -> EffectB)
                             // 对 HostRoot/Class: 这是一个 update 对象的链表

  flags: Flags,              // 副作用标记（如 Placement、Update、Deletion）
  subtreeFlags: Flags,       // 子树的副作用标记
  deletions: Fiber[] | null, // 需要删除的子节点列表

  alternate: Fiber | null,   // 指向上一次渲染的 Fiber（双缓存）
  lanes: Lanes,              // 优先级相关
  childLanes: Lanes,         // 子树优先级
}

```

updateQueue

```Plain Text
App (FunctionComponent Fiber)
 └─ div (HostComponent Fiber)
     ├─ span (HostComponent Fiber)
     │   └─ "Hello" (HostText Fiber)
     └─ button (HostComponent Fiber)
```

Hook 链表\(存储在 `FiberNode.memoizedState` for FunctionComponent\)

`useState` 和 `useEffect` 都是这个链表上的一个节点。

```TypeScript
/**
 * Hook 对象的简化定义
 * (在 packages/react-reconciler/src/ReactFiberHooks.js 中)
 */
const hook: Hook = {
  memoizedState: any, // useState 的值, useMemo 的值

  queue: { // 存储 dispatch (setCount) 触发的更新
    pending: null, // 一个 Update 对象的循环链表
    dispatch: null, // dispatch 函数 (setCount)
  },

  next: null | Hook, // 指向下一个 Hook (useState -> useEffect -> useMemo)
};

// useState hook 节点
Hook_1 (useState) {
  memoizedState: 0,       // 它的 "memoizedState" 存的是【状态值】
  queue: { ... },         // 它的 "queue" 存的是【更新队列 (Update)】
  next: Hook_2
}

// useEffect hook 节点
Hook_2 (useEffect) {
  // 它的 "memoizedState" 存的是【上一次的 Effect 对象】
  memoizedState: {
    tag: 'Passive',
    create: fn_from_last_render,
    destroy: fn_cleanup_from_last_render,
    deps: [0] // 上一次的依赖
  },
  queue: null, // (它不用这个 queue)
  next: null
}
```

`Effect` 链表 \(存储在 `FiberNode.updateQueue` for FunctionComponent\)

`useEffect` 和 `useLayoutEffect` 会在这里创建一个 `Effect` 对象。

```JavaScript
/**
 * Effect 对象的简化定义
 * (在 packages/react-reconciler/src/ReactFiberHooks.js 中)
 */
const effect: Effect = {
  tag: Passive | Layout, // Effect 的类型 (useEffect 还是 useLayoutEffect)
  create: () => {}, // 你的 effect 回调 (e.g., document.title = ...)
  destroy: () => {}, // 你的清理 (cleanup) 函数
  deps: [], // 依赖数组
  next: null | Effect, // 指向下一个 Effect
};
```

```JavaScript
function App() {
  const [count, setCount] = useState(0); // Hook 1
  useEffect(() => {}, []);               // Hook 2
  const [text, setText] = useState("");  // Hook 3
}
```

在 Fiber 节点内部，`memoizedState` 链表长这样：

> Hook1 \(`useState`\) \-\> Hook2 \(`useEffect`\) \-\> Hook3 \(`useState`\)

虽然 Hook 对象本身混在一起，但 `useEffect` 的**工作内容**（那个回调函数）需要等到渲染结束后才执行。

如果 React 在提交阶段（Commit Phase）还要去遍历那个混合的 Hook 链表，从中挑出 `useEffect` 来执行，效率太低了（因为链表里还有 `useState` 等不需要在 Commit 阶段处理的东西）。

**解决方案：** 当 React 在渲染阶段遇到 `useEffect` 时，它会创建一个 **Effect 对象**，并将它添加到一个**单独的环形链表**中。这个链表保存在 Fiber 节点的 `updateQueue` 属性中。

```JavaScript
// 1. Fiber 节点
const fiber = {
  // 混合链表：存了所有 Hook 的状态 (useState 的值, useEffect 的依赖等)
  memoizedState: Hook1 -> Hook2 -> Hook3,

  // 专用链表：只存需要执行的副作用 (Effect Objects)
  updateQueue: {
    lastEffect: EffectNode // 指向环形链表的最后一个
  }
}

// 2. Hook 链表中的节点 (Hook Object)
const hook2 = {
  memoizedState: effect, // 指向下面的 Effect 对象
  next: hook3
}

// 3. Effect 链表中的节点 (Effect Object)
const effect = {
  tag: Passive, // 标记这是 useEffect (如果是 useLayoutEffect 则是 Layout)
  create: () => {}, // 你的回调函数
  destroy: () => {}, // 你的清除函数 (return 的那个)
  deps: [], // 依赖项数组
  next: nextEffect // 指向下一个副作用
}
```

### 双缓存技术（Double Buffering）

React 在渲染时会同时存在两颗 Fiber 树：

- **Current Tree**：当前屏幕上正在显示的内容所对应的 Fiber 树。

- **WorkInProgress Tree**：正在内存中构建的、下一次要更新的 Fiber 树。

所有更新发生时的计算工作都在 `WorkInProgress Tree` 上进行。React 会逐个处理 Fiber 节点，构建完整的 `WorkInProgress Tree`。一旦构建完成，React 会直接将 `WorkInProgress Tree` 切换为 `Current Tree`（这只是一个指针的切换，非常快），屏幕上就显示出了新的内容。

这种机制的好处是：

- 性能：在内存中构建整棵树，不会导致中间状态显示给用户，避免了 UI 闪烁。

- 复用：如果发生中断，可以轻松地丢弃未完成的 `WorkInProgress Tree`，而不会影响当前的 UI。

---

## Fiber 的渲染阶段（Phases）

Fiber 的渲染过程被分为了两个可中断的阶段：

1. **Reconciliation / Render Phase（协调/渲染阶段）**

   1. “递”阶段 \(BeginWork\)：

      - 首先判断当前节点自身是否需要更新，如果需要：

      - 对当前处理的Fiber节点，执行一个不可中断的原子操作：

        1. 执行组件：根据节点类型，对 FunctionComponent 执行函数，对 ClassComponent 调用 render，对 HostComponent 读取 children，获取其**新的子元素列表（Children）**。

        2. **调和（Diff）**：将**新的子元素列表与旧的子Fiber链表**进行比较。
        - 比较依据：基于 `key` 和 `type` 判断节点是否可复用。

        - 操作：决定是复用旧的Fiber、创建新的Fiber、还是标记删除旧的Fiber。

        - 生成新的子 Fiber：根据 Diffing 结果，生成或更新子节点对应的 Fiber 节点，并通过 `child`、`sibling`、`return` 指针连接起来，形成 WorkInProgress Tree（工作在进行中的树）。

          - 新增：在 WorkInProgress Tree 中为一个新的 React Element 创建一个全新的 Fiber 节点。这个新 Fiber 节点的 `effectTag` 会被标记为 `Placement`（二进制掩码值）。

          - 更新：React 不会创建新节点，而是复用（clone） 来自 Current Tree 的现有 Fiber 节点。复用时，React 会将新的 `props` 和其他更新信息（比如新的 `state`）设置到这个复用的 Fiber 节点上。这个被复用的 Fiber 节点的 `effectTag` 会被标记为 `Update`。

          > **“复用（clone）”**：React的源码中通常使用`useFiber`或`reconcileChildFibers`这样的函数来实现复用。其核心是`alternate`指针：
          >
          > 1. **创建新对象：**React会创建一个新的Fiber节点对象。这是必须的，因为`current`树和`workInProgress`树是两棵不同的树，它们通过Fiber节点的**`alternate`**指针相互指向对方。
          >
          > 2. **复用属性：**在创建这个新Fiber对象时，React不会从零开始设置所有属性。它会将旧Fiber节点（`current.alternate`）上的许多属性拷贝到新创建的这个Fiber节点上。最重要的复用属性是：
          >
          >    - **`stateNode`**：这是对实际底层实例（如DOM节点、Class组件实例）的引用。复用这个属性是性能优化的关键，它避免了不必要的DOM创建和销毁。
          >
          >    - `type`, `key`, `index` 等不变或可预测的属性。
          >
          > 3. 更新属性：同时，React会用新的数据更新新Fiber节点的属性，主要是：
          >
          >    - **`pendingProps`**：更新为新的props。
          >
          >    - `flags` \(旧称`effectTag`\)：根据Diff结果，可能会被标记为`Update`（如果需要更新属性）、`Placement`（如果是移动，也算一种复用）等。
          >
          >    - **`alternate`**：指向旧的Fiber节点（即`current`树上的对应节点），建立起双缓存的链接。
          - **删除：不会出现在新的 WorkInProgress Tree 的结构中！**React 会在**删除节点的父级 Fiber 节点**上添加一个 **`ChildDeletion`** 的 effect。同时，被删除的节点本身会被记录在父节点的一个特殊属性（如 `deletions` 数组）中，或者被添加到一个全局的删除效应链表中。
        3. 标记副作用：根据Diff结果，为当前这个Fiber节点本身打上副作用标签（如 `Update`, `Placement`）。

      - 完成后，算法会通过 `child` 指针向下处理第一个子节点。

      **Begin Work（递阶段）**

      **核心任务：为当前 Fiber 创建/更新子 Fiber 节点。**

      执行流程：

      1. 对当前 Fiber 节点调用不同的更新逻辑（根据类型 FunctionComponent / ClassComponent / HostComponent 等）；

      2. 获取新的子 React 元素（`element`）；

      3. 将新的子元素列表与旧 Fiber 链表进行 **Diff（Reconcile）**；

         - 比较 `key` 和 `type`；

         - 判断是否复用旧 Fiber；

         - 创建、删除或复用 Fiber 节点；

      4. 为每个新 Fiber 节点生成副作用标记（effectTag / flags）；

      5. 通过 `child`、`sibling`、`return` 指针连接 Fiber 节点；

      6. 向下递归（child）处理下一个 Fiber。

      🔁 **这一阶段是深度优先遍历的“递”过程**。

   2. “归”阶段 \(CompleteWork\)：

      - 当一个Fiber节点没有子节点，或其所有子节点都已处理完毕时，进入此阶段。

      - 对于HostComponent（DOM节点），会处理props的更新（例如，创建一个属性变化的更新队列），并根据变化情况为当前节点标记`Update`效应。

      - 收集副作用：将当前节点的副作用、以及其子节点们的副作用链表串联起来，形成一个以当前节点为根的完整子树**副作用链表（effect list）**。

      > **React18：**冒泡副作用标志：将子节点们的副作用标志（`flags`）和子树副作用标志（`subtreeFlags`） 合并到当前节点的`subtreeFlags`中。这使得React可以快速知晓一棵子树中是否存在需要执行的副作用。
      - 至此，当前这个Fiber节点在WorkInProgress树上的工作全部完成。

   **Complete Work（归阶段）**

   **核心任务：向上归并副作用，构建 effect list。**

   执行逻辑：

   1. 当 Fiber 没有子节点或子节点都处理完毕时进入归阶段；

   2. 执行 `completeWork`：

      - 对应 HostComponent（DOM 元素）时，准备更新的 props；

      - 计算是否需要生成真实 DOM；

   3. 将子节点的副作用（`subtreeFlags`）合并到父节点；

   4. 形成一条“effect list”，用于后续 Commit 阶段一次性提交。
   - 特点：这个阶段是**可中断的**。React 会为每个有变化的 Fiber 节点打上一个“副作用（Effect）”标签（比如 `Placement`, `Update`, `Deletion`），但并**不会执行任何实际的 DOM 操作**。这个过程是纯计算，在内存中进行，所以即使中断也不会影响用户看到的界面。

> 这一流程允许中断：Scheduler 决定什么时候中断（yield 给浏览器），下次继续从保存的 workInProgress 位置恢复。

> 将更新工作拆成一个个 **work unit（单个 Fiber）** 来处理；每个单元内部是同步执行的，但整体可以被调度器打断（yield），下次从中断点继续。
>
> **beginWork（递）**：根据 Fiber 类型执行对应逻辑（函数组件执行函数、类组件调用 render、HostComponent 读取 children），生成新的 children 描述；然后将新的 children 与旧的 child Fiber 链表做对比（基于 `key` \+ `type`），决定复用 / 创建 / 删除 Fiber。复用时会创建新的 workInProgress fiber 并用 `alternate` 指向 current。
>
> **completeWork（归）**：当一个 Fiber 的所有子节点处理完后，合并子节点的副作用链表（effect list），把当前节点的 flags/subtreeFlags 与子树的 flags 合并，形成以当前节点为根的副作用列表。
>
> 在 render phase 只做计算与标记（比如给 Fiber 打 `Placement`/`Update`/`Deletion` 等标志），不会真正触碰 DOM 或执行副作用（所以 render 中不要执行会改 DOM / 发网络等副作用操作）。

**Render 阶段的输出**

当整棵 Fiber 树都构建完成后：

- 得到一棵 **`workInProgress tree`**；

- 收集好所有带副作用的 Fiber 节点；

- 暂存于内存中，尚未更新 DOM。

2. **Commit Phase（提交阶段）**

   - 工作内容：这个阶段是**同步的、不可中断**的。React 会遍历在 `Render Phase` 中收集到的所有带有“副作用”的 Fiber 节点（这个列表被称为 `Effect List`），并一次性将它们应用到真实的 DOM 上。

   - **before mutation phase**

     - 触发 `getSnapshotBeforeUpdate()`

     - 在 DOM 改变之前读取布局信息

   - **mutation phase**

     - 根据 effect list 遍历 Fiber 节点

     - 对应 DOM 操作（插入、更新属性、删除）

     - 对于函数组件，执行 `useLayoutEffect` Hook 的清理函数（即 `useLayoutEffect` 返回的函数）。

     - 在这个阶段结束时，**WorkInProgress Tree（刚构建好的新树）** 会正式变为 **Current Tree（代表当前屏幕状态）**。

   - **layout phase**

     - 同步执行 `useLayoutEffect` 回调和 `componentDidMount/Update`（此时 DOM 已是最新，绘制尚未发生）。这些会阻塞浏览器绘制。

   - **useEffect**

     1. 调度在 **Before Mutation**：在 `before mutation` 阶段，React 会调度（安排）所有被标记的 `useEffect`。

     2. **执行在绘制之后**：这些被调度的 `useEffect` 回调函数不会在提交阶段的任何子阶段同步执行。它们会被放入一个任务队列，在浏览器完成本次循环的布局和绘制（Paint）之后，再异步执行。

     3. 这避免了副作用函数阻塞浏览器的绘制过程。

   - 特点：因为这个阶段会实际改变 UI，所以必须快速且一气呵成，否则会给用户造成视觉上的不一致。

3. **只能在 Commit 阶段执行的操作**

- **访问真实 DOM**（read/write DOM）

- **执行副作用**：

  - Class 组件生命周期：`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`

  - Function 组件：`useLayoutEffect` 回调

- **DOM 测量**：`getSnapshotBeforeUpdate`

> 原因：Render phase 可中断，如果在此阶段修改 DOM 或副作用，会导致状态不一致或被中断丢失

---

### 阶段一：更新的触发与调度 \(The Trigger \& Schedule Phase\)

一切始于一个需要更新的信号。

1. **触发 \(Trigger\):**

   - **状态更新:** 组件内部调用了 `useState` 返回的 `dispatch` 函数 \(例如 `setCount`\)。

   - **Props 更新:** 父组件重新渲染，导致子组件接收到新的 `props`。

   - **根节点渲染:** `ReactDOM.render` 或 `root.render`被调用。

2. **创建更新对象 \(Create Update\):**

   - React 会创建一个 `Update` 对象。这个对象封装了更新的信息（例如，`useState` 的 `payload` 或 `root.render` 的 `element`）。

3. **入队 \(Enqueue\):**

   - 这个 `Update` 对象被添加（入队）到目标 `FiberNode`（即触发更新的组件对应的 Fiber 节点）的 `updateQueue`（更新队列）中。对于 `useState`，这个队列是挂载在 `Hook` 对象上的。

4. **调度 \(Schedule\):**

   - React 通知其内部的 **Scheduler \(调度器\)** 有一个新的更新任务。

   - Scheduler 会根据更新的**优先级**（例如，用户输入是高优，数据获取是低优）来安排这个任务。

   - 调度器会在未来的某个时间点（例如 `requestIdleCallback` 或 `MessageChannel`）获得执行权，并开始执行“渲染阶段”。

---

### 阶段二：渲染阶段 \(The Render Phase\)

这是 React 的核心协调 \(Reconciliation\) 过程。此阶段**异步、可中断**。它的唯一目标是构建一棵新的“草稿”树，即 **`workInProgress`**** \(WIP\) 树**，并找出所有必要的变更。

此阶段主要由两个函数循环驱动：`beginWork`（向下）和 `completeWork`（向上）。

#### A\. 向下遍历：`beginWork`

此过程从根节点（`HostRootFiber`）开始，进行深度优先遍历。

1. **`performUnitOfWork`**** \(执行工作单元\):**

   - 循环从调度器获取一个 `FiberNode` 作为 `unitOfWork`（工作单元）。

2. **创建/复用 WIP Fiber:**

   - React 检查 `current` 树（当前屏幕上显示的树）中是否存在此 `FiberNode` 的 **`alternate`**（对应节点）。

   - **如果存在 \(更新\):** React 会调用 `createWorkInProgress`，**克隆** `current` Fiber 来创建一个 `workInProgress` Fiber。这保证了 `current` 树在渲染阶段不被修改（不可变性）。

   - **如果不存在 \(挂载\):** React 会根据 `Element` 蓝图创建一个全新的 `FiberNode`。

3. **`beginWork`**** \(开始工作\):**

   - 这是 `render` 阶段的核心 `switch` 语句，根据 `Fiber.tag`（类型）执行不同逻辑：

   - **对于 ****`FunctionComponent`****:**

     1. **处理 Hooks:** React 调用 `renderWithHooks`。

     2. `renderWithHooks` 会遍历 `current` Fiber 上的 `memoizedState`（Hook 链表），并**克隆**到 `wip` Fiber 上。

     3. 当遇到 `useState` 时，它会检查此 Hook 的 `updateQueue`，计算所有排队的 `Update`，得出**新状态**，并将其存储在 `wip` Fiber 的 `Hook.memoizedState` 中。

     4. 当遇到 `useEffect` 或 `useLayoutEffect` 时，它会比较新旧 `deps`（依赖数组）。如果 `deps` 发生变化，它会给 `wip` Fiber **添加一个 ****`flags`****（副作用标记）**（例如 `Passive` 或 `Layout`）。

     5. **执行组件:** React **执行你的函数组件代码**，获取返回的 `children` \(JSX/Elements\)。

     6. **Diff 子节点:** React 调用 `reconcileChildren`。

   - **对于 ****`HostComponent`**** \(原生 DOM 节点, e\.g\., 'div'\):**

     1. 它不需要执行代码，直接查看 `wip.pendingProps` 中的 `children`。

     2. **Diff 子节点:** React 调用 `reconcileChildren`。

4. **`reconcileChildren`**** \(协调子节点 \- Diffing 算法\):**

   - 这是 `beginWork` 的最后一步，也是 Diffing 的发生点。

   - React 对比 `current.child` \(旧 Fiber 子节点\) 和 `wip.pendingProps.children` \(新 Element 子节点\)。

   - **Diffing 逻辑:**

     - **单个节点 \(类型/Key 相同\):** 复用 `current` Fiber，克隆为 `wip` Fiber，标记为 `Update`（如果 `props` 变了）。

     - **单个节点 \(类型/Key 不同\):** 标记 `current` Fiber 为 `Deletion` \(删除\)，并为 `newElement` 创建一个新 Fiber，标记为 `Placement` \(插入\)。

     - **列表节点 \(有 Key\):**

       1. **第一轮 \(按索引\):** 遍历新旧列表，复用 `key` 和 `type` 相同的节点。

       2. **第二轮 \(按 Key\):** 将剩余旧 Fiber 放入 `Map(key -> Fiber)`。遍历剩余新 Element，在 Map 中查找。

       3. **找到:** 复用 Map 中的 Fiber，并标记为 `Placement` \(因为它移动了\)。

       4. **未找到:** 为新 Element 创建 Fiber，标记为 `Placement`。

       5. **Map 中剩余:** Map 中所有剩下的旧 Fiber 都被标记为 `Deletion`。

   - **返回:** `beginWork` 返回 `wip.child` \(第一个子 Fiber\)，作为 `performUnitOfWork` 循环的下一个工作单元。

5. **循环:**

   - 如果 `beginWork` 返回 `null`（即当前 `wip` Fiber 没有子节点），则“向下”遍历到达叶子节点，开始“向上”归并。

#### B\. 向上归并：`completeWork`

当一个 `FiberNode` 的 `beginWork` 完成（或其没有子节点）时，`performUnitOfWork` 会调用 `completeWork`。

1. **`completeWork`**** \(完成工作\):**

   - 这是一个 `switch` 语句，主要处理 `HostComponent` 和 `HostText`。

   - **对于 ****`HostComponent`**** \(e\.g\., 'div'\):**

     - **挂载 \(current === null\):**

       1. 调用 `document.createElement()` **创建真实 DOM 节点**。

       2. 将 DOM 节点挂载到 `wip.stateNode`。

       3. 将所有已完成的子 DOM 节点 \(`child.stateNode`\) `appendChild` 到这个新 DOM 节点上。

       4. 处理 `props`（例如设置 `className`, `style` 等）。

     - **更新 \(current \!== null\):**

       1. 复用 `current.stateNode` \(真实 DOM 节点\)。

       2. `diffProperties` \(Diff 新旧 props\)。

       3. 如果 `props` 有差异，将差异编译成一个 `updatePayload` 数组 \(例如 `['className', 'new-class']`\)。

       4. 将 `updatePayload` 挂载到 `wip.updateQueue`。

       5. 在 `wip.flags` 中添加 `Update` 标记。

   - **对于 ****`HostText`**** \(文本节点\):**

     - **挂载:** 调用 `document.createTextNode()` **创建真实 DOM 文本节点**，存入 `wip.stateNode`。

     - **更新:** 比较新旧文本。如果不同，添加 `Update` 标记。

2. **构建 EffectList \(副作用链表\):**

   - `completeWork` 会检查当前 `wip` Fiber 是否有 `flags` \(副作用标记\)。

   - 它还会检查其**所有子节点**是否有 `flags` \(存储在 `subtreeFlags` 中\)。

   - 如果当前 Fiber 或其子树有 `flags`，它会将这个 Fiber 添加到一个**扁平的 ****`effectList`**** 链表**中。

   - 这个链表最终会被挂载到 `HostRootFiber` \(根节点\) 上。

3. **归并 \(Return\):**

   - `completeWork` 完成后，循环会检查 `wip.sibling` \(兄弟节点\)。

   - 如果存在兄弟节点，下一个 `performUnitOfWork` 将处理兄弟节点。

   - 如果不存在，循环将继续处理 `wip.return` \(父节点\) 的 `completeWork`。

   - 当 `completeWork` 最终到达 `HostRootFiber` 时，“渲染阶段”结束。

**渲染阶段产物:**

1. 一棵完整的 `workInProgress` 树 \(现在是 `finishedWork`\)。

2. 一个挂载在 `finishedWork` 根节点上的 `effectList` \(扁平链表\)，精确记录了所有需要执行 DOM 操作的 Fiber 节点。

---

### 阶段三：提交阶段 \(The Commit Phase\)

这是 React **同步、不可中断**的阶段。React 拿到 `finishedWork` 树和 `effectList`，开始对真实 DOM 进行操作。

此阶段分为三个子阶段。

1. 突变前 \(Before Mutation\)

- **目的:** 在 DOM 变更前读取 DOM 状态。

- **动作:** React 遍历 `effectList`，执行所有 `useLayoutEffect` 的**清理函数**（上一次的 `return`），并调用类组件的 `getSnapshotBeforeUpdate()`。

2. 突变 \(Mutation\)

- **目的:** 执行所有 DOM 的增、删、改。

- **动作:** React 再次遍历 `effectList`，根据 `flags` 执行操作：

  - **`Placement`**** \(插入\):** 调用 `parentNode.appendChild()` 或 `insertBefore()` 将 `fiber.stateNode` \(真实 DOM\) 插入到 DOM 树中。

  - **`Update`**** \(更新\):**

    - 对于 `HostText`，直接修改 `textNode.nodeValue`。

    - 对于 `HostComponent`，读取 `fiber.updateQueue` \(在 `completeWork` 中生成的 `updatePayload`\)，并循环执行 DOM 属性设置（例如 `domElement.className = ...`）。

  - **`Deletion`**** \(删除\):** 调用 `parentNode.removeChild()` 将 `fiber.stateNode` 从 DOM 树中移除。同时，**同步**调用此 Fiber 及其子树中所有 `useEffect` 的**清理函数**。

3. 布局 \(Layout\)

- **目的:** DOM 变更已完成，浏览器重绘前。

- **动作:**

  1. **双缓冲切换:** `FiberRoot.current` 指针**从旧 ****`current`**** 树切换到 ****`finishedWork`**** 树**。`finishedWork` 树现在正式成为新的 `current` 树。

  2. React 再次遍历 `effectList`，执行所有 `useLayoutEffect` 的**创建函数**（回调）和类组件的 `componentDidMount` / `componentDidUpdate`。

---

### 阶段四：被动效果阶段 \(The Passive Effects Phase\)

- **目的:** 在“提交阶段”和浏览器重绘**之后**，异步执行副作用。

- **动作:**

  1. React 调度一个**低优先级**任务。

  2. 此任务触发时，React 会遍历一个**单独的 ****`passiveEffect`**** 链表**（在“渲染阶段”由 `Passive` 标记生成）。

  3. **`useEffect`**** 清理:** 执行所有在“突变”阶段未被清理的 `useEffect` 的**清理函数**（上一次的 `return`）。

  4. **`useEffect`**** 执行:** 执行所有 `useEffect` 的**创建函数**（回调）。

---

**阶段一：渲染阶段 \(Render Phase\)**

- **目标：** 计算出需要对 UI 进行哪些更改。

- **特性：** 这个阶段是**异步的、可中断的**。

这是 React 最核心、最复杂的部分。它本身就是一个完整的、分为“递进”\(Begin\)和“归并”\(Complete\)两个子阶段的遍历过程：

1. **向下递进阶段 \(Begin Work\):**

   - 这是 React 从根节点开始，进行**深度优先遍历**的阶段。

   - **克隆与复用：** React 会尝试复用 `current` 树（当前屏幕对应的树）上的 Fiber 节点来创建 `workInProgress` 树的节点。

   - **执行组件与 Hooks：**

     - 当遍历到函数组件（FunctionComponent）时，React 会调用 `renderWithHooks`。

     - **`useState`****：** 在这里，React 会处理 `useState` 的更新队列（在挂载时是设置初始值）。

     - **`useEffect`****：** 它会比较 `useEffect` 的新旧依赖（挂载时视为“变化”），并给这个 Fiber 节点打上一个 `Passive`（被动副作用）的**副作用标记 \(Flags\)**。

     - **执行组件：** 然后，React **执行我们的组件函数**，获取返回的 JSX（React Elements）。

   - **协调 \(Reconciliation / Diffing\)：**

     - 这是 `beginWork` 阶段最关键的一步。React 会拿新返回的 JSX，与 `current` 树上*旧的*子 Fiber 节点（挂载时为 `null`）进行**Diffing**。

     - **生成标记 \(Flags\)：** Diffing 的结果是生成新的子 Fiber 节点，并为它们打上**副作用标记 \(Flags\)**。例如：

       - 因为是挂载，所有新节点都会被标记为 `Placement`（插入）。

       - （如果是在更新中，这里还会标记 `Update`（更新）或 `Deletion`（删除））。

   - **遍历：** `beginWork` 会返回它的第一个子节点，作为下一个工作单元，继续向下遍历。

2. **向上归并阶段 \(Complete Work\):**

   - 当一个 Fiber 节点没有更多子节点时（即“递进”到了叶子节点），“向上归并”阶段就开始了。

   - **创建 DOM 实例：**

     - **这是真正创建 DOM 节点的地方。** 当 `completeWork` 处理一个 `HostComponent`（如 `<div>`）的 Fiber 节点时，它会调用 `document.createElement()` 来**在内存中创建**真实的 DOM 节点，并将这个 DOM 节点挂载到 Fiber 的 `stateNode` 属性上。

     - 它还会把它所有*已完成*的子 DOM 节点 `appendChild` 到自己身上。

   - **收集副作用列表 \(Effect List\)：**

     - 这是另一个至关重要的工作。在“归并”回父节点时，`completeWork` 会检查当前 Fiber 节点是否有 `flags`（副作用标记）。

     - 它会把**所有**带有 `flags` 的 Fiber 节点（包括它自己和它的子树）收集到一个**扁平的链表**中，这个链表就叫**副作用列表 \(Effect List\)**。

     - 这个列表会不断向上冒泡，最终挂载到根节点（`HostRootFiber`）上。

**此阶段的产物：** 所以，当‘渲染阶段’结束时，React 实际上已经完成了两件大事：

1. 在内存中构建了一棵**完整的 ****`workInProgress`**** 树**，这棵树上的 `HostComponent` 节点已经创建并持有了**真实的 DOM 节点**。

2. 生成了一个**副作用列表 \(Effect List\)**，这是一个精确的“待办事项”清单，告诉‘提交阶段’需要对 DOM 执行哪些插入操作。

**阶段二：提交阶段 \(Commit Phase\)**

- **目标：** 将计算出的变更**应用**到真实 DOM 上。

- **特性：** 这个阶段是**同步的、不可中断的**，以保证 UI 的一致性。

这个阶段也分为两个子步骤：

1. **DOM 突变 \(Mutation\)：**

   - React 遍历在“渲染阶段”生成的**副作用列表**（Effect List）。

   - 它执行所有 `Placement`（插入）操作，调用 `parentNode.appendChild()`，将所有在内存中创建的 DOM 节点**一次性**地、**同步**地挂载到真实 DOM 树上。

   - **在这一步完成后，用户就能在屏幕上看到 UI 了。**

2. **布局 \(Layout\)：**

   - 在 DOM 更新*之后*，浏览器重绘*之前*。

   - React 会**同步**执行所有 `useLayoutEffect` 的回调。这对于需要在 DOM 渲染后立即测量布局的逻辑非常重要。

**阶段三：被动副作用阶段 \(Passive Effect Phase\)**

- **目标：** 执行那些不需要阻塞浏览器的副作用。

- **特性：** 这个阶段是**异步的**。

1. **异步调度：** 在“提交阶段”完成、浏览器绘制了屏幕之后，并且在浏览器处于空闲时。

2. **执行 ****`useEffect`****：** React 会遍历并**异步**执行所有 `useEffect` 的回调函数。

3. **用途：** 这是执行数据获取（fetch）、设置订阅或操作非 React 管理的 DOM 的最佳时机，因为它完全不会阻塞用户的交互和浏览器渲染。

**总结一下：** 整个挂载流程就是：

1. **Render 阶段（异步）**：React 在内存中“排练”和“计算”出所有变更，创建 DOM 节点，并生成副作用列表。

2. **Commit 阶段（同步）**：React 将所有变更“提交”到真实 DOM，并同步运行 `useLayoutEffect`。

3. **Passive 阶段（异步）**：最后，React 异步运行 `useEffect`。 ”

## Scheduler、Lanes 与优先级（如何决定先做谁）

为了决定**“现在做哪些 work”**，React 引入了两个重要部分：

1. **Scheduler（调度器）** — React 的调度层（部分基于 `scheduler` 包）用来安排任务在主线程上的执行与中断时机（例如是否要在下一帧继续、是否要立即执行等）。它使用浏览器 API（`requestIdleCallback` / `postMessage` / `setTimeout` 等 polyfill 实现）来实现时间切片。

2. **Lanes（位掩码优先级）** — React 用一个位掩码集合（lanes）来表示不同优先级与一组更新。每个更新会被分配**一个 lane**（比如 Sync / Input / Transition / Idle 等）；当调度时，会根据当前 pending 的 lanes 决定 render 的优先级与是否可以中断/推迟。Lanes 的设计使得 React 能把“哪些更新必须现在完成”与“哪些可以延后”编码为一个位运算问题，便于合并与比较。

> - 每个更新被赋予一个优先级（lane）；
>
> - 高优先级任务（如用户输入）可打断低优先级任务（如列表渲染）；
>
> - 低优先级任务会被“挂起”，待空闲时恢复。

---

## 与 React 18 并发模式（Concurrent Rendering）的关系

- Fiber 是并发模式的基础设施；

- React 18 引入的 **Concurrent Features（如 ****`startTransition`****、****`Suspense`****）**，正是依赖 Fiber 的可中断机制；

- 这让 React 能够在用户交互中优先响应，而不是卡在渲染上。

# React 如何实现优先级管理

## 优先级的表达：Lane 模型（位运算）

在 React 16 时代，优先级是用 `expirationTime`（过期时间）来表示的，这只是一个数字。但 React 17 改用了 **Lanes（车道）模型**，使用 31 位的二进制数来表示。

**为什么要用二进制？**

因为位运算（Bitwise Operation）极快，且能方便地表示“批处理”和“子集”的概念。

- **数值越小，优先级越高**（通常二进制位越靠右，索引越小）。

- **占位：**

```JavaScript
export const SyncLane = /* */ 0b0000000000000000000000000000001; // 1 (最高优，同步，如 onClick)
export const InputContinuousLane = /* */ 0b0000000000000000000000000000100; // 4 (连续输入，如 onScroll)
export const DefaultLane = /* */ 0b0000000000000000000000000010000; // 16 (默认，如 useEffect)
export const TransitionLane = /* */ 0b0000000000000000000000000100000; // 32 (低优，如 useTransition)
```

**它是如何工作的？**

当一个更新发生时（比如你调用 `setState`），React 会根据当前的上下文（是点击事件触发的？还是 `startTransition` 包裹的？）给这次更新分发一个 Lane。

这个 Lane 会被合并（`lane | lanes`）到 Fiber 节点的 `lanes` 字段中。React 在遍历树的时候，通过位与运算（`&`）就能瞬间知道这个节点有没有需要处理的高优先级更新。

---

## 动力的来源：Scheduler（调度器）

有了 Lane 标记优先级还不够，还需要一个引擎来决定“什么时候执行什么 Lane”。这就是 **Scheduler** 包的作用。

Scheduler 是一个独立的包，它模拟了浏览器的 `requestIdleCallback`，但更稳定、更强。

**核心机制：时间切片（Time Slicing）与 MessageChannel**

React 利用 **MessageChannel**（宏任务）来实现时间切片：

1. **任务切分：** React 现在的渲染过程（Render Phase）是可中断的 `while` 循环。

2. **5ms 法则：** Scheduler 维护了一个 `shouldYield()` 方法。在 `workLoop` 中，React 每处理完一个 Fiber 节点，都会问一下 Scheduler：

> _“我现在已经运行了多久了？超过 5ms 了吗？用户有操作吗？”_

3. **让出主线程：**

   - 如果没超时：继续处理下一个 Fiber。

   - 如果超时了（\>5ms）：React 暂停手头的工作，记录当前处理到哪个 Fiber，通过 `MessageChannel` 发起一个宏任务，把自己排到浏览器事件循环的队尾，把主线程让给浏览器去绘制或响应用户点击。

---

## 优先级映射与调度流程

当 React 产生更新时，流程如下：

1. **产生更新：** 用户点击按钮。

2. **分配 Lane：** React 识别出这是 `SyncLane`（高优）。

3. **请求调度：** React 调用 Scheduler 的 `scheduleCallback`，并将 React 的 Lane 转换为 Scheduler 的优先级（Immediate, UserBlocking, Normal, Low, Idle）。

**关键点：高优先级如何插队（Preemption）？**

这是最精彩的部分。假设 React 正在渲染一个低优先级的列表（TransitionLane）。

1. **正在进行中：** Render 循环正在处理列表的第 50 个 Item。

2. **插入变故：** 用户突然点击了一个按钮（SyncLane）。

3. **检测：** 在下一次 `workLoop` 的迭代中，或者在 Scheduler 的回调中，React 发现根节点出现了一个新的、优先级更高的 Lane。

4. **打断（Interruption）：**

   - React **直接丢弃** 那个正在渲染列表的“半成品” Fiber 树（因为是双缓存，旧树还在，页面不会崩）。

   - React 调整全局指针，把当前处理的 Lane 切换为 SyncLane。

   - **重置** 渲染流程，从根节点开始，优先处理点击事件。

5. **恢复：** 点击事件处理完（Commit 到屏幕上）后，Scheduler 发现还有一个低优先级的任务没做完，于是重新调度，再次开始渲染那个列表。

---

## 饥饿问题（Starvation）

如果一直有高优先级任务插队（比如用户一直疯狂移动鼠标），低优先级任务（比如数据列表渲染）岂不是永远执行不了？

React 考虑到了这点：

- 每个 Lane 都有一个 **过期时间（Expiration Time）**。

- 如果一个低优先级任务被插队太久，超过了它的过期时间，它会被强制提升为 **过期任务（Expired Lane）**。

- 过期任务会以同步（Sync）的方式立即执行，不再允许被打断，从而保证它最终一定会被渲染。

### 总结

React 的优先级管理 = **数据结构 \(Lanes\)** \+ **调度引擎 \(Scheduler\)** \+ **中断机制 \(Fiber架构\)**。

- **Lanes** 标记了“这件事有多急”。

- **Scheduler** 提供了“暂停和恢复”的能力（时间切片）。

- **Fiber** 提供了“丢弃草稿重头再来”的数据结构基础。

这三者结合，让 React 实现了“在渲染页面的同时，还能灵敏响应用户输入”。

# ReactDOM\.render、createRoot、hydrateRoot

## React 17 及以前：`ReactDOM.render()`

在 **React 17 及以前**，我们使用：

```JavaScript
ReactDOM.render(<App />, document.getElementById('root'))
```

**特点：**

- 使用 **同步渲染（Legacy 模式）**。

- 一旦开始渲染，就会阻塞主线程直到整个组件树渲染完成。

- 不支持 React 18 的并发特性（如自动批处理、`useTransition`、Suspense 更精细的控制等）。

- 在 SSR（服务端渲染）中，对应的函数是 `ReactDOM.hydrate()`。

## React 18 引入：`createRoot()`

React 18 推出了新的根 API：

```JavaScript
import { createRoot } from 'react-dom/client'

const root = createRoot(document.getElementById('root'))
root.render(<App />)
```

**特点：**

- 启用了 **Concurrent Rendering（并发渲染）**。

- 渲染过程可中断、可恢复、可调度。

- 支持以下新特性：

  - **自动批处理（Automatic Batching）**

  - **`useTransition`****、****`useDeferredValue`** 等并发特性

  - **流式 SSR（Streaming SSR）**

- `createRoot` 会创建一个 **并发根（Concurrent Root）**，替代老的同步根。

## React 18 的 SSR：`hydrateRoot()`

React 18 中，服务端渲染的入口函数从 `hydrate()` 改为

```JavaScript
import { hydrateRoot } from 'react-dom/client'

hydrateRoot(document.getElementById('root'), <App />)
```

**特点：**

- 用于「**同构渲染（SSR \+ 客户端激活）**」。

- 客户端会“复用”服务端生成的 HTML，而不是重新创建 DOM。

- 与 `createRoot` 一样，`hydrateRoot` 也启用了并发模式。

- 支持 Suspense 的流式服务器渲染（Streaming Hydration）。

# 受控组件和非受控组件

[React核心理念与API](https://ucnjui1gbcuc.feishu.cn/wiki/FQONwDnjMikpHjkWqIucrrxEn1g#share-IlDbd2JmGo9IJSxYGuFcPSRGnkc)

# 生命周期

[React核心理念与API](https://ucnjui1gbcuc.feishu.cn/wiki/FQONwDnjMikpHjkWqIucrrxEn1g#share-I3pjdZPssoT5QExp0ZLcmumLnyh)

# 性能优化

## 减少不必要的渲染 \(Runtime Optimizations\)

React 默认在父组件重新渲染时，其所有子组件也会重新渲染。大部分性能问题都源于不必要的重复渲染。

### 不必要的渲染场景

1. **父组件更新，子组件无 props / 状态变化**

   - 父组件因自身状态更新触发重渲染时，即使子组件的 `props` 和自身状态都未变化，默认也会跟随重渲染

2. **Context\.Provider 的 value 变化，无关子组件重渲染**

   - 当 `Context.Provider` 的 `value` 变化时，所有消费该 Context 的子组件（无论是否使用 `value` 中的变化部分）都会重渲染。

### 优化类组件 \(Class Components\)

- `shouldComponentUpdate`：

  - 这是类组件中最直接的优化手段。通过比较当前的 `props` 和 `nextProps`、当前的 `state` 和 `nextState`，手动决定组件是否需要重新渲染。

  - 示例：如果组件只关心 `userId` 这个 prop，可以只在 `nextProps.userId !== this.props.userId` 时返回 `true`。

- `React.PureComponent`：

  - 如果不想手动实现 `shouldComponentUpdate`，可以让组件继承 `React.PureComponent`。

  - `PureComponent` 会对 `props` 和 `state` 进行一层**浅比较（Shallow Comparison）**，如果所有属性和状态都相同，则阻止渲染。

  - 陷阱：浅比较意味着如果你传递了复杂的、嵌套的对象或数组，或者传递了每次都在变化的回调函数（如 `onClick={() => {...}}`），它可能会无法正确判断，导致该更新时不更新，或不该更新时反而更新了。

### 优化函数组件 \(Function Components\)

- `React.memo`：

  - 相当于函数组件版的 `PureComponent`。它是一个**高阶组件（HOC）**，会记忆（ memoize ）上次渲染的结果，仅在 props 发生变化时才重新渲染。

  - **默认浅比较**：`const MyComponent = React.memo(function MyComponent(props) { ... });`

  - 自定义比较：你可以提供第二个参数，自定义比较逻辑，类似于 `shouldComponentUpdate`（但返回值的意义相反：返回 `true` 表示不更新，`false` 表示要更新）。

  ```JavaScript
  const MyComponent = React.memo(
    function MyComponent(props) { ... },
    (prevProps, nextProps) => {
      // 只有当 `userId` 变化时才重新渲染
      return prevProps.userId === nextProps.userId;
    }
  );
  ```

- `useMemo`：

  [React核心理念与API](https://ucnjui1gbcuc.feishu.cn/wiki/FQONwDnjMikpHjkWqIucrrxEn1g#share-UAT0dT5f7of2M6xblg7cPf8hnWc)

  - 用于记忆昂贵的计算结果，避免在每次渲染时都重新计算。

  - 示例：`const sortedList = useMemo(() => myList.sort(...), [myList]);`

  - 它接受一个创建函数和一个依赖项数组。只有当依赖项发生变化时，才会重新计算值。

- `useCallback`：

  [React核心理念与API](https://ucnjui1gbcuc.feishu.cn/wiki/FQONwDnjMikpHjkWqIucrrxEn1g#share-Vt9JdOTBuo44sdxoQ3Ec5Taxnvg)

  - 用于记忆回调函数，避免因为函数引用变化导致子组件不必要的重新渲染。

  - **问题根源：在函数组件中，****`const handleClick = () => { ... }`**** 在每次渲染时都会创建一个全新的函数引用。如果将它传递给被 ****`React.memo`**** 优化的子组件，子组件还是会认为 props 发生了变化。**

  ```JavaScript
  const handleClick = useCallback(() => {
    // 处理点击
  }, [dependency]); // 只有当 `dependency` 变化时，`handleClick` 的引用才会改变
  ```

  - `useCallback(fn, deps)` 等价于 `useMemo(() => fn, deps)`。

---

## 延迟加载与懒加载

1. **组件懒加载**

```JavaScript
const LazyComponent = React.lazy(() => import('./HeavyComponent'));
<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

2. **图片与资源懒加载**

- 对长列表或图像多的页面使用懒加载。

- 可用 `IntersectionObserver` 或第三方库。

---

## React 底层优化机制

1. **Fiber 架构**

   - 将渲染任务拆分为小单元（Unit of Work）。

   - 可中断渲染，优先更新高优先级任务。

   - Diff 阶段生成更新队列，不直接操作 DOM。

2. **Diff 算法优化**

   - 对于同级节点，先比较类型再比较 key。

   - key 相同的节点会复用，避免销毁/重建。

3. **事件委托**

   - React 通过事件代理减少事件绑定数量，提高性能。

4. **批量更新**

   - Fiber 会收集多个更新，统一在 commit 阶段一次性更新 DOM。

# React中Ref几种创建方式

> Ref 是一种用于访问 DOM 节点或 React 元素实例的方式

## `useRef` Hook \(函数组件 \- 推荐方式\)

- `useRef` 返回的对象在组件的整个生命周期内保持不变（每次渲染返回的都是同一个对象）。

- 修改 `.current` 属性的值不会引发组件重新渲染。这是它与 `useState` 的根本区别。

- `useRef` 返回一个可变的 ref 对象，其 `.current` 属性被初始化为传入的参数（`initialValue`）。

```JavaScript
import React, { useRef, useEffect } from 'react';

function TextInputWithFocusButton() {
  // 1. 创建一个 ref
  const inputEl = useRef(null);

  const onButtonClick = () => {
    // 3. 通过 .current 访问 DOM 节点
    inputEl.current.focus();
  };

  return (
    <>
      {/* 2. 将 ref 附加到 React 元素 */}
      <input ref={inputEl} type="text" />
      <button onClick={onButtonClick}>Focus the input</button>
    </>
  );
}
```

---

## `createRef` \(类组件 \& 函数组件\)

`createRef` 主要在类组件中使用，但它也可以在函数组件中使用（不过不如 `useRef` 常用，因为函数组件每次渲染都会创建一个新的 ref 对象）。

```JavaScript
class MyComponent extends React.Component {
  constructor(props) {
    super(props);
    // 在构造函数中创建 ref
    this.myRef = React.createRef();
  }

  componentDidMount() {
    // 通过 .current 访问
    this.myRef.current.focus();
  }

  render() {
    // 将 ref 附加到 React 元素
    return <input ref={this.myRef} />;
  }
}
```

---

## 回调 Refs \(Callback Refs\) \(一种更古老和灵活的方式\)

这是一种更直接控制如何设置 ref 的方法。它不是传递一个由 `useRef` 或 `createRef` 创建的 ref 对象，而是传递一个函数。

这个函数接收 React 组件实例或 HTML DOM 元素作为其参数，并将其挂载到自定义的属性上。

```JavaScript
class CustomTextInput extends React.Component {
  constructor(props) {
    super(props);
    this.textInput = null; // 先初始化为null

    // 这个函数将被赋给元素的 ref 属性
    this.setTextInputRef = (element) => {
      this.textInput = element; // 将DOM元素直接赋值给组件的实例属性
    };
  }

  componentDidMount() {
    // 现在可以直接通过 this.textInput 访问DOM节点
    if (this.textInput) {
      this.textInput.focus();
    }
  }

  render() {
    return (
      <input
        type="text"
        ref={this.setTextInputRef} // 将函数赋值给 ref
      />
    );
  }
}
```

```JavaScript
function MeasureExample() {
  const [height, setHeight] = useState(0);

  const measuredRef = useCallback((node) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height);
    }
  }, []); // 依赖项数组为空，确保回调不会改变

  return (
    <>
      <h1 ref={measuredRef}>Hello, world</h1>
      <h2>The above header is {Math.round(height)}px tall</h2>
    </>
  );
}
```

---

## `forwardRef` \+ `useRef`/`createRef` \(转发 Refs\)

以上三种方式都是用于访问本组件内部的元素。如果你想要在父组件中访问子组件内部的 DOM 节点，就需要使用 `React.forwardRef`。

```JavaScript
// 使用 React.forwardRef 包裹子组件
const FancyButton = React.forwardRef((props, ref) => {
  // 第二个参数 `ref` 是父组件传递下来的
  return (
    <button ref={ref} className="FancyButton">
      {/* 子组件的其它内容 */}
      {props.children}
    </button>
  );
});

export default FancyButton;
```

```JavaScript
import React, { useRef } from 'react';
import FancyButton from './FancyButton';

function App() {
  // 父组件创建一个 ref
  const buttonRef = useRef(null);

  const handleClick = () => {
    // 现在可以通过 buttonRef.current 直接访问子组件内部的 <button> DOM 节点！
    buttonRef.current.focus();
  };

  return (
    <div>
      {/* 将 ref 传递给子组件 */}
      <FancyButton ref={buttonRef}>Click me!</FancyButton>
      <button onClick={handleClick}>Focus the Fancy Button</button>
    </div>
  );
}
```

---

## `useImperativeHandle()`（自定义暴露给父组件的 Ref）

- **特点**：

  - **必须与 ****`forwardRef`**** 搭配使用**

  - 控制父组件能访问的实例方法（而不是直接暴露整个 DOM）

```JavaScript
import React, { useRef, useImperativeHandle, forwardRef } from 'react';

const Child = forwardRef((props, ref) => {
  const inputRef = useRef();

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus()
  }));

  return <input ref={inputRef} />;
});

function MyComponent() {
  const childRef = useRef();

  return (
    <>
      <Child ref={childRef} />
      <button onClick={() => childRef.current.focus()}>Focus</button>
    </>
  );
}
```

# 组件间通信

1. 父子组件通信

- 父传子：直接通过props

- 子传父：通过 props 回调

2. 兄弟组件通信

- 状态提升到最近的公共父组件

3. 祖孙/跨层级通信

- React Context

- 全局状态库 Redux

# 组件复用

1. **高阶组件（Higher\-Order Component，HOC）**

- **定义：**HOC 是一个函数，它接收一个组件作为参数，并返回一个 “增强 / 包装后的新组件”。核心是通过 “包装” 实现逻辑复用，类似 “装饰器模式”。

- 将复用逻辑（如日志、权限校验、数据请求）**提取到 HOC 中**，通过包装目标组件，让目标组件 “被动” 获得这些逻辑能力，无需自身编写。

2. **Render Props（渲染属性）**

- 定义：Render Props 是一种组件通信模式，指通过组件的 props 传递一个 “返回 React 元素的函数”（即渲染函数），组件内部调用该函数完成渲染，从而实现逻辑复用。

- 将复用逻辑（如鼠标跟踪、数据请求）**封装在组件内部**，通过 `render` 函数将逻辑结果 “主动” 传递给外部，由外部决定如何渲染，实现 “逻辑复用，渲染自定义”。

```JavaScript
// 定义 Render Props 组件：封装复用逻辑（如鼠标位置跟踪）
class MouseTracker extends React.Component {
  state = { x: 0, y: 0 };

  handleMouseMove = (e) => {
    this.setState({ x: e.clientX, y: e.clientY });
  };

  render() {
    // 将复用的状态（鼠标位置）通过 props.render 函数传递出去
    return (
      <div onMouseMove={this.handleMouseMove}>
        {/* 调用传入的渲染函数，将内部状态作为参数传递 */}
        {this.props.render(this.state)}
      </div>
    );
  }
}

// 使用 Render Props 组件：复用鼠标位置逻辑
function MousePositionDisplay() {
  return (
    <div>
      <h1>鼠标位置：</h1>
      {/* 通过 render props 传递渲染函数，接收鼠标位置并渲染 */}
      <MouseTracker
        render={({ x, y }) => (
          <p>X: {x}, Y: {y}</p>
        )}
      />
    </div>
  );
}

// 另一个组件复用同一逻辑（如显示鼠标位置的图片）
function CatFollower() {
  return (
    <MouseTracker
      render={({ x, y }) => (
        <img
          src={catImageUrl}
          style={{ position: "absolute", left: x, top: y }}
          alt="跟随鼠标的猫"
        />
      )}
    />
  );
}
```

3. **自定义 Hook（Custom Hook）**

- **定义：**Custom Hook 是一个函数，名称以 `use` 开头，内部可以调用其他 Hook（如 `useState`、`useEffect`），用于提取和复用组件中的状态逻辑。

- “逻辑提取与主动调用”—— 将组件中可复用的状态逻辑（如窗口监听、表单处理、API 请求）提取到独立函数中，组件通过 “主动调用” 该函数获取逻辑能力，完全融入组件自身的渲染流程。

> 1. 更自然的逻辑复用：
>    HOC 和 Render Props 都需要通过 “组件包装 / 嵌套” 实现复用，本质是 “基于组件的复用”；而 Custom Hook 是 “基于函数的复用”，组件直接调用函数即可获取逻辑，无需额外组件层级，与函数组件的执行逻辑完全融合，代码更直观。
>
> 2. 无嵌套地狱问题：
>    多层 HOC 或 Render Props 会导致组件树嵌套过深（如 `withA(withB(Component))` 或多层 `render={(...)}`），调试困难；而 Custom Hook 通过函数调用组合逻辑（如 `const size = useWindowSize(); const data = useFetch();`），代码线性展开，无嵌套。

# 类组件与函数组件有什么区别呢？

**语法上**，类组件使用 `class` 继承 `React.Component`，必须实现 `render()` 方法；函数组件是普通函数，直接返回 JSX。**生命周期**方面，类组件有完整的生命周期方法（如 `componentDidMount`、`componentDidUpdate`、`componentWillUnmount`），而函数组件没有，但可以通过 `useEffect` 等 Hook 实现同样效果。**状态管理**上，类组件通过 `this.state` 和 `this.setState` 管理状态，函数组件通过 `useState` 或 `useReducer` 管理。**事件处理**上，类组件的事件处理函数需要绑定 `this`，函数组件则不需要。

在**性能与底层机制**上，类组件每个实例都有自己的状态和生命周期方法，占用内存略高；函数组件本质是渲染函数，更轻量，且现代 React Fiber 可以对函数组件进行高效调度和时间切片优化。**Hooks 的优势**是状态逻辑复用、副作用管理、避免 `this` 错误，并可以结合 `useMemo`、`useCallback` 进行性能优化。

# React Hooks

> - 只能用于函数组件和自定义`Hook`中，其他地方不可以
>
> - **Hooks 必须在顶层调用**：
>
>   - **不要在条件语句中调用 Hooks**
>
>   - **不要在循环中调用 Hooks**
>
>   - **不要在嵌套函数或普通函数里调用 Hooks**

## 为什么 Hooks 不能用在判断循环里， 依赖于调用顺序？

React 的 Hooks 内部实际上是 **挂在 Fiber 节点上的链表结构**。

- 每个函数组件都有一个对应的 **Fiber 对象**。

- Fiber 上有一个 `memoizedState` 指针，用来指向 **Hooks 链表的头节点**。

- 每个 Hook 节点保存：

  - 状态值（state）

  - 更新队列（updateQueue）

  - 下一个 Hook 的指针（next）

```TypeScript
type Hook = {
  memoizedState: any;    // 这个 Hook 当前保存的值（state、ref.current、effect链表等）
  baseState: any;        // 对于 useState/useReducer，用来记录上一次 state
  baseQueue: any;        // 对于 reducer 类 hook，记录未处理的更新
  queue: any;            // 更新队列
  next: Hook | null;     // 指向下一个 Hook（形成单向链表）
};
```

```JavaScript
Fiber.memoizedState
   ↓
Hook(useState) ──→ Hook(useEffect) ──→ Hook(useRef) ──→ null
```

- **每个 Hook 的位置就是它在组件中调用的顺序**。

- React 在 render 阶段**按顺序遍历这个链表来匹配状态**。

---

- **当组件首次渲染：**

  - 每个 `useState` / `useReducer` 创建一个 Hook 节点，按顺序链接。

- **当组件更新：**

  - React 从 Fiber\.memoizedState 开始，**按顺序把 Hook 节点与调用的 Hook 对应**。

  - 每次 `useState()` 都会走到下一个 Hook 节点，取出上一次存的状态。

> 核心：**状态与调用顺序一一对应**。
> 如果顺序乱了，React 会把某个 Hook 对应的状态给错 Hook，状态就乱了。

---

**第一次渲染：**

```JavaScript
function MyComponent() {
  const [A, setA] = useState('A');    // Hook 节点 0 (存储 'A')
  const [B, setB] = useState('B');    // Hook 节点 1 (存储 'B')
  useEffect(() => {});                // Hook 节点 2 (存储 effect)
  // ...
}
```

React内部创建的链表：
`[ Hook0 (state: 'A') ] -> [ Hook1 (state: 'B') ] -> [ Hook2 (effect) ] -> null`

React还会维护一个“当前指针”（`currentHook` 或 `workInProgressHook`），指向当前正在处理的Hook。它按顺序遍历这个链表来读取或更新状态。

**第二次及之后的渲染：**

当组件重新渲染时，React不会用任何“聪明”的方法来匹配Hook。它使用的是一种极其简单且高效的策略：顺序匹配。

React会再次遍历你的组件函数，每遇到一个Hook调用，它就移动内部链表的指针，并认为：

- 第一个 `useState` 调用 \-\> 对应链表中的第一个节点（Hook0），它的状态是 `'A'`。

- 第二个 `useState` 调用 \-\> 对应链表中的第二个节点（Hook1），它的状态是 `'B'`。

- `useEffect` 调用 \-\> 对应链表中的第三个节点（Hook2）。

---

```JavaScript
function MyComponent({ showExtra }) {
  const [A, setA] = useState('A');    // Hook 节点 0

  if (showExtra) {
    const [B, setB] = useState('B');  // Hook 节点 1 (条件性调用)
  }

  useEffect(() => {});                // Hook 节点 2
}
```

- 场景一：第一次渲染，`showExtra = true`

  - 调用顺序：`useState -> useState -> useEffect`

  - 内部链表被创建：`[Hook0] -> [Hook1] -> [Hook2]`

  - 一切正常。

- 场景二：第二次渲染，`showExtra = false`

  - 调用顺序：`useState -> useEffect`

  - **（条件不满足，第二个****`useState`****被跳过！）**

现在，React开始按顺序遍历链表：

1. 遇到第一个 `useState()`，它指向链表第一个节点（Hook0）。正确，拿到状态 `'A'`。

2. 它期望下一个调用是第二个 `useState()`，这样它就能指向链表第二个节点（Hook1，存储着 `'B'`）。

3. 但现实是，下一个调用是 `useEffect()`。

4. 灾难发生：React毫无察觉地将内部指针移到了链表的第二个节点（Hook1），并把它当作一个 `useEffect` Hook来处理！

5. Hook1节点里存储的是什么？是上一次渲染时第二个`useState`的状态 `'B'`！React现在试图把一段字符串（`'B'`）当作一个effect函数来解析和执行，这会导致完全无法预测的行为、内存泄漏或直接崩溃。

# Redux

[状态管理 ](https://ucnjui1gbcuc.feishu.cn/wiki/BXKTwTQ5BiGBeMkdfLjczOIZnne#share-HhlQdJrhoo1rczxgu2Zc8WtqnRc)

## Redux设计理念

### 为什么用Redux

> 在`React`中，数据在组件中是单向流动的，数据从一个方向父组件流向子组件（通过`props`）,所以，两个非父子组件之间通信就相对麻烦，`redux`的出现就是为了解决`state`里面的数据问题

---

### Redux 工作流

> `Redux`是将整个应用状态存储到一个地方上称为`store`,里面保存着一个状态树`store tree`,组件可以派发\(`dispatch`\)行为\(`action`\)给`store`,而不是直接通知其他组件，组件内部通过订阅`store`中的状态`state`来刷新自己的视图。
>
> Action 被 reducer 读取，根据 action type 和 数据 进行修改，生成新的 state，这个新的state 放入到store中，实图进行相应改变。
>
> `在 Redux 的整个工作过程中，数据流是严格单向的`。

1. 组件通过 `useSelector` 从 Store 中 “选择” 所需状态（即从全局状态中提取本组件需要的部分）；

2. 组件通过 `useDispatch` 获取 `dispatch` 函数，用于分发 Action 到 Redux Store；

3. 当 Store 状态更新时，`useSelector` 会自动检测选择的状态是否变化，若变化则触发组件重渲染，使用新状态更新 UI。

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=NDE5MDBjMGRjODc3NjNiOWI1MWZkY2Y1MGRjMTExMmVfMTAyNzhlMDFhZWE2MWU0Yzc1MmJiMGExMjNkNDg0N2FfSUQ6NzU0MjQ3OTY2NTczNzc2MDc4N18xNzg2NTQzMTQxOjE3ODY2Mjk1NDFfVjM)

---

### Redux 三大原则

1. **单一数据源（Single Source of Truth）**

- **所有应用状态保存在一个对象树（store）中**，整个应用只有一个 store。

- 这样状态集中管理，便于调试、快照和持久化

- 避免多个组件或 Store 状态分散导致的数据不一致。

- 支持时间旅行调试（Time Travel Debugging）。

2. **状态是只读的（State is Read\-Only）**

- **不能直接修改状态**，只能通过 **Action** 发起状态更新请求。

- Action 是描述事件的普通对象：

```JavaScript
{ type: 'INCREMENT', payload: 1 }
```

- **Reducer** 接收上一次 state 和 action，返回新的 state：

```Go
const counter = (state = 0, action) => {
  switch(action.type) {
    case 'INCREMENT': return state + action.payload;
    default: return state;
  }
}
```

3. **使用纯函数执行更改 \(Changes are made with Pure Functions\)**

- Reducer 就是一个**纯函数**，它的签名是 `(previousState, action) => newState`。它接收旧的 state 和一个 action，并返回一个新的 state。

  - 确定性：相同的输入，永远得到相同的输出。这使得状态变化极其可预测。

  - 无副作用：不修改传入的参数（必须不可变更新），不调用 API，不修改外部变量。这消除了隐藏的 Bug，使代码更纯粹。

- 保证状态变更的 “可预测性”—— 相同的旧状态和 Action 必然返回相同的新状态，便于测试、时间旅行调试（回溯状态变化历史）。

## Redux中间件

### Redux 中间件是什么

- 中间件提供了一个第三方扩展点，介于 `dispatch` 一个 `action` 和 这个 `action` 到达 `reducer` 之间的时刻。

- 没有中间件的 Redux 流程：

  ```JavaScript
  View --(dispatch plain object action)--> Store --(action)--> Reducers
  ```

- 有中间件的 Redux 流程：

  ```JavaScript
  View --(dispatch)--> Middleware --(可以拦截、处理、增强action)--> Store --(action)--> Reducers
  ```

- 中间件构成了一个处理链，**每个中间件都可以对传入的 ****`action`**** 进行检查、处理、修改**，或者干脆阻止它继续传递。

- 核心理念：**让 reducer 保持纯净，把副作用逻辑放到中间件中解耦处理**。

---

### 核心用途

1. **日志记录**

```JavaScript
const logger = store => next => action => {
  console.log('dispatching', action);
  let result = next(action);
  console.log('next state', store.getState());
  return result;
};
```

2. **处理异步逻辑（Redux Thunk）**

```JavaScript
const thunk = ({ dispatch, getState }) => next => action => {
  if (typeof action === 'function') {
    return action(dispatch, getState); // 执行函数
  }
  return next(action); // 普通对象直接传递
};
```

3. **处理 Promise（Redux Promise）**

```JavaScript
const promiseMiddleware = store => next => action => {
  if (action instanceof Promise) {
    return action.then(store.dispatch);
  }
  return next(action);
};
```

4. **权限控制 / 条件拦截**

```JavaScript
const authMiddleware = store => next => action => {
  if (!store.getState().user.isLoggedIn && action.type !== 'LOGIN') {
    console.warn('Please login first');
    return;
  }
  return next(action);
};
```

---

### 执行流程

1. 用户调用 `store.dispatch(action)`

2. action 进入第一个 `middleware`

3. 每个中间件可以：

   - 直接拦截（不调用 next） → 阻断 action

   - 修改 action → 再调用 next

   - 执行异步逻辑 → 再调用 dispatch

4. 最后 action 到达 reducer 更新状态

---

## Redux怎么实现dispstch一个函数

### 为什么需要 dispatch 函数

- 异步操作场景，例如请求接口：

```JavaScript
store.dispatch(() => {
  fetch('/api').then(res => dispatch({ type: 'DATA_LOADED', payload: res }))
})
```

- 需要让 `dispatch` **接收函数**，函数内部可以进行异步操作，最终再 dispatch 普通 action。

### redux\-thunk

- 核心思想：**让 dispatch 可以先检查 action 类型，如果是函数，就执行它并传入 dispatch 和 getState**。

```JavaScript
const thunk = ({ dispatch, getState }) => next => action => {
  if (typeof action === 'function') {
    // 如果是函数，就执行它，传入 dispatch 和 getState
    return action(dispatch, getState);
  }
  // 否则传给下一个 middleware 或原始 dispatch
  return next(action);
};
```

- `next(action)` 调用下一个 middleware 或最终 Redux 的 dispatch

- 如果 action 是函数：

  - middleware 会拦截

  - 执行函数，并给它 dispatch、getState，让函数自己处理异步逻辑

- 如果 action 是对象：

  - 正常交给 reducer 处理

### 示例

1. **应用中间件**

在创建 store 时，通过 `applyMiddleware` 启用 `redux-thunk`。

```JavaScript
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';

const store = createStore(rootReducer, applyMiddleware(thunk));
```

2. **编写一个 Action Creator（返回函数）**

这是一个 “thunk action creator”，它返回一个函数（thunk），而不是一个对象。

```JavaScript
// 普通的 action creator（返回对象）
function incrementSync() {
  return { type: 'INCREMENT' };
}

// thunk action creator（返回函数）
function incrementAsync() {
  // 返回的函数就是一个 “thunk”
  return (dispatch, getState) => {
    // 现在，我们可以在函数里做任何事：异步API调用、条件判断、多次dispatch
    setTimeout(() => {
      // 异步操作完成后，dispatch 一个普通的同步 action
      dispatch({ type: 'INCREMENT' });

      // 我们甚至可以读取当前状态
      // const currentState = getState();
      // console.log('Current state:', currentState);
    }, 1000);
  };
}
```

3. **在组件中 Dispatch**

从组件的视角来看，dispatch 的用法没有任何区别。

```JavaScript
// 分发一个普通action（对象）
dispatch(incrementSync());

// 分发一个thunk action（函数）
dispatch(incrementAsync());
```

**执行流程：**

1. 你调用 `dispatch(incrementAsync())`。

2. `incrementAsync()` 执行，返回一个函数（thunk）。

3. `dispatch` 函数将这个 thunk 发出。

4. `redux-thunk` 中间件拦截到这个 action。

5. 它发现 action 是一个函数，于是执行这个函数，并传入 `dispatch` 和 `getState` 作为参数。

6. 你的 thunk 函数开始执行，设置了一个定时器。

7. 1 秒后，定时器回调函数触发，在里面你手动调用了 `dispatch({ type: 'INCREMENT' })`。

8. 这个新的、纯对象的 action 被再次 dispatch。

9. 这次，`redux-thunk` 看到它是一个对象，不做处理，直接交给下一个中间件或最终的 reducer。

10. Reducer 处理 `INCREMENT` action，更新 state。

11. 视图根据新的 state 重新渲染。

```JavaScript
const fetchData = () => (dispatch, getState) => {
  dispatch({ type: 'LOADING' });
  fetch('/api/data')
    .then(res => res.json())
    .then(data => dispatch({ type: 'SUCCESS', payload: data }))
    .catch(err => dispatch({ type: 'ERROR', payload: err }));
};

store.dispatch(fetchData());
```

- `fetchData()` 返回的是一个函数

- Thunk middleware 拦截后执行函数

- 函数内部可以异步调用 dispatch

---

## Redux 的比较和 hooks 的比较

### React Hooks \(`useEffect`, `useMemo`, `useCallback`\)

React 的 Hooks 依赖数组 \(`deps`\) 采用的是 **浅比较（Shallow Comparison）**，但它是针对**数组中的每一项**进行比较。

- 如果你依赖是一个对象 `[obj]`，它比较的是 `obj` 的**引用**。

- **比较算法**：使用 `Object.is()`。

  - 它类似于 `===`，但处理了一些特殊情况（例如 `Object.is(NaN, NaN)` 为 `true`，而 `NaN === NaN` 为 `false`；`Object.is(+0, -0)` 为 `false`）。

- **工作机制**： React 会按顺序遍历 `deps` 数组。如果数组中**任何一项**的新值与旧值通过 `Object.is` 比较不相等，React 就会认为依赖发生了变化。

- **关键点**： 它只比较数组的第一层元素。如果数组里放的是一个对象，React 只会比较这个对象的引用（内存地址），而不会深入去比较对象内部的属性是否改变。

> Dep 比较的是一个数组
>
> React 的逻辑是：**“我浅浅地遍历一下这个数组的每一项，看它们变没变。”**
>
> - **它是“浅”在数组这一层。**
>
> - 它只比较数组的第一层元素（`deps[0]`, `deps[1]`\.\.\.）。
>
> - 它**不**进入元素内部（不看对象的属性）。

### Redux \(`useSelector`\)

在 `react-redux` 的 Hooks API 中，`useSelector` 的默认行为是 **严格全等比较（Strict Reference Equality）**。

- **比较算法**：默认使用 `===` \(Strict Equality\)。

- **工作机制**： `useSelector` 运行你的 selector 函数并拿到返回值。它会将当前的返回值与上一次 render 的返回值直接进行 `===` 比较。

  - 如果返回 `true`，组件**不**重新渲染。

  - 如果返回 `false`，组件**强制**重新渲染。

- **关键区别**： 默认情况下，它**不**进行浅比较（Shallow Compare）。这意味着如果你在 selector 中返回了一个新对象，每次都会导致重渲染。

> `useSelector` 比较的不是数组，而是 **一个值**（Selector 的返回值）。
>
> ```JavaScript
> // Redux useSelector 默认逻辑
> if (prevValue === nextValue) {
>   // 没变，不更新
> } else {
>   // 变了，更新！
> }
> ```

假设你的 State 是这样的：

```JavaScript
state = {
  userInfo: { name: 'Jack' }, // 引用 A
  theme: 'dark'               // 引用 B
}
```

**场景：你修改了 ****`theme`****，但组件只用了 ****`userInfo`****。**

1. **Dispatch**：你发了一个 `SET_THEME` 的 action。

2. **Reducer**：

   - `theme` 变成了 `'light'`。

   - `userInfo` 没动，Reducer 返回的新 State 里，`userInfo` 依然指向 **引用 A**（这就是不可变数据的结构共享）。

   - 但是 **Root State** 变成了全新的对象 **引用 C**。

3. **Notify**：Store 通知所有组件。

4. **组件检查 \(****`useSelector(s => s.userInfo)`****\)**：

   - 拿到新 State \(引用 C\)。

   - 运行 Selector：`s.userInfo`。

   - 拿到结果：**引用 A**。

   - **对比**：上一次也是 **引用 A**。`A === A` 是 `true`。

   - **结果**：组件**不**重新渲染。

**场景：你修改了 ****`userInfo.name`****。**

1. **Dispatch**：你发了一个 `UPDATE_NAME`。

2. **Reducer**：

   - Reducer 必须返回一个新的 `userInfo` 对象（**引用 D**）。

   - Root State 变成 **引用 E**。

3. **Notify**：Store 通知。

4. **组件检查 \(****`useSelector(s => s.userInfo)`****\)**：

   - 拿到新 State \(引用 E\)。

   - 运行 Selector：`s.userInfo`。

   - 拿到结果：**引用 D**。

   - **对比**：上一次是 **引用 A**。`D === A` 是 `false`。

   - **结果**：`useSelector` 触发 React 的 `setState`，组件重新渲染。

---

**总结**

1. **Redux Store**：它是“盲目”的，只要 Dispatch，它就生成新 State 并通知所有人。

2. **useSelector**：它是“守门员”。每次通知来了，它先偷偷算一下你的 selector 返回值变没变（用 `===`）。

   - 变了 \-\> 叫醒 React 组件重绘。

   - 没变 \-\> 拦截下来，假装无事发生。

这就是为什么 Redux 中 **Immutability（不可变性）** 如此重要。如果你的 Reducer 直接修改了旧对象的属性（`state.a = 1`）而不是返回新对象，`state` 的引用没变，或者 selector 取出来的子对象引用没变，`useSelector` 的 `===` 比较就会返回 `true`，导致组件**死活不更新**。

**性能杀手：**

```JavaScript
// 每次执行 selector 都会生成一个全新的对象 { a: 1, b: 2 }
// 内存地址：0x002 (上次是 0x001)
const result = useSelector(state => ({
  a: state.a,
  b: state.b
}));
```

---

**shallowEqual**

```JavaScript
import { shallowEqual, useSelector } from 'react-redux';

const data = useSelector(selector, shallowEqual);
```

当 Redux 通知更新，`useSelector` 拿到新旧返回值（`newValue` 和 `oldValue`）后，`shallowEqual` 会按以下步骤执行：

- **第一步：先看引用 \(****`===`****\)** 如果 `newValue === oldValue`，直接返回 `true`（相等）。

> - 省事原则：如果连壳都没变，那就肯定没变，不用往下拆了。

- **第二步：如果引用不同，再拆开看（这就是“浅比较”的核心）** 如果 `newValue` 和 `oldValue` 都是对象（且不是 null），它会做两件事：

  1. **比 Key 的数量**：如果你有 3 个属性，我有 4 个，那肯定不一样，返回 `false`。

  2. **挨个比 Key 对应的值**：遍历 `newValue` 的每一个属性，去跟 `oldValue` 里对应的属性比。

     - 这里面的比较使用的是 `===`（严格全等）。

- **第三步：结论**

  - 如果所有属性的值都全等 \(`===`\)，虽然外面的壳（对象引用）不一样，但 `shallowEqual` 会返回 `true`。

  - **后果**：守门员告诉 React：“没事，数据其实没变，**不要重新渲染**。”

**场景**：你的 State 更新了无关数据（比如 `state.c`），但组件里是这样写的：

```JavaScript
// 每次执行 selector 都会生成一个全新的对象 { a: 1, b: 2 }
// 内存地址：0x002 (上次是 0x001)
const result = useSelector(state => ({
  a: state.a,
  b: state.b
}), shallowEqual); // <--- 注意这里加了 shallowEqual
```

**没有 ****`shallowEqual`**** 时（默认 ****`===`****）：**

1. `0x002 === 0x001` ? **False**。

2. **触发重渲染**。（浪费性能，因为 a 和 b 根本没变）

**有 ****`shallowEqual`**** 时：**

1. **第一步**：`0x002 === 0x001` ? **False**。

2. **第二步（勤快模式）**：

   - key 数量一样吗？一样（都是 a, b）。

   - `newValue.a === oldValue.a` ? **True** \(值没变\)。

   - `newValue.b === oldValue.b` ? **True** \(值没变\)。

3. **结论**：返回 **True**。

4. **结果**：`useSelector` 拦截成功，组件**不重新渲染**。

# React\-Router 的实现原理及工作方式分别是什么

## 核心作用

1. 实现单页应用（SPA）的 “无刷新导航”：**通过监听 URL 变化（如 ****`hash`**** 或 ****`history`**** 模式），在不重新加载页面的前提下，切换显示不同组件，模拟多页面体验**；

2. 建立 URL 与组件的映射关系：通过配置路由规则（如 `/home` 对应 `Home` 组件、`/user` 对应 `User` 组件），让 URL 成为 “页面状态的入口”；

3. 支持路由参数与状态传递：如动态路由（`/user/:id`）传递用户 ID，导航时携带临时状态（如跳转来源）；

4. 提供路由控制能力：如路由守卫（权限拦截）、嵌套路由（页面布局复用）、路由懒加载（性能优化）等。

## **React Router 的实现原理**

React Router 核心是基于 **React 组件 \+ 浏览器 History API / Hash 变化** 来实现前端路由管理，其实现原理可以概括为以下几点：

1. **路由组件化**

   - 路由本质是 React 组件，通过 `<Routes>` 和 `<Route>` 结构化定义不同路径对应的组件。

   - Router 会遍历路由配置，根据当前路径匹配出需要渲染的组件。

2. **URL 状态管理**

   - React Router 会监听浏览器的 URL 变化：

     - **BrowserRouter** 使用 `window.history.pushState` / `popstate` 事件。

     - **HashRouter** 使用 `window.location.hash` / `hashchange` 事件。

   - 当 URL 改变时，Router 更新内部状态，触发 React 重新渲染。

3. **路由匹配算法**

   - Router 内部有一套匹配规则，将当前路径与路由表的 path 对比：

     - 精确匹配 `/home` vs `/home/:id`

     - 支持动态参数、嵌套路由、通配符 `*`。

   - 匹配成功后返回对应组件树。

4. **组件渲染与 Context**

   - React Router 使用 **React Context** 传递路由信息（如 location、params、navigate）。

   - 组件通过 `useLocation`、`useParams`、`useNavigate` 等 Hook 获取路由状态，实现组件与路由解耦。

5. **导航机制**

   - `Link` 或 `navigate()` 并不刷新页面，而是通过 History API 修改 URL，并通知 Router 更新 React 组件。

   - 路由切换在 **前端完成**，无页面刷新，实现 SPA（单页应用）效果。

---

## **React Router 的工作方式**

从使用者角度，React Router 的工作方式可以分为三个步骤：

1. **初始化路由器**

   - 包裹应用：`<BrowserRouter>` 或 `<HashRouter>`

   - Router 初始化内部状态，监听 URL 变化。

2. **路径匹配与组件渲染**

   - 当 URL 变化或初始化时，Router 遍历路由配置，找到匹配的 `<Route>`。

   - 将匹配的组件通过 React 渲染到页面。

   - 嵌套路由时，父级 `<Route>` 渲染 `<Outlet>`，子路由插入其中。

3. **导航与状态更新**

   - 用户点击 `<Link>` 或调用 `navigate()` 改变 URL。

   - Router 监听到 URL 变化，重新匹配路由，更新组件。

   - React 通过 **状态变化 \+ 虚拟 DOM diff** 完成组件重渲染，不刷新页面。

# Suspense

[The Modern React Data Fetching Handbook: Suspense, use\(\), and ErrorBoundary Explained](https://www.freecodecamp.org/news/the-modern-react-data-fetching-handbook-suspense-use-and-errorboundary-explained/)

[React 之 Suspense](https://www.paradeto.com/2022/04/03/react-suspense/)

## 传统抓取数据方式 useEffect

**Fetch\-on\-render**（渲染后抓取）

### 执行流程

1. **开始渲染**：React 执行组件函数。

2. **完成渲染**：由于数据还没到，组件只能返回一个 `Loading...` 或者空界面。

3. **触发 Effect**：渲染完成后，`useEffect` 被调用，发起 `fetch` 请求。

4. **数据返回**：请求成功，更新 State。

5. **重新渲染**：组件带着真实数据再次跑一遍。

### 问题：网络瀑布流

假设你有一个 `App` 组件，里面套着 `User` 组件，`User` 里面又套着 `Posts` 组件。每个组件都在自己的 `useEffect` 里抓数据：

- `App` 渲染 \-\> **触发 Fetch A** \-\> 等待\.\.\.

- Fetch A 成功 \-\> `User` 渲染 \-\> **触发 Fetch B** \-\> 等待\.\.\.

- Fetch B 成功 \-\> `Posts` 渲染 \-\> **触发 Fetch C** \-\> 等待\.\.\.

**结果：** 用户必须等 A 完了等 B，等完 B 再等 C。明明可以同时发起的请求，硬生生变成了排队，页面加载速度极慢。

## Suspense

Suspense 机制允许组件告知React：“我尚未准备好渲染”。此时React会暂停该树节点的渲染，并显示备用界面，直至所需数据就绪。

![Image](https://internal-api-drive-stream.feishu.cn/space/api/box/stream/download/authcode/?code=YTc4OWExOGQ4ZDZkMGZiMmJlNTM2NTVmY2Y5MTYyOWVfYTI5NzYxMjRkOGRhYjY4OGFkY2I2NDljMmVjNDA5MDlfSUQ6NzYwODA5MzE1NDgxMzc0MjI2Nl8xNzg2NTQzMTQxOjE3ODY2Mjk1NDFfVjM)

Suspense 实现了"**render\-as\-you\-fetch \(边获取边渲染\)**"，而非先渲染后获取。数据获取可在 React 尝试提交 UI 之前启动，渲染过程仅需等待数据就绪。UI 无需猜测何时显示加载状态，React 通过 Suspense 边界以声明式方式进行协调。

Suspense 可以在被包裹组件处理 Promise 期间暂停渲染。它会显示一个备用界面（可能是加载器、界面骨架等），直到 Promise 得到解析（或被拒绝）。一旦 Promise 解析完成，Suspense 就会用实际包裹组件（已预先加载数据）替换备用界面。无需硬编码逻辑，也无需额外的状态管理。

### 基础数据获取

```JavaScript
// Profile.js
import React, {Suspense} from 'react'
import User from './User'
import Articles from './Articles'

export default function Profile() {
  return (
    <Suspense fallback={<p>Loading user...</p>}>
      <User />
      <Suspense fallback={<p>Loading articles...</p>}>
        <Articles />
      </Suspense>
    </Suspense>
  )
}

// Articles.js
import React from 'react'
import {getArticlesResource} from './resource'

**// fetch 请求已经发出**
**const**** articlesResource = getArticlesResource()**
const Articles = () => {
  debugger
  const articles = articlesResource.read()
  return (
    <ul>
      {articles.map((article) => (
        <li key={article.id}>
          <h3>{article.title}</h3>
          <p>{article.abstract}</p>
        </li>
      ))}
    </ul>
  )
}

// User.js
import React from 'react'
import {getUserResource} from './resource'
**// fetch 请求已经发出**
**const**** userResource = getUserResource()**
const User = () => {
  const user = userResource.read()
  return <h2>{user.name}</h2>
}

**// resource.js**
**export**** ****function**** ****wrapPromise****(****promise****) ****{**
**  ****let**** status = ****'pending'**
**  ****let**** result**
**  ****let**** suspender = promise.then(**
**    (r) => {**
**      ****debugger**
**      status = ****'success'**
**      result = r**
**    },**
**    (e) => {**
**      status = ****'error'**
**      result = e**
**    }**
**  )**
**  ****return**** {**
**    read() {**
**      ****if**** (status === ****'pending'****) {**
**        ****throw**** suspender**
**      } ****else**** ****if**** (status === ****'error'****) {**
**        ****throw**** result**
**      } ****else**** ****if**** (status === ****'success'****) {**
**        ****return**** result**
**      }**
**    },**
**  }**
**}**

export function getArticles() {
  return new Promise((resolve, reject) => {
    const list = [...new Array(10)].map((_, index) => ({
      id: index,
      title: `Title${index + 1}`,
      abstract: `Abstract${index + 1}`,
    }))
    setTimeout(() => {
      resolve(list)
    }, 2000)
  })
}

export function getUser() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        name: 'Ayou',
        age: 18,
        vocation: 'Program Ape',
      })
    }, 3000)
  })
}

export const getUserResource = () => {
  return wrapPromise(getUser())
}

export const getArticlesResource = () => {
  return wrapPromise(getArticles())
}
```

### 使用 use\(\)

```JavaScript
import { Suspense, use } from 'react';

// 1. 定义一个异步函数（注意：请求在渲染前就开始了！）
const userDataPromise = fetch('/api/user').then(res => res.json());

function UserProfile() {
  // 2. 使用 use() 读取 Promise
  // 如果 Promise 没结束，这里会“暂停”组件执行，并跳到外部的 Suspense
  const user = use(userDataPromise);

  return <div>用户名: {user.name}</div>;
}

export default function App() {
  return (
    // 3. 这里的 fallback 就是数据没到时的“替身”
    <Suspense fallback={<p>正在加载用户信息...</p>}>
      <UserProfile />
    </Suspense>
  );
}
```

### 配合路由懒加载

```JavaScript
import React, { Suspense, lazy } from 'react';

// 只有当用户点击跳转时，才会去下载这个组件的代码
const HeavyDashboard = lazy(() => import('./HeavyDashboard'));

function App() {
  return (
    <Suspense fallback={<div>组件加载中，请稍后...</div>}>
      <HeavyDashboard />
    </Suspense>
  );
}
```

### 配合请求库

```JavaScript
import { useSuspenseQuery } from '@tanstack/react-query';

function Posts() {
  // 这个 Hook 会自动与最近的 Suspense 配合
  const { data } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  return <ul>{data.map(p => <li key={p.id}>{p.title}</li>)}</ul>;
}
```

### Suspense 优势

**① 解决“竞态条件”和“错位渲染”**

在 `useEffect` 里你需要自己写 `ignore` 标志位（还记得我们聊过的方案 A 吗？）。而 Suspense 内部会自动处理这些，确保**只有最新的请求结果**会被渲染。

**② 彻底消灭“瀑布流”**

如果你的页面有三个组件都要抓数据，你可以把它们都包裹在**同一个** `Suspense` 里。React 会让这三个请求**同时发出**，而不是一个等一个。

```JavaScript
// 在组件外部直接触发，这三个请求瞬间并发
const userPromise = fetchUser();
const postsPromise = fetchPosts();
const settingsPromise = fetchSettings();

function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      {/* 这三个组件内部使用 use() 获取上面的 Promise */}
      <UserProfile data={userPromise} />
      <UserPosts data={postsPromise} />
      <UserSettings data={settingsPromise} />
    </Suspense>
  );
}
```

**③ 错误边界联动（ErrorBoundary）**

当网络请求失败（404 或 500）时，Suspense 通常配合 `ErrorBoundary` 使用，让你的代码逻辑非常整洁：

```JavaScript
<ErrorBoundary fallback={<p>糟了，服务器开小差了</p>}>
  <Suspense fallback={<Spinner />}>
    <UserProfile />
  </Suspense>
</ErrorBoundary>
```

# react和vue的区别

1. 核心哲学与数据流 \(最关键的区别\)

- React 推崇**函数式编程和****不可变数据**。它的核心思想是`UI = f(state)`，即UI是状态的一个函数。数据通过单向数据流向下传递（props），子组件通过向上调用回调函数来通信。状态更新必须使用`setState`或`useState`的setter方法返回一个新对象，遵循不可变原则。

- Vue 的核心是**响应式数据****系统**。它通过数据劫持（Vue2的`Object.defineProperty` / Vue3的`Proxy`）自动建立依赖追踪。当数据变化时，Vue会主动地、精确地知道哪些组件需要更新。它虽然也是单向数据流，但通过`v-model`等指令提供了“双向绑定”的语法糖，开发起来更直观。

\(可以补充\) 简单说，React是“推”的原理，状态变化后，组件重新渲染，再由Virtual DIFF找出差异；而Vue是“拉”的原理，它在编译时就知道哪些数据依赖关系，变化时可以直接定位并更新。

2. 视图编写方式：JSX vs 模板

- React 使用JSX，允许我们在JavaScript中直接编写类似HTML的结构。这赋予了JavaScript完全的编程能力，非常灵活，可以完成任何复杂的逻辑，但需要一定的学习成本。

- Vue 主要使用基于HTML的模板语法。模板中有指令（如`v-if`, `v-for`）来处理逻辑和绑定。这种方式对于有传统Web开发背景的开发者来说更友好，学习曲线更平滑，但灵活性不如JSX。

3. 生态系统与API风格

- React 本身只是一个视图库，非常轻量。路由、状态管理等都需要依赖社区生态（如React Router、Redux/Zustand）。它的API风格更偏向函数式，比如Hooks。

- Vue 提供的是“全家桶”式的体验，官方维护的路由（Vue Router）、状态管理（Pinia/Vuex）、构建工具（Vite）都有非常好的集成度，设计和风格非常统一，降低了选择成本。

4. 性能优化

- 两者性能都很好，差异极小。React 依赖Virtual DOM和Diff算法来最小化DOM操作。

- Vue 同样使用Virtual DOM，但其响应式系统在编译时就能做更多的优化，比如标记静态节点，使得它在更新时可以更精确地知道哪些需要被更新。

---

## 核心响应式原理（最大的区别）

**React: 不可变性 \+ 全量检测 \("Pull" 模式\)**

- **机制**：React 不知道你具体改了哪个属性。你调用 `setState` \(或 `dispatch`\)，实际上是发出了一个信号：“有些东西变了，快重新跑一遍代码！”

- **更新流程**：

  1. 状态变化 \-\> 触发组件重新渲染（执行整个函数组件）。

  2. 生成新的 Virtual DOM 树。

  3. 和旧的 Virtual DOM 树进行 Diff（比对）。

  4. 找出差异，更新真实 DOM。

- **你的痛点**：因为 React 默认是“一旦父组件更新，子组件无脑全部更新”，所以你需要我们刚才讨论的 `React.memo`、`useMemo`、`useCallback` 以及 Redux 的 `shallowEqual` 来**阻止**不必要的渲染。**它非常依赖开发者的优化技巧**。

**Vue \(Vue 3\): 可变性 \+ 依赖收集 \("Push" 模式\)**

- **机制**：Vue 使用 `Proxy` \(Vue 3\) 或 `Object.defineProperty` \(Vue 2\) 劫持了数据对象。

  - **Getter**：当你读取数据时，Vue 记个小本本（依赖收集）：_“哦，组件 A 用到了 **`user.name`**”_。

  - **Setter**：当你修改数据 `user.name = 'Jack'` 时，Vue 直接由 setter 触发通知：_“组件 A，你的 **`user.name`** 变了，快更新！”_

- **更新流程**：Vue 知道**精确**的依赖关系。它不需要像 React 那样从根部往下递归检查，它直接找到那个与之绑定的组件/节点进行更新。

- **优势**：通常不需要手动做 `shouldComponentUpdate` 或 `memo` 这类优化，因为系统天生就是精准更新的。

---

## 渲染机制与 Diff 算法优化

#### React \(JSX\)

- **JSX**：本质是 JS 的语法糖。React 的编译器很难对 JSX 做静态分析（因为它太灵活了，怎么写都行）。

- **Diff 策略**：React 的 Diff 主要是**运行时**的。每次 Render 都要生成新的 VDOM 树，然后在新旧两棵树之间比对。

#### Vue \(Templates\)

- **Templates**：Vue 推荐使用模板。模板的结构是固定的（HTML 结构），这让 Vue 的编译器（Compiler）可以做极强的**静态分析优化**。

- **Compile\-time 优化**：

  - **静态提升 \(Static Hoisting\)**：如果一个 `div` 里是纯文字，永远不会变，Vue 会把它提出来，更新时直接跳过，看都不看它一眼。

  - **Patch Flags**：Vue 的 VDOM 会被打上标记。比如 `<div :class="a">123</div>`，Vue 知道只有 `class` 是动态的，Diff 时只比对 `class`，忽略内容。

- **结论**：在超大型应用的默认性能表现上，Vue 往往不需要太多优化就能跑得很快，而 React 需要开发者写好 `memo`。

---

### Diff算法区别

#### 核心 Diff 策略的区别（子节点对比）

这是两者最本质的区别，主要体现在如何处理列表（Arrays/Lists）的更新。

**React: 简单的由左向右遍历 \(Incremental Diff\)**

React 的策略相对简单粗暴，主要侧重于**向右移动**。

- **流程**：React 采用仅从左向右的遍历。它会记录一个 `lastIndex`（上一次访问的旧节点的位置）。

- **判断逻辑**：

  1. 遍历新列表，拿新节点去旧列表中找（通过 Key）。

  2. 如果找到，且该节点在旧列表中的索引 \< `lastIndex`，说明该节点需要**向右移动**。

  3. 如果该节点在旧列表中的索引 \>= `lastIndex`，则不需要移动，仅更新 `lastIndex`。

- **缺点**：对于将**最后一个节点移动到第一个**这种场景（如 `A, B, C` \-\> `C, A, B`），React 会保持 C 不动，把 A 和 B 移动到 C 后面。这导致了更多的 DOM 操作。

> - **旧列表**：`A, B, C` （索引：A=0, B=1, C=2）
>
> - **新列表**：`C, A, B`
>
> 我们的目标是把界面变成 `C, A, B`。 初始时，`lastIndex = 0`。
>
> **第一步：处理新列表的第一个节点 ****`C`**
>
> 1. React 问：`C` 在旧列表里是老几？
>
> 2. 回答：`C` 在旧列表的索引是 **2** \(`oldIndex = 2`\)。
>
> 3. **对比**：`2 < 0` \(`lastIndex`\) 吗？ **不成立**。
>
> 4. **结果**：**C 不动**。
>
> 5. **更新参考线**：`lastIndex` 变成了 **2**。（意思是：我现在处理到旧列表第 2 个位置了，接下来的节点，如果在旧列表里位置小于 2，就算掉队了）。
>
> **此时真实 DOM**：`A, B, C` （C 没动，虽然逻辑上它要是第一个，但 React 还没开始挪别人）
>
> **第二步：处理新列表的第二个节点 ****`A`**
>
> 1. React 问：`A` 在旧列表里是老几？
>
> 2. 回答：`A` 在旧列表的索引是 **0** \(`oldIndex = 0`\)。
>
> 3. **对比**：`0 < 2` \(`lastIndex`\) 吗？ **成立！**
>
> 4. **结果**：**A 需要移动**（移动到 C 的后面）。
>
> 5. **原因**：A 原本在 0，但参考线已经是 2 了。说明 A 原本排在 C 前面，现在却要排在 C 后面，所以 A 得挪窝。
>
> 6. **参考线**：保持 2 不变。
>
> **此时真实 DOM**：`B, C, A` （A 被挪到了 C 后面）
>
> **第三步：处理新列表的第三个节点 ****`B`**
>
> 1. React 问：`B` 在旧列表里是老几？
>
> 2. 回答：`B` 在旧列表的索引是 **1** \(`oldIndex = 1`\)。
>
> 3. **对比**：`1 < 2` \(`lastIndex`\) 吗？ **成立！**
>
> 4. **结果**：**B 需要移动**（移动到 A 的后面）。
>
> 5. **原因**：同上，B 原本在 C 前面，现在要跑到 C 后面去。
>
> **此时真实 DOM**：`C, A, B` （B 被挪到了 A 后面）

**Vue 2: 双端比较 \(Double\-ended Diff\)**

Vue 2 引入了更智能的“双指针”策略，试图减少移动操作。

- **流程**：定义四个指针：旧头、旧尾、新头、新尾。

- **判断逻辑**：循环比较这四个点：

  1. 头 vs 头

  2. 尾 vs 尾

  3. 头 vs 尾

  4. 尾 vs 头

- **优势**：这种方法对于常见的**首尾追加、倒序**等操作非常高效。比如上面的 `A, B, C` \-\> `C, A, B`，Vue 能直接识别出 C 移动到了头部，只需移动一次 C 即可。

**Vue 3: 最长递增子序列 \(Fast Diff \+ LIS\)**

Vue 3 在 Vue 2 的基础上进一步优化，采用了**快速 Diff \+ 最长递增子序列 \(Longest Increasing Subsequence\)** 算法。

- **流程**：

  1. **预处理**：先从头和尾开始同步，跳过那些没有变化的节点（类似双端比较的简化版）。

  2. **处理剩余部分**：对于中间乱序的部分，Vue 3 会计算一个“最长递增子序列”。

- **优势**：这个序列代表了**不需要移动的节点链**。Vue 3 只需要移动那些不在这个序列中的节点。这是目前数学上求最小移动次数的最优解，比 React 和 Vue 2 的算法在复杂乱序场景下性能更好。

---

#### 更新粒度与触发机制 \(Scope\)

Diff 算法的执行范围也不同，这取决于框架的响应式设计。

**React: 组件树层级 \(Recursive / Subtree\)**

- **机制**：React 是**Pull \(拉取\)** 模式。当一个组件的状态发生变化（`setState`）时，默认情况下，React 会从该组件开始，**递归地 Diff 整个子组件树**。

- **优化依赖**：开发者需要手动使用 `React.memo`、`useMemo` 或 `shouldComponentUpdate` 来阻止不必要的子树 Diff。

- **Fiber 架构**：为了防止大树 Diff 阻塞主线程，React 16\+ 引入了 Fiber，将 Diff 过程切片（Time Slicing），但这不改变 Diff 算法本身的逻辑，只是改变了执行的方式（可中断）。

**Vue: 组件实例层级 \(Component Scoped\)**

- **机制**：Vue 是**Push \(推送\)** 模式。基于 Proxy \(Vue 3\) 或 Object\.defineProperty \(Vue 2\) 的响应式系统。

- **精确性**：Vue 精确地知道**哪个组件**的状态发生了变化。Diff 仅发生在当前组件的模板范围内。Vue 不会递归 Diff 子组件，除非子组件的 props 确实发生了变化。

- **静态提升 \(Vue 3\)**：Vue 3 的编译器非常智能，它会标记静态节点（Patch Flags）。在 Diff 过程中，**完全跳过**那些静态的、不会变的节点，只对比动态绑定的部分（Block Tree）。这使得 Vue 3 的 Diff 性能与模板大小无关，只与动态节点的数量相关。

---

## 代码组织与逻辑复用 \(Hooks vs Composition API\)

虽然 Vue 3 的 **Composition API** 长得很像 React **Hooks**，但运行机制完全不同。

- **React Hooks \(****`useState`****, ****`useEffect`****\)**:

  - **心智模型**：**每一次 Render，组件函数都会重新执行一遍**。

  - **后果**：这就是为什么你需要关心 `Dependency Array` \(`deps`\)。如果闭包陷阱没处理好，或者依赖项没写对，就会出现 bug（比如读取到旧值，或者无限循环）。

  - **特点**：非常依赖“顺序调用”，不能写在 `if` 里面。

- **Vue Composition API \(****`ref`****, ****`computed`****\)**:

  - **心智模型**：**`setup()`**** 函数只在组件初始化时执行一次**。

  - **后果**：你定义的变量就是闭包里的变量，不存在“每次渲染重新创建”的问题。你不需要手写依赖数组（Vue 自动收集依赖）。

  - **特点**：更符合直觉的 JS 逻辑，不存在“闭包陷阱”和 `Stale Closure` 问题。

---

## 生态系统与设计哲学

- **React \(库 Library\)**:

  - **哲学**：Minimalist（极简）。React 只管 View 层。

  - **生态**：百花齐放，也叫“碎片化”。路由你选 `react-router`，状态管理你选 `Redux`, `Zustand`, `MobX`, `Recoil`\.\.\.

  - **要求**：对开发者架构能力要求高，你需要自己做选择。

- **Vue \(框架 Framework\)**:

  - **哲学**：Progressive（渐进式）\+ "The Progressive Framework"。

  - **生态**：全家桶（Official）。Vue 官方维护 `vue-router` 和 `Pinia` \(前 `Vuex`\)。

  - **要求**：上手简单，按照官方文档写，大家的架构都长得差不多。

# React 18 新增了哪些特性

## 核心概念：并发 \(Concurrency\)

在 React 18 之前，渲染是一个单一、同步、不可中断的过程。一旦开始渲染，就必须等它完成，这可能会阻塞主线程，导致页面卡顿。

React 18 引入了**并发渲染**。这是一个底层的、可中断的渲染机制。简而言之，React 可以在渲染过程中“暂停”工作，去处理更紧急的任务（比如用户输入），然后再“继续”之前暂停的渲染。

> **重点：** 并发本身不是一个“功能”，而是一个新的**底层机制**。它使得以下所有新功能成为可能。

---

## createRoot

- 用 `createRoot` 取代旧的 `ReactDOM.render`：

```JavaScript
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

- 新 root 自动开启**“并发特性”（Concurrent Rendering）**

- 只有使用了 `createRoot`，你的应用才会**开启** React 18 的所有并发功能。

---

## 自动批处理（Automatic Batching）

- 批处理：React 将多个状态更新分组到一次重新渲染中，以减少不必要的渲染次数。

- 之前的问题：在 React 17 中，只有在事件处理函数（如 `onClick`）内部的更新会被批处理。在 `Promise`、`setTimeout`、原生事件处理函数中的更新不会被批处理。

- React 18 的改进：默认情况下，在**任何地方**（包括 `Promise`、`setTimeout`、原生事件）的更新都会被自动批处理，这大大减少了渲染次数，提升了性能。

---

## flushSync

> 批处理是一个`破坏性改动`，如果你想退出批量更新，你可以使用 `flushSync`，建议尽量不要这么做

> 注意：`flushSync` 函数内部的多个 `setState` 仍然为批量更新

---

## Suspense 增强 \- 支持服务端渲染

- 之前：`<Suspense>` 主要用于代码分割，在客户端动态加载组件时显示一个回退（fallback）UI。

- `Suspense` 并不是新功能，但它在 React 18 中的能力被**极大增强**，尤其是在**服务端渲染 \(SSR\)** 方面。

- **流式 SSR \(Streaming SSR\)**

  - **在 React 17 中：** SSR 是“全有或全无”。服务器必须获取所有数据，将整个页面渲染为 HTML，然后一次性发送给客户端。客户端也必须下载所有 JS，然后才能对整个页面进行“水合”\(Hydration\)。

  - **在 React 18 中：** 1\. **流式 HTML \(Streaming HTML\)：** 服务器**不再需要等待所有数据**，它可以先把“外壳”和 `fallback` 发送过来。 2\. **按需渲染：** 当服务器上的数据准备好时（例如数据库查询返回了），React 会将该部分的 HTML（`Suspense` 包裹的内容）“流式”发送到客户端，并替换掉 `loading` 状态。 3\. **选择性水合 \(Selective Hydration\)：** 客户端 JS 可以在 HTML 流式传输的同时开始“水合”。React 会优先水合用户正在交互的部分（例如用户点击的组件），而不会被其他正在水合的重组件阻塞。

```XML
<Layout>
  <NavBar /> {/* 快 */}

  <Suspense fallback={<Spinner />}>
    <Comments /> {/* 慢：需要请求数据 */}
  </Suspense>

  <Suspense fallback={<AdsSpinner />}>
    <Ads /> {/* 慢：需要请求数据 */}
  </Suspense>
</Layout>
```

> **流式 HTML \(Streaming HTML\) \- 在服务端**
>
> 1. **立即渲染“外壳”：** 服务器**不再等待** `Comments` 或 `Ads` 的数据。
>
> 2. **立即发送“外壳”：** 它会立即渲染 `Layout`、`NavBar` 以及 `Suspense` 的 `fallback`（即 `<Spinner />` 和 `<AdsSpinner />`）所对应的 HTML，并**立刻将这部分 HTML 发送**给客户端。
>
>    - **结果：** 用户的 TTFB 极快。浏览器几乎立即收到页面的基本结构并开始渲染。
>
> 3. **在服务端等待：** 同时，服务器在后台继续等待 `Comments` 和 `Ads` 的数据请求。
>
> 4. **流式发送剩余部分：**
>
>    - 假设 `Ads` 的数据（200ms）先准备好了。React 会在服务器上渲染 `Ads` 组件，然后将生成的 HTML **追加**发送（"Stream"）到已经建立的连接中，并附带一个小型 `<script>` 标签，告诉客户端用这段新 HTML 替换掉 `<AdsSpinner />`。
>
>    - 又过了 800ms，`Comments` 的数据（共 1000ms）准备好了。React 再次在服务器上渲染 `Comments`，并将这段 HTML **追加**发送到流中，替换掉 `<Spinner />`。
>
> **选择性水合 \(Selective Hydration\) \- 在客户端**
>
> 这是 `Suspense` 另一个强大的地方。水合过程不再是“一次性”和“阻塞”的。
>
> 1. **非阻塞水合：** 客户端收到了初始的“外壳” HTML 和 JS。React **不需要等待** `Comments` 的 HTML 流送达，就可以**开始水合** `NavBar` 和 `Layout`。
>
> 2. **按需水合：** `NavBar` 和 `Layout` 水合完成后，它们就变得可交互了，**即使 ****`Comments`**** 还在加载**。
>
> 3. **优先级处理：**
>
>    - 假设 `Ads` 的 HTML 流送达了，React 开始在后台水合 `Ads` 组件。
>
>    - **就在此时**，用户点击了 `<NavBar />`（一个已经水合的组件）。
>
>    - 在 React 17 中，水合 `Ads` 会阻塞主线程，导致用户点击事件被延迟响应。
>
>    - 在 React 18 中，React 会**检测到这个高优先级的用户交互（点击）**。它会**暂停** `Ads` 的水合（一个低优先级任务），立即去处理点击事件，然后再在空闲时**恢复** `Ads` 的水合。

- 核心价值：首屏加载更快（用户更早看到关键内容），交互激活更早（无需等全量 HTML 加载）。

### 传统 SSR 缺点

1. 必须获取到所有数据以后，才能返回内容

2. 必须加载到所有 JS 代码后，才能开始进行注水

3. 必须等整个应用注水完成后，才能开始进行交互

---

### 传统 SSR vs 流式 SSR

SSR流式渲染（Streaming Server Rendering）是React 18引入的服务器渲染新特性。它允许服务器以"流"的方式逐步发送HTML，而不是等待整个页面渲染完成后一次性发送。

```JavaScript
// 传统SSR
// 服务器端
import { renderToString } from 'react-dom/server';

app.get('/', (req, res) => {
  const html = renderToString(<App />);  // 等待全部完成

  res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${html}</div>
      </body>
    </html>
  `);
});

// 问题：
// 1. 必须等待所有数据加载完成
// 2. 阻塞整个响应
// 3. 用户长时间看到白屏

// 流式SSR（React 18）
import { renderToPipeableStream } from 'react-dom/server';

app.get('/', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    onShellReady() {
      res.setHeader('Content-Type', 'text/html');
      pipe(res);  // 立即开始发送HTML
    }
  });
});

// 优势：
// 1. 快速发送页面框架
// 2. 异步组件逐步流入
// 3. 更快的首屏时间
```

### Streaming Render 流式渲染

```JavaScript
// 服务器端数据获取
// api.js
export async function fetchUserData(userId) {
  const res = await fetch(`https://api.example.com/users/${userId}`);
  return res.json();
}

export async function fetchPosts(userId) {
  // 模拟慢速API
  await new Promise(resolve => setTimeout(resolve, 2000));
  const res = await fetch(`https://api.example.com/users/${userId}/posts`);
  return res.json();
}

// App.js
import { use } from 'react';

function UserProfile({ userId }) {
  const user = use(fetchUserData(userId));

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>

      <Suspense fallback={<PostsSkeleton />}>
        <UserPosts userId={userId} />
      </Suspense>
    </div>
  );
}

function UserPosts({ userId }) {
  const posts = use(fetchPosts(userId));

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </article>
      ))}
    </div>
  );
}

// server.js
app.get('/user/:id', (req, res) => {
  const { pipe } = renderToPipeableStream(
    <UserProfile userId={req.params.id} />,
    {
      onShellReady() {
        res.setHeader('Content-Type', 'text/html');
        pipe(res);
      }
    }
  );
});

// 执行流程：
// 1. 快速发送用户基本信息（name, email）
// 2. 发送PostsSkeleton
// 3. 2秒后发送UserPosts真实内容
```

多层嵌套

```JavaScript
// 复杂页面结构
function ProductPage({ productId }) {
  return (
    <html>
      <body>
        <Navbar />  {/* 立即渲染 */}

        <main>
          {/* 第一层：产品基本信息 */}
          <Suspense fallback={<ProductInfoSkeleton />}>
            <ProductInfo productId={productId} />

            {/* 第二层：评论 */}
            <Suspense fallback={<ReviewsSkeleton />}>
              <Reviews productId={productId} />
            </Suspense>

            {/* 第二层：推荐 */}
            <Suspense fallback={<RecommendationsSkeleton />}>
              <Recommendations productId={productId} />
            </Suspense>
          </Suspense>
        </main>

        <Footer />  {/* 立即渲染 */}
      </body>
    </html>
  );
}

// 渲染时间线：
// 0ms:    发送 Navbar, ProductInfoSkeleton, Footer
// 500ms:  ProductInfo准备好 -> 发送替换脚本
//         同时发送 ReviewsSkeleton 和 RecommendationsSkeleton
// 1000ms: Reviews准备好 -> 发送替换脚本
// 1500ms: Recommendations准备好 -> 发送替换脚本
```

---

### **Selection Hydration 选择性 Hydration**

#### Hydration 的三个步骤

1. **服务器端**：React 将组件树渲染成静态 HTML 字符串发给浏览器。

2. **浏览器初次展示**：用户立即看到了内容，但由于 JS 还没加载/执行完，页面处于“不可交互状态”。

3. **水合过程**：

   - 浏览器运行 React 代码。

   - React 在内存中构建一份虚拟 DOM 树。

   - React 将虚拟 DOM 与页面上已有的真实 DOM 进行对比。

   - **关键动作**：React 不会重新创建 DOM（那太慢了），它只是把事件监听器挂载到已有的 DOM 节点上。

**“水合不一致” \(Hydration Mismatch\) 报错**

你可能在开发时见过这个红色的报错： `Text content did not match. Server: "A" Client: "B"`

这是因为 **React 要求服务器生成的 HTML 必须和客户端第一次渲染的结果完全一致。**

- **典型杀手：时间或随机数。**

```JavaScript
// ❌ 错误做法：服务器渲染时是 10:00，客户端注水时是 10:01
// React 会发现两边对不上，导致注水失败，甚至被迫重绘整个页面。
<span>{new Date().toLocaleTimeString()}</span>
```

#### Suspense 与流式注水 \(Selective Hydration\)

在 React 18 之后，Hydration 变得更聪明了。

以前的 Hydration 是“一刀切”：必须整个页面的 JS 都下载完，才能开始注水。 现在配合 **Suspense**，React 可以实现**局部注水**。如果你的评论区组件还没下载完，React 可以先给导航栏和侧边栏注水。用户点击了哪个部分，React 还会**优先**给那个部分注水。这种“看人下菜碟”的机制被称为 **Selective Hydration**。

```JavaScript
// React 18的选择性Hydration
function App() {
  return (
    <html>
      <body>
        <Header />  {/* 立即hydrate */}

        <Suspense fallback={<Spinner />}>
          <Comments />  {/* 延迟hydrate，用户交互时优先 */}
        </Suspense>

        <Suspense fallback={<Spinner />}>
          <Sidebar />  {/* 延迟hydrate */}
        </Suspense>
      </body>
    </html>
  );
}

// Hydration顺序：
// 1. Header立即hydrate
// 2. 用户点击Comments -> Comments优先hydrate
// 3. Sidebar等待或后台hydrate

// 客户端代码
hydrateRoot(document, <App />, {
  onRecoverableError(error) {
    console.error('Hydration error:', error);
  }
});
```

---

## 支持Concurrent模式

通过 `createRoot`、`startTransition`、`useDeferredValue` 等 API 让高优先级任务先执行、低优先级任务可延迟，从而改善交互流畅度。

> 并发渲染是 React 18 引入的全新渲染机制，核心是让 React 具备 “中断、暂停、恢复或放弃渲染” 的能力：
>
> - 它将渲染过程分为 “准备阶段（Render Phase）” 和 “提交阶段（Commit Phase）”；
>
> - 准备阶段（计算虚拟 DOM 变化）是 “可中断的”——React 可根据任务优先级，暂停低优先级任务（如长列表渲染），先执行高优先级任务（如用户输入、点击）；
>
> - 提交阶段（将虚拟 DOM 变更应用到真实 DOM）是 “不可中断的”—— 确保 UI 更新的原子性，避免出现 “半成品 UI”。

---

### `useTransition` vs `useDeferredValue`

**一句话总结：**

它们的目的相同（将更新标记为“非紧急”，防止卡顿），但**使用时机和控制方式**不同。

- `useTransition`：是“主动的”。你**用它来包裹“即将要做的”状态更新**（那个 `setState` 动作）。

- `useDeferredValue`：是“被动的”。你**用它来包裹“已经收到的”值**（那个 `value` 变量）。

---

### startTransition 和 useTransition

- 这是并发模式下最重要的一个新功能，它解决了**渲染优先级**的问题。

- 区分**紧急更新**和**非紧急更新**

- `startTransition`包裹里的更新函数被当做是**非紧急事件**，如果有别的紧急更新（`urgent update`）进来，那么这个`startTransition`包裹里的更新则会被打断

- React 18 允许你将状态更新标记为两种类型：

  - **紧急更新 \(Urgent Updates\):** 比如用户输入、点击。需要立即响应。

  - **过渡更新 \(Transition Updates\):** 比如搜索结果的展示、页面的切换。这些更新可以稍后进行。

`startTransition` 就是用来将一个更新标记为“过渡更新”（即非紧急）的。

> **`useTransition`****：主动控制状态更新**
>
> "我知道这个 `setState` 会导致一个很慢的渲染，请你‘过渡’着去做。"
>
> 当你**能控制**那个引发慢渲染的 `setState` 函数时，就用它。
>
> 它会给你两个东西：
>
> 1. `isPending`：一个布尔值，告诉你“非紧急”更新是否还在后台等待。
>
> 2. `startTransition`：一个函数，你把“非紧急”的 `setState` 放进这个函数里。

- **示例场景：** 假设你有一个搜索框。

  - 用户在输入框中**输入文本**（例如 'abc'）是**紧急更新**。

  - 根据 'abc' **渲染搜索结果列表**是**过渡更新**。

  - 你**同时管理**着输入框的值（紧急）和搜索结果的值（非紧急）。

```JavaScript
import { useTransition }s from 'react';

function SearchPage() {
  const [isPending, startTransition] = useTransition();
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (e) => {
    // 1. 紧急更新：立即更新输入框的值
    setInputValue(e.target.value);

    // 2. 过渡更新：用 startTransition 包裹
    startTransition(() => {
      // 这个更新被标记为“非紧急”
      // 它不会阻塞输入框的更新
      setSearchQuery(e.target.value);
    });
  };

  return (
    <div>
      <input value={inputValue} onChange={handleChange} />

      {isPending && <div>Loading...</div>}

      {/* SearchResults 组件会根据 searchQuery 渲染，这是一个“慢”渲染 */}
      <SearchResults query={searchQuery} />
    </div>
  );
}
```

- **好处：** 在 React 17 中，`handleChange` 会同时更新 `inputValue` 和 `searchQuery`，如果 `SearchResults` 渲染很慢，整个页面都会卡住，导致用户的输入操作也变得卡顿。

- 在 React 18 中，`startTransition` 告诉 React：“请优先保证 `setInputValue`（紧急更新）完成，`setSearchQuery`（过渡更新）可以稍后渲染，如果中途有新的输入，可以打断这个渲染。”

- `isPending` 是一个布尔值，告诉你“过渡更新”是否还在后台等待渲染，非常适合用来显示 loading 状态。

- 高优先级更新（输入框）不会被低优先级渲染阻塞

- `useTransition`

  - 在使用`startTransition`更新状态的时候，用户可能想要知道`transition`的实时情况，这个时候可以使用`React`提供的`hook api useTransition`

  ```JavaScript
  import { useTransition } from 'react';
  const [isPending, startTransition] = useTransition();
  ```

  - 如果`transition`未完成，`isPending`值为`true`，否则为`false`

---

### useDeferredValue

- **作用**：生成一个“延迟版本”的值，延迟更新某个值，让 React **优先渲染紧急更新**（如输入），把耗时更新延后处理。

- 当 React 在处理紧急更新时，这个“延迟”版本的值会保持为旧值，直到紧急更新完成后，才更新为新值。

- **场景**：大型列表搜索或过滤、复杂组件渲染、动画中间值更新。

- **核心思想**：将**低优先级更新**延后渲染，让界面保持响应性。

> **`useDeferredValue`****：被动接收值**
>
> "我收到了这个 `value`，它变得太快了。请给我一个‘延迟’的版本，用它来做慢渲染。"
>
> 当你**不能（或不方便）控制** `setState`，比如这个值是**从父组件 props 传来的**，或者它和你的紧急状态是同一个值时，就用它。

```JavaScript
import { useState, useDeferredValue } from 'react';

function SearchList({ items }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query); // 延迟版本

  const filteredItems = items.filter(item => item.includes(deferredQuery));

  return (
    <>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      <ul>
        {filteredItems.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}
```

1. 用户每次输入 → `query` 更新（高优先级）

2. `deferredQuery` 更新延迟（低优先级）

3. `filteredItems` 根据延迟值更新 → 复杂列表渲染不会阻塞输入响应

```JavaScript
import { useState, useDeferredValue } from 'react';

function SearchPage() {
  const [inputValue, setInputValue] = useState('');

  // deferredValue 会“滞后”于 inputValue
  // 当用户快速输入时，inputValue 马上变，但 deferredInputValue 会等一等
  const deferredInputValue = useDeferredValue(inputValue);

  const handleChange = (e) => {
    setInputValue(e.target.value); // 紧急更新
  };

  return (
    <div>
      <input value={inputValue} onChange={handleChange} />

      {/* 这里使用 deferredInputValue。
        当 inputValue 变化时，这个组件会尝试重新渲染，
        但 React 知道这个渲染是可推迟的，
        因此它不会阻塞 input 的响应。
      */}
      <SearchResults query={deferredInputValue} />
    </div>
  );
}
```

- **控制点：** 你**包裹的是 ****`inputValue`**** 这个值**，而不是 `setInputValue` 那个动作。React 会尽力保持 `deferredQuery` 的“旧值”，直到紧急更新（`input` 的渲染）完成后，才把它更新为新值。

---

## 新的 hooks

- `useId`

  - 这是一个简单但非常实用的 Hook，用于生成在**客户端和服务端**之间保持一致的、唯一的 ID。

  - **解决的问题：** 在 SSR 中，如果你使用 `Math.random()` 来生成 `id`，客户端和服务器生成的 `id` 会不匹配，导致“水合错误”。

```JavaScript
import { useId } from 'react';

function InputWithLabel({ label }) {
  const id = useId(); // React 18 保证 SSR/客户端一致
  return (
    <>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </>
  );
}
```

- `useSyncExternalStore`：供第三方状态库（如 Redux）使用，以确保在并发读取时与外部存储同步。

- `useInsertionEffect`：主要用于 CSS\-in\-JS 库，用于在布局副作用（`useLayoutEffect`）之前注入样式。

# React 19 新增了哪些特性

## **原生支持文档元数据标签**

在 React 19 之前，管理文档的 `<head>`（例如 `<title>`、`<meta>` 标签）需要依赖 `react-helmet` 这样的第三方库。

- **是什么：** React 19 现在允许你直接在组件树中渲染 `<title>`、`<link>` 和 `<meta>` 标签。

- **如何工作：** React 会自动将这些标签“提升”到文档的 `<head>` 部分，无论你把它们写在组件树的哪个位置。

```JavaScript
// React 19 支持直接在组件中渲染标签，并自动将它们提升到对应部分
function BlogPost({post}) {
  return (
    <div>
      <meta name="author" content="test" />
      <link rel="author" href="https://test.com/" />
      <meta name="keywords" content={post.keywords} />
    </div>
  );
}
```

---

## Server Components与服务器端渲染

- `Server Components`提供了一种全新的组件渲染模式，允许在服务器上提前渲染组件，这减少了客户端的渲染负担，提升了页面的加载速度和性能

- 静态HTML生成

  - React 19新增了`prerender`和`prerenderToNodeStream`两个API，用于静态网站生成

  - 这些API支持流式环境，如Node\.js Streams和Web Streams，使得服务端预渲染组件更为高效

**客户端渲染 \(CSR\) 流程：**

1. 浏览器请求 URL。

2. 服务器返回一个几乎**空的 HTML 文件**（通常只有一个 `<div id="root"></div>`）和一堆 JavaScript 链接。

3. 浏览器下载并解析 HTML，然后开始下载 JavaScript。

4. 浏览器执行 JavaScript（通常是 React、Vue 等框架代码）。

5. JavaScript 执行过程中，再向服务器请求数据（API 调用）。

6. 服务器返回数据（JSON）。

7. JavaScript 使用数据在浏览器中动态生成 DOM 元素，并插入到 `#root` 中。

8. 页面最终显示出来。

用户会看到：空白页 \-\> 加载动画 \-\> 内容突然出现。

**服务器端渲染 \(SSR\) 流程：**

1. 浏览器请求 URL。

2. 服务器收到请求，立即运行 React/Vue 组件，调用相关数据 API。

3. 服务器将组件和数据渲染成**完整的 HTML 字符串**。

4. 服务器将这个包含初始数据的完整 HTML 发送给浏览器。

5. 浏览器立刻就能解析并显示这个 HTML（用户瞬间看到了内容）。

6. 同时，浏览器也会下载页面所需的 JavaScript。

7. JavaScript 加载完成后，会“接管”（Hydration）已经存在的 HTML，使其变得可交互（比如绑定点击事件）。

> - Hydration（注水/激活）—— 客户端的接管：
>
>   - 浏览器会下载并执行客户端 React 的 JavaScript 代码。
>
>   - 客户端 React 开始工作。它看到 `#root` div 里已经存在服务器预渲染好的 DOM 节点。
>
>   - 此时，客户端 React 会重新执行组件代码，再次构建完整的 Fiber 树。但这次它有一个非常重要的任务：将这个新构建的 Fiber 树与已有的静态 DOM 树进行“关联”，而不是直接创建新的 DOM。
>
>   - 这个过程叫做 Hydration。React 会遍历 Fiber 树，为每个 DOM 节点附加相应的事件监听器，并建立起完整的交互能力（如点击事件、状态更新等）。
>
>   - Hydration 之后，应用就变成了一个正常的 CSR 应用，后续的状态更新都会走客户端的 Reconciliation 和 Commit 流程。

用户会看到：内容立刻出现 \-\> 然后变得可以交互（按钮可以点了）。

---

## useActionState 管理异步函数状态

在 React 19 之前，当你处理一个表单提交（尤其是异步提交）时，你需要手动管理一大堆状态：

1. 待定状态（Pending）：请求是否正在发送？用于禁用提交按钮、显示加载 spinner。

2. 错误状态（Error）：如果提交失败，错误信息是什么？如何向用户展示？

3. 表单数据：表单本身的数据。

4. 乐观更新（Optimistic Update）：为了更好的用户体验，在请求完成前就先更新 UI，如果失败再回滚。实现起来非常繁琐。

`useActionState` 将这个非常常见的模式内置到了 React 本身，让你无需重复编写这些样板代码。

```JavaScript
const [state, action, isPending] = useActionState(fn, initialState, permalink?);
```

返回参数含义：

- `state`：代表 `fn` 函数返回的内容，`fn` 未执行时，等于 `initialState`

- `formAction`：用来触发 `fn` 函数执行，可以直接调用，也可以传递给 `form` 的 `action` 属性

- `isPending`：`fn` 函数是否正在执行中

传入参数含义：

- `fn`：一个异步函数，接受两个参数 `previousState`和 `formData`

  - `previousState`： 代表上一次执行 `fn` 返回的内容，首次调用等于 `initialState`

  - `formData`：代表调用 \`

- `initialState`：fn 没执行时，默认的 `state`

- `permalink`：一个 URL 字符串，通常和服务端组件有关系。（表示暂时没看懂干啥的）

```JavaScript
export default function ActionStateDemo() {
  const [name, setName] = useState("");

  // 接受一个异步请求函数，返回 [data、action、pending]
  const [error, handleSubmit, isPending] = useActionState(
    async (previousState, name) => {
      try {
        await updateName(name);
        console.log("Name updated successfully");
        return null;
      } catch (e) {
        console.log("error");
        return e.message;
      }
    }
  );

  return (
    <div>
      <input value={name} onChange={(event) => setName(event.target.value)} />
      <button
        onClick={() => {
          startTransition(() => {
            handleSubmit(name);
          });
        }}
        disabled={isPending}
      >
        Update
      </button>
      {error && <p>{error}</p>}
    </div>
  );
}
```

- 不用 `startTransition` 来包裹，`useActionState` 就没用。

- 通过 `form action` 触发的 `handleSubmit`，其内置了 `startTransition` ，所以不需要手动设置。

```HTML
<form action={handleSubmit}></form>
```

---

## use

### use\(Promise\)

- 假如我们要实现这样一个需求：请求接口数据，请求过程中，显示 loading，请求成功，展示数据。

```JavaScript
export default function ReactUseDemo() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChildCompont />
    </Suspense>
  );
}

function ChildCompont() {
  const data = use(getData());
  return <div>{data}</div>;
}
```

- `use()` 接收 **Promise 或可 thenable 对象**

- React 检测到它未完成 → 抛出 `Promise` → 被 Suspense 捕获 → 显示 fallback

- Promise resolve → React 重新调度渲染，得到最终值

---

### use\(Context\)

> 相同的 use 钩子可以用来读取 React 上下文。它和 `useContext` 完全一样，除了它**可以在循环和条件语句中调用，就像 if**

```JavaScript
import { use } from "react";
function HorizontalRule({ show }) {
  if (show) {
    const theme = use(ThemeContext);
    return <hr className={theme} />;
  }
  return false;
}
```

---

## useOptimistic 进行乐观更新

> 乐观更新是一种常见的体验优化手段，在发送异步请求之前，我们默认请求是成功的，让用户立即看到成功后的状态。
>
> ---
>
> 1. **为什么叫“乐观”？**
>
> 在传统的交互逻辑中，我们的心态是**保守**的：
>
> - 用户点赞 \-\> 发送请求 \-\> **等待**服务器返回成功 \-\> 界面上心形变红。
>
> - **缺点：** 如果网络延迟有 1 秒，用户就会觉得点赞很“肉”，甚至以为没点上。
>
> 而**乐观更新**的心态是：
>
> - 用户点赞 \-\> **立即**把心形变红（假设服务器一定会成功） \-\> 同时发送请求。
>
> - **优点：** 用户感觉操作是瞬间完成的，响应极快。
>
> ---
>
> 2. **乐观更新的“三步走”逻辑**
>
> 虽然叫乐观更新，但我们不能真的盲目乐观。一套成熟的乐观更新逻辑必须包含这三个步骤：
>
> 1. **保存快照（Snapshot）：** 在更新界面前，先偷偷记下当前的真实数据（以防万一失败了好回滚）。
>
> 2. **立即执行（Update）：** 强行修改本地状态，让用户立刻看到变化。
>
> 3. **处理结局（Settle）：**
>
>    - **如果成功：** 岁月静好，什么都不用做，或者等服务器返回最终结果进行微调。
>
>    - **如果失败：** 拿出之前存的**快照**，把界面强行还原（回滚），并弹窗告诉用户：“抱歉，刚才点赞没成功。”
>
> ---
>
> 3. **乐观更新最适合的场景**
>
> 并不是所有地方都适合“乐观”。
>
> - **适合：** \* 点赞、收藏（频率高，且失败了回滚也没大碍）。
>
>   - 聊天消息（发出去直接显示在气泡里，失败了旁边显示个红色感叹号）。
>
>   - 修改备注、简单的开关切换。
>
> - **不适合：**
>
>   - **支付、转账**（绝对不能乐观！必须等银行确认）。
>
>   - 删除重要文件（万一没删掉，用户以为删了，会有隐私隐患）。
>
>   - 涉及库存的下单。

先来看看官方提供的例子：提交表单更新 name，可以立即将新的 name 更新到 UI 中。更新nanme的请求成功则 UI 不变，请求失败则 UI 回滚。

```JavaScript
function ChangeName() {
  const [name, setName] = useState("");

  // 定义乐观更新的状态
  const [optimisticName, setOptimisticName] = useOptimistic(name);

  const submitAction = async (formData) => {
    const newName = formData.get("name");
    // 请求之前，先把状态更新到 optimisticLike
    setOptimisticName(newName);
    try {
      await updateName(newName);
      // 成功之后，更新最终状态
      setName(newName);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <form action={submitAction}>
      <p>Your name is: {optimisticName}</p>
      <p>
        <label>Change Name:</label>
        <input type="text" name="name" disabled={name !== optimisticName} />
      </p>
    </form>
  );
}
```

> 官方示例是通过 `form` 的 `action` 调用的，其默认内置了 `startTransition`。否则需要使用 startTransition 包裹

---

## useFormStatus 获取表单状态

- 快捷读取到最近的父级 `form` 表单的数据

```JavaScript
import { useFormStatus } from "react-dom";
import action from './actions';

function Submit() {
  const status = useFormStatus();
  return <button disabled={status.pending}>Submit</button>
}

export default function App() {
  return (
    <form action={action}>
      <Submit />
    </form>
  );
}
```

```JavaScript
const { pending, data, method, action } = useFormStatus();
```

- `pending`：是否正在提交中

- `data`：表单正在提交的数据，如果 `form` 没有被提交，则为 `null`

- `method`：`form` 的 `method` 属性，`get` 或 `post`

- `action`：`form` 的 `action` 属性，如果 `action` 不是函数，则为 `null`

---

## useTransition 支持异步函数

> `useTransition` 是 `React 18` 新增的一个 Hook，主要用来标记低优先级更新，低优先级更新是可以被中断的。在 React 18 中，`useTransition` 返回的 `isPending` 代表这次低优先级的更新正在等待中。

在 `18` 中，`useTransition` 返回的 `startTransition` 只支持传递同步函数，而在 19 中，增加了对异步函数的支持。通过这个特性，我们可以用来自动维护异步请求的 `isPending` 状态。

---

## 预加载资源

- 在初始文档加载和客户端更新期间，告诉浏览器有关资源可能需要尽早加载的资源可能会对页面性能产生巨大影响

- React 19包括许多用于加载和预加载浏览器资源的新API，以使其尽可能容易地建立不受效率低下的资源加载来阻止的出色体验

```JavaScript
import { prefetchDNS, preconnect, preload, preinit } from 'react-dom'
function MyComponent() {
  preinit('https://.../path/to/some/script.js', {as: 'script' }) // loads and executes this script eagerly
  preload('https://.../path/to/font.woff', { as: 'font' }) // preloads this font
  preload('https://.../path/to/stylesheet.css', { as: 'style' }) // preloads this stylesheet
  prefetchDNS('https://...') // when you may not actually request anything from this host
  preconnect('https://...') // when you will request something but aren't sure what
}
```

```XML
<!-- the above would result in the following DOM/HTML -->
<html>
  <head>
    <!-- links/scripts are prioritized by their utility to early loading, not call order -->
    <link rel="prefetch-dns" href="https://...">
    <link rel="preconnect" href="https://...">
    <link rel="preload" as="font" href="https://.../path/to/font.woff">
    <link rel="preload" as="style" href="https://.../path/to/stylesheet.css">
    <script async="" src="https://.../path/to/some/script.js"></script>
  </head>
  <body>
    ...
  </body>
</html>
```

---

## ref

- React 19 允许函数组件直接接受 refs 作为 props，减少了使用 `forwardRef` 的需求。

```JavaScript
export const Input = ({ ref }) => {
  return <input ref={ref} />;
};
```

---

## Context

- 在 `React 19` 中，我们可以使用 `Context`来代替 `Context.Provider`了

```JavaScript
function App({ children }) {
  return (
    <ThemeContext value="dark">
      {children}
    </ThemeContext>
  );
}
```

### 阶段一：核心概念与基石 \(The "What \& Why"\)

这个阶段的目标是理解 React 的核心设计哲学，以及它用来描述 UI 的基本单元。

1. **声明式 UI \(Declarative UI\)**

   - 理解“声明式”与“命令式”编程（例如直接操作 DOM）的根本区别。

   - 为什么声明式 UI 能让代码更可预测、更易于调试？

2. **JSX 的本质**

   - JSX 到底是什么？它不是 HTML，也不是 JavaScript 的标准。

   - Babel 是如何将 JSX 转换为 `React.createElement()` 函数调用的？

   - 理解 `React.createElement()` 的参数（`type`, `props`, `...children`）。

   - **实践：** 尝试不使用 JSX，直接用 `React.createElement()` 来写一个简单的组件。

3. **组件 \(Components\) 与 Props**

   - 理解“组件”作为 UI 封装的基本单元。

   - **Props：** 彻底理解 `props` 是只读的（immutability），以及为什么 React 强制要求“纯函数”组件（对于相同的 props，总是返回相同的 UI）。

   - **`props.children`****：** 理解这个特殊 prop 的工作原理。

### 阶段二：状态、生命周期与 Hooks \(The "When \& How"\)

这个阶段关注组件如何管理自己的数据，以及如何在不同时间点（生命周期）响应变化。

1. **State \(状态\)**

   - State 与 Props 的根本区别（State 是组件内部的，Props 是外部传入的）。

   - `setState` 的工作原理：为什么它是**异步**的？

   - `setState` 的批量更新（Batching）机制是什么？（在 React 18 之前和之后的区别）。

   - **单向数据流 \(Unidirectional Data Flow\)**：理解为什么数据总是从父组件流向子组件，这如何帮助追踪 bug。

2. **Hooks 原理（重点）**

   - **`useState`****：** React 是如何知道哪个 `useState` 对应哪个 state 变量的？（提示：Hooks 的调用顺序）。

   - **`useEffect`****：** 它的设计目的是什么？（处理“副作用”）。

   - `useEffect` 的依赖数组（`deps`）是如何工作的？（浅比较）。

   - `useEffect` 的执行时机（DOM 更新后）。

   - `useLayoutEffect` 与 `useEffect` 的区别（执行时机，一个同步一个异步）。

   - **`useCallback`**** / ****`useMemo`****：** 它们是做什么的？（性能优化）。它们如何利用依赖数组来缓存函数和值？

   - **`useRef`****：** `useRef` 和创建一个 `{ current: ... }` 对象有什么区别？（`useRef` 在组件重渲染时保持不变）。

   - **自定义 Hooks \(Custom Hooks\)：** 理解它们为什么是封装和复用“有状态逻辑”的最佳方式。

3. **\(选学\) Class 组件生命周期**

   - 虽然现在 Hooks 是主流，但了解 `constructor`, `render`, `componentDidMount`, `componentDidUpdate`, `componentWillUnmount` 这些经典生命周期，能帮你更好地理解 `useEffect` 的设计意图（它合并了 `cDM`, `cDU`, `cWU` 的功能）。

### 阶段三：核心协调机制 \(The "Magic"\)

这是 React 原理的核心，即 React 如何将你的组件“变化”高效地更新到真实 DOM 上。

1. **虚拟 DOM \(Virtual DOM\)**

   - V\-DOM 是什么？（它是一个内存中的 JavaScript 对象，描述了 UI 树）。

   - 为什么需要 V\-DOM？（直接操作 DOM 的开销很大，V\-DOM 提供了一个抽象层，允许 React 批量和优化 DOM 操作）。

2. **Reconciliation \(协调\)**

   - 这是 React 的“大脑”。当 state 改变时，React 会做什么？

   - **Diffing 算法（启发式算法）：**

     - **规则一：** 比较不同类型的元素（例如 `<div>` 变为 `<p>`） \-\> 直接卸载旧树，创建新树。

     - **规则二：** 比较相同类型的 DOM 元素（例如 `<div>` 变为 `<div>`） \-\> 保留 DOM 节点，只更新变化的属性（`style`, `className` 等）。

     - **规则三：** 列表（Arrays）的 Diffing 和 **`key`**** Prop** 的重要性。

   - **`key`**** 的作用：** 必须深入理解 `key` 是如何帮助 React 识别哪些元素被移动、添加或删除了。**这是面试的绝对高频考点。**

3. **React Fiber 架构**

   - 这是 React 16 引入的对核心协调算法的重写。

   - **它解决了什么问题？** （旧的 Stack Reconciler 是同步的，如果组件树很大，更新会阻塞主线程，导致页面卡顿）。

   - **Fiber 是什么？** （一个 Fiber 节点是一个工作单元，也是 V\-DOM 节点的一种数据结构）。

   - **它是如何工作的？** （可中断、可恢复的渲染）。它将渲染工作分为小块，可以在浏览器空闲时执行，从而实现了**异步渲染（Async Rendering）**。

### 阶段四：高级概念与模式

1. **Context API**

   - `Context` 是如何实现跨层级数据传递的？

   - `Context` 的 `Provider` 和 `Consumer` 是如何工作的？

   - `useContext` Hook。

   - **性能问题：** 为什么滥用 Context 会导致不必要的重渲染？（当 Context 的值变化时，所有 `Consumer` 都会重渲染，即使它们只关心值的一部分）。

2. **Refs \& Forwarding Refs**

   - Refs 的主要用途（访问 DOM 节点、管理焦点、集成第三方库）。

   - `useRef` vs `createRef`。

   - `forwardRef`：为什么需要它？（为了将 ref “转发”穿透到子组件内部的 DOM 节点）。

   - `useImperativeHandle`：如何与 `forwardRef` 结合，自定义暴露给父组件的 ref 实例？

3. **React 事件系统 \(SyntheticEvent\)**

   - React 为什么要自己实现一套事件系统？（抹平浏览器差异，性能）。

   - **事件委托（Event Delegation）：** React 是如何将所有事件都委托到 `document`（或 React 17\+ 的 `root`）上的？

   - `SyntheticEvent` 对象池是什么？

### 阶段五：性能优化

当你理解了前面的原理，你自然会知道如何进行优化。

1. **`React.memo`**

   - 它是一个高阶组件（HOC），用于包裹组件。

   - 它是如何工作的？（浅比较 `props`）。

   - 与 `useMemo` 的区别（`memo` 缓存组件渲染结果，`useMemo` 缓存计算结果）。

2. **`useMemo`**** 与 ****`useCallback`**** 的真正用途**

   - 它们不仅是用来“跳过昂贵计算”的。

   - 更重要的用途是：**在与 ****`React.memo`**** 或 ****`useEffect`**** 配合时，保持引用的稳定性**，防止不必要的重渲染或 `useEffect` 的重复执行。

3. **代码分割 \(Code Splitting\)**

   - `React.lazy()` 和 `Suspense` 是如何配合实现组件懒加载的？

### 阶段六：并发与未来 \(Concurrent React\)

这是 React 最前沿的领域，也是 Fiber 架构的最终目的。

1. **并发模式 \(Concurrent Mode/Features\)**

   - 理解“并发”不是“并行”，它是一种在主线程上交错执行多个任务（例如渲染和用户输入）的能力。

2. **`useTransition`**** 和 ****`startTransition`**

   - 它们是做什么的？（将某些更新标记为“非紧急”的，允许更紧急的更新（如用户输入）打断它们）。

   - 这如何改善用户体验？

3. **Suspense for Data Fetching**

   - 理解 Suspense 如何从“代码分割”扩展到“数据获取”，让组件可以“等待”异步数据加载完成。

# 不同 React 版本设计思想转变

## 早期 React：**UI = state 的函数映射**

大概是 React 0\.x 到 15 这个阶段。

这一阶段最核心的设计思想是：

**用声明式方式描述 UI，让开发者只关心“当前状态下界面应该长什么样”，而不是手动操作 DOM。**

在 jQuery 时代，大家经常是：

- 找 DOM

- 改 class

- 改 text

- 绑定解绑事件

React 早期的革命性就在于，它把前端从“命令式改 DOM”拉到“声明式描述视图”。

所以当时最重要的理念不是 hooks，不是并发，而是：

**state 变了，重新 render，React 帮你算怎么更新 DOM。**

这一代的关键词是：

- Declarative UI

- Component\-based

- Virtual DOM

- 单向数据流

这一时期的 React，本质目标是 **提升 UI 开发的可维护性**。

---

## React 15 及以前：**同步递归渲染，先有简单可用的组件模型**

这时虽然已经有 Virtual DOM 和组件思想，但底层架构还是比较“直接”的。

它的特点是：

**更新过程基本是同步、递归、一口气做完的。**

意思是只要开始 render/reconcile，就会一路走到底，中间很难暂停、打断、插队。

这套设计在小中型应用里够用，但问题也很明显：

- 大树更新可能卡顿

- 没法很好区分任务优先级

- 动画、输入响应可能被阻塞

- 无法为未来异步调度打基础

所以这一代的设计思想可以说是：

**先把组件化和声明式 UI 做出来，调度能力先不复杂化。**

也就是先解决“能不能优雅写 UI”，还没重点解决“更新过程能不能智能调度”。

---

## React 16：**从“视图库”走向“可调度的 UI 引擎”**

这是特别关键的一次转向。
React 16 最大的思想变化，不只是“支持 error boundary、fragment”，而是 **Fiber 架构**。

Fiber 的核心设计思想是：

**把原来不可中断的递归渲染，改造成可拆分、可暂停、可恢复、可调度的增量工作模型。**

这是 React 历史上最重要的架构升级之一。

从这里开始，React 不再只是一个“把 state 映射成 UI 的库”，而是开始变成：

**一个带调度系统的渲染引擎。**

为什么要这么做？

因为 React 团队发现，真正的大型交互应用里，问题已经不是“会不会 render”，而是：

- 哪些更新更重要

- 哪些更新可以延后

- 能不能把长任务拆开

- 能不能先保证用户输入丝滑

- 能不能为异步渲染铺路

所以 React 16 的设计重心变成了：

**让渲染过程具备调度能力，而不只是正确地产生结果。**

这代的关键词是：

- Fiber

- Incremental rendering

- Scheduling

- Error boundaries

---

## React 16\.8：**从类组件心智模型转向函数式组合模型**

这就是 Hooks 的出现。

Hooks 的意义不只是“函数组件也能 useState”，更深层的设计思想变化是：

**React 希望用函数组件 \+ Hooks 取代 class component，建立一种更容易复用逻辑、更贴近组合式思想的模型。**

类组件时代的主要问题有：

- 生命周期分散，逻辑容易碎

- 复用逻辑要靠 HOC / render props，很绕

- `this` 心智负担大

- 副作用逻辑和渲染逻辑容易缠在一起

Hooks 想解决的是：

**让状态逻辑、副作用逻辑、复用逻辑，都能按“功能”组织，而不是按生命周期切碎。**

所以 Hooks 的设计思想是：

- 组件尽量函数化

- 逻辑按关注点组合

- 状态能力通过 hook 注入

- 复用通过自定义 hook 实现

从这开始，React 的推荐写法彻底转向函数组件。

也就是说，React 的心智模型从：

**“写一个类，继承组件生命周期”**

变成了：

**“写一个函数，在函数里声明状态和副作用”**

这是开发范式层面的重大转向。

---

## React 17：**为渐进升级和未来并发能力铺路**

React 17 表面上“没什么大功能”，但它的设计思想其实是：

**减少破坏性升级成本，重构内部边界，为未来版本铺路。**

它不是那种用户一眼能看到新 API 的版本，而更像“架桥”的版本。
比如事件系统从绑在 `document` 改成绑在 root 容器上，这件事背后就是为了：

- 更好支持多版本 React 共存

- 更容易渐进升级

- 改善嵌套 React 树的事件处理问题

所以 React 17 的关键词不是新能力，而是：

**兼容性、平滑升级、内部重构。**

可以理解成一个“过渡版本”。

---

## React 18：**从可调度渲染走向并发用户体验优先**

React 18 才真正把前面 Fiber 铺的路显性化。

这一代的核心思想是：

**不是让 render 更快，而是让用户感觉更流畅。**

这点特别重要。

React 18 的重点不只是“**并发渲染**”这四个字，而是：

**更新开始有优先级，非紧急任务可以让路给紧急任务。**

例如：

- 输入框输入要立刻响应

- 大列表过滤可以稍后完成

- 页面切换时可以先保留旧 UI，等新 UI 准备好再切

所以 React 18 的设计思想已经明显不是“同步算完最新 UI”，而是：

**在一致性可控的前提下，提升交互体验和响应性。**

代表能力有：

- **Concurrent rendering 并发渲染**

- `startTransition`

- `useTransition`

- `useDeferredValue`

- 更完善的 Suspense 支持

- **自动批处理 **

这一阶段 React 更强调：

**更新不是平等的，UI 系统应该能表达“哪些更新更 urgent”。**

---

## React 18 往后：**React 不只是客户端 UI 库，而是全栈渲染协议的一部分**

这是近几年非常大的一个思想变化。

尤其在 Server Components、Suspense for data fetching、流式 SSR 这些方向上，React 的设计目标已经不只是浏览器里渲染组件，而是：

**把“组件模型”扩展到服务端和客户端协同。**

也就是说，React 现在越来越像一个 **跨端、跨运行时的 UI 协议**：

- 哪些组件在服务端执行

- 哪些组件在客户端 hydrate

- 数据和组件如何一起流式传输

- 服务端输出如何和客户端继续接上

所以这阶段的设计思想是：

**组件不再天然等于浏览器里执行的东西，React 开始把服务端也纳入组件系统。**

这和最早“前端视图库”的定位已经差很多了。

---

### 第一次转向：React 早期

**从命令式 DOM 操作，转向声明式组件化 UI。**

### 第二次转向：React 16

**从同步渲染库，转向可调度的渲染引擎。**

### 第三次转向：React 16\.8 以后到 18\+

**从客户端组件库，转向函数式组合模型 \+ 并发体验优化 \+ 服务端协同渲染体系。**

---

**React 15 以前**：重点是声明式 UI、组件化、Virtual DOM。
**React 16**：重点是 Fiber，把 React 变成可调度渲染架构。
**React 16\.8**：重点是 Hooks，把心智模型从 class 转向函数组合。
**React 17**：重点是平滑升级和内部边界调整。
**React 18**：重点是并发能力和用户体验优先的调度。
**更新的 React 方向**：重点是服务端组件、流式渲染、全栈协同。

---

**React 不同版本的核心设计思想是在不断变化的。早期 React 主要解决的是声明式 UI 和组件化开发问题；React 16 通过 Fiber 把它从一个同步渲染库升级成了可调度的渲染引擎；React 16\.8 的 Hooks 又把开发范式从类组件切换到函数式组合；到 React 18，则进一步强调并发渲染和交互优先级控制，目标从“尽快渲染完”变成“让用户感觉更流畅”。而更新的 React 方向，则是在把组件模型扩展到服务端，形成客户端和服务端协同的渲染体系。**

# 杂项

1. React不会渲染**null、undefined、false和true（所有布尔值）**。这些值会被忽略，不会出现在DOM中。但是会渲染**0、空字符串""、NaN**。特别注意：0会被渲染为文本"0"，这常导致条件渲染bug。

2. map必须return值，否则会渲染undefined（不显示）

3. map可以返回null来跳过渲染某些值

4. Children 作为props的优势：
   children是在父组件的父级创建的，父组件state变化不会影响children的渲染。这是"组件组合"模式的优势，可以避免不必要的渲染。例如：`<Layout><ExpensiveComponent /></Layout>`，ExpensiveComponent不会因Layout的state变化渲染。
