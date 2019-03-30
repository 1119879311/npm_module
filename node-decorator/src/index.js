"use strict";
const http = require("http");
const koa = require("koa");
const App = new koa();
const {port} = require("./Config");

App.use(async (ctx,next)=>{
    console.log("112");
    next();
})

// 加载路由
require("./router")(App)

var httpApp = http.createServer(App.callback()).listen(port);
httpApp.on("listening",function(){
    console.log(`http server start runing in port ${port}...`)
})