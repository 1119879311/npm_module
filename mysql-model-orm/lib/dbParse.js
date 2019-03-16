'use strict';

const mysql = require('mysql');
class hepler{
    constructor(){
        
    }
    isNull(val){
        return this._proto_(val)=="[object Null]";
    }
    isFunction(val){
        return this._proto_(val)=="[object Function]";
    }
    isUndefined(val){
        return this._proto_(val)=="[object Undefined]";
    }
    isNumber(val){
        return this._proto_(val)=="[object Number]";
    }
    isSymbol(val){
        return this._proto_(val)=="[object Symbol]";
    }
    isBooleam(val){
        return this._proto_(val)=="[object Booleam]";
    }
    isString(val){
        return this._proto_(val)=="[object String]";
    }
    isObject(val){
        return this._proto_(val)=="[object Object]";
    }
    isArray(val){
        return this._proto_(val)=="[object Array]";
    }
    isStringNumber(val){
        return this.isString(val)||this.isNumber(val);
    }
    _proto_(type) {
        return Object.prototype.toString.call(type)
    }
    objLen(val){
        if(this.isObject(val)) return (Object.keys(val)).length;
        return 0;
    }
}

class parse extends hepler{
    constructor(){
        super();
    }
    static instances(){
        if (!this.instance) {
            this.instance = new parse();
        }
        return this.instance;
    }
    
    parseExplain(val){
        return val?" EXPLAIN ":'';
    }
    parseDistinct(val){
        return val?" DISTINCT ":'';
    }
    parseSet(data={}){
        let set = [];
        for (const key in data) {

            let val = data[key];
           if((this.isString(val)&&val)||this.isNumber(val)){
               val = this.parseValue(val);
                set.push( key + '=' + val);
           }
        }
        if(set.length){
          return  ' SET ' + set.join(",");
        }
        return '';
    }
    /**
     * 
     * @param {string,array} val 
     */
    parseTable(val){
        if(this.isString(val)){
            return val;
        }else if(this.isArray(val)){
            return val.join(",");
        }
        return '';
    }
    parseField(val){
        if(!val) return "*"
        if(this.isString(val)) return val;
        if(this.isArray(val)&&val.length) return val.join(",");
        if(this.isObject(val)){
            var arr = [];
            for (let key in val) {
                if (this.isString(val[key])) {
                    arr.push(key + " as " + val[key]);
                }
            }
          return  arr.join(",");
        }
        return "*"; 
    }
    parseWhere(opt){
        if(opt===true&&this.isBooleam(opt)) return '';
        var res = this.getWhereMinx(opt);
        if(!res) return '';
        return ' WHERE ' + res;
    }

    /**
     * 
     * @param {*} option 
     */
    getWhereMinx(option){
        var val = JSON.parse(JSON.stringify(option));
        var _this = this;
        if(!val) return '';
        if(this.isString(val)) return val;
        if(this.isObject(val)){
            return __complexObj(val)

        }else if(this.isArray(val)){
            // [{}]
            //[{},{},{},"or"]
            if(val.length>=2){
                var _logic = this.getLogic(val[val.length-1]);
                val.splice(val.length-1);
            }else{
                var _logic = this.getLogic();
            }

            // var _logic = this.getLogic(val[2]);
            // val.splice(2);
            var whereArr = [];
            val.forEach(itme=>{
                if(_this.isObject(itme)){
                    if(__complexObj(itme))  whereArr.push(' ( '+__complexObj(itme)+ ' ) ');
                }else if(_this.isString(itme)){
                    whereArr.push(' ( '+itme+ ' ) ');
                }
            })
            if(whereArr.length){
                return  whereArr.join(' '+_logic+' ')
            }
            return '';
        }
        
        function __complexObj(obj){
            var complexStr = '';
            for(let key in obj){
                if(key=="__complex" && _this.isObject(obj['__complex']) &&_this.objLen(obj['__complex'])){
                    complexStr = "(" +parseObj(obj['__complex'])+" ) ";
                    delete obj['__complex']
                }
            }
            var _logic = _this.getLogic(obj);
            var resStr = parseObj(obj);
            if(resStr.trim()&&complexStr.trim()){
                resStr = `(${resStr})`
            }else {
                _logic = '';
            }
            return resStr = resStr.trim()? `${resStr} ${_logic} ${complexStr}`:complexStr;
        }

        function parseObj(obj){
            var logic = _this.getLogic(obj);
            delete obj["_logic"];
            var whereArr = [];
            for (let key in obj) {
                if(key.indexOf("|")){
                    var keyArr = key.split("|");
                    var resItme = fn(keyArr,obj[key],"OR");
                }else if(key.indexOf("&")){
                    var keyArr = key.split("&");
                    var resItme = fn(keyArr,obj[key],"AND");
                }else{
                    var resItme = _this.parseWhereItme(key,obj[key]);
                }
                whereArr.push(resItme)
            }

            return whereArr.join(' '+logic +'  ')
        }


        function fn(keyArr,vals,_logic="AND"){
            var arr = [];
            keyArr.forEach(itme=>{
                var resItme = _this.parseWhereItme(itme,vals);
                arr.push(resItme)
            })
            return arr.join(' '+_logic+' ')

        }
    }
    /**
     * 
     * @param {*} val 
     * string => id=1 
     */
    parseWhereItme(key,val){ 

        var _this = this;
        var whereStr = "";
        if(this.isNull(val)) return  ` ${key} IS NULL`;
        if(this.isArray(val)&&val.length){
            var coms = this.getComparsion(val[0]);  
            if(coms){
                if(/^(=|!=|>|>=|<|<=)/.test(val[0])){ 
                    if(this.isNull(val[1])){
                        return coms=='!='? ` ${key} IS NO NULL `:` ${key} IS NULL `;
                    }
                    if(this.isArray(val[1])){
                        val = val[1].map(itme=>_this.parseValue(itme,val[2]));
                        val = val.length?val.join(","):'" "';
                        return ` ${key} ${coms} ( ${val[0]} )`
                    }else{
                        return ` ${key}  ${coms} ${this.parseValue(val[1])} `;
                    }
                    
                }else if(/^(LIKE|NOT\s+LIKE|ILIKE|NOT\s+ILIKE)$/i.test(coms)){
                
                   if(this.isArray(val[1])){
                     var likeLogic = this.getLogic(val[2],"OR");
                     var resLike =  val[1].map(itme=>{
                         return  key +' '+ coms + ' ' + this.parseValue(itme,val[2]);
                     }).join(' '+likeLogic+' ');
                     return ' ( '+resLike+' ) ';
                   }else{
                     return ` ${key}  ${coms} ${this.parseValue(val[1])} `;
                   }
                }else if(coms=="BETWEEN"||coms=="NOT BETWEEN"){
                    if(this.isArray(val[1])){
                        return ' ( '+key +' ' +coms+' '+this.parseValue(val[1][0]) + " AND " + this.parseValue(val[1][1]) +' ) ';
                    }else if(this.isString(val[1])){
                        var resVal = val[1].split(",");
                        return ' ( '+ key +' ' +coms+' '+this.parseValue(resVal[0]) + " AND " + this.parseValue(resVal[1])+' ) ';
                    }
                }else if(coms=="IN"||coms=="NOT IN"){
                    if(this.isArray(val[1])){
                        val = val[1].map(itme=>_this.parseValue(itme,val[2]));
                        val = val.length?val.join(","):'" "';
                        return ` ${key} ${coms} ( ${val} )`
                    }else{

                        return ` ${key}  ${coms} ${this.parseValue(val[1],val[2])} `;
                    }
                }
            }else if(this.isNumber(val[0]) || this.isString(val[0])){
                var resFalg = val.every(itme=>{
                    return _this.isNumber(itme) || _this.isString(itme);
                })
                if(resFalg){
                    val = val.map(itme=>_this.parseValue(itme));
                    return ` ${key} IN ( ${val.join(",")} )`
                }
                return ''
            }
        }else if(this.isObject(val)){
            var logic = this.getLogic(val);
            delete val["_logic"];
            var resArr = [];
            for (const keys in val) {
               var coms = this.getComparsion(keys);
               var comsVal = this.parseValue(val[keys]);
               if(this.isArray(comsVal)){
                    resArr.push(key +' '+coms+' ('+ comsVal.join(",")+' ) ');
               }else if(this.isNull(comsVal)){
                    resArr.push(key=='!='? `${key} IS NO NULL `:` ${key} IS NULL `)
               }else{
                   resArr.push(key+' '+coms+' '+comsVal);
               }
            }
           return ' ( ' +resArr.join('  '+ logic +' ')+' ) ';
        }else {
            return  ` ${key} = ${this.parseValue(val)}`
        }
      
    }
    /**
     * 
     * @param {*} val 
     */
    parseJoin(opt){
        if(!opt)return '';
        let joinStr = '';
        var _this = this;
        let _defaultJoin = "LEFT JOIN";
        let joinList = {
            "left":"LEFT JOIN",
            "right":"RIGHT JOIN",
            "inner":"INNER JOIN"
        };
        if(this.isString(opt)) {
            joinStr = opt
        }else if(this.isArray(opt)&&opt.length){ //["","",][{},{}]
            var joinArr = [];
            opt.forEach(itme=>{
                if(_this.isString(itme)){
                    joinArr.push(itme);
                }else if(_this.isObject(itme)){
                    var resJoinObj = obj(itme);
                    if(resJoinObj) joinArr.push(resJoinObj);
                }
            })
            if(joinArr.length)  joinStr = joinArr.join(' ');
            return joinStr;

        }else if(_this.isObject(opt)){
            joinStr =  obj(opt)
        }
      
        function obj(val){
            if(!val) return '';
            if(_this.isString(val)) return val;
            if(_this.isObject(val)){
               
                var joinStyle = val['join'].toLowerCase();
                joinStyle = joinStyle?(joinList[joinStyle]?joinList[joinStyle]:_defaultJoin):_defaultJoin;
                var joinTable = val["table"];
                if(!joinTable) return ' ';
                var joinOn = val['on'];
                if(!joinOn) return ' ';
                var joinOnStr = '';
                if(_this.isString(joinOn)){
                    joinOnStr = joinOn;
                }else if(_this.isArray(joinOn)&&joinOn.length){
                   var falg =  joinOn.every(itme=>_this.isString(itme));
                   if(falg){
                         joinOnStr  = joinOn[0] +' = ' +joinOn[1]
                   }else{
                        var joinOnArr = [];
                        var _logic = _this.getLogic(joinOn[joinOn.length]);
                        joinOn.splice(joinOn.length);
                        joinOn.forEach(itme=>{
                            if(_this.isObject(itme)&&itme["_string"]){
                                joinOnArr.push(itme["_string"])
                            }else if(_this.isArray(itme)&&itme.length){
                                joinOnArr.push(itme[0] +' = ' +itm[1]);
                            }
                        })
                        if(joinOnArr.length){
                            joinOnStr = ' ( '+joinOnArr.join(" "+_logic+" ")+' ) ';
                        }
                    }
                   
                }
              
                if(!joinOnStr) return '';
                return joinStyle +' '+joinTable+' ON '+joinOnStr;
            }
        }
        return joinStr;
    }
    /**
     * 
     * @param {string} opt 
     */
    parseGroup(opt){
        if(!opt) return '';
        if(this.isString(opt)){
            return ` GROUP BY ${opt} `
        }else{
            return '';
        }
    }
    /**
     * 
     * @param {string|object|Array} opt 
     */
    parseHaving(opt){
        var res = this.getWhereMinx(opt);
        if(!res) return '';
        return ' HAVING ' + res;
    }
    /**
     * 
     *@param {sring|object|array} opt 
     *@param {string}: "name desc"
     *@param {array}  ['name desc","id asc"]
     *@param {object}  {"name":'desc',id:"asc"}
     */
    parseOrder(opt){
        if(!opt) return '';
        var _this =this;
        var orderStr = '';
        let _defaultOrder = "desc";
        let orderList = ["desc","asc"];
        if(this.isString(opt)){
            orderStr = opt;
        }else if(this.isObject(opt)){
            var orderArr = [];
            for (let key in opt) {
                _defaultOrder =orderList.indexOf(opt[key].toString().toLowerCase())>-1?opt[key]: _defaultOrder;
                orderArr.push(key +' '+_defaultOrder+' ');
            }
            orderStr = orderArr.join(",");
        }else if(this.isArray(opt)){
           var flag =  opt.every(itme=>_this.isString(itme));
           orderStr =  flag?opt.join(","):"";
        }
        return orderStr ? ' order by '+ orderStr :'' ;
    }
    /**
     * 
     * @param {string|object|arrAry} opt 
     * @param {string} "2,10" 10
     * @param {object} {"page":0,"offset":10}
     * @param {arrAry} [1,]
     * 参数一个：代表个数 
     * 参数两个：第一个代表页数，第二个代表个数(整数)，（如果第二个参数小于0，第一个参数为个数）
     */
    parseLimit(opt,_defaultOffset=10){
        if(!opt) return '';
        var limitArr = [];
        if(this.isNumber(opt)){
            limitArr[0] = opt;
        }
        if(this.isString(opt)){
             limitArr = opt.split(",");
           
        }else if(this.isObject(opt)){
            limitArr[0] = opt['page'];
            limitArr[1] = opt["offset"];
        }else if(this.isArray(opt)&&opt[0]&&opt[1]){
            limitArr[0] = opt[0];
            limitArr[1] = opt[1];
        }
        if(!limitArr.length) return '';
        if(limitArr.length==1) return   " limit  " +limitArr[0];  
        // 两个参数
        var limit  =  parseInt(limitArr[0])<=0?1:limitArr[0];
        var offset = Number(limitArr[1]);
        if(offset<=0){
            offset=0;
            return  ` limit ${limit},${offset} `; 
        }else {
            limit = (limit-1) * offset;
            return  ` limit ${limit},${offset} `;
        }
    }
    parseUnion(opt){
        if(!opt) return '';
        return opt;
    }
    parseLock(opt){
        if(!opt) return '';
    }
    parseComment(opt){
        if(!opt) return '';
    }
    /**
     * 
     * @param {*} sql 
     * @param {*} opt {where,limit}
     */
    parseBuildSql(sql,opt){
       return sql.replace(/%([A-Z]+)%/g,(a,b)=>{
            var type = b.toLowerCase();
            let typefn = type[0].toUpperCase() +type.slice(1);
            if(this.isFunction(  this['parse'+typefn]  )){
                return this['parse'+typefn](opt[type]||'')
            }
            return a
        })
    }
    parseSelectSql(opt){
        var str = "%EXPLAIN%SELECT%DISTINCT% %FIELD% FROM %TABLE% %JOIN%%WHERE%%GROUP%%HAVING%%ORDER%%LIMIT%%UNION%%LOCK%%COMMENT%";
        return (this.parseBuildSql(str,opt)).toLowerCase();
    }
    /**
     * 
     * @param {*} opt 
     * @param {*} replace 
     */
    parseInsertSql(opt={},replace){ //values : 
        var _this = this;
        var table = this.parseTable(opt.table);
        var type = replace?"REPLACE":"INSERT";
        var sql = `${type} INTO ${table} `;
        var field =  _this.parseField(opt.field);
        field = field=="*"?'':' ('+ field+ ')';
        if(this.isString(opt.values)){
            var val = opt.values.trim();
            if(!val.startsWith("(")){
                val =_this.parseValue( val.split(',')).join(',');
                sql  = sql +field+ ' values ( '+val +' ) ' ;
            }
        }else if(this.isObject(opt.values)){
            sql = sql + this.parseSet(opt.values);
        }else if(this.isArray(opt.values)&&opt.values.length){
            var valArr = [];
            var falg =   opt.values.every(itme=>_this.isArray(itme)||_this.isObject(itme));
            if(falg&&opt.values){
                field = this.isObject(opt.values[0])?'('+  Object.keys(opt.values[0]) +')':field;
                opt.values.forEach(itme=>{
                    if(_this.isObject(itme)){
                     var itmes =   Object.values(itme)
                    }else if(_this.isArray(itme)){
                     var itmes = itme;
                    }
                    valArr.push( ' ( '+_this.parseValue(itmes).join(",")+' ) ');
                })
                sql = sql+field +'values' +valArr.join(",");
            }else{
                sql = sql +field+ ' values( '+ opt.values.join(',') +' ) ';
            }
            
        }
        return sql.toLowerCase();
    }
    /**
     * 
     * @param {*} opt 
     */
    parseDeleteSql(opt={}){
        var str = "DELETE FROM %TABLE%%WHERE%%ORDER%%LIMIT%%LOCK%%COMMENT%";
        return (this.parseBuildSql(str,opt)).toLowerCase();
    }
    parseUpdateSql(opt={}){
        if(this.isObject(opt)){
            var setVal = this.parseSet(opt.values);
            if(!setVal) return "";
            var str = `UPDATE %TABLE% ${setVal} %WHERE%%ORDER%%LIMIT%%LOCK%%COMMENT%`;
            return (this.parseBuildSql(str,opt)).toLowerCase();
        }else if(this.isArray(opt)&&opt.length){
           
        }
       
    }
    parseFindTypeSql(opt={}){
        var typeVal = opt.typeVal?opt.typeVal:"*";
        var field = this.parseField(opt.field);
        field = field=="*"?'':', '+field;
        // opt.limit = opt.limit?opt.limit:1;
        var str = `%EXPLAIN%SELECT%DISTINCT% ${opt.type}(${typeVal}) as ${opt.type}  ${field} FROM %TABLE% %JOIN%%WHERE%%GROUP%%HAVING%%ORDER%%LIMIT%%UNION%%LOCK%%COMMENT%`;
        return (this.parseBuildSql(str,opt)).toLowerCase();
    }

    parseDescSql(table=""){
        if(!table) return "";
        return "desc " + table;
    }

    getComparsion(val){
        let coms = {
            EQ: '=',
            NEQ: '!=',
            '<>': '!=',
            GT: '>',
            EGT: '>=',
            LT: '<',
            ELT: '<=',
            NOTLIKE: 'NOT LIKE',
            LIKE: 'LIKE',
            NOTILIKE: 'NOT ILIKE',
            ILIKE: 'ILIKE',
            IN: 'IN',
            NOTIN: 'NOT IN'
        }
       var comsValArr = Object.values(coms);
       var allComVal = [...comsValArr,'EXP', 'BETWEEN', 'NOT BETWEEN'];
       var comsKey = val.toUpperCase();
       var comsRes = coms[comsKey] || comsKey ;
       if(allComVal.indexOf(comsRes)>-1) return comsRes;
       return "";       
    }
    getLogic(val,_default = "AND"){
        var logicArr = ['AND', 'OR', 'XOR'];
        if(this.isObject(val)){
            val = val._logic;
        }
        if(!val || !this.isString(val)) {
            return _default;
        }
        val = val.toUpperCase();
        if(logicArr.indexOf(val)>-1){
            return val;
        }
        return _default;
    }
    parseValue(val,flag=""){
        if(flag=="exp") return val;
        if(this.isString(val)){
           
           return mysql.escape(val); // 使用mysql 内置转义：
            // return '\''+`${val}`+'\'';//转义
        }else if(this.isArray(val)){
            if(/^exp/i.test(val[0])){
                return val[1];
            }else{
                return val.map(itme=>{return this.parseValue(itme)});
            }
        }else if(this.isBooleam(val)){
            return val?"1":"0";
        }else if(this.isNull(val)){
            return "null";
        }else if(this.isUndefined(val)){
            return '\''+""+'\'';//转义
        }
        return val;
    }
    


}
module.exports =  parse.instances();