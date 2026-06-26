from flask import Flask, jsonify, request
import requests
import time
import re
from urllib.parse import quote

app = Flask(__name__)

# ========== 角色名映射：中文 -> 各站英文标签 ==========
CHARACTER_TAGS = {
    # 原神
    "雷电将军": ["raiden_shogun", "raiden_(genshin_impact)"],
    "甘雨": ["ganyu_(genshin_impact)", "ganyu"],
    "胡桃": ["hu_tao_(genshin_impact)", "hu_tao"],
    "刻晴": ["keqing_(genshin_impact)", "keqing"],
    "优菈": ["eula_(genshin_impact)", "eula"],
    "神里绫华": ["kamisato_ayaka", "ayaka_(genshin_impact)"],
    "宵宫": ["yoimiya_(genshin_impact)", "yoimiya"],
    "心海": ["sangonomiya_kokomi", "kokomi_(genshin_impact)"],
    "八重神子": ["yae_miko", "yae_(genshin_impact)"],
    "纳西妲": ["nahida_(genshin_impact)", "nahida"],
    "妮露": ["nilou_(genshin_impact)", "nilou"],
    "申鹤": ["shenhe_(genshin_impact)", "shenhe"],
    "云堇": ["yun_jin_(genshin_impact)", "yun_jin"],
    "久岐忍": ["kuki_shinobu", "kuki_(genshin_impact)"],
    "柯莱": ["collei_(genshin_impact)", "collei"],
    "珐露珊": ["faruzan_(genshin_impact)", "faruzan"],
    "瑶瑶": ["yaoyao_(genshin_impact)", "yaoyao"],
    "迪希雅": ["dehya_(genshin_impact)", "dehya"],
    "琳妮特": ["lynette_(genshin_impact)", "lynette"],
    "芙宁娜": ["furina_(genshin_impact)", "furina", "focalors_(genshin_impact)"],
    "娜维娅": ["navia_(genshin_impact)", "navia"],
    "千织": ["chiori_(genshin_impact)", "chiori"],
    "仆人": ["arlecchino_(genshin_impact)", "arlecchino", "peruere"],
    "克洛琳德": ["clorinde_(genshin_impact)", "clorinde"],
    "希格雯": ["sigewinne_(genshin_impact)", "sigewinne"],
    "艾梅莉埃": ["emilie_(genshin_impact)", "emilie"],
    "玛拉妮": ["mualani_(genshin_impact)", "mualani"],
    "希诺宁": ["xilonen_(genshin_impact)", "xilonen"],
    "恰斯卡": ["chasca_(genshin_impact)", "chasca"],
    "茜特菈莉": ["citlali_(genshin_impact)", "citlali"],
    "玛薇卡": ["mavuika_(genshin_impact)", "mavuika"],
    # 星铁
    "三月七": ["march_7th_(honkai:_star_rail)", "march_7th"],
    "姬子": ["himeko_(honkai:_star_rail)", "himeko"],
    "布洛妮娅": ["bronya_rand", "bronya_(honkai:_star_rail)"],
    "希儿": ["seele_(honkai:_star_rail)", "seele"],
    "克拉拉": ["clara_(honkai:_star_rail)", "clara"],
    "停云": ["tingyun_(honkai:_star_rail)", "tingyun"],
    "卡芙卡": ["kafka_(honkai:_star_rail)", "kafka"],
    "银狼": ["silver_wolf_(honkai:_star_rail)", "silver_wolf"],
    "符玄": ["fu_xuan_(honkai:_star_rail)", "fu_xuan"],
    "藿藿": ["huohuo_(honkai:_star_rail)", "huohuo"],
    "黑天鹅": ["black_swan_(honkai:_star_rail)", "black_swan"],
    "黄泉": ["acheron_(honkai:_star_rail)", "acheron"],
    "知更鸟": ["robin_(honkai:_star_rail)", "robin"],
    "流萤": ["firefly_(honkai:_star_rail)", "firefly"],
    "云璃": ["yunli_(honkai:_star_rail)", "yunli"],
    "飞霄": ["feixiao_(honkai:_star_rail)", "feixiao"],
    "灵砂": ["lingsha_(honkai:_star_rail)", "lingsha"],
    "阮梅": ["ruan_mei_(honkai:_star_rail)", "ruan_mei"],
    "花火": ["sparkle_(honkai:_star_rail)", "sparkle"],
    "镜流": ["jingliu_(honkai:_star_rail)", "jingliu"],
    "翡翠": ["jade_(honkai:_star_rail)", "jade"],
    "遐蝶": ["castorice_(honkai:_star_rail)", "castorice"],
    "阿格莱雅": ["aglaia_(honkai:_star_rail)", "aglaia"],
    "风堇": ["hyacine_(honkai:_star_rail)", "hyacine"],
    "赛飞儿": ["cipher_(honkai:_star_rail)", "cipher"],
    # 崩坏3
    "琪亚娜": ["kiana_kaslana", "herrscher_of_the_void"],
    "芽衣": ["raiden_mei", "mei_(honkai_impact)"],
    "德丽莎": ["theresa_apocalypse", "theresa_(honkai_impact)"],
    "八重樱": ["yae_sakura", "sakura_(honkai_impact)"],
    "卡莲": ["kallen_kaslana", "kallen_(honkai_impact)"],
    "符华": ["fu_hua", "fu_hua_(honkai_impact)"],
    "丽塔": ["rita_rossweisse", "rita_(honkai_impact)"],
    "幽兰黛尔": ["durandal_(honkai_impact)", "bianka_ataegina"],
    "萝莎莉娅": ["rozaliya_olenyeva"],
    "莉莉娅": ["liliya_olenyeva"],
    "霞": ["kasumi_(honkai_impact)"],
    "迷迭": ["rita_rossweisse"],
    "识之律者": ["herrscher_of_sentience", "fu_hua_(honkai_impact)"],
    "薪炎之律者": ["herrscher_of_flamescion", "kiana_(honkai_impact)"],
    "次生银翼": ["silverwing_n-ex", "bronya_(honkai_impact)"],
    "人律": ["herrscher_of_human_ego", "elysia_(honkai_impact)", "elysia"],
    "终焉之律者": ["herrscher_of_the_end", "kiana_(honkai_impact)"],
    "死生之律者": ["herrscher_of_rebirth", "seele_(honkai_impact)"],
    "薇塔": ["vita_(honkai_impact)", "vita"],
}

ALL_CHARACTER_NAMES = list(CHARACTER_TAGS.keys())

# ========== 请求工具 ==========
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
}

session = requests.Session()
session.headers.update(HEADERS)


def safe_get(url, timeout=15):
    try:
        r = session.get(url, timeout=timeout)
        r.raise_for_status()
        return r.json() if r.headers.get("content-type", "").startswith("application/json") else r.text
    except Exception as e:
        print(f"fetch error {url[:60]}: {e}")
        return None


def normalize_url(url):
    """统一图片URL用于去重"""
    if not url:
        return ""
    return url.split("?")[0].rstrip("/").lower()


# ========== 数据源 1: Gelbooru ==========
def fetch_gelbooru(tags, page=1, limit=20):
    tag_str = quote(" ".join(tags))
    url = f"https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags={tag_str}&limit={limit}&pid={page-1}"
    data = safe_get(url)
    if not data or not isinstance(data, dict):
        return []
    posts = data.get("post", [])
    result = []
    for p in posts:
        img = p.get("file_url") or p.get("sample_url")
        if not img:
            continue
        result.append({
            "id": f"gb_{p.get('id')}",
            "title": f"{p.get('tag_string_character', '')[:30]}",
            "url": img,
            "source": "gelbooru",
            "views": int(p.get("score", 0)) * 10,
        })
    return result


# ========== 数据源 2: Konachan ==========
def fetch_konachan(tags, page=1, limit=20):
    tag_str = quote(" ".join(tags))
    url = f"https://konachan.com/post.json?tags={tag_str}&limit={limit}&page={page}"
    data = safe_get(url)
    if not data or not isinstance(data, list):
        return []
    result = []
    for p in data:
        img = p.get("file_url") or p.get("sample_url")
        if not img:
            continue
        result.append({
            "id": f"kn_{p.get('id')}",
            "title": p.get("tags", "")[:40],
            "url": img,
            "source": "konachan",
            "views": p.get("score", 0) * 10,
        })
    return result


# ========== 数据源 3: Yande.re ==========
def fetch_yandere(tags, page=1, limit=20):
    tag_str = quote(" ".join(tags))
    url = f"https://yande.re/post.json?tags={tag_str}&limit={limit}&page={page}"
    data = safe_get(url)
    if not data or not isinstance(data, list):
        return []
    result = []
    for p in data:
        img = p.get("file_url") or p.get("sample_url")
        if not img:
            continue
        result.append({
            "id": f"yd_{p.get('id')}",
            "title": p.get("tags", "")[:40],
            "url": img,
            "source": "yandere",
            "views": p.get("score", 0) * 10,
        })
    return result


# ========== 数据源 4: Mihoyo BBS ==========
MIHOYO_FORUMS = {"原神COS": 49, "原神同人": 29, "星铁同人": 56, "崩坏同人": 32}

def fetch_mihoyo(forum_id, page=1):
    url = "https://bbs-api.mihoyo.com/post/wapi/getForumPostList"
    params = {"forum_id": forum_id, "page_size": 20, "page": page}
    mh_headers = {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) miHoYoBBS/2.71.1",
        "x-rpc-client_type": "5",
    }
    try:
        r = session.get(url, params=params, headers=mh_headers, timeout=15)
        data = r.json()
        posts = data.get("data", {}).get("list", [])
        result = []
        for p in posts:
            post = p.get("post", {})
            images = post.get("images", [])
            cover = post.get("cover", "")
            img = images[0] if images else (cover if cover else None)
            if not img:
                continue
            title = post.get("subject", "")
            if any(m in title for m in ["男生", "男角色", "男cos", "男性"]):
                continue
            result.append({
                "id": f"my_{post['post_id']}",
                "title": title[:40],
                "url": img,
                "source": "mihoyo",
                "views": post.get("view_num", 0),
            })
        return result
    except Exception as e:
        print(f"mihoyo error: {e}")
        return []


# ========== 聚合逻辑 ==========
def aggregate(character_name="", game="", page=1):
    results = []
    seen_urls = set()

    def add_unique(items):
        for item in items:
            key = normalize_url(item["url"])
            if key and key not in seen_urls:
                seen_urls.add(key)
                results.append(item)

    if character_name and character_name != "全部":
        tags = CHARACTER_TAGS.get(character_name, [character_name])
        safe_tags = [t for t in tags] + ["rating:safe"]

        # 并行请求多个源
        add_unique(fetch_gelbooru(safe_tags, page, 20))
        add_unique(fetch_konachan(safe_tags, page, 20))
        add_unique(fetch_yandere(safe_tags, page, 20))

        # 米游社作为补充
        if game in ["原神", "崩坏", "崩坏3"]:
            for fname in ["原神COS", "原神同人", "崩坏同人"]:
                fid = MIHOYO_FORUMS.get(fname)
                if fid:
                    add_unique(fetch_mihoyo(fid, page))
        elif game == "星铁":
            add_unique(fetch_mihoyo(MIHOYO_FORUMS["星铁同人"], page))

    else:
        # 全部模式：也从多个源拉热门图
        add_unique(fetch_gelbooru(["rating:safe", "score:>50"], page, 15))
        add_unique(fetch_yandere(["rating:safe", "score:>50"], page, 15))
        if game == "原神":
            for fname in ["原神COS", "原神同人"]:
                add_unique(fetch_mihoyo(MIHOYO_FORUMS[fname], page))
        elif game == "星铁":
            add_unique(fetch_mihoyo(MIHOYO_FORUMS["星铁同人"], page))
        elif game in ["崩坏", "崩坏3"]:
            add_unique(fetch_mihoyo(MIHOYO_FORUMS["崩坏同人"], page))

    # 按views排序
    results.sort(key=lambda x: x.get("views", 0), reverse=True)
    return results


# ========== API 路由 ==========
@app.route("/wallpapers")
@app.route("/")
def wallpapers():
    cat = request.args.get("category", "原神")
    page = int(request.args.get("page", 1))
    character = request.args.get("character", "")

    data = aggregate(character, cat, page)
    return jsonify(data)


@app.route("/characters")
def characters():
    return jsonify(ALL_CHARACTER_NAMES)


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=False)
