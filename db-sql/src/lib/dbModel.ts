
import dbParse from "./dbParse"
import mysql, { ConnectionConfig, Pool as IPool } from "mysql"
import { IselectParse, IinsertParse, IupdateParse, IupdateMany, IpolyTypeParse, Iobject ,IdeleteParse} from "./interface"
import { isObject } from "./util"
type IpolyType = Omit<IpolyTypeParse, "type">

interface IdbConfig extends ConnectionConfig {
    showSql?: boolean
}
class model extends dbParse {
    /**
     * 
     */
    public showSql: boolean = true

    /**
     * 
     */
    public pool: IPool
    /**
     * 
     * @param dbconfig 
     */
    constructor(dbconfig: IdbConfig) {
        super()
        this.pool = mysql.createPool({
            "host": dbconfig.host || '127.0.0.1',
            "user": dbconfig.user || 'root',
            "password": dbconfig.password || '',
            "port": dbconfig.port || 3306,//端口
            "database": dbconfig.database,
            "debug": dbconfig.debug || false
        })
        this.showSql = dbconfig.showSql || true
    }
    /**
     * 
     * @param str 
     * @param type 
     */
    logs(str?: any, type = "info") {
        if (str) {
            type === "error" ? console.log(`\u001b[31m [${new Date().toLocaleString()}]：${str} \u001b[32m`) : console.log(`\u001b[31m ${str} \u001b[39m`);;
        }
        let nowtime: number;
        return {
            start: () => {
                nowtime = new Date().getTime();
            },
            end: (logs: any) => {
                let dalyTime = new Date().getTime() - nowtime
                console.log(`\u001b[32m[${new Date().toLocaleString()}]: ${logs}; 耗时：${dalyTime}ms \u001b[32m`);

            }
        }
    }
    clone(data: object) {
        return JSON.parse(JSON.stringify(data))
    }
    /**
     * // 转义
     * @param value:any 
     */
    escape(value: any) {
        return mysql.escape(value)
    }

    /**
     * 创建连接
     */
    async getConntion() {
        return new Promise((resolve: (value: any) => void) => {
            this.pool.getConnection((err: mysql.MysqlError, sqlCom: mysql.PoolConnection) => {
                if (err) return resolve([`Connection  Fail` + err, null])
                resolve([null, sqlCom])
            })
        })
    }
    /**
     * 
     * @param SQL 
     * @param data 
     */
    async execsql(SQL: string, data = []) {
        return new Promise((resolve: (value: any) => void) => {
            let logsFn = this.logs();
            logsFn.start()
            this.pool.getConnection((conErr: mysql.MysqlError, sqlCom: mysql.PoolConnection) => {
                if (conErr) {
                    this.logs(`Connection  Fail：` + conErr, "error")
                    return resolve([`Connection  Fail：` + conErr, null])
                }
                let queryRes = sqlCom.query(SQL, data, (qErr, res) => {
                    sqlCom.release();
                    if (qErr) {
                        this.logs(`SQL  Error: 【 ${SQL} 】  ` + qErr, "error")
                        return resolve(["SQL  Error: 【" + SQL + "】  " + qErr, null]);
                    }
                    resolve([null, res])
                })
                logsFn.end(`SQL=>[ ${queryRes.sql}]`)

            })
        })

    }
    /**
     * 
     * @param sqlArr 事务处理
     */
    transaction(sqlArr: any[]) {
        return new Promise((resolve: (value: any) => void) => {
            this.pool.getConnection((conErr: mysql.MysqlError, sqlCom: mysql.PoolConnection) => {
                if (conErr) {
                    this.logs(`Connection  Fail：` + conErr, "error")
                    return resolve([`connection Fail: ` + conErr, null])
                }
                // 执行sql
                let logsFn = this.logs();
                logsFn.start()
                sqlCom.beginTransaction(transErr => {
                    if (transErr) {
                        this.logs(`BeginTransaction  Fail：` + transErr, "error")
                        return resolve([`BeginTransaction Fail: ` + conErr, null])
                    }
                    let sqlRes = sqlArr.map(itme => {
                        return new Promise((rev: (value: any) => void, rej: (value: any) => void) => {
                            let [sql, value] = ['', []];
                            if (typeof itme === "string") {
                                sql = itme
                            } else if (Array.isArray(itme)) {
                                sql = itme[0]
                                value = itme[1] || [];
                            }
                            // 执行sql
                            let slogs = this.logs();
                            slogs.start()
                            let queryRes = sqlCom.query(sql, value, (qErr, res) => {
                                if (qErr) return sqlCom.rollback(() => {
                                    this.logs(`SQL  Error: 【 ${sql} 】  ` + qErr, "error")
                                    rej("SQL  Error: 【" + sql + '】  ' + qErr);
                                })
                                rev(res)
                            })
                            slogs.end(` SQL=>[${queryRes.sql}]`)

                        })
                    })
                    // 如果有一个执行报错，则回滚事务,否侧提交事务
                    Promise.all(sqlRes).then(allRes => {
                        sqlCom.commit(err => {
                            if (err) return sqlCom.rollback(() => {
                                this.logs(`Transaction Commit Fail  ` + err, "error")
                                resolve([err, null])
                            })
                            resolve([null, allRes])
                            logsFn.end("Transaction commit success")
                        })
                    }).catch(allErr => {
                        logsFn.end(`Transaction rollback => {${allErr}}`)
                        sqlCom.rollback(() => { resolve([allErr, null]) })
                    })
                    //释放连接
                    sqlCom.release();
                })
            })
        })
    }
    /**
     * 
     * @param option 
     */
    async select(option: IselectParse) {
        let sql = await this.parseSelectSql(option)
        if (option.build) return sql
        return await this.execsql(sql)
    }
    /**
     * 
     * @param option 
     */
    async findOne(option: IselectParse) {
        option.limit = [1]
        let sql = await this.parseSelectSql(option)
        if (option.build) return sql
        let [err, data] = await this.execsql(sql)
        if (err) return [err, null]
        return [null, data[0] || {}]
    }
    /**
     * 
     * @param option 
     */
    async add(option: IinsertParse) {
        let sql = await this.parseInsertSql(option)
        if (option.build) return sql
        return await this.execsql(sql)
    }
    /**
     * 
     * @param option 
     */
    async update(option: IupdateParse) {
        if (!isObject(option.values)) return ["The values type must be an object", null]
        if (!option.where) return ["The where parameter is missing", null]
        let sql = await this.parseUpdateSql(option)
        if (option.build) return sql
        return await this.execsql(sql)
    }
    /**
     * 
     * @param option 
     */
    async updateMany(option: IupdateMany) {
        if (!Array.isArray(option.values)) return ["The values type must be an array", null]
        if (!option.where) return ["The where parameter is missing", null]
        let sql = await this.parseUpdateManySql(option)
        if (option.build) return sql
        return await this.execsql(sql)
    }
    protected async polyType(option: IpolyTypeParse) {
        let sql = await this.parseFindTypeSql(option)
        if (option.build) return sql
        return await this.execsql(sql)
    }
    count(option: IpolyType) {
        return this.polyType({ ...option, type: 'count' })
    }
    min(option: IpolyType) {
        return this.polyType({ ...option, type: 'min' })
    }
    max(option: IpolyType) {
        return this.polyType({ ...option, type: 'max' })
    }
    sum(option: IpolyType) {
        return this.polyType({ ...option, type: 'sum' })
    }
    avg(option: IpolyType) {
        return this.polyType({ ...option, type: 'avg' })
    }
    /**
     * 分页查询
     * @param option 
     */
    async pageSelect(option: IselectParse) {
        let clone = this.clone(option)
        let [err, data] = await this.select({limit:[1,30],...option, build: false })
        if (err) return [err, null]
        let o = { ...clone, typeField: "*", type: "count" }
        delete o.limit;
        let [err1, data1] = await this.count(o)
        if (err1) return [err, null]
        let count = data1[0] ? data1[0].count : 0
        return [null, { code: 200, mssage: "success", count: count, data: data }]
    }
    /**
     * 查询后添加=》按where条件查询不存在则添加，否则不添加
     * @param option 
     * @param where 
     */
    async thenAdd(option: IinsertParse, where: Iobject) {
        let values = option.values
        delete option.values
        let [err, data] = await this.select({ ...option, where: where, build: false })
        if (err) return [err, null]
        if (Array.isArray(data) && data.length) {
            return [null, { type: "exist", data: "" }]
        }
        let [err1, data1] = await this.add({ ...option, values, build: false })
        if (err1) return [err, null]
        return [null, { type: "add", data: data1.insertId }]

    }
    /**
     *  查询后更新=》按where条件查询不符合的,则更新，否则不更新
     * @param option 
     * @param where 
     */
    async thenUpdate(option: IupdateParse, where: Iobject) {
        let updateWhere = option.where
        let values = option.values;
        delete option.where
        delete option.values
        let [err, data] = await this.select({ ...option, where: where, build: false })
        if (err) return [err, null]

        if (Array.isArray(data) && data.length) {
            return [null, { type: "exist", data: "" }]
        }
        let [err1, data1] = await this.update({ ...option, where: updateWhere, values, build: false })
        if (err1) return [err, null]
        return [null, { type: "update", data: data1.affectedRows }]
    }

    // 删除
    async delete(option:IdeleteParse){
        if (!option.where) return ["The where parameter is missing", null]
        let sql = await this.parseDeleteSql(option)
        if (option.build) return sql
        return await this.execsql(sql)
    }

}
export = model