---
title: 好用的注册表项（持续更新）
published: 2025-01-23
description: "一些很实用的注册表项"
tags: [Windows, 注册表]
category: '实用技巧'
draft: false
---

:::warning
修改注册表存在风险，请谨慎操作。错误修改注册表可能导致系统严重故障，甚至需要重装系统。
:::

:::note
感谢来自Disa的补充。
:::

## 自启动

* Run：每一次随着开机而启动。
* RunOnce：只作用一次，执行完毕后自动删除

### 用户级

```bash
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\RunOnce
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\RunOnce\Setup
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\RunServices
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\RunServicesOnce
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run
HKEY_CURRENT_USER\Software\Microsoft\Windows NT\CurrentVersion\Windows\load
```

### 系统级

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce\Setup
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnceEx
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\RunServices
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\RunServicesOnce
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon\Userinit
HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Run
HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\RunOnce
```

## Image File Execution Options

### 映像劫持

启动目标程序时，启动的是劫持后的程序而不是原来的程序。

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Option
```

添加一个名为目标进程的项，这个项中添加`debugger`键，键值为劫持程序。

### SilentProcessExit

当`ReportingMode`为1的情况下，被监控进程结束时系统会执行`MonitorProcess`指定的程序。

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SilentProcessExit
```

添加一个名为目标进程的项，这个项中添加`MonitorProcess`键，键值为劫持程序;添加`ReportingMode`键，键值为1。

### MinimumStackCommitInBytes

将`MinimumStackCommitInBytes`设定为足够大的值可以让指定程序因堆栈溢出而崩溃。

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\【目标进程】\MinimumStackCommitInBytes
```

## 计划任务

### 层级信息

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Schedule\TaskCache\Tree
```

若index为0，则在`taskschd.msc`中不可见。

### 任务详情

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Schedule\TaskCache\Tasks
```

## 重启后删除文件

```bash
HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Session Manager\PendingFileRenameOperations
```

每个操作由一对字符串组成：

* 第一个字符串是源文件或目录的路径。
* 第二个字符串是目标文件或目录的路径（如果是删除操作，则为空）。

例如：

```bash
\??\C:\OldFile.txt
\??\C:\NewFile.txt
```

表示将 C:\OldFile.txt 重命名为 C:\NewFile.txt。
