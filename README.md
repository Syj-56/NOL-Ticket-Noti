# Interpark Ticket Queue Monitor - Chrome Extension

## 安装步骤

1. **准备图标文件**
   - 需要创建 3 个 PNG 图标文件: `icon16.png`, `icon48.png`, `icon128.png`
   - 可以使用在线工具将 `icon.svg` 转换为 PNG
   - 或使用简单的颜色方块代替

2. **加载扩展**
   - 打开 Chrome 浏览器
   - 访问 `chrome://extensions/`
   - 开启右上角的「开发者模式」
   - 点击「加载已解压的扩展程序」
   - 选择 `InterparkTicketHelper` 文件夹

3. **配置 Bark 通知**
   - 在 iOS 下载 Bark App
   - 获取你的 Webhook URL (格式: https://api.day.app/你的设备密钥/)
   - 点击扩展图标 -> 设置 -> 粘贴 Webhook URL

## 使用方法

1. 进入 Interpark 排队页面 (https://tickets.interpark.com/waiting?...)
2. 点击扩展图标
3. 设置提醒阈值 (默认 1000)
4. 开启声音提醒 (推荐)
5. 点击「开始监控」

## 功能

- ✅ 实时监测排队号码
- ✅ 到达阈值时发送 Bark 通知
- ✅ 轮到你购票时 (号码=0) 发出声音警告
- ✅ 检测到购票页面时发出声音警告
- ✅ 支持自定义阈值和 Bark Webhook
- ✅ 可开关声音提醒

## 注意事项

- 插件需要保持在后台运行
- 首次使用需要授予页面访问权限
- 建议在抢购前测试通知功能