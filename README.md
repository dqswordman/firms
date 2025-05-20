# Wildfire Visualization Frontend

## 技术栈

- React 18
- TypeScript 4
- Tailwind CSS 3
- Leaflet 1.9
- React-Leaflet 4
- PostCSS 8
- Autoprefixer 10

## 快速开始

1. 安装依赖（如遇依赖冲突请加 `--legacy-peer-deps`）：
   ```sh
   npm install --legacy-peer-deps
   ```

2. 启动开发服务器：
   ```sh
   npm start
   ```

3. 访问 [http://localhost:3000](http://localhost:3000)

## 依赖版本

- react: 18.2.0
- react-dom: 18.2.0
- react-scripts: 5.0.1
- tailwindcss: ^3.3.0
- postcss: ^8.4.31
- autoprefixer: ^10.4.14
- leaflet: ^1.9.4
- react-leaflet: ^4.2.1
- typescript: ^4.9.5

## 其他说明

- 如遇 `ajv` 相关错误，请执行：
  ```sh
  npm install ajv@^6.12.6 ajv-keywords@^3.5.2 --legacy-peer-deps
  ```
- Tailwind/PostCSS 配置见 `postcss.config.js` 和 `tailwind.config.js`。
