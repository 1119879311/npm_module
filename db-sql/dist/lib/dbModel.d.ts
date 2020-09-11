import dbParse from "./dbParse";
import { ConnectionConfig, Pool as IPool } from "mysql";
import { IselectParse, IinsertParse, IupdateParse, IupdateMany, IpolyTypeParse, Iobject, IdeleteParse } from "./interface";
declare type IpolyType = Omit<IpolyTypeParse, "type">;
interface IdbConfig extends ConnectionConfig {
    showSql?: boolean;
}
declare class model extends dbParse {
    /**
     *
     */
    showSql: boolean;
    /**
     *
     */
    pool: IPool;
    /**
     *
     * @param dbconfig
     */
    constructor(dbconfig: IdbConfig);
    /**
     *
     * @param str
     * @param type
     */
    logs(str?: any, type?: string): {
        start: () => void;
        end: (logs: any) => void;
    };
    clone(data: object): any;
    /**
     * // 转义
     * @param value:any
     */
    escape(value: any): string;
    /**
     * 创建连接
     */
    getConntion(): Promise<any>;
    /**
     *
     * @param SQL
     * @param data
     */
    execsql(SQL: string, data?: never[]): Promise<any>;
    /**
     *
     * @param sqlArr 事务处理
     */
    transaction(sqlArr: any[]): Promise<any>;
    /**
     *
     * @param option
     */
    select(option: IselectParse): Promise<any>;
    /**
     *
     * @param option
     */
    findOne(option: IselectParse): Promise<string | any[]>;
    /**
     *
     * @param option
     */
    add(option: IinsertParse): Promise<any>;
    /**
     *
     * @param option
     */
    update(option: IupdateParse): Promise<any>;
    /**
     *
     * @param option
     */
    updateMany(option: IupdateMany): Promise<any>;
    protected polyType(option: IpolyTypeParse): Promise<any>;
    count(option: IpolyType): Promise<any>;
    min(option: IpolyType): Promise<any>;
    max(option: IpolyType): Promise<any>;
    sum(option: IpolyType): Promise<any>;
    avg(option: IpolyType): Promise<any>;
    /**
     * 分页查询
     * @param option
     */
    pageSelect(option: IselectParse): Promise<any[]>;
    /**
     * 查询后添加=》按where条件查询不存在则添加，否则不添加
     * @param option
     * @param where
     */
    thenAdd(option: IinsertParse, where: Iobject): Promise<any[]>;
    /**
     *  查询后更新=》按where条件查询不符合的,则更新，否则不更新
     * @param option
     * @param where
     */
    thenUpdate(option: IupdateParse, where: Iobject): Promise<any[]>;
    delete(option: IdeleteParse): Promise<any>;
}
export = model;
