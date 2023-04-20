const mean = (arr) => {
  let total = 0;
  for (let i = 0; i < arr.length; i++) {
    total += arr[i];
  }
  return (total / arr.length).toFixed(1);
};

const median = (arr) => {
  const { length } = arr;

  arr.sort((a, b) => a - b);

  if (length % 2 === 0) {
    return (arr[length / 2 - 1] + arr[length / 2]) / 2;
  }

  return arr[(length - 1) / 2].toFixed(1);
};

const mode = (arr) => {
  const mode = {};
  let max = 0,
    count = 0;

  for (let i = 0; i < arr.length; i++) {
    const item = arr[i];

    if (mode[item]) {
      mode[item]++;
    } else {
      mode[item] = 1;
    }

    if (count < mode[item]) {
      max = item;
      count = mode[item];
    }
  }

  return max.toFixed(1);
};

function getPercentile(numbers, percentile) {
  const len = numbers.length;

  const index = +((percentile / 100) * (len - 1) + 1).toFixed(2);

  const min = numbers[Math.floor(index) - 1];
  const max = numbers[Math.ceil(index) - 1];
  const partial = (max - min) * (index % 1).toFixed(2);
  const final = min + partial;

  const solution = ` = (${percentile}/100) * (${len} - 1) + 1\n = ${percentile / 100} * ${len - 1} + 1\n = ${index}\n = N${index} = ${final}`;

  const result = { result: final, solution: solution };

  return result;
}

function generateChart() {
  let numbers;
  let percentile;

  try {
    numbers = document.getElementById("numbers").value.split(",");
    numbers = numbers.map((item) => parseInt(item.trim()));
    percentile = parseInt(document.getElementById("percentile").value);

    numbers.sort((a, b) => a - b);
  } catch (e) {
    console.log("Invalid: ", e.message);
    return;
  }

  const len = numbers.length;

  const range = numbers[len - 1] - numbers[0];
  const classes = Math.ceil(1 + 3.322 * Math.log10(len));
  const interval = Math.ceil(range / classes);

  let table = [];

  for (let i = 0; i < classes; i++) {
    table.push([]);
  }

  for (let i = 0; i < classes; i++) {
    const n = i * interval + parseInt(numbers[0]);

    const classInterval = `${n}-${n + interval}`;

    table[i].classInterval = classInterval;
  }

  for (let i = 0; i < classes; i++) {
    const min = parseInt(table[i].classInterval.split("-")[0]);
    const max = parseInt(table[i].classInterval.split("-")[1]);

    const frequency = numbers.filter((n) => n >= min && n <= max).length;

    table[i].frequency = frequency;
  }

  for (let i = 0; i < classes; i++) {
    const min = parseInt(table[i].classInterval.split("-")[0]);
    const max = parseInt(table[i].classInterval.split("-")[1]);

    const classMark = (min + max) / 2;

    table[i].classMark = classMark;
  }

  for (let i = 0; i < classes; i++) {
    const frequency = table[i].frequency;
    const classMark = table[i].classMark;

    const fxm = frequency * classMark;

    table[i].fxm = fxm;
  }

  for (let i = 0; i < classes; i++) {
    const min = parseInt(table[i].classInterval.split("-")[0]) - 0.5;
    const max = parseInt(table[i].classInterval.split("-")[1]) + 0.5;

    table[i].lowerClassBoundary = min;
    table[i].higherClassBoundary = max;
  }

  for (let i = 0; i < classes; i++) {
    const cummulativeFrequency = table[i].frequency + (table[i - 1] ? table[i - 1].cummulativeFrequency : 0);

    table[i].cummulativeFrequency = cummulativeFrequency;
  }

  table.unshift(["Class Interval", "Frequency", "Class Mark", "Fxm", "Lower Class Boundary", "Higher Class Boundary", "Cumulative Frequency"]);

  table.push([[]]);
  table.push([`Length: ${len}`, `Range: ${range}`, `Classes: ${classes}`, `Interval: ${interval}`]);
  table.push([`Mean: ${mean(numbers)}`, `Median: ${median(numbers)}`, `Mode: ${mode(numbers)} `]);

  if (percentile) {
    table.push([[]]);
    const res = getPercentile(numbers, percentile);
    table.push([`P${percentile} = ${res.result}`, `Solution:\n${res.solution}`]);
  }

  let tableData = table.map((a) => Object.values(a));
  createTable(tableData);
}

function createTable(tableData) {
  var table = document.createElement("table");
  var tableBody = document.createElement("tbody");

  tableData.forEach(function (rowData) {
    var row = document.createElement("tr");

    rowData.forEach(function (cellData) {
      if (cellData.length === 0) {
        var cell = document.createElement("br");
        row.appendChild(cell);
      } else {
        var cell = document.createElement("td");
        cell.appendChild(document.createTextNode(cellData));
        row.appendChild(cell);
      }
    });

    tableBody.appendChild(row);
  });

  table.appendChild(tableBody);

  document.getElementById("result").replaceChild(table, document.getElementById("result").firstChild);
}

window.onload = () => {
  document.addEventListener("input", generateChart);
};
