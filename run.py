from flask import Flask, render_template
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

if __name__ == "__main__":
    app.run(debug=True)