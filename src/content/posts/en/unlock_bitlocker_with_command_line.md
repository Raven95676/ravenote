---
title: Unlocking BitLocker from the Command Line
published: 2024-12-20
description: "Unlock BitLocker from the command line"
tags: [Windows, BitLocker]
category: 'Useful Guides'
draft: false 
---

The commands below assume the drive to be unlocked is C, unlocked using the 48-digit recovery key.

CMD:

```bash
 manage-bde.exe -unlock C: -recoverypassword xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx
```

PowerShell:

```bash
 Unlock-BitLocker -MountPoint C -RecoveryPassword xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx-xxxxxx
```
