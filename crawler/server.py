from flask import Flask, jsonify, request
import requests

app = Flask(__name__)

FORUMS = {
    "原神COS": 49,
    "原神同人": 29,
    "星铁同人": 56,
    "崩坏同人": 32,
}

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
            result.append({
                "id": str(post["post_id"]),
                "title": post.get("subject", ""),
                "url": cover,
                "category": "二游",
                "width": 1080,
                "height": 1920,
            })
        return result
    except Exception as e:
        return []

@app.route("/wallpapers")
def wallpapers():
    cat = request.args.get("category", "原神COS")
    page = int(request.args.get("page", 1))
    fid = FORUMS.get(cat, 49)
    data = fetch_mihoyo(fid, page)
    return jsonify(data)

import os

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 3000))
    app.run(host="0.0.0.0", port=port, debug=False)
