const testRgbLab = () => {
    const rgbColor = {
        r: 125,
        g: 59,
        b: 83
    }

    console.log(rgbColor)
    const labColor = rgbToLab({
        _r: rgbColor.r,
        _g: rgbColor.g,
        _b: rgbColor.b
    })
    console.log(labColor)
    const newRgb = labToRgb({
        _l: labColor.l,
        _a: labColor.a,
        _b: labColor.b
    })
    console.log(newRgb)
}

const drawHighlightRect = (ctx, start, end) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear previous drawings

    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const width = Math.abs(start.x - end.x);
    const height = Math.abs(start.y - end.y);

    ctx.beginPath();
    ctx.strokeStyle = 'red'; // You can change the color here
    ctx.lineWidth = 2;
    ctx.rect(x, y, width, height);
    ctx.stroke();
};
