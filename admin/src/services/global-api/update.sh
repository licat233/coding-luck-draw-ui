# !/bin/bash

#给予shell文件执行权限：chmod a+x update.sh
#执行shell文件：./update.shell

#更新Components.ts接口文件
curl -# -O --insecure https://luck.catli.net/v1/api/admin/static/adminComponents.ts
echo "adminComponents.ts下载完成"
curl -# -O --insecure https://luck.catli.net/v1/api/captcha/static/captchaComponents.ts
echo "captchaComponents.ts下载完成"
curl -# -O --insecure https://luck.catli.net/v1/api/luckdraw/static/luckdrawComponents.ts
echo "luckdrawComponents.ts下载完成"

#更新function方法文件
mkdir -p txt
curl -# -o txt/admin.txt --insecure https://luck.catli.net/v1/api/admin/static/admin.ts
echo "admin.ts下载完成"
curl -# -o txt/captcha.txt --insecure https://luck.catli.net/v1/api/captcha/static/captcha.ts
echo "captcha.ts下载完成"
curl -# -o txt/luckdraw.txt --insecure https://luck.catli.net/v1/api/luckdraw/static/luckdraw.ts
echo "luckdraw.ts下载完成"

#创建*-custom.ts文件
rm -f ./admin-custom.ts
echo 'import { webapi } from "./webapi"' >admin-custom.ts
cat txt/admin.txt >>admin-custom.ts
echo "update admin-custom successfully"

rm -f ./captcha-custom.ts
echo 'import { webapi } from "./webapi"' >captcha-custom.ts
cat txt/captcha.txt >>captcha-custom.ts
echo "update captcha-custom successfully"

rm -f ./luckdraw-custom.ts
echo 'import { webapi } from "./webapi"' >luckdraw-custom.ts
cat txt/luckdraw.txt >>luckdraw-custom.ts
echo "update luckdraw-custom successfully"

#需要更新的 RESTful 方法: list info add edit del
#逻辑：查找指定方法名，获取其位置行数，查找下一行 admin/:name/ 后面的名字name，更改方法名为：name方法名
FILENAME="admin-custom.ts"
FUNC_ARR=("list" "info" "add" "edit" "del")
for FUNC_NAME in ${FUNC_ARR[@]}; do
  N=7
  if [ $FUNC_NAME = "list" ]; then
    N=15
  fi
  for line in $(grep -n "function ${FUNC_NAME}(" $FILENAME | cut -d ":" -f 1); do
    NEXT_LINE=$(($line + 1))
    NEXT_STR=$(sed -n $(expr ${NEXT_LINE}p) $FILENAME)
    NEXT_LEN=$(echo ${#NEXT_STR})
    START_INDEX=$(echo $(awk -v a="$NEXT_STR" -v b="admin/" 'BEGIN{print index(a,b)}'))
    let START_INDEX+=5
    LAST=$(($NEXT_LEN - $START_INDEX))
    END_INDEX=$(($LAST - $N))
    NAME=${NEXT_STR: START_INDEX: END_INDEX}
    LINE_STR=$(sed -n $(expr ${line}p) $FILENAME)
    firstLetter=${FUNC_NAME:0:1}
    otherLetter=${FUNC_NAME:1}
    firstLetter=$(echo $firstLetter | tr '[:lower:]' '[:upper:]')
    UP_FUNC_NAME=$firstLetter$otherLetter
    NEW_NAME="${NAME}${UP_FUNC_NAME}"
    NEW_LINE_STR=$(echo ${LINE_STR/$FUNC_NAME/$NEW_NAME})
    LINE_STR=$(echo $LINE_STR | sed -e 's/[]\/$*.^[]/\\&/g')
    sed -i "" "${line}s/$LINE_STR/$NEW_LINE_STR/" $FILENAME
  done
done

echo "admin-custom.ts Function name changed successfully"

#给所有的请求方法，加上options入参
ALL_FILES=("admin-custom.ts" "captcha-custom.ts" "luckdraw-custom.ts")
for filename in "${ALL_FILES[@]}"; do
  STR1=") {"
  NEWSTR1=", options?: { [key: string]: any }) {"
  sed -i "" "s/$STR1/$NEWSTR1/" $filename

  STR2="(, options?:"
  STR2=$(echo $STR2 | sed -e 's/[]\/$*.^[]/\\&/g')
  NEWSTR2="(options?:"
  sed -i "" "s/$STR2/$NEWSTR2/" $filename

  STR3=")"
  NEWSTR3=", options)"
  for line in $(sed -n '/return webapi./=' $filename); do
    OLD_STR=$(sed -n $(expr ${line}p) $filename)
    OLD_STR=$(echo $OLD_STR | sed -e 's/[]\/$*.^[]/\\&/g')
    NEW_STR=$(echo ${OLD_STR/$STR3/$NEWSTR3})
    sed -i "" "${line}s/$OLD_STR/$NEW_STR/" $filename
  done
done
echo "admin-custom.ts Function parameter added successfully"

echo "------------------------【update successfully】------------------------"
