#ueditor-koa

ueditro 百度编辑器，在nodeJS 中使用，需要添加哦、nodejs 的配置文件，
该模块主要是结合koa 使用，nodej 后台的文件上传配置

例子：
```js
const koa = require("koa");
const app = new koa()
const koaView = require("koa-views"); //引入koa 的视图中间件
const koaStatic = require("koa-static");    //引入koa 的静态文件中间件
const router = require("koa-router")(); //引入koa 的路由中间件
// const koaueditor = require("../index"); //引入uedirot-koa 
const koaueditor = require("ueditor-koa");
```

```js
app.use(koaStatic('public'));//静态路径
app.use(koaView('view',{ //视图路径
    extension:'html',
    map:{html:'ejs'}
}))

```
```js
//响应
router.get("/",async(ctx,next)=>{
     await ctx.render("index");
})
```
```js
//ueditor-koa  主要使用
router.all("/ueditor/ue",async (ctx,next)=>{
    var ActionType = ctx.query.action;

    //new 一个实例对象，前两参数是ctx,next，第三参数是对象，必须设置静态目录参数
    //该对象主要提供两个方法 ue_save(filepath,filename),ue_list(filepath) ,方法参数可省略
    //1.ue_save(filepath,filename) 
        //参数一：filepath:自定义保存路径(相对静态目录路径)目录不存在则创建；如："/image/2018"
        //参数二：filename:指定义文件名(默认是时间戳命名)
    //2.ue_list(filepath)
        //参数：列出指定目录下的图片(相对静态目录路径),可省略，默认列出 image目录下的文件

    var uedictx = new koaueditor(ctx, next, {
        statc_path: "/public",//静态目录,文件保存根目录
    });

    if (ActionType == "uploadimage" || ActionType == "uploadvideo" || ActionType == "uploadfile"){
        await uedictx.ue_save();//文件默认在文件保存根目录下生成对应类型的文件夹保存
        //await uedictx.ue_save("/image/2018");//  指定相对目录没有则创建 如：/image/2018  访问：http://image/2018/....， 多级目录则需必须保证目录的存在：如 /public/image/2018
    } else if (ActionType == "listimage"){

        await uedictx.ue_list();//默认列出 image目录下的文件
        //await uedictx.ue_list('fileimage');//指定列出 /public/fileimage 目录下的图片
    }else{
         ctx.set('Content-Type', 'application/json')
         ctx.redirect('/js/ueditor/nodejs/config.json');//根据自己的ueditor的配置文件的路径
    }

})

app.use(router.routes());
app.listen('3000');
console.log("app is run ....")
```