from flask import Flask, Response, render_template
from app.services.riot_api import get_latest_patch
from app.services.item_service import get_all_items

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)


@app.route("/")
def index():

    patch = get_latest_patch()

    items = get_all_items()

    return render_template(
        "index.html",
        patch=patch,
        item_count=len(items),
        items=items
    )

@app.route("/health")
def health():
    return {"status": "ok"}


@app.route("/riot.txt")
def riot_verification():
    return Response(
        "967cfc001-8079-45d8-8f7c-c3f1a8a70dbb",
        mimetype="text/plain",
    )

@app.route("/privacy")
def privacy():
    return render_template("privacy.html")


@app.route("/terms")
def terms():
    return render_template("terms.html")

if __name__ == "__main__":
    app.run(debug=True)
