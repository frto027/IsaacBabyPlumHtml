let document_nav_toolbar = document.getElementById("content-actions")

function reset_animation(el){
    el.style.animation = 'none';
    el.offsetHeight; /* trigger reflow */
    el.style.animation = null;   
}
class BabyPlum {
    constructor(initX, initY, startAnim = true) {
        //element下包含2个元素，第一个是cross，一个用来定位的十字架，第二个anmelement是梅子宝宝的64x64雪碧图片
        //所有的位移动画附在element上，所有的雪碧图动画附在anmelement上
        let element = document.createElement("div")
        element.style = "position:absolute;left:0;top:0;" + "transform:translate(" + initX + "px," + initY + "px);"
        let cross = document.createElement("div")
        cross.style = "position: absolute;left: 0;top: 0;"
        cross.innerHTML =
            `<div style="position: absolute;left: -50px;top: 0;width: 100px;height: 1px;background-color: green;"></div>
            <div style="position: absolute;left: 0px;top: -50;width: 1px;height: 100px;background-color: green;"></div>`
        let anmelement = document.createElement("div")
        anmelement.style = "position: absolute;left: 0px;top: 0;"


        element.appendChild(cross)
        element.appendChild(anmelement)
        this.element = element
        this.cross = cross
        this.anmelement = anmelement

        this.cross.hidden = true
        //将this保存在DOM元素上，用于触发事件时 找到this是谁
        anmelement.baby_plum = this
        function plum_anm_callback(e) {
            // console.log(e)
            //监听雪碧图的动画回调事件
            switch (e.type) {
                case "animationstart":
                    e.target.baby_plum.anmstart()
                    break
                case "animationiteration":
                    e.target.baby_plum.anmiterate()
                    break
                case "animationend":
                    e.target.baby_plum.anmend()
                    break
            }
        }
        anmelement.addEventListener("animationstart", plum_anm_callback)
        anmelement.addEventListener("animationiteration", plum_anm_callback)
        anmelement.addEventListener("animationend", plum_anm_callback)

        anmelement.classList.add("baby_plum_anim")

        if(startAnim){
            this.setPlumAnms("Descend")
            this.status = "enter"
        }else{
            this.setPlumAnms("Idle")
            this.status = "idle"
        }


        this.currentPos = { x: initX, y: initY }
        this.targetPos = null
    }
    c_setBeforeChangeCallback(cb){
        this.beforeChangeCallback = cb
    }


    anmstart() {
        //do nothing
    }
    anmiterate() {
        if(this.beforeChangeCallback){
            this.beforeChangeCallback()
        }
        //此函数表示梅子宝宝的状态转移
        //当播放完毕一小段动画时，调用此事件，决定下一段动画
        //一般status表示当前正在播放的动画
        if (this.status == "enter") {
            this.handleIdle()
        } else if (this.status == "idle") {
            if (this.handleMove()) {
                return
            }
            if(this.handleHello()){
                return
            }
            if(this.handleAttack2()){
                return
            }
            if(this.handleBye()){
                return
            }
            if(this.handleDeath()){
                return
            }
            this.handleRandomWalk()
        } else if (this.status == "move") {
            this.element.classList.remove("baby_plum_mover_attack1")
            if (this.handleMove()) {
                return
            }
            if(this.handleRandomWalk()){
                return
            }
            this.handleIdle()
        }else if(this.status == "hello_start"){
            this.status = "hello_loop"
            this.setPlumAnms("HelloLoop")
        }else if(this.status == "hello_loop"){
            if(this.hello){
                //hello counter
                if(typeof(this.hello) == "number"){
                    this.hello--
                    if(this.hello <= 0){
                        this.hello = false
                    }
                }
                if(this.helloCallback){
                    this.helloCallback()
                }
            }else{
                this.status = "hello_end"
                this.setPlumAnms("HelloEnd")
            }
        }else if(this.status == "hello_end"){
            this.handleIdle()
        }else if(this.status == "bye"){
            this.element.remove()
        }else if(this.status == "attack2"){
            this.element.classList.remove("baby_plum_mover_attack2")
            if (this.handleMove()) {
                return
            }
            if(this.handleRandomWalk()){
                return
            }
            this.handleIdle()
        }else if(this.status == "death"){
            this.element.remove()
        }
    }
    anmend() {
        //do nothing
    }

    setPlumAnms(name) {
        //通过设置class来播放动画，动画关键帧由css定义
        let target_name = "baby_plum_anm_" + name
        this.anmelement.classList.add(target_name)
        let rms = []
        for (let anm of this.anmelement.classList.entries()) {
            if (anm[1].startsWith("baby_plum_anm_") && anm[1] != target_name) {
                rms.push(anm[1])
            }
        }
        for (let rm of rms) {
            this.anmelement.classList.remove(rm)
        }

    }

    handleMove() {
        if (this.targetPos) {
            this.status = "move"
            this.element.style.setProperty("--plum_move_start", this.currentPos.x + "px," + this.currentPos.y + "px")
            this.element.style.setProperty("--plum_move_end", this.targetPos.x + "px," + this.targetPos.y + "px")
            this.element.style.setProperty("--plum_move_scale", this.targetPos.x > this.currentPos.x ? "1,1": "-1,1")            
            this.element.style.setProperty("transform", "translate(" + this.targetPos.x + "px," + this.targetPos.y + "px)")
            this.currentPos.x = this.targetPos.x
            this.currentPos.y = this.targetPos.y
            this.targetPos = undefined
            reset_animation(this.element)
            this.element.classList.add("baby_plum_mover_attack1")
            this.setPlumAnms("Attack1")
            return true
        }
    }
    handleIdle() {
        this.status = "idle"
        this.setPlumAnms("Idle")
    }
    handleRandomWalk(){
        if(this.randomWalk && this.randomWalk.rate > Math.random()){
            let coord = this.randomWalk.callback()
            if(coord){
                this.c_goto(coord.x,coord.y)
                return true
            }
        }
    }
    handleAttack2(){
        if(this.attack2Pos){
            this.status = "attack2"
            this.element.style.setProperty("--plum_move_start", this.currentPos.x + "px," + this.currentPos.y + "px")
            this.element.style.setProperty("--plum_move_end", this.attack2Pos.x + "px," + this.attack2Pos.y + "px")
            this.element.style.setProperty("transform", "translate(" + this.attack2Pos.x + "px," + this.attack2Pos.y + "px)")

            this.currentPos.x = this.attack2Pos.x
            this.currentPos.y = this.attack2Pos.y
            this.attack2Pos = null
            this.element.classList.add("baby_plum_mover_attack2")
            reset_animation(this.element)
            this.setPlumAnms("Attack2")
            if(this.attack2Callback){
                setTimeout(this.attack2Callback, 20*1000/30)
                this.attack2Callback = undefined
            }
            return true
        }
    }
    handleHello(){
        if(this.hello){
            this.status = "hello_start"
            this.setPlumAnms("HelloStart")
            return true
        }
        if(this.randomHelloRate && Math.random() < this.randomHelloRate){
            this.hello = 2
            this.status = "hello_start"
            this.setPlumAnms("HelloStart")
            return true
        }
    }
    handleBye(){
        if(this.bye){
            this.bye = undefined
            this.status = "bye"
            this.element.classList.add("baby_plum_mover_bye")
            this.setPlumAnms("Leave")
            return true
        }
    }
    handleDeath(){
        if(this.death){
            this.death = undefined
            this.status = "death"
            this.setPlumAnms("Death")
        }
    }

    remove(){
        this.element.remove()
        this.cross.remove()
        this.anmelement.remove()
    }

    //约定c_开头的是接口
    c_goto(x, y) {
        //通过Attack1移动到xy坐标
        this.targetPos = { x: x, y: y }
    }
    c_setCrossVisible(visible) {
        //显示或隐藏坐标十字
        this.cross.hidden = !visible
    }
    c_randomWalk(rate, callback) {
        //在Idle状态下随机游走
        //rate 0~1数字，表示随机游走发生的概率（每当可以进行随机游走时）
        //callback需要返回一个{x:number, y:number}类型的对象，表示随机游走的目标坐标
        //callback is a function returns {x:number, y:number} as a random coordinate
        if (rate > 0 && callback) {
            this.randomWalk = {
                rate: rate,
                callback: callback
            }
        }else{
            this.randomWalk = null
        }
    }
    c_hello(toggle, callback){
        //招手动画，toggle表示开关（true/false）或者动画播放次数（数字）
        //每次招手都会出发callback函数
        //toggle = true/false or number(hello count)
        this.hello = toggle
        this.helloCallback = callback
    }
    c_attack2(x,y,callback){
        //播放attack2并砸向x,y位置。下砸的时候会调用callback函数，不一定准时。
        this.attack2Pos = {x:x,y:y}
        this.attack2Callback = callback
    }
    c_randomHello(rate){
        this.randomHelloRate = rate
    }
    c_bye(){
        //大可爱 离你而去
        this.bye = true
    }
    c_death(){
        //暴打大可爱
        this.death = true
    }

    //有一点hack
    setPosition(x,y){
        if(Math.abs(this.currentPos.x - x) > 1 || Math.abs(this.currentPos.y - y) > 1){
            this.currentPos = {x:x, y:y}
            this.element.style.setProperty("transform", "translate(" + x + "px," + y + "px)")    
        }
    }
}

let plum_leader = new BabyPlum(100,(huijiApp.isApp ? 40 : (90 + (document_nav_toolbar ? document_nav_toolbar.clientHeight : 50))),false)
document.body.appendChild(plum_leader.element)
/*
灰机最近改版以后，导航栏的宽度已经固定为50了，所以不用实时更新

plum_leader.c_setBeforeChangeCallback(function(){
    if(document_nav_toolbar){
        let target_height = (huijiApp.isApp ? 40 : (90 + (document_nav_toolbar ? document_nav_toolbar.clientHeight : 50)))
        if(document_nav_toolbar.clientHeight > 1){//不响应高度0的情况，避免在鼠标下滚的时候发生重绘
            plum_leader.setPosition(100, target_height, false)
        }
    }
})
*/

function random_move_when_click(){
    let height_min = 300, height_max = document.body.clientHeight - 300
    if(window.baby_plum.currentPos.y - 500 > height_min)
        height_min = window.baby_plum.currentPos.y - 500
    if(window.baby_plum.currentPos.y + 500 < height_max)
        height_max = window.baby_plum.currentPos.y + 500
    window.baby_plum.c_goto(Math.random() * (document.body.clientWidth - 200) + 100, Math.random()  * (height_max - height_min) + height_min)
}

let local_active_time = new Date().getTime()+""
// this.localStorage.setItem("plum_baby_window_active_time", local_active_time)

let is_hiden = false
//梅子宝宝只能有一个（只会存在于最后激活的那个窗口上）
function only_one_plum_check(){
    //localStorate中存储了最后激活窗口的时间，根据其是否与当前窗口的激活时间一致来判断是不是最新窗口
    let active_time = localStorage.getItem("plum_baby_window_active_time")
    if(is_hiden){
        if(active_time == local_active_time){
            is_hiden = false
            setTimeout(function(){$(window.baby_plum.anmelement).animate({opacity:1})},400)
        }
    }else{
        if(active_time != local_active_time){
            is_hiden = true
            $(window.baby_plum.anmelement).animate({opacity:0})
        }
    }
}
window.addEventListener("focus",function(){
    if(window.baby_plum == undefined)
        return
    //争夺主动权，如果已经隐藏，则显示
    local_active_time = new Date().getTime()+""
    localStorage.setItem("plum_baby_window_active_time", local_active_time)
    if(is_hiden){
        is_hiden = false
        setTimeout(function(){$(window.baby_plum.anmelement).animate({opacity:1})},1000)
    }
})

function plum_baby_limit_to_screen(){
    let height_min = 300, height_max = document.body.clientHeight - 300
    let left_min = 50, left_max = document.body.clientWidth - 50
    let x = window.baby_plum.currentPos.x, y = window.baby_plum.currentPos.y
    if(y < height_min)
        y = height_min
    if(y > height_max)
        y = height_max
    if(x < left_min)
        x = left_min
    if(x > left_max)
        x = left_max
    if(x != window.baby_plum.currentPos.x || y != window.baby_plum.currentPos.y)
        window.baby_plum.c_goto(x,y)
}

plum_leader.anmelement.addEventListener("click",function(){
    plum_leader.c_setBeforeChangeCallback(undefined)
    $(plum_leader.element).animate({top: -64})
    //争夺主动权
    local_active_time = new Date().getTime()+""
    localStorage.setItem("plum_baby_window_active_time", local_active_time)
    
    setTimeout(function(){
            //create plum
            plum_leader.remove()

        let p = new BabyPlum(100, 500 + (huijiApp.isApp ? -100 : 0), true)
        window.baby_plum = p
        document.body.appendChild(p.element)

        if(mw.config.get("wgPageName") == "实体/908"){
            let infobox_pic = undefined
            for(let infobox of document.getElementsByClassName("infobox")){
                for(let img of infobox.getElementsByTagName("img")){
                    if(img.getAttribute("alt") == "Entity 908.0.png"){
                        infobox_pic = img
                        break
                    }
                }
                if(infobox_pic)
                    break
            }
            if(infobox_pic){
                let pos = $(infobox_pic).offset()
                p.c_attack2(pos.left + 64, pos.top + 64, function(){
                    $(infobox_pic).animate({opacity:0})

                    p.c_setBeforeChangeCallback(function(){
                        let pos = $(infobox_pic).offset()
                        if(Math.abs(pos.left + 64 - p.currentPos.x) > 1 || Math.abs(pos.top + 64 + 64 -p.currentPos.y) > 1){
                            let pos = $(infobox_pic).offset()
                            p.c_goto(pos.left + 64, pos.top + 64 + 64)
                            p.c_hello(false)
                        }else{
                            p.c_hello(true)
                        }
                        only_one_plum_check()
                    })
                    let helloing = true
                    p.anmelement.addEventListener("click",function(){
                        if(helloing){
                            helloing = false
                            setTimeout(function(){$(infobox_pic).animate({opacity:1})},1000)
                            p.c_hello(false)
                            p.c_setBeforeChangeCallback(function(){
                                only_one_plum_check()
                                plum_baby_limit_to_screen()
                            })
                            p.c_randomHello(0.3)
                        }
                        random_move_when_click()
                    })
                })
            }
        }else{
            window.baby_plum.anmelement.addEventListener("click",random_move_when_click)
            window.baby_plum.c_randomHello(0.3)
            p.c_setBeforeChangeCallback(function(){
                only_one_plum_check()
                plum_baby_limit_to_screen()
            })
        }
    },1000
    )
})