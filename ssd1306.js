class ssd1306 {
  constructor(element) {
    this.screen = {
      parent: document.querySelector(element),
      width: 128,
      height: 32,
      lastPixel: [],
      removedPixel: [],
      isDrawing: false,
      mouseDownBackgroundColor: null,
    }
  }

  // create full screen sandbox
  create() {
    // buttons menu
    const menu = this.screen.parent.appendChild(document.createElement('div'));
    menu.className = 'menu';

    // screen sandbox
    const screenSandbox = this.screen.parent.appendChild(document.createElement('div'));
    screenSandbox.className = 'screenSandbox';

    // out hex
    const outHex = this.screen.parent.appendChild(document.createElement('div'));
    outHex.className = 'outHex';
    outHex.style.fontFamily = 'monospace';
    outHex.style.width = '640px';
    outHex.style.margin = '10px auto 0 auto';
    outHex.style.textAlign = 'left';
    outHex.style.userSelect = 'text';

    //first load
    this.createMenu();
    this.createScreen();

    // create screen 128x32px
    document.querySelector('#screen128x32px').addEventListener('click', () => {
      this.screen.width = 128;
      this.screen.height = 32;
      this.createScreen();
    });

    // create screen 128x64px
    document.querySelector('#screen128x64px').addEventListener('click', () => {
      this.screen.width = 128;
      this.screen.height = 64;
      this.createScreen();
    });

    // clear screen area
    document.querySelector('#clear').addEventListener('click', () => {
      this.screen.lastPixel = [];
      this.screen.lastPremovedPixelixel = [];
      const pixels = document.querySelectorAll('.pixel');
      for (const pixel of pixels) {
        pixel.style.backgroundColor = '#0b0f14';
      }
    });

    // fill screen area
    document.querySelector('#fill').addEventListener('click', () => {
      this.screen.lastPixel = [];
      this.screen.lastPremovedPixelixel = [];
      const pixels = document.querySelectorAll('.pixel');
      for (const pixel of pixels) {
        pixel.style.backgroundColor = '#4bc2dc';
      }
    });

    // undo button
    document.querySelector('#undo').addEventListener('click', () => {
      if (this.screen.lastPixel.length - 1 >= 0) {
        const pixelId = this.screen.lastPixel[this.screen.lastPixel.length - 1];
        const currentPixelId = document.querySelector('#' + pixelId);
        reverseColor(currentPixelId);
        const splicedPixel = this.screen.lastPixel.splice(this.screen.lastPixel.length - 1, this.screen.lastPixel.length)
        this.screen.removedPixel.push(splicedPixel);
      }
    });

    // redo button
    document.querySelector('#redo').addEventListener('click', () => {
      if (this.screen.removedPixel.length - 1 >= 0) {
        const pixelId = this.screen.removedPixel[this.screen.removedPixel.length - 1];
        const currentPixelId = document.querySelector('#' + pixelId);
        reverseColor(currentPixelId);
        const splicedPixel = this.screen.removedPixel.splice(this.screen.removedPixel.length - 1, this.screen.removedPixel.length)
        this.screen.lastPixel.push(splicedPixel);
      }
    });

    // convert to hex
    document.querySelector('#hex').addEventListener('click', () => {
      // prepare hex array
      const screenArea = this.screen.parent;
      const allPixels = screenArea.querySelectorAll('.pixel');
      const allPixelsColor = [...allPixels].map(e => {
        return rgb2hex(e.style.backgroundColor) === '#4bc2dc' ? 1 : 0;
      });
      const allPixelsBoolean = allPixelsColor.join('').match(/.{1,8}/g);
      const allPixelsHex = allPixelsBoolean.map(e => {
        return bin2hex(e);
      });

      // prepare out string
      const allPixelsString = allPixelsHex.reduce((prev, element, index, array) => {
        const inRow = this.screen.width / 8;
        const currentRowId = (index + 1) % (this.screen.width / 8) ? false : 16;
        if (index + 1 === array.length) {
          return prev + element;
        } else if (inRow === currentRowId) {
          return prev + element + ',\n';
        } else {
          return prev + element + ',';
        }
      }, '');

      outHex.innerText = arduinoSketch(allPixelsString, this.screen.width, this.screen.height);
    });

    // copy to clipboard
    document.querySelector('#copy').addEventListener('click', () => {
      document.body.style.userSelect = 'auto';
      const range = document.createRange();
      const screenArea = this.screen.parent;
      range.selectNode(screenArea.querySelector('.outHex'));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      document.body.style.userSelect = 'none';
    });
  }

  // create menu buttons
  createMenu() {
    const screenArea = this.screen.parent;
    const menu = screenArea.querySelector('.menu');
    menu.style.width = '1000px';
    menu.style.margin = 'auto';
    menu.style.padding = '10px';
    menu.style.backgroundColor = '#2b2b2b';

    createButton(menu, 'screen128x32px', 'Screen 128x32px');
    createButton(menu, 'screen128x64px', 'Screen 128x64px');
    createButton(menu, 'clear', 'Clear');
    createButton(menu, 'fill', 'Fill');
    createButton(menu, 'undo', 'Undo');
    createButton(menu, 'redo', 'Redo');
    createButton(menu, 'hex', 'Convert to HEX');
    createButton(menu, 'copy', 'Copy');

    function createButton(parent, id, innerText) {
      const button = parent.appendChild(document.createElement('button'));
      button.id = id;
      button.innerText = innerText;
      button.style.color = '#fff';
      button.style.fontSize = '14px';
      button.style.margin = '0 0 0 2px';
      button.style.padding = '3px 10px';
      button.style.border = 'none';
      button.style.borderRadius = '0';
      button.style.cursor = 'pointer';
    }
  }

  createScreen() {
    // create screen area
    const screenArea = this.screen.parent;
    const screenSandbox = screenArea.querySelector('.screenSandbox');
    screenSandbox.innerHTML = '';
    screenSandbox.className = 'screenSandbox';
    screenSandbox.style.position = 'relative';
    screenSandbox.style.width = '1023px';
    screenSandbox.style.margin = '10px auto 0 auto';
    screenSandbox.style.height = (this.screen.height * 8) + 'px';

    // create all pixels
    const currentPixel = {
      id: 1,
      top: 0,
      left: 0,
    };

    while (currentPixel.id <= this.screen.width * this.screen.height) {
      const pixel = screenSandbox.appendChild(document.createElement('div'));
      pixel.className = 'pixel';
      pixel.id = 'p' + currentPixel.id;
      pixel.style.position = 'absolute';
      pixel.style.width = '7px';
      pixel.style.height = '7px';
      pixel.style.top = currentPixel.top + 'px';
      pixel.style.left = currentPixel.left + 'px';
      pixel.style.backgroundColor = '#0b0f14';

      currentPixel.left += 8;
      if (currentPixel.id % this.screen.width === 0) {
        currentPixel.left = 0;
        currentPixel.top += 8;
      }
      
      currentPixel.id++;
    }

    // mouse down
    screenSandbox.addEventListener('mousedown', e => {
      if (e.target.classList.contains('pixel')) {
        console.log(rgb2hex(e.target.style.backgroundColor));
        this.screen.mouseDownBackgroundColor = rgb2hex(e.target.style.backgroundColor);
        reverseColor(e.target);
        this.screen.lastPixel.push(e.target.id);
      }
      this.screen.isDrawing = true;
    });

    // mouse draw
    screenSandbox.addEventListener('mouseover', e => {
      if (e.target.classList.contains('pixel') && this.screen.isDrawing) {
        this.screen.removedPixel = [];
        if (rgb2hex(e.target.style.backgroundColor) === '#0b0f14' && this.screen.mouseDownBackgroundColor === '#0b0f14') {
          e.target.style.backgroundColor = '#4bc2dc';
          this.screen.lastPixel.push(e.target.id);
        } else if (rgb2hex(e.target.style.backgroundColor) === '#4bc2dc' && this.screen.mouseDownBackgroundColor === '#4bc2dc') {
          e.target.style.backgroundColor = '#0b0f14';
          this.screen.lastPixel.push(e.target.id);
        }
      }
    });

    // mouse up
    window.addEventListener('mouseup', () => {
      this.screen.isDrawing = false;
    });
  }
}

// change rgb to hex
function rgb2hex(rgb) {
  rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
  return (rgb && rgb.length === 4) ? '#' +
    ('0' + parseInt(rgb[1], 10).toString(16)).slice(-2) +
    ('0' + parseInt(rgb[2], 10).toString(16)).slice(-2) +
    ('0' + parseInt(rgb[3], 10).toString(16)).slice(-2) : '';
}

// change binary to hex
function bin2hex(binary) {
  return '0x' + parseInt(binary, 2).toString(16).toUpperCase();
}

// reverse pixel color
function reverseColor(element) {
  switch (rgb2hex(element.style.backgroundColor)) {
    case '#4bc2dc':
      element.style.backgroundColor = '#0b0f14';
      break;
    case '#0b0f14':
      element.style.backgroundColor = '#4bc2dc';
      break;
  }
}

// arduino sketch witch hex and screen settings
function arduinoSketch(hexString, width, height) {
  return `
    #include \u003CAdafruit_GFX.h\u003E;
    #include \u003CAdafruit_SSD1306.h\u003E;
    
    // screen type
    Adafruit_SSD1306 oled(${width}, ${height}, &Wire, -1);
    
    // special variable - image
    const unsigned char PROGMEM AaquImage [] = {
      ${hexString}
    };
    
    void setup() {
      // initialize display
      oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
        
      // display image
      oled.clearDisplay();
      oled.drawBitmap(0, 0, AaquImage, ${width}, ${height}, WHITE);
      oled.display();
    }
    
    void loop() {
      // loop code
    };
  `
}
