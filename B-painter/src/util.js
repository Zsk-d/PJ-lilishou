function Draw(obj, setting) {
    console.log(setting.type)
    this.obj = obj
    this.type = setting.type || 'stroke'
    this.color = setting.color || '#f00'
    this.width = setting.width || '2'
    this.font = setting.font || '18px bold 黑体'
    this.fillStyle = setting.fillStyle || '#f00'
    this.textAlign = setting.textAlign || 'center'
    this.textBaseline = setting.textBaseline || 'middle'
}
Draw.prototype = {
    init() {
        this.obj.strokeStyle = this.color
        this.obj.lineWidth = this.width
        this.obj.font = this.font
        this.obj.fillStyle = this.fillStyle
        this.obj.textAlign = this.textAlign
        this.obj.textBaseline = this.textBaseline
    },
    rect(x, y, x1, y1) {
        this.init()
        this.obj.beginPath()
        this.obj.rect(x, y, x1 - x, y1 - y)
        if (this.type === 'stroke') {
            this.obj.stroke()
        } else if (this.type === 'fill') {
            this.obj.fill()
        }
    },
    circle(x, y, x1, y1) {
        this.init()
        const r = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2))
        this.obj.beginPath()
        this.obj.arc(x, y, r, 0, 2 * Math.PI)
        if (this.type === 'stroke') {
            this.obj.stroke()
        } else if (this.type === 'fill') {
            this.obj.fill()
        }
    },
    line(x, y, x1, y1) {
        this.init()
        this.obj.beginPath()
        this.obj.moveTo(x, y)
        this.obj.lineTo(x1, y1)
        this.obj.stroke()
    },
    text(content, x, y) {
        this.init()
        this.obj.fillText(content, x, y)
        this.obj.stroke()
    },
    poly(x, y, x1, y1, n) {
        this.init()
        const obj = this.obj
        const r = Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2))
        obj.save()
        obj.translate(x, y)
        obj.rotate(Math.PI / 2)
        const nx = r * Math.cos(Math.PI / n)
        const ny = r * Math.sin(Math.PI / n)
        obj.beginPath()
        obj.lineCap = 'round'
        obj.moveTo(nx, ny)
        for (let i = 0; i <= n; i++) {
            obj.rotate(Math.PI * 2 / n)
            obj.lineTo(nx, -ny)
        }
        if (this.type === 'stroke') {
            this.obj.stroke()
        } else if (this.type === 'fill') {
            this.obj.fill()
        }
        obj.restore()
    },
    pen(x, y, x1, y1, isNewAction) {
        if (isNewAction) {
            this.obj.beginPath()
        }
        this.init()
        this.obj.save()
        this.obj.lineCap = 'round'
        this.obj.lineTo(x1, y1)
        this.obj.stroke()
        this.obj.restore()
    },
    eraser(x, y, x1, y1) {
        this.obj.lineCap = 'round'
        this.obj.clearRect(x1 - 5, y1 - 5, 10, 10)
    },
    cut(x, y, x1, y1) {
        this.init()
        this.obj.save()
        this.obj.setLineDash([4, 2])
        this.obj.beginPath()
        this.obj.lineWidth = 1
        this.obj.rect(x, y, x1 - x, y1 - y)
        this.obj.stroke()
        this.obj.restore()
    },
    curve(cp1x, cp1y, x, y) {
        this.init()
        this.obj.save()
        this.obj.beginPath()
        this.obj.moveTo(cp1y, y)
        this.obj.quadraticCurveTo(cp1x, cp1y, x, y)
        this.obj.stroke()
    }
}
const getTime = () => new Date().toLocaleString()
module.exports = {
    Draw,
    getTime,
    copy: obj => JSON.parse(JSON.stringify(obj)),
    exportJson: json => {
        let fileName = `export_${getTime()}.json`;
        let fileContent = JSON.stringify(json);
        let myFile = new Blob([fileContent], { type: 'text/plain' });

        window.URL = window.URL || window.webkitURL;
        let dlEle = document.getElementById("download");

        dlEle.setAttribute("href", window.URL.createObjectURL(myFile));
        dlEle.setAttribute("download", fileName);
        dlEle.click()
    }
}