const koa = require("koa");
const app = new koa()
const koaView = require("koa-views");
const koaStatic = require("koa-static");
const router = require("koa-router")();
const koaueditor = require("./ueditor");

app.use(koaStatic('public'));
app.use(koaView('view',{
    extension:'html',
    map:{html:'ejs'}
}))
router.get("/",async(ctx,next)=>{
     await ctx.render("index");
})

router.all("/ueditor/ue",async (ctx,next)=>{
    var ActionType = ctx.query.action;
    var uedictx = new koaueditor(ctx, next, {
        statc_path: "/public",//静态目录,文件保存根目录
    });
    if (ActionType == "uploadimage" || ActionType == "uploadvideo" || ActionType == "uploadfile"){
        await uedictx.ue_save("/image/2018");//ue_save() 参数1:savapath:自定义保存路径(绝对路径)，filename:指定义文件名(默认是时间戳命名方式)，可省略，默认在文件保存根目录下生成对应类型的文件夹保存文件
    } else if (ActionType == "listimage"){
        await uedictx.ue_list();//参数：列出指定目录下的图片(绝对路径),可省略，默认列出 image目录下的文件
    }else{
        ctx.set('Content-Type', 'application/json')
        ctx.redirect('/js/ueditor/nodejs/config.json');
    }

})

app.use(router.routes());
app.listen('3000');
console.log("app is run ....")