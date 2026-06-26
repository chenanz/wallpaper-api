from flask import Flask, jsonify, request
import requests
import time

app = Flask(__name__)

FORUMS = {
    "原神COS": 49,
    "原神同人": 29,
    "星铁同人": 56,
    "崩坏同人": 32,
}

CHARACTER_ALIASES = {
    "雷电将军": ["雷神", "雷电影"],
    "胡桃": ["堂主"],
    "神里绫华": ["绫华"],
    "宵宫": [],
    "心海": ["珊瑚宫"],
    "八重神子": ["八重", "狐狸"],
    "纳西妲": ["草神"],
    "妮露": [],
    "芙宁娜": ["芙芙", "水神"],
    "娜维娅": [],
    "仆人": ["阿蕾奇诺"],
    "克洛琳德": [],
    "茜特菈莉": [],
    "玛薇卡": ["火神"],
    "蓝砚": [],
    "梦见月瑞希": ["瑞希"],
    "布洛妮娅": ["鸭鸭"],
    "希儿": [],
    "停云": ["忘归人"],
    "卡芙卡": ["卡妈"],
    "银狼": [],
    "符玄": [],
    "藿藿": [],
    "黑天鹅": [],
    "黄泉": [],
    "知更鸟": [],
    "流萤": ["萨姆"],
    "飞霄": [],
    "灵砂": [],
    "阮梅": [],
    "花火": [],
    "镜流": [],
    "遐蝶": [],
    "赛飞儿": [],
    "琪亚娜": ["草履虫"],
    "芽衣": [],
    "德丽莎": ["大姨妈"],
    "八重樱": [],
    "卡莲": [],
    "符华": [],
    "丽塔": [],
    "幽兰黛尔": ["呆鹅"],
    "萝莎莉娅": [],
    "莉莉娅": [],
    "霞": [],
    "艾琳": [],
    "迷迭": [],
    "识之律者": ["识宝"],
    "薪炎之律者": [],
    "次生银翼": [],
    "人律": ["爱莉希雅"],
    "终焉之律者": [],
    "死生之律者": [],
    "薇塔": [],
}

NAME_LOOKUP = {}
for main, aliases in CHARACTER_ALIASES.items():
    NAME_LOOKUP[main] = main
    for alias in aliases:
        NAME_LOOKUP[alias] = main

GAME_FORUMS = {
    "原神": ["原神COS", "原神同人"],
    "星铁": ["星铁同人"],
    "崩坏": ["崩坏同人"],
    "崩坏3": ["崩坏同人"],
}

ALL_FEMALE_NAMES = list(CHARACTER_ALIASES.keys())
SIZE = 20

MIHOYO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.71.1",
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Referer": "https://bbs.mihoyo.com/",
    "Origin": "https://bbs.mihoyo.com",
    "x-rpc-app_version": "2.71.1",
    "x-rpc-client_type": "5",
}


def get_keywords(character):
    if not character:
        return []
    main = NAME_LOOKUP.get(character, character)
    aliases = CHARACTER_ALIASES.get(main, [])
    return list(set([main] + aliases))


def title_has_any(title, keywords):
    if not title:
        return False
    return any(k in title for k in keywords)


def is_male_content(title):
    if not title:
        return False
    male_markers = ["男生", "男角色", "男cos", "男的", "男性", "他", "哥哥", "叔叔", "爷爷", "公公", "老公", "男朋友", "牛郎"]
    return any(m in title for m in male_markers)


def is_female_content(title):
    if not title:
        return False
    return title_has_any(title, ALL_FEMALE_NAMES)


def fetch_page(forum_id, page=1):
    url = "https://bbs-api.mihoyo.com/post/wapi/getForumPostList"
    params = {"forum_id": forum_id, "page_size": SIZE, "page": page}
    try:
        r = requests.get(url, params=params, headers=MIHOYO_HEADERS, timeout=20)
        r.raise_for_status()
        data = r.json()
        posts = data.get("data", {}).get("list", [])
        result = []
        for p in posts:
            post = p.get("post", {})
            images = post.get("images", [])
            cover = post.get("cover", "")
            # 优先取 images 数组第一张，否则 fallback cover
            img_url = images[0] if images else (cover if cover else None)
            if not img_url:
                continue
            title = post.get("subject", "")
            # 过滤男性内容
            if is_male_content(title):
                continue
            result.append({
                "id": str(post["post_id"]),
                "title": title,
                "url": img_url,
                "views": post.get("view_num", 0),
            })
        return result
    except Exception as e:
        print(f"fetch_page error forum={forum_id} page={page}: {e}")
        return []


def collect_posts(forum_ids, start_page, max_pages=1):
    all_data = []
    seen = set()
    for pg in range(start_page, start_page + max_pages):
        for fid in forum_ids:
            posts = fetch_page(fid, pg)
            for post in posts:
                if post["id"] in seen:
                    continue
                seen.add(post["id"])
                all_data.append(post)
        if pg < start_page + max_pages - 1:
            time.sleep(0.3)
    return all_data


@app.route("/wallpapers")
@app.route("/")
def wallpapers():
    cat = request.args.get("category", "原神")
    page = int(request.args.get("page", 1))
    character = request.args.get("character", "")
    sort = request.args.get("sort", "views")

    if cat in FORUMS:
        forum_ids = [FORUMS[cat]]
    elif cat in GAME_FORUMS:
        forum_ids = [FORUMS[fname] for fname in GAME_FORUMS[cat]]
    else:
        forum_ids = list(FORUMS.values())

    max_pages = 5 if character else 2
    data = collect_posts(forum_ids, page, max_pages)

    if character:
        keywords = get_keywords(character)
        data = [item for item in data if title_has_any(item["title"], keywords)]

    if sort == "views":
        data.sort(key=lambda x: x.get("views", 0), reverse=True)
    elif sort == "new":
        data.reverse()

    return jsonify(data)


@app.route("/characters")
def characters():
    # 按游戏分组返回
    game_chars = {
        "原神": ["雷电将军", "甘雨", "胡桃", "刻晴", "优菈", "神里绫华", "宵宫", "心海",
                "八重神子", "纳西妲", "妮露", "申鹤", "云堇", "久岐忍", "柯莱", "珐露珊",
                "瑶瑶", "迪希雅", "琳妮特", "芙宁娜", "娜维娅", "千织", "仆人", "克洛琳德",
                "希格雯", "艾梅莉埃", "玛拉妮", "希诺宁", "恰斯卡", "茜特菈莉", "玛薇卡", "蓝砚", "梦见月瑞希"],
        "星铁": ["三月七", "姬子", "布洛妮娅", "希儿", "克拉拉", "停云", "卡芙卡", "银狼",
                "符玄", "藿藿", "黑天鹅", "黄泉", "知更鸟", "流萤", "云璃", "飞霄", "灵砂",
                "阮梅", "花火", "镜流", "翡翠", "遐蝶", "阿格莱雅", "风堇", "赛飞儿"],
        "崩坏3": ["琪亚娜", "芽衣", "德丽莎", "八重樱", "卡莲", "符华", "丽塔", "幽兰黛尔",
                 "希儿", "萝莎莉娅", "莉莉娅", "霞", "艾琳", "迷迭", "识之律者",
                 "薪炎之律者", "次生银翼", "人律", "终焉之律者", "死生之律者", "薇塔"],
    }
    return jsonify(game_chars)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=False)
