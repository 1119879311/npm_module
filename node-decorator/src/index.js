"use strict";
const http = require("http");
const koa = require("koa");
const App = new koa();
const {port} = require("./Config");

//加载中间件
require("./Middleware")(App);

// 加载路由
require("./Lib/loadRouter")(App)

var httpApp = http.createServer(App.callback()).listen(port);
httpApp.on("listening",function(){
    console.log(`http server start runing in port ${port}...`)
})