import path from 'path';
import { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

const isDev = process.env.NODE_ENV === 'development';

const common: Configuration = {
  mode: isDev ? 'development' : 'production',
  node: {
    // メインプロセス内の__dirnameや__filenameをwebpackが変換しないようにする
    __dirname: false,
    __filename: false
  },

  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json'],
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader'
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [{
          // inject CSS to page
          loader: 'style-loader'
        }, {
          // translates CSS into CommonJS modules
          loader: 'css-loader'
        }, {
          // Run postcss actions
          loader: 'postcss-loader',
          options: {
            // `postcssOptions` is needed for postcss 8.x;
            // if you use postcss 7.x skip the key
            postcssOptions: {
              // postcss plugins, can be exported to postcss.config.js
              plugins: function() {
                return [
                  require('autoprefixer')
                ];
              }
            }
          }
        }, {
          // compiles Sass to CSS
          loader: 'sass-loader'
        }]
      },
      {
        test: /\.(svg|png)/,
        loader: 'url-loader',
      }
    ]
  },
  externals: {
    fsevents: "require('fsevents')"
  },

  watch: isDev,
  devtool: isDev ? 'inline-source-map' : undefined
};

const buildDir = path.resolve(__dirname, 'build');


// メインプロセス向け設定
const main: Configuration = {
  ...common,
  target: 'electron-main',
  entry: {
    main: './src/main/main.ts',
  },
  output: {
    path: path.resolve(buildDir, 'main')
  },
};

// プリロードスクリプト向け設定
const preload: Configuration = {
  ...common,
  target: 'electron-preload',
  entry: {
    preload: './src/main/preload.ts',
  },
  output: {
    path: path.resolve(buildDir, 'main')
  },
};

// レンダラープロセス向け設定
const renderer: Configuration = {
  ...common,
  target: 'web',
  entry: {
    renderer: './src/renderer/main.tsx',
  },
  output: {
    path: path.resolve(buildDir, 'renderer')
  },
  plugins: [
    new HtmlWebpackPlugin({
      minify: !isDev,
      inject: 'body',
      filename: 'index.html',
      template: './src/renderer/index.html',
    }),
  ],
};

const config = isDev ? [renderer] : [main, preload, renderer];
export default config;
