# Linux基础学习笔记 - Week6

## 一、命令分类总结

### 1. 文件管理类

| 命令      | 功能       | 常用选项            |
| ------- | -------- | --------------- |
| `pwd`   | 显示当前目录路径 | -               |
| `ls`    | 列出目录内容   | `-la`（长格式+隐藏文件） |
| `cd`    | 切换目录     | `cd ~`（回家目录）    |
| `mkdir` | 创建目录     | `-p`（递归创建）      |
| `touch` | 创建空文件    | -               |
| `rm`    | 删除文件/目录  | `-rf`（强制递归删除）   |
| `cp`    | 复制文件     | `-a`（保留属性）      |
| `mv`    | 移动/重命名   | -               |
| `cat`   | 查看文件内容   | -               |

### 2. 文本处理类

| 命令     | 功能           | 常用选项                  |                     |
| ------ | ------------ | --------------------- | ------------------- |
| `head` | 查看文件开头       | `-n 5`（前5行）           |                     |
| `tail` | 查看文件末尾       | `-n 5`（后5行）           |                     |
| `less` | 分页查看         | -                     |                     |
| `more` | 分页查看（向前翻页不便） | -                     |                     |
| `echo` | 输出文本         | `-e`（支持转义）            |                     |
| `>`    | 重定向（覆盖）      | `echo "text" > file`  |                     |
| `>>`   | 重定向（追加）      | `echo "text" >> file` |                     |
| \`     | \`           | 管道                    | `ls \| grep ".txt"` |

### 3. 搜索统计类

| 命令     | 功能         | 常用选项                     |
| ------ | ---------- | ------------------------ |
| `grep` | 文本搜索       | 见下方详解                    |
| `find` | 文件查找       | `-name`、`-size`、`-mtime` |
| `wc`   | 统计行数/词数/字符 | `-l`（行数）                 |
| `sort` | 排序         | `-r`（倒序）、`-n`（数值排序）      |
| `uniq` | 去重         | `-c`（统计次数）、`-d`（只显示重复）   |

### 4. 进程系统类

| 命令      | 功能     | 常用选项          |
| ------- | ------ | ------------- |
| `ps`    | 查看进程快照 | `aux`（所有用户进程） |
| `top`   | 实时进程监控 | -             |
| `kill`  | 终止进程   | `-9`（强制终止）    |
| `df`    | 查看磁盘空间 | `-h`（人类可读）    |
| `du`    | 查看目录大小 | `-sh`（汇总大小）   |
| `clear` | 清屏     | -             |

### 5. 权限管理类

| 命令      | 功能     | 常用选项                      |
| ------- | ------ | ------------------------- |
| `chmod` | 修改文件权限 | `755`（精确设置）、`u+x`（增加执行权限） |

***

## 二、grep 5个常用选项总结

```bash
# 1. -i：忽略大小写
grep -i "error" log.txt

# 2. -v：反向匹配（排除）
grep -v "debug" log.txt

# 3. -n：显示行号
grep -n "port" config.conf

# 4. -c：只统计匹配行数
grep -c "error" log.txt

# 5. -r：递归搜索目录
grep -r "TODO" ~/project/
```

**组合使用示例**：

```bash
# 在所有.cpp文件中查找包含"bug"的行，忽略大小写，显示行号
grep -rin "bug" *.cpp
```

***

## 三、Shell脚本基本结构

### 脚本模板

```bash
#!/bin/bash
# 这是一个注释

# 脚本内容
echo "Hello, World!"

# 定义变量
NAME="Linux"
echo "Hello, $NAME!"

# 条件判断
if [ -f "test.txt" ]; then
    echo "文件存在"
fi
```

### 执行步骤

```bash
# 1. 创建脚本文件
touch my_script.sh

# 2. 编辑内容（使用vim或nano）

# 3. 赋予执行权限
chmod +x my_script.sh

# 4. 执行脚本
./my_script.sh
```

***

## 四、Linux编译C++项目流程

### 1. 单文件编译

```bash
# 基本编译
g++ main.cpp -o program

# 指定C++标准
g++ -std=c++11 main.cpp -o program

# 带警告信息
g++ -Wall -std=c++11 main.cpp -o program
```

### 2. 多文件编译

```bash
g++ main.cpp Student.cpp -o program
```

### 3. 使用Makefile

**Makefile示例**：

```makefile
CXX = g++
CXXFLAGS = -Wall -std=c++11
TARGET = program
OBJS = main.o Student.o

$(TARGET): $(OBJS)
	$(CXX) $(OBJS) -o $(TARGET)

main.o: main.cpp Student.h
	$(CXX) $(CXXFLAGS) -c main.cpp

Student.o: Student.cpp Student.h
	$(CXX) $(CXXFLAGS) -c Student.cpp

clean:
	rm -f *.o $(TARGET)
```

**使用命令**：

```bash
# 编译
make

# 运行
./program

# 清理
make clean
```

***

## 五、Windows迁移C++项目到Linux的坑与解决方案

### 问题1：g++版本过低

**问题**：虚拟机中的g++版本不支持C++17标准

**解决方案**：

```bash
# 暂时修改编译选项，将C++17改为C++11，后续会更新C++配置
g++ -std=c++11 main.cpp -o program
```

### 问题2：文本编码格式不同

**问题**：Windows默认使用CRLF换行，Linux使用LF换行

**解决方案**：编写转码脚本

```bash
#!/bin/bash
# convert_encoding.sh
# 将当前目录下所有.cpp和.h文件的CRLF转换为LF

find . -name "*.cpp" -o -name "*.h" | while read file; do
    sed -i 's/\r$//' "$file"
    echo "转换完成: $file"
done
```

**使用方法**：

```bash
chmod +x convert_encoding.sh
./convert_crlf_to_lf.sh
```

### 问题3：路径分隔符差异

**问题**：Windows使用`\`，Linux使用`/`

**解决方案**：在代码中使用`/`，或使用跨平台路径处理

### 问题4：系统调用差异

**问题**：`system("pause")`和`system("cls")`在Linux中无效

**解决方案**：

```cpp
// 替换 system("pause")
std::cin.get();

// 替换 system("cls")
std::cout << "\033[2J\033[1;1H"; // ANSI转义序列清屏
```

***

## 六、本周学习总结

| 日期    | 学习内容      | 掌握程度 |
| ----- | --------- | ---- |
| 6月8日  | 文件管理命令    | ★★★  |
| 6月9日  | 文本处理命令    | ★★★  |
| 6月10日 | 搜索统计命令    | ★★☆  |
| 6月11日 | 进程系统命令    | ★★☆  |
| 6月12日 | Shell脚本入门 | ★★☆  |
| 6月13日 | C++项目迁移实战 | ★★☆  |

**重点掌握**：`grep`组合用法、Shell脚本编写、Makefile基础
