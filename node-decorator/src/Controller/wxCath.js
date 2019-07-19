const {Controller,GET} = require("../Lib/decoratorRouter")

// 示例：给接口写一个拦截权限的装饰器函数 
function isAoTh(){
    return (target,value,des)=>{
        var fn =target[value];
        des.value = async (ctx,next)=>{
            target.isAoth = true;
            if(target.isAoth){
                return ctx.body = await {isAoth:false}
            }else{
                fn.call(target,ctx,next);
            } 
        }
       
    }
}

class base{

    async __before(ctx,next){
        return {status:false,msg:"this is __before"}
        // return null
    }
}

//继承基本类,可以统一在基类的前置函数操作

@Controller()             
 class index extends base{
    
    constructor(){
        super();
    }
    // 前置函数(不建议写加装饰器)，如果存在前置函数，该类下所有的方法调用前都会先执行一次，如果有返回值，不再执行后续操作，执行响应客户端，否则继续执行
    // async __before(ctx,next){
    //     return {status:false,msg:"this is __before"}
    //     // return null
    // }
   
    @GET("/wxServer")  //接口
    @isAoTh()   //权限认证
    async index(ctx,next){
        ctx.body = await {msg:"this is index",isAoth:this.isAoth};
    }

    @GET("/udpae")  
    async udpae(ctx,next){
        ctx.body = await {msg:"this is udpae"};
    }

}
module.exports = index;