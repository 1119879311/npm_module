"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dbParse_1 = __importDefault(require("./dbParse"));
const mysql_1 = __importDefault(require("mysql"));
const util_1 = require("./util");
class model extends dbParse_1.default {
    /**
     *
     * @param dbconfig
     */
    constructor(dbconfig) {
        super();
        /**
         *
         */
        this.showSql = true;
        this.pool = mysql_1.default.createPool({
            "host": dbconfig.host || '127.0.0.1',
            "user": dbconfig.user || 'root',
            "password": dbconfig.password || '',
            "port": dbconfig.port || 3306,
            "database": dbconfig.database,
            "debug": dbconfig.debug || false
        });
        this.showSql = dbconfig.showSql || true;
    }
    /**
     *
     * @param str
     * @param type
     */
    logs(str, type = "info") {
        if (str) {
            type === "error" ? console.log(`\u001b[31m [${new Date().toLocaleString()}]：${str} \u001b[32m`) : console.log(`\u001b[31m ${str} \u001b[39m`);
            ;
        }
        let nowtime;
        return {
            start: () => {
                nowtime = new Date().getTime();
            },
            end: (logs) => {
                let dalyTime = new Date().getTime() - nowtime;
                console.log(`\u001b[32m[${new Date().toLocaleString()}]: ${logs}; 耗时：${dalyTime}ms \u001b[32m`);
            }
        };
    }
    clone(data) {
        return JSON.parse(JSON.stringify(data));
    }
    /**
     * // 转义
     * @param value:any
     */
    escape(value) {
        return mysql_1.default.escape(value);
    }
    /**
     * 创建连接
     */
    getConntion() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                this.pool.getConnection((err, sqlCom) => {
                    if (err)
                        return resolve([`Connection  Fail` + err, null]);
                    resolve([null, sqlCom]);
                });
            });
        });
    }
    /**
     *
     * @param SQL
     * @param data
     */
    execsql(SQL, data = []) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                let logsFn = this.logs();
                logsFn.start();
                this.pool.getConnection((conErr, sqlCom) => {
                    if (conErr) {
                        this.logs(`Connection  Fail：` + conErr, "error");
                        return resolve([`Connection  Fail：` + conErr, null]);
                    }
                    let queryRes = sqlCom.query(SQL, data, (qErr, res) => {
                        sqlCom.release();
                        if (qErr) {
                            this.logs(`SQL  Error: 【 ${SQL} 】  ` + qErr, "error");
                            return resolve(["SQL  Error: 【" + SQL + "】  " + qErr, null]);
                        }
                        resolve([null, res]);
                    });
                    logsFn.end(`SQL=>[ ${queryRes.sql}]`);
                });
            });
        });
    }
    /**
     *
     * @param sqlArr 事务处理
     */
    transaction(sqlArr) {
        return new Promise((resolve) => {
            this.pool.getConnection((conErr, sqlCom) => {
                if (conErr) {
                    this.logs(`Connection  Fail：` + conErr, "error");
                    return resolve([`connection Fail: ` + conErr, null]);
                }
                // 执行sql
                let logsFn = this.logs();
                logsFn.start();
                sqlCom.beginTransaction(transErr => {
                    if (transErr) {
                        this.logs(`BeginTransaction  Fail：` + transErr, "error");
                        return resolve([`BeginTransaction Fail: ` + conErr, null]);
                    }
                    let sqlRes = sqlArr.map(itme => {
                        return new Promise((rev, rej) => {
                            let [sql, value] = ['', []];
                            if (typeof itme === "string") {
                                sql = itme;
                            }
                            else if (Array.isArray(itme)) {
                                sql = itme[0];
                                value = itme[1] || [];
                            }
                            // 执行sql
                            let slogs = this.logs();
                            slogs.start();
                            let queryRes = sqlCom.query(sql, value, (qErr, res) => {
                                if (qErr)
                                    return sqlCom.rollback(() => {
                                        this.logs(`SQL  Error: 【 ${sql} 】  ` + qErr, "error");
                                        rej("SQL  Error: 【" + sql + '】  ' + qErr);
                                    });
                                rev(res);
                            });
                            slogs.end(` SQL=>[${queryRes.sql}]`);
                        });
                    });
                    // 如果有一个执行报错，则回滚事务,否侧提交事务
                    Promise.all(sqlRes).then(allRes => {
                        sqlCom.commit(err => {
                            if (err)
                                return sqlCom.rollback(() => {
                                    this.logs(`Transaction Commit Fail  ` + err, "error");
                                    resolve([err, null]);
                                });
                            resolve([null, allRes]);
                            logsFn.end("Transaction commit success");
                        });
                    }).catch(allErr => {
                        logsFn.end(`Transaction rollback => {${allErr}}`);
                        sqlCom.rollback(() => { resolve([allErr, null]); });
                    });
                    //释放连接
                    sqlCom.release();
                });
            });
        });
    }
    /**
     *
     * @param option
     */
    select(option) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = yield this.parseSelectSql(option);
            if (option.build)
                return sql;
            return yield this.execsql(sql);
        });
    }
    /**
     *
     * @param option
     */
    findOne(option) {
        return __awaiter(this, void 0, void 0, function* () {
            option.limit = [1];
            let sql = yield this.parseSelectSql(option);
            if (option.build)
                return sql;
            let [err, data] = yield this.execsql(sql);
            if (err)
                return [err, null];
            return [null, data[0] || {}];
        });
    }
    /**
     *
     * @param option
     */
    add(option) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = yield this.parseInsertSql(option);
            if (option.build)
                return sql;
            return yield this.execsql(sql);
        });
    }
    /**
     *
     * @param option
     */
    update(option) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!util_1.isObject(option.values))
                return ["The values type must be an object", null];
            if (!option.where)
                return ["The where parameter is missing", null];
            let sql = yield this.parseUpdateSql(option);
            if (option.build)
                return sql;
            return yield this.execsql(sql);
        });
    }
    /**
     *
     * @param option
     */
    updateMany(option) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(option.values))
                return ["The values type must be an array", null];
            if (!option.where)
                return ["The where parameter is missing", null];
            let sql = yield this.parseUpdateManySql(option);
            if (option.build)
                return sql;
            return yield this.execsql(sql);
        });
    }
    polyType(option) {
        return __awaiter(this, void 0, void 0, function* () {
            let sql = yield this.parseFindTypeSql(option);
            if (option.build)
                return sql;
            return yield this.execsql(sql);
        });
    }
    count(option) {
        return this.polyType(Object.assign(Object.assign({}, option), { type: 'count' }));
    }
    min(option) {
        return this.polyType(Object.assign(Object.assign({}, option), { type: 'min' }));
    }
    max(option) {
        return this.polyType(Object.assign(Object.assign({}, option), { type: 'max' }));
    }
    sum(option) {
        return this.polyType(Object.assign(Object.assign({}, option), { type: 'sum' }));
    }
    avg(option) {
        return this.polyType(Object.assign(Object.assign({}, option), { type: 'avg' }));
    }
    /**
     * 分页查询
     * @param option
     */
    pageSelect(option) {
        return __awaiter(this, void 0, void 0, function* () {
            let clone = this.clone(option);
            let [err, data] = yield this.select(Object.assign(Object.assign({ limit: [1, 30] }, option), { build: false }));
            if (err)
                return [err, null];
            let o = Object.assign(Object.assign({}, clone), { typeField: "*", type: "count" });
            delete o.limit;
            let [err1, data1] = yield this.count(o);
            if (err1)
                return [err, null];
            let count = data1[0] ? data1[0].count : 0;
            return [null, { code: 200, mssage: "success", count: count, data: data }];
        });
    }
    /**
     * 查询后添加=》按where条件查询不存在则添加，否则不添加
     * @param option
     * @param where
     */
    thenAdd(option, where) {
        return __awaiter(this, void 0, void 0, function* () {
            let values = option.values;
            delete option.values;
            let [err, data] = yield this.select(Object.assign(Object.assign({}, option), { where: where, build: false }));
            if (err)
                return [err, null];
            if (Array.isArray(data) && data.length) {
                return [null, { type: "exist", data: "" }];
            }
            let [err1, data1] = yield this.add(Object.assign(Object.assign({}, option), { values, build: false }));
            if (err1)
                return [err, null];
            return [null, { type: "add", data: data1.insertId }];
        });
    }
    /**
     *  查询后更新=》按where条件查询不符合的,则更新，否则不更新
     * @param option
     * @param where
     */
    thenUpdate(option, where) {
        return __awaiter(this, void 0, void 0, function* () {
            let updateWhere = option.where;
            let values = option.values;
            delete option.where;
            delete option.values;
            let [err, data] = yield this.select(Object.assign(Object.assign({}, option), { where: where, build: false }));
            if (err)
                return [err, null];
            if (Array.isArray(data) && data.length) {
                return [null, { type: "exist", data: "" }];
            }
            let [err1, data1] = yield this.update(Object.assign(Object.assign({}, option), { where: updateWhere, values, build: false }));
            if (err1)
                return [err, null];
            return [null, { type: "update", data: data1.affectedRows }];
        });
    }
    // 删除
    delete(option) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!option.where)
                return ["The where parameter is missing", null];
            let sql = yield this.parseDeleteSql(option);
            if (option.build)
                return sql;
            return yield this.execsql(sql);
        });
    }
}
module.exports = model;
