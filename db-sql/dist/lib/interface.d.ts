export interface Iobject {
    [key: string]: any;
}
export declare type ItypeMinx = string | Iobject | string[] | Iobject[];
export declare type ValueKey<T, V> = {
    [k in keyof T]: T[k] extends V ? k : never;
}[keyof T];
export declare type IselectType = "count" | "min" | "max" | "avg" | "sum";
export declare type ItableParse = string | string[];
export declare type IwhereParse = boolean | ItypeMinx;
export declare type IlimitParse = number | string | number[] | {
    page: number;
    offset: number;
};
export declare type IorderParse = string | Iobject | string[];
export declare type IgroupParse = string;
export declare type IfieldParse = string | Iobject | string[];
export declare type IvaluesParse = Iobject | Iobject[];
export interface IjoinParse {
    table: string;
    join: string;
    on: string | string[];
}
export declare type IjoinOpt = string | string[] | IjoinParse | IjoinParse[];
export interface IparseCom {
    table: ItableParse;
    distinct?: string;
    where?: IwhereParse;
    join?: IjoinOpt;
    limit?: IlimitParse;
    having?: ItypeMinx;
    order?: IorderParse;
    group?: IgroupParse;
    field?: IfieldParse;
    build?: boolean;
    values: IvaluesParse;
}
export interface IparseTypeCom extends IparseCom {
    type: IselectType;
    typeField: string;
}
export declare type IselectParse = Omit<IparseCom, 'values'>;
export interface IinsertParse {
    table: string;
    values: Iobject | Iobject[];
    replace?: boolean;
    build?: boolean;
}
export declare type IdeleteParse = Pick<IparseCom, "table" | "where" | "order" | "limit" | "build">;
export declare type IupdateParse = Pick<IparseCom, "table" | "values" | "where" | "order" | "limit" | "build">;
export interface IupdateMany {
    table: string;
    values: Iobject | Iobject[];
    where: {
        key: string;
    };
    build?: boolean;
}
export declare type IpolyTypeParse = Omit<IparseTypeCom, "values">;
