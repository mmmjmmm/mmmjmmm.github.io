---
title: 八股-性能优化
publishedAt: 2026-08-07
type: note
tags:
  - 面试
  - 八股
draft: false
---

# 1. 前端性能优化

## 1.1 网络请求优化

| 优化方向                | 具体措施                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| 减少 HTTP 请求          | 1. 合并 JS/CSS 文件<br>2. 使用 CSS Sprites（雪碧图）<br>3. 内联小图片（Base64）                         |
| 消除 DNS 查询带来的延迟 | 1. 减少域名数量（平衡并行加载和 DNS 查询）<br>2. 使用 DNS 预加载（`<link rel="dns-prefetch">`）         |
| 减少请求体积            | 1. 开启 Gzip 压缩<br>2. 压缩图片（TinyPNG、WebP 格式）<br>3. 删除无用代码（如注释、console.log）        |
| 缓存优化                | 1. 配置 CDN<br>2. 设置 HTTP 缓存头（Cache-Control、Expires、ETag）<br>3. 文件名哈希（如 `app.a3b4.js`） |
| 现代协议                | 1. 使用 HTTP/2（多路复用、头部压缩）<br>2. 使用 QUIC（HTTP/3）                                          |

- Preload/Prefetch：

  - `<link rel="preload">`：高优先级，强制浏览器立即获取当前页面关键资源（如关键CSS/字体）。

  - `<link rel="prefetch">`：低优先级，提示浏览器在空闲时获取下一个页面可能用到的资源。

- DNS 预解析：`<link rel="dns-prefetch" href="//``cdn.example.com``">`，提前解析第三方资源的域名。

- 懒加载 preload prefetch：[HTML](https://ucnjui1gbcuc.feishu.cn/wiki/CQaxwLySiiyrLWknMVBcGivvnmm#share-GKB6dWvmQoKkfaxIx2vciiNonGH)

---

## 1.2 渲染性能优化

| 优化方向         | 具体措施                                                                                                                               |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 关键渲染路径优化 | 1. 将 CSS 放在 `<head>` 中（避免 FOUC）<br>2. 将 JS 放在底部或使用 `async` / `defer`<br>3. 避免 CSS 表达式（如 `calc()` 频繁触发重绘） |
| 减少 DOM 操作    | 1. 缓存 DOM 查询结果<br>2. 使用 `DocumentFragment` 或 `innerHTML` 批量操作<br>3. 避免频繁操作样式（合并 class 修改）                   |
| 布局与重绘优化   | 1. 使用 CSS3 动画（触发 GPU 加速）<br>2. 避免 table 布局（渲染慢）<br>3. 使用 `will-change` 提示浏览器优化                             |

---

## 1.3 静态资源优化

| 资源类型 | 优化措施                                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| CSS      | 1. 避免 `@import`（阻塞加载）<br>2. 使用媒体查询按需加载（`<link media="print">`）<br>3. 精简选择器（避免深层嵌套） |
| JS       | 1. 代码拆分（Code Splitting）<br>2. 按需加载（动态 `import()`）<br>3. 使用 Tree Shaking 删除无用代码                |
| 图片     | 1. 响应式图片（`srcset` + `sizes`）<br>2. 懒加载（`loading="lazy"`）<br>3. 使用 SVG 替代部分位图                    |

---

## 1.4 数据与存储优化

# 2. webpack性能优化

1. 使用生产模式（production mode）：在Webpack配置中设置`mode`为`production`，这将启用许多内置的优化功能，例如代码压缩、作用域提升等。

2. 代码分割（Code Splitting）：使用Webpack的代码分割功能，将代码拆分为多个小块，按需加载，避免打包一个巨大的文件。

3. 懒加载（Lazy Loading）：使用动态导入（Dynamic Import）或`import()`函数，按需加载模块，在需要时才加载相关代码。

4. Tree Shaking：通过配置Webpack的`optimization`选项，启用`sideEffects`和`usedExports`，以消除未使用的代码（dead code）。

5. 缓存：使用Webpack的`chunkhash`或`contenthash`生成文件名，实现缓存机制，利用浏览器缓存已经加载的文件。

6. 并行处理（Parallel Processing）：使用`thread-loader`或`HappyPack`插件，将Webpack的构建过程多线程化，加速构建速度。

7. 使用缩小作用域（Narrowing the Scope）：通过配置Webpack的`resolve`选项，缩小模块解析的范围，减少不必要的查找。

8. 使用外部依赖（External Dependencies）：将一些稳定的、不经常修改的库或框架通过`externals`配置排除，使用CDN引入，减少打包体积。

9. 使用插件和加载器（Plugins and Loaders）：选择高效的插件和加载器，合理配置它们的选项，以优化构建过程和资源处理。

10. 使用Webpack Bundle Analyzer：使用Webpack Bundle Analyzer工具分析打包后的文件，查找体积较大、冗余或不必要的模块，进行进一步优化。

# 3. Vue的性能优化策略：

1. 使用Vue的生产模式：在构建Vue应用时，确保使用生产模式，这将禁用一些开发模式下的警告和调试工具，并启用性能优化的功能。

2. 合理使用`v-if`和`v-show`指令：`v-if`指令用于条件渲染，只在条件为真时渲染元素，而`v-show`指令仅控制元素的显示和隐藏。根据具体情况选择合适的指令，避免频繁的DOM操作。

3. 列表性能优化：在渲染大量列表数据时，使用key属性来提高性能。`key`属性可以帮助Vue跟踪每个节点的标识，减少不必要的`DOM`操作。

4. 懒加载路由：对于大型单页应用，可以考虑使用路由懒加载技术，按需加载路由组件，减少初始加载时间。

5. 异步组件：将应用中的一些复杂组件拆分为异步组件，按需加载，提高初始渲染性能。

6. 避免不必要的重新渲染：使用Vue的计算属性和侦听器来优化视图的更新。确保只有在依赖的数据发生变化时才会重新计算和渲染。

7. 合理使用`v-for`和`v-if`：在使用`v-for`和v`-if`指令时，避免将它们同时用在同一个元素上，这可能导致不必要的计算和渲染。

8. 使用`keep-alive`组件：对于需要缓存的组件，可以使用Vue的`keep-alive`组件来缓存组件的状态，避免重复的创建和销毁。

9. 懒加载图片：对于页面中的图片，可以使用懒加载技术，延迟加载图片，提高页面的初始加载速度。

10. 优化网络请求：合理使用Vue的异步组件和懒加载技术，减少页面初始加载时的网络请求量。

# 4. React的性能优化策略：

1. 使用`React.memo()`或`PureComponent`：对于函数组件，可以使用`React.memo()`函数或继承`PureComponent`类来进行浅比较，避免不必要的重新渲染

2. 使用`key`属性进行列表优化：在渲染列表时，为每个列表项提供唯一的`key`属性，以帮助`React`更有效地更新和重用组件

3. 使用`shouldComponentUpdate`或`React.memo()`进行组件渲染控制：在类组件中，可以通过实现`shouldComponentUpdate`生命周期方法来控制组件的重新渲染。对于函数组件，可以使用`React.memo()`包裹组件并传递自定义的比较函数

4. 懒加载组件：对于较大的组件或页面，可以使用`React.lazy()`和`Suspense`组件进行按需加载，减少初始加载时间

5. 使用虚拟化列表：对于长列表或大型数据集，可以使用虚拟化列表库（如`react-virtualized`或`react-window`）来仅渲染可见部分，减少DOM操作和内存占用

6. 使用`Memoization`进行计算的缓存：通过使用`Memoization`技术，可以将计算结果缓存起来，避免重复计算，提高性能。可以使用`Memoization`库（如`reselect`）来实现

7. 使用`React Profiler`进行性能分析：`React Profiler`是React提供的性能分析工具，可以帮助定位应用中的性能瓶颈，并进行优化

8. 使用`ESLint`和代码分析工具：通过使用`ESLint`等代码规范工具和静态代码分析工具，可以发现潜在的性能问题和优化机会，并进行相应的调整

# 5. 其他

## 5.1 DNS 预解析

1. **提前解析**：当浏览器加载页面时，会识别页面中可能用到的其他域名，并在后台提前进行DNS解析

2. **缓存结果**：将解析结果\(域名→IP地址\)保存在本地DNS缓存中

3. **即时连接**：当用户真正访问这些链接时，浏览器可以直接使用缓存的DNS结果，跳过DNS查询步骤

```JavaScript
<link rel="dns-prefetch" href="//blog.poetries.top">
```

## 5.2 预加载

许开发者 **提前加载关键资源**（如脚本、样式、字体、图片等），而无需等待浏览器按常规方式发现它们，从而优化页面加载性能。

```JavaScript
<link rel="preload" href="http://example.com">
<link rel="preload" href="资源URL" as="资源类型" crossorigin="是否跨域">
```

## 5.3 预渲染

提前在后台完整渲染整个页面，当用户真正访问时能立即展示，实现"瞬间加载"的效果。

```XML
<!-- 提示浏览器此页面可能被预渲染 -->
<link rel="prerender" href="https://example.com/next-page.html">
```

## 5.4 懒执行与懒加载

**懒执行**

- 懒执行就是**将某些逻辑延迟到使用时再计算**。该技术可以用于**首屏优化**，对于某些耗时逻辑并不需要在首屏就使用的，就可以使用懒执行。懒执行需要唤醒，一般可以通过定时器或者事件的调用来唤醒

**懒加载**

- 懒加载就是**将不关键的资源延后加载**

> 懒加载的原理就是**只加载自定义区域（通常是可视区域，但也可以是即将进入可视区域）内需要加载的东西**。对于图片来说，先设置图片标签的 `src` 属性为一张占位图，将真实的图片资源放入一个自定义属性中，当进入自定义区域时，就将自定义属性替换为 `src` 属性，这样图片就会去下载资源，实现了图片懒加载

- 懒加载不仅可以用于图片，也可以使用在别的资源上。比如进入可视区域才开始播放视频等

## 5.5 缓存

**浏览器缓存策略**

- 强缓存：Expires 和 Cache\-Control。标识在缓存期间不需要请求，code = 200

```JavaScript
Expires: Wed, 22 Oct 2018 08:41:00 GMT
```

Expires是HTTP/1\.0的产物，表示资源会在这个时间后过期，需要再次请求

```JavaScript
Cache-control: max-age=30
```

Cache\-Control 出现于 HTTP/1\.1，优先级高于Expires，标识资源会在多少秒后过期，需要再次请求

- 协商缓存

需要请求，如果缓存有效返回304，需要客户端和服务端共同实现，两种实现方式

1. Last\-Modified 和 If\-Modified\-Since（HTTP/1\.0）

- 服务器首次响应时，在响应头中添加 `Last-Modified` 字段，值为资源最后修改时间

- 客户端再次请求时，在请求头中添加 `If-Modified-Since` 字段，值为之前收到的 `Last-Modified` 值

- 服务器比较当前资源修改时间和 `If-Modified-Since` 的值：

  - 如果资源未修改，返回304状态码，客户端使用缓存

  - 如果资源已修改，返回200状态码和新资源

- 但是如果在本地打开缓存文件，就会造成 `Last-Modified` 被修改，所以在 `HTTP / 1.1` 出现了 `ETag`

2. ETag 和 If\-None\-Match（HTTP/1\.1）

- 服务器首次响应时，在响应头中添加 `ETag` 字段，值为资源的唯一标识\(通常是内容的哈希值\)

- 客户端再次请求时，在请求头中添加 `If-None-Match` 字段，值为之前收到的 `ETag` 值

- 服务器比较当前资源ETag和 `If-None-Match` 的值：

  - 如果匹配，返回304状态码

  - 如果不匹配，返回200状态码和新资源

## 5.6 **HTTP/2\.0**

- 因为浏览器会有并发请求限制（浏览器对同一域名有6\-8个TCP连接的限制），在 `HTTP / 1.1` 时代，每个请求都需要建立和断开，消耗了好几个 `RTT` 时间，并且由于 `TCP` 慢启动的原因，加载体积大的文件会需要更多的时间

- 在 `HTTP / 2.0` 中引入了**多路复用**，能够让多个请求使用同一个 `TCP` 链接，极大的加快了网页的加载速度。并且还支持 **`Header`**** 压缩**，进一步的减少了请求的数据大小

- **多路复用**：

  - 单一TCP连接：所有请求共享一个持久连接

  - 并行交错传输：多个请求/响应帧可以交错发送，不受顺序限制

  - 流\(Stream\)概念：每个请求/响应被分配一个唯一的流ID

- **头部压缩\(HPACK\)**

  - 使用专门的HPACK算法压缩头部

  - 维护动态和静态的头部字段表

  - 相同连接中后续请求只需发送变化的头部字段

## 5.7 文件优化

**图片优化**

> 对于如何优化图片，有 2 个思路

- 减少像素点

- 减少每个像素点能够显示的颜色

**图片加载优化**

- 不用图片。很多时候会使用到很多修饰类图片，其实这类修饰图片完全可以用 `CSS` 去代替。

- 小图使用 `base64`格式

- 将多个图标文件整合到一张图片中（雪碧图）

- 选择正确的图片格式：

  - 对于能够显示 `WebP` 格式的浏览器尽量使用 `WebP` 格式。因为 `WebP` 格式具有更好的图像数据压缩算法，能带来更小的图片体积，而且拥有肉眼识别无差异的图像质量，缺点就是兼容性并不好

  - 小图使用 `PNG`，其实对于大部分图标这类图片，完全可以使用 `SVG` 代替

  - 照片使用 `JPEG`

**其他文件优化**

- `CSS`文件放在 `head` 中

- 服务端开启文件压缩功能

- 将 `script` 标签放在 `body` 底部，因为 `JS` 文件执行会阻塞渲染。当然也可以把 `script` 标签放在任意位置然后加上 `defer` ，表示该文件会并行下载，但是会放到 `HTML` 解析完成后顺序执行。对于没有任何依赖的 `JS`文件可以加上 `async` ，表示加载和渲染后续文档元素的过程将和 `JS` 文件的加载与执行并行无序进行。 执行 `JS`代码过长会卡住渲染

- 可以考虑使用 `Webworker`。`Webworker`可以让我们另开一个线程执行脚本而不影响渲染。

**CDN**

> 静态资源尽量使用 `CDN` 加载，由于浏览器对于单个域名有并发请求上限，可以考虑使用多个 `CDN` 域名。对于 `CDN` 加载静态资源需要注意 `CDN` 域名要与主站不同，否则每次请求都会带上主站的 `Cookie`

# 6. 在CSS/JS代码上线之后，开发人员经常会优化性能。从用户刷新网页开始，一次JS请求一般情况下有哪些地方会有缓存处理？

1. **DNS缓存**：浏览器会缓存已解析的域名和对应的IP地址，这样在下次请求同一域名时可以直接使用缓存的IP地址，避免重新进行DNS解析。

2. **CDN缓存**：如果使用了内容分发网络（CDN），**CDN会缓存静态资源文件**，如CSS和JS文件，以便快速地分发给用户。当用户再次请求同一资源时，可以从CDN缓存中获取，减少向源服务器的请求次数。

> 定义：
> CDN 是一个由多个地理分布的服务器组成的网络，用于快速分发静态资源（如 CSS、JS、图片、视频等）给全球用户。
> 核心原理：
>
> - 将资源缓存到离用户最近的边缘服务器（Edge Server），减少数据传输距离。
> - 用户访问资源时，自动选择最优的 CDN 节点，而非直接访问源服务器。
>   类比：
>   CDN 就像遍布各地的“快递分仓”，用户下单后从最近的仓库发货，无需每次都从总部调货。

3. **浏览器缓存**：浏览器会缓存已请求的静态资源文件，如CSS和JS文件。可以通过设置HTTP响应头中的`Cache-Control`和`Expires`字段来控制浏览器缓存的行为。如果设置了适当的缓存策略，浏览器在下次请求同一资源时可以直接从本地缓存中获取，而不需要再次向服务器请求。

4. **服务器缓存**：服务器可以对动态生成的JS文件进行缓存，以避免重复生成相同的响应。服务器可以通过设置响应头中的`Cache-Control`和`Expires`字段，或者使用缓存代理服务器来进行缓存处理。

# 7. 一个页面上有大量的图片（大型电商网站），加载很慢，你有哪些方法优化这些图片的加载，给用户更好的体验。

- 使用图像压缩技术：通过使用图像压缩工具，如PhotoShop、TinyPNG等，将图片文件的大小减小，以减少加载时间。

- 使用适当的图像格式：根据图像的特性选择合适的图像格式，如JPEG、PNG、WebP等。JPEG适用于照片和复杂图像，而PNG适用于简单的图标和透明图像。WebP是一种现代的图像格式，可以在保持良好质量的同时减小文件大小。

- 图片CDN加速：使用内容分发网络（CDN）来加速图片的传输，将图片文件缓存到离用户更近的服务器，减少传输时间。

- 图片延迟加载：采用图片懒加载技术，将页面上不可见区域的图片暂时不加载，当用户滚动页面至可见区域时再进行加载，以减少初始加载时间。

- 使用CSS精灵图：将多个小图标或背景图片合并为一张大图，并利用CSS的`background-position`来定位显示需要的部分，减少HTTP请求的数量。

- 使用矢量图形：使用矢量图形（如SVG）代替位图，以减小文件大小并保持清晰度，适用于简单的图形和图标。

- 响应式图片：针对不同的设备和屏幕尺寸提供适当大小的图片，以避免在小屏幕设备上加载过大的图片。

- 图片懒加载、预加载：根据用户的浏览行为，提前加载下一页或下一组图片，以提高用户体验和流畅度。

- 图片缓存：设置适当的缓存策略，让浏览器在首次加载后对图片进行缓存，减少重复加载的次数。

# 8. HTTP 前端性能优化手段

1. **减少请求数**

   - **资源合并**：将多个 CSS/JS 文件合并成一个，减少 HTTP 请求数量，降低 TCP/TLS 握手开销和 RTT 延迟。

   - **雪碧图（Sprite）**：把多个小图片合成一张大图，通过 `background-position` 显示，减少图片请求数。

   - **HTTP/2 多路复用**：一个 TCP 连接上可以同时并行发送多个请求/响应，无需合并资源也能减少延迟请求开销。

2. **减少请求体积**

   - **文本压缩**：Gzip 或 Brotli 压缩 HTML、CSS、JS，减少传输数据量。Brotli 压缩比更高，尤其适合静态资源。

   - **图片优化**：WebP/AVIF 格式、按需分辨率、延迟加载等，减少网络传输量。

   - **CSS/JS 压缩/混淆**：移除空格、注释和多余字符，降低文件体积。

3. **缓存策略优化**

   - **强缓存（Cache\-Control: max\-age）**：浏览器直接使用本地缓存资源，减少重复请求。

   - **协商缓存（ETag / Last\-Modified）**：当资源可能变化时验证资源是否更新，未更新返回 304，节省带宽。

   - **CDN 缓存**：将静态资源缓存到离用户最近的节点，提高加载速度，减少源站压力。

4. **连接优化**

   - **持久连接（Keep\-Alive）**：HTTP/1\.1 默认复用 TCP 连接，减少握手开销。

   - **TCP 拆包/粘包**：主要影响流式数据传输和长连接，前端请求通常受 TCP 分段影响小，但要注意大文件传输。

   - **TLS 会话复用 / Session Ticket**：减少重复握手，降低 HTTPS 初次连接延迟。

5. **前端资源加载策略**

   - **懒加载**：图片、视频或组件按需加载，减少首屏渲染请求，提升首屏速度。

   - **异步加载**：JS 脚本可使用 `async` / `defer` 或动态导入，避免阻塞页面渲染。

   - **优先级控制**：关键 CSS/JS 优先加载，非关键资源延后加载，提升用户感知性能。

# 9. 总结版第n个版本

## 9.1 开发过程优化（编码阶段）

这个阶段的优化核心在于编写高效、简洁、可维护的代码，从源头上避免性能问题。

### 9.1.1 HTML 优化

- 语义化标签：使用正确的 HTML5 标签（如 `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`），不仅利于SEO，浏览器也能更好地解析内容结构。

- 减少 DOM 数量：过于庞大的 DOM 树会占用大量内存，影响样式计算、布局渲染和 JavaScript 操作 DOM 的效率。尽量保持 DOM 结构的简洁。

- CSS 和 JavaScript 的加载位置：

  - CSS 放在 `<head>` 中：尽早加载 CSS，避免页面渲染时出现“闪屏”（无样式内容闪烁，FOUC）。

  - JavaScript 放在 `<body>` 底部或使用 `async/defer`：防止 JS 的加载和执行阻塞 HTML 的解析。

### 9.1.2 CSS 优化

- 避免深层级的选择器：如 `.header .nav .list .item .link {}`。选择器从右向左匹配，层级越深，匹配耗时越长。建议使用类选择器，保持扁平化。

- 避免使用 `@import`：`@import` 会串行加载 CSS 文件，而 `<link>` 标签可以并行加载。

- 使用 Flexbox 和 Grid 布局：现代布局方案性能通常优于传统的 `float` 和 `position` 布局。

- 减少重排和重绘：

  - 重排 \(Reflow\)：改变元素的几何属性（如宽、高、位置），会引发浏览器重新计算布局和绘制。

  - 重绘 \(Repaint\)：改变元素的样式但不影响布局（如颜色、背景色）。

  - 技巧：使用 `class` 集中改变样式；对复杂动画使用 `position: absolute/fixed` 使其脱离文档流；使用 `window.requestAnimationFrame()` 进行动画。

### 9.1.3 框架相关优化 (以 React/Vue 为例)

- React:

  - 使用 `React.memo`, `useMemo`, `useCallback`：减少不必要的组件重渲染和函数重新创建。

  - 组件懒加载：使用 `React.lazy` 和 `Suspense` 实现组件级代码分割。

  - 虚拟长列表：使用 `react-window` 或 `react-virtualized` 只渲染可视区域内的列表项。

- Vue:

  - 合理使用 `v-if` 和 `v-show`：`v-if` 是真正的条件渲染，切换时元素会销毁/重建；`v-show` 只是切换 CSS 的 `display` 属性。频繁切换用 `v-show`，运行时条件很少改变用 `v-if`。

  - 使用 `computed` 和 `watch`：避免在模板中做复杂的计算。

  - 组件懒加载：使用 `defineAsyncComponent` 实现异步组件。

  - 使用 `KeepAlive`：缓存不活动的组件实例，避免重复渲染。

---

## 9.2 打包编译优化 (构建阶段)

这个阶段的优化核心在于对源代码进行压缩、拆分、转换，生成最优的部署包。

### 9.2.1 使用构建工具

使用 Webpack, Vite, Rollup, esbuild 等现代构建工具。

### 9.2.2 核心优化手段

- **代码分割 (Code Splitting)**：

  - 入口分割：配置多入口。

  - 动态导入 \(Dynamic Import\)：利用 `import()` 语法，将代码按路由或组件拆分成不同的 chunk，实现按需加载。这是最常用的方式。

  - 提取公共代码 \(SplitChunksPlugin\)：将 `node_modules` 中的第三方库和公共模块提取到单独的 chunk，利用浏览器缓存。

- **Tree Shaking**：移除 JavaScript 上下文中未引用的代码（dead code）。依赖于 ES6 模块的静态结构（`import/export`）。确保你的项目使用 ES Module 规范，并在打包时启用该功能。

- **压缩 \(Minification\)**：

  - JavaScript：使用 `TerserWebpackPlugin` 压缩和混淆 JS。

  - CSS：使用 `CssMinimizerWebpackPlugin` 压缩 CSS。

  - HTML：使用 `HtmlWebpackPlugin` 压缩 HTML。

- **资源优化**：

  - 图片压缩：使用工具或 loader（如 `image-webpack-loader`）对图片进行压缩。推荐使用现代格式如 WebP，它比 JPEG 和 PNG 体积更小。

  - 图标优化：使用字体图标（如 FontAwesome）或 SVG 雪碧图，代替传统的图片精灵图。

  - 小资源转 Base64：使用 `url-loader` 将小图片/字体转换为 Base64 编码内嵌到代码中，减少 HTTP 请求。

- Bundle 分析：使用 `webpack-bundle-analyzer` 等工具可视化分析打包产物，找出体积过大的模块并进行优化。

- **缓存优化**：

  - 输出文件名添加 Hash：`[name].[contenthash].js`。只有当文件内容改变时，hash 才会变化，从而迫使浏览器下载新文件，未改变的文件则从缓存中读取。

---

## 9.3 网络传输优化

这个阶段的优化核心在于减少请求数量、减小资源体积、加快请求速度。

### 9.3.1 减少 HTTP 请求

- 合并文件：在 HTTP/1\.1 时代，合并小 CSS/JS 文件是常用手段。但在支持多路复用的 HTTP/2 下，此举价值变小，甚至可能影响缓存效率。应根据实际情况权衡。

- 使用雪碧图 \(CSS Sprites\)：将多个小图标合并到一张大图中，通过 CSS `background-position` 来定位。

- 使用字体图标 \(Icon Font\) 或 SVG。

### 9.3.2 减小资源体积

- 开启 Gzip/Brotli 压缩：在服务器上配置，对文本类资源（JS, CSS, HTML）进行高效压缩，通常能减少 60% 以上的体积。Brotli 算法比 Gzip 效率更高。

### 9.3.3 利用浏览器缓存

- 强缓存：通过设置 `Cache-Control` 和 `Expires`，让浏览器直接从本地磁盘读取资源，不发起请求。适用于长期不变的静态资源。

- 协商缓存：通过 `Last-Modified` 和 `ETag`，浏览器会发起请求询问服务器资源是否过期，如果没过期（304），则使用本地缓存。适用于经常变动的资源。

- 使用 CDN \(内容分发网络\)：将静态资源部署到全球各地的 CDN 节点，用户可以从离他最近的节点获取资源，大幅降低网络延迟。

- Service Worker：可以更精细地控制缓存策略，实现离线应用。

### 9.3.4 其他网络优化

- HTTP/2：务必使用 HTTP/2，它支持多路复用、头部压缩、服务器推送等特性，能显著提升页面加载速度。

- Preload/Prefetch：

  - `<link rel="preload">`：高优先级，强制浏览器立即获取当前页面关键资源（如关键CSS/字体）。

  - `<link rel="prefetch">`：低优先级，提示浏览器在空闲时获取下一个页面可能用到的资源。

- DNS 预解析：`<link rel="dns-prefetch" href="//cdn.example.com">`，提前解析第三方资源的域名。

---

## 9.4 首屏展示优化

这个阶段的优化核心在于让用户尽可能早地看到和交互页面内容，提升用户体验。

### 9.4.1 关键渲染路径 (CRP) 优化

目标是缩短 白屏时间 和 首屏时间。

1. **优化 CSS**：

   - 内联关键 CSS \(Critical CSS\)：将首屏渲染所需的关键样式直接内嵌到 `<head>` 中，避免为获取CSS文件发起阻塞渲染的请求。

   - 异步加载非关键 CSS：对于首屏不需要的CSS，可以使用 `preload` 并将其设置为 `print`，然后在加载完成后切换回 `all`。

2. 优化 JavaScript：所有非关键的 JS 都应该使用 `async` 或 `defer` 属性，避免阻塞 DOM 构建。

   - `async`：异步下载，下载完立即执行，执行顺序不确定。

   - `defer`：异步下载，但在 DOM 解析完成后、`DOMContentLoaded` 事件触发前按顺序执行。

3. 优化字体：

   - 使用 `font-display: swap`：告诉浏览器使用后备字体先显示文字，待自定义字体加载完成后再切换，避免文字不可见（FOIT）。

   - 预加载重要字体：`<link rel="preload" as="font">`。

### 9.4.2 用户体验优化

- 骨架屏 \(Skeleton Screen\)：在数据加载完成前，先展示页面的布局结构，给用户即时反馈，降低等待的焦虑感。

- **懒加载 \(Lazy Loading\)**：

  - 图片懒加载：使用 `loading="lazy"` 原生属性（现代浏览器支持）或 Intersection Observer API 实现，当图片进入可视区域后再加载。

  - iframe 懒加载：同样使用 `loading="lazy"`。

### 9.4.3 服务端渲染 \(SSR\)

- 原理：在服务器端生成完整的 HTML 页面，直接返回给浏览器。浏览器能立即解析渲染，极大提升首屏加载速度和 SEO 效果。

- 框架：Next\.js \(React\), Nuxt\.js \(Vue\) 等。

# 10. 首屏加载速度FCP优化

## 10.1 资源加载优化（减少体积与数量）

1. 代码压缩与混淆：

   - JavaScript/CSS：使用 Terser、CSSNano 等工具进行压缩、混淆和删除死代码。

   - HTML：使用 HTMLMinifier 压缩 HTML。

2. 图像与媒体优化：

   - 格式选择：使用现代格式（WebP/AVIF）替代传统格式（JPEG/PNG），在兼容性要求下使用 `<picture>` 标签降级。

   - 压缩工具：使用 Imagemin、Squoosh 等工具进行有损或无损压缩。

   - 响应式图片：使用 `srcset` 和 `sizes` 属性为不同设备提供不同尺寸的图片。

   - 懒加载：对非首屏图片使用原生 `loading="lazy"` 属性。

3. 字体优化：

   - 字体子集化：使用 `glyphhanger` 等工具仅提取页面使用的字符，生成体积更小的字体子集。

   - 显示策略：使用 `font-display: swap` 避免字体加载完成前的文本不可见期（FOIT），防止布局偏移。

4. Tree Shaking：

   - 在 Webpack/Rollup 等构建工具中开启 Tree Shaking，利用 ES Module 的静态分析特性，剔除未被使用的代码。

5. 拆分代码（Code Splitting）：

   - 利用 Webpack/Vite 的动态 `import()`，让非首屏代码延迟加载。

## 10.2 加载策略优化（加快加载与解析速度）

1. 资源优先级与预加载：

   - Preload：使用 `<link rel="preload">` 对关键资源（关键CSS、Web字体、首屏图片）进行高优先级预加载。

   - Prefetch：使用 `<link rel="prefetch">` 对下一个页面可能需要的资源进行低优先级预取。

   - Preconnect/DNS\-prefetch：对关键跨域域名提前建立连接，减少 DNS 查询和 TCP 握手时间。

2. HTTP/2 或 HTTP/3：

   - 开启 HTTP/2 的多路复用、头部压缩等特性，大幅提升资源加载效率。有条件可升级至 HTTP/3。

3. CDN 加速：

   - 将静态资源部署到 CDN，利用其边缘节点缓存和高速网络使用户就近获取资源。

## 10.3 执行效率优化（减少阻塞与加快渲染）

1. CSS 优化：

   - 将CSS放在 `<head>` 中：尽早加载，防止 FOUC（内容无样式闪烁）。

   - 避免使用 `@import`：`@import` 是串行加载，会拖慢整体CSS加载速度。

   - 内联关键CSS：使用工具（如Critical）提取首屏渲染所需的关键CSS内联到HTML中，其余CSS异步加载。

2. JavaScript 优化：

   - 将JS放在底部或使用 `defer/async`：防止JS解析和执行阻塞HTML解析和渲染。

     - `async`：脚本异步加载，完成后立即执行，不保证顺序。

     - `defer`：脚本异步加载，在DOM解析完成后、`DOMContentLoaded`事件前按顺序执行。

   - 代码分割与按需加载：

     - 构建时分割：使用 Webpack 的 `SplitChunksPlugin` 将第三方库（node\_modules）和公共代码抽离成单独 chunk。

     - 运行时按需加载：使用 ES Module 的 `import()` 语法实现动态导入（路由级或组件级懒加载）。

## 10.4 缓存策略优化（减少重复请求）

1. 强缓存：通过设置 `Cache-Control`（如 `max-age=31536000`）和 `Expires` 让浏览器直接从本地磁盘读取资源，不发请求。通常用于哈希命名的静态资源。

2. 协商缓存：通过 `Etag`/`If-None-Match` 或 `Last-Modified`/`If-Modified-Since` 与服务端验证资源是否过期，返回 `304 Not Modified`。用于HTML等非哈希资源。

3. Service Worker：使用 Service Worker 缓存 API 响应或静态资源，实现更精细、离线的缓存控制。

##10.5 渲染策略优化

- **SSR（服务器端渲染）/ SSG（静态生成）**：

  - 提前生成 HTML，首屏直接返回完整内容，减少白屏时间。

- **骨架屏 / 占位符**：

  - 在 JS 未加载完前显示占位结构，让用户感觉页面更快。

- **懒渲染**：

  - 首屏只渲染可见区域，其余内容滚动到时再渲染。

# 11. 如何优化 CSS 渲染性能

1️⃣ **先理解浏览器渲染流程**

1. **计算样式（Style）**

2. **布局 / 回流（Layout / Reflow）** → 计算元素位置和尺寸

3. **绘制（Paint）** → 绘制像素信息

4. **合成（Composite）** → GPU 合成图层

> 频繁触发 **回流 / 重绘** 会让页面掉帧，影响性能。

---

2️⃣**优化思路**

1. **减少回流与重绘**

- **避免逐条修改样式**

  - 不要一条条改 `style`，应合并到一个 class 上。

- **批量操作 DOM**

  - 使用 `DocumentFragment`、`cloneNode` 批量更新。

- **避免使用会强制同步布局的属性**

  - 如 `offsetHeight`、`clientWidth` 等，必要时缓存值。

- **复杂动画避免用 ****`top/left`**，改用 `transform`。

---

2. **充分利用图层与 GPU 加速**

- 对需要频繁变化的元素加 `will-change` 或 `transform: translateZ(0)`，让浏览器提前创建合成层，避免主线程反复回流。

- 但 `will-change` 不要滥用，过多图层也会占用内存。

---

3. **合理使用 CSS 选择器**

- 避免过深、复杂的选择器（如 `div ul li span a`），浏览器匹配会慢。

- 优先使用类选择器、ID 选择器，不要用低效的通配符 `*`。

---

4. **避免阻塞渲染**

- 将**关键 CSS** 内联（Critical CSS），非关键样式延迟加载。

- 避免使用 `@import`（会阻塞渲染）。

---

5. **动画优化**

- 尽量使用 `transform` 和 `opacity`，它们只会触发 **合成**，不会回流。

- 使用 `requestAnimationFrame` 驱动 JS 动画，保持和渲染节奏一致。

- 对不需要交互的复杂动画，可用 **CSS 动画**（浏览器可优化）。

# 12. 前端性能优化指标

1. **LCP \- 最大内容绘制**

- 定义：衡量加载性能。它表示从用户**请求 URL 到在视口中渲染最大可见图像或文本块**所需的时间。

- 目标：为了提供良好的用户体验，LCP 应在页面开始加载后的 2\.5 秒内发生。

- 优化建议：

  - 优化服务器响应时间、启用缓存（CDN、浏览器缓存）。

  - 优化和压缩图片（使用 WebP 格式、响应式图片）。

  - 移除渲染阻塞资源（CSS、JavaScript）。

  - 预加载关键资源。

1. **FID \- 首次输入延迟**

- 定义：衡量交互性。它表示从用户**第一次与页面交互（例如点击链接、点击按钮）到浏览器实际能够开始处理事件处理程序**所经过的时间。

- 注意：FID 已逐渐被 INP（Interaction to Next Paint） 所取代，作为新的核心指标。INP 衡量的是页面上所有交互的延迟，而不仅仅是第一次。

- 目标：FID 应小于 100 毫秒。

- 优化建议：

  - 分解长任务（Long Tasks），将复杂的计算拆分成小块。

  - 优化 JavaScript（代码拆分、摇树优化、减少第三方脚本）。

  - 使用 Web Worker 将任务移出主线程。

3. **CLS \- 累积布局偏移**

- 定义：衡量视觉稳定性。它量化了在页面整个生命周期内发生的意外布局偏移的分数。例如，突然插入的广告、动态加载的内容或未指定尺寸的图片/视频导致的页面跳动。

- 目标：CLS 分数应小于 0\.1。

- 优化建议：

  - 始终为图片和视频元素设置 `width` 和 `height` 属性（或使用 CSS 宽高比框）。

  - 不要在现有内容之上插入新内容，除非是响应用户交互。

  - 预留广告位或动态内容所需的空间。

  - 使用 `transform` 动画替代会影响布局的属性（如 `top`, `left`, `margin`, `padding`）。

4. **FCP \- 首次内容绘制**

- 定义：衡量浏览器首次渲染任何文本、图片（包括背景图）、非白色 canvas 或 SVG 的时间。它让用户感知到页面已经开始加载。

- 目标：小于 1\.8 秒。

5. **TTI \- 可交互时间**

- 定义：表示页面已经完全渲染，并且可以可靠地响应用户输入的时间点。它的计算方式是：在 FCP 之后，页面有 5 秒的时间没有长任务（超过 50ms 的任务）和进行中的网络请求。

6. **TBT \- 总阻塞时间**

- 定义：衡量 FCP 和 TTI 之间的总时间，在这段时间内，主线程被阻塞的时间足够长，以至于无法响应用户输入。任何超过 50 毫秒的任务部分都被视为“阻塞”。

- 目标：小于 200 毫秒。这是优化 FID/INP 的关键指标。

7. **Speed Index \- 速度指数**

- 定义：衡量页面内容在视觉上填充的快慢。速度指数越低，表示页面加载越快。它通过分析浏览器加载视频的每一帧来计算。

8. **TTFB \- 首字节时间**

- 定义：从浏览器请求页面到接收到服务器返回的第一个字节的数据所花费的时间。它反映了服务器的响应速度和网络延迟。

- 目标：小于 200 毫秒。

# 13. 懒加载

## 13.1 🚀 懒加载的优化

懒加载**本身就是一种优化**。它的核心原理是“延迟加载”，主要带来以下好处：

1. **提升首屏加载速度：** 这是最核心的优化点。页面首次加载时，浏览器只需下载“首屏”内容（Above the Fold）。

   - 这会**极大缩短** FCP \(First Contentful Paint\) 和 LCP \(Largest Contentful Paint\) 等关键性能指标（Core Web Vitals），让用户感觉页面“秒开”。

2. **节省带宽和服务器资源：**

   - 对于那些只看了页面顶部就离开的用户，浏览器永远不会去加载页面底部的图片或组件。

   - 这为用户（特别是移动端用户）节省了数据流量，也降低了服务器的带宽压力。

3. **提升用户体验：**

   - 用户不必在“白屏”前等待所有资源加载完毕。他们可以立即开始与“首屏”内容进行交互。

---

## 13.2 ⚙️ 懒加载的实现原理

懒加载的原理是“监听”一个“占位”元素，当这个元素“即将进入”浏览器的“可视区域（Viewport）”时，才去发起真正的资源（图片、JS、数据）请求。

实现这个“监听”动作，主要有两种技术：

1. **传统（但低效）的方法：****`onscroll`**** 事件**

- **原理：** 监听 `window` 的 `scroll` 事件。在回调函数中，计算“占位”元素距离视窗顶部的距离 \(`element.getBoundingClientRect().top`\)，并判断它是否小于视窗的高度 \(`window.innerHeight`\)。

- **缺点：** `scroll` 事件会**非常频繁**地触发，在滚动过程中进行大量的位置计算会导致页面卡顿（性能开销大）。

2. **现代（且高效）的方法：****`Intersection Observer`**** API \(交叉观察器\)**

- **原理：** 这是 W3C 专门为此类场景设计的 API。

- **工作方式：** 你不再需要自己计算位置。你告诉浏览器：“请帮我‘观察’这个元素（比如一张图片的占位符）”。

- 当这个元素**进入或离开**视窗（或者与视窗有任意比例的“交叉”）时，浏览器会**异步地**通知你（触发你的回调函数）。

- **优点：** 性能极高。它将计算交给浏览器高效处理，完全不阻塞主线程，也不会在滚动时引发卡顿。

---

## 13.3 🏞️ 懒加载的常见应用

懒加载不只是用于图片，它几乎可以用于任何“非首屏”资源：

1. **图片懒加载 \(Image Lazy Loading\)**

   - **场景：** 网页中的 `<img>` 标签，特别是长列表、电商网站、相册。

   - **实现：** 见下面的配置。

2. **组件懒加载 \(Component Lazy Loading\)**

   - **场景：** React、Vue 等框架中。有些组件很庞大（如一个复杂的图表库 `ECharts`）或不一定会被使用（如一个点击才弹出的 `Modal` 弹窗）。

   - **实现：** 在用户触发某个动作（如点击）时，才去加载这个组件的 JS 代码。

3. **路由懒加载 \(Route Lazy Loading\)**

   - **场景：** 单页面应用（SPA）。当用户访问 `/home` 时，没有必要把 `/profile` 和 `/admin` 页面的 JS/CSS 也一起下载下来。

   - **实现：** 只有当用户点击链接准备跳转到 `/profile` 时，才去下载该路由对应的 JS 文件。这又被称为“代码分割 \(Code Splitting\)”。

4. **数据懒加载 \(Data Lazy Loading\)**

   - **场景：** **“无限滚动”**（Infinite Scroll）

   - **实现：** 监听滚动条是否到达底部，如果到达，则发起 API 请求（`loadMore()`），加载下一页的数据。

---

## 13.4 🛠️ 懒加载的配置（实现）

根据不同的应用场景，配置方法也不同：

1. **图片懒加载（3 种方法）**

- **[推荐] 原生 ****`loading="lazy"`**** (最简单)** 现代浏览器已原生支持图片懒加载。

```HTML
<img src="real-image.jpg" loading="lazy" alt="一只猫" width="200" height="200" />
```

- **优点：** 极其简单，无需 JS。

- **缺点：** 兼容性问题（老浏览器不支持，但现在主流浏览器都支持了）。

**`Intersection Observer` (最可控)**

如果你需要兼容老浏览器，或者想在图片加载前显示一个“骨架屏/Loading”，就需要用 JS。

**通常情况下，一个网页确实只需要一个 `IntersectionObserver` 实例。**

如果 A 组图片要在进入视口 **0%** 时加载，而 B 组图片要在进入视口 **50%** 时才触发特效，由于 `threshold`（阈值）是在创建实例时定义的，你就需要两个 Observer。

**实现逻辑：**

1. 将图片的真实地址放在一个伪属性中（如 `data-src`）。

2. 用 `src` 展示一个很小的占位图或空白图。

3. 利用 JS 监听图片，一旦进入视口，将 `data-src` 的值赋给 `src`。

```HTML
<img
  data-src="real-image.jpg"
  src="placeholder.gif"
  class="lazy-image"
  alt="..."/>
```

```JavaScript
// 2. JavaScript
document.addEventListener("DOMContentLoaded", () => {
  const lazyImages = document.querySelectorAll('.lazy-image');

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      // 2.1 判断元素是否进入视窗
      if (entry.isIntersecting) {
        const img = entry.target;
        const realSrc = img.getAttribute('data-src');

        // 2.2 将 data-src 赋值给 src
        img.src = realSrc;

        // 2.3 赋值后，移除 "lazy-image" 类，并停止观察
        img.classList.remove('lazy-image');
        observer.unobserve(img);
      }
    });
  });

  // 2.4 观察所有图片
  lazyImages.forEach(img => {
    observer.observe(img);
  });
});
```

**传统滚动监听方式（老旧但兼容性最强）**

在没有 API 的年代，我们通过监听 `window.onscroll` 事件，结合 `getBoundingClientRect()` 手动计算图片位置。

- **缺点：** 滚动事件触发频率极高，非常消耗性能，必须搭配“节流（Throttle）”函数使用。

- **核心公式：**$元素距离顶部的距离 - 滚动条偏移量 < 浏览器视口高度$

```JavaScript
function lazyLoad() {
  const images = document.querySelectorAll('img[data-src]');
  const viewportHeight = window.innerHeight; // 浏览器可视窗口高度

  images.forEach(img => {
    // getBoundingClientRect().top 获取元素相对于视口顶部的距离
    const rect = img.getBoundingClientRect();

    if (rect.top < viewportHeight) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src'); // 移除属性，防止重复触发
    }
  });
}

// 监听滚动事件
window.addEventListener('scroll', lazyLoad);

// 节流函数：在指定时间内只执行一次
function throttle(fn, delay) {
  let timer = null;
  return function() {
    if (timer) return;
    timer = setTimeout(() => {
      fn.apply(this, arguments);
      timer = null;
    }, delay);
  };
}

const optimizedLazyLoad = throttle(lazyLoad, 200);
window.addEventListener('scroll', optimizedLazyLoad);
```

4. **路由/组件懒加载（代码分割）**

这主要依赖 ES6 的**动态 ****`import()`**** 语法**，它会返回一个 Promise。

- **React (使用 `React.lazy` 和 `Suspense`)**

```JavaScript
import React, { Suspense } from 'react';

// 1. 使用 React.lazy 动态导入组件
const MyBigChart = React.lazy(() => import('./components/MyBigChart'));

function App() {
  return (
    <div>
      {/* 2. 使用 Suspense 包裹，fallback 是加载时的占位符 */}
      <Suspense fallback={<div>加载中...</div>}>
        <MyBigChart />
      </Suspense>
    </div>
  );
}
```

1. **Vue (使用 `defineAsyncComponent` 或路由配置\)**

在 Vue Router 中配置：

```JavaScript
// router/index.js
const routes = [
  {
    path: '/profile',
    name: 'Profile',
    // 当用户访问 /profile 路由时，才会加载 Profile.vue 对应的 JS 文件
    component: () => import('../views/Profile.vue')
  }
]
```

3. 数据懒加载（无限滚动）

---

## 13.5 ✨ 懒加载的“再”优化

配置懒加载时，还需要注意一些细节：

1. **不要懒加载“首屏”内容：** 这是个**严重错误**。如果把用户第一眼就该看到的轮播图也懒加载了，反而会降低 LCP，得不偿失。

2. **设置合适的占位符：**

   - **不要用空白：** 如果图片没加载出来，会是一片空白，页面高度会“跳动”（Layout Shift）。

   - **使用骨架屏 \(Skeleton\)：** 用灰色方块占位。

   - **使用模糊图 \(LQIP/BlurHash\)：** 先加载一张极小、极模糊的图片，等真实图片加载后再替换，体验丝滑。

3. **设置合理的触发“阈值”：**

   - 不要等到图片进入视窗的 1px 才开始加载，那样用户还是会看到加载过程。

   - 应该在“即将”进入时就加载。

   - `Intersection Observer` 提供了 `rootMargin` 选项，比如 `rootMargin: '200px'`，意味着在元素距离视窗还有 200px 时，就触发加载。

# 14. 虚拟列表

当组件数量达到成百上千时，即使有上述优化，DOM 节点的数量本身也会成为瓶颈。

1. 问题根源：

   - 如果一次性渲染成千上万条数据（如一个巨大的 `select` 下拉框或一个长列表），会导致 DOM 节点数过多。

   - 这将引发严重的性能问题：巨大的内存占用、样式计算和布局时间过长、甚至页面卡死。

2. 解决方案：

   - 视觉欺骗：我们创建一个固定高度的容器，并设置 `overflow: auto` 使其可滚动。但这个容器的滚动条高度代表的是所有数据的总高度，而不仅仅是当前可见的几条数据的高度。这给了用户一个“所有数据都在这里”的错觉。

   - 按需渲染：通过计算当前滚动位置，精准地判断出“现在用户能看到的是哪几条数据”，然后只创建并渲染这几条数据对应的 DOM 节点。

   - 占位填充：将非可视区域的数据用空的 `div`（通常称为“垫片”）撑开，从而维持滚动条的正确比例和行为。

3. 实现方案：

```Java
// 假设我们有以下初始数据
const total = 10000; // 总数据量
const itemHeight = 50; // 每项高度（固定）
const containerHeight = 400; // 容器可视高度
```

1. 计算总内容高度（Scroll Height）：

   - 这个高度用于撑开容器，让滚动条看起来像是有所有数据一样。

   - `const scrollHeight = total * itemHeight;`

2. 计算当前可视区域的起始和结束索引：

   - 监听容器的 `scroll` 事件，获取滚动距离 `scrollTop`。

   - `const startIndex = Math.floor(scrollTop / itemHeight);` // 起始索引

   - `const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight) + bufferSize, total - 1);` // 结束索引

   - 注意：这里有一个 `bufferSize`（缓冲区）。比如我们额外多渲染 5 条数据， above and below，防止滚动时出现短暂白屏，提升体验。

3. 获取当前需要渲染的数据切片：

   - `const visibleData = data.slice(startIndex, endIndex + 1);` // 只截取需要显示的部分数据

4. 计算偏移量（Offset）并设置垫片：

   - 因为只渲染了 `visibleData`，所以列表起始位置之前的内容需要用空 div 撑开。

   - `const offset = startIndex * itemHeight;` // 起始位置之前的偏移高度

   - 在渲染 `visibleData` 之前，放置一个高度为 `offset` 的占位 div。

   - 在渲染 `visibleData` 之后，放置一个高度为 `(total - endIndex - 1) * itemHeight` 的占位

```HTML
<div className="virtual-container" onScroll={handleScroll} style={{ height: containerHeight, overflow: 'auto' }}>
  <div style={{ height: scrollHeight }}>
    {/* 上方占位 */}
    <div style={{ height: offset }} />

    {/* 真正渲染的可见项目 */}
    {visibleData.map(item => (
      <div key={item.id} style={{ height: itemHeight }}>
        {item.content}
      </div>
    ))}

    {/* 下方占位 */}
    <div style={{ height: (total - endIndex - 1) * itemHeight }} />
  </div>
</div>
```

## 14.1 频繁上下滑动

如果你只是在一个局部频繁快速地上滑、下滑（比如在犹豫看哪一条），虚拟列表并不会“傻”到每一像素的移动都去重新计算和渲染。

它主要靠这三个机制来保证流畅度：

1. **缓冲区(Buffer / Overscan) —— 关键机制**

这是解决你担心的“频繁滑动”最核心的技术。

虚拟列表不仅仅只渲染屏幕上看到的那 10 条，它通常会在**可视区域的上面和下面**各多渲染几条（比如各多渲染 5 条）。这被称为 **Buffer（缓冲区）**。

- **场景：** 假设屏幕能看 10 条，系统实际渲染了 20 条（上5 \+ 中10 \+ 下5）。

- **当你小幅度滑动时：** 你其实是在看“缓冲区”里的内容。这时候，DOM **完全不需要更新**，仅仅是浏览器原生的滚动效果。

- **结论：** 除非你滑动的距离**超过了**缓冲区的大小，否则 JS 逻辑根本不会运行，DOM 也不会变。这完美解决了“频繁微调”时的性能浪费。

2. **DOM 复用 (Recycling) —— 移花接木**

当你的确滑得比较远，超过了缓冲区，需要加载新行时，虚拟列表不会**销毁**旧的 `div` 然后**创建**新的 `div`。

**DOM 的创建和销毁是最耗性能的。** 虚拟列表的做法是“**回收利用**”：

1. 把你滑出屏幕的那一行 `div` 拿过来。

2. 移动到屏幕的最下方（修改 `transform` 位置）。

3. 把里面的文字/图片换成新的数据。

这就好比只有 20 个碗（DOM 节点），虽然有一万个客人在排队（数据），但我们不需要准备一万个碗，只需要把吃完的碗洗干净给下一个人用。**修改碗里的饭（更新文本）比造一个新碗（创建 DOM）要快得多。**

3. **节流与防抖 \(Throttling\) / requestAnimationFrame**

为了防止 JS 计算过于频繁，成熟的虚拟列表组件通常会做优化：

- **节流：** 哪怕你 1 秒钟内触发了 100 次 `scroll` 事件，代码可能只每隔 16ms（约一帧的时间）执行一次计算。

- **requestAnimationFrame：** 把 DOM 更新操作对齐到浏览器的刷新频率上，避免掉帧。

---

你不需要担心“频繁触发”会导致卡顿，因为：

1. **小幅度滑动** = 纯原生滚动（靠缓冲区），**零** JS 计算。

2. **大幅度滑动** = 复用现有的 DOM 节点，只改文字，开销很小。

---

## 14.2 核心难点：不定高度 (Dynamic Height)

这是最常见的面试题。当列表项（Item）的高度由内容决定（如字数不同、图片不同），我们无法直接用 `scrollTop / fixedHeight` 算出当前该显示第几个元素。

**解决方案：预估 \+ 动态测量 \+ 修正**

这是一个“先斩后奏”的过程：

1. **预估 (Estimate)：** 先给所有未渲染的 Item 一个**预估高度**（比如 `100px`），并据此生成一个位置映射表（数组），记录每个 Item 的 `top` 和 `bottom`。

2. **渲染与测量 (Render \& Measure)：** 当一个 Item 真正被渲染到屏幕上时，利用 `ResizeObserver` 或 `DOM.getBoundingClientRect()` 获取它的**真实高度**。

3. **缓存与修正 \(Cache \& Correct\)：** 将真实高度更新到映射表中。

   - **关键点：** 如果真实高度比预估高度大，说明下面的所有元素都要被“挤”下去。我们需要更新后续所有 Item 的 `top` 值，并调整滚动条的总高度。

> **总结：** 不定高 = 维护一个高度缓存表（Map/Array） \+ 实时更新 \+ `transform` 偏移修正。

---

## 14.3 交互难题：聊天应用的双向滚动 \(Scroll Anchoring\)

在微信/QQ 中，当你向上滑动加载历史消息时，新数据插入到了列表**顶部**。如果什么都不做，原来的第一条消息会变成第 21 条，浏览器会自动把滚动条顶上去，导致你看到的画面瞬间变了。

**解决方案：手动锚定 \(Scroll Correction\)**

我们需要在数据渲染的前后瞬间，手动计算并调整 `scrollTop`，让视觉上看起来位置没变。

**算法步骤：**

1. **记录位置：** 在请求历史数据**前**，记录当前的滚动高度 `oldScrollHeight`。

2. **渲染数据：** 将 20 条历史消息插入到数组头部，Vue/React 更新 DOM。

3. **计算差值：** 此时 DOM 变长了，获取新的 `newScrollHeight`。

   - `差值 = newScrollHeight - oldScrollHeight`。

4. **瞬间修正：** 设置 `scrollTop = scrollTop + 差值`。

> **总结：** 向上加载时，必须用 JS 抵消掉新增内容带来的高度挤压，这在浏览器原生支持 `overflow-anchor` 之前是必须手动做的。

---

## 14.4 用户体验：图片加载与高度抖动

如果列表里包含图片，而图片需要从网络下载。

- **现象：** 刚渲染时图片高度为 0，导致下方文字挤上来；图片加载完瞬间高度变为 200px，下方文字被弹开。这会导致虚拟列表计算错误，出现“鬼畜”跳动。

**解决方案**

1. **后端返回宽高（最佳）：** 后端在返回图片 URL 时，同时返回图片的 `width` 和 `height`。前端直接根据屏幕宽度算出图片渲染后的高度，用一个 `<div style="height: calculatedHeight">` 占位。

2. **骨架屏占位（次选）：** 如果不知道宽高，强制给图片容器设置一个固定高度（如 `200px`），或者显示一个默认占位图。

3. **ResizeObserver 监听：** 如果必须自适应，监听图片容器的大小变化。一旦图片加载完成撑开容器，触发上面提到的 **“不定高度修正逻辑”**，重新计算偏移量。

> **总结：** 永远不要让图片“裸奔”加载，一定要有占位高度。

---

## 14.5 功能缺失：搜索 (Ctrl\+F) 与无障碍 (Accessibility)

因为 DOM 里只有可视区域的元素，浏览器原生的查找功能彻底失效。

**解决方案**

1. **自定义搜索组件：** 不能依赖浏览器的 `Ctrl+F`。你需要在页面内部做一个搜索框。

   - **逻辑：** 搜索时遍历 JS 中的**原始数据源**（哪怕有 10万条，纯 JS 遍历字符串也很快）。

   - **定位：** 找到匹配项的 `index`，然后调用虚拟列表组件的 `scrollToIndex(index)` 方法，自动跳转并渲染该位置。

2. **无障碍 (A11y)：** 这是一块硬骨头。

   - 使用 `role="feed"` 或 `role="grid"`。

   - 使用 `aria-setsize="10000"` 告诉屏幕阅读器其实总共有这么多数据。

   - 使用 `aria-posinset="当前索引"` 告诉阅读器当前读的是第几条。

   - 但这依然很难完美，这是虚拟列表目前最大的短板之一。

---

## 14.6 性能极限：极速滚动白屏优化

当你用鼠标滚轮猛烈滑动，或者按住滚动条拖动时，计算速度跟不上渲染速度，就会出现白屏。

**解决方案**

1. **IntersectionObserver (IO)：** 不要监听 `scroll` 事件（触发频率太高，占用主线程）。使用 `IntersectionObserver` 来监听顶部和底部的“哨兵元素”是否进入屏幕，由浏览器底层来通知你何时加载，性能更好。

2. **Skeleton Loading (骨架屏)：** 在数据还没渲染出来的几毫秒内，不要留白，而是渲染通用的灰色条纹骨架。这属于“视觉欺骗”，让用户觉得“内容正在加载”而不是“程序卡死了”。

3. **时间切片 (Time Slicing) / requestIdleCallback：** 如果每个 Item 的渲染逻辑很复杂（组件树很深），不要在一次事件循环里全部处理完。利用 `requestIdleCallback` 把渲染任务拆分到浏览器的空闲时间里执行。

4. **will\-change：** 给列表容器加上 CSS `will-change: transform`，开启 GPU 硬件加速。
