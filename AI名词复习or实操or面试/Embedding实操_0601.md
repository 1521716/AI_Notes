# Embedding实操

> **一句话总结**：通过余弦相似度计算，量化两个Embedding向量之间的语义距离。

---

## 🎯 核心原理回顾

Embedding将文字转换成"地图上的坐标"，两段文字的相关性通过坐标距离衡量：
- **距离近** → 语义相似、高度相关
- **距离远** → 语义不同

**余弦相似度**是衡量向量方向相似度的常用方法：
- 值越接近 **1**：两个向量方向相同，语义高度相似
- 值越接近 **0**：两个向量正交，语义无关
- 值越接近 **-1**：两个向量方向相反，语义相反

---

## 🧮 余弦相似度公式

```python
import math

def cosine_sim(a, b):
    dot = sum(x*y for x, y in zip(a, b))  # 点积
    norm_a = math.sqrt(sum(x*x for x in a))  # a的模长
    norm_b = math.sqrt(sum(x*x for x in b))  # b的模长
    return dot / (norm_a * norm_b)
```

**数学原理**：
\[
\text{cosine\_similarity}(a, b) = \frac{a \cdot b}{\|a\| \times \|b\|}
\]

---

## 💻 实操示例

```python
import math

def cosine_sim(a, b):
    dot = sum(x*y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x*x for x in a))
    norm_b = math.sqrt(sum(x*x for x in b))
    return dot / (norm_a * norm_b)

# 假设的Embedding向量
cat = [0.8, 0.6]    # 猫的向量
dog = [0.7, 0.7]    # 狗的向量
car = [-0.5, 0.3]   # 车的向量

print(f"猫和狗的相似度: {cosine_sim(cat, dog):.3f}")
print(f"猫和车的相似度: {cosine_sim(cat, car):.3f}")
print(f"狗和车的相似度: {cosine_sim(dog, car):.3f}")
```

---

## 📊 运行结果分析

```
猫和狗的相似度: 0.990
猫和车的相似度: -0.377
狗和车的相似度: -0.243
```

| 对比 | 相似度 | 结论 |
|------|--------|------|
| 猫 vs 狗 | **0.990** | 非常相似（都属于动物） |
| 猫 vs 车 | **-0.377** | 不太相关（动物 vs 交通工具） |
| 狗 vs 车 | **-0.243** | 不太相关（动物 vs 交通工具） |

---

## 🧠 实践感悟

1. **向量维度**：真实的Embedding向量通常是几百到几千维，这里只用2维是为了演示
2. **语义映射**：模型学习到"猫"和"狗"在语义空间中位置接近，而"车"在相反方向
3. **RAG应用**：在检索增强生成中，通过计算查询与文档的余弦相似度，找到最相关的资料

---

**核心价值**：理解余弦相似度是使用Embedding进行语义检索的基础，是RAG系统的核心算法。