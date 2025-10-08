---
title: 使用命令行解锁Bitlocker
published: 2024-12-20
description: "命令行解锁Bitlocker"
tags: [Windows, BitLocker]
category: '实用技巧'
draft: false 
---

以下命令假设待解锁盘符为 C，且使用 48 位恢复密钥解锁。

CMD：

```bash
 manage-bde.exe -unlock C: -recoverypassword xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx
```

PowerShell：

```bash
 Unlock-BitLocker -MountPoint C -RecoveryPassword xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx
```
