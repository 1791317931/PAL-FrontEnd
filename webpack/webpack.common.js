/*
 * @Author: nizhanjun
 * @Date:   2018-12-26 10:24:27
 */
const path = require('path')
const webpack = require("webpack")
const CleanWebpackPlugin = require('clean-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const HappyPack = require('happypack')
const utils = require('./utils')
const config = require('./config')

const APP_ROOT = path.resolve(__dirname, '../')

function resolve(dir) {
    return path.join(APP_ROOT, dir)
}

const APP_DIST = resolve('web')
const APP_SRC = resolve('/src')
const NODE_ENV = process.env.NODE_ENV

// vue happypack loader
const cssLoader = new MiniCssExtractPlugin({
    use: [
        'happypack/loader?id=happy-css'
    ]
})
const vueLoaderConfig = {
    ...utils.cssLoaders({
        sourceMap: false,
        extract: NODE_ENV !== 'development'
    }),
    js: 'happypack/loader?id=happy-babel-vue',
    css: cssLoader
}

// css and less loader
function createCssAndLessLoader() {
    const loaders = [{
            loader: MiniCssExtractPlugin.loader,
            options: {
                publicPath: '../'
            }
        },
        'css-loader?importLoaders=1',
        {
            loader: "postcss-loader",
            options: {
                plugins: [
                    require("autoprefixer")
                ]
            }
        },
        {
            loader: 'less-loader',
            options: { javascriptEnabled: true }
        },
        {
            loader: 'style-resources-loader',
            options: {
                patterns: resolve(`/src/static/less/var.less`)
            }
        }
    ]
    return Object.assign([NODE_ENV === 'development' ? 'css-hot-loader' : ''], loaders)
}

module.exports = {
    entry: [
        '@babel/polyfill',
        path.join(APP_ROOT, 'src/main.js')
    ],
    output: {
        path: APP_DIST,
        filename: 'js/[name].[contenthash:8].js',
        publicPath: './'
    },
    resolve: {
        alias: {
            'vue': 'vue/dist/vue.js',
            '@src': APP_SRC,
            '@components': '@src/components',
            '@view': '@src/view',
            '@static': '@src/static'
        },
        extensions: ['.js', '.vue', '.css', '.less', '.json', '.scss']
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                vendor: { // node_modules内的依赖库
                    chunks: "all",
                    test: /[\\/]node_modules[\\/]/,
                    name: "vendor",
                    minChunks: 1,
                    maxInitialRequests: 5,
                    minSize: 0,
                    priority: 1
                }
            }
        },
        runtimeChunk: {
            name: 'manifest'
        }
    },
    module: {
        noParse: /node_modules\/(iview\.js)/,
        rules: [{
                test: /\.js$/,
                loader: 'happypack/loader?id=happy-babel-js',
                include: [
                    APP_SRC,
                    resolve('/node_modules/yyzone/src'),
                    resolve('/node_modules/iview/src')
                ]
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
                options: vueLoaderConfig,
                include: [
                    APP_SRC,
                    resolve('/node_modules/yyzone/src'),
                    resolve('/node_modules/iview/src')
                ]
            },
            {
                test: /\.(c|le)ss$/,
                use: createCssAndLessLoader()
            },
            {
                test: /\.(eot|svg|ttf|woff|woff2)$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: 'fonts/[name].[hash:8].[ext]'
                }
            },
            {
                test: /\.(png|jpg|gif)$/,
                loader: 'url-loader',
                query: {
                    limit: 10000,
                    name: 'images/[name].[hash:8].[ext]'
                },
                include: [
                    APP_SRC,
                    resolve('/node_modules/yyzone/src')
                ]
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin([APP_DIST], {
            allowExternal: true
        }),
        new VueLoaderPlugin(),
        new webpack.DefinePlugin({
            __ENV__: JSON.stringify(NODE_ENV),
            ENV: JSON.stringify(config[NODE_ENV])
        }),
        utils.createHappyPlugin('happy-babel-js', [{
            loader: 'babel-loader',
            options: {
                presets: ['@babel/preset-env'],
                cacheDirectory: true
            }
        }]),
        utils.createHappyPlugin('happy-babel-vue', ['babel-loader?cacheDirectory=true']),
        utils.createHappyPlugin('happy-css', ['css-loader', 'vue-style-loader']),
        new HappyPack({
            loaders: [{
                path: 'vue-loader',
                query: {
                    loaders: {
                        scss: 'vue-style-loader!css-loader!less-loader?indentedSyntax'
                    }
                }
            }]
        }),
        new MiniCssExtractPlugin({
            filename: "css/[name].[contenthash:8].css",
            chunkFilename: "css/[id].css",
        }),
        new HtmlWebpackPlugin({
            favicon: resolve('/src/template/favicon.png'),
            template: resolve('/src/template/index.html')
        })
    ],
    performance: {
        hints: 'warning', // 枚举
        maxAssetSize: 20240000, // 整数类型（以字节为单位）
        maxEntrypointSize: 202400000, // 整数类型（以字节为单位
        assetFilter: function (assetFilename) {
            return assetFilename.endsWith('.css') || assetFilename.endsWith('.js');
        }
    }
}
