"use strict";

exports.getClass = function (target) {
    return target.$setMeta = target.$setMeta ? target.$setMeta
     : { prefixed: "", routers: {}, midwares: [] };
};
exports.getMethond = function (target, methondName) {
    var setMeta = exports.getClass(target);
    return setMeta.routers[methondName] ? setMeta.routers[methondName] : {
        path: "",
        action: "",
        midwares: []
    };
};
function Controller(prefixed, midwares) {
    return function (target) {
        let setMeta = exports.getClass(target.prototype);
        setMeta.prefixed = prefixed ? prefixed : "";
        setMeta.midwares = midwares ? midwares : [];
        target.prototype.$setMeta = setMeta;
    };
}

function RequestFactory(type) {
    return function (path,midwares=[]) {
        return function (target, methodName, dec) {
            var methond = exports.getMethond(target, methodName);
            methond.action = type;
            methond.path = path;
            methond.midwares = midwares;
            target.$setMeta.routers[methodName] = methond;
        };
    };
}
// GET: 'get',
// POST: 'post',
// PUT: 'put',
// DELETE: 'delete',
// ALL: "all"
exports.GET = RequestFactory("get");
exports.POST = RequestFactory("post");
exports.PUT = RequestFactory("put");
exports.DELETE = RequestFactory("delete");
exports.ALL = RequestFactory("all");
exports.Controller = Controller;