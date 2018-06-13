const path = require('path');
const webpack = require('webpack');
const { version, name, author} = require('./package.json');

module.exports = {
  mode: 'development',
  entry: {
    'gr20-2d': [ './src/polyfills.ts', './src/main2d.ts' ],
    'gr20-3d': [ './src/polyfills.ts', './src/main3d.ts' ],
  },
  output: {
    path: path.join(__dirname, './dist/')
  },
  module: {
    rules: [
      {
        test: require.resolve("svg.js"),
        use: "imports-loader?define=>false"
      }, {
        test: /\.(t|j)sx?$/,
        use: 'awesome-typescript-loader'
      }, {
        test: /\.js$/,
        use: 'source-map-loader',
        enforce: 'pre'
      }
    ]
  },
  resolve: {
    extensions: [ '.ts', '.js' ]
  },
  plugins: [
    new webpack.BannerPlugin(`${name} v${version} - (c) 2018 ${author}`)
  ],
  stats: { colors: true },
  devtool: 'source-map'
};
