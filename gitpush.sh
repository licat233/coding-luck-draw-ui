#!/bin/bash

git add .
git commit -m update --no-verify

#git@github.com:licat233/luck_draw-ui.git
git push origin main

#git@e.coding.net:licat/luck_draw/luck_draw-ui.git
git push origin-t main

echo "git push 已完成"

#强制将本机的代码库推送到远端仓库，并覆盖！
#git push -f origin --all