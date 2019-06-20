# mysql-model-orm
mysql-model-orm 主要是node 操作mysql 的常用的增删改查的封装，主要特点是用法简单，链式调用，主要实现是利用sql 的特点特点进行sql封装，sql的防注入利用的是mysql 模块的方法转义，不用担心这个，默认是用链接池进行连接，主要的方法都是返回promise 

要求 node>7.6 ,使用了 async  方法

第一类：主要方法：返回promise 
- 查询
    - select()：查所有数据
    - findOne()：查一条数据
    - pageSelect()：分页查询

- 增加
    - add(option):单个、批量添加; {string|object|array} option 
    - thenAdd(data,where): where条件查询后不存在则添加 {object}:data {object}:where

- 更新
    - update(option):单个更新 {object} option
    - updateMany(data,options)：批量更新,{object}:data 更新的数据;{object}:options:更新的条件
    - thenUpdate(data,where):按where条件查询后数据不存在,则更新:{object}:data 更新的数据;{object}:where:查询条件

- 删除
    - delete():一定要结合where使用

- 聚合函数
    - min(filed)：最小值
    - max(filed):最大值
    - count(filed):总个数
    - sum(filed)：总和

- 直接返回 sql(不执行)
    - buildSql()

- 事务
  - transaction(option):{Array}

- 原始方法 
    - execsql()

   参数转义
    escape()  


第二类：辅助添加函数,一定要在主要函数前调用
    - table():表名 （有表前缀的直接写）
    - where();条件
    - field():指定字段
    - limit():限制个数
    - group(): 分组
    - having(): 分组添加;参数用法和where一样
    - distinct():去除重复数据字段

例子：  
```js

let model = require("mysql-model-orm");
 // 创建实例
    var Model = new model({
        "host": "localhost",//主机名/ip
        "user": "root",//用户名
        "password": "",//密码
        "port": 3306,//端口
        "database": "koajs" //连接的库
    })
```

利用trycatch捕获可能出现的错误,因为返回的是promise 也可以用.catch 回调        

### 1、select():查询数据 ###
```js
 (async ()=>{
    await Model.table("tk_tab").select();
  })()
```

### 2、findOne():查询一条数据 ###
```js
 (async ()=>{
     await Model.table("tk_tab").findOne();
  })()
```

### 3、field(val)：{string|array},指定字段查询 ###
```js
 (async ()=>{
    await Model.table("tk_tab").field("id").select();
  })()
```

### 4、where(option):{string|object|array} 按条件查询 ###
```js
 (async ()=>{
    //(1):string
    await Model.table("tk_tab").where("id=1").select(); 
    //  sql=>from tk_tab  where  id = 1 

    //(2):object
    await Model.table("tk_tab").where({id:1}).select(); 
    //sql=>from tk_tab  where  id = 1 

    //(3):array (数组第三个数："or"|“and"),数组第一，二个：string|object
     await Model.table("tk_tab").where([{id:1},{id:3},"or"]).select(); 
    //sql=>sql=>:select * from tk_tab  where  (  id = 1   )  or  (  id = 3   )

    
    //(4):option.__logic   or=>或者,and =>且
    await Model.table("tk_tab").where({id:1,status:1,_logic:"or"}).select(); 
    //sql=>:select * from tk_tab  where  (  id = 1   )  or  (  status = 1  ) 

    //(5):option.__complex   复合查询
    await Model.table("tk_article").where({title:"ai","_logic":"OR",__complex:{"title":"1212","id":["!=","2"]}}).select();
    //res=>sql -: select * from tk_article  where ( title = 'ai') or ( title = '1212' and   id  != '2' )

    //(6): like,notlike
    await Model.table("tk_tab").where({name:["like",["%美%","%音%"]]}).select(); 
    //res=>sql：select * from tk_tab  where  ( name like '%美%' or name like '%音%' ) 

    //(7):BETWEEN,NOT BETWEEN
    await Model.table("tk_tab").where({id:["BETWEEN",["1","3"]]}).select(); 
    //res=>sql： select * from tk_tab  where  ( id  between '1' and '3' );

    //(8):IN,NOTIN
    await Model.table("tk_tab").where({id:["IN",["1",2,"3"]]}).select(); 
    //res=>sql：select * from tk_tab  where  id in ( '1',2,'3' ) ;


    //(9): =,!= ,>,>=,<,<= ;
    await Model.table("tk_tab").where({id:["!=",2]}).select(); 
    //res=>sql：select * from tk_tab  where  id in ( '1',2,'3' ) ;   
  })()
```
### 5、order(val):{string|object:array}; 排序： ###
```js
 (async ()=>{
    //(1): string=>"name desc";
    //(2):object=>{"name":'desc',id:"asc"};
    // (3):array=>['name desc","id asc"]
    await Model.table("tk_tab").order("id desc").select();
    // res=>sql：select * from tk_tab  order by id desc;
  })()
```

### 6、limit(val)：{string|object|arrAry}  查询指定限制个数,page:从第page+1 条开始，查 offset 条 ###
```js
 (async ()=>{
    // (1).string:"2,10";
    // (2).object:{"page":0,"offset":10};
    // (3).array:[1,]
    await Model.table("tk_tab").limit("2,3").select();
    //res=>sql：select * from tk_tab  limit 3,3 
  })()
```


### 6、group(val):{string};分组 ###
```js
 (async ()=>{
    await Model.table("tk_tab").group("status").select();
    //res=>sql：select * from tk_tab  group by status ; 
  })()
```


###  7、hvaing(va;):结合group 方法一起，用法和 where一样  ### 
```js
 (async ()=>{
    await Model.table("tk_tab").group("status").having({status:1}).select();
    //res=>sql：select * from tk_tab  group by status  having  status = 1  
  })()
```

###  8、join(option):string|object|array;连接查询:分为左右连接，内连接  ### 
```js
 (async ()=>{

    //(1).string： "right join tk_cate as c on a.cid=c.id"
     await Model.table("tk_article as a").join({table:"tk_cate as c",join:"right",on:"a.cid=c.id"}).select();
    //res=>sql：select * from tk_article as a right join tk_cate as c on a.cid=c.id;

    //(2).object：{table,join,on}=>{table:"tk_cate as c",join:"right",on:"a.cid=c.id"}
    await Model.table("tk_article as a").join({table:"tk_cate as c",join:"right",on:"a.cid=c.id"}).select();
    //res=>sql：select * from tk_article as a right join tk_cate as c on a.cid=c.id; 

    //(3).array:[string|object],多个join ,可用数组
    await Model.table("tk_article_tab as at").join([
         {table:"tk_article as a",join:"right",on:"at.a_id=a.id"},
         {table:"tk_tab as c",join:"right",on:["at.t_id","t.id"]}
        ]).select();
  })()
```


### 9、 distinct(val):string,去重字段  ### 
```js
 (async ()=>{

   await Model.table("tk_article").distinct("cid").field("id,cid").select()

  })()
```


###  10、add(val)：{string|object|array },添加数据，单条、批量  ### 
```js
 (async ()=>{

    await Model.table("tk_user").add({id:"1",name:"123456"});
    await Model.table("tk_user").add([{id:"1",name:"123456"},{id:"2",name:"123456"}])
   
  })()
```


### 11、update(data,where),更新数据单条  ### 
```js
 (async ()=>{

    await Model.table("tk_user").where({id:1}).update({name:"465789"});
    await Model.table("tk_user").update({name:"465789"},{id:1});
   
  })()
```

### 12、updateMany(data,{key:更新条件字段}) 批量更新 ### 
```js
 (async ()=>{

    await Model.table("tk_user").updateMany([{id:"1",name:"123456"},{id:"2",name:"123456"}],{key:"id"});
   
  })()
```


### 13、 delete() 删除 ### 
```js
 (async ()=>{

    await Model.table("tk_user").where({id:1}).delete();//条件删除
    await Model.table("tk_user").where(true).delete();//删除全部
   
  })()
```

### 14、thenAdd(data,where) 查询后不存在则添加 ### 
```js
 (async ()=>{

    await Model.table("tk_user").thenAdd({name:"123456"},{name:"654321"});
    // return  {type:"exist",id:""} 或者 {type:"add",id:insertId};
   
  })()
```



### 15、thenUpdate(data,where)) 查询后不存在则更新 ### 
```js
 (async ()=>{
    //  更新id=1的字段name，如果查询name=123456  如果不存在更新否则返回提示存在
    await Model.table("tk_user").where({id:1}).thenUpdate({name:"123456"},{name:"123456"});
    //return  {type:"exist",id:""} 或者 {type:"update",id:""}
   
  })()
```



### 16、 pageSelect() 分页查询 ### 
```js
 (async ()=>{
    await Model.table("tk_user").pageSelect(1,10);
    //return {code:200,mssage:"success",count:count,data:res}
   
  })()
```

          
### 17、buildSql();直接返回sql语句 ### 
```js
 (async ()=>{
    await Model.table("tk_user").field("id,name").where({id:1}).buildSql().select();
    await Model.table("tk_user").where({id:1}).buildSql().update({name:"465789"})
   
  })()
```

### 18、transaction(option);事务执行 ### 
```js
 (async ()=>{
    //  演示帖子与标签的一对多的关系，删除标签，连同中间表也要删除
    var sql1 =  await Model.table("tk_tab").where({id:1}).buildSql().delete();
    var sql2 = await Model.table("tk_article_tab").where({t_id:1}).buildSql().delete();
    await transaction([sql1,sql2])
    //还可以其他方式写sql ,传值参数方式
    //(1)  await transaction([{sql,value},{sql,value}])
    //(2)  await transaction([[sql,value],[sql,value]])
   
  })()
```

### 19、execsql(sql,option=[]);支持原生sql执行 ### 
```js
 (async ()=>{
    var sql = `select * from tk_user where id=?`;
    await Model.execsql(sql,[1]);
   
  })()
```
