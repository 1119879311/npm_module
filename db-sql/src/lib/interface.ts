export interface Iobject {
    [key:string]:any
}
//联合类型
export type ItypeMinx = string|Iobject|string[]|Iobject[]

export type ValueKey<T, V> = { 
        [k in keyof T]: T[k] extends V ? k : never
    }[keyof T];

export type IselectType = "count"|"min"|"max"|"avg"|"sum"

export type ItableParse = string|string[]
export type IwhereParse = boolean|ItypeMinx


export type IlimitParse =number|string|number[]|{page:number,offset:number} 
export type IorderParse = string|Iobject|string[]
export type IgroupParse = string
export type IfieldParse = string|Iobject|string[]
export type IvaluesParse = Iobject|Iobject[] 
export interface IjoinParse  {
    table:string,
    join:string,
    on:string|string[]
}
export type IjoinOpt = string|string[]|IjoinParse|IjoinParse[]
export interface IparseCom{
    table:ItableParse
    distinct?:string
    where?:IwhereParse
    join?:IjoinOpt
    limit?:IlimitParse
    having?:ItypeMinx
    order?:IorderParse
    group?:IgroupParse
    field?:IfieldParse
    build?:boolean
    values: IvaluesParse 
}

export interface IparseTypeCom extends IparseCom {
    type: IselectType;
    typeField:string
}

//查询
export type IselectParse = Omit<IparseCom,'values'>

//添加
export interface IinsertParse {
    table:string
    values:Iobject|Iobject[]
    replace?:boolean
    build?:boolean  
}
//删除
export type IdeleteParse = Pick<IparseCom,"table"|"where"|"order"|"limit"|"build">  

// 更新
export type IupdateParse = Pick<IparseCom,"table"|"values"|"where"|"order"|"limit"|"build">

// 批量更
export interface IupdateMany {
    table:string
    values:Iobject|Iobject[]
    where:{key:string}
    build?:boolean  
}

// 聚合函数
export type IpolyTypeParse = Omit<IparseTypeCom,"values">


