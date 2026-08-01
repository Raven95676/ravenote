/* This is a script to create a new post markdown file with front-matter */

import fs from "fs"
import path from "path"

const LOCALES = ["zh", "en"]
const DEFAULT_LOCALE = "zh"

function getDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

const args = process.argv.slice(2)

// Optional first argument: locale (zh or en)
let locale = DEFAULT_LOCALE
if (args.length > 0 && LOCALES.includes(args[0])) {
  locale = args.shift()
}

if (args.length === 0) {
  console.error(`Error: No filename argument provided
Usage: npm run new-post -- [zh|en] <filename>`)
  process.exit(1) // Terminate the script and return error code 1
}

let fileName = args[0]

// Add .md extension if not present
const fileExtensionRegex = /\.(md|mdx)$/i
if (!fileExtensionRegex.test(fileName)) {
  fileName += ".md"
}

const targetDir = path.join("./src/content/posts/", locale)
const fullPath = path.join(targetDir, fileName)

if (fs.existsSync(fullPath)) {
  console.error(`Error: File ${fullPath} already exists `)
  process.exit(1)
}

// recursive mode creates multi-level directories
const dirPath = path.dirname(fullPath)
if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
}

const content = `---
title: ${args[0]}
published: ${getDate()}
description: ''
image: ''
tags: []
category: ''
draft: false
---
`

fs.writeFileSync(path.join(targetDir, fileName), content)

console.log(`Post ${fullPath} created`)
