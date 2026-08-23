---
title: R-Bot Cube.js
emoji: 🦅
colorFrom: blue
colorTo: purple
sdk: docker
pinned: false
license: mit
---

# R-Bot Cube.js 数据分析服务

基于 Cube.js 的销售数据分析后端，支持 Postgres (Neon) 数据库。

## 环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `SQL_HOST` | 数据库主机 | `ep-xxx.neon.tech` |
| `SQL_PORT` | 端口 | `5432` |
| `SQL_DATABASE` | 数据库名 | `neondb` |
| `SQL_USER` | 用户名 | `neondb_owner` |
| `SQL_PASSWORD` | 密码 | `your-password` |
| `CUBEJS_DB_TYPE` | 数据库类型 | `postgres` |
| `CUBEJS_JWT_SECRET` | JWT 密钥 | 随机字符串 |