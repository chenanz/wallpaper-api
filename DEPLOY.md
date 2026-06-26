# 部署到 Render.com（免费托管 Flask）

## 1. 注册并登录
打开 https://render.com，用 GitHub 账号一键登录。

## 2. 新建 GitHub 仓库并推送代码
```bash
# 在 WallpaperProject 根目录（就是这个文件夹的父目录）
cd WallpaperProject
git init
git add .
git commit -m "init"
# 去 GitHub 新建一个仓库，比如 wallpaper-api
git remote add origin https://github.com/你的用户名/wallpaper-api.git
git push -u origin main
```

> 如果你不想传整个项目（包含 RN 的 node_modules），已经在 .gitignore 里忽略了，放心 push。

## 3. Render 上新建 Web Service
1. Dashboard → **New +** → **Web Service**
2. 选择你刚创建的 GitHub 仓库 `wallpaper-api`
3. 配置：
   - **Name**: `wallpaper-api`（随意）
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r crawler/requirements.txt`
   - **Start Command**: `cd crawler && gunicorn server:app --workers 2 --bind 0.0.0.0:$PORT`
   - **Plan**: 选 **Free**
4. 点 **Create Web Service**

等待 1-2 分钟，部署成功后你会看到一个类似：
```
https://wallpaper-api-xxxxx.onrender.com
```

## 4. 测试
浏览器访问：
```
https://wallpaper-api-xxxxx.onrender.com/wallpapers?category=原神COS&page=1
```
能看到 JSON 数据就是成功了。

## 5. App 改一行地址
打开 `WallpaperApp/src/screens/HomeScreen.js`，把：
```javascript
const API_BASE = 'http://192.168.1.95:3000/wallpapers';
```
改成 Render 给你的 HTTPS 地址：
```javascript
const API_BASE = 'https://wallpaper-api-xxxxx.onrender.com/wallpapers';
```

如果是 HTTPS，`app.json` 里的 `usesCleartextTraffic` 也可以删掉（留着也无所谓）。

## ⚠️ 免费版休眠问题
Render 免费服务 15 分钟没人访问会自动休眠，下次打开 App 可能要等 30-60 秒唤醒。

**解决办法**：注册 [UptimeRobot](https://uptimerobot.com)，每 5 分钟 ping 一次你的 API 地址，保持永久在线。

---
搞定之后，你电脑关机、出门、断网，手机照样能刷壁纸。
