<template>
    <div>
        <div class="container">
            <div class="row">
                <ul class="type">
                    <li style="background-color: #6a677c;" @click="importActionDatas">导入</li>
                    <div v-if="importActionJsons.length == 0">
                        <li :class="{ 'active': chooseType === 'line' }" @click="chooseTypeFn('line')">直线</li>
                        <li :class="{ 'active': chooseType === 'rect' }" @click="chooseTypeFn('rect')">矩形</li>
                        <li :class="{ 'active': chooseType === 'circle' }" @click="chooseTypeFn('circle')">圆圈</li>
                        <li :class="{ 'active': chooseType === 'pen' }" @click="chooseTypeFn('pen')">铅笔</li>
                        <li :class="{ 'active': chooseType === 'curve' }" @click="chooseTypeFn('curve')">曲线</li>
                        <li :class="['poly', { 'active': chooseType === 'poly' }]" @click="chooseTypeFn('poly')">多边形
                            <div :class="['bian', { 'hide': chooseType !== 'poly' }]">
                                <span>边数</span><a-input-number type="number" :min="3" :max="15" v-model="sides"
                                    @change="changePoly" />
                            </div>
                        </li>
                        <li :class="{ 'active': chooseType === 'eraser' }" @click="chooseTypeFn('eraser')">橡皮</li>
                    </div>
                    <div v-else>
                        <li style="background-color: #6a677c;" @click="replayAll" >全部重现</li>
                        <li style="background-color: #6a677c;" @click="replayPrev" v-if="importActionJsons.indexOf(currentAction) > 0">上一步</li>
                        <li style="background-color: #6a677c;" @click="replayNext" v-if="importActionJsons.indexOf(currentAction) < importActionJsons.length - 1">下一步</li>
                        <li style="background-color: #6a677c;" @click="exitReplay">退出</li>
                    </div>
                </ul>
                <ul class="type">
                    <li :class="{ 'active': borderType === 'stroke' }" @click="chooseBorderTypeFn('stroke')">描边</li>
                    <li v-if="chooseType !== 'line' && chooseType !== 'pen'" :class="{ 'active': borderType === 'fill' }"
                        @click="chooseBorderTypeFn('fill')">填充</li>
                </ul>
                <div class="space"></div>
                <div class="box"><label><span>颜色</span></label><input type="color" name="color" v-model="color"
                        @change="changeColor"></div>
                <div class="box linewidth"><span>线宽</span><a-input-number type="number" :max="150" :min="1"
                        v-model="lineWidth" @change="changeLineWidth" /></div>
                <div class="space"></div>
                <div class="clear shezhi" @click="plotFn('clear')">清空</div>
                <div class="back shezhi" @click="plotFn('back')">撤销</div>
                <div class="save shezhi" @click="plotFn('save')">保存</div>
            </div>
        </div>
        <canvas ref="canvasPlot" :width="canvasWidth" :height="canvasHeight"></canvas>
        <a class="hidden-ele" href="#" id="download">Download</a>
        <input class="hidden-ele" type="file" id="fileInput" @change="readJsonFile" />
    </div>
</template>

<script>
import { Draw, getTime, copy, exportJson, readFile } from "../util";
export default {
    data() {
        return {
            chooseType: 'line',
            sides: 3,
            lineWidth: 1,
            borderType: 'stroke',
            color: '#f00',
            plotContext: {}, // canvas对象
            plotData: [],
            plotCoord: {
                x: 0,
                y: 0,
                x2: 0,
                y2: 0
            },
            canvasWidth: 900,
            canvasHeight: 600,
            penSkipPointMaxNum: 3, // 铅笔时跳过的绘图点, 节省资源
            penSkipPointNum: 0,
            importActionJsons: [],
            actionDatas: [],
            actionDataTmp: {
                chooseType: null,
                startX: null,
                middlePos: [],
                startY: null
            },
            currentAction: null
        }
    },
    watch: {
    },
    beforeCreate() {
    },
    mounted() {
        this.initPlot()
    },
    created() { },
    methods: {
        replayAll(){
            this.plotFn('clear')
            this.currentAction = null
            while(this.importActionJsons.indexOf(this.currentAction) < this.importActionJsons.length -1){
                this.replayNext(false)
                console.log("this.replayNext")
            }
        },
        replay(isStep = true) {
            if(isStep){
                this.plotFn('clear')
            }
            this.chooseType = this.currentAction.data.chooseType
            this.plotCoord.x = this.currentAction.data.startX
            this.plotCoord.y = this.currentAction.data.startY

            this.plotCoord.x2 = this.currentAction.data.endX
            this.plotCoord.y2 = this.currentAction.data.endY
            if (this.chooseType === 'pen') {
                this.plotContext.beginPath()
                this.plotContext.moveTo(this.plotCoord.x, this.plotCoord.y)
            }
            // 实例化构造函数
            const draw = new Draw(this.plotContext, { type: this.currentAction.data.borderType, color: this.currentAction.data.color, width: this.currentAction.data.lineWidth })
            if (this.currentAction.data.chooseType === 'poly') {
                draw[this.currentAction.data.chooseType](this.plotCoord.x, this.plotCoord.y, this.plotCoord.x2, this.plotCoord.y2, this.currentAction.data.sides)
            } else {
                draw[this.currentAction.data.chooseType](this.plotCoord.x, this.plotCoord.y, this.plotCoord.x2, this.plotCoord.y2)
            }
            if(!isStep){
                this.plotData.push(this.plotContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight))
            }
            console.log(this.currentAction.data)
        },
        replayPrev(isStep = true) {
            if (this.currentAction != null) {
                let index = this.importActionJsons.indexOf(this.currentAction)
                if (index != 0) {
                    this.currentAction = this.importActionJsons[index - 1]
                    this.replay(isStep)
                }
            }
        },
        replayNext(isStep = true) {
            if (this.currentAction != null) {
                let index = this.importActionJsons.indexOf(this.currentAction)
                if (index != this.importActionJsons.length - 1) {
                    this.currentAction = this.importActionJsons[index + 1]
                } else {
                    return false;
                }
            } else {
                this.currentAction = this.importActionJsons[0]
            }
            this.replay(isStep)
        },
        readJsonFile() {
            this.plotFn('clear')
            let _this = this;
            let reader = new FileReader();
            reader.readAsText(document.getElementById('fileInput').files[0]);
            reader.onload = function () {
                _this.importActionJsons = JSON.parse(this.result)
                console.log(_this.importActionJsons)
            }
        },
        importActionDatas() {
            this.currentAction = null
            document.getElementById("fileInput").click()
        },
        onNewAction() {
            let item = copy(this.actionDataTmp)
            item.startX = this.plotCoord.x
            item.startY = this.plotCoord.y
            item.chooseType = this.chooseType
            item.sides = this.sides
            item.lineWidth = this.lineWidth
            item.borderType = this.borderType
            item.color = this.color
            this.currentAction = item
            this.actionDatas.push({ time: getTime(), data: this.currentAction })
            this.penSkipPointNum = 0
            console.log("onNewAction!", this.currentAction)
        },
        onActionChange() {
            this.currentAction.endX = this.plotCoord.x2
            this.currentAction.endY = this.plotCoord.y2
            if (this.chooseType === 'pen' && this.penSkipPointNum++ > this.penSkipPointMaxNum) {
                this.currentAction.middlePos.push({ x: this.plotCoord.x2, y: this.plotCoord.y2 })
                this.penSkipPointNum = 0
            }
        },
        onActionEnd() {
            console.log("onActionEnd!", this.actionDatas)
        },
        chooseTypeFn(data) {
            this.chooseType = data
        },
        changePoly(val) {
            this.sides = val
        },
        chooseBorderTypeFn(val) {
            this.borderType = val
        },
        changeColor(val) {
            this.color = val
        },
        changeLineWidth(val) {
            this.lineWidth = val
        },
        /**
         * 绘图操作
         * @param type clear:清空 back:撤回 save:保存
         */
        plotFn(type) {
            if (type === 'clear') {
                this.plotData = []
                this.plotContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
            }
            if (type === 'back') {
                this.plotData.pop()
                this.plotContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
                if (this.plotData.length > 0) {
                    this.plotContext.putImageData(this.plotData[this.plotData.length - 1], 0, 0, 0, 0, this.canvasWidth, this.canvasHeight)
                }
            }
            if (type === 'save') {
                // const reg = this.$refs.canvasPlot.toDataURL('image/png')
                // console.log(reg)
                // location.href = reg
                exportJson(copy(this.actionDatas))
                this.actionDatas = []
            }
        },
        initPlot() {
            const _this = this
            const canvas = this.$refs.canvasPlot
            let isNewAction = false;
            _this.plotContext = canvas.getContext('2d')
            _this.$refs.canvasPlot.width = _this.canvasWidth
            _this.$refs.canvasPlot.height = _this.canvasHeight
            canvas.onmousedown = function (e) {
                // 新动作开始
                _this.plotCoord.x = e.offsetX
                _this.plotCoord.y = e.offsetY
                _this.onNewAction()
                if (this.chooseType === 'pen') {
                    _this.plotContext.beginPath()
                    _this.plotContext.moveTo(_this.plotCoord.x, _this.plotCoord.y)
                }
                if (this.chooseType === 'eraser') {
                    _this.plotContext.clearRect(_this.plotCoord.x - 5, _this.plotCoord.y - 5, 10, 10)
                }
                // 实例化构造函数
                const draw = new Draw(_this.plotContext, { type: _this.borderType, color: _this.color, width: _this.lineWidth })
                canvas.onmousemove = function (e) {
                    // 新动作执行中
                    _this.plotCoord.x2 = e.offsetX
                    _this.plotCoord.y2 = e.offsetY
                    _this.onActionChange()
                    if (_this.chooseType !== 'eraser') {
                        _this.plotContext.clearRect(0, 0, _this.canvasWidth, _this.canvasHeight)
                        if (_this.plotData.length !== 0) {
                            _this.plotContext.putImageData(_this.plotData[_this.plotData.length - 1], 0, 0, 0, 0, _this.canvasWidth, _this.canvasHeight)
                        }
                    }
                    if (_this.chooseType === 'poly') {
                        draw[_this.chooseType](_this.plotCoord.x, _this.plotCoord.y, _this.plotCoord.x2, _this.plotCoord.y2, _this.sides)
                    } else {
                        draw[_this.chooseType](_this.plotCoord.x, _this.plotCoord.y, _this.plotCoord.x2, _this.plotCoord.y2, isNewAction)
                    }
                    isNewAction = false;
                }
                document.onmouseup = function () {
                    canvas.onmousemove = null
                    document.onmouseup = null
                    _this.plotData.push(_this.plotContext.getImageData(0, 0, _this.canvasWidth, _this.canvasHeight))
                    isNewAction = true
                    _this.onActionEnd()
                }
            }
        },
        fnProcessHttpError(err) {
            if (err.response) {
                switch (err.response.code) {
                    default:
                        this.$error({
                            title: '错误',
                            content: err.response.message
                        })
                        break
                }
            } else {
                this.$error({
                    title: '错误',
                    content: err.toString()
                })
            }
        }
    }
}
</script>

<style></style>
<style scoped src="../painter.css"></style>