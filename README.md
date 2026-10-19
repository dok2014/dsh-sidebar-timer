# dsh-sidebar-timer

English | [简体中文](#简体中文)

A usage-timer plugin for the DSH (DeepSeek Harness) sidebar: a stopwatch chip beside the Settings gear that counts only the time you are actually using the Harness.

![preview](docs/preview.png)

<a id="简体中文"></a>

## 简体中文

### 功能特性

- **只计"真实使用"时间**：窗口聚焦 + 页面可见时才走表；页面内的真实操作（移动鼠标 / 点击 / 滚动 / 打字，60 秒宽限）作为兜底信号，聚焦判定失灵也能正确计时
- **与程序执行时间无关**：Agent 跑任务、后台作业都不计入，切走窗口、最小化、被遮挡即暂停
- **离开只暂停、不归零**：无论离开多久，回来接着算；只有 DSH 关闭（页面会话结束）才从 0 重新计数
- **刷新不丢**：页面刷新计时继续（sessionStorage 会话级持久化）
- **30 分钟提醒**：单次使用超过 30 分钟，数字底色变警示橙
- **5 秒步进显示**：数字与秒针每 5 秒同步跳动，内部累计精确到毫秒
- **手动归零**：胶囊旁的 ↺ 按钮
- **主题自适应**：全部使用 DSH 主题 token，浅色/深色自动跟随；中英双语提示随界面语言切换
- 落位：侧边栏底部 `sidebar.footer.action` 插槽（设置齿轮旁），加法式注册，不遮挡任何原生 UI

### 安装

**方式一：git clone**

```bash
git clone https://github.com/dok2014/dsh-sidebar-timer.git
```

然后在 DSH 的插件管理中安装 clone 出的目录（`dsh-sidebar-timer/`），或让你的 Agent 对该目录执行 bundle 安装。

**方式二：下载 zip**

Code → Download ZIP → 解压 → 同上，对解压目录执行安装。

> ⚠️ **按目录安装是"链接"模式**：插件直接引用安装时指定的目录，请**保留**该目录，删除或移动会导致插件失效。

### 使用说明

- 胶囊实时显示本次使用时长（`mm:ss`，满 1 小时进位为 `h:mm:ss`）
- 秒表图标：使用中为品牌色、暂停时置灰；悬停胶囊可查看当前状态说明
- 超过 30 分钟后数字底色变橙，提醒休息
- 点击 ↺ 手动归零，立即开始新的一段计时

### 升级

拉取最新代码后，在插件管理中先移除旧版本再重新安装（或让你的 Agent 重复执行安装步骤）。

### 卸载

在插件管理中移除 `dsh-sidebar-timer` bundle 即可。

### 兼容性

- 需要 DSH Web GUI（支持插件 bundle 的版本）
- 纯浏览器端实现，不依赖任何 Host 服务，无网络请求

-----

### English

A usage-timer plugin for the DSH sidebar: counts only while the window is focused and the page is visible (real in-page input serves as a fallback signal), pauses without resetting when you leave, restarts only when DSH closes, keeps the count across page refreshes (sessionStorage), and turns the digits warning orange after 30 minutes. Display steps in 5-second increments; the internal total stays millisecond-true. Theme-token styled for light/dark, bilingual (zh/en) labels.

Install: clone or download this repo, then install the directory as a DSH plugin bundle. Note: directory installs are **linked** — keep the folder in place.

## License

[MIT](LICENSE)
