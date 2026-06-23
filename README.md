# AI_Notes — AI 学习笔记与项目规划

> AI/LLM 概念学习、Linux 学习、数据结构知识体系，以及暑期后端项目规划。

---

## 📂 目录结构

### AI名词学习（核心模块）

| 目录 | 内容 | 规模 |
|------|------|------|
| [AI名词库](./AI名词学习/AI名词库/) | AI/LLM 核心概念笔记，系统化学习 27 个概念 | 27 篇 |
| [AI名词库_Week](./AI名词学习/AI名词库_Week/) | 按周总结的学习进度（Week1-5） | 5 篇 |
| [AI名词复习or实操or面试](./AI名词学习/AI名词复习or实操or面试/) | 概念复习、实操练习、模拟面试 | 5 个文件 |

#### AI名词库覆盖概念（27 篇）

| 日期 | 概念 |
|------|------|
| 05.05 | Token, Hallucination, Prompt |
| 05.06 | Context Window |
| 05.07 | RAG |
| 05.09 | Embedding |
| 05.10 | AI Agent |
| 05.11 | AI 补全代码原理, FIM |
| 05.12 | GGUF, llama.cpp |
| 05.13 | 模型量化 |
| 05.18 | LangChain, Function Calling, MCP |
| 05.19 | Agent, Chain, Tool Calling |
| 05.25 | Learning to Rank, AI模型评估指标 |
| 05.26 | 混淆矩阵, ROC/AUC |
| 05.27 | Pairwise Ranking Loss, 搜索排序与推荐排序 |
| 05.29 | LTR vs NLP vs CV |
| 06.05 | 向量数据库, AI推理优化 |

#### AI名词复习or实操or面试

- `AI概念复习_0601.md` — 用 C++ 类比理解 AI 框架（Function Calling↔回调, MCP↔虚函数）
- `Embedding实操_0601.md` — Embedding 向量化实操
- `function_calling_sim.cpp` — Function Calling 模拟实现（C++）
- `top_k_words_2026_06_04.cpp` — Top-K 词频统计（C++）
- `模拟面试_AI素养_0606.md` — AI 创业公司模拟面试（Token, RAG, MCP 等）

---

### Linux学习

| 目录 | 内容 |
|------|------|
| [Linux命令](./Linux学习/Linux命令/) | 命令学习日志 |
| [Linux相关](./Linux学习/Linux相关/) | 6 篇专题笔记（目录与文件、grep、ps/top、chmod、apt、g++） |
| [Linux练习](./Linux学习/Linux练习/) | 4 天实操练习记录（06.08-06.12，含截图） |

> ⚠️ 注意：Linux 笔记同时存在于本目录和 [`../Linux/`](../Linux/)，内容有重叠，建议未来合并

---

### 数据结构学习

- `数据结构筑基期知识体系总览.md` — 数据结构与算法完整知识图谱（与 C--_Code 中版本内容相同）

---

### 暑期C++智瞳药览后端重写

| 文件 | 日期 | 内容 |
|------|------|------|
| [暑假项目启动计划.md](./暑期C++智瞳药览后端重写/暑假项目启动计划.md) | 06.07 | 完整启动计划：目标、技术栈、时间估算、风险预案 |
| [暑假项目技术选型_0601.md](./暑期C++智瞳药览后端重写/暑假项目技术选型_0601.md) | 06.01 | 技术选型决策（cpp-httplib + nlohmann/json + SQLiteCpp） |
| [暑假项目架构设计_0604.md](./暑期C++智瞳药览后端重写/暑假项目架构设计_0604.md) | 06.04 | 系统架构设计、API 路由、数据流设计 |
| [源码/](./暑期C++智瞳药览后端重写/源码/) | — | 原始 Python 后端 + 微信小程序前端代码（参考用） |

---

## 🔗 交叉引用

- 数据结构知识体系 → 代码实现见 [C--_Code](../C--_Code/)
- Linux 学习 → 命令速查见 [Linux](../Linux/)
- 智瞳药览后端 → C++ 代码见 [medicine_book_backend](../medicine_book_backend/)

---

*更新于 2026-06-23*
