import { Iobject, ItypeMinx, ItableParse, IwhereParse, IlimitParse, IorderParse, IgroupParse, IfieldParse, IjoinOpt, IselectParse, IinsertParse, IdeleteParse, IupdateParse, IupdateMany, IpolyTypeParse } from "./interface";
declare class Dbparse {
    /**
     *
     * @param val
     */
    parseExplain(val: string): string;
    /**
     *
     * @param val
     */
    parseDistinct(val: string): string;
    /**
     *
     * @param val
     * 表名设置
     * 示例： string=> "table1"
     *        string[]:['table1','table2']=>'table1,table2'
     *
     */
    parseTable(val: ItableParse): string;
    /**
     *
     * @param data
     *
     * set 字段设置，添加修改
     * 示例： {name:"小明",age:12} =》 set name='小明',age='12'
     */
    parseSet(data: Iobject): string;
    /**
     *
     * @param data :字段
     * 示例：1 string: => "id,name"
     *      2. object: 加别名： {id:id,name:name}=> 'id as id,name as name'
     *      3. string[]: [id,name] => "id,name"
     */
    parseField(data?: IfieldParse): string;
    /**
     *
     * @param data
     */
    parseWhere(data: IwhereParse): string;
    /**
     *
     * @param {*} option
     */
    getWhereMinx(val: ItypeMinx): string;
    /**
     *
     * @param key
     * @param val
     */
    parseWhereItme(key: string, val: any): string;
    parseJoin(opt: IjoinOpt): string;
    parseGroup(opt: IgroupParse): string;
    parseHaving(opt: ItypeMinx): string;
    /**
     *
     *@param {sring|object|array} opt
     *@param {string}: "name desc"
     *@param {array}  ['name desc","id asc"]
     *@param {object}  {"name":'desc',id:"asc"}
     */
    parseOrder(opt: IorderParse): string;
    /**
       *
       * @param {string|object|arrAry} opt
       * @param {string} "2,10" 10
       * @param {object} {"page":0,"offset":10}
       * @param {arrAry} [1,]
       * 参数一个：代表个数
       * 参数两个：第一个代表页数，第二个代表个数(整数)，（如果第二个参数小于0，第一个参数为个数）
       */
    parseLimit(opt: IlimitParse): string;
    parseUnion(opt: string): string;
    parseLock(opt: string): string;
    parseComment(opt: string): string;
    /**
     *
     * @param {*} sql
     * @param {*} opt {where,limit}
     */
    parseBuildSql(sql: string, opt: Iobject): string;
    parseSelectSql(opt: IselectParse): string;
    /**
     *
     * @param opt
     *
     * table:string,replace:boolean,values:object|object[]|
     *
     */
    parseInsertSql(opt: IinsertParse): string;
    /**
     *
     * @param {*} opt
     * 删除：table,where,order,limit(参数只能是一个,否则sql 报错， 如：limit 1；不能limit 1,1)
     */
    parseDeleteSql(opt: IdeleteParse): string;
    /**
     *
     * @param opt
     * 更新：table,values,where,order limit
     */
    parseUpdateSql(opt: IupdateParse): string;
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
    parseUpdateManySql(opt: IupdateMany): string;
    /**
     *
     * @param opt
     * 聚合函数：table,type,typeField,field?,join?,where?, group?, having?,order?,limit?
     */
    parseFindTypeSql(opt: IpolyTypeParse): string;
    /**
     *
     * @param val
     */
    getComparsion(val: string): string;
    /**
     *
     * @param val
     * @param _default
     */
    getLogic(val?: string | Iobject, _default?: string): string;
    isLogic(val: unknown): string;
    parseValue(val: any, flag?: string): any;
}
export = Dbparse;
