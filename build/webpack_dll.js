const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const AssetsPlugin = require('assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const CleanPlugin = require('clean-webpack-plugin')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

const utils = require('./utils')

const { rootDir, dllPaths, publicPath } = utils
const { DllPlugin } = webpack

const dllName = '[name]_[hash:6]'

// 是否启用分析工具
const enableAnalyzer = false

// 需要打包到 dll 的模块
// 1. 项目必须依赖的基础模块
// 2. 长期不更新的第三方模块
// 3. 可以异步按需加载的模块，尽量不要添加进来
// 4. 每次修改本文件, 或者对应npm包升级。都要执行 yarn build:dll 才能生效
const dllModules = [
  'react',
  '@hot-loader/react-dom',
  'react-router-dom',
  'immer',
  'styled-components',
  'whatwg-fetch',
  'qs',
  // amis 更新频率较高（大概半个月左右），因此需要如果更新版本时要考虑升级对项目影响
  'amis',
  'font-awesome/css/font-awesome.css',
  'react-datetime/css/react-datetime.css',
  'video-react/dist/video-react.css',
  'cropperjs/dist/cropper.css',
  'froala-editor/css/froala_style.min.css',
  'froala-editor/css/froala_editor.pkgd.min.css',
]

const dellWebpackConfig = {
  mode: 'production',
  entry: {
    dll_vendor: dllModules,
  },
  module: {
    rules: [
      {
        test: /\.js|jsx$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              compact: true,
              plugins: ['@babel/plugin-syntax-dynamic-import'],
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.png|jpg|gif|ttf|woff|woff2|eot|svg$/,
        exclude: /qs\//,
        use: [
          {
            loader: 'url-loader',
            options: {
              publicPath: `${publicPath}${dllPaths.dllVendorJsPath}/`,
              limit: 2000, // 低于2K 使用 base64
              name: '[name]_[contenthash:6].[ext]',
            },
          },
        ],
      },
    ],
  },
  output: {
    pathinfo: false,
    path: rootDir(dllPaths.dllVendorJsPath),
    filename: `${dllName}.js`,
    chunkFilename: 'chunk_[name]_[chunkhash:6].js',
    library: dllName,
    publicPath: `${publicPath}${dllPaths.dllVendorJsPath}/`,
  },
  plugins: [
    new CleanPlugin(),
    new MiniCssExtractPlugin({
      filename: `${dllName}.css`,
      chunkFilename: 'chunk_[name]_[chunkhash:6].css',
    }),
    new DllPlugin({
      path: dllPaths.manifestPath,
      name: dllName,
    }),
    // 把带hash的dll插入到html中 https://github.com/ztoben/assets-webpack-plugin
    new AssetsPlugin({
      filename: dllPaths.manifestAssetsName,
      fullPath: false,
      path: './',
    }),
  ],
  // 关闭文件大小报警，具体情况，可查看分析工具
  performance: {
    hints: false,
  },
  optimization: {
    minimizer: [new TerserPlugin()],
    splitChunks: {
      maxInitialRequests: Infinity,
      automaticNameDelimiter: '_',
      cacheGroups: {
        default: false,
        vendors: false,
        monacoLanguages: {
          chunks: 'async',
          name: 'monaco_languages',
          test: /monaco-editor[\\/].*language/,
          priority: 10,
          minChunks: 1,
        },
      },
    },
  },
}

if (enableAnalyzer) {
  dellWebpackConfig.plugins.push(
    // https://github.com/webpack-contrib/webpack-bundle-analyzer
    new BundleAnalyzerPlugin({
      analyzerPort: 7052,
    })
  )
}

module.exports = dellWebpackConfig
