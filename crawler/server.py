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

# 女角色关键词 + 别名
CHARACTER_ALIASES = {
    "雷电将军": ["雷神", "雷电影"],
    "甘雨": [],
    "胡桃": ["堂主"],
    "刻晴": [],
    "优菈": [],
    "神里绫华": ["绫华"],
    "宵宫": [],
    "心海": ["珊瑚宫"],
    "八重神子": ["八重", "狐狸"],
    "纳西妲": ["草神"],
    "妮露": [],
    "申鹤": [],
    "云堇": [],
    "久岐忍": [],
    "柯莱": [],
    "珐露珊": [],
    "瑶瑶": [],
    "迪希雅": [],
    "琳妮特": [],
    "芙宁娜": ["芙芙", "水神"],
    "娜维娅": [],
    "千织": [],
    "仆人": ["阿蕾奇诺"],
    "克洛琳德": [],
    "希格雯": [],
    "艾梅莉埃": [],
    "玛拉妮": [],
    "希诺宁": [],
    "恰斯卡": [],
    "茜特菈莉": [],
    "玛薇卡": ["火神"],
    "蓝砚": [],
    "梦见月瑞希": [],
    "三月七": [],
    "姬子": [],
    "布洛妮娅": ["鸭鸭"],
    "希儿": [],
    "克拉拉": [],
    "停云": ["忘归人"],
    "卡芙卡": ["卡妈"],
    "银狼": [],
    "符玄": [],
    "藿藿": [],
    "黑天鹅": [],
    "黄泉": [],
    "知更鸟": [],
    "流萤": ["萨姆"],
    "云璃": [],
    "飞霄": [],
    "灵砂": [],
    "阮梅": [],
    "花火": [],
    "镜流": [],
    "翡翠": [],
    "遐蝶": [],
    "阿格莱雅": [],
    "风堇": [],
    "赛飞儿": ["猫猫"],
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

ALL_KEYWORDS = []
for k, v in CHARACTER_ALIASES.items():
    ALL_KEYWORDS.append(k)
    ALL_KEYWORDS.extend(v)

GAME_FORUMS = {
    "原神": ["原神COS", "原神同人"],
    "星铁": ["星铁同人"],
    "崩坏": ["崩坏同人"],
    "崩坏3": ["崩坏同人"],
}

SIZE = 30

MIHOYO_HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.71.1",
    "x-rpc-client_type": "5",
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://bbs.mihoyo.com/",
}


def get_tags_from_title(title):
    """从标题提取匹配的角色标签"""
    if not title:
        return []
    tags = []
    for main_name, aliases in CHARACTER_ALIASES.items():
        all_names = [main_name] + aliases
        for name in all_names:
            if name in title:
                tags.append(main_name)
                break
    return list(set(tags))


def is_male_post(title):
    """检测是否为男性角色内容"""
    if not title:
        return False
    male_markers = ["男生", "男角色", "男cos", "男的", "男性", "哥哥", "叔叔", "爷爷", "公公", "牛郎"]
    return any(m in title for m in male_markers)


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
            img_url = images[0] if images else (cover if cover else None)
            if not img_url:
                continue
            title = post.get("subject", "")
            if is_male_post(title):
                continue
            tags = get_tags_from_title(title)
            result.append({
                "id": str(post["post_id"]),
                "title": title,
                "url": img_url,
                "tags": tags,
                "views": post.get("view_num", 0),
            })
        return result
    except Exception as e:
        print(f"fetch error: {e}")
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

    # 找一个角色时多翻几页提高命中率；全部时只翻2页保证速度
    max_pages = 8 if character else 2
    data = collect_posts(forum_ids, page, max_pages)

    # 如果指定了角色，尝试过滤；但如果结果太少，返回带该标签的 + 完全不限制返回一些
    if character:
        tagged = [item for item in data if character in item.get("tags", [])]
        if len(tagged) >= 3:
            data = tagged
        elif tagged:
            # 有少量匹配，拼接一些其他帖子防止太单调
            others = [item for item in data if character not in item.get("tags", [])]
            data = tagged + others[:6]
        else:
            # 完全没匹配到这个角色，返回全部帖子（前端自己处理空状态）
            pass

    if sort == "views":
        data.sort(key=lambda x: x.get("views", 0), reverse=True)
    elif sort == "new":
        data.reverse()

    return jsonify(data)


@app.route("/characters")
def characters():
    return jsonify({"原神": [k for k, v in CHARACTER_ALIASES.items() if k in [
        '雷电将军','甘雨','胡桃','刻晴','优菈','神里绫华','宵宫','心海','八重神子','纳西妲','妮露','申鹤','云堇','久岐忍','柯莱','珐露珊','瑶瑶','迪希雅','琳妮特','芙宁娜','娜维娅','千织','仆人','克洛琳德','希格雯','艾梅莉埃','玛拉妮','希诺宁','恰斯卡','茜特菈莉','玛薇卡','蓝砚','梦见月瑞希',
    ]], "星铁": [k for k, v in CHARACTER_ALIASES.items() if k in [
        '三月七','姬子','布洛妮娅','希儿','克拉拉','停云','卡芙卡','银狼','符玄','藿藿','黑天鹅','黄泉','知更鸟','流萤','云璃','飞霄','灵砂','阮梅','花火','镜流','翡翠','遐蝶','阿格莱雅','风堇','赛飞儿',
    ]], "崩坏3": [k for k, v in CHARACTER_ALIASES.items() if k in [
        '琪亚娜','芽衣','德丽莎','八重樱','卡莲','符华','丽塔','幽兰黛尔','希儿','萝莎莉娅','莉莉娅','霞','艾琳','迷迭','识之律者','薪炎之律者','次生银翼','人律','终焉之律者','死生之律者','薇塔',
    ]]})


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=False)
