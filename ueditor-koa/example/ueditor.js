const busbody = require("await-busboy");
const fs = require("fs");
const path = require("path");
const rootpaht = process.cwd();
const statc_path = path.join(rootpaht, "upload");//default
function adddir(dir) {
    try {
        fs.accessSync(dir);
    } catch (e) {
        //创建
        fs.mkdirSync(dir);
    }
    return dir
}
class koaueditor {
    constructor(ctx, next, option) {
        this.ctx = ctx;
        this.next = next;
        this.conf = Object.assign({
            statc_path: statc_path  
        }, option)

        this.rootpath = path.join(rootpaht, this.conf.statc_path);
    }

    async ue_save(filepaths = "", filname = "") {
        var $self = this;
        var ctx = this.ctx;
        if (ctx.query.action === 'uploadimage' || ctx.query.action === 'uploadfile' || ctx.query.action === 'uploadvideo') {
            var parses = busbody(ctx);
            var part;
            var stream;
            var filename;
            var filepath;
            var tem_name;//
            while (part = await parses) {
                if (part.length) {
                } else {
                    if (ctx.query.action === 'uploadimage') {
                        var result = getfile("image")
                        filename = result.filename;
                        filepath = result.filepath
                    } else if (ctx.query.action === 'uploadfile') {

                        var result = getfile("file")
                        filename = result.filename;
                        filepath = result.filepath

                    } else if (ctx.query.action === 'uploadvideo') {

                        var result = getfile("video");
                        filename = result.filename;
                        filepath = result.filepath

                    }

                    stream = fs.createWriteStream(path.join($self.rootpath, filepath))//写入文件流
                    part.pipe(stream);
                    tem_name = part.filename;
                }
            }
            function getfile(savatype) {//读取相对path and filename 
                var posipath = filepaths ? dirArr(filepaths) : adddir(path.join($self.rootpath, savatype));
                console.log(posipath)
                var relpath = posipath.substr($self.rootpath.length);
                var fname = filname ? filname : (new Date().getTime()).toString() + path.extname(part.filename);
                var fpath = path.join(relpath, fname);
                return {
                    filename: fname,
                    filepath: fpath
                }
            }
            function dirArr(str) { //str:  '/dir1/dir1' 如果目录不存在则新建 
                if (!str || str == "" || typeof str != "string") {
                    return adddir(path.resolve($self.rootpath, "files"));
                }
                var str = str.toString().replace(/\//g, path.sep);
                var posipath = $self.rootpath;
                str.split(path.sep).filter(function (el) {
                    if (el != "") {
                        posipath = adddir(path.resolve(posipath, el.toString()));
                        return el
                    }
                });
                return posipath;
            }
            var obj = {
                'url': filepath.replace(/\\/g, '/'),
                'title': filename,
                'original': tem_name,
                'state': 'SUCCESS'
            }
            ctx.body = obj;
        } else {
            ctx.body = {
                'state': 'FAIL'
            }
        }
    }
    async ue_list(list_url = "/image") {
        var ctx = this.ctx;
        var $self = this;
        if (ctx.query.action != 'listimage') {
            ctx.body = {
                'state': 'FAIL'
            }
            return
        }

        var list_path = path.join($self.rootpath, list_url);
        var list = [];
        try {
            var files = fs.readdirSync(list_path);
            files.forEach(function (file) {
                var fileurl = path.join(list_path, file)
                if (fs.lstatSync(fileurl).isDirectory()) {
                }
                if (fs.lstatSync(fileurl).isFile()) {

                    if (indexof(path.extname(file))) {
                        list.push({ url: (path.join(list_url, file)).replace(/\\/g, "/") });

                    } else {

                    }
                }
            })
            ctx.body = {
                "state": "SUCCESS",
                "list": list,
                "start": 0,
                "total": list.length
            }
        } catch (error) {
            ctx.body = {
                'state': 'FAIL'
            }
        }
        function indexof(extname) {
            var filetype = ['.jpg', '.png', '.gif', '.ico', '.bmp'];
            var name = filetype.some(function (ele) {
                if (ele == extname) {
                    return extname
                }
            })
            return name
        }

    }
}
module.exports = koaueditor;