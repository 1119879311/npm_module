let devConfig = process.env.NODE_ENV==="development"?"./dev_config":"./pro_config";
module.exports = require(devConfig);