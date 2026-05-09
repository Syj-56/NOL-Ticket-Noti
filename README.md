# Interpark Ticket Queue Monitor - Chrome Extension

## 安装步骤
1.**加载扩展**
   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择 `NOL Noti` 文件夹

2. **配置 Bark 通知**
   - 在 iOS 下载 Bark App
   - 获取你的 Webhook URL (格式: https://api.day.app/你的设备密钥/)
   - 点开排队页面，在悬浮窗里Bark一栏复制粘贴webhook，注意不要透露给任何人

## 使用方法
1. 进入 Interpark 排队页面 (https://tickets.interpark.com/waiting?...)
2. 扩展会默认启动悬浮窗
3. 设置提醒阈值 (默认 1000)
4. 开启声音提醒 (推荐)
5. 点击「开始监控」
6. 如果是正在排队的页面也不影响，安装好扩展后，刷新一下排队页面就会开始监控，不会影响排队队列

## 功能
- ✅ 实时监测排队号码
- ✅ 到达阈值时发送 Bark 通知
- ✅ 检测进入到购票页面时发出声音提示
- ✅ 支持自定义阈值和 Bark Webhook
- ✅ 可开关声音提醒

## 注意事项
- 只是一个排队提示，无法自动购票
- 可以互相交流但请勿拿去盈利
