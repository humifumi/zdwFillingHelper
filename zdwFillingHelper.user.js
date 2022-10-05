// ==UserScript==
// @name         zdwFillingHelper
// @namespace    http://tampermokey.hmw.pw
// @version      0.1
// @description  try to take over the world!
// @author       humi
// @match        http://10.211.2.134:8081/pure/gbs/busi/cpn/Bulid!toAdd.action*
// @match        http://127.0.0.1:8080/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==
const quicklySelectFrom = {
    "楼宇类别": ["params.bulidState", 3],
    "联通宽带接入方式": ["params.unicomAccess", 40],
    "所处阶段": ["params.signDuring", 1],
    "住宅类型": ["params.doorFlag", 1],

    "街道类型": ["params.addrTownType", 1],
    "街路类型": ["params.addrCardType", 1],
    "门牌类型": ["params.addrStreetType", 1],
    "小区类型": ["params.addrCpnType", 1],
    "楼号类型": ["params.addressType8", 2]
}
const excelFormMap = {
    "驻地网名称": ["zdwNameType", false],
    "楼宇名称": ["params.bulidName2", false],
    "地址描述": ["params.bulidAddr", true],

    "街道": ["params.addrTown", true],
    "街路": ["params.addrCard", true],
    "门牌": ["params.addrStreet", true],
    "楼号": ["params.bulidNo", true],

    "单元数": ["params.bulidDY", true],
    "单元名称": ["params.buildDYName", true],
    "起始层数": ["params.bulidStart", true],
    "每层户数": ["params.bulidCoustNum", true],
    "每单元层数": ["params.bulidCS", true],
}
const mingw_vue_box_text = `
  <div id="mingw_vue_box" style="opacity:0.9;position: absolute;bottom: 20px;left: 10;background: #fb7d7d;width: 220px;height: 210;">
  <div style="display: flex;justify-content: center;">{{ title }}</div><br>
  提示:{{message}}<br>
  <input type="file" @change=getData  accept=".xlsx"></input>
  <br>
  <br>
  当前小区：{{community}}
  <br>
  当前楼号：{{building}}
  <br>
  备注：{{comment}}
  <br>
  当前序号：{{cur_idx}}
  <br>
  <label>输入序号：</label><input v-model="cur_idx" @keydown="onKeyDown"></input>
  <br>
  <input type="button" @click=prev value="上一条"></input>
  <input type="button" @click=next value="下一条"></input><br>
  <input type="button" @click=fill value="填充地址"></input>
  <input type="button" @click=quicklySelect value="快速选择"></input>
    </div>
    `

function start_vue() {
    //let meta=document.createElement('meta');
    //meta.setAttribute('name', 'viewport');
    //meta.content ="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, minimal-ui";
    //document.head.appendChild(meta);

    let scripts_src = ["https://cdn.jsdelivr.net/npm/vue@2.x/dist/vue.js",
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.core.min.js"
    ];
    scripts_src.forEach(e => {
        let script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.src = e;
        document.body.prepend(script);
    })
    window.onload = () => {


        let el = document.createElement('div')
        el.innerHTML = mingw_vue_box_text;
        document.body.append(el)
        return new Vue({
            data() {
                return {
                    title: "填充助手",
                    //message:"",
                    community: "无小区",
                    building: "无楼号",
                    comment: "",
                    excel_data: [],
                    idx: 0
                };
            },
            mounted() {
                let idx = localStorage.getItem("excel_data_idx")
                if (idx != null) {
                    let data = localStorage.getItem("excel_data")
                    this.idx = parseInt(idx)
                    this.excel_data = JSON.parse(JSON.parse(data))
                    this.updateView()

                    //this.community= this.excel_data[this.idx]["驻地网名称"]
                    //console.log(this.idx)
                    //console.log(this.excel_data)
                    //console.log(JSON.parse(JSON.parse(data)))


                }
            },
            computed: {
                message() {
                    if (this.excel_data == null) {
                        return "当前无数据，请先导入文件"
                    } else {
                        return "数据已导入，再次导入会更新数据"
                    }
                },
                cur_idx: {
                    get() {
                        return this.idx + 1
                    },
                    set(new_value) {
                        if (this.excel_data == null) return
                        new_value = parseInt(new_value) - 1
                        console.log(new_value)
                        if (new_value > this.excel_data.length - 1) {
                            this.idx = this.excel_data.length - 1
                        } else if (new_value < 0) {
                            this.idx = 0
                        } else if (isNaN(new_value)) {
                            //this.idx=0
                        } else this.idx = new_value
                        this.updateView()

                    }
                }

            },
            methods: {

                onKeyDown(e) {
                    //console.log(e)
                    if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') {
                        this.prev()
                    }
                    if (e.code === 'ArrowDown' || e.code === 'ArrowRight') {
                        this.next()
                    }
                },
                updateView() {
                    if (this.excel_data == null) {
                        return
                    }

                    this.community = this.excel_data[this.idx]["驻地网名称"]
                    this.building = this.excel_data[this.idx]["楼宇名称"]
                    this.comment = this.excel_data[this.idx]["备注"]
                },
                getData: function (e) {
                    //console.log(e)
                    //console.log(typeof(e))
                    if (e.srcElement.files.length > 0) {
                        let f = e.srcElement.files[0]
                        this.readWorkbookFromLocalFile(f, (workbook) => {
                            let sheetNames = workbook.SheetNames; // 工作表名称集合
                            let worksheet = workbook.Sheets[sheetNames[0]]; // 这里我们只读取第一张sheet
                            let json = XLSX.utils.sheet_to_json(worksheet)
                            this.excel_data = json
                            this.idx = 0

                            this.community = json[0]["驻地网名称"]

                            localStorage.setItem("excel_data", JSON.stringify(json))
                            localStorage.setItem("excel_data_idx", this.idx)
                            //this.message="数据已导入，再次导入会更新数据"

                            //this.autoFill()
                        })
                    } else {
                        alert('请选择excel文件')
                    }
                },
                readWorkbookFromLocalFile: function (file, callback) {
                    let reader = new FileReader();
                    reader.onload = function (e) {
                        let data = e.target.result;
                        let workbook = XLSX.read(data, {
                            type: 'binary'
                        });
                        if (callback) callback(workbook);
                    };
                    reader.readAsBinaryString(file);
                },
                quicklySelect: function () {
                    Object.values(quicklySelectFrom).forEach(e => {
                        document.getElementById(e[0]).value = e[1]
                    })
                },
                fill: function () {
                    let d = this.excel_data[this.idx]
                    Object.keys(d).forEach(el => {
                        if (excelFormMap[el] != null) {
                            let ele = document.getElementById(excelFormMap[el][0])
                            if (ele !== null) {
                                ele.value = d[el]
                                /*
                                if(ele.value===''){
                                    ele.value = d[el]
                                }else if(excelFormMap[el][1]){
                                    ele.value = d[el]
                                }
                                */
                            }
                        } else {
                            console.error(el)
                        }
                    })
                    localStorage.setItem("excel_data_idx", this.idx)

                },
                //暂时用不到
                autoFill: function () {
                    this.excel_data.some((e, idx) => {
                        //console.log(e)
                        let result = e.状态 == null
                        if (result) {
                            Object.keys(e).forEach(el => {
                                if (excelFormMap[el] != null) {
                                    let ele = document.getElementById(excelFormMap[el][0])
                                    if (ele !== null) {
                                        if (ele.value === '') {
                                            ele.value = e[el]
                                        } else if (excelFormMap[el][1]) {
                                            ele.value = e[el]
                                        }
                                    }
                                } else {
                                    console.error(el)
                                }

                            })
                        }
                        e.状态 = "已录入"
                        return result

                    })
                },
                prev: function () {
                    this.idx--
                    if (this.idx >= 0) {
                        this.updateView()
                    } else {
                        this.idx++
                        alert("这是第一条")
                    }
                },
                locate: function (e) {
                    console.log(e.srcElement.getRootNode())

                },
                next: function () {
                    this.idx++

                    if (this.idx < this.excel_data.length) {
                        //console.log(this.excel_data[this.idx])
                        this.updateView()

                        //this.community=this.excel_data[this.idx]["驻地网名称"]
                        //this.building=this.excel_data[this.idx]["楼宇名称"]
                    } else {
                        this.idx--
                        alert("已经是最后一条了")
                    }

                }
            },
            el: '#mingw_vue_box',
            //vuetify: new Vuetify(),
        })
    }

}
(function () {
    'use strict';

    console.log("load zdwFillingHelper compeleted")
    start_vue()

})();