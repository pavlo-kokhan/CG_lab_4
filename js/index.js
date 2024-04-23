const canvasOriginal = document.querySelector('#canvasOriginal')
const canvasEdited = document.querySelector('#canvasEdited')
const ctxOriginal = canvasOriginal.getContext('2d')
const ctxEdited = canvasEdited.getContext('2d')
const imageInput = document.querySelector('#imageInput')
const imageButton = document.querySelector('#imageButton')
const rgbToLabBtn = document.querySelector('#rgbToLabBtn')
const rgbToHslBtn = document.querySelector('#rgbToHslBtn')
const rgbToLabUnsafeBtn = document.querySelector('#rgbToLabUnsafeBtn')
const rgbToHslUnsafeBtn = document.querySelector('#rgbToHslUnsafeBtn')
const changeSaturationBtn = document.querySelector('#changeSaturationBtn')
const saveImageBtn = document.querySelector('#saveImageBtn')
const resetImageBtn = document.querySelector('#resetImageBtn')

let currentImage = null

// global variables to detect cursor area highlight
let isDragging = false
const globalHighlightStartPosition = {
    x: 0,
    y: 0
}
const globalHighlightEndPosition = {
    x: 0,
    y: 0
}

// 1. Перетворення зчитаного зображення з простору кольорів Lab в простір кольорів RGB і навпаки.
// 2. Дослідження чи зображення не зазнало змін з точки зору відображення кольорів.
// 3. Використання модифікованого алгоритму переходу з одного простору в інший (п.1.) для зміни певного кольору чи його атрибутів (на вибір).
// 4. Зміна одного з атрибутів А кольору Color для виділеного фрагменту зображенyz. Обовʼязковим для реалізації цього завдання є використання перцепційної моделі кольорів
// 5. Відображення для пікселів зображення значення кольору у всіх просторах, що використовуються для виконання п 1.
// 6. Збереження змінених зображень у файлах.

// С1=Lab; С2= RGB; А= saturation; Color= magenta.

const labToRgb = ({ _l, _a, _b }) => {
    let y = (_l + 16) / 116
    let x = _a / 500 + y
    let z = y - _b / 200

    let r, g, b

    x = 0.95047 * ((x ** 3) > 0.008856 ? x ** 3 : (x - 16 / 116) / 7.787)
    y = ((y ** 3) > 0.008856 ? y ** 3 : (y - 16 / 116) / 7.787)
    z = 1.08883 * ((z ** 3) > 0.008856 ? z ** 3 : (z - 16 / 116) / 7.787)

    r = x *  3.2406 + y * -1.5372 + z * -0.4986
    g = x * -0.9689 + y *  1.8758 + z *  0.0415
    b = x *  0.0557 + y * -0.2040 + z *  1.0570

    r = r > 0.0031308 ? (1.055 * (r ** (1 / 2.4)) - 0.055) : r * 12.92
    g = g > 0.0031308 ? (1.055 * (g ** (1 / 2.4)) - 0.055) : g * 12.92
    b = b > 0.0031308 ? (1.055 * (b ** (1 / 2.4)) - 0.055) : b * 12.92

    r = Math.min(Math.max(0, r), 1)
    g = Math.min(Math.max(0, g), 1)
    b = Math.min(Math.max(0, b), 1)

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    }
}

const rgbToLab = ({ _r, _g, _b, }) => {
    let x, y, z;

    _r /= 255;
    _g /= 255;
    _b /= 255;

    _r = _r > 0.04045 ? ((_r + 0.055) / 1.055) ** 2.4 : _r / 12.92;
    _g = _g > 0.04045 ? ((_g + 0.055) / 1.055) ** 2.4 : _g / 12.92;
    _b = _b > 0.04045 ? ((_b + 0.055) / 1.055) ** 2.4 : _b / 12.92;

    x = _r * 0.4124 + _g * 0.3576 + _b * 0.1805;
    y = _r * 0.2126 + _g * 0.7152 + _b * 0.0722;
    z = _r * 0.0193 + _g * 0.1192 + _b * 0.9505;

    x /= 0.95047;
    y /= 1.00000;
    z /= 1.08883;

    x = x > 0.008856 ? x ** (1/3) : (7.787 * x) + 16/116;
    y = y > 0.008856 ? y ** (1/3) : (7.787 * y) + 16/116;
    z = z > 0.008856 ? z ** (1/3) : (7.787 * z) + 16/116;

    return {
        l: (116 * y) - 16,
        a: 500 * (x - y),
        b: 200 * (y - z)
    }
}

const rgbToHsl = ({ _r, _g, _b }) => {
    _r /= 255
    _g /= 255
    _b /= 255

    const max = Math.max(_r, _g, _b)
    const min = Math.min(_r, _g, _b)
    let h, s, l = (max + min) / 2

    if (max === min) {
        h = s = 0 // achromatic
    } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

        switch (max) {
            case _r: h = (_g - _b) / d + (_g < _b ? 6 : 0); break
            case _g: h = (_b - _r) / d + 2; break
            case _b: h = (_r - _g) / d + 4; break
        }

        h /= 6
    }

    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    }
}

const hslToRgb = ({ _h, _s, _l }) => {
    _h /= 360
    _s /= 100
    _l /= 100

    let r, g, b

    if (_s === 0) {
        r = g = b = _l // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1
            if (t > 1) t -= 1
            if (t < 1/6) return p + (q - p) * 6 * t
            if (t < 1/2) return q
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
            return p
        }

        const q = _l < 0.5 ? _l * (1 + _s) : _l + _s - _l * _s
        const p = 2 * _l - q

        r = hue2rgb(p, q, _h + 1/3)
        g = hue2rgb(p, q, _h)
        b = hue2rgb(p, q, _h - 1/3)
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    }
}

const saveCanvasImageAsFile = (canvas) => {
    let link = document.createElement('a')
    link.download = `image${ String(Math.floor(100000 + Math.random() * 900000)) }.jpeg`
    link.href = canvas.toDataURL()
    link.click()
}

const getImageData = (ctx, canvas) => {
    return ctx.getImageData(0, 0, canvas.width, canvas.height)
}

const setImageData = (ctx, canvas, imageData) => {
    canvas.width = imageData.width
    canvas.height = imageData.height
    ctx.putImageData(imageData, 0, 0)
}

const updateImage = (ctx, canvas, image) => {
    canvas.width = image.width
    canvas.height = image.height
    ctx.drawImage(image, 0, 0)
}

const handleColorDisplay = (rgb, lab, hsl) => {
    document.querySelector('#colorSpaceValuesBlock').innerHTML = `
        <div class="ml-2">RGB: (${ rgb.r }, ${ rgb.g }, ${ rgb.b })</div>
        <div class="ml-2">Lab: (${ lab.l.toFixed(2) }, ${ lab.a.toFixed(2) }, ${ lab.b.toFixed(2) })</div>
        <div class="ml-2">HSL: (${ hsl.h }, ${ hsl.s }, ${ hsl.l })</div>
    `
}

const changeSaturationInArea = (startPos, endPos, ctx, canvas, saturationValue) => {
    const imageData = getImageData(ctx, canvas)
    const pixels = imageData.data;

    const startX = Math.min(startPos.x, endPos.x);
    const startY = Math.min(startPos.y, endPos.y);
    const endX = Math.max(startPos.x, endPos.x);
    const endY = Math.max(startPos.y, endPos.y);

    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            const index = (y * canvas.width + x) * 4;
            const r = pixels[index];
            const g = pixels[index + 1];
            const b = pixels[index + 2];

            const hsl = rgbToHsl({ _r: r, _g: g, _b: b });
            if (Math.floor(hsl.h) >= 300 || Math.floor(hsl.h) < 60) {
                hsl.s = saturationValue;
                const rgb = hslToRgb({ _h: hsl.h, _s: hsl.s, _l: hsl.l });
                pixels[index] = rgb.r;
                pixels[index + 1] = rgb.g;
                pixels[index + 2] = rgb.b;
            }
        }
    }

    setImageData(ctx, canvas, imageData)
}

imageButton.addEventListener('click', () => {
    imageInput.click()
})


imageInput.addEventListener('change', (event) => {
    const file = event.target.files[0]

    if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
            const image = new Image()
            image.onload = () => {
                currentImage = image
                updateImage(ctxOriginal, canvasOriginal, currentImage)
                updateImage(ctxEdited, canvasEdited, currentImage)
            }
            image.src = event.target.result
        }
        reader.readAsDataURL(file)
    }
})

rgbToLabBtn.addEventListener('click', () => {
    const imageData = getImageData(ctxOriginal, canvasOriginal)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
        const labColor = rgbToLab({
            _r: data[i],
            _g: data[i + 1],
            _b: data[i + 2]
        })

        const rgbColor = labToRgb({
            _l: labColor.l,
            _a: labColor.a,
            _b: labColor.b
        })

        data[i] = rgbColor.r
        data[i + 1] = rgbColor.g
        data[i + 2] = rgbColor.b
    }

    setImageData(ctxEdited, canvasEdited, imageData)
})

rgbToLabUnsafeBtn.addEventListener('click', () => {
    const imageData = getImageData(ctxOriginal, canvasOriginal)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
        const labColor = rgbToLab({
            _r: data[i],
            _g: data[i + 1],
            _b: data[i + 2]
        })

        data[i] = labColor.l
        data[i + 1] = labColor.a
        data[i + 2] = labColor.b
    }

    setImageData(ctxEdited, canvasEdited, imageData)
})

rgbToHslBtn.addEventListener('click', () => {
    const imageData = getImageData(ctxOriginal, canvasOriginal)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
        const hslColor = rgbToHsl({
            _r: data[i],
            _g: data[i + 1],
            _b: data[i + 2]
        })

        const rgbColor = hslToRgb({
            _h: hslColor.h,
            _s: hslColor.s,
            _l: hslColor.l
        })

        data[i] = rgbColor.r
        data[i + 1] = rgbColor.g
        data[i + 2] = rgbColor.b
    }

    setImageData(ctxEdited, canvasEdited, imageData)
})

rgbToHslUnsafeBtn.addEventListener('click', () => {
    const imageData = getImageData(ctxOriginal, canvasOriginal)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
        const hslColor = rgbToHsl({
            _r: data[i],
            _g: data[i + 1],
            _b: data[i + 2]
        })

        data[i] = hslColor.h
        data[i + 1] = hslColor.s
        data[i + 2] = hslColor.l
    }

    setImageData(ctxEdited, canvasEdited, imageData)
})

canvasEdited.addEventListener('click', (event) => {
    const rect = canvasEdited.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const imageData = ctxEdited.getImageData(x, y, 1, 1);
    const pixel = imageData.data;

    const rgb = {
        r: pixel[0],
        g: pixel[1],
        b: pixel[2]
    }

    const lab = rgbToLab({
        _r: rgb.r,
        _g: rgb.g,
        _b: rgb.b
    })

    const hsl = rgbToHsl({
        _r: rgb.r,
        _g: rgb.g,
        _b: rgb.b
    })

    handleColorDisplay(rgb, lab, hsl)
})

canvasEdited.addEventListener('mousedown', (event) => {
    isDragging = true
    const rect = canvasEdited.getBoundingClientRect()
    globalHighlightStartPosition.x = event.clientX - rect.left
    globalHighlightStartPosition.y = event.clientY - rect.top
})

canvasEdited.addEventListener('mousemove', (event) => {
    if (!isDragging) return
    const rect = canvasEdited.getBoundingClientRect()
    globalHighlightEndPosition.x = event.clientX - rect.left
    globalHighlightEndPosition.y = event.clientY - rect.top

    // draw rectangle on highlighted area
    // drawHighlightRect(ctxEdited, globalHighlightStartPosition, globalHighlightEndPosition)
})

canvasEdited.addEventListener('mouseup', (event) => {
    isDragging = false
})

changeSaturationBtn.addEventListener('click', (event) => {
    const saturationValue = document.querySelector('#saturationInput').value;
    changeSaturationInArea(globalHighlightStartPosition, globalHighlightEndPosition, ctxEdited, canvasEdited, saturationValue)
})

saveImageBtn.addEventListener('click', () => {
    saveCanvasImageAsFile(canvasEdited)
})

resetImageBtn.addEventListener('click', () => {
    setImageData(ctxEdited, canvasEdited, getImageData(ctxOriginal, canvasOriginal))
})