# Tool Calling（工具调用）

> **一句话总结**：Tool Calling是大模型读懂"工具说明书"，并把自然语言需求翻译成结构化工具调用指令的能力。

---

## 🧰 比喻：给AI配了一个"万能遥控器"

你给机器人管家配了一个万能遥控器，希望它帮你换台。你需要给它三样东西：

| 实体世界 | AI世界 |
|----------|--------|
| 万能遥控器 | Python函数，如 `def get_weather(city): ...` |
| 《遥控器使用说明书》 | JSON格式的工具定义 |
| 指令转化器 | 大模型的Tool Calling能力 |
| 家里的实际环境 | 你的应用程序 |

---

## 📖 三步曲：AI怎么"知道"并"调用"API？

### 第一步：你给AI"发说明书"

```json
{
    "tools": [{
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "查询指定城市的当前天气",
            "parameters": {
                "city": {"type": "string", "description": "城市名称"},
                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
            },
            "required": ["city"]
        }
    }],
    "messages": [{"role": "user", "content": "请问北京今天热不热？"}]
}
```

### 第二步：AI"做阅读理解"并"填表"

AI的推理过程：
1. **意图识别**："用户在问天气，匹配`get_current_weather`"
2. **实体提取**："用户提到'北京'，对应参数`city`"
3. **生成指令**：输出结构化JSON指令

```json
{
    "role": "assistant",
    "tool_calls": [{
        "id": "call_xyz123",
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "arguments": "{\"city\": \"北京\", \"unit\": \"celsius\"}"
        }
    }]
}
```

### 第三步：程序"动手"并把结果"喂回去"

1. **解析指令**：提取调用信息
2. **执行函数**：调用真实API
3. **告知AI**：把结果追加到对话历史
4. **AI总结**：用自然语言回复用户

---

## 🆚 概念对比

| 概念 | 核心本质 | 比喻 |
|------|----------|------|
| **Tool Calling** | 大模型的输出模式 | 机器人管家看懂说明书并按遥控器 |
| **Function Calling** | 与Tool Calling是同一概念的不同名称 | 同上 |
| **MCP** | 标准化通信协议 | 定义遥控器和家电的接口规范 |
| **Agent** | 自主使用工具的程序 | 拿着遥控器并决定按哪个键的机器人管家 |

---

**核心价值**：让AI从"知道"升级为"做到"，是构建智能体的关键技术。