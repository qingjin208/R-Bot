// Cube.js schema 编译环境不支持 process 全局变量
// 通过此配置文件导出 SQL 格式，在 schema 中 require 使用
module.exports = {
  hasPostgres: process.env.SQL_HOST ? true : false,
};