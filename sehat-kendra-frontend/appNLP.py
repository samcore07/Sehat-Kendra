from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return "CARESSE Backend is running!"


@app.route("/api/hello", methods=["POST"])
def hello():
    data = request.json

    name = data.get("name", "Guest")

    return jsonify({
        "message": f"Hello {name}! Python received your request."
    })


if __name__ == "__main__":
    app.run(debug=True)