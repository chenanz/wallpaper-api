@echo off
chcp 65001 >nul
echo ==========================================
echo   米游社 API 原始数据抓取测试
echo ==========================================
echo.
cd /d "%~dp0crawler"

echo [1/3] 抓取原神COS区第1页...
python -c "
import requests, json
url = 'https://bbs-api.mihoyo.com/post/wapi/getForumPostList'
params = {'forum_id': 49, 'page_size': 30, 'page': 1}
headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.71.1',
    'x-rpc-client_type': '5',
}
r = requests.get(url, params=params, headers=headers, timeout=15)
data = r.json()
posts = data.get('data', {}).get('list', [])
print(f'共获取 {len(posts)} 条帖子')
print()
for i, p in enumerate(posts[:10]):
    post = p.get('post', {})
    title = post.get('subject', '')
    images = post.get('images', [])
    cover = post.get('cover', '')
    has_img = '有图' if (images or cover) else '无图'
    print(f'{i+1}. {title[:30]} [{has_img}] views:{post.get(\"view_num\",0)}')
" 2>&1 | findstr "."

echo.
echo [2/3] 保存完整原始数据到 result.json...
python -c "
import requests, json
url = 'https://bbs-api.mihoyo.com/post/wapi/getForumPostList'
params = {'forum_id': 49, 'page_size': 30, 'page': 1}
headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.71.1',
}
r = requests.get(url, params=params, headers=headers, timeout=15)
with open('../result.json', 'w', encoding='utf-8') as f:
    json.dump(r.json(), f, ensure_ascii=False, indent=2)
print('已保存到 result.json')
"

echo.
echo ==========================================
echo 数据已保存到: %~dp0result.json
echo 请右键用记事本打开查看
echo ==========================================
pause
