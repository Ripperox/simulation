document.addEventListener("DOMContentLoaded", function () {
    fetchChain();

    document.getElementById("blockData").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            mineBlock();
        }
    });
});

async function fetchChain() {
    const response = await fetch("/get_chain");
    const chain = await response.json();
    displayBlocks(chain);
}

function displayBlocks(chain) {
    const container = document.getElementById("blockchainContainer");
    container.innerHTML = "";

    chain.forEach((block) => {
        const blockDiv = document.createElement("div");
        blockDiv.classList.add("block");
        blockDiv.dataset.index = block.index;
        blockDiv.dataset.hash = block.hash;
        blockDiv.dataset.previousHash = block.previous_hash;
        blockDiv.dataset.nonce = block.nonce;
        // Store the original timestamp for recalculation
        blockDiv.dataset.timestamp = block.timestamp;

        blockDiv.innerHTML = `
            <h3>Block #${block.index}</h3>
            <p><strong>Prev:</strong> ${block.previous_hash.slice(0, 10)}...</p>
            <input type="text" class="data" value="${block.data}" oninput="validateBlockchain()">
            <p><strong>Nonce:</strong> ${block.nonce}</p>
            <p><strong>Hash:</strong> <span class="hash">${block.hash.slice(0, 10)}...</span></p>
        `;

        container.appendChild(blockDiv);
    });

    validateBlockchain();
}

async function mineBlock() {
    const blockData = document.getElementById("blockData").value.trim();
    if (!blockData) return alert("Enter block data.");

    await fetch("/mine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: blockData }),
    });

    fetchChain();
}

async function validateBlockchain() {
    const blocks = document.querySelectorAll(".block");
    let isChainValid = true;

    for (let i = 1; i < blocks.length; i++) {
        const prevBlock = blocks[i - 1];
        const currBlock = blocks[i];

        const expectedPrevHash = prevBlock.dataset.hash;
        const actualPrevHash = currBlock.dataset.previousHash;

        // Use the stored timestamp for hash recalculation
        const recalculatedHash = await computeHash(
            currBlock.dataset.index,
            currBlock.dataset.timestamp,
            currBlock.querySelector(".data").value,
            actualPrevHash,
            currBlock.dataset.nonce
        );

        if (actualPrevHash !== expectedPrevHash || recalculatedHash !== currBlock.dataset.hash) {
            currBlock.classList.add("invalid");
            currBlock.classList.remove("valid");
            isChainValid = false;

            // Invalidate subsequent blocks
            for (let j = i + 1; j < blocks.length; j++) {
                blocks[j].classList.add("invalid");
                blocks[j].classList.remove("valid");
            }
            break;
        } else {
            currBlock.classList.remove("invalid");
            currBlock.classList.add("valid");
        }
    }

    return isChainValid;
}

async function computeHash(index, timestamp, data, previousHash, nonce) {
    const response = await fetch("/compute_hash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index, timestamp, data, previous_hash: previousHash, nonce }),
    });
    const result = await response.json();
    return result.hash;
}

async function fixBlockchain() {
    await fetch("/fix_chain", { method: "POST" });
    fetchChain();
}
