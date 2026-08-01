---
title: "Setting up Tailscale and configuring HTTPS on Synology NAS: A practical guide"
published: 2025-12-31
description: 'Building secure remote access to Synology NAS with Tailscale, compatible with DSM 7.x'
tags: [Synology, NAS, Cybersecurity]
category: 'Useful Guides'
draft: false 
---

To enhance Synology NAS security (especially EOL models), and enable remote access without a public IP address, Tailscale can be used to build a secure private network.

## Setting up Tailscale

For Synology NAS models outside the mainland China market, Tailscale is available directly through Package Center. Otherwise, download the appropriate SPK package for your DSM version and CPU architecture from [Tailscale Packages](https://pkgs.tailscale.com/stable/#spks), and then manually install it in Package Center (if you're unsure about the architecture, check [Synology and SynoCommunity Package Architectures](https://github.com/SynoCommunity/spksrc/wiki/Synology-and-SynoCommunity-Package-Architectures)).

You can automate updates with a scheduled task. In DSM, open Control Panel, find Scheduled Task, and create a new scheduled task with a user-defined script. Set the running user to root, schedule it to run once a month, and use the following script:

```bash
tailscale update --yes
```

> [!NOTE]
> Per the official recommendation, Tailscale should be kept up to date automatically via a scheduled task even when installed through Package Center

On DSM 7, stricter restrictions on package behavior mean Tailscale doesn't have permission to create TUN devices, so by default external devices can connect to the NAS, but applications running on the NAS itself cannot initiate network connections through Tailscale. If you need that, open Control Panel in DSM, find Scheduled Task, create a new triggered task, select Boot as the event, set the user to root, and use the following script:

```bash
/var/packages/Tailscale/target/bin/tailscale configure-host; synosystemctl restart pkgctl-Tailscale.service
```

> [!IMPORTANT]
> Make sure you're running Tailscale v1.22.2 or later
>
> You'll need to run the command above again after upgrading the Tailscale package

## Setting up HTTPS and automating it

Open the Tailscale admin console, go to the DNS tab, find HTTPS Certificates, and click Enable HTTPS.

> [!IMPORTANT]
> Make sure MagicDNS is enabled before turning this on
>
> Once enabled, machine names and Tailnet DNS names become publicly visible (this doesn't affect security)

Next, open Control Panel in DSM, go to Terminal & SNMP, and enable SSH.

Once connected to the NAS over SSH, switch to the root account (a small shortcut) and run:

```bash
tailscale cert [Your Domain]
```

This command generates two files. Find a way to get them onto your computer (there are plenty of options — e.g., move them to a shared folder and download them via File Station, or use SCP).

Then open Control Panel in DSM, go to Security, switch to the Certificate tab, click New, and follow the wizard to import the certificate. Set the description to `Tailscale` and leave the intermediate certificate blank.

> [!IMPORTANT]
> Make sure the description is exactly `Tailscale` — otherwise the automation script won't be able to locate the certificate path later.
>
> The automation script has only been tested on DSM 7. Before relying on it, verify that the `jq` command resolves correctly when run as root. If it doesn't, adjust the jq query based on the structure of `/usr/syno/etc/certificate/_archive/INFO`, or pin down the fixed certificate directory by comparing sha256 hashes (you can quickly list the sha256 of every cert.pem — i.e., the sha256 of the crt files — with `find /usr/syno/etc/certificate/_archive -type f -name cert.pem -exec sha256sum {} \;`).
>
> If you modify the script to use a fixed directory, be aware that the path changes whenever you delete and re-import the certificate — remember to update it then.

Once the import is done, don't forget to go to Settings and switch the certificates used by the relevant services to the Tailscale certificate you just imported. HTTPS is actually fully configured at this point — but every time the certificate expires, you'd have to repeat the whole process manually, which is a pain, especially since certificate validity is being shortened to 45 days starting in 2028.

Write the following script, remembering to replace `[Your Domain]` with your full Tailscale domain:

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

Save the content above as `refresh_tailscale_cert.sh` and place it in any shared folder. Then open Control Panel in DSM, find Scheduled Task, and create a new scheduled task with a user-defined script. Set the running user to root, schedule it to run weekly, and use the following script:

```bash
cd /[Your Volume]/[Your Shared Folder]
bash refresh_tailscale_cert.sh
```

If you're not sure what `/[Your Volume]/[Your Shared Folder]` should be, right-click your script in DSM and check its properties.

## References

- [Issue Synology Let's Encrypt Cert by acme.sh docker](https://www.xfelix.com/2020/04/issue-synology-lets-encrypt-cert-by-acme-sh-docker/)
