---
title: Useful Registry Keys (Continuously Updated)
published: 2025-01-23
description: "Some genuinely useful registry keys"
tags: [Windows, Registry]
category: 'Useful Guides'
draft: false
---

> [!WARNING]
> Editing the registry carries risks — proceed with caution. Incorrect changes can cause serious system failures, or even require a full system reinstall.

> [!NOTE]
> Thanks to Disa for the additions.

## Auto-start

* Run: runs at every boot.
* RunOnce: runs only once, then deletes itself after execution.

### User-level

```bash
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\RunOnce
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\RunOnce\Setup
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\RunServices
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\RunServicesOnce
HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer\Run
HKEY_CURRENT_USER\Software\Microsoft\Windows NT\CurrentVersion\Windows\load
```

### System-level

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

### Image hijacking

When you launch the target program, the hijacking program runs instead of the original one.

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Option
```

Create a subkey named after the target process, and inside it add a `debugger` value set to the hijacking program.

### SilentProcessExit

When `ReportingMode` is set to 1, the system runs the program specified in `MonitorProcess` when the monitored process exits.

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\SilentProcessExit
```

Create a subkey named after the target process, add a `MonitorProcess` value set to the hijacking program, and a `ReportingMode` value set to 1.

### MinimumStackCommitInBytes

Setting `MinimumStackCommitInBytes` to a large enough value makes the specified program crash with a stack overflow.

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Image File Execution Options\[Target Process]\MinimumStackCommitInBytes
```

## Scheduled Tasks

### Hierarchy information

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Schedule\TaskCache\Tree
```

If the index is 0, the task is not visible in `taskschd.msc`.

### Task details

```bash
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Schedule\TaskCache\Tasks
```

## Deleting Files After Reboot

```bash
HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Session Manager\PendingFileRenameOperations
```

Each operation consists of a pair of strings:

* The first string is the path of the source file or directory.
* The second string is the path of the target file or directory (empty for a delete operation).

For example:

```bash
\??\C:\OldFile.txt
\??\C:\NewFile.txt
```

This renames C:\OldFile.txt to C:\NewFile.txt.
