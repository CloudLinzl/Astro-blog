/**
 * Create a new post with frontmatter
 * Usage: pnpm new-post <title>
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import process from 'node:process'
import { themeConfig } from '../src/config'

// Process file path
const rawPath = process.argv[2] ?? 'new-post'
const baseName = basename(rawPath).replace(/\.(md|mdx)$/, '')
const targetFile = ['.md', '.mdx'].includes(extname(rawPath))
  ? rawPath
  : `${rawPath}.md`
const fullPath = join('src/content/posts', targetFile)

// Check if file already exists
if (existsSync(fullPath)) {
  console.error(`❌ File already exists: ${fullPath}`)
  process.exit(1)
}

// Create directory structure
mkdirSync(dirname(fullPath), { recursive: true })

// Prepare file content
const content = `---
title: ${baseName}
published: ${new Date().toISOString()}
description: '课程评价、课程简介、老师风格和复习建议'
updated: ''
tags:
  - 待分类
  - 通识/专业
draft: false
pin: 0
toc: ${themeConfig.global.toc}
lang: 'zh'
abbrlink: ''
---

## 总结



## 课程信息

| 项目 | 内容 |
| --- | --- |
| 课程名称 | ${baseName} |
| 课程学分 |  |
| 授课教师 |  |
| 考核方式 | 期末考试 / 大作业 / 平时作业 / 展示 |
| 成绩构成 | 例如：平时 30% + 期末 70% |

## 课程评价

### 课程内容

- 这门课主要讲什么？
- 内容偏理论、偏推导，还是偏项目、偏实践？
- 是否和课程名、课程介绍一致？

### 工作量与难度

- 平时作业多不多？
- 课程节奏快不快？
- 对先修知识要求高不高？

### 收获与不足

- 最大收获是什么？
- 最大槽点是什么？
- 你觉得这门课最适合什么样的同学？

## 老师评价

### 授课风格

- 老师讲课清不清楚？
- PPT / 板书 / 示例质量怎么样？
- 上课氛围是严谨、轻松，还是照本宣科？

### 给分与考核

- 给分风格偏松、正常还是偏严？
- 考试 / 作业 / 展示是否和上课重点一致？
- 是否会划重点，是否有样题或往年风格参考？

### 答疑与反馈

- 老师是否愿意答疑？
- 邮件、群聊、课后沟通反馈快不快？
- 助教支持情况如何？

## 复习与学习建议

### 平时怎么学

- 建议从第几周开始认真跟进？
- 哪些知识点要尽早弄懂？
- 作业、实验、项目分别该怎么分配时间？

### 期末怎么复习

- 推荐的复习顺序是什么？
- 哪几章 / 哪几类题最重要？
- 是否建议整理公式表、错题本或知识框架？

### 避坑提醒

- 最容易失分的点是什么？
- 最容易低估工作量的环节是什么？
- 如果重来一次，你会怎么安排？

## 总评

### 推荐指数

- 推荐程度：8/10
- 适合人群：
- 是否建议选这位老师：

### 结论

最后用一句话给后来选课的人一个结论。

## 相关资料链接

- 课程主页：
- 课件 / 讲义：
- 作业 / 实验说明：
- 参考书 / 参考资料：
- 往年题 / 样题：
- 个人笔记：
`

// Write to file
try {
  writeFileSync(fullPath, content)
  console.log(`✅ Post created: ${fullPath}`)
}
catch (error) {
  console.error('❌ Failed to create post:', error)
  process.exit(1)
}
