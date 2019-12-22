"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const {getClass,getMethond} = require("./index");
function registerRouter(App, koaRouter, Contorller) {
    let { prefixed, routers, midwares } = getClass(Contorller.prototype);
    let ctrObj = new Contorller();
    for (let key in routers) {
        let methodMate = getMethond(ctrObj, key);
        let routePath = path.join(prefixed, methodMate.path).replace(/\\+/g, "/");
        let actionFn = async (ctx, next) => {
            if (typeof ctrObj["__before__"] === "function") {
                var resBefore = await ctrObj["__before__"].call(ctrObj, ctx, next);
                if (resBefore) {
                    ctx.body = await resBefore;
                }
                else {
                    var resFn = await ctrObj[key].call(ctrObj, ctx, next);
                    if (resFn)  ctx.body = await resFn;
                }
            }
            else {
                var resFn = await ctrObj[key].call(ctrObj, ctx, next);
                if (resFn) ctx.body = await resFn;
            }
        };
        // console.log(...[...midwares,actionFn])
        koaRouter[methodMate.action](routePath, ...[...midwares,...methodMate.midwares, actionFn]);
    }
    App.use(koaRouter.routes());
}
// exports.registerRouter = registerRouter;
module.exports = registerRouter