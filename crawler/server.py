from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

# 论坛大区映射
FORUMS = {
    "原神COS": 49,
    "原神同人": 29,
    "星铁同人": 56,
    "崩坏同人": 32,
}

# 角色别名映射：主名 -> [别名1, 别名2]
CHARACTER_ALIASES = {
    # 原神
    "雷电将军": ["雷神", "雷电影"],
    "胡桃": ["堂主"],
    "神里绫华": ["绫华", "白鹭公主"],
    "宵宫": ["长野原宵宫"],
    "心海": ["珊瑚宫心海"],
    "八重神子": ["八重", "狐狸"],
    "纳西妲": ["草神", "小吉祥草王"],
    "妮露": ["莲光落舞筵"],
    "芙宁娜": ["芙芙", "水神"],
    "娜维娅": ["刺玫会"],
    "仆人": ["阿蕾奇诺", "佩露薇利"],
    "克洛琳德": ["决斗代理人"],
    "茜特菈莉": ["黑曜石奶奶"],
    "玛薇卡": ["火神"],
    "蓝砚": ["蓝师傅"],
    "梦见月瑞希": ["瑞希"],
    # 星铁
    "布洛妮娅": ["鸭鸭", "大鸭鸭"],
    "希儿": ["蝴蝶"],
    "停云": ["忘归人"],
    "卡芙卡": ["卡妈"],
    "银狼": ["骇客"],
    "符玄": ["太卜司"],
    "藿藿": ["判官"],
    "黑天鹅": ["占卜师"],
    "黄泉": ["虚无令使"],
    "知更鸟": ["罗宾"],
    "流萤": ["萨姆", "格拉默铁骑"],
    "飞霄": ["天击将军"],
    "灵砂": ["丹鼎司"],
    "阮梅": ["天才俱乐部"],
    "花火": ["假面愚者"],
    "镜流": ["剑首"],
    "遐蝶": ["死荫之蝶"],
    "赛飞儿": ["猫猫"],
    # 崩坏3
    "琪亚娜": ["草履虫", "薪炎"],
    "芽衣": ["雷律"],
    "德丽莎": ["大姨妈"],
    "八重樱": ["樱"],
    "符华": ["班长", "识律"],
    "丽塔": ["女仆"],
    "幽兰黛尔": ["呆鹅"],
    "希儿": ["黑希", "白希"],
    "识之律者": ["识宝"],
    "终焉之律者": ["终焉"],
}

# 生成反向查询：别名 -> 主角色名
NAME_LOOKUP = {}
for main, aliases in CHARACTER_ALIASES.items():
    NAME_LOOKUP[main] = main
    for alias in aliases:
        NAME_LOOKUP[alias] = main

# 游戏 -> 相关论坛
GAME_FORUMS = {
    "原神": ["原神COS", "原神同人"],
    "星铁": ["星铁同人"],
    "崩坏": ["崩坏同人"],
    "崩坏3": ["崩坏同人"],
}

PAGE_SIZE = 20


def get_keywords(character):
    """根据角色名获取所有应匹配的关键词"""
    if not character:
        return []
    main = NAME_LOOKUP.get(character, character)
    aliases = CHARACTER_ALIASES.get(main, [])
    return list(set([main] + aliases))


def title_matches(title, keywords):
    if not title:
        return False
    for k in keywords:
        if k in title:
            return True
    return False


def fetch_mihoyo(forum_id, page=1):
    """抓取一页帖子"""
    url = "https://bbs-api.mihoyo.com/post/wapi/getForumPostList"
    params = {"forum_id": forum_id, "page_size": PAGE_SIZE, "page": page}
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        data = r.json()
        posts = data["data"]["list"]
        result = []
        for p in posts:
            post = p["post"]
            cover = post.get("cover")
            if not cover:
                continue
            post_id = str(post["post_id"])
            title = post.get("subject", "")
            result.append({
                "id": post_id,
                "title": title,
                "url": cover,
                "tags": [],
                "category": "二游",
                "width": 1080,
                "height": 1920,
                "views": post.get("view_num", 0),
            })
        return result
    except Exception as e:
        print(f"fetch error: {e}")
        return []


def collect_posts(forum_ids, start_page, max_pages=1):
    """聚合多个论坛的多页数据"""
    all_data = []
    seen_ids = set()
    for page in range(start_page, start_page + max_pages):
        for fid in forum_ids:
            posts = fetch_mihoyo(fid, page)
            for post in posts:
                if post["id"] in seen_ids:
                    continue
                seen_ids.add(post["id"])
                all_data.append(post)
    return all_data


@app.route("/wallpapers")
@app.route("/")
def wallpapers():
    cat = request.args.get("category", "原神")
    page = int(request.args.get("page", 1))
    character = request.args.get("character", "")
    sort = request.args.get("sort", "views")

    # 确定要爬哪些论坛
    if cat in FORUMS:
        forum_ids = [FORUMS[cat]]
    elif cat in GAME_FORUMS:
        forum_ids = [FORUMS[fname] for fname in GAME_FORUMS[cat]]
    else:
        forum_ids = list(FORUMS.values())

    # 按角色筛选时，多翻几页（否则单一角色可能一页不够）；全部时只用一页避免太慢
    max_pages = 3 if character else 1
    all_data = collect_posts(forum_ids, page, max_pages)

    # 按角色名筛选
    if character:
        keywords = get_keywords(character)
        all_data = [item for item in all_data if title_matches(item["title"], keywords)]

    # 简单过滤掉明显男角色的帖子
    all_data = [item for item in all_data if "男" not in item.get("title", "")]

    # 排序
    if sort == "views":
        all_data.sort(key=lambda x: x.get("views", 0), reverse=True)
    elif sort == "new":
        all_data.reverse()

    return jsonify(all_data)


@app.route("/characters")
def characters():
    return jsonify(list(CHARACTER_ALIASES.keys()))


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=False)
