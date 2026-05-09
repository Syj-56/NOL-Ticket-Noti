# Interpark Ticket Queue Monitor - Chrome Extension

## 安装步骤
1.**加载扩展**
   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择 `NOL Noti` 文件夹


2. **配置 Bark 通知(ios用戶)**
   - 在 iOS 下载 Bark App
   - 获取你的 Webhook URL (格式: https://api.day.app/你的设备密钥/)
   - 复制首条webhook URL到监控悬浮窗
<img width="2048" height="1152" alt="WhatsApp Image 2026-05-09 at 18 18 17" src="https://github.com/user-attachments/assets/6667aae8-7b88-41a1-83d5-cc38dae324d7" />



3. **配置Discord通知(安卓/ios用戶)**
   - 下载Discord App
   - 设置你的伺服器和频道
   - 在频道设定里创建webhook(注意这Discord限制了webhook只能在桌面端创建)
   - 复制webhook URL到监控悬浮窗
   - 注意要完全退出桌面端Discord才能在手机端收到即时通知
<img width="2880" height="1704" alt="image" src="https://github.com/user-attachments/assets/9537390f-4d81-46db-b66f-36426646ca1c" />


## 使用方法
1. 进入 Interpark 排队页面 (https://tickets.interpark.com/waiting?...)
2. 扩展会默认启动悬浮窗
3. 设置提醒阈值 (默认 1000)
4. 开启声音提醒 (推荐)
5. 如果是正在排队的页面也不影响，安装好扩展后，刷新一下排队页面就会开始监控，不会影响排队队列

## 功能
- ✅ 实时监测排队号码
- ✅ 到达阈值时发送 Bark或者Disocord 通知
- ✅ 检测进入到购票页面时发出声音提示
- ✅ 支持自定义阈值和 Bark Webhook
- ✅ 可开关声音提醒

## 注意事项
- 只是一个排队提示，无法自动购票
- 可以互相交流但请勿拿去盈利
