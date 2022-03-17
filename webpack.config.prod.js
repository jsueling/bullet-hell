const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// https://webpack.js.org/plugins/css-minimizer-webpack-plugin/ npm install css-minimizer-webpack-plugin --save-dev

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
   filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [new HtmlWebpackPlugin()]
};