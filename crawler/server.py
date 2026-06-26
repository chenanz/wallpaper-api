from flask import Flask, jsonify, request
import requests
import re

app = Flask(__name__)

# 论坛大区映射
FORUMS = {
    "原神COS": 49,
    "原神同人": 29,
    "星铁同人": 56,
    "崩坏同人": 32,
}

# 女角色关键词库（用于标题匹配）
FEMALE_CHARACTERS = [
    # 原神
    "雷电将军", "甘雨", "胡桃", "刻晴", "优菈", "神里绫华", "宵宫", "心海",
    "八重神子", "纳西妲", "妮露", "申鹤", "云堇", "久岐忍", "柯莱", "珐露珊",
    "瑶瑶", "迪希雅", "琳妮特", "芙宁娜", "娜维娅", "千织", "仆人", "克洛琳德",
    "希格雯", "艾梅莉埃", "玛拉妮", "希诺宁", "恰斯卡",
    # 星铁
    "三月七", "姬子", "布洛妮娅", "希儿", "克拉拉", "停云", "卡芙卡", "银狼",
    "符玄", "藿藿", "黑天鹅", "黄泉", "知更鸟", "流萤", "云璃", "飞霄", "灵砂",
    "阮梅", "花火", "镜流", "翡翠", "遐蝶", "阿格莱雅", "风堇",
    # 崩坏3
    "琪亚娜", "芽衣", "德丽莎", "八重樱", "卡莲", "符华", "丽塔", "幽兰黛尔",
    "希儿", "萝莎莉娅", "莉莉娅", "霞", "艾琳", "迷迭", "识之律者",
    "薪炎之律者", "次生银翼", "人律", "终焉之律者", "死生之律者", "薇塔",
]

# 去重缓存（内存缓存，进程重启失效）
seen_ids = set()

def fetch_mihoyo(forum_id, page=1):
    url = "https://bbs-api.mihoyo.com/post/wapi/getForumPostList"
    params = {"forum_id": forum_id, "page_size": 20, "page": page}
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
    try:
        r = requests.get(url, params=params, headers=headers, timeout=10)
        data = r.json()
        posts = data["data"]["list"]
        result = []
        for p in posts:
            post = p["post"]
            cover = post.get("cover")
            if not cover:
                continue
            post_id = str(post["post_id"])
            # 全局去重
            if post_id in seen_ids:
                continue
            seen_ids.add(post_id)
            
            title = post.get("subject", "")
            # 标题匹配女性角色名
            tags = []
            for char in FEMALE_CHARACTERS:
                if char in title:
                    tags.append(char)
            
            result.append({
                "id": post_id,
                "title": title,
                "url": cover,
                "tags": tags,  # 匹配到的角色名列表
                "category": "二游",
                "width": 1080,
                "height": 1920,
                "views": post.get("view_num", 0),  # 浏览量，用于排序
            })
        return result
    except Exception as e:
        return []

@app.route("/wallpapers")
@app.route("/")
def wallpapers():
    cat = request.args.get("category", "原神COS")
    page = int(request.args.get("page", 1))
    character = request.args.get("character", "")
    
    # 扩大数据源：如果请求"原神"或"星铁"或"崩坏"，同时爬多个相关论坛
    fid = FORUMS.get(cat)
    forum_ids = []
    if fid:
        forum_ids = [fid]
    elif cat == "原神":
        forum_ids = [FORUMS["原神COS"], FORUMS["原神同人"]]
    elif cat == "星铁":
        forum_ids = [FORUMS["星铁同人"]]
    elif cat == "崩坏":
        forum_ids = [FORUMS["崩坏同人"]]
    else:
        forum_ids = [FORUMS["原神COS"]]
    
    all_data = []
    for fid in forum_ids:
        all_data.extend(fetch_mihoyo(fid, page))
    
    # 按角色名筛选
    if character:
        all_data = [item for item in all_data if character in item.get("tags", [])]
    
    # 排序：高浏览量优先（假设高质量）
    all_data.sort(key=lambda x: x.get("views", 0), reverse=True)
    
    return jsonify(all_data)

# 获取所有角色列表（供前端分类）
@app.route("/characters")
def characters():
    return jsonify(FEMALE_CHARACTERS)

# 每 UptimeRobot ping 一下，让 Render 免费版保持唤醒
@app.route("/health")
def health():
    return jsonify({"status": "ok"})

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=False)
