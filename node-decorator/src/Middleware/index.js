module.exports = (App)=>{
    App.use(async (ctx,next)=>{
        await next();
    })
}