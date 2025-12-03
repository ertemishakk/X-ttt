var path = require("path");
var webpack = require("webpack");

module.exports = {
  devtool: "cheap-module-eval-source-map",
  // context: path.join(__dirname, 'static'),
  entry: [
    "eventsource-polyfill", // necessary for hot reloading with IE
    "webpack-hot-middleware/client",
    "./src/app",
  ],
  output: {
    path: path.join(__dirname, "dist"),
    filename: "bundle.js",
    // publicPath: path.join(__dirname, 'static'),
    // publicPath: __dirname + '/static/'
    publicPath: "/",
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
  module: {
    rules: [
      {
        test: /\.(ico|css|gif|png|html|jpg|xml|svg)$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[path][name].[ext]",
              context: path.resolve(__dirname, "static"),
              esModule: false,
            },
          },
        ],
      },
      {
        test: /\.jsx?$/,
        include: path.resolve(__dirname, "src"),
        use: {
          loader: "babel-loader",
        },
      },
      {
        test: /\.scss$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /(flickity|fizzy-ui-utils|get-size|unipointer|imagesloaded)/,
        use: {
          loader: "imports-loader",
          options: {
            additionalCode: "var define = false;",
            wrapper: "window",
          },
        },
      },
    ],
  },
};
