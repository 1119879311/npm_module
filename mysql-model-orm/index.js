const sqlParse =  require("./lib/dbParse");
const mysql = require('mysql');
class connect{
    constructor(dbconfig={}){
      
        this.pool = mysql.createPool({
            "host": dbconfig.host ||'127.0.0.1',
            "user": dbconfig.user||'root',
            "password": dbconfig.password,
            "port": dbconfig.port||'3306',//端口
            "database": dbconfig.database,
            "socketPath": dbconfig.socketPath
        })
        this.dbconfig = dbconfig;

    }
    escape(val){
        return mysql.escape(val); // 使用mysql 内置转义：
    }
    execsql(sql,option=[]){
        var nowData = new Date().getTime();
        var _this = this;
        if(!sql) return {};
        return new Promise((solve,reject)=>{
            _this.pool.getConnection((err,coms)=>{
                if(err){
                    console.log(err)
                    reject("connect fail " +err);
                    return 
                }
               var resComs = coms.query(sql,option,(err,res,fields)=>{
                    coms.release();
                    if(err) {
                        console.log(err)
                        return  reject("query is error: "+ sql+ '  '+ err);

                    };
                    solve(res)
                })
                console.log("["+new Date().toLocaleString()+"] : sql -: " + resComs.sql + '; --time--: after ' + parseFloat(new Date().getTime()-nowData)+" ms ");
            })
        })
    }
    // 事务
    transaction(sqlArr){
        
        var _this = this;
        return new Promise((resolve,reject)=>{
            _this.pool.getConnection((err,coms)=>{
                if(err){
                    reject("connect fail" +err);
                    return 
                }
                coms.beginTransaction(err=>{
                    if(err){
                        reject("connect fail" +err);
                        return 
                    }
                    
                    var resSQL = sqlArr.map( val =>  {
                        return new Promise((resolve,reject)=>{   
                            if(sqlParse.isString(val)){
                                
                                coms.query(val,(err,res,fields)=>{
                                    if(err) {
                                    return  coms.rollback(()=>{ reject(err) })
                                    };
                                    resolve(res);
                                })
                             
                            }else if(sqlParse.isArray(val)){

                                coms.query(val[0],val[1],(err,res,fields)=>{
                                    if(err) {
                                    return  coms.rollback(()=>{ reject(err) })
                                    };
                                    resolve(res);
                                })

                           
                            }else if(sqlParse.isObject(val)){
                                coms.query(val['sql'],val['value'],(err,res,fields)=>{
                                    if(err) {
                                    return  coms.rollback(()=>{ reject(err) })
                                    };
                                    resolve(res);
                                })
                               
                            }
                        })
                    })
                   
                    Promise.all(resSQL).then(res=>{
                        coms.commit(err=>{
                            if(err){
                                coms.rollback(()=>{reject(err)})
                            }else{
                                console.log("Transaction complete")
                                resolve("Transaction complete")
                            }
                        })
                    }).catch(err=>{
                        console.log(err)
                        coms.rollback(()=>{ reject(err) })
                    })   
                   
                   coms.release();
                })
            })
        })
    }
}

class model extends connect{
    constructor(dbconfig){
      
        super(dbconfig)
      
        this.options = {};
    }

    error(err){
        console.log(err)
        return  {code:-101,mssage:JSON.stringify(err),status:false}
    }
    clone(option){
        var data =  JSON.parse(JSON.stringify(option||this.options));
        this.options = {}; 
        return data;
    }
    buildSql(){
        this.options.build =true;
        return this;
    }
    table(val){
        this.options.table = val;
        return this;
    }
    field(val){
        this.options.field = val;
        return this
    }
    noField(val){
        this.options.field=this.options.field?this.options.field:"*";
        return this;
    }
    where(val){
        this.options.where =  sqlParse.isString(val)?val.trim():val;
        return this;
    }
    join(val){
        this.options.join = val;
        return this;
    }
    limit(val){
        this.options.limit = val;
        return this;
    }
    group(val){
        this.options.group = val;
        return this;
    }
    having(val){
        this.options.having = val;
        return this;
    }
    order(val){
        this.options.order = val;
        return this;
    }
    union(val){
        this.options.union = val;
        return this
    }
    distinct(){
        this.options.distinct = true;
        return this;
    }
    /**
     *  @param {return} Promise
     * */
    async select(){
        var data = this.clone();
        if(sqlParse.objLen(data)==0){
            return  Promise.reject(this.error("sql is miss options"))
        }
        try {
            var sql = await sqlParse.parseSelectSql(data);
            if(data.build)return await sql;
            return await this.execsql(sql);
        } catch (error) {
            return  Promise.reject(this.error(error))
        }       

    }
    async findOne(){
        try {
            this.limit=1;
            var res =await this.select();
            if(this.options.build){
                return await res;
            }
            return res[0]?res[0]:null
        } catch (error) {
            return await error;
        }

    }
    /**
     * 
     * @param {string|object|array} opt 
     * @return {promise} string
     */
    async add(opt,replace){  
        try {
            var data = this.clone();
            data.values = opt; 
            var sql = await sqlParse.parseInsertSql(data,replace);
            if(data.build) return await sql;
            var res = await this.execsql(sql);
            return await res.insertId?res.insertId:0;
        } catch (error) {
            return  Promise.reject(this.error(error))
        } 
    }

     /**
     * 
     * @param {object} values 更新的数据 {name:"updateName"}
     * @param {object} options (可选)条件参数 {where:{id:1}} ;见where 方法参数;
     * @return {promise} string
     */
    async update(values,options){
        var options = this.clone();
        options.values=values;
        try {
            if(!options.where){
                return  Promise.reject(this.error("update miss where or if all update where  parameter  is true"))
            }
            if(!sqlParse.isObject(options.values)){   
                return Promise.reject(this.error("updata data is must object"))
            }
            var sql= await sqlParse.parseUpdateSql(options)
            if(options.build) return await sql;
            var res = await this.execsql(sql); 
            return res.affectedRows?res.affectedRows:0;
            
        } catch (error) {
            return  Promise.reject(this.error(error))
        }        
    }
      /**
     *批量更新
     * @param {array} opt 更新的数据 如： [{name:"updateName1",id:1},{name:"updateName2",id:2}]
     * @param {object} options (必填)条件参数字段 如： {key:"id"} ;id 字段将作为更新条件
     * @return {promise} string
     * 示例：
     * sql：update tk_table SET status = case id where 1 then 2 where 2 then 1 end where id in (1,2);
     */
    async updateMany(opt,where={key:"id"}){
        var options = this.clone();
        options.values = opt;
        options.where = where;
        try {
            if(!sqlParse.isArray(options.values)||!options.values.length){
                return  Promise.reject(this.error("updata data is must Array"));
            } 
            var arrKey =  Object.keys(options.values[0]);//获取所有字段（包含更新字段和条件字段）
            if(!where||arrKey.indexOf(where.key)<0){
                return  Promise.reject(await this.error("update data miss where in field key"));
            }
            var optArr = {};
            var whereArr = [];
            var values=options.values;
            var where = options.where;
            values.forEach((itme,index)=>{
              
                for (var key in itme) {
                    if (key ==where.key) {
                    whereArr.push(this.escape(itme[key]))
                    }else{
                    if(optArr[key]){
                        if(index==values.length-1){
                            optArr[key].push([`when ${itme[where.key]} then  ${this.escape(itme[key])} end`]);
                        }else{
                            optArr[key].push([`when ${itme[where.key]} then  ${this.escape(itme[key])}`]);
                        }
                        
                    }else{
                        if(index==values.length-1){
                            optArr[key] = [`${key} = case ${where.key} when ${itme[where.key]} then  ${this.escape(itme[key])} end`];
                        }else{
                            optArr[key] = [`${key} = case ${where.key} when ${itme[where.key]} then  ${this.escape(itme[key])}`];
                        }
                    }

                    }
                }
            })
          
            var whenArr = [];
           
            for (var keys in optArr) {
            whenArr.push(`${optArr[keys].join(" ")}`);
            }
         
            var sqlStr=`update ${options.table} set ${whenArr.join(',')} where id in (${whereArr.join(",")})`;
            if(options.build) return await sqlStr;
           return   await this.execsql(sqlStr);

        } catch (error) {
            
            return  Promise.reject(this.error(error))
        } 
    }
    /**
     * 
    * @return {promise} string
     */
    async delete(){
        var options = this.clone();
        try {
            if(!options.where){
                return  Promise.reject( await  this.error("delete miss where or if all delete where  parameter  is true"));
            };
            var sqlStr = sqlParse.parseDeleteSql(options);
            if(options.build) return await sqlStr;
            var res = await this.execsql(sqlStr);
            return await res.affectedRows?res.affectedRows:0;
        } catch (error) {
            return  Promise.reject(this.error(error))
        }
    }
    /**
     * 
    * @return {promise} 
     */
    async polyType({type,values,flag}){
        var data = this.clone();
        var options = this.clone(data);
        try {
            data.type = type;
            data.typeVal = values;
            if(flag){
                var inSql = sqlParse.parseFindTypeSql(Object.assign(options,{field:""}));
                data.where = `${data.typeVal} in (${inSql})`;
                var  sqlStr = sqlParse.parseSelectSql(data);
            }else{
                var  sqlStr = sqlParse.parseFindTypeSql(data);
            }
            if(data.build) return await sqlStr;
            var res = await this.execsql(sqlStr);
            return await res.length?res:{};
        } catch (error) {
            return  Promise.reject(this.error(error))
        }

      
    }
    async min(val){
        return this.polyType({type:"min",typeVal:val,flag:true});
    }
    async max(val){
        return this.polyType({type:"max",typeVal:val,flag:true});
    }
    async count(val){
        return this.polyType({type:"count",typeVal:val});
    }
    async sum(val){
        return this.polyType({type:"sum",typeVal:val});
    }

    async avg(val){
        return this.polyType({type:"avg",typeVal:val});
    }
    /**
     *
     * @param {page} Number
     * @param {limit} Number
     * @return {promise} 
     */
    async pageSelect(page=1,limit=10){
        var data = this.clone();
        var options = this.clone(data)       
        try {
            if(sqlParse.objLen(options)==0){
                return  Promise.reject(await this.error("sql is miss option"))
            }             
            options.limit = options.limit?options.limit:[page,limit];
            var res = await this.execsql(await sqlParse.parseSelectSql(options));
            delete data.group;
            delete data.having;
            delete data.limit;
            var field = data.field?data.field:"*";
            this.options =data;
            var count = await this.count(field);
            count = count.length?count[0].count:0;
            return await {code:200,mssage:"success",count:count,data:res};
        } catch (error) {
            return  Promise.reject(error)
        }
    }
    /**
     * @param {object} data
     * @param {object} options 
     * @return {promise} 
     */
    async thenAdd(data,findWhere){
        try {
            var options = this.clone();
            options.where = findWhere;
            var resfind = await this.findOne(options);
            if(resfind) return await {type:"exist",id:""};
            this.options = data;
            var resAdd = await this.add(data);
            return await {type:"add",id:resAdd}
        } catch (error) {
            return  Promise.reject(error)
        }
    }
      /**
     * @param {object} data
     * @param {object} options ;
     * @return {promise} 
     */
    async thenUpdate(data,where){
        try {
            var options = this.clone();
            this.options = {table:options.table,where:where};
            var resfind = await this.findOne();
            if(resfind) return await {type:"exist",id:""};
            this.options = options;
            await this.update(data);
            return await {type:"update",id:""};
        } catch (error) {
            return  Promise.reject(error)
            
        }
    }
     /**
     * @param {object} options ;
     * @return {promise} 
     */
    async MormToMorm(options = {middleTable:"",relateTable:"",rkey:"",fkey:"",rfkey:""}){
        try {
            var data = {};
            data.table = options.relateTable;
            data.join = {table:options.middleTable,join:"right",on:`${options.rkey} = ${options.rfkey}`};
            var res = await this.execsql(sqlParse.parseSelectSql(data));
            var objRes = {};
                if(res&&res.length){
                    res.forEach(itme=>{
                        if(objRes[itme[options.fkey]]){
                            objRes[itme[options.fkey]].push(itme)
                        }else{
                            objRes[itme[options.fkey]] = [itme];
                        }
                    })
                }
             return await objRes
            } catch (error) {
                return  Promise.reject(error)            
            }
    }
}
module.exports = model;
