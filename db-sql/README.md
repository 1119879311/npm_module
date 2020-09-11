db-sql是一个node 操作mysql 增删改查的一个库，使用typescript编写,所以支持typescript,编译后是commonjs 规范，对应也有声明文件，用法简单,依赖模块 mysql,sql的防注入利用的是mysql模块的方法转义，默认是用链接池进行连接
要求 node>7.6 ,使用了 async  方法，所有的方法执行sql操作后，返回的是Primose.resolve([err,data]),err:是错误，data：是执行sql操作的结果

- 查询
    - select()：查所有数据
    - findOne()：查一条数据
    - pageSelect()：分页查询

- 增加
    - add():单个、批量添加 
    - thenAdd(): where条件查询后不存在则添加 

- 更新
    - update():单个更新 
    - updateMany()：批量更新
    - thenUpdate():按where条件查询后数据不存在

- 删除
    - delete():一定要结合where使用

- 聚合函数
    - min()：最小值
    - max():最大值
    - count():总个数
    - sum()：总和
    - avg()：平均数

- 事务
  - transaction():

- 原始方法 
    - execsql()

  - 参数转义
    escape() 

例子：  
```js

let dbModel = require("db-sql");
    // 创建实例
    let db = new dbModel({
        host:"127.0.0.1",
        user:"root",
        password:"123456",
        port:3306,
        database:"thinkjs"
    })
    db.pool.on("connection",function(){
        console.log("连接成功")
    })
    db.pool.on("error",function(){
        console.log("连接失败")
    })
```

注意：返回的是Primose.resolve([err,data]) 

### 1、select():查询数据 ###
```js
 (async ()=>{
    let [err1,data1]= await db.select({table:'tk_tab'}) 
    // sql=>select * from tk_tab
    console.info(err1,data1)
  })()
```

### 2、findOne():查询一条数据 ###
```js
 (async ()=>{
    let [err2,data2]= await db.findOne({table:'tk_tab'})
     // sql=>select * from tk_tab  limit  1
    console.info(err2,data2)
  })()
```

### 3、options.field：{string|array},指定字段查询 ###
```js
 (async ()=>{
   let [err3,data3]= await db.select({table:'tk_tab',field:"id,name"}) 
     // sql=>select id,name from tk_tab
    console.info(err3,data3)
  })()
```


### 4、options.where(option):{string|object|array} 按条件查询 ###
```js
 (async ()=>{
    //(4.1):string
    let [err41,data41]= await db.select({table:'tk_tab',where:"id=1"})
    // sql=>select * from tk_tab  where  id = 1
    console.info(err41,data41)

    //(4.2):object
    let [err42,data42]= await db.select({table:'tk_tab',where:{id:1}})
    // sql=>select * from tk_tab  where  id = 1
    console.info(err42,data42)

    //(4.3):Array：(数组第最后一个元素可以是："or"|“and" 或者是依然是where 字段条件)string|object
    let [err43,data43]= await db.select({table:'tk_tab',where:[{id:1},{id:5},{id:2},"or"]})
    // sql=>select * from tk_tab  where  id = 1 or id=5 or id=3
    console.info(err43,data43)

    //(4.4):option.__logic   or=>或者,and =>且
    let [err44,data44]= await db.select({table:'tk_tab',where:[{id:1,name:'视频',__logic:'or'},{id:2},"or"]})
    // sql=>select * from tk_tab  where  (  id = 1 or   name = '视频'   )  or  (  id = 2   )
    console.info(err44,data44)

    //(4.5):option.__complex   复合查询(相对复杂的)
    let [err45,data45]= await db.select({table:'tk_tab',where:[{id:1,"__logic":"OR",__complex:{name:'视频',id:10}},{id:2},"or"]})
    // sql=>select * from tk_tab  where  ( ( id = 1) or ( name = '视频' and   id = 10 )  )  or  (  id = 2   )
    console.info(err45,data45)

    //(4.6): like,notlike 模糊搜索,字段：值(数组：第一元素是关键词如like,第二个元素是条件值，第三个是or,and 可选，默认or)
    let [err46,data46]= await db.select({table:'tk_tab',where:{name:["like",["%频%",'%诗%'],"and"]}})
    //res=>sql：select * from tk_tab  where  ( name like '%频%' and name like '%诗%' )
    console.info(err46,data46)


    //(4.7):BETWEEN,NOT BETWEEN
    let [err47,data47]= await db.select({table:'tk_tab',where:{id:["BETWEEN",["1","3"]]}})
    //res=>sql： select * from tk_tab  where  ( id  between '1' and '3' );
    console.info(err47,data47)


    //(4.8):IN,NOTIN
    let [err48,data48]= await db.select({table:'tk_tab',where:{id:["IN",["1",2,"3"]]}})
        //res=>sql：select * from tk_tab  where  id in ( '1',2,'3' ) ;
        console.info(err48,data48)

    //(4.9): =,!= ,>,>=,<,<= ;
    let [err49,data49]= await db.select({table:'tk_tab',where:{id:["!=",2]}})
    //res=>sql:select * from tk_tab  where  id  != 2
    console.info(err49,data49)
  })()
```

### 5、options.order:{string|object:array}; 排序：(asc:升，desc：降) ###
```js
 (async ()=>{
    //(1): string=>"name desc";
    //(2):object=>{"name":'desc',id:"asc"};
    //(3):array=>['name desc","id asc"]
    let [err5,data5]= await db.select({table:'tk_tab',order:'id desc'})
    // res=>sql：select * from tk_tab  order by id desc;
    console.log(err5,data5)
  })()
```

### 6、option.limit：{number|string|number[]|{page:number,offset:number}} 查询指定限制个数 ###
- 一个参数(offset): 从第一条开始 查 offset 条
- -两个参数(page,offset)：page:从第(page-1)*offset 条开始，查 offset 条
```js
 (async ()=>{
    // (1).string:"2,10";
    // (2).object:{"page":0,"offset":10};
    // (3).array:[3,2]
    let [err6,data6]= await db.select({table:'tk_tab',limit:[3,2]})
    // res=>sql：select * from tk_tab  limit 4,2;
    console.log(err6,data6)
  })()
```

### 7、options.group:{string};分组 ###
```js
 (async ()=>{
    let [err7,data7]= await db.select({table:'tk_tab',field:'status',group:"status"})
    // res=>sql:select status from tk_tab  group by status
    console.log(err7,data7)
  })()
```

###  8、 options.hvaing:结合group 方法一起，用法和 where一样  ### 
```js
 (async ()=>{
    let [err8,data8]= await db.select({table:'tk_tab',field:'status',group:"status",having:{ status:1}})
    //res=>sql:select status from tk_tab  group by status  having  status = 1
    console.log(err8,data8)
  })()
```

###  9、options.join:string|object|array;连接查询:分为左右连接，内连接  ### 
```js
 (async ()=>{

    //(9.1).string： "right join tk_cate as c on a.cid=c.id"
    let [err91,data91]= await db.select({table:'tk_article as a',join:'left join tk_cate as c on a.cid=c.id'})
    //res=>sql：select * from tk_article as a left join tk_cate as c on a.cid=c.id;
    console.log(err91,data91)


    //(9.2).object：{table,join,on}=>{table:"tk_cate as c",join:"right",on:"a.cid=c.id"}
    let [err92,data92]= await db.select({table:'tk_article as a',join:{table:"tk_cate as c",join:"left",on:"a.cid=c.id"}})
    //res=>sql：select * from tk_article as a left join tk_cate as c on a.cid=c.id;
    console.log(err92,data92)

    //(9.3).array:[string|object],多个join ,可用数组
    let [err93,data93]= await db.select({table:'tk_tab_article as at',join:
        [
            {table:"tk_article as a",join:"left",on:"at.a_id=a.id"},
            {table:"tk_tab as t",join:"left",on:["at.t_id","t.id"]}
        ] })
    //res=>sql:select * from tk_tab_article as at left join tk_article as a on at.a_id=a.id left join tk_tab as t on at.t_id = t.id
    console.log(err93,data93)
```

### 10、 options.distinct:string,去重字段  ### 
```js
 (async ()=>{

     let [err10,data10]= await db.select({table:'tk_tab',field:'name',distinct:"name"})
    // res=>sql: select distinct  name from tk_tab
    console.log(err10,data10)

  })()
```

###  101、options.build:直接返回sql语句，不是[err,data] 数组形式  ### 
```js
 (async ()=>{

    let sql101= await db.select({table:'tk_tab',field:'id,name',build:true})
    let sql102= await db.update({table:'tk_tab',values:{name:"465789"},where:{id:60},build:true})

  })()
```

###  11、add()：values:{string|object|array },添加数据，单条、批量  ### 
```js
 (async ()=>{

   let [err11_1,data11_1]= await db.add({table:'tk_tab',values:{name:"tab-1",createtime:new Date().getTime()}});
    // res=>sql: insert into tk_tab  set name='tab-1',createtime=1599804955469
    console.log(err11_1,data11_1)

    let [err11_2,data11_2]= await db.add({table:'tk_tab',values:
        [{name:"tab-2",createtime:new Date().getTime()},
        {name:"tab-3",createtime:new Date().getTime()}]
    })
    // res=>sql: insert into tk_tab  ( name,createtime ) values ('tab-2',1599804955476) , ('tab-3',1599804955476)
    console.log(err11_2,data11_2)
   
  })()
```


### 12、update():values=>object;更新数据单条,为了防止更新全部，必须要写where 条件，where 为true 忽略更新条件  ### 
```js
 (async ()=>{

    let [err12_1,data12_1]= await db.update({table:'tk_tab',values:{status:0},where:true}) ;//更新全部，
    //res=>sql:update tk_tab  set status=0
    console.info(err12_1,data12_1)

    let [err12_2,data12_2]= await db.update({table:'tk_tab',values:{status:1},where:{id:[">",10]}}) ;
    //res=>sql:update tk_tab  set status=1  where  id  > 10
    console.info(err12_2,data12_2)
   
  })()
```

### 13、updateMany():values=>object[];批量更新,where=>{key:string}指定更新条件的字段如id ### 
```js
 (async ()=>{

    let [err13,data13]= await db.updateMany({table:'tk_tab',values:[{id:26,name:"tab1-1",status:2},{id:27,name:"tab2-1",status:2}],where:{key:'id'}}) 
    //res=>sql:update tk_tab set  name = case id  when 26 then  'tab1-1'   when 27 then  'tab2-1'  end , status = case id  when 26 then  2   when 27 then  2  end  where  id in (26,27)
    console.info(err13,data13)
   
  })()
```

### 14、delete() 删除,为了防止误操作，where 添加必须加上，where 为true 忽略删除条件 ### 
```js
 (async ()=>{

    let [err14_2,data14_2]= await db.delete({table:'tk_tab',where:true});//删除全部
    let [err14_1,data14_1]= await db.delete({table:'tk_tab',where:{id:14}});//条件删除
    //res=>sql: delete from tk_tab where  id  > 14
    console.log(err14_1,data14_1)
   
  })()
```

### 15、聚合函数 ### 
```js
 (async ()=>{

    //15.1 count 统计总个数; options.typeField:要统计的字段
        let [err15_1,data15_1] = await db.count({table:"tk_juzihui",field:"id",typeField:"*",group:"classify"})
        //res=>sql:select  id,  count(*) as count  from tk_juzihui  group by classify
        console.info(err15_1,data15_1)

        //15.2 max 查最大值
        let [err15_2,data15_2] = await db.max({table:"tk_juzihui",field:"id",typeField:"id",group:"classify"})
        //res=>sql:select  id,  max(id) as max  from tk_juzihui  group by classify
        console.info(err15_2,data15_2)

        //15.3 min 查最小值
        let [err15_3,data15_3] = await db.min({table:"tk_juzihui",field:"id",typeField:"id",group:"classify"})
        //res=>sql:select  id,  min(id) as min  from tk_juzihui  group by classify
        console.info(err15_3,data15_3)

        //15.4 sum 总和
        let [err15_4,data15_4] = await db.sum({table:"tk_juzihui",field:"id",typeField:"id",group:"classify"})
        //res=>sql:select  id,  sum(id) as sum  from tk_juzihui  group by classify
        console.info(err15_4,data15_4)
        
        //15.5 求平均数
        let [err15_5,data15_5] = await db.avg({table:"tk_juzihui",field:"id",typeField:"id",group:"classify"})
        //res=>sql: select  id,  avg(id) as avg  from tk_juzihui  group by classify
        console.info(err15_5,data15_5)
   
  })()
```

### 16、thenAdd(options,where) 查询后结果不存在则添加,were:是查询的条件 ### 
```js
 (async ()=>{

    let [err16,data16] =await db.thenAdd({table:"tk_tab",values:{name:"tab-987654",createtime:new Date().getTime()}},{name:"tab-987654"})
    //res=>sql1:select * from tk_tab  where  name = 'tab-987654'
    //     sql2:insert into tk_tab  set name='tab-987654',createtime=1699804955469
    console.info(err16,data16)
   
  })()
```

### 17、thenUpdate(options,where) 按where条件查询后不存在则更新 ### 
```js
 (async ()=>{

    console.log("----------thenUpdate")
    let [err17,data17] =await db.thenUpdate({table:"tk_tab",values:{name:"视频"},where:{id:2}},{id:["!=",2],name:"视频"})
    //res=>sql:select * from tk_tab  where  id  != 46  and   name = '视频-1' 
    //     sql:update tk_tab  set name='视频-1'  where  id = 2 
    console.info(err17,data17)
   
  })()
```

### 18、 pageSelect() 分页查询 ，默认limit:[1,30]第一页，每页30条 ### 
```js
 (async ()=>{
   let [err18_1,data18_1] = await db.pageSelect({table:"tk_tab",where:{status:1},limit:[1,15]})
    let [err18_2,data18_2] = await db.pageSelect({
        table:"tk_article as a",
        field:"a.*",
        join:[{join:'left',table:"tk_cate as c",on:"c.id = a.cid"} ],
        order:{[`a.sort`]:"desc",[`a.id`]:"desc",[`a.readcount`]:"desc"},
        limit:[2,2],
        where:[{"a.title|a.remark|c.name":["like",`%js%`]},{"a.status":1},"or"]
    })
    console.info(err18_1,data18_1)
    console.info(err18_2,data18_2)
   
  })()
```

### 19、transaction(sqlArr);事务执行 ### 
```js
 (async ()=>{
    //  演示帖子与标签的一对多的关系，删除标签，连同中间表也要删除（先删中间表，再删主表）
    let sql19_1 = await db.delete({table:"tk_tab",where:{id:8},build:true});
    let sql19_2 = await db.delete({table:'tk_tab_article',where:{t_id:8},build:true});
    let [err19,data19] = await db.transaction([sql19_2,sql19_1])
    console.log(err19,data19)
   
  })()
```

### 20、execsql(sql,data)：执行原生sql ### 
```js
 (async ()=>{

    let sql20 = `select * from tk_tab where id=?`;
    let [err20,data20]= await db.execsql(sql20,[1]) 
    console.info(err20,data20)
   
  })()
```


### 21、escape():参数转义，其实就是mysql.escape() ### 
```js
 (async ()=>{
     
    console.log(db.escape({id:"12"}));//`id` = '12'
    console.log(db.escape(`"'id=\fsd\sdfd'"`));//   '\"\'id= sdsdfd\'\"'
   
  })()
```
