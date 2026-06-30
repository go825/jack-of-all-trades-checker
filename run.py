from flask import Flask, render_template
from app.services.riot_api import get_latest_patch

app = Flask(
    __name__,
    template_folder="templates",
    static_folder="static"
)


@app.route("/")
def index():
    patch = get_latest_patch()

    return render_template(
        "index.html",
        patch=patch
    )


if __name__ == "__main__":
    app.run(debug=True)