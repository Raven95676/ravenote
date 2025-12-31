---
title: 群晖NAS部署Tailscale组网及HTTPS配置实战
published: 2025-12-31
description: '基于Tailscale为群晖NAS构建安全内网访问，适用于DSM 7.x环境'
tags: [群晖,NAS,安全]
category: '实用技巧'
draft: false 
---

为了提升群晖NAS的安全性（特别是EOL型号），或是在没有公网IP的情况下实现远程访问，我们可以选择使用Tailscale进行组网。

## 部署Tailscale

对于非国行版本的群晖，可以直接在套件中心搜索并安装Tailscale。对于国行版本的群晖，则需要前往[Tailscale Packages](https://pkgs.tailscale.com/stable/#spks)下载对应DSM版本及CPU架构的spk安装包（如果不确定架构，可在[Synology and SynoCommunity Package Architectures](https://github.com/SynoCommunity/spksrc/wiki/Synology-and-SynoCommunity-Package-Architectures)查询），随后在套件中心进行手动安装。

我们可以通过计划任务来进行自动更新。在DSM中打开控制面板，找到计划任务，新增一个用户自定义脚本的计划任务。将执行账号设置为root，计划周期设为每月一次，脚本内容如下：

```bash
tailscale update --yes
```

:::note
根据官方建议，即使是通过套件中心安装的Tailscale也建议通过计划任务进行自动更新
:::

对于DSM7，由于其对软件包行为引入了更严格的限制，导致Tailscale没有创建TUN设备的权限，所以说默认情况下仅允许外部设备连接到NAS，但NAS自己运行的应用程序无法通过Tailscale发起网络连接。如果有需要的话，在DSM中打开控制面板，找到计划任务，新建一个触发任务，事件选择开机，账号设置为root，脚本内容如下：

```bash
/var/packages/Tailscale/target/bin/tailscale configure-host; synosystemctl restart pkgctl-Tailscale.service
```

:::important
确保你正在运行Tailscale v1.22.2或更高版本

升级Tailscale软件包后需要再次运行上述命令
:::

## 配置HTTPS并自动化

进入Tailscale管理面板，在DNS选项卡下找到HTTPS Certificates，点击Enable HTTPS

:::important
启用此功能前，请确保MagicDNS已经打开

启用后，机器名称和Tailnet DNS名称将公开可见（不影响安全性）
:::

然后我们在DSM中打开控制面板，找到终端机和SNMP，在这里开启SSH。

通过SSH连接上群晖之后，切换到root账户（小小偷个懒），执行：

```bash
tailscale cert [Your Domain]
```

这条命令会生成两个文件，想办法把它们下载下来（办法有很多，比如将其移动到某个共享文件夹后通过File Station下载，或者使用SCP命令）。

然后在DSM中打开控制面板，找到安全性，然后切换到证书选项卡，点击新建，根据引导导入证书，其中，描述填`Tailscale`，中间证书不用管，留空。

:::important
务必注意这里描述必须是Tailscale，否则后继配置自动化更新后脚本将找不到证书路径。

自动化更新脚本仅在DSM7下进行过测试。实际使用前建议先在root权限下检查jq命令是否可以找到路径。找不到的情况下，可以参考`/usr/syno/etc/certificate/_archive/INFO`的结构调整jq查询语句，或直接通过sha256比对找到固定的证书目录（可使用`find /usr/syno/etc/certificate/_archive -type f -name cert.pem -exec sha256sum {} \;`快速列出所有cert.pem的sha256，即crt文件的sha256）。

如果修改脚本使用固定目录，日后在删除并重新导入证书等情况下路径会变，到时候记得改。
:::

导入完成后，记得点击设置，将相关服务使用的证书切换为刚刚导入的Tailscale证书。其实这时候HTTPS已经配置好了，但是每当证书过期时，我们都需要重新手动干一遍上面的操作，很是麻烦，尤其是2028年起证书有效期会被调整为45天

编写如下脚本，记得把`[Your Domain]`替换为你的Tailscale完整域名：

```bash
#!/bin/bash
DOMAIN="[Your Domain]"
CERT_DIR=$(jq -r --arg desc "Tailscale" 'to_entries[] | select(.value.desc == $desc) | .key' /usr/syno/etc/certificate/_archive/INFO)
CERT_ARCHIVE_PATH="/usr/syno/etc/certificate/_archive/${CERT_DIR}"

if [ -f "${CERT_ARCHIVE_PATH}/cert.pem" ]; then
    EXPIRY_DATE=$(openssl x509 -enddate -noout -in "${CERT_ARCHIVE_PATH}/cert.pem" | cut -d= -f2)
    EXPIRY_EPOCH=$(date -d "${EXPIRY_DATE}" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_REMAINING=$(( (EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))
else
    exit 1
fi

if [ ${DAYS_REMAINING} -gt 14 ]; then
    exit 0
fi

tailscale cert "${DOMAIN}"

if [ ! -f "${DOMAIN}.crt" ]; then
    exit 1
fi

cp "${DOMAIN}.crt" "${CERT_ARCHIVE_PATH}/cert.pem"
mv "${DOMAIN}.key" "${CERT_ARCHIVE_PATH}/privkey.pem"
mv "${DOMAIN}.crt" "${CERT_ARCHIVE_PATH}/fullchain.pem"

chmod 400 "${CERT_ARCHIVE_PATH}/cert.pem"
chmod 400 "${CERT_ARCHIVE_PATH}/privkey.pem"
chmod 400 "${CERT_ARCHIVE_PATH}/fullchain.pem"

chown root:root "${CERT_ARCHIVE_PATH}/cert.pem"
chown root:root "${CERT_ARCHIVE_PATH}/privkey.pem"
chown root:root "${CERT_ARCHIVE_PATH}/fullchain.pem"

synosystemctl restart nginx
```

将以上内容保存为`refresh_tailscale_cert.sh`，放到任意一个共享文件夹内，然后在DSM中打开控制面板，找到计划任务，新增一个用户自定义脚本的计划任务。将执行账号设置为root，计划周期设为每周一次，脚本内容如下：

```bash
cd /[Your Volume]/[Your Shared Folder]
bash refresh_tailscale_cert.sh
```

如果不知道`/[Your Volume]/[Your Shared Folder]`到底应该是什么，可以在DSM中右键你的脚本并查看属性。

## 参考

- [Issue Synology Let's Encrypt Cert by acme.sh docker](https://www.xfelix.com/2020/04/issue-synology-lets-encrypt-cert-by-acme-sh-docker/)
