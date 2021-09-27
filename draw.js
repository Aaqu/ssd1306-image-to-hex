// current screen size
const screenSize = {
    x: 0,
    y: 0,
    pixels: () => { return screenSize.x * screenSize.y },
};

let pixelsHistory = [];
let removedPixelsHistory = [];

// create draw screen
function createScreen(x, y) {
    //set current screen size
    screenSize.x = x;
    screenSize.y = y;

    const screen = document.querySelector(".screen");
    screen.innerHTML = "";
    screen.style.height = (y * 8) + "px";

    const pixels = {
        id: 1,
        top: 0,
        left: 0,
    };

    while (pixels.id <= x * y) {
        const pixel = screen.appendChild(document.createElement("div"));
        pixel.classList.add("pixel");
        pixel.id = "p" + pixels.id;

        pixel.style.position = "absolute";
        pixel.style.width = "7px";
        pixel.style.height = "7px";
        pixel.style.top = pixels.top + "px";
        pixel.style.left = pixels.left + "px";
        pixel.style.background = "#0b0f14";

        pixels.left += 8;
        if (pixels.id % x === 0) {
            pixels.left = 0;
            pixels.top += 8;
        }
        pixels.id++;
    }
}

function enableButtons() {
    document.querySelector(".undo").disabled = false;
    document.querySelector(".redo").disabled = false;
    document.querySelector(".hex").disabled = false;
    document.querySelector(".copy").disabled = false;
}

// button create screen 128x32 pixels
document.querySelector(".set128x32").addEventListener("click", () => {
    createScreen(128, 32);
    pixelsHistory = [];
    removedPixelsHistory = [];
    enableButtons();
});

// button create screen 128x64 pixels
document.querySelector(".set128x64").addEventListener("click", () =>  {
    createScreen(128, 64);
    pixelsHistory = [];
    removedPixelsHistory = [];
    enableButtons()
});

// mouse state
let mouseState = false;
document.body.onmousedown = () => {
    mouseState = true;
}
document.body.onmouseup = () =>  {
    mouseState = false;
}

// mouse press and move - drawing
document.addEventListener("mouseover", e => {
    if (e.target.parentNode.className === "screen") {
        if (mouseState) {
            removedPixelsHistory = [];
            if (rgb2hex(e.target.style.background) === "#0b0f14") {
                e.target.style.background = "#4bc2dc";
                pixelsHistory.push(e.target.id);
            }
        }
    }
});

// mouse click - remove color
document.addEventListener("click", e => {
    if (e.target.parentNode.className === "screen") {
        if (rgb2hex(e.target.style.background) === "#4bc2dc") {
            e.target.style.background = "#0b0f14";
        } else if (rgb2hex(e.target.style.background) === "#0b0f14") {
            e.target.style.background = "#4bc2dc";
        }
    }
});

// generate hex
document.querySelector(".hex").addEventListener("click", () => {
    // prepare hex array
    let allHex = [];
    let startHexFomPixel = 1;
    const hexGroups = screenSize.pixels() / 8;
    for (let hexGroup = 0; hexGroup < hexGroups; hexGroup++) {
        let pixelBinary = "";
        for (let i = startHexFomPixel; i <= startHexFomPixel + 7; i++) {
            const pixelColor = rgb2hex(document.querySelector("#p" + i).style.background);
            if (pixelColor === "#4bc2dc") {
                pixelBinary += "1";
            } else {
                pixelBinary += "0";
            }
        }
        allHex.push(bin2hex(pixelBinary));
        startHexFomPixel += 8;
    }

    // prepare out string
    let outString = "";
    let allHexId = 0;
    for (let y = 0; y < screenSize.y; y++) {
        for (let x = 0; x < screenSize.x / 8; x++) {
            outString += allHex[allHexId] + ",";
            allHexId++;
        }
        outString += "\n";
    }
    document.querySelector(".outString").innerText = outString.slice(0, -2);
});

// copy out hex string to clipboard
document.querySelector(".copy").addEventListener("click", () => {
    document.body.style.userSelect = "auto";
    const range = document.createRange();
    range.selectNode(document.querySelector(".outString"));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
    document.body.style.userSelect = "none";
});

// undo
document.querySelector(".undo").addEventListener("click", () => {
    if(pixelsHistory.length - 1 >= 0) {
        const pixelId = pixelsHistory[pixelsHistory.length - 1];
        const currentPixelId = document.querySelector('#' + pixelId);
        reverseColor(currentPixelId);
        const splicedPixel = pixelsHistory.splice(pixelsHistory.length - 1, pixelsHistory.length)
        removedPixelsHistory.push(splicedPixel);
    }
});

// redo
document.querySelector(".redo").addEventListener("click", () => {
    if(removedPixelsHistory.length - 1 >= 0) {
        const pixelId = removedPixelsHistory[removedPixelsHistory.length - 1];
        const currentPixelId = document.querySelector('#' + pixelId);
        reverseColor(currentPixelId);
        const splicedPixel = removedPixelsHistory.splice(removedPixelsHistory.length - 1, removedPixelsHistory.length)
        pixelsHistory.push(splicedPixel);
    }
});

// change rgb to hex
function rgb2hex(rgb){
    rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
    return (rgb && rgb.length === 4) ? "#" +
        ("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : "";
}
function reverseColor(el) {
    if (rgb2hex(el.style.background) === "#4bc2dc") {
        el.style.background = "#0b0f14";
    } else if (rgb2hex(el.style.background) === "#0b0f14") {
        el.style.background = "#4bc2dc";
    }
}

// change binary to hex
function bin2hex(binary){
    return "0x" + parseInt(binary, 2).toString(16).toUpperCase();
}