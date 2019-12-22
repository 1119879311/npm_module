const {Controller,GET} = require("../Lib/decorator")

// 示例：给接口写一个拦截权限的装饰器函数 
function isAoTh(){
    return (target,value,des)=>{
        var fn =des.value;
        des.value = async (ctx,next)=>{
            // target.isAoth = true;
            if(target.isAoth){
                return await {isAoth:false}
            }else{
                return  await  fn.call(target,ctx,next);
            } 
        }
       
    }
}
// 这是中间件，可以统一给控制器做拦截
const middleFn = async (ctx,next)=>{
    ctx.body =await "这是中间件...."
    // await next();
}


class base{
    @isAoTh()   //权限认证
    async __before__(ctx,next){
        // return {status:false,msg:"this is  __before__"}
        // return null
    }
}



//继承基本类,可以统一在基类的前置函数操作

@Controller("/")             
 class index extends base{
    
    // 前置函数，如果存在前置函数，该类下所有的方法调用前都会先执行一次，如果有返回值，不再执行后续操作，执行响应客户端，否则继续执行
    // async __before(ctx,next){
    //     return {status:false,msg:"this is __before"}
    //     // return null
    // }
   
    
    @isAoTh()   //权限认证
    @GET("/wxServer")  //接口
    async index(ctx,next){
        return await {msg:"this is index",isAoth:this.isAoth};
    }

    @GET("/udpae")  
    async udpae(ctx,next){
        ctx.body = await {msg:"this is udpae"};
    }

}
module.exports = index;