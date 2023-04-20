async function main() {
  const puzzleData = document.getElementById("puzzleData").value;
  const puzzleWords = document.getElementById("puzzleWords").value.split(",");
  const puzzleWidth = parseInt(document.getElementById("puzzleWidth").value);
  const puzzleHeight = parseInt(document.getElementById("puzzleHeight").value);

  const canvas = document.getElementById("canvas");
  canvas.style.display = "block";

  canvas.width = puzzleWidth * 50;
  canvas.height = puzzleHeight * 50;

  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#FFFFFF";
  ctx.font = "30px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < puzzleHeight; i++) {
    for (let j = 0; j < puzzleWidth; j++) {
      ctx.strokeRect(j * 50, i * 50, 50, 50);
      ctx.fillText(puzzleData[i * puzzleWidth + j], j * 50 + 25, i * 50 + 25);
    }
  }

  for (let i = 0; i < puzzleWords.length; i++) {
    const word = puzzleWords[i];
    const wordData = await solveWord(puzzleData, puzzleWidth, puzzleHeight, word);

    ctx.strokeStyle = "#FF0000";
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let j = 0; j < wordData.length; j++) {
      const x = wordData[j] % puzzleWidth;
      const y = Math.floor(wordData[j] / puzzleWidth);
      ctx.lineTo(x * 50 + 25, y * 50 + 25);
    }
    ctx.stroke();
  }
}

async function solveWord(puzzleData, puzzleWidth, puzzleHeight, word) {
  const wordData = [];
  for (let i = 0; i < puzzleData.length; i++) {
    if (puzzleData[i] === word[0]) {
      wordData.push(i);
      const wordData2 = await solveWord2(puzzleData, puzzleWidth, puzzleHeight, word, wordData);
      if (wordData2) {
        return wordData2;
      }
      wordData.pop();
    }
  }
}

async function solveWord2(puzzleData, puzzleWidth, puzzleHeight, word, wordData) {
  if (wordData.length === word.length) {
    return wordData;
  }
  const lastWordData = wordData[wordData.length - 1];
  const lastWordDataX = lastWordData % puzzleWidth;
  const lastWordDataY = Math.floor(lastWordData / puzzleWidth);
  for (let i = 0; i < puzzleData.length; i++) {
    if (puzzleData[i] === word[wordData.length]) {
      const iX = i % puzzleWidth;
      const iY = Math.floor(i / puzzleWidth);
      if (Math.abs(lastWordDataX - iX) <= 1 && Math.abs(lastWordDataY - iY) <= 1) {
        wordData.push(i);
        const wordData2 = await solveWord2(puzzleData, puzzleWidth, puzzleHeight, word, wordData);
        if (wordData2) {
          return wordData2;
        }
        wordData.pop();
      }
    }
  }
}

function init() {
  document.getElementById("puzzleData").addEventListener("change", (e) => main());
  document.getElementById("puzzleHeight").addEventListener("change", (e) => main());
  document.getElementById("puzzleWidth").addEventListener("change", (e) => main());
  document.getElementById("puzzleWords").addEventListener("change", (e) => main());
}

document.addEventListener("DOMContentLoaded", () => main());
