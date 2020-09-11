"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const mysql_1 = __importDefault(require("mysql"));
const Util = __importStar(require("./util"));
class Dbparse {
    /**
     *
     * @param val
     */
    parseExplain(val) {
        return val ? " EXPLAIN " : '';
    }
    /**
     *
     * @param val
     */
    parseDistinct(val) {
        return val ? " DISTINCT " : '';
    }
    /**
     *
     * @param val
     * 表名设置
     * 示例： string=> "table1"
     *        string[]:['table1','table2']=>'table1,table2'
     *
     */
    parseTable(val) {
        if (typeof val === "string") {
            return val;
        }
        else if (Array.isArray(val)) {
            return val.join(",");
        }
        return '';
    }
    /**
     *
     * @param data
     *
     * set 字段设置，添加修改
     * 示例： {name:"小明",age:12} =》 set name='小明',age='12'
     */
    parseSet(data) {
        let set = [];
        for (const key in data) {
            let val = data[key];
            if ((Util.isString(val) && val) || Util.isNumber(val)) {
                val = this.parseValue(val);
                set.push(key + '=' + val);
            }
        }
        if (set.length) {
            return ' SET ' + set.join(",");
        }
        return '';
    }
    /**
     *
     * @param data :字段
     * 示例：1 string: => "id,name"
     *      2. object: 加别名： {id:id,name:name}=> 'id as id,name as name'
     *      3. string[]: [id,name] => "id,name"
     */
    parseField(data) {
        if (!data)
            return "*";
        if (Util.isString(data))
            return data;
        if (Util.isArray(data))
            return data.join(",");
        if (Util.isObject(data)) {
            let arr = [];
            for (const key in data) {
                if (Util.isString(data[key])) {
                    arr.push(key + " as " + data[key]);
                }
            }
            return arr.join(",");
        }
        return "*";
    }
    /**
     *
     * @param data
     */
    parseWhere(data) {
        if (Util.isBoolean(data)) {
            return '';
        }
        else {
            let res = this.getWhereMinx(data);
            if (!res)
                return '';
            return ' WHERE ' + res;
        }
    }
    /**
     *
     * @param {*} option
     */
    getWhereMinx(val) {
        if (!val)
            return '';
        let _this = this;
        if (Util.isString(val))
            return val;
        if (Util.isArray(val)) {
            // [{}]
            //[{},{},{},"or"]
            let _logic;
            if (val.length > 2 && this.isLogic(val[val.length - 1])) {
                _logic = this.getLogic(val[val.length - 1]);
                val.splice(val.length - 1);
            }
            else {
                _logic = this.getLogic();
            }
            let whereArr = [];
            val.forEach((itme) => {
                if (Util.isObject(itme)) {
                    let res = __complexObj(itme);
                    if (res)
                        whereArr.push(' ( ' + res + ' ) ');
                }
                else if (Util.isString(itme)) {
                    whereArr.push(' ( ' + itme + ' ) ');
                }
            });
            if (whereArr.length) {
                return whereArr.join(' ' + _logic + ' ');
            }
            return '';
        }
        if (Util.isObject(val)) {
            return __complexObj(val);
        }
        else {
            return '';
        }
        function __complexObj(obj) {
            let complexStr = '';
            for (let key in obj) {
                if (key == "__complex" && Util.isObject(obj['__complex']) && Util.objLen(obj['__complex'])) {
                    complexStr = "(" + parseObj(obj['__complex']) + " ) ";
                    delete obj['__complex'];
                }
            }
            let _logic = _this.getLogic(obj);
            let resStr = parseObj(obj);
            if (resStr.trim() && complexStr.trim()) {
                resStr = `(${resStr})`;
            }
            else {
                _logic = '';
            }
            return resStr = resStr.trim() ? `${resStr} ${_logic} ${complexStr}` : complexStr;
        }
        function parseObj(obj) {
            let logic = _this.getLogic(obj);
            delete obj["__logic"];
            let whereArr = [];
            for (let key in obj) {
                let resItme;
                if (key.indexOf("|")) {
                    let keyArr = key.split("|");
                    resItme = fn(keyArr, obj[key], "OR");
                }
                else if (key.indexOf("&")) {
                    let keyArr = key.split("&");
                    resItme = fn(keyArr, obj[key], "AND");
                }
                else {
                    resItme = _this.parseWhereItme(key, obj[key]);
                }
                whereArr.push(resItme);
            }
            return whereArr.join(' ' + logic + '  ');
        }
        function fn(keyArr, vals, _logic = "AND") {
            let arr = [];
            keyArr.forEach(itme => {
                let resItme = _this.parseWhereItme(itme, vals);
                arr.push(resItme);
            });
            return arr.join(' ' + _logic + ' ');
        }
    }
    /**
     *
     * @param key
     * @param val
     */
    parseWhereItme(key, val) {
        let _this = this;
        if (Util.isNull(val))
            return ` ${key} IS NULL`;
        if (Util.isArray(val) && val.length) {
            let coms = this.getComparsion(val[0]);
            if (coms) {
                if (/^(=|!=|>|>=|<|<=)/.test(val[0])) {
                    if (Util.isNull(val[1])) {
                        return coms == '!=' ? ` ${key} IS NO NULL ` : ` ${key} IS NULL `;
                    }
                    if (Util.isArray(val[1])) {
                        let __Logic = this.getLogic(val[2], "OR");
                        let res = val[1].map(itme => {
                            return key + ' ' + coms + ' ' + this.parseValue(itme, val[3]);
                        }).join(' ' + __Logic + ' ');
                        return ' ( ' + res + ' ) ';
                    }
                    else {
                        return ` ${key}  ${coms} ${this.parseValue(val[1])} `;
                    }
                }
                else if (/^(LIKE|NOT\s+LIKE|ILIKE|NOT\s+ILIKE)$/i.test(coms)) {
                    if (Util.isArray(val[1])) {
                        let likeLogic = this.getLogic(val[2], "OR");
                        let resLike = val[1].map(itme => {
                            return key + ' ' + coms + ' ' + this.parseValue(itme, val[3]);
                        }).join(' ' + likeLogic + ' ');
                        return ' ( ' + resLike + ' ) ';
                    }
                    else {
                        return ` ${key}  ${coms} ${this.parseValue(val[1])} `;
                    }
                }
                else if (coms == "BETWEEN" || coms == "NOT BETWEEN") {
                    if (Util.isArray(val[1])) {
                        return ' ( ' + key + ' ' + coms + ' ' + this.parseValue(val[1][0]) + " AND " + this.parseValue(val[1][1]) + ' ) ';
                    }
                    else if (Util.isString(val[1])) {
                        let resVal = val[1].split(",");
                        return ' ( ' + key + ' ' + coms + ' ' + this.parseValue(resVal[0]) + " AND " + this.parseValue(resVal[1]) + ' ) ';
                    }
                }
                else if (coms == "IN" || coms == "NOT IN") {
                    if (Util.isArray(val[1])) {
                        val = val[1].map(itme => _this.parseValue(itme, val[2]));
                        val = val.length ? val.join(",") : '" "';
                        return ` ${key} ${coms} ( ${val} )`;
                    }
                    else {
                        return ` ${key}  ${coms} ${this.parseValue(val[1], val[2])} `;
                    }
                }
            }
            else if (Util.isNumber(val[0]) || Util.isString(val[0])) {
                let resFalg = val.every(itme => {
                    return Util.isNumber(itme) || Util.isString(itme);
                });
                if (resFalg) {
                    val = val.map(itme => _this.parseValue(itme));
                    return ` ${key} IN ( ${val.join(",")} )`;
                }
                return '';
            }
        }
        else if (Util.isObject(val)) {
            let logic = this.getLogic(val);
            delete val["__logic"];
            let resArr = [];
            for (const keys in val) {
                let coms = this.getComparsion(keys);
                let comsVal = this.parseValue(val[keys]);
                if (Util.isArray(comsVal)) {
                    resArr.push(key + ' ' + coms + ' (' + comsVal.join(",") + ' ) ');
                }
                else if (Util.isNull(comsVal)) {
                    resArr.push(key == '!=' ? `${key} IS NO NULL ` : ` ${key} IS NULL `);
                }
                else {
                    resArr.push(key + ' ' + coms + ' ' + comsVal);
                }
            }
            return ' ( ' + resArr.join('  ' + logic + ' ') + ' ) ';
        }
        else {
            return ` ${key} = ${this.parseValue(val)}`;
        }
        return '';
    }
    parseJoin(opt) {
        if (!opt)
            return '';
        let joinStr = '';
        var _this = this;
        let _defaultJoin = "LEFT JOIN";
        let joinList = {
            "left": "LEFT JOIN",
            "right": "RIGHT JOIN",
            "inner": "INNER JOIN"
        };
        if (Util.isString(opt)) {
            joinStr = opt;
        }
        else if (Util.isArray(opt) && opt.length) { //["","",][{},{}]
            let joinArr = [];
            opt.forEach((itme) => {
                if (Util.isString(itme)) {
                    joinArr.push(itme);
                }
                else if (Util.isObject(itme)) {
                    var resJoinObj = obj(itme);
                    if (resJoinObj)
                        joinArr.push(resJoinObj);
                }
            });
            if (joinArr.length)
                joinStr = joinArr.join(' ');
            return joinStr;
        }
        else if (Util.isObject(opt) && !Util.isArray(opt)) {
            joinStr = obj(opt);
        }
        return joinStr;
        function obj(val) {
            if (!val)
                return '';
            // if(Util.isString(val)) return val;
            if (Util.isObject(val)) {
                var joinStyle = val['join'].toLowerCase();
                joinStyle = joinStyle ? (joinList[joinStyle] ? joinList[joinStyle] : _defaultJoin) : _defaultJoin;
                var joinTable = val["table"];
                if (!joinTable)
                    return ' ';
                var joinOn = val['on'];
                if (!joinOn)
                    return ' ';
                var joinOnStr = '';
                if (Util.isString(joinOn)) {
                    joinOnStr = joinOn;
                }
                else if (Util.isArray(joinOn) && joinOn.length) {
                    var falg = joinOn.every(itme => Util.isString(itme));
                    if (falg) {
                        joinOnStr = joinOn[0] + ' = ' + joinOn[1];
                    }
                    else {
                        var joinOnArr = [];
                        var _logic = _this.getLogic(joinOn[joinOn.length]);
                        joinOn.splice(joinOn.length);
                        joinOn.forEach(itme => {
                            if (Util.isObject(itme) && itme["_string"]) {
                                joinOnArr.push(itme["_string"]);
                            }
                            else if (Util.isArray(itme) && itme.length) {
                                joinOnArr.push(itme[0] + ' = ' + itme[1]);
                            }
                        });
                        if (joinOnArr.length) {
                            joinOnStr = ' ( ' + joinOnArr.join(" " + _logic + " ") + ' ) ';
                        }
                    }
                }
                if (!joinOnStr)
                    return '';
                return joinStyle + ' ' + joinTable + ' ON ' + joinOnStr;
            }
            return '';
        }
    }
    parseGroup(opt) {
        if (!opt)
            return '';
        if (Util.isString(opt)) {
            return ` GROUP BY ${opt} `;
        }
        else {
            return '';
        }
    }
    parseHaving(opt) {
        var res = this.getWhereMinx(opt);
        if (!res)
            return '';
        return ' HAVING ' + res;
    }
    /**
     *
     *@param {sring|object|array} opt
     *@param {string}: "name desc"
     *@param {array}  ['name desc","id asc"]
     *@param {object}  {"name":'desc',id:"asc"}
     */
    parseOrder(opt) {
        if (!opt)
            return '';
        var orderStr = '';
        let _defaultOrder = "desc";
        let orderList = ["desc", "asc"];
        if (Util.isString(opt)) {
            orderStr = opt;
        }
        else if (Util.isArray(opt)) {
            var flag = opt.every((itme) => Util.isString(itme));
            orderStr = flag ? opt.join(",") : "";
        }
        else if (Util.isObject(opt)) {
            var orderArr = [];
            for (let key in opt) {
                _defaultOrder = orderList.indexOf(opt[key].toString().toLowerCase()) > -1 ? opt[key] : _defaultOrder;
                orderArr.push(key + ' ' + _defaultOrder + ' ');
            }
            orderStr = orderArr.join(",");
        }
        return orderStr ? ' ORDER BY ' + orderStr : '';
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
    parseLimit(opt) {
        if (!opt)
            return '';
        var limitArr = [];
        if (Util.isNumber(opt)) {
            limitArr[0] = opt;
        }
        if (Util.isString(opt)) {
            limitArr = opt.split(",").map(val => Number(val));
        }
        else if (Util.isArray(opt)) {
            limitArr = opt;
        }
        else if (Util.isObject(opt)) {
            limitArr[0] = opt['page'];
            limitArr[1] = opt["offset"];
        }
        if (limitArr.length < 1)
            return '';
        if (limitArr.length == 1)
            return " LIMIT  " + limitArr[0];
        let limit = Number(limitArr[0]) <= 0 ? 1 : limitArr[0];
        let offset = Number(limitArr[1]);
        if (offset <= 0) {
            return ` LIMIT ${limit},${offset} `;
        }
        else {
            limit = (limit - 1) * offset;
            return ` LIMIT ${limit},${offset} `;
        }
    }
    parseUnion(opt) {
        if (!opt)
            return '';
        return opt;
    }
    parseLock(opt) {
        if (!opt)
            return '';
        return opt;
    }
    parseComment(opt) {
        if (!opt)
            return '';
        return opt;
    }
    /**
     *
     * @param {*} sql
     * @param {*} opt {where,limit}
     */
    parseBuildSql(sql, opt) {
        let isAFnKey = (key) => true;
        return sql.replace(/%([A-Z]+)%/g, (a, b) => {
            var type = b.toLowerCase();
            let methods = type[0].toUpperCase() + type.slice(1);
            let keyFn = "parse" + methods;
            if (isAFnKey(keyFn)) {
                return Util.isFunction(this[keyFn]) ? this[keyFn](opt[type] || '') : '';
            }
            return a;
        });
    }
    parseSelectSql(opt) {
        var str = "%EXPLAIN%SELECT%DISTINCT% %FIELD% FROM %TABLE% %JOIN%%WHERE%%GROUP%%HAVING%%ORDER%%LIMIT%%UNION%%LOCK%%COMMENT%";
        return (this.parseBuildSql(str, opt)).toLowerCase();
    }
    /**
     *
     * @param opt
     *
     * table:string,replace:boolean,values:object|object[]|
     *
     */
    parseInsertSql(opt) {
        let table = this.parseTable(opt.table); //table
        let type = opt.replace ? "REPLACE" : "INSERT";
        var sql = `${type} INTO ${table} `;
        let fields;
        if (Util.isArray(opt.values) && opt.values.length) {
            fields = ` ( ${Object.keys(opt.values[0])} ) `;
            let valueArr = opt.values.map(itme => ' (' + this.parseValue(Object.values(itme)).join(',') + ') ');
            sql = sql + fields + 'values' + valueArr.join(",");
        }
        else if (Util.isObject(opt.values)) {
            sql = sql + this.parseSet(opt.values);
        }
        return sql.toLowerCase();
    }
    /**
     *
     * @param {*} opt
     * 删除：table,where,order,limit(参数只能是一个,否则sql 报错， 如：limit 1；不能limit 1,1)
     */
    parseDeleteSql(opt) {
        var str = "DELETE FROM %TABLE%%WHERE%%ORDER%%LIMIT%%LOCK%%COMMENT%";
        return (this.parseBuildSql(str, opt)).toLowerCase();
    }
    /**
     *
     * @param opt
     * 更新：table,values,where,order limit
     */
    parseUpdateSql(opt) {
        if (Util.isObject(opt)) {
            var setVal = this.parseSet(opt.values);
            if (!setVal)
                return "";
            var str = `UPDATE %TABLE% ${setVal} %WHERE%%ORDER%%LIMIT%%LOCK%%COMMENT%`;
            return (this.parseBuildSql(str, opt)).toLowerCase();
        }
        return '';
    }
    /**
     *
     * @param opt
     * table,where,values
     * [{id:1,p_id:2,title:"title1"},{id:1,p_id:2,title:"title2"}]
     * UPDATE categories
        SET
        p_id = CASE id
            WHEN 1 THEN 3
            WHEN 2 THEN 4
            WHEN 3 THEN 5
        END,
        title = CASE id
            WHEN 1 THEN 'New Title 1'
            WHEN 2 THEN 'New Title 2'
            WHEN 3 THEN 'New Title 3'
        END
        WHERE id IN (1,2,3)
     */
    parseUpdateManySql(opt) {
        let whereKey = [];
        let whenArr = {};
        let values = opt.values;
        let keyField = opt.where.key;
        if (!Util.isArray(values) || !keyField || values.length < 1) {
            return '';
        }
        for (let i = 0; i < values.length; i++) {
            let vals = values[i];
            for (let key in vals) {
                if (key === keyField) { //如果是更新key
                    whereKey.push(vals[key]);
                }
                else {
                    if (!whenArr[key]) {
                        whenArr[key] = [];
                    }
                    whenArr[key].push([` when ${this.parseValue(vals[keyField])} then  ${this.parseValue(vals[key])} `]);
                }
            }
        }
        let whenRes = [];
        for (let key in values[0]) {
            if (whenArr[key]) {
                whenRes.push(` ${key} = case ${keyField} ${whenArr[key].join(" ")} end `);
            }
        }
        return `update ${opt.table} set ${whenRes.join(',')} where  ${keyField} in (${whereKey.join(",")})`;
    }
    /**
     *
     * @param opt
     * 聚合函数：table,type,typeField,field?,join?,where?, group?, having?,order?,limit?
     */
    parseFindTypeSql(opt) {
        let typeField = opt.typeField ? opt.typeField : "*";
        let field = this.parseField(opt.field);
        field = field === "*" ? '' : field + ', ';
        var str = `%EXPLAIN%SELECT%DISTINCT%  ${field} ${opt.type}(${typeField}) as ${opt.type}  FROM %TABLE% %JOIN%%WHERE%%GROUP%%HAVING%%ORDER%%LIMIT%%UNION%%LOCK%%COMMENT%`;
        return (this.parseBuildSql(str, opt)).toLowerCase();
    }
    /**
     *
     * @param val
     */
    getComparsion(val) {
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
        };
        let allComVal = [...Object.values(coms), 'EXP', 'BETWEEN', 'NOT BETWEEN'];
        let comsKey = val.toUpperCase();
        let comsRes = coms[comsKey] || comsKey;
        if (allComVal.indexOf(comsRes) > -1)
            return comsRes;
        return "";
    }
    /**
     *
     * @param val
     * @param _default
     */
    getLogic(val, _default) {
        let logicArr = ['AND', 'OR', 'XOR'];
        _default = _default || "AND";
        if (Util.isObject(val)) {
            val = val.__logic;
        }
        if (!val || !Util.isString(val)) {
            return _default;
        }
        val = val.toUpperCase();
        if (logicArr.indexOf(val) > -1) {
            return val;
        }
        return _default;
    }
    isLogic(val) {
        if (typeof val === "string") {
            return ['AND', 'OR', 'XOR'].indexOf(val.toUpperCase()) > -1 ? val : '';
        }
        return '';
    }
    parseValue(val, flag = "") {
        if (flag == "exp")
            return val;
        if (Util.isString(val)) {
            return mysql_1.default.escape(val); // 使用mysql 内置转义：
            // return '\''+`${val}`+'\'';//转义
        }
        else if (Util.isArray(val)) {
            if (/^exp/i.test(val[0])) {
                return val[1];
            }
            else {
                return val.map(itme => { return this.parseValue(itme); });
            }
        }
        else if (Util.isBoolean(val)) {
            return val ? "1" : "0";
        }
        else if (Util.isNull(val)) {
            return "null";
        }
        else if (Util.isUndefined(val)) {
            return '\'' + "" + '\''; //转义
        }
        return val;
    }
}
module.exports = Dbparse;
