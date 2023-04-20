const imageContainer = document.getElementById("image-container");

const orderSelect = document.getElementById("order");
const ageSelect = document.getElementById("age");
const highQualityCheckbox = document.getElementById("highQuality");
const tagsInput = document.getElementById("tagsInput");

orderSelect.value = localStorage.getItem("order") || "score";
ageSelect.value = localStorage.getItem("age") || "1days";
highQualityCheckbox.checked = localStorage.getItem("highQuality") === "true";
tagsInput.value = localStorage.getItem("tagsInput") || "";

let order = orderSelect.value;
let age = ageSelect.value;
let highQuality = highQualityCheckbox.checked;
let tags = tagsInput.value;

let seenImages = JSON.parse(localStorage.getItem("seenImages")) || [];

let images = [];
let page = 1;
let collecting = false;
let loading = 0;

let interval;

run();

async function run() {
  interval = setInterval(async () => {
    if (!images.length && !collecting) {
      collecting = true;
      await getNewImages(interval);
      collecting = false;
      return;
    }

    if (collecting || !images[0] || imageContainer.scrollHeight - window.scrollY > 20000 || loading > 5) return;

    const imageObject = images.shift();
    addImage(imageObject);
  }, 100);
}

async function getNewImages(interval) {
  // omg i just tried rule34.xxx and it's so dirty and not suitable for normal people
  const url = `https://danbooru.donmai.us/posts.json?limit=200&tags=${tags} order:${order} age:..${age}  (is:questionable or is:explicit)&page=${page}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.length === 0) {
    if (confirm("No more images found. Clear seen images?")) {
      clearSeenImages();
      reset();
    } else {
      clearInterval(interval);
    }
    return;
  }

  page++;

  images = data.filter((img) => {
    return img.large_file_url && ["png", "jpg", "gif"].includes(img.file_ext) && !seenImages.includes(img.id.toString());
  });
}

function addImage(image) {
  const anchor = document.createElement("a");
  const img = document.createElement("img");

  anchor.href = image.file_url;
  anchor.target = "_blank";
  img.src = highQuality ? image.file_url : image.large_file_url;
  img.className = "imageClass";
  img.id = image.id;
  console.log(img.height);
  img.height = window.innerWidth * (img.image_height / img.image_width);
  loading++;

  img.onload = () => {
    img.removeAttribute("height");
    loading--;
  };

  imageContainer.appendChild(anchor.appendChild(img));
}

function reset() {
  imageContainer.innerHTML = "";
  images = [];
  page = 1;
  collecting = false;
  loading = 0;
  clearInterval(interval);
  run();
}

function addSeenImages() {
  const images = document.getElementsByClassName("imageClass");
  for (const image of images) {
    const rect = image.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom < 0 && !seenImages.includes(image.id)) seenImages.push(image.id);
  }
}

function saveSeenImages() {
  localStorage.setItem("seenImages", JSON.stringify(seenImages));
}

function clearSeenImages() {
  localStorage.removeItem("seenImages");
  seenImages = [];
}

window.addEventListener("unload", saveSeenImages);
document.addEventListener("visibilitychange", saveSeenImages);
window.addEventListener("scroll", addSeenImages);

document.addEventListener("keydown", (e) => {
  if (e.key === "Delete" && confirm("Do you want to reset all settings and clear seen images?")) {
    localStorage.clear();
    location.reload();
  }
});

document.getElementById("submit").addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.setItem("order", orderSelect.value);
  localStorage.setItem("age", ageSelect.value);
  localStorage.setItem("highQuality", highQualityCheckbox.checked);
  localStorage.setItem("tagsInput", tagsInput.value);
  order = orderSelect.value;
  age = ageSelect.value;
  highQuality = highQualityCheckbox.checked;
  tags = tagsInput.value;
  reset();
});

document.getElementById("tagsInput").addEventListener("input", async (e) => {
  if (e.key === "Enter") {
    document.getElementById("submit").click();
  }
});

document.getElementById("clearSaved").addEventListener("click", () => {
  if (confirm("Do you want to clear seen images?")) {
    clearSeenImages();
    reset();
  }
});
