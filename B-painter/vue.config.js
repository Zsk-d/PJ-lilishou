const { defineConfig } = require('@vue/cli-service')
const config_build = require('./public/config_build')
 
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: config_build.ROUTE_PREFIX,
})
