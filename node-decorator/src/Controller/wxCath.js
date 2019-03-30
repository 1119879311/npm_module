const {Controller,GET} = require("../Lib/router")
@Controller()             
 class index{
    
    constructor(){

    }
    @GET("/wxServer")
    index(ctx,next){
        ctx.body = "this.index";
    }

}
module.exports = index;