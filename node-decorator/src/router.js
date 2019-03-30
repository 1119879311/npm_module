"use strict";
const {resolve}  = require("path");
const fs = require("fs");
let entryPath = process.env.NODE_ENV==="development"?"src":"dist";
console.log(process.env.NODE_ENV+"环境:执行目录"+entryPath)
let ctrPath = resolve(entryPath,'controller');
module.exports = (app)=>{
    let  loadCtr = (rootPaths)=>{
        try {
            var allfile = fs.readdirSync(rootPaths);   
            allfile.forEach((file)=>{
                var filePath = resolve(rootPaths,file)
                if(fs.lstatSync(filePath).isDirectory()){
                    loadCtr(filePath)
                }else{
                  let r =  require(filePath);
                  if(r&&r.router&&r.router.routes){
                      try {
                        app
                        .use(r.router.routes())
                      } catch (error) {
                          console.log(filePath)
                      }
                  }else{
                      // console.log("miss routes:--filename:"+filePath)
                  }
                }
            }) 
        } catch (error) {
            console.log(error)
            console.log("no such file or dir :---- "+rootPaths)
        } 
    }
    loadCtr(ctrPath);
}