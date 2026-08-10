---
title: 实习-小荷健康
publishedAt: 2026-08-07
type: note
tags:
  - 面试
draft: false
---

# 一、项目和业务

## 1. 用户抖音 Top1 AI 卡进入小程序之后，到看到首屏流式答案、继续追问，整个前后端链路是怎么走的？

1. 用户从抖音 Top1 AI 卡进入小程序

用户最开始是在抖音搜索结果页看到 Top1 AI 卡。搜索侧其实已经生成了一部分 AI 答案，所以跳转 AI Doctor 小程序时，并不是只带一个 query，而是通过 schema 把 `init_mode=sse` 和一份 `sse_info` 一起透传进来。

`sse_info` 里面比较重要的是 `text`、`stream_id`、`next_stream_id`、`front_msg_id`、`animation_step`、`server_data`、`customViewList` 等。`text` 是搜索页已经拿到的答案，`stream_id/next_stream_id` 用来继续 SSE 流，`front_msg_id` 后面负责真假消息对齐，`animation_step`则用来让小程序里的打字机从搜索页已经播放到的位置继续，而不是重新从头打。

页面判断：`init_mode === "sse" && !sameQueryConvID`之后，就会进入 Top1 的 `sseInitMode`。如果存在 `sameQueryConvID`，说明更偏向一个已经存在的同 query 历史会话，就不是这套纯首屏 39998 直出的链路了。

2. 首屏不会等 IM，而是先造一条本地 39998 假消息

这是整个链路最重要的设计点。

正常聊天页面一般会先初始化 IM SDK、加载 conversation、拉历史消息，然后再渲染。但 Top1 对首屏速度要求很高，如果等 IM 全部 ready，用户从搜索页点进来以后可能先看到白屏或者 loading。

所以 `useMsgList` 初始化的时候，只要发现是 `sseInitMode`，就同步调用 `startupSse()`。`startupSse()` 直接读取 `sse_info.text`，构造一条形状和真实 `IMMessage` 一样的本地消息，消息类型是 39998 / SseQaCard，然后直接塞进当前消息列表。也就是说，这个时候 IM 可能根本还没初始化完成，但用户已经能看到答案了。

这条 39998 的 content 大致就是 `{ text: sse_info.text }`，同时把 `front_msg_id`、`stream_id`、`next_stream_id`、流完成状态、图片信息等放到 `ext`，把 `animation_step` 放到本地扩展字段。最终仍然转换成标准 IMMessage 结构，因此后面的消息列表不需要专门维护一套“HTTP 消息 UI”。

> 所以：为什么要造假消息？
> 不是为了伪造数据，而是为了把首屏展示从 IM 初始化链路里解耦出来。搜索页已经有答案了，就没必要让用户再等一次 IM；但为了复用后面的统一消息列表、卡片渲染和埋点体系，又把这份本地数据包装成 IMMessage。

3. 39998 上屏之后，再继续建立首屏 SSE

本地消息只是把搜索页已经拿到的那部分答案先展示出来，并不代表整个模型回答已经结束。

`startupSse()` 后面会调用 `startInitSse()`，再根据 `stream_id` / `next_stream_id` 建立首屏 SSE 连接，继续接收模型剩余内容。服务端会下发 `new / append / replace` 等事件，前端维护一个 `SseMessageRecord`：`append` 就继续拼文本，`replace` 就更新当前消息，`new` 可以生成新的消息节点，然后重新转成 `IMMessage[]` 通知列表渲染。

所以用户视觉上看到的是：

搜索页已经展示了一部分文字
→ 点进小程序
→ 小程序立刻恢复已有文字
→ 然后继续打字输出剩余答案。

而不是重新发一次问题、重新从第一个字开始生成。

39998 最终会路由到 SseQaCard，正文使用 LotusXMarkdown 做 Markdown 和打字机渲染，同时这个卡片还能承载图片、联网搜索信息、专家信息、药品卡、“详细解答”等业务能力。

4. 与此同时，IM 链路也在后台初始化

这里要强调：SSE 并没有替代 IM。

首屏在通过本地 39998 + SSE 抢速度的同时，后台还是会初始化 IM SDK、conversation 和消息订阅。标准链路基本是：

`LoadImMsgs → loadConversationWithRetry → initImSdk → loadConversationImpl → LotusIMManager.initConversation → 注册 message upsert → 获取 IM 消息 → processor-system → msg-merge → MsgArrChange → 页面列表`

而且 Top1 首屏场景甚至会把首次拉取消息的 limit 设为 0，因为首屏已经由 HTTP/SSE 直出了，没必要为了展示首屏再阻塞等待 IM 历史消息。Top1 SSE 实验下还会提前触发 MainConvLoaded，进一步避免 IM 初始化阻塞用户操作。

因此这时候实际上存在两条并行链路：

SSE 链路负责“现在马上给用户看什么”。

IM 链路负责“这段会话最终的真实、持久化状态是什么”。

5. SSE 假消息最终必须和 IM 真消息对齐

这是第二个核心难点。

首屏的 39998 最开始只是前端 `SseMessageRecord` 里的本地消息，但这条消息最终还需要进入服务端和 IM，否则会有几个问题：刷新以后没了、历史会话里没有、后续模型上下文可能不完整。

所以系统使用 `front_msg_id` 作为非常重要的对齐标识。前端收到 IM 真消息之后，`applyToMsgArr()` 会判断 IM 消息和当前 SSE 假消息是不是同一批。

它大致有三种状态：

第一种，IM 还没回来，那继续展示 SSE 假消息。

第二种，只同步回来一部分 IM 消息，那就把 IM 真消息和剩余假消息合并展示，避免列表突然少消息或者闪烁。

第三种，确认整批消息已经同步完成，就设置 renderImMessages=true，正式切换成 IM 真消息列表。

所以所谓的“SSE/IM 对齐”，本质不是简单地“收到 IM 就把 SSE 删掉”，而是要先确定它们是不是同一条消息、同步是不是完整，然后才能安全切换。否则非常容易出现两份答案、消息闪没或者 key 冲突。项目里主要会结合 `front_msg_id`，以及后续链路里的 `serverId / MessageId` 等标识完成收敛。

6. 用户看到首屏答案之后开始追问

接下来用户可能有几种操作：直接在输入框输入问题、点击 RS 推荐问题、点击蓝链，或者点我做的“详细解答”。

这些入口最后都会收敛到统一的 `sendTextMsg` 链路，而不是各写一套发送逻辑。

不过在真正发送第二轮问题之前还有一个很关键的动作：`BeforeSendMsg`。

因为此时首屏 39998 可能还只是本地假消息，所以 `BeforeSendMsg` 会触发 `tailInsertSseMsg()`。它会停止首屏 SSE 和打字状态，把当前 `SseMessageRecord` 中的首屏消息整理成 `wait_send_message`，准备同步到后端。

这里其实解决了一个很重要的问题：

第二轮问题已经要来了，第一轮首屏答案必须先纳入正式会话上下文。

否则后端收到“那这个怎么办？”这种追问时，第一轮 Top1 回答可能还只存在前端，本轮上下文就会断掉。

7. 后续追问并不一定是“直接调用 IM SDK 发送”

从业务层看，用户后续追问进入统一的 IM 消息管理体系；但在当前启用 SSE 的场景下，真正的网络发送并不是直接 IM SDK.sendMessage()。

链路是：

```
sendTextMsg
→ sendTextHelper
→ sendTextMsgImpl
→ LotusIMManager.sendTextMessage
→ 判断 pageWidgetState.useSSE
→ LotusSseInstance.sendMessage
→ postSSEMessage
→ chat_sse
```

项目代码明确是：`useSSE=true` 时交给 `lotusSseInstance.sendMessage`；只有 `useSSE=false` 才直接调用 `lotusImInstance.sendMessage`。

所以更准确的表述是：

后续追问进入统一 IM Manager 发送链路，但 SSE 模式下传输层实际走 chat_sse，前端先实时展示 SSE 结果，服务端再把正式消息写入 IM，最终前端通过 IM 同步完成状态收敛。

而不是简单说“追问直接通过 IM 发出去”。

8. 第二轮开始以后，消息体系也从首屏 39998 切到通用 SSE 消息体系

首屏的 39998 / SseQaCard 是 Top1 特有的，它主要解决搜索页到小程序的承接。

用户真正开始第二轮会话以后，chat_sse 返回的是通用 SSE 消息体系，比如 33333 / 30003 / 30010 等。它们不再由首屏的 `SseMessageRecord` 管，而是进入 `SseTailAddMsg` 这一套后续 SSE operator。

用户点发送后，前端也会先插入一条本地用户消息，让用户立刻看到自己的问题；服务端随后会返回 ``client_message_id / server_message_id，IM 最终也会同步出真实用户消息和真实 AI 消息。因此这里又存在一次：

`本地用户假消息 → SSE 回执/流式 AI 消息 → IM 真消息`

的收敛过程。

这也是为什么项目里专门做了用户假消息去重：同一个用户问题可能同时以本地消息、SSE ack 和 IM 真消息几种形态出现，必须结合 `MessageId / FrontMsgId / sse_key / serverId` 等信息识别为同一条消息，否则连续追问时很容易出现两个相同的用户气泡。

最后 IM SDK 的 message upsert 会持续接收正式消息变化，再经过 `processMessageListUpdate → setOnData → processor-system → msg-merge` 加工，最后通过消息列表渲染成各种业务卡片。

### 总结版

“我们这个链路的核心其实是 SSE 和 IM 双通路。用户从抖音 Top1 AI 卡进入小荷 AI 医生时，搜索侧会通过 schema 带过来 init_mode=sse 和 sse_info，里面已经有部分首屏答案、stream id、front message id 和打字进度。页面识别到 Top1 SSE 模式后不会等 IM 初始化，而是 startupSse 直接根据 sse_info 构造一条 type=39998 的本地假 IMMessage 先上屏，所以用户进小程序基本马上就能看到搜索页答案。”

“然后前端再根据 stream_id / next_stream_id 建立首屏 SSE，服务端通过 append、replace、new 等事件继续把剩余内容流式补回来，由 SseMessageRecord 合并以后持续更新这条 39998 卡片。与此同时 IM SDK 和 conversation 在后台初始化，所以 SSE 主要负责低延迟展示，IM 负责最终消息持久化和会话一致性。”

“等 IM 真消息回来之后，前端会通过 front_msg_id 等标识把 SSE 假消息和 IM 真消息做对齐。如果 IM 还没同步完就继续保留或者合并假消息，确认完整以后才切成真实 IM 列表，这样避免真假消息重复以及切换过程中列表闪烁。”

“当用户点击 RS、详细解答或者直接输入继续追问时，统一进入 sendTextMsg。发送前会触发 BeforeSendMsg，通过 tailInsertSseMsg 把首屏尚未正式落 IM 的 39998 消息整理成 wait_send_message 同步给服务端，确保第一轮回答进入正式会话上下文。之后用户消息进入 LotusIMManager，如果当前开启 SSE，并不是直接调用 IM SDK，而是通过 chat_sse 发送，同时前端插入本地用户消息并流式接收 AI 回复。”

“第二轮以后就不再主要依赖 Top1 的 39998 了，而是进入通用 SSE 消息体系，例如 33333，由另一套 SSE operator 管理。服务端最终又会把这些消息写入 IM，IM upsert 回来以后再完成 SSE 假消息和真实消息的去重与切换。所以整条链路可以概括成：Top1 schema 带首屏数据 → 本地 39998 抢首屏 → SSE 补流 → IM 后台初始化并最终对齐 → 用户追问走统一发送入口和 chat_sse → SSE 实时展示 → IM 最终收敛。”

## 2. 为什么既要 SSE，又要 IM？只用 SSE 或者只用 IM 不行吗？SSE 和 IM 分别负责什么？

**SSE 和 IM 不是二选一，而是分别解决“实时性”和“最终一致性”两个不同问题。** SSE 负责把模型正在生成的内容尽快推给前端，IM 负责消息的正式落库、历史恢复、跨端同步和最终可信状态。 在你们这个 Top1 场景里，首屏尤其强调“进小程序马上看到答案”，所以会先走本地 39998 + SSE；等 IM 真消息同步回来后，再完成真假消息对齐和切换。

只用 IM 不太合适，主要问题是首屏慢。用户从抖音 Top1 AI 卡进入小程序时，搜索侧其实已经有了一部分答案，如果还要等 IM SDK 初始化、加载 conversation、拉消息、订阅 upsert，再把消息渲染出来，就会把这部分已经存在的内容重新卡在 IM 初始化链路上。你们实际做法是 startupSse() 直接根据 sse_info 构造 39998 本地假消息先上屏，然后再建立首屏 SSE 继续补流，所以 IM 没 ready 的时候用户已经能看到并继续接收答案了。

另外，AI 回答天然是增量生成的。如果只依赖 IM，通常更偏向“完整消息落下来之后再通知前端”，即便 IM 本身也可以做更新，流式 token 级更新仍然不是它最自然的职责。你们首屏 SSE 会直接处理 new / append / replace 等事件，append 就把新的文本拼到已有内容后面，因此非常适合模型边生成边展示。

但反过来，只用 SSE 也不行。因为 SSE 本质上更适合做实时传输，它不天然承担完整的会话持久化、历史消息恢复、跨端同步、正式消息 ID 管理这些职责。如果首屏 39998 永远只留在前端的 SseMessageRecord 里，那么用户刷新页面、重新进入会话，或者后续模型需要完整上下文时，这些消息就可能不存在于正式会话历史中。因此你们还要通过 `tailInsertSseMsg` 把本地假消息同步给服务端和 IM。

所以你可以把两者的职责划得很清楚：

**SSE：** 实时通道。 负责首屏抢速度、模型增量输出、本地假消息更新，以及后续 chat_sse 的实时回复。
**IM：** 最终状态通道。 负责正式消息持久化、会话历史、消息订阅和最终真实消息同步。

这也是为什么你们代码里最后所有消息都要收敛成 `IMMessage[]`。即使最开始是 SSE 假消息，也会包装成 IMMessage 形态进入统一列表；等 IM 真消息回来以后，再把假消息替换掉。项目资料明确把“真 IM 消息”定义为最终应该以它为准的消息，而 SSE 假消息主要服务流式展示。

**那 IM 真消息什么时候回来?** 首屏 SSE 和 IM 初始化是并行的。 页面不会等 IM 才展示，但后台仍然会初始化 IM SDK、conversation，并注册 message upsert。服务端把消息正式写入 IM 以后，前端通过 IM 历史或者 upsert 收到真消息，再进入 setOnData → processor-system → msg-merge 这套链路。

**真假消息怎么切换?** 不是一看到 IM 消息就把 SSE 假消息删掉，而是先根据 `front_msg_id` 等标识判断它们是不是同一条或同一批消息。如果 IM 还没有同步完整，就把已有真消息和剩余假消息合并展示；确认完整同步之后，才设置 renderImMessages=true，正式切到 IM 真消息列表。这样能避免切换时消息突然消失、重复或者列表闪烁。

**最终到底以谁为准?** 答案是：正常链路最终以 IM 真消息为准，SSE 是过渡态和实时展示态。 SSE 假消息的意义是缩短等待时间，不是成为最终数据源。IM message 是“最终持久化真消息”，前端通过 `front_msg_id / serverId` 和 SSE 假消息对齐，成功后切到 IM。

但是这里有一个异常分支：IM 初始化失败时不能机械地说永远以 IM 为准。 你们后来专门做了 `imInitFallbackToSseOnly`。在 Top1 SSE 实验且 TT 环境下，如果前端 IM SDK 初始化或拉会话失败，不直接让页面失败，而是进入 `SSE-only` 模式，继续允许文本通过 `chat_sse` 发送，同时禁止消息列表切回不可靠的 IM 数据源。

**这里要区分一个很重要的概念：** 前端 IM 初始化失败，不等于服务端 IM 一定没落库。 它可能只是前端 SDK 初始化、历史拉取或者订阅链路出了问题。所以 SSE-only 是一个前端可用性兜底，而不是把整个系统永久改成“不要 IM”。正常情况下，一旦 IM 链路可用，最终还是以真实 IM 消息来收敛。

### 总结

“同时用 SSE 和 IM，是因为两者解决的问题不一样。SSE 主要解决实时性，尤其是 Top1 用户从搜索卡进入小程序时，我们不希望等 IM SDK 和 conversation 初始化完成，所以先根据 sse_info 构造 39998 本地假消息上屏，再通过 SSE 用 append、replace 等事件继续补模型输出。这样首屏速度和流式体验比较好。”

“但是 SSE 不适合作为最终消息系统，因为还涉及历史消息、刷新恢复、跨端同步、正式 message id 和会话上下文，所以后台仍然会初始化 IM，服务端最终把消息写进 IM。IM 真消息回来以后，我们通过 front_msg_id 等标识和 SSE 假消息对齐，没同步完整时合并展示，完整以后再切成真 IM 消息。因此正常情况下是 SSE 负责快，IM 负责准和持久化，最终以 IM 为准。”

“如果 IM 初始化失败，我们又不能因为 IM 挂了就让已经可用的 SSE 链路也不可用，所以 Top1 场景做了 SSE-only fallback，继续允许文本问答，同时禁止切回不完整的 IM 数据。这样既保证首屏和实时体验，也保证正常链路最终能够收敛到正式 IM 会话。”

一句话记忆就是：**SSE 是实时展示层，IM 是最终消息事实层；正常情况下 SSE 先展示，IM 后收敛。**

## 3. “详细解答”、健康服务 Agent、穴位图文这些功能，最终解决的业务问题是什么？你怎么证明不是单纯增加一个按钮或者一个卡片？

小荷 AI Doctor 的核心业务问题是：用户从抖音搜索 Top1 AI 卡进入小程序之前，其实已经在搜索页看过一版答案了。也就是说，他进入小程序时不是“完全没得到答案”，而是已经获得了一次浅层满足，所以很容易出现“进来把剩下内容看完，然后直接退出”的情况。健康服务 Agent 的 PRD 数据里，AI 卡点击到小程序真正发生对话的转化率大约只有 30.94%～33.91%，说明大量已经表现出健康意图、甚至已经点击进入小程序的用户，最终没有开口。

所以“详细解答”、健康服务 Agent、穴位图文虽然产品形态不同，但背后的业务目标其实是一致的：提高 Top1 流量进入小程序之后的承接效率，给用户一个继续留在小程序、继续互动甚至发起对话的理由。

“详细解答”解决的是“浅答已经够看，但用户不知道为什么还要继续问”的问题。Top1 给的是相对浅的一次性答案，所以我们在答案完成以后提供“详细解答”，把用户从“看答案”自然引导到“继续深入咨询”；而且点击后不是跳页面，而是直接复用 sendTextMsg 发起下一轮会话，相当于降低了用户自己组织问题、输入问题的成本。

健康服务 Agent 解决的问题更进一步。它不是单纯问用户“你还想问什么”，而是根据用户当前 query 背后的需求推理出更加具体的服务。比如用户搜减肥，他表面问的是一个问题，但真实需求可能是减脂计划、饮食方案、热量计算或者运动计划，所以我们把通用的追问入口升级成具体的健康服务入口，用户点一下就可以把对应 msg_content + ext_params 作为下一轮消息发出去。

所以健康服务 Agent 的产品逻辑其实是从：

“你还要继续问吗？”

变成：

“根据你刚才的问题，我可以直接帮你做一个减脂计划，你要不要开始？”

这就是所谓的“给用户新的开口理由”。而且它不是前端自己硬编码几个按钮，服务端有独立的 `health_service_plugins` 协议，可以根据需求推理决定召回什么服务、发送什么 `msg_content` 和业务参数，前端负责展示、发送和归因。

穴位图文解决的则不是直接“多一个追问按钮”，而是提升 Top1 答案本身的消费体验和互动价值。穴位类问题天然有空间定位需求，比如“足三里在哪里”“这几个穴位分别在哪”，纯文本描述的理解成本很高，所以加入图片以后，是把答案从“可读”升级成“可理解、可定位、可交互”。项目资料里这个场景本身就有约 42.5 万 Top1 搜索 PV，所以不是一个非常边缘的功能。

它的业务假设是：更好的多模态答案能够提升用户对 Top1 内容的消费和点击意愿，进一步增加进入 AI Doctor、继续查看图片和继续对话的概率。因此 PRD 定义的收益链路本身就是“更好满足细分医疗需求 → CTR 提升 → 激发进一步对话 → 对话率提升”。

但是这个问题真正重要的部分其实是面试官后半句：

你怎么证明它不是单纯增加一个按钮或者一个卡片？

这里千万不要回答“因为我们加了埋点，CTR 提升了”就结束。模块自己的 CTR 高，不代表业务产生了增量。

这个项目后来一个非常重要的业务认知就是：我们原来从产品视角认为，新入口和原来的追问应该是“新增关系”。比如原来 100 个用户里 30 个会点追问，现在增加一个详细解答，假设另外有 5 个人点击详细解答，那对话可能从 30 涨到 35。

但实验发现用户不是这么使用页面的。新的入口会抢夺用户注意力，本质上和已有 RS、备选项、追问卡形成了替换关系。也就是说，原来会点追问的人，可能现在改成点“详细解答”了，而不是多出来一个新用户。项目最后得到的业务结论就是：蓝链强化、健康服务、详细解答这些实验都必须考虑和原有追问之间的替换关系。

“详细解答”的实验数据其实非常典型。它有大约 86% 的落地页有展率，按钮自身 CTR 在 0.9%～1.7%，乍看是有人点击的；但是与此同时，原有 RS CTR 最大下降了 7.5%，备选项 CTR 最大下降了 4.8%。更关键的是最终落地页成单率，对照组是 32.1%，几个实验组反而分别大约是 31.3%、31.7%、31.6%。

所以真正证明一个功能有没有价值，我会看完整漏斗，而不是按钮点击率：

Top1 曝光 → Top1 点击 → 小程序访问 → 新模块曝光 → 新模块点击 → 发消息 → 对话转化/成单

同时还要看原有入口：

RS CTR、备选项 CTR、原有追问发消息量

有没有被吃掉。

健康服务 Agent 之所以专门做独立埋点，而不是复用普通 RS，就是为了能把这条链路单独归因。项目里实际上做了 agent_health_plan_module_show/click，同时带 conversation_id、order_id、健康计划内容等参数，PRD 要求能够串起“搜索 query → Top1 → 小程序 → 健康服务曝光 → 点击 → 发消息”。

穴位图文也是一样。不能只统计“图片有没有被点”。所以埋点同时带了 search_id / search_result_id 和 conversation_id / message_id / conv_round，目的就是把搜索侧 PV、图片曝光点击和后续会话行为串起来，最后验证“出图是不是提高了 CTR 和对话率”，而不是证明“用户喜欢点图片”。

### 总结

“这几个需求表面上一个是按钮、一个是 Agent 服务、一个是图片，但实际上解决的是同一个业务问题：Top1 用户在搜索页已经得到了一版浅答，所以点击进入小程序以后很容易直接看完离开，我们真正缺的是让用户继续互动、继续开口的理由。详细解答是把浅答自然升级成深度追问；健康服务 Agent 是进一步根据 query 背后的需求，把通用追问变成减脂计划、饮食方案这类具体服务；穴位图文则针对强视觉意图提高答案的理解效率和互动性。”

“但我们不会因为新模块有人点击就认为需求成功。这个项目比较重要的一个认知是，新入口和原来的 RS、备选项、追问存在流量替换。比如详细解答自己有 0.9%～1.7% CTR，但实验里 RS CTR 最大下降了 7.5%，最终整体成单率反而没有提升。所以真正判断价值，要通过 AB 实验看整体发消息转化、对话转化或成单，同时观察原有追问流量有没有被吃掉。”

“所以我会把指标分成两层：模块 CTR 只能说明这个入口有没有吸引力，整体对话增量才说明它有没有业务价值。如果新增模块带来的发消息量小于它替换掉的原有追问量，即使按钮 CTR 很漂亮，这个需求从业务上仍然没有做正。这也是我们后续做 Top1 承接实验时最重要的判断标准。”

**“模块 CTR 证明有人用，整体对话增量才证明有业务价值；新增入口最大的风险不是没人点，而是只把原有追问流量换了个位置。”**

# 二、SSE + IM

## 4. SSE 是流式分片下发的，你们前端怎么把一个个 chunk 合并成最终消息？如果里面不只有文本，还有图片、引用资料、children、动态卡片怎么办？

**我们不是把 SSE 当成“字符串流”处理，而是把它当成“对一棵结构化消息树的增量操作流”。后端持续下发 new / append / replace / update / delete 事件，前端维护 sseMsgMap，根据 id / target_id 找到具体消息节点，再按事件语义更新。**

因为我们的一条 AI 回复里可能同时有正文、思考节点、引用资料、图片、推荐问题、动态卡片等结构。

1. 首先不是 merge chunk，而是先判断这个 chunk 要操作哪个节点

后端 SSE 每次回来的是一个结构化事件，大概包含：

```json
{
  "event": "append",
  "args": {
    "target_id": "node_text_1"
  },
  "data": {
    "node_data": {
      "text": "根据你的症状..."
    }
  }
}
```

前端收到 SSE message 后先 `JSON.parse(payload.data)`，然后根据 event 分发：

```
new
append
replace
update
delete
im_send
im_replace
```

对应调用不同 operator。operator 修改的是 sseMsgMap，修改完成后重新 `setSseMessageList([...sseMsgMap.values()])`，再触发消息列表 patch。

所以准确地说：

后端持续推的是操作事件，前端维护的是一棵不断被这些事件修改的临时消息树。

2. new 和 append 的语义是不一样的

如果是 new，表示创建一个新节点。

没有 target_id，说明它是根消息，直接：`sseMsgMap.set(id, node);`

如果有 target_id，就先递归找到父节点，然后把这个新节点挂到父节点的 children 里。

因此一条 33333 消息内部最后可能长成：

```
root
├── 顶部区域
│   └── 引用资料
├── 正文区域
│   └── markdown
└── 底部区域
    └── 推荐问题
```

项目里的 33333 本身就不是“一段 text”，而是一棵 children + node_type 组成的节点树；渲染时再根据 node_type 找对应组件。

而 append 不会新建一条消息，它会根据 target_id 找到已有节点，然后调用 deepAppendNode 递归追加。

3. string 怎么 merge：追加，而不是覆盖

比如当前状态：

```json
{
  "node_data": {
    "text": "你好"
  }
}
```

新 chunk：

```json
{
  "node_data": {
    "text": "，根据你的症状"
  }
}
```

deepAppendNode 递归到 node_data.text 后，发现目标字段是 string，就执行：

targetNode[key] =
`${targetNode[key]}${appendNode[key]}`;

最后得到：

```json
{
  "node_data": {
    "text": "你好，根据你的症状"
  }
}
```

这就是流式 Markdown 正文不断变长的核心。

3. object 怎么 merge：递归，而不是浅覆盖

例如已有：

```json
{
  "node_data": {
    "text": "你好",
    "ext": {
      "source": "rag"
    }
  }
}
```

新的数据可能是：

```json
{
  "node_data": {
    "text": "，建议",
    "ext": {
      "status": "streaming"
    }
  }
}
```

如果简单：

```js
{
  ...old,
  ...chunk
}
```

node_data 整个就会被新的 node_data 覆盖掉，旧的 ext.source、旧文本都可能丢。

所以项目里的 deepAppendNode 对 object 会继续递归：

```js
if (typeof targetNode[key] === 'object') {
  deepAppendNode(appendNode[key], targetNode[key]);
}
```

一直找到真正变化的叶子节点再处理。

这也是为什么同一套机制可以处理：

```
node_data
  ├── text
  ├── ext
  ├── children
  └── 其他结构化字段
```

而不是专门只写一个 text += chunk.text。

5. number 为什么不能也做加法

项目的 deepAppendNode 对目标值是 number 的场景直接跳过：

```js
if (typeof targetNode[key] === 'number') {
  return;
}
```

因为 number 很多时候是 node_type、状态值、序号或者元信息，而不是所谓的“增量”。如果第一次是: node_type: 20

下一次又下发：node_type: 20

你显然不能得到：node_type: 40

所以字符串的“append”语义不能简单推广到所有 primitive 类型。

6. 引用资料和动态卡片怎么办？

它们实际上很好解释，因为这也是为什么要做“节点树”，而不能做“纯文本拼接”。

比如 RAG 引用资料，在通用 SSE 卡中可以作为一个独立的 node_type=20 节点，顶部区域找到这个 node 后交给 ReferenceListComponent 渲染。

正文可能是：

```
node_type = markdown
```

引用资料：

```
node_type = 20
```

其他动态卡：

```
node_type = xxx
```

所以 SSE 合并层只负责：

把正确的数据放到正确节点上。

它不需要知道：

“这是药品卡还是引用资料卡，我应该怎么画。”

渲染层再根据：

```
node.node_type
```

映射到具体 ReactLynx 组件。

所以架构上其实是：

```
SSE event
    ↓
根据 id / target_id 定位节点
    ↓
更新 sseMsgMap 节点树
    ↓
转换成临时 IMMessage
    ↓
33333 卡片拿到 children
    ↓
node_type → 对应组件

这样协议层和 UI 层是分开的。
```

7. 图片又稍微特殊一点

Top1 39998 的穴位图片不是简单地把图片 URL 当 text chunk 拼进去，而是走了 custom_view_list。

Markdown 正文里面有一个：

```
blockview://multi-image-xxx
```

这样的占位符，同时 `custom_view_list` 里有对应 ID：

```json
{
  type: "multi_image",
  id: "multi-image-xxx",
  image_list: [...]
}
```

然后 LotusXMarkdown 用相同 ID 的 custom view 去替换这个占位符。这样文本仍然沿用原来的 Markdown/SSE 流，而图片走结构化 custom view，不需要因为加图片重写整个 SSE 卡片。

这个设计也解决了一个重要问题：文本和图片不一定同时到。

可能：

```
chunk 1：Markdown 文本到了
chunk 2：图片 custom_view_list 到了
chunk 3：后续正文又到了
```

所以项目的首屏 SSE merge 对 custom_view_list 会进行累加，同时 LotusXMarkdown children 持续根据占位符 ID 挂载对应 view。项目资料明确指出，文本先到、custom view 后到以及 replace/append 中 ext 变化，是这里的主要难点。

8. 那图片重复下发怎么去重？

这里我建议你面试时不要把项目说得比实际代码更强。

从项目资料来看，首屏 SseMessageRecord.replaceMsg() 对 CustomViewList 的处理主要是把旧列表和新列表累加：

```
[
  ...oldCustomViewList,
  ...newCustomViewList
]
```

同时保留已有的 WebSearchInfo。也就是说，当前资料里没有体现这一层做了一个严格的 pictureId → dedupe 通用去重器。

穴位图片本身每个 image 和 multi-image 都有稳定 id，渲染时也用这个 ID 对齐 Markdown blockview；多图内部 React key 也是 image.id。

如果面试官追问：

那如果后端真的重复发两遍同一个 custom view 呢？

你可以回答：

“这个地方如果要求前端进一步做幂等，我会在 merge custom_view_list 时基于稳定的业务 ID 去重，而不是按 URL 或数组下标。单图用 item.id / picture_id，multi-image 外层先用 custom view id 去重，内部再按每张图片的 image id 去重。相同 ID 再下发，如果是增量字段就 merge，如果完全一致就直接忽略。”

这个回答比较严谨。

9. replace、append、update 为什么必须分开

这也是“不能一个万能 deepMerge 搞定”的另一个原因。

同样一个字段，在不同事件里语义完全可能不同：

```
append   → 增量追加
replace  → 新值替换旧值
update   → 更新部分属性
new      → 创建新节点
delete   → 删除节点
```

项目收到 SSE 后首先按这些 event 分不同 operator，就是为了保留协议语义。

如果所有事件都写成：

```
state = deepMerge(state, chunk);
```

你根本分不清：

```
"abc" + "def"
```

到底应该变成：

```
"abcdef"
```

还是：

```
"def"
```

因为这个答案不是由 JavaScript 类型决定的，而是由 SSE event 的协议语义 决定的。

### 总结

“我们后端 SSE 下发的不是纯字符串 chunk，而是一套结构化事件协议，包括 new、append、replace、update、delete。前端维护一个 sseMsgMap，每个事件都有 id 或 target_id，所以先定位这次到底修改哪个消息节点，再执行对应 operator。new 是创建根节点或者挂到父节点 children，append 才负责对已有节点做递归增量合并。”

“append 里面有一个 deepAppendNode：字段不存在就直接写入；string 是流式内容，所以做字符串追加；object 继续递归；number 这种元信息不会直接累加。这样不只是 text 可以流式更新，像 node_data、ext 这种嵌套结构也能更新。”

“对于 children、引用资料、动态卡片，我们不会把所有东西压成一段字符串。33333 本身是一棵 node tree，每个节点有自己的 message_id 和 node_type，数据层通过 target_id 更新对应节点，渲染层再根据 node_type 映射到 Markdown、引用资料、推荐问题等不同组件。”

“图片又走结构化 custom_view_list，正文里是 blockview 占位符，图片数据用相同 ID 挂载，所以文本和图片可以不同时间到达。如果是需要数组幂等的场景，不能直接 concat，我会按节点 ID、custom view ID 或 picture ID 做去重和 merge。项目现有首屏 custom_view_list 主要是累加，资料里没有体现完整的通用数组去重器，所以这部分我不会说成已经实现了全类型通用 deepMerge。”

**“不是 chunk → 拼字符串，而是 event → 定位节点 → 按协议语义更新消息树 → node_type 驱动结构化渲染。”**

## 5. SSE 假消息和 IM 真消息如何对齐、去重和替换？如果 IM 消息先到、SSE 还没结束，或者 SSE 完成了 IM 还没到，怎么办？

**SSE 假消息和 IM 真消息不是两条独立消息，而是同一条业务消息在“实时展示态”和“最终持久化态”的两个阶段。前端做的事情是先建立稳定身份映射，再根据 SSE 是否还在渲染、IM 是否已经完整同步，决定继续展示 SSE、真假混合，还是最终切到 IM。正常情况下最终以 IM 真消息为准。**

1. 为什么不能按文本内容去重？

因为文本根本不是稳定身份。

SSE 正在流式生成时，可能先是：建议多休息

下一帧变成：建议多休息，并注意补充水分

而 IM 最终落库可能已经是完整版本。甚至服务端还可能对 Markdown、卡片字段、ext 做最终加工。所以同一条消息在不同阶段，content 本身就可能不同。

反过来，不同消息内容也可能完全一样。比如用户连续两次发送“详细解答”，如果按文本内容去重，你反而会错误删掉一条合法消息。

所以你们是按消息身份字段对齐，不是按文本对齐。

2. 你们有哪些身份字段？

这里最好分“用户消息”和“AI 回复”讲，因为两条链路稍微不同。

用户发送一条消息时，前端先生成本轮 SSE 请求的 key，它来自类似 `complexUuid() + deviceId`。这个 key 同时写到本地用户假消息的 `localCustomExt.sse_key`；服务端 `send_user_msg` 返回后，又会给出 `client_message_id` 和 `server_message_id`，其中前者可以继续和本地 key 建立关联，后者则对应最终真实 IM 消息的 `serverId`。

所以用户消息大概是：

```
前端 key
   ↓
localCustomExt.sse_key
   ↓
SSE send_user_msg.client_message_id
   ↓
IM s:client_message_id
```

同时：

```
send_user_msg.server_message_id
   ↓
IM serverId
```

因此代码判断“当前用户假消息是不是已经有真消息了”时，不会只看一个字段，而是同时看 `MessageId / FrontMsgId / sse_key / serverId` 等身份信息。

AI 回复则更直接。通用 SSE 回复里会拿到 `message_id / server_message_id`，前端把它包装成临时 IMMessage 时就作为 serverId 使用，这样后续真正 IM 消息回来时，可以直接按 serverId 找到同一条回复。

而 Top1 首屏 39998 又稍微特殊一点。它最开始来自 `sse_info`，核心对齐字段是 `front_msg_id`。后续服务端把首屏假消息同步进 IM 后，前端会先通过 FrontMsgId 判断“这一批 IM 消息是不是对应当前这批 Top1 SSE 假消息”。

**Top1 首屏主要靠 FrontMsgId 对批次，后续通用 SSE 回复主要靠 serverId 对具体消息；用户本地假消息还会结合 client_message_id / sse_key 做身份桥接。conversationId 则用于限定这些消息属于哪个会话，避免跨会话误合并。**

1. fake → real 的生命周期是什么？

用户发送后，生命周期大概是：

```
本地用户假消息
        ↓
SSE send_user_msg 回执
        ↓
获得 client_message_id / server_message_id
        ↓
AI SSE 临时回复不断生成
        ↓
服务端正式写入 IM
        ↓
IM SDK 收到真用户消息 + 真 AI 消息
        ↓
msg-merge 判断身份已完全对齐
        ↓
清理 SSE 临时状态
        ↓
最终只保留 IM 真消息
```

Top1 首屏则是：

```
sse_info
  ↓
39998 本地假消息
  ↓
首屏 SSE 继续补流
  ↓
tailInsert / 服务端正式写 IM
  ↓
IM 真消息回来
  ↓
FrontMsgId 对齐
  ↓
最终切 IM
```

项目资料对这两个生命周期的总结就是：**Top1 是 sse_info → 39998 假消息 → SSE → IM 真消息；主动发消息是 本地用户假消息 → SSE message → IM 真消息。**

4. 如果 IM 消息先到了，但 SSE 还没结束怎么办？

不能 IM 一到就直接切。

因为 IM 可能已经提前拿到真实消息，但此时：

```
SSE 还有最后几个 chunk 没展示；
messageQueue 里还有待渲染节点；
打字机还在播放；
当前卡片 isRendering=true。
```

如果这个时候直接把 SSE 假消息删掉切成 IM，用户就可能看到打字动画突然跳完、内容闪烁、卡片重挂载甚至顺序变化。

所以你们的 merge 逻辑是：**只要还没有满足“可切 IM”的条件，UI 就继续优先展示 SSE 版本。**

具体来说，IM 真消息作为 `baseImMsgs`，然后遍历 SSE 消息。如果发现相同 serverId，不是删除 SSE，而是在原位置 splice，让当前 SSE 版本覆盖 IM 版本：

```js
const foundIndex = mergedArray.findIndex((m) => m.serverId === item.serverId);

if (foundIndex >= 0) {
  mergedArray.splice(foundIndex, 1, item);
}
```

也就是说：

IM 可以先到数据层，但在流式没展示完之前，UI 仍然使用 SSE 那个版本。

只有满足三个核心条件以后才允许切：

```
当前所有 sseMessageList 中的 SSE 消息，都能在 IM 列表里找到相同 serverId；
messageQueue.length === 0，没有等待展示的流式消息；
!isRendering，当前没有 SSE 卡片还在打字或播放。
```

然后才执行：

```
setImMessageReady();
```

最后允许 `applyToMsgArr()` 直接返回真正的 IM 列表。

所以这句话你可以直接记：

IM ready 是数据 ready，SSE render finish 是 UI ready；两个都 ready 才切。

5. 如果反过来，SSE 已经完成了，但 IM 还没到呢？

那就继续展示 SSE 假消息。

这也是 SSE 存在的意义。不能说：

SSE close 了，所以我把临时消息删掉，等 IM。

否则就会出现一段空窗期。

当前逻辑只有在所有 SSE 消息都已经能在 IM 中找到对应 serverId 后，才能认定 IM ready。只要 IM 还没同步回来，就继续把 SSE 临时消息合在最终展示数组里。

所以：

```
SSE 完成
IM 未到
   ↓
继续显示 SSE 最终结果
   ↓
等待 IM upsert
   ↓
IM 身份全部对齐
   ↓
再切换
```

用户看到的内容不会消失。

6. 如果 IM 只回来一部分怎么办？

这个在 Top1 首屏链路里体现得非常明显。

SseMessageRecord.applyToMsgArr() 有三种情况：

```
IM 完全没回来：直接显示本地 SSE 假消息；
IM 完整同步：切真实 IM；
IM 只同步了一部分：通过 mergeImMsgsToHttpMsgs 把真消息和剩余假消息合起来。
```

所以它不是二元状态：SSE 或 IM

中间实际上还有一个：

SSE + 部分 IM 混合态

目的就是保证列表始终连续。

7. 为什么替换的时候不容易闪？

因为你们不是：

```
删除 SSE 消息
↓
插入一条新的 IM 消息
```

而是尽量保持同一个数组位置和稳定 key。

同 `serverId` 时使用 `splice(foundIndex, 1, item)` 原位置替换；列表 `key` 对 33333 等消息优先使用稳定 `serverId`，其他消息则会优先考虑 `FrontMsgId`、再退到 `MessageId`。这样 React/Lynx 更倾向于认为“同一个 item 的 props 发生变化”，而不是整个组件卸载重建。

因此如果线上出现真假消息切换闪烁，首先应该排查：

```
serverId 是否一致
FrontMsgId 是否一致
MessageId 是否一致
list key 是否在切换过程中变化
```

而不是先去组件里写：

```js
if (sameText) return null;
```

8. SSE 和 IM 内容不一致，到底以谁为准？

**正常链路最终以 IM 真消息为准。**

因为 SSE 是实时展示态，IM 是服务端最终持久化态。IM 承担的是历史消息、刷新恢复、跨端同步以及最终会话事实，所以在确认身份对齐、SSE 队列已经消费完成后，会清理本地 SSE 临时消息，最终直接展示 IM 列表。项目资料也明确把真 IM 定义为“最终应以它为准”。

但这里还有一层要讲清楚：

“最终以 IM 为准”不等于“IM 一到就立刻以 IM 为准”。

时间上可能是：

```
t1：SSE 正在展示 ABC
t2：IM 已经拿到最终 ABCDEF
t3：SSE 还在播放 DEF
```

此时数据事实层虽然 IM 已经更完整，但 UI 仍然继续展示 SSE，避免瞬间跳到最终内容。等 SSE 渲染完成后，再切到 IM。

因此展示过程以 SSE 连续性优先，最终状态以 IM 权威性优先。

9. 那如果 SSE 和 IM 真正发生内容冲突呢？

如果它们通过 serverId / FrontMsgId 已经确认是同一条业务消息，那么正常收敛以后应该显示 IM 的 B，而不是长期保留 SSE 的 A。

这意味着真正的内容不一致应该被认为是服务端流式输出和最终落库之间的一致性异常，而不是前端通过比较文本来决定谁对谁错。前端的职责主要是：

```
先用身份字段确认是不是同一条消息；
流式期间保证 UI 连续；
最终切 IM；
如果必要，上报 SSE/IM 内容不一致监控。
```

这里第 4 点属于合理的工程增强；项目资料明确体现的是最终以 IM 收敛，没有体现你们已经做了完整的 content diff 告警，所以面试时不要说成已有功能。

10. IM 初始化失败又怎么办？

这是正常规则的异常分支。

如果进入 imInitFallbackToSseOnly=true，就意味着前端当前没有一个可靠的 IM 数据源。这时反而必须禁止切 IM，继续使用本地 SSE 消息作为展示源，否则一个空的、旧的或不完整的 IM 列表可能把当前正常的 SSE 内容覆盖掉。

所以正常状态：

```
SSE 临时态
   ↓
IM 最终态
```

fallback 状态：

```
SSE 临时态
   ↓
继续 SSE-only
   X
不允许误切到异常 IM
```

### 总结

“我们不会按文本内容做 SSE 假消息和 IM 真消息去重，因为流式阶段和最终落库阶段的 content 本来就可能不一样，而且不同消息也可能有相同文本。我们主要依赖稳定身份字段。Top1 首屏 39998 主要用 FrontMsgId 判断是不是同一批消息；用户发送侧有前端生成的 key、localCustomExt.sse_key、服务端返回的 client_message_id/server_message_id；后续 AI 通用 SSE 回复主要通过 message_id/server_message_id 映射成 serverId，再和 IM 真消息对齐。”

“时序上也不是 IM 一到就切。如果 IM 先到了，但 SSE 还没播放完，我们仍然让 SSE 版本在当前数组位置覆盖 IM 版本。只有当前所有 SSE 消息都能在 IM 里找到相同 serverId，同时 messageQueue 已经清空、isRendering=false，才把 IM 标成 ready，然后切到真实 IM 列表。”

“反过来如果 SSE 已经结束但 IM 还没到，就继续显示 SSE 最终结果，不能先把假消息清掉；如果 IM 只同步了一部分，就真假消息合并展示。等 IM 完整同步后才最终切换。因此整个生命周期是 fake → mixed → real，而不是收到真消息就粗暴替换。”

“如果 SSE 和 IM 内容不一致，正常链路最终以 IM 真消息为准，因为 SSE 是实时展示态，IM 是最终服务端持久化事实。但为了用户体验，IM 即使提前到了，也不会打断正在进行的 SSE 渲染。可以理解成：展示阶段以 SSE 的连续性优先，最终状态以 IM 的权威性优先。”

SSE 假消息和 IM 真消息不是两条独立消息，而是同一条业务消息在“实时展示态”和“最终持久化态”的两个阶段。前端做的事情是先建立稳定身份映射，再根据 SSE 是否还在渲染、IM 是否已经完整同步，决定继续展示 SSE、真假混合，还是最终切到 IM。正常情况下最终以 IM 真消息为准。

1. 为什么不能按文本内容去重？

因为文本根本不是稳定身份。

SSE 正在流式生成时，可能先是：

建议多休息

下一帧变成：

建议多休息，并注意补充水分

而 IM 最终落库可能已经是完整版本。甚至服务端还可能对 Markdown、卡片字段、ext 做最终加工。所以同一条消息在不同阶段，content 本身就可能不同。

反过来，不同消息内容也可能完全一样。比如用户连续两次发送“详细解答”，如果按文本内容去重，你反而会错误删掉一条合法消息。

所以你们是按消息身份字段对齐，不是按文本对齐。

2. 你们有哪些身份字段？

这里最好分“用户消息”和“AI 回复”讲，因为两条链路稍微不同。

用户发送一条消息时，前端先生成本轮 SSE 请求的 key，它来自类似 complexUuid() + deviceId。这个 key 同时写到本地用户假消息的 localCustomExt.sse_key；服务端 send_user_msg 返回后，又会给出 client_message_id 和 server_message_id，其中前者可以继续和本地 key 建立关联，后者则对应最终真实 IM 消息的 serverId。

所以用户消息大概是：

前端 key
↓
localCustomExt.sse_key
↓
SSE send_user_msg.client_message_id
↓
IM s:client_message_id

同时：

send_user_msg.server_message_id
↓
IM serverId

因此代码判断“当前用户假消息是不是已经有真消息了”时，不会只看一个字段，而是同时看 MessageId / FrontMsgId / sse_key / serverId 等身份信息。

AI 回复则更直接。通用 SSE 回复里会拿到 message_id / server_message_id，前端把它包装成临时 IMMessage 时就作为 serverId 使用，这样后续真正 IM 消息回来时，可以直接按 serverId 找到同一条回复。

而 Top1 首屏 39998 又稍微特殊一点。它最开始来自 sse_info，核心对齐字段是 front_msg_id。后续服务端把首屏假消息同步进 IM 后，前端会先通过 FrontMsgId 判断“这一批 IM 消息是不是对应当前这批 Top1 SSE 假消息”。

所以面试时可以概括成：

Top1 首屏主要靠 FrontMsgId 对批次，后续通用 SSE 回复主要靠 serverId 对具体消息；用户本地假消息还会结合 client_message_id / sse_key 做身份桥接。conversationId 则用于限定这些消息属于哪个会话，避免跨会话误合并。

3. fake → real 的生命周期是什么？

用户发送后，生命周期大概是：

本地用户假消息
↓
SSE send_user_msg 回执
↓
获得 client_message_id / server_message_id
↓
AI SSE 临时回复不断生成
↓
服务端正式写入 IM
↓
IM SDK 收到真用户消息 + 真 AI 消息
↓
msg-merge 判断身份已完全对齐
↓
清理 SSE 临时状态
↓
最终只保留 IM 真消息

Top1 首屏则是：

sse_info
↓
39998 本地假消息
↓
首屏 SSE 继续补流
↓
tailInsert / 服务端正式写 IM
↓
IM 真消息回来
↓
FrontMsgId 对齐
↓
最终切 IM

项目资料对这两个生命周期的总结就是：Top1 是 sse_info → 39998 假消息 → SSE → IM 真消息；主动发消息是 本地用户假消息 → SSE message → IM 真消息。

4. 如果 IM 消息先到了，但 SSE 还没结束怎么办？

这个是这题最关键的地方。

不能 IM 一到就直接切。

因为 IM 可能已经提前拿到真实消息，但此时：

SSE 还有最后几个 chunk 没展示；
messageQueue 里还有待渲染节点；
打字机还在播放；
当前卡片 isRendering=true。

如果这个时候直接把 SSE 假消息删掉切成 IM，用户就可能看到打字动画突然跳完、内容闪烁、卡片重挂载甚至顺序变化。

所以你们的 merge 逻辑是：只要还没有满足“可切 IM”的条件，UI 就继续优先展示 SSE 版本。

具体来说，IM 真消息作为 baseImMsgs，然后遍历 SSE 消息。如果发现相同 serverId，不是删除 SSE，而是在原位置 splice，让当前 SSE 版本覆盖 IM 版本：

const foundIndex = mergedArray.findIndex(
m => m.serverId === item.serverId
);

if (foundIndex >= 0) {
mergedArray.splice(foundIndex, 1, item);
}

也就是说：

IM 可以先到数据层，但在流式没展示完之前，UI 仍然使用 SSE 那个版本。

只有满足三个核心条件以后才允许切：

当前所有 sseMessageList 中的 SSE 消息，都能在 IM 列表里找到相同 serverId；
messageQueue.length === 0，没有等待展示的流式消息；
!isRendering，当前没有 SSE 卡片还在打字或播放。

然后才执行：

setImMessageReady();

最后允许 applyToMsgArr() 直接返回真正的 IM 列表。

所以这句话你可以直接记：

IM ready 是数据 ready，SSE render finish 是 UI ready；两个都 ready 才切。

5. 如果反过来，SSE 已经完成了，但 IM 还没到呢？

那就继续展示 SSE 假消息。

这也是 SSE 存在的意义。不能说：

SSE close 了，所以我把临时消息删掉，等 IM。

否则就会出现一段空窗期。

当前逻辑只有在所有 SSE 消息都已经能在 IM 中找到对应 serverId 后，才能认定 IM ready。只要 IM 还没同步回来，就继续把 SSE 临时消息合在最终展示数组里。

所以：

SSE 完成
IM 未到
↓
继续显示 SSE 最终结果
↓
等待 IM upsert
↓
IM 身份全部对齐
↓
再切换

用户看到的内容不会消失。

6. 如果 IM 只回来一部分怎么办？

这个在 Top1 首屏链路里体现得非常明显。

SseMessageRecord.applyToMsgArr() 有三种情况：

IM 完全没回来：直接显示本地 SSE 假消息；
IM 完整同步：切真实 IM；
IM 只同步了一部分：通过 mergeImMsgsToHttpMsgs 把真消息和剩余假消息合起来。

所以它不是二元状态：

SSE 或 IM

中间实际上还有一个：

SSE + 部分 IM 混合态

目的就是保证列表始终连续。

7. 为什么替换的时候不容易闪？

因为你们不是：

删除 SSE 消息
↓
插入一条新的 IM 消息

而是尽量保持同一个数组位置和稳定 key。

同 serverId 时使用 splice(foundIndex, 1, item) 原位置替换；列表 key 对 33333 等消息优先使用稳定 serverId，其他消息则会优先考虑 FrontMsgId、再退到 MessageId。这样 React/Lynx 更倾向于认为“同一个 item 的 props 发生变化”，而不是整个组件卸载重建。

因此如果线上出现真假消息切换闪烁，首先应该排查：

serverId 是否一致
FrontMsgId 是否一致
MessageId 是否一致
list key 是否在切换过程中变化

而不是先去组件里写：

if (sameText) return null; 8. SSE 和 IM 内容不一致，到底以谁为准？

这个问题建议回答得非常明确：

正常链路最终以 IM 真消息为准。

因为 SSE 是实时展示态，IM 是服务端最终持久化态。IM 承担的是历史消息、刷新恢复、跨端同步以及最终会话事实，所以在确认身份对齐、SSE 队列已经消费完成后，会清理本地 SSE 临时消息，最终直接展示 IM 列表。项目资料也明确把真 IM 定义为“最终应以它为准”。

但这里还有一层要讲清楚：

“最终以 IM 为准”不等于“IM 一到就立刻以 IM 为准”。

时间上可能是：

t1：SSE 正在展示 ABC
t2：IM 已经拿到最终 ABCDEF
t3：SSE 还在播放 DEF

此时数据事实层虽然 IM 已经更完整，但 UI 仍然继续展示 SSE，避免瞬间跳到最终内容。等 SSE 渲染完成后，再切到 IM。

因此是：

展示过程以 SSE 连续性优先，最终状态以 IM 权威性优先。

9. 那如果 SSE 和 IM 真正发生内容冲突呢？

比如 SSE 最终展示：

建议服用 A

而 IM 真消息却是：

建议服用 B

如果它们通过 serverId / FrontMsgId 已经确认是同一条业务消息，那么正常收敛以后应该显示 IM 的 B，而不是长期保留 SSE 的 A。

这意味着真正的内容不一致应该被认为是服务端流式输出和最终落库之间的一致性异常，而不是前端通过比较文本来决定谁对谁错。前端的职责主要是：

先用身份字段确认是不是同一条消息；
流式期间保证 UI 连续；
最终切 IM；
如果必要，上报 SSE/IM 内容不一致监控。

这里第 4 点属于合理的工程增强；项目资料明确体现的是最终以 IM 收敛，没有体现你们已经做了完整的 content diff 告警，所以面试时不要说成已有功能。

10. IM 初始化失败又怎么办？

这是正常规则的异常分支。

如果进入 imInitFallbackToSseOnly=true，就意味着前端当前没有一个可靠的 IM 数据源。这时反而必须禁止切 IM，继续使用本地 SSE 消息作为展示源，否则一个空的、旧的或不完整的 IM 列表可能把当前正常的 SSE 内容覆盖掉。

所以正常状态：

SSE 临时态
↓
IM 最终态

fallback 状态：

SSE 临时态
↓
继续 SSE-only
X
不允许误切到异常 IM

如果面试现场回答，我建议压成这一版：

“我们不会按文本内容做 SSE 假消息和 IM 真消息去重，因为流式阶段和最终落库阶段的 content 本来就可能不一样，而且不同消息也可能有相同文本。我们主要依赖稳定身份字段。Top1 首屏 39998 主要用 FrontMsgId 判断是不是同一批消息；用户发送侧有前端生成的 key、localCustomExt.sse_key、服务端返回的 client_message_id/server_message_id；后续 AI 通用 SSE 回复主要通过 message_id/server_message_id 映射成 serverId，再和 IM 真消息对齐。”

“时序上也不是 IM 一到就切。如果 IM 先到了，但 SSE 还没播放完，我们仍然让 SSE 版本在当前数组位置覆盖 IM 版本。只有当前所有 SSE 消息都能在 IM 里找到相同 serverId，同时 messageQueue 已经清空、isRendering=false，才把 IM 标成 ready，然后切到真实 IM 列表。”

“反过来如果 SSE 已经结束但 IM 还没到，就继续显示 SSE 最终结果，不能先把假消息清掉；如果 IM 只同步了一部分，就真假消息合并展示。等 IM 完整同步后才最终切换。因此整个生命周期是 fake → mixed → real，而不是收到真消息就粗暴替换。”

“如果 SSE 和 IM 内容不一致，正常链路最终以 IM 真消息为准，因为 SSE 是实时展示态，IM 是最终服务端持久化事实。但为了用户体验，IM 即使提前到了，也不会打断正在进行的 SSE 渲染。可以理解成：展示阶段以 SSE 的连续性优先，最终状态以 IM 的权威性优先。”

**“我们不是做文本去重，而是在做消息身份对齐；也不是 IM 一到就切，而是身份完全对齐 + SSE 队列消费完 + 渲染结束之后，才从 fake 安全收敛到 real。”**

## 6. IM 初始化失败以后，你们为什么还能继续聊天？SSE-only 降级具体怎么设计？

**IM 初始化失败以后还能继续聊天，是因为在 SSE 模式下，“发送文本消息”和“前端 IM SDK 初始化成功”并不是同一个依赖。 前端 IM 初始化失败，代表当前拿不到可靠的 IM 历史/订阅数据，但文本发送本身走的是 chat_sse 后端接口；只要还保留 conv_id 等基础会话上下文，就可以继续发文本、接 SSE 回复。**

你们做的 SSE-only，本质上就是把系统从正常的：

```
SSE 实时展示
   ↓
IM 最终收敛

临时降级成：

SSE 发送
   ↓
SSE 接收
   ↓
本地消息队列维持当前页面
   ↓
暂时禁止切 IM
```

而不是让整个页面因为 IM 初始化失败直接不可用。

1. IM 初始化失败以后，为什么还能继续发消息？

正常情况下 `sendTextMsg` 会检查会话加载状态。如果 loadConvStatus === -1，原来的逻辑会认为 IM 会话加载失败，从而不允许继续发送。

增加了一个非常明确的状态：`pageWidgetState.imInitFallbackToSseOnly`

只有满足 Top1 SSE 实验 + TT 容器，IM 初始化失败后才设置它。失败时会调用 `loadConversationHelper`，不再依赖完整 IM conversation 初始化，但保留 `convId / userInfo` 等后续 SSE 请求需要的基础上下文，同时发出 MainConvLoaded，把页面 loading 正常收掉。

然后发送入口增加：

```
status === -1 &&
useSSE &&
imInitFallbackToSseOnly
```

这个特殊分支，继续调用 `sendTextHelper`。也就是说，只有明确进入 SSE-only 的文本链路才突破 IM 失败态，普通 IM 场景不会被一起放开。

2. 为什么一定要保留本地消息队列？

因为这时候 IM 已经不是一个可靠的数据源。

假设用户已经通过 SSE 看到了：

```
用户：我最近总是头疼
AI：头疼可能与睡眠、压力……
```

但是 IM 初始化失败以后，IM 消息数组可能是：

```
[]
```

或者只有旧历史。

如果原来的合并逻辑继续执行：

```
SSE 展示
↓
尝试切 IM
↓
用 IM 列表覆盖
```

那么刚刚明明已经展示出来的 SSE 内容反而可能被空的、旧的、不完整的 IM 列表覆盖掉。

所以 fallback 下，你们明确禁止三件事：

```
setImMessageReady
trySwitchToImData
clearLocalSseMessage
```

也就是不允许宣布“IM 已经 ready”，不允许切回 IM，更不允许把本地 SSE 消息清掉。

因此此时：

```
sseMessageList     已经完成/正在展示的 SSE
messageQueue       等待展示的 SSE
userSendTailMsg    用户本地假消息
this.msgs          当前已经合并好的列表
```

这些本地状态实际上暂时承担了当前页面的消息源职责。

这就是“为什么本地队列一定要保留”的答案：不是为了缓存优化，而是为了在失去可靠 IM source of truth 的时候，不让当前已经可用的 SSE 会话被错误的数据源覆盖。

3. 用户点击发送后，本地假消息怎么处理？

用户点发送以后，不能等服务端返回再显示右侧气泡，否则体验会非常迟钝。

所以 SSE 发送链路会立即构造 `userSendTailMsg`，先把用户自己的消息插到当前列表：

```
用户点击发送
   ↓
前端立即生成 userSendTailMsg
   ↓
右侧用户气泡立即出现
   ↓
chat_sse 请求发送
```

服务端随后通过 `SEND_USER_MSG` 返回 `client_message_id / server_message_id`。因此同一条用户消息可能依次出现：

```
本地用户假消息
↓
SEND_USER_MSG ack
↓
SSE proto 中的用户消息
↓
后续 IM 真用户消息
```

如果不做身份对齐，就会出现两个甚至三个一样的用户气泡。
**“乐观更新产生的临时对象，怎么和服务端返回的正式对象对齐。”**

4. 用户假消息怎么去重？

不能只看 serverId，原因跟上一题一样：本地消息刚生成的时候，正式 serverId 可能根本还没有。

所以你们会综合判断：

```
MessageId
FrontMsgId
localCustomExt.sse_key
userSendTailMsg.serverId
```

只要能确认 `sourceMsgs` 里已经存在当前这条用户消息，就把 `userSendTailMsg` 清掉，不再重复 append。

这在 SSE-only 下尤其重要，因为正常模式重复消息可能很快被 IM 真列表收敛掉，而 SSE-only 暂时没有 IM 帮你“最终纠正”，本地错误会一直留在页面上。

5. 为什么还要重算 localCustomExt？

SSE-only 以后，最终展示列表已经不是一个单纯的 IM 数组，而是：

```
已有消息 + 用户本地假消息 + 已渲染 SSE + 待渲染 SSE
```

重新 merge 出来的。

但是 index / maxIndex / latterNoUserMsg 这些属性决定了：

```
谁是最后一条消息
谁能展示 RS
谁能展示反馈
谁后面已经有用户追问
```

如果只把数组拼起来却不重新计算这些状态，原来的 39998 Top1 卡可能仍然认为自己是最新消息，于是用户已经聊了好几轮，它下面还挂着旧 RS。

所以每次 SSE-only 得到最终展示数组后，又重新跑：

```
setLocalExt
→ syncExtToLocalCustomExt
→ processMessageList
```

重新计算列表语义。

5. chat_sse 请求成功，但是 IM 还是没 ready，怎么办？

这个状态完全可以存在。

因为前端 IM SDK 初始化失败和chat_sse 服务端成功收到消息是两个不同链路。

文本消息仍然通过 chat_sse 携带：

```
conv_id
message_content
message_ext
```

发给服务端。如果服务端接收成功，会通过 SSE 返回 `client_message_id / server_message_id`，前端就可以确认当前用户消息已经被服务端接收，并继续接 AI 的 SSE 回复。服务端还可能通过 `legacy_im_proto` 下发可以转换成 IMMessage 形态的数据，因此即使前端 IM SDK 此刻坏了，当前页面仍然可以维持完整的问答展示。

所以：chat_sse 成功 ≠ 前端 IM ready。也不要求两者同步。当前页面先依赖 SSE 继续运行即可。

7. 那是不是 chat_sse 成功，就说明消息一定保存成功了？

SSE-only 解决的是当前页面可用性，不等于提供新的持久化消息系统。

如果服务端最终成功把消息写入 IM，那么之后恢复 IM、重新进页面、跨端查看时，历史消息依然可以恢复。

但如果：

```
postSSEMessage 建链失败
或者
没有收到 SEND_USER_MSG ack
或者
服务端最终没有成功落 IM
```

那就不能认为消息已经持久化。

所以 SSE-only 的定位一定要说准：

它解决“当前页还能不能继续聊”，不替代 IM 的持久化职责。

8. 为什么只允许文字，不允许图片/文件？

因为文字在 SSE 模式下可以直接走 chat_sse。

但是图片/文件并不只是发送一个字符串，它还依赖：

```
上传
文件消息构造
IM/文件相关链路
```

所以你们没有为了降级而绕过原来的图片发送链路。

项目资料明确写的是：SSE-only 只放行文本，图片和文件依然依赖 IM 上传能力。

这是一个比较好的故障隔离设计，因为降级不是“什么都强行能用”，而是只保住能够保证语义正确的最小能力。

9. 刷新页面以后怎么恢复？

这里一定要说准确：SSE-only 的本地消息队列主要解决的是当前页面生命周期内的可用性，项目资料没有体现把后续 SSE-only 的整个消息队列持久化到本地存储、刷新后原样恢复。

所以不能说：

“刷新以后从本地队列恢复。”

这不准确。

真正的恢复能力仍然依赖服务端有没有成功把消息写进 IM。项目资料明确写了：当前页展示可以靠 SSE 本地队列兜底，但最终历史恢复和跨端一致性仍依赖服务端 IM 持久化。

因此刷新后的情况应该理解成：

```
SSE-only 当前页面
↓
服务端最终成功写 IM
↓
用户刷新/重新进入
↓
重新初始化会话
↓
IM 能正常加载
↓
从 IM 历史恢复
```

如果刷新以后 IM 仍然初始化失败，而且那几轮消息又没有成功落到服务端 IM，那么仅靠之前内存里的 messageQueue / this.msgs 是恢复不了的。

10. IM 后续恢复以后，怎么重新对齐？

正常链路里，一旦 IM 初始化成功，成功分支会：

```
loadConvStatus = 2;
imInitFallbackToSseOnly = false;
```

也就是说系统退出 SSE-only。

fallback 开关关闭以后，之前被禁止的 SSE → IM 收敛逻辑重新生效。

合并层会检查：

```
const imServerIds = new Set(
  msgs.map(m => m.serverId)
);
```

然后判断当前所有 sseMessageList 中的消息是不是都能在 IM 真列表找到对应 serverId。只有：

所有 SSE serverId 都能在 IM 中找到
&& messageQueue.length === 0
&& !isRendering

才调用 setImMessageReady()，然后允许切回真正的 IM 列表。

所以不是：

```
IM 好了
→ 立刻把 SSE 扔掉
```

而是：

```
IM 恢复
→ 退出 fallback
→ 获取真实 IM
→ serverId 对齐
→ 等 SSE queue 清空
→ 等当前渲染完成
→ 切 IM
→ 再清本地 SSE 状态
```

这和上一题的 fake → real 收敛逻辑是一致的。

不过这里也有一个项目事实边界：现有资料能确认“IM 初始化成功时会退出 fallback，并恢复正常对齐逻辑”，但没有明确体现 fallback 之后存在一个独立的后台自动重连机制，持续自动尝试恢复 IM。 所以面试时不要主动说“我们会后台自动重连 IM，恢复后无感切换”，除非你还有其他项目资料能证明这一点。

更稳妥的说法是：

“当后续页面重新初始化/重新加载 IM 并成功后，我们会清掉 fallback 状态，再按正常的 serverId 对齐条件切回 IM。”

### 总结

“IM 初始化失败以后还能继续聊天，是因为在我们的 SSE 模式里，文本发送本身走 chat_sse，不是直接依赖前端 IM SDK。Top1 SSE + TT 下如果 initConversation 失败，我们会保留 convId 等基础上下文，设置 imInitFallbackToSseOnly=true，把页面 loading 正常结束，并且只在这个状态下放行 status=-1 的文本发送。”

“渲染上最重要的是不能再把 IM 当可靠数据源，所以 fallback 下会禁止 setImMessageReady、trySwitchToImData 和 clearLocalSseMessage，保留用户本地假消息、已经生成的 SSE 消息和待渲染队列。用户发送后先生成 userSendTailMsg，服务端再通过 SEND_USER_MSG 返回 client/server message id，我们结合 MessageId、FrontMsgId、sse_key、serverId 做去重，避免连续发送出现重复用户气泡。”

“另外 SSE-only 下每轮 merge 后还要重新算 localCustomExt，因为 index/maxIndex、latterNoUserMsg 会决定历史 39998 是否还显示 RS。这个降级只保证当前页的文本问答可用，不替代 IM 持久化；刷新后的历史恢复仍依赖服务端是否成功把消息落进 IM。”

“等后续 IM 初始化真正成功后，就清掉 fallback，重新走正常 SSE/IM 对齐：确认 SSE 消息都能按 serverId 在 IM 列表中找到，同时队列为空、当前没有流式渲染，才安全切回 IM 真消息。因此这个方案的核心不是‘IM 挂了以后永远只用 SSE’，而是当前页先保可用，最终仍尽可能收敛回 IM。”

**SSE-only 是“可用性降级”，不是“持久化降级”：当前页靠 SSE + 本地队列继续聊，最终历史一致性仍然依赖 IM。**

> 项目资料没有体现“进入 SSE-only 后，当前页面会自动后台不断重试 IM，成功后自动恢复”。
> 当前这次 IM 初始化失败后，就进入 SSE-only，并且在 fallback 状态持续期间不允许切 IM。之后如果因为重新加载会话、刷新页面、重新初始化等原因，IM 初始化成功了，那么 fallback 会被清除，系统再恢复正常的 SSE/IM 对齐和切换逻辑。

## 7. 为什么会出现重复消息、旧消息覆盖新消息、历史推荐组件误展示？你们所谓的“状态重算”具体是什么？

这三个问题其实要分开看。所谓的“状态重算”也不是重新请求服务端，更不是 React 的 setState，而是：**消息数组经过 SSE-only 合并以后，根据“新的最终消息顺序”，重新计算每条消息的前端派生展示状态 `localCustomExt`。**

先看为什么会出现重复消息。

用户点击发送后，为了即时上屏，前端先放一条 `userSendTailMsg`。随后服务端的 `SEND_USER_MSG`、SSE proto，甚至之后的 IM 真消息，都可能再次携带这条用户消息。于是同一条业务消息可能同时存在于 `userSendTailMsg`、`sourceMsgs`、`sseMessageList` 这些不同数据源里。

比如当前页面已经有“我头疼”这个本地用户气泡，过一会儿服务端又返回了正式的“我头疼”。如果 merge 时只是简单把它 append 进去，最终列表自然就会出现两条“我头疼”。

所以这里要先做身份去重：判断 `sourceMsgs` 里面是不是已经存在当前发送的这条用户消息。如果已经存在，就把 `userSendTailMsg` 清掉；不存在才把本地假消息补进去。项目里这个判断不是靠文本，而是结合 `MessageId、FrontMsgId、sse_key、serverId` 等身份字段。

第二个问题，“旧消息覆盖新消息”到底是什么意思。

这里不是说一条旧 AI 文本把新 AI 文本内容改回去了，而是说：旧的、不完整的 IM 消息数组把已经在 SSE-only 本地维护出来的新列表覆盖掉。

举个实际状态。IM 初始化失败的时候，假设 IM 数据源里只有最开始的 Top1 消息 A；但用户已经通过 SSE-only 又进行了两轮聊天，现在页面本地维护的是 A、用户 B、AI C、用户 D、AI E。

这时候如果某次 `applyToMsgArr` 又拿 IM 的 msgs 作为基础数据源，而 msgs 仍然只有 A，那么如果你直接：

“新的最终列表 = msgs”

页面就会从 A、B、C、D、E 突然退回成只有 A。

所以这才叫“旧数据覆盖新数据”。

因此 SSE-only 下有一个非常重要的区别：正常模式可以把 IM msgs 作为主要数据源；但 fallback 模式如果 this.msgs 已经有当前页面维护出来的最新结果，就优先继续以 this.msgs 作为 sourceMsgs。代码里的核心思想就是：`renderSseOnly && this.msgs?.length ? this.msgs : msgs`

也就是说，fallback 期间本地已经维护出来的新消息不能再被一个不可靠的 IM snapshot 覆盖。

这也是为什么 SSE-only 期间还要禁止 `setImMessageReady`、禁止切 IM、禁止 `clearLocalSseMessage`。否则你前面辛辛苦苦通过 SSE 保存的最新页面状态，又可能被一个空的、旧的、不完整的 IM 列表清掉。项目资料明确把这个风险描述为“不完整 IM 数据覆盖本地 SSE 结果”。

第三个问题，“历史推荐组件为什么会误展示”，这个最能解释什么叫“状态重算”。

假设用户刚进入 Top1 页面时只有一条 39998：

A：AI 首屏回答 + RS 推荐追问

因为 A 是当前最后一条消息，所以它的 localCustomExt 可能是：

```
index = 0
maxIndex = 0
```

因此 index === maxIndex，它被认为是最后一条消息，可以展示 RS、反馈等底部操作。

然后用户继续聊天，现在列表已经变成：

```
A：Top1 39998
B：用户“详细解答”
C：新的 AI 回复
```

现在 A 显然已经不是最后一条消息了。

正确状态应该变成：

```
A 的 index = 0，maxIndex = 2
B 的 index = 1，maxIndex = 2
C 的 index = 2，maxIndex = 2
```

于是 A 不再满足“我是最后一条”的条件，它下面的 RS 就应该隐藏。

问题就在于：SSE-only 是前端自己把 A + B + C merge 出来的。如果你只是把数组拼完，却没有重新计算 A 的 `localCustomExt`，A 里面可能仍然保留着之前的 index=0,maxIndex=0。

于是虽然真实数组已经是三条消息了，A 自己还以为：

```
“我是第 0 条，总共最后一条也是第 0 条，所以我还是最后一条。”
```

结果历史 Top1 卡下面的 RS、反馈、推荐追问就继续显示了。

这就是所谓的历史推荐组件误展示。

所以“状态重算”具体做的事情，就是当 SSE-only 得到最终展示数组之后，再完整跑一次正常消息处理链：

```
setLocalExt → syncExtToLocalCustomExt → processMessageList
```

这三个步骤可以这么理解。

`setLocalExt` 首先重新从消息的 `content/ext` 中解析出前端组件真正消费的数据，比如 `payload` 等。

`syncExtToLocalCustomExt` 会重新同步 r`elatedQuery、feedback` 等业务字段，同时最重要的是根据当前最终数组的位置重新写入：

```
localCustomExt.index = index
localCustomExt.maxIndex = messageList.length - 1
```

最后的 `processMessageList` 还会根据整个消息列表重新做顺序相关的计算，例如逆序扫描用户消息，重新计算 `lastUserMsg、latterNoUserMsg` 等状态。`latterNoUserMsg` 本质上也是一种依赖消息前后关系的派生状态，不能沿用旧列表计算出来的值。

所以你可以把整个问题理解成两层：

第一层是数据正确性：哪些消息应该存在？
这里解决重复消息、旧 IM 覆盖新 SSE，靠的是消息身份去重、本地队列保留以及正确的数据源优先级。

第二层是展示语义正确性：这些消息存在以后，谁是最后一条？谁后面已经有用户追问？谁还能展示 RS？
这里解决的就是 localCustomExt 状态重算。

### 总结

“IM 初始化失败以后，我们的最终消息列表不再是单一 IM source，而是**本地用户假消息、已渲染 SSE、待渲染 SSE 和已有消息 merge 出来的**。这就带来两个问题：第一，同一条用户消息可能同时出现在本地假消息和服务端返回消息中，所以要通过 `MessageId、FrontMsgId、sse_key、serverId` 做身份去重；第二，fallback 期间 IM 数据可能是空的或者旧的，所以不能再让它覆盖本地已经更新过的 SSE 列表，而是优先保留本地 this.msgs。”

“另外 merge 完以后，消息的相对位置已经变了。比如原来的 39998 是最后一条，用户继续追问之后它就不应该再展示 RS。如果还保留旧的 `index/maxIndex/latterNoUserMsg`，历史卡就会误以为自己还是最后一条。所以我们会重新执行 `setLocalExt、syncExtToLocalCustomExt、processMessageList`，基于最终列表重新计算每条消息的 `index、maxIndex`、后续是否还有用户消息等派生展示状态。这个就是我们说的‘状态重算’。”

**去重解决“列表里到底有哪些消息”，状态重算解决“这些消息现在分别是什么展示身份”。**

### 补充

非 SSE-only 当然也要计算 `index/maxIndex/latterNoUerMsg`。真正的区别是：

正常模式是“先得到最终 IM 列表，再跑标准消息处理”；SSE-only 是“标准处理完以后，又在 operator 层额外拼出了一份新的最终列表”，所以前面算出来的状态失效了，必须补算一次。

你可以把它拆成两条链路看。

正常非 SSE-only 下，IM 给你一份最新消息列表，例如原来是 A，用户追问之后 IM 更新成 A、B、C。这个新的 A、B、C 会正常经过 `MessageFormat / processor，syncExtToLocalCustomExt` 根据这份最新完整列表计算：

```
A：index=0, maxIndex=2
B：index=1, maxIndex=2
C：index=2, maxIndex=2
```

所以正常链路本身就会随着 IM 消息列表更新重新算 `localCustomExt`。项目资料也明确写的是“`正常 IM 链路 → IM 消息列表更新 → MessageFormat 重新计算 localCustomExt`”。

关键在 SSE-only。

假设 IM 初始化失败之前，processor 最后处理过的 IM 列表只有 A。当时它算出来：

```
A：index=0, maxIndex=0
```

然后 IM 挂了。

用户通过 SSE-only 又发送了 B，并收到 AI 回复 C。**但 B、C 没有通过正常 IM 列表更新这条链路进入 processor**，而是 SSE operator 自己拿：

```
已有的 A + 本地用户消息 B + SSE 回复 C
```

重新 merge 成 A、B、C。项目代码确实是在 SSE operator 中自己把 `baseImMsgs、sseMessageList、messageQueue` 合成新的 `mergedArray`。

问题就在这里：

A 身上的 localCustomExt 是之前处理 [A] 时算出来的。

现在你只是把 B、C 拼到了它后面，A 对象不会神奇地知道列表长度从 1 变成 3。

所以它可能仍然是：

```
A：index=0, maxIndex=0 ← 旧状态
B：新加入
C：新加入
```

于是必须针对operator 拼出来的新数组 A、B、C，再额外执行一次：

```
setLocalExt → syncExtToLocalCustomExt → processMessageList
```

把 A 更新成：

```
A：index=0, maxIndex=2
```

这就是 SSE-only 为什么专门增加 `refreshRenderSseOnlyLocalExt()`。而且这个函数明确只有 `shouldRenderSseOnly()` 为 true 才执行；正常模式直接原样返回。

两种模式最终都需要计算这些值，区别只是“谁负责算、什么时候算”。

正常模式：

```
IM 返回最新完整列表 → 标准 processor 根据最新列表自动重算 → 展示。
```

SSE-only：

```
IM 不再提供最新完整列表 → 标准 processor 之前算的是旧列表 → SSE operator 自己增加/合并消息 → 列表结构发生变化 → operator 必须主动再跑一次 processor 逻辑进行补偿重算。
```

这也是为什么它叫“状态重算”而不是说 SSE-only 发明了一套新的状态。

举最简单的例子：

正常模式最初 [A]，processor 算 A 的 `maxIndex=0`。后来 IM 真正更新成 [A,B,C]，processor 再跑一次，自然把 A 的 `maxIndex` 改成 2。

SSE-only 最初也处理过 [A]，A 的 `maxIndex=0`。但之后 IM 挂了，所以不会再收到一份正常的 [A,B,C] 去触发那次标准重算。SSE operator 只是自己把 [A] + [B,C] 拼成 [A,B,C]。数组变了，但 A 身上之前算好的派生字段没自动变。 所以才需要手动再跑一次。

“正常情况下 `localCustomExt` 本来就会随着 IM 最新消息列表经过 `MessageFormat` 自动重算；SSE-only 的特殊之处是 IM 不再持续提供最新列表，而是 SSE operator 在 processor 之后自己又 merge 出了一份新的展示数组，所以原来基于旧数组计算的 `index/maxIndex` 等派生状态已经过期，需要针对 merge 后的新数组补跑一次标准消息处理逻辑。”

## 8. IM 什么时候初始化”“IM 真消息什么时候产生”“什么时候切换展示”

1. IM 其实很早就初始化了，不是等 AI 回答完才去“拉一次 IM”

用户进入页面以后，首屏 SSE 和 IM 初始化是并行的。

Top1 首屏为了快，`startupSse` 会先造 39998 假消息直接上屏，这时候 IM 甚至还没 ready。与此同时后台会执行 `initImSdk → loadConversationImpl → dataProxy.initConversation`。

而 `initConversation` 里面非常关键的一步是：

```
this.initMessageUpsertListener();
const firstData = await this.getMessagesByConversationId(params.limit);
```

也就是说，IM 初始化以后会先建立**消息 upsert 监听**，然后再拉已有消息。**后续服务端只要有新的 IM 消息写入，当前页面就可以通过这个监听收到，而不是每次 AI 回答结束后前端再主动发 HTTP 请求“查一下有没有 IM”。**
Top1 SSE 首次进入还有一个特殊点：`msgLimit` 通常会设为 0，因为首屏已经由 HTTP/SSE 直出了，不需要为了首屏再拉历史消息。但是 `initConversation` 和消息监听仍然会建立。

所以你可以理解成：页面打开时：SSE 抢首屏，同时 IM 在后台建立会话和订阅。

2. 那 AI 正在 SSE 流式回答时，IM 在干嘛？

假设用户问：“我最近总头疼怎么办？”

前端马上通过 SSE 显示：

```
“头疼可能……”

“头疼可能和睡眠……”

“头疼可能和睡眠、压力有关……”
```

这个过程中展示的是 SSE 临时消息。

与此同时服务端那边并不是只发 SSE、不管 IM。等一条业务消息达到服务端可以持久化的阶段以后，会把正式消息写进 IM。**然后已经初始化好的 IM SDK 通过 upsert/消息接收机制拿到这条真消息。项目资料明确描述的是：服务端写入 IM 后，前端通过 IM 历史或 upsert 获取真消息。**

收到新的 IM 数据以后，大致会经过：

```
LotusIMManager.onMessagesReceive → 消息数组更新 → msgArrPatchFunc → MsgArrChange → useMsgList 重新渲染。
```

所以不是：AI SSE 完成 → 前端主动请求 IM → 替换。

而更接近：SSE 在实时推；IM SDK 同时一直监听；服务端什么时候把正式消息写进 IM，前端什么时候就可能收到 IM 更新。

3. 所以 IM 真消息甚至可能比 SSE 展示结束更早到？

完全可能。

比如时间顺序可能是：

```
t1：SSE 已经展示到“头疼可能和睡眠……”

t2：服务端已经把完整回答写进 IM，IM SDK 收到真消息

t3：前端打字机还在继续把 SSE 内容播放完

t4：SSE 的 messageQueue 清空、打字结束
```

这时候虽然 t2 时刻 IM 真消息已经到了，前端也不会立刻把 SSE 替掉。

因为那样用户正在看的流式动画会突然跳成完整答案。

所以你们会先让 SSE 继续作为当前展示版本。

4. 到底什么时候才真正从 SSE 切成 IM？

要同时满足三个主要条件：

第一，当前 SSE 产生的消息，都已经能在 IM 真消息数组里通过 serverId 找到对应项。

第二，`messageQueue.length === 0`，说明没有还没播放的 SSE 消息。

第三，`!isRendering`，说明当前打字机/流式卡片已经不在渲染中。

然后才调用 `setImMessageReady()`，最终允许直接使用 IM 消息数组。

所以真正的关系是：IM 到了 ≠ 马上替换。

而是：IM 到了 + 身份全部对齐 + SSE 播放完成 → 才替换。

5. 如果 SSE 已经回答完了，但是 IM 还没同步过来呢？

那就继续显示 SSE 最终结果。

不会因为 SSE close 了就先把它删除，然后让用户等 IM。

比如 SSE 已经完整展示：“头疼可能与睡眠不足、压力等有关……”

但是 IM SDK 这时候还没有收到正式消息，那么前端继续保留这条 SSE 临时消息。

等 IM 真消息之后通过 upsert 到达，再做 serverId 对齐，满足切换条件之后才换成 IM。

所以 UI 不会出现一个“空窗期”。

6. 但 Top1 首屏 39998 又稍微特殊一点

用户刚从抖音 Top1 卡进来的第一条回答不是普通 chat_sse 回复，而是：

```
sse_info → 本地 39998 → get_greet_sse 继续补流
```

它一开始甚至就是搜索页带进来的假消息。

这条首屏消息后面还涉及 `tailInsertSseMsg`。也就是说，当用户真正继续追问时，会把当前首屏 SSE 状态收口，并把这批首屏消息同步/持久化到服务端 IM。

因此第一条 39998 可以理解成：

先用搜索带来的数据 + SSE 把答案展示完整；随后通过 `tailInsert` 等机制让它正式进入 IM；IM 真消息回来以后，再通过 `FrontMsgId` 对齐并切换。

而从第二轮开始，普通对话更多就是：

```
用户消息 → chat_sse → 33333 SSE 回复 → 服务端落 IM → IM upsert → serverId 对齐 → 切 IM。
```

7. 所以你可以把整个时序记成这样

```
用户进入 Top1 页面
→ 39998 假消息立即上屏
→ 首屏 SSE 流式补答案
```

与此同时

```
→ IM SDK 后台初始化
→ 建立 conversation
→ 注册 IM message upsert listener
```

用户继续追问

```
→ chat_sse
→ 本地用户消息上屏
→ AI 的 33333 SSE 回复不断更新
```

与此同时服务端

```
→ 用户消息/AI 最终消息写入 IM
→ IM SDK 收到 upsert
→ 前端拿到真 IM 消息
```

但此时不一定切

```
→ 先检查 SSE 消息是否全部有对应 IM serverId
→ 检查 messageQueue 是否为空
→ 检查是否已经停止渲染
→ 全满足后才切 IM
→ 清理 SSE 临时状态。
```

**“IM 不是 AI 回答完以后前端再主动去拉的，而是在页面初始化时就建立了 IM 会话和消息订阅；SSE 负责实时展示，服务端把最终消息写入 IM 后，前端通过 upsert 异步拿到真消息，但要等 SSE 自己播放完成并且真假消息全部对齐后，UI 才真正从 SSE 切到 IM。”**

# 三、React / 前端原理

## 8. SSE 高频更新为什么容易造成 React 高频渲染？你会怎么优化？

SSE 的问题在于，服务端会不断推送 chunk。假设一句回答拆成几百个 chunk，如果每收到一个 chunk 都立刻 setState，就会不断给 React 调度更新。每次更新都会进入 Fiber 的 Render 阶段，重新计算受影响组件的 Fiber、执行组件函数和 diff；有实际 DOM 变化时再进入 Commit 阶段更新宿主视图。**React 18 虽然有自动批处理，但 SSE chunk 是跨时间不断到达的，不是所有 chunk 都处在同一次同步事件里，所以不能指望 React 自动把整个流合成一次更新。**

而且 AI 聊天页面的成本通常不仅是“改几个字”。一条消息变化可能带动消息列表重新 render、Markdown 重新解析、卡片重新计算、自动滚动、布局计算，甚至图片和引用组件的状态变化。因此真正的问题是：模型可能每几毫秒产生一次数据，但屏幕根本没必要以这个频率刷新。

我的优化思路主要有三层。

第一层是降低 `setState` 的频率，不要一个 chunk 更新一次 React state。SSE callback 收到数据以后，先写到一个 buffer，比如 `useRef` 中，因为修改 ref 不会触发 render；然后通过 `requestAnimationFrame` 每帧最多提交一次，或者每 30～50ms 批量提交一次。这样可能 10 个 SSE chunk 最终只触发 1 次 React 更新。

例如：

```js
const bufferRef = useRef('');
const rafRef = useRef(null);

function onChunk(chunk) {
  bufferRef.current += chunk;

  if (rafRef.current) return;

  rafRef.current = requestAnimationFrame(() => {
    const text = bufferRef.current;
    bufferRef.current = '';

    setContent((prev) => prev + text);

    rafRef.current = null;
  });
}
```

这里的核心不是 `requestAnimationFrame` 本身，而是把“网络事件频率”和“UI 更新频率”解耦。SSE 可以每 5ms 来一次，但 React 最多按照屏幕刷新节奏提交，比如一帧一次。

第二层是缩小更新影响范围。不要把当前流式文本存在整个会话列表最顶层，然后每来一个 chunk 都重新生成整个 messages 数组，导致整个 `MessageList` 重新参与 render。

更合理的是把“正在流式生成的内容”尽量下沉到当前消息组件，例如当前正在生成的是 message C，就只让 C 的局部 state 更新。历史消息 A、B 本身没有变化，就尽量保持 props 引用稳定，再配合 `React.memo` 避免它们跟着重新执行。

所以可以理解成：

```
SSE 数据到达 → 当前消息局部 buffer → 批量提交当前消息 → 历史消息不动。
```

而不是：

```
SSE 数据到达 → 重建整个 messages → MessageList 全量更新 → 所有 MessageCard 都重新参与 render。
```

第三层才是 React.memo / useMemo / useCallback 这些 React 层优化。它们有用，但优先级其实低于前两个。先减少更新次数、缩小更新范围，再做 memo。

### 8.1 React.memo、useMemo、useCallback 分别有什么作用？

1. React.memo 是干什么的？

它是组件级优化。如果父组件重新 render，但某个子组件的新旧 props 浅比较没有变化，React 可以跳过这个子组件的函数执行。

例如历史消息：

```js
const MessageItem = React.memo(function MessageItem({ message }) {
  return <MessageCard message={message} />;
});
```

如果我更新的是最后一条流式消息，而前面的 message 对象引用都保持不变，那么历史 MessageItem 就可以 bailout。

但如果你每次 SSE 更新都这样：

```js
setMessages((prev) => prev.map((item) => ({ ...item })));
```

那所有 message 对象引用都变了。

即使内容没变：

```js
oldMessage !== newMessage;
```

React.memo 的浅比较还是会认为 props 变化，因此优化基本失效。

所以在消息列表场景里，保持未变化消息的对象引用稳定非常重要。

2. useMemo 是干什么的？

它缓存的是一个计算结果。

例如 Markdown 解析、复杂卡片数据转换很耗时：

```
const parsedContent = useMemo(
  () => parseMarkdown(message.content),
  [message.content]
);
```

只要 message.content 不变，就不用重复执行这个昂贵计算。

它解决的是：“组件已经 render 了，但某个计算没必要重新算。”

它不是用来阻止组件 render 的。

3. useCallback 是干什么的？

它缓存的是函数引用。

比如：

```js
const handleRetry = useCallback(() => {
  retryMessage(message.id);
}, [message.id]);
```

如果你直接：

```js
<MessageItem onRetry={() => retryMessage(message.id)} />
```

父组件每次 render 都会创建一个新函数，所以：

```js
oldOnRetry !== newOnRetry;
```

即使 MessageItem 被 React.memo 包住，也可能因为函数 props 变化导致 memo 失效。

所以 `useCallback` 本身通常不是为了“函数创建很耗性能”，而是为了保持传给 memo 子组件的函数引用稳定。

### 8.2 为什么它们解决不了消息 key 不稳定的问题？

“既然用了 React.memo，为什么还解决不了 message key 不稳定？”

因为这是两个完全不同层面的问题。

React.memo 解决的是：同一个 Fiber 对应的组件，要不要重新执行 render。

而 key 解决的是：React 认为前后两次到底是不是同一个 Fiber。

假设第一次：

```js
<Message key="fake_123" />
```

后来 SSE 假消息切 IM 真消息，变成：

```js
<Message key="server_456" />
```

即使它们业务上是同一条消息，React 看到 key 变了，会认为：旧的 fake_123 消失了，新的 server_456 出现了。

于是旧组件卸载，新组件重新挂载。

这时候 React.memo 根本没有发挥空间，因为 React 都不认为这是同一个组件实例了。

这也是为什么 SSE 假消息 → IM 真消息的时候，消息身份对齐和稳定 key 非常重要。

### 8.3 为什么不能用数组下标作为 message key？

因为聊天列表会插入、删除、假消息切真消息，位置会变化。

假设最开始：

```
A 的 index 是 0
B 的 index 是 1
C 的 index 是 2
```

如果中间插入一条 X：

```
A 还是 0
X 变成 1
B 变成 2
C 变成 3
```

如果用 index 当 key，那么原来 key=1 对应 B，现在却对应 X。React 会误以为：

“原来的那个组件还在，只是 props 变成 X 了。”

这样就可能导致组件内部 state、打字机状态、展开状态等跟错误消息绑定。

聊天场景尤其危险，因为 `MessageCard` 往往不是纯静态组件，里面可能有打字动画、图片加载状态、展开状态、反馈状态。

所以 message key 应该优先使用稳定的消息身份，例如 `serverId / FrontMsgId / MessageId`，核心原则就是：

同一条逻辑消息生命周期内 key 尽量不变，不同消息 key 一定不同。

> 如果 key 变了，是销毁重建；如果 key 没变但对应的数据变了，React 会复用原组件，这才会“错配”。

### 8.4 SSE callback 为什么容易出现闭包旧状态？

最常见的解决办法是函数式更新：

setContent(prev => prev + event.data);

因为这里不再依赖 callback 闭包里捕获的 content，React 会把当前最新 state 传给 prev。

如果 callback 里需要读取很多最新状态，但又不希望不断销毁、重建 SSE listener，也可以维护 ref：

const stateRef = useRef(state);

useEffect(() => {
stateRef.current = state;
}, [state]);

然后长生命周期 SSE callback 中读取 stateRef.current。

## 9. 图片跟随 SSE 流式消息渲染时，为什么容易闪烁、重复加载或者顺序变化？你具体怎么保证单图、多图稳定展示？

AI 回答不是一次性拿到完整的“文本 + 图片”，而是同一条 39998 消息不断收到 replace / append / new。文本可能先来，图片的 custom_view_list 后来；后续又继续来文本或者其他 custom view。因此一条消息对象会被反复更新。项目里图片本质上也是 SSE 消息 ext 中的 a:custom_view_list，不是独立的图片消息。

所以第一个风险是图片闪一下又没了。假设某次 SSE 数据里已经有图片 A，下一次 SSE replace 只带了新的文本，没有重新携带 A。如果前端像普通字段一样直接：

```
newExt = {
  ...oldExt,
  ...incomingExt
}
```

或者直接拿新的 custom_view_list 覆盖旧值，就可能把前一个 chunk 已经收到的图片信息覆盖掉。

你们首屏 `SseMessageRecord.replaceMsg` 对 `CustomViewList` 是特殊处理的：不是简单覆盖，而是把之前的和这次新下发的列表累加起来。也就是说，图片一旦随着流式消息进来了，后续只更新文本时不会把它弄丢。

所以这一点你可以说：

**“SSE 是增量协议，图片 ext 不能按照普通字段 last-write-wins，否则后续文本 chunk 可能把已经出现的图片覆盖掉，所以我们对 custom_view_list 做累计合并。”**

**第二个风险是图片组件不断卸载重建，从而闪烁或者重新请求 URL。**

这个和我们刚才讲的 React key 是一回事。SSE 每来一次，SseQaCard 都可能重新 render。如果同一张图片第一次的 key 是 A，下一次变成 B，React 会认为不是同一个节点，就会把原 Image 卸载，再挂一个新的 Image。图片组件重新挂载以后，就可能重新进入加载过程，于是用户看到图片闪一下或者重新加载。

你们这里**图片协议本身有稳定 ID**。Markdown 里面不是直接塞 URL，而是有类似 `blockview://multi-image-xxx` 的占位符，同时 `custom_view_list` 中有相同 id 的 item；渲染时自定义 view 使用 `id={item.id}`，让 Markdown 占位符和真实图片组件稳定关联。

多图内部更明确：

```js
{
  visibleImageList.map((image) => (
    <view key={image.id}>
      <Image src={image.src} />
    </view>
  ));
}
```

也就是说，同一张图片只要服务端 `image.id` 不变，ReactLynx 就可以识别这是之前那张图片，而不是新的图片节点。

**“图片稳定不仅依赖 URL，还依赖稳定的业务 ID。外层 custom view 用 item.id 和 Markdown blockview 对齐，多图内部用 image.id 作为 key，避免 SSE 更新时因为节点身份变化导致图片重新挂载。”**

第三个风险是多图顺序跳动。

假设这次收到：A、B

下一次收到：B、A、C

那即使三张图片完全一样，页面也会发生位置变化。

这个项目里图片顺序主要不是前端排序出来的，而是服务端协议已经确定顺序。PRD 定义的是优先按照 doc 中穴位名首次出现顺序；如果 doc 没有而 query 中有，则按照 query 出现顺序。前端拿到 image_list 后保持服务端数组顺序，只做：

```js
const visibleImageList = imageList.slice(0, 3);
```

也就是不重新 sort，只取前 3 张。

因此顺序稳定的核心其实是：**服务端生成稳定顺序 + 前端不二次排序 + image.id 保持节点身份。**

单图协议就是 type="image"，item.src 作为图片 URL，item.id 同时承担 blockview 对齐和图片身份。图片按照固定比例展示，点击以后把 [item.src] 传给 tt.previewImage。

多图协议是 type="multi_image"，里面有一个有序 image_list。前端首先判断它是不是真数组，而且为空就直接 return null，防止异常协议把整张 SSE 卡片搞崩；正常情况下只展示前 3 张，超过 3 张显示总数量。每张图片使用自己的 image.id 作为 key。

预览的时候却不是只把前三张传进去，而是：image_url_list = 完整 image_list

然后点击第二张时：current = 第二张 URL

因此页面只展示前三张，但进入预览以后可以继续左右滑看到所有图片。

还有两个小的稳定性处理也可以作为追问讲。

一个是异常数据兜底。 `custom_view_list` 是服务端 ext JSON，`image_list` 不一定百分百符合预期，所以不能直接 .map()，而是：

```js
const imageList = Array.isArray(item.image_list) ? item.image_list : [];

if (imageList.length === 0) {
  return null;
}
```

这样某个多图模块协议异常，最多不展示这个模块，不至于把整张 AI 回答卡片 render 崩。

另一个是图片点击用了 1000ms 防抖，避免连续点击多次拉起预览器、重复上报点击。

但是“重复图片”这里你要特别注意。

你们当前首屏 `replaceMsg` 对 `custom_view_list` 的代码实际上是：

```js
[...oldCustomViewList, ...newCustomViewList];
```

也就是追加，不是按 ID 去重。

所以如果面试官追问：

“如果服务端同一个 image/custom view 重复下发怎么办？”

“当前链路的核心前提还是服务端 custom view ID 和图片 ID 稳定，前端现有实现通过累计 custom_view_list 防止流式 replace 把已有图片覆盖掉，多图渲染则使用 image.id 保证 React 节点稳定。现有项目资料里没有看到一层通用的 custom view 去重；如果要进一步做健壮性，我会在累计时按 item.id 建 Map，相同 ID 做 merge/replace，新 ID 才 append，从协议层避免重复图片进入渲染列表。”

这个就属于通用改进方案，不要冒充现有实现。

### 总结

“图片跟随 SSE 最麻烦的是，同一条消息会不断 replace/append，文本和图片还可能不是同一个 chunk 到。如果每次直接覆盖 ext，后续文本更新可能把已经收到的图片覆盖掉；如果图片 ID 或 React key 不稳定，又会导致 Image 被卸载重挂，引发闪烁和重复加载；多图数组顺序变化还会造成图片跳位。

我们这里图片通过 custom_view_list 下发，首屏 SSE 合并时对这个字段做累计而不是简单覆盖，所以已经出现的图片不会被后续 chunk 丢掉。Markdown 里用 blockview ID 和 custom view 的 item.id 做位置映射，多图内部用稳定的 image.id 做 key。多图顺序由服务端按穴位在 doc/query 中的出现顺序确定，前端保持 image_list 原顺序，只取前 3 张展示，完整数组用于预览。另外对 image_list 做了类型和空数组兜底，避免异常协议导致整卡崩溃。”

**“所以稳定渲染主要解决四件事：流式更新不能丢图、同一张图身份不能变、多图顺序不能乱、异常图片数据不能拖垮整张消息卡。”**

# 四、Agent / 协议 / 全栈：AI 全栈面试很容易扩展

## 10. 你说健康服务 Agent 是通过“扩展服务端插件协议”实现的，具体扩展了什么？为什么不直接让前端根据一个 type 写死？健康服务 Agent 和普通插件为什么要互斥？

> 服务端返回的动态卡片协议怎么设计？
> 前端怎么做到可扩展渲染？
> 新增一种 Agent 卡片要不要改主流程？
> 信息透传是什么？
> 为什么多个入口最后必须收敛到统一发送出口？
> 不收敛会产生什么竞态和重复发送问题？

首先，所谓“扩展服务端插件协议”，并不是重新设计了一套完全独立的健康服务卡片协议，而是在原有 `ActionBar` 插件体系旁边新增了独立的 `health_service_plugins`。原来页面底部已经存在 `action_bar_plugins`，健康服务继续复用了它已有的 `description`、`icon`、`status`、`msg_content` 等字段和 `ActionBar` 渲染能力，但是给健康服务单独增加了业务身份和上下文，例如 `name=health_service_agent、sub_title、ext_params`。所以它既能复用现有插件基础设施，又不会把健康服务的策略、埋点和业务语义混进普通 `ActionBar`。

为什么不直接让前端写一个 `type=health_service_agent`，然后根据 type 把卡片内容写死？核心原因是健康服务属于“服务端需求推理和策略召回结果”，而不是一个固定前端功能。用户搜索“怎么减肥”时，服务端可能判断他的深层需求是运动计划、饮食计划或者热量管理；同一个 query 在不同 AB 实验和策略版本下，也可能召回不同内容甚至完全不召回。如果前端把“减脂计划”“睡眠计划”“饮食计划”分别写死，那每增加一种健康服务都要增加枚举、文案、点击行为并重新发版，实际上把本来应该快速迭代的服务端策略固化到了客户端。

因此这个协议更合理的边界是：服务端决定“给这个用户什么服务”，前端只负责“按照协议把它展示出来”。比如页面上可以显示“帮你制定减脂计划”，但用户点击以后真正发送给模型的内容不一定就是这几个字，而是服务端下发的 msg_content。也就是说，服务端不仅决定展示内容，还决定这个按钮对应的实际模型输入，前端没有必要知道这是减脂、睡眠还是孕期饮食，只要按照统一的插件协议消费即可。

这也解释了前端的“可扩展渲染”是怎么做的。健康服务并没有重新做一个和 ActionBar 平行的完整 UI 体系，而是直接复用已有 ActionBar，只是 BottomPlugin 根据状态选择传给它哪份 barList。如果当前应该展示健康服务，就把 `health_service_plugins` 交给 ActionBar；否则把普通 action_bar_plugins 交给它，因此原有的布局、滚动、曝光、点击防抖、键盘规避等能力都不需要再实现一次。

所以如果未来新增一个“睡眠改善计划”，并且它仍然属于同样的 ActionBar 交互形式，那么前端原则上不需要新增“SleepPlanComponent”，服务端直接在 `health_service_plugins` 里下发新的 `description`、`msg_content` 和 `ext_params` 即可。只有当未来出现一种完全不同的视觉或者交互形态时，前端才需要增加新的 renderer，但这仍然只是扩展渲染层，不应该重新复制一套 SSE、IM、消息 merge 和发送链路。这个项目里 33333 通用 SSE 卡片的 node_type 机制也是类似思想，例如健康服务相关提示增加了 node type 48 的 CalloutComponent，扩展的是节点 renderer，而不是修改整个 SSE 主流程。

接下来是健康服务 Agent 和普通插件为什么互斥。这个不能只回答“页面放不下”，真正原因是两者的业务生命周期不一样。健康服务 Agent 是首屏承接能力，目标是用户从 Top1 进入小程序以后、还没有真正开口聊天的时候，通过“生成减脂计划”“制定饮食方案”这种更明确的服务降低用户开口成本；普通 ActionBar 则属于常规会话阶段的功能入口。因此用户一旦已经发出第一条消息，健康服务作为“首次开口诱因”的使命就结束了，再继续挂着会干扰正常会话。PRD 本身也是希望健康服务单次会话只展示一次，用户互动后隐藏。

前端具体就是通过 `userSended` 和 `enter_position` 来控制。用户还没发消息，并且当前进入场景不是禁止展示健康服务的场景时，如果服务端又确实下发了 `health_service_plugins`，就优先展示健康服务 ActionBar；否则展示常规 `action_bar_plugins`。因此它们不是两个区域一起堆在底部，而是同一个 BottomPlugin 插槽里的两种模式。

互斥还有一个很重要的实验原因。健康服务本质是在验证一种新的“开口理由”，而原来的 RS、ActionBar 等本来就在争夺用户点击。如果健康服务和普通入口同时大量展示，你最终看到健康服务 CTR 很高，也不能说明它真正带来了新增对话，因为它可能只是从已有入口抢走了点击。你前面这个项目的数据也已经证明新增入口经常存在替换关系，所以前端至少要保证展示条件和埋点语义清晰，否则实验数据会很难归因。

然后是“信息透传”到底是什么。用户在页面上看到的是一个普通按钮，但服务端生成这个按钮的时候，实际上可能已经附带了很多策略上下文，比如它属于哪个健康计划、哪个召回策略、哪个实验组以及后续模型应该如何处理。因此用户点击以后，前端不能只发送页面上看到的文字，而是需要把服务端下发的 `msg_content` 和 `ext_params` 一起放到这条用户消息里，同时前端再补一个 `ActionBarId=health_service_agent`，标记这条消息具体来自哪个入口。

所谓“透传”的重点就是，前端不需要理解这些业务参数，更不应该自己重新生成它们，而是服务端第一次把上下文下发给前端，用户点击后前端再原样带回消息链路。这样模型或者后端收到消息以后，就能区分“用户手动输入了一句生成减脂计划”和“用户点击了服务端召回的健康服务 Agent”，这两者文本可能完全一样，但业务来源并不一样。数据侧也可以根据这些 ext 和独立 UTM、ActionBarId 把健康服务带来的曝光、点击和最终发消息串起来。

这里还有一个容易被问的点：为什么健康服务虽然在 UI 上和普通 RS 或推荐选项长得很像，却还要单独做埋点？因为视觉复用不代表业务语义相同。普通 RS 表示“推荐用户继续问什么”，健康服务表示“推荐用户启动一个健康服务任务”，因此项目里即使复用了 related recommendation 的展示能力，也会通过 `style=health_service_agent` 把它从普通 RS 统计中分流出去，使用健康服务自己的埋点和 agent_health_plan 归因。否则数据侧会把健康服务点击算进普通推荐追问，最终无法判断到底是哪种入口带来的对话。

最后，也是这题最重要的工程设计，就是为什么输入框、RS、详细解答、健康服务 Agent 等各种入口最终必须统一收敛到 `sendTextMsg`。因为“发送一条消息”在这个项目里从来不只是调一个接口，它背后还包括会话状态检查、`BeforeSendMsg`、Top1 首屏 39998 的 `tailInsert`、消息 ext 拼装、本地用户假消息、SSE/IM 发送分流、日志埋点以及发送后的页面状态更新。如果健康服务自己直接调 chat_sse，详细解答又写另一套发送函数，RS 再调用第三套，那么这些约束一定会有入口漏掉。

这个需求里的 `userSended` 就是最典型的例子。健康服务只应该在用户真正发送第一条消息之前展示，所以只要用户从任何地方发出了消息，`userSended` 都应该变成 true。如果你把 `setUserSended(true)` 写在健康服务按钮自己的 `onClick` 里，那么用户从输入框发消息时就不会更新；如果写在输入框里，用户点 RS 或详细解答又会漏。于是项目把这个状态变化下沉到 `sendTextMsg/sendFileMsg` 这种发送 root cause 上，只要任何入口复用统一发送链路，就天然触发 `userSended=true`，健康服务就能一致隐藏。

不统一发送出口，第一类问题就是重复发送。例如某个健康服务组件自己调用一次底层 `chat_sse`，外围通用 `ActionBar` 点击逻辑又触发了一次公共发送逻辑，那么用户点一次就可能产生两次请求。哪怕不是代码直接调用两次，不同入口各自维护 debounce、loading、disabled 状态，也可能出现一个入口已经处于发送中，另一个入口仍然可点，用户快速连续操作后发起两轮请求。

第二类问题是状态竞态。比如输入框自己的发送逻辑已经把当前用户消息插入本地列表，而健康服务又自己维护一套 optimistic message，那么同一轮会话就可能存在不同来源创建的本地假消息。后续 SSE SEND_USER_MSG ack 和 IM 真消息到达以后，需要做 fake→real 对齐，此时你甚至很难知道哪个本地消息应该被正式消息覆盖，最终就可能出现重复气泡或者 key 冲突。

第三类问题是 Top1 首屏和下一轮消息之间的竞态。你们第一条 39998 还不是正式 IM 真消息，用户开始下一轮发送之前，要通过 `BeforeSendMsg` 触发 `tailInsertSseMsg`，把首屏流式消息进行收口和同步。如果健康服务 Agent 绕过公共 `sendTextMsg` 直接发下一轮请求，那么这个 `BeforeSendMsg` 就可能不执行，第一轮 SSE 假消息还没有正确进入后续会话状态，第二轮模型请求已经开始了。统一发送出口实际上也是在保证“上一轮状态收口完成以后，下一轮才能沿标准链路开始”。

第四类问题是业务参数和埋点可能丢失。统一 `sendTextMsg` 会负责拼已有消息 `ext`，再叠加健康服务的 `ext_params` 和 `ActionBarId`；如果业务组件直接调底层接口，很容易漏掉已有公共参数，导致模型行为、消息身份或者后续数据归因与普通发送链路不一致。这种问题 UI 上可能完全看不出来，但最后 AB 数据会断链。

第五类问题就是副作用分散。发送之后除了真正发请求，还会影响 `userSended`、滚动状态、输入状态、按钮状态、首屏 RS 是否隐藏等很多东西。如果每个入口都自己改这些状态，就会产生“输入框发消息后健康服务消失，但点 RS 后没有消失”这种非常难排查的问题。统一发送出口的价值，本质上不是少写几个函数，而是保证同一种业务事件——用户开始新一轮会话——只能在一个地方触发所有相关状态转换。

新增一种 Agent 卡片要不要改主流程：如果新增 Agent 只是新的业务内容，而且可以复用现有 `health_service_plugins` 或现有 node renderer，那么基本只需要服务端新增协议数据，前端已有 ActionBar/Renderer 就能承接，不需要修改 SSE、IM 和发送主流程；如果视觉形态完全不同，可能需要新增组件和类型映射，但点击以后仍然应该回到统一 `sendTextMsg`。也就是说，可扩展的不是说前端永远零修改，而是新业务尽量只扩展“协议和渲染层”，不复制“消息主链路”。

健康服务 Agent 不是前端写死的一种卡片，而是服务端在原 ActionBar 体系旁边扩展了独立的 `health_service_plugins`，复用通用展示字段，同时通过 `msg_content` 和 `ext_params` 描述点击后真正要发送的模型输入和业务上下文。服务端负责需求推理和服务召回，前端只是协议渲染，所以增加新的健康计划不需要修改会话主流程。

前端在 BottomPlugin 里复用同一个 ActionBar，根据 userSended、enter_position 和是否存在 health_service_plugins，在健康服务和普通 ActionBar 之间互斥选择；因为健康服务是首屏开口承接能力，一旦用户开始聊天就应该退出。用户点击健康服务后，不直接调新接口，而是把服务端下发的 msg_content、ext_params 和 ActionBarId 一起交给统一 sendTextMsg。

之所以必须统一发送，是因为发送动作背后还有 BeforeSendMsg、首屏 tailInsert、会话状态校验、消息 ext、本地假消息、SSE/IM 分流以及 userSended 等全局副作用。如果不同卡片各自实现发送，很容易出现重复请求、状态不一致、第一轮 SSE 尚未收口就开始下一轮、假消息重复以及埋点归因断裂。所以这个需求真正做的不是“增加一个健康服务按钮”，而是把服务端策略生成的新 Agent 能力，以插件协议的方式接进现有渲染体系，再统一收敛到已有消息主链路。
