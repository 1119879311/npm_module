"use strict";
const path = require("path");
const fs = require("fs");
const koa_Router = require("koa-router");
const registerRouter = require("./Lib/decorator/registerRouter");
const koaRouter = new koa_Router({
    prefix: "/api"
});

const Controller = "Controller";
const entryCtr = path.resolve(getEntryRoot(), Controller);

function getEntryRoot() {
    let entryRoot = __dirname.split("\\");
    let proRoot = process.cwd().split("\\");
    if (entryRoot.length == proRoot.length) {
        return __dirname;
    }
    return [...proRoot, entryRoot[proRoot.length]].join("\\");
}

module.exports = (app) => {
    const loadinCtr = (entryPath) => {
        try {
            let allFile = fs.readdirSync(entryPath);
            allFile.forEach((file) => {
                let filePath = path.resolve(entryPath, file);
                if (fs.lstatSync(filePath).isDirectory()) {
                    loadinCtr(filePath);
                }
                else {
                    let serviceCtr = require(filePath);
                    registerRouter(app, koaRouter, serviceCtr);
                }
            });
        }
        catch (error) {
            console.log(error);
            console.log("no such file or dir :---- " + entryPath);
        }
    };
    loadinCtr(entryCtr);
};
