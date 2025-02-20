from flask import Flask, jsonify, render_template, request # type: ignore
import hashlib
import time

app = Flask(__name__)

# Blockchain Class
class Blockchain:
    def __init__(self):
        self.chain = []
        self.create_block("Genesis Block", "0")

    def create_block(self, data, previous_hash):
        index = len(self.chain)
        timestamp = time.time()
        nonce = 0
        block = {
            "index": index,
            "timestamp": timestamp,
            "data": data,
            "previous_hash": previous_hash,
            "nonce": nonce,
            "hash": self.compute_hash(index, timestamp, data, previous_hash, nonce)
        }
        self.chain.append(block)
        return block

    def compute_hash(self, index, timestamp, data, previous_hash, nonce):
        block_string = f"{index}{timestamp}{data}{previous_hash}{nonce}"
        return hashlib.sha256(block_string.encode()).hexdigest()

blockchain = Blockchain()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/get_chain", methods=["GET"])
def get_chain():
    return jsonify(blockchain.chain)

@app.route("/mine", methods=["POST"])
def mine():
    data = request.json.get("data", "")
    previous_hash = blockchain.chain[-1]["hash"] if blockchain.chain else "0"
    new_block = blockchain.create_block(data, previous_hash)
    return jsonify(new_block)

@app.route("/fix_chain", methods=["POST"])
def fix_chain():
    for i in range(1, len(blockchain.chain)):
        blockchain.chain[i]["previous_hash"] = blockchain.chain[i - 1]["hash"]
        blockchain.chain[i]["hash"] = blockchain.compute_hash(
            blockchain.chain[i]["index"],
            blockchain.chain[i]["timestamp"],
            blockchain.chain[i]["data"],
            blockchain.chain[i]["previous_hash"],
            blockchain.chain[i]["nonce"]
        )
    return jsonify({"message": "Blockchain fixed!", "chain": blockchain.chain})

@app.route("/compute_hash", methods=["POST"])
def compute_hash():
    data = request.json
    index = data["index"]
    timestamp = data["timestamp"]
    block_data = data["data"]
    previous_hash = data["previous_hash"]
    nonce = data["nonce"]
    computed_hash = blockchain.compute_hash(index, timestamp, block_data, previous_hash, nonce)
    return jsonify({"hash": computed_hash})

if __name__ == "__main__":
    app.run(debug=True)
