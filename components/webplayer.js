import { useState, useEffect, useRef, useMemo } from 'react';
import css from "../styles/webplayer.module.css";

export default function VideoPlayer({subtitles:{subsTable,current},setSubtitles,messages,socket,room,user}){
    const videoContainer = useRef();
    const videoWrapper = useRef();
    const videoControls = useRef();
    const video = useRef();
    const topBar = useRef();
    const messagesCont = useRef();
    const botBar = useRef();
    const subtitlesPanel = useRef();
    const subtitlesBody = useRef();
    const subsSetPanel = useRef();
    const chatSetPanel = useRef();
    const settingsPanel = useRef();
    const speedPanel = useRef();
    const speedValue = useRef();
    const playBut = useRef();
    const vol = useRef();
    const volIndic = useRef();
    const volBut = useRef();
    const volBar = useRef();
    const volPin = useRef();
    const currentTimeSpan = useRef();
    const totalTime = useRef();
    const subs = useRef();
    const settingsBut = useRef();
    const pip = useRef();
    const fsBut = useRef();
    const progress = useRef();
    const progBar = useRef();
    const progBarLabel = useRef();
    const chatBut = useRef();
    const chatInput = useRef();
    const chatButCont = useRef();
    let audioCtx = useRef(null);
    let AudioGainNode = useRef(null);
    let delayCtrlTimeout = useRef(null);
    // Double-click => fullscreen Variables
    let singleClick = useRef(false);
    let dbClickTimeout = useRef(null);
    let dbDelay = useRef(200);
    // Sound Variables
    let volBarWidth = 0;
    let volHalfBarWidth = 0;
    let barOffsetLeft = 0;
    let volumeStep = 0;
    let gain = useRef(1);
    let maxGain = useRef(30.6); // minus 1 for the normal volume
    let showIndicator = useRef(true);
    let indicatorTimeout = useRef(null);
    // Timeline Variables
    let BarTimer = useRef(0);
    let currentTime = useRef(0);
    let hoveredTime = useRef(0);

    useEffect(()=>{
        console.log(messages)

    },[messages]);

    useEffect(()=>{
        for( let x=0; x < video.current.textTracks.length; x++){
            if( current == video.current.textTracks[x].id ){
                video.current.textTracks[x].mode = 'showing'; 
            }else{
                video.current.textTracks[x].mode = 'hidden'; 
            }
        }
    },[subsTable,current]);

    useEffect(()=>{
        video.current.src="/video.mp4 ";

        // AudioGain Variables
        volBarWidth = Math.round( volBar.current.clientWidth ) || 100;
        volHalfBarWidth = Math.round( volBarWidth / 2 );
        barOffsetLeft = volBar.current.getBoundingClientRect().left;
        volumeStep = volHalfBarWidth/40;
        if( AudioGainNode.current === null ){
            audioCtx.current = new (window.AudioContext || window.webkitAudioContext)();
            AudioGainNode.current = AudioGain( audioCtx );
        }

        SetVolumeSettings( {clientX : barOffsetLeft + volHalfBarWidth } );

        // Picture-in-Picture
        videoContainer.current.addEventListener('leavepictureinpicture', LeavePictureinPicture);
        function LeavePictureinPicture(e){
            pip.current.setAttribute("data-state","disabled");
        }
        // Fullscreen
        document.addEventListener('fullscreenchange', FullScreenChange);
        function FullScreenChange(e){
            if( document.fullscreenElement === videoContainer.current){
                fsBut.current.setAttribute("data-state","full");
                VideoContainerMouseMove();
            } 
            else if( !document.fullscreenElement ){
                fsBut.current.setAttribute("data-state","nofull");
                VideoContainerMouseMove();
            }
        }
        // Wheel - Scroll Sound
        videoWrapper.current.addEventListener("wheel",VideoWheel, {passive: false});
        function VideoWheel(e){
            e.preventDefault();
            console.log(e)
            if (e.deltaY < 0) {
                SetVolumeSettings( {clientX : barOffsetLeft + volPin.current.offsetLeft + volumeStep } );        
            } else {
                SetVolumeSettings( {clientX : barOffsetLeft + volPin.current.offsetLeft - volumeStep } );        
            }
        }
        // subtitles
        function RemoveSub(label,language){
            document.querySelector(`track[label='${label}'][srclang='${language}']`).remove();
            document.querySelector(`#subtitlesBody div[data-label='${label}'][data-language='${language}']`).parentElement().remove();
        }
        return ()=>{
            videoWrapper.current?.removeEventListener("wheel",VideoWheel, {passive: false});
            document.removeEventListener('fullscreenchange', FullScreenChange);
            videoContainer.current?.removeEventListener('leavepictureinpicture', LeavePictureinPicture);
        }
    },[]);

    // Functions

    //#region Initialization
    function LoadedMetaData(e){
        totalTime.current.innerHTML = VidDurationFormat( video.current.duration, "round" );
    }
    function TimeUpdate (e) {
        let time = Math.round(video.current.currentTime);
        if( time === currentTime.current ) return;
        currentTimeSpan.current.innerHTML =  VidDurationFormat( currentTime.current = time );
    } 
    function CanPlayThrough (e){
        console.log('I think I can play through the entire ' +
        'video without ever having to stop to buffer.');
    }
    function OnVideoStart (e){
        VideoContainerMouseMove();
    }
    //#endregion

    //#region Timeline
    function MouseMove(e){
        let x = e.clientX - progress.current.getBoundingClientRect().left;
        if( x >= 0){ 
            progress.current.style.setProperty("--hoverOffset",x+"px"); 
            hoveredTime.current = ((x / progBar.current.clientWidth) * video.current.duration);
            progBarLabel.current.innerHTML = VidDurationFormat( hoveredTime.current ); 
        }
    } 
    function MouseDown( ) {
        document.onmousemove= (e)=> TimelineMouseMove(e);
        document.onmouseup= (e)=> TimelineMouseUp( );
    }
    function TimelineMouseMove(e){
        let x = e.clientX - progress.current.getBoundingClientRect().left;
        if( x >= 0){ 
            hoveredTime.current = (x / progBar.current.clientWidth) * video.current.duration;
            video.current.currentTime = hoveredTime.current; 
            MoveProgBar();
        }
    };
    function TimelineMouseUp(){
        if( playBut.current.getAttribute("data-state") === "replay" ) playBut.current.setAttribute("data-state","play");
        video.current.currentTime = hoveredTime.current; 
        MoveProgBar();
        document.onmousemove= null;
        document.onmouseup= null;
    };
    function MouseLeave( ){
        progress.current.style.setProperty("--hoverOffset","0px");
    } 
    function MoveProgBar(){
        let offset = (video.current.currentTime * 100 ) / video.current.duration;
        progress.current.style.setProperty("--barOffset", offset + "%");
    }
    function VidDurationFormat( sec , roundType = "floor" ) {
        let min = Math.floor( (sec/60) % 60 );
        let hours = Math.floor(sec / 3600);
        hours = ( hours >= 10 || hours === 0 ) ? hours : "0" + hours;
        min = ( min >= 10 || min === 0 ) ? min : "0" + min;
        sec = (roundType === "floor") ? Math.floor(sec % 60) : Math.round(sec % 60);
        sec = ( sec >= 10 ) ? sec : "0" + sec;
        return ( hours !== 0 ) ? hours +":"+ min +":"+ sec : min +":"+ sec;
    }
    //#endregion

    //#region Play - Pause - Replay
    function VideoEnded() {
        playBut.current.setAttribute("data-state","replay");
        setTimeout(()=> clearTimeout(BarTimer.current) ,50);
        videoControls.current.classList.remove("hideControls");
        videoContainer.current.classList.remove("hideCursor");
    }
    function PlayHandler(e){
        singleClick.current = !singleClick.current;
        if(singleClick.current) {
            dbClickTimeout.current = setTimeout(()=>{
                if(playBut.current.getAttribute("data-state") === "play"){
                    playBut.current.setAttribute("data-state","pause");
                    audioCtx.current.resume().then( ()=> {
                        video.current.play(); 
                        BarTimer.current = setInterval(() => { MoveProgBar(); }, 20); 
                    });
                }
                else if(playBut.current.getAttribute("data-state") === "pause"){
                    playBut.current.setAttribute("data-state","play");
                    video.current.pause(); 
                    clearInterval(BarTimer.current);
                } else{
                    playBut.current.setAttribute("data-state","pause");
                    video.current.pause();
                    video.current.currentTime = 0;
                    video.current.play(); 
                    BarTimer.current = setInterval(() => { MoveProgBar(); }, 20); 
                }
                singleClick.current= false;
            }, dbDelay.current);
        }else{
            clearTimeout( dbClickTimeout.current );
            FullScrHandler(e);
        }
    }
    //#endregion

    //#region Sound
    function VolButClick(e) {
        let state = vol.current.getAttribute("data-state");
        if( state === "muted" ){
            SetVolumeSettings( {clientX : barOffsetLeft + volHalfBarWidth } );        
        }else {
            SetVolumeSettings(e );
        }
    } 
    function VolBarMouseDown(e ){
        e.preventDefault()
        SetVolumeSettings(e );
        document.onmousemove=(e)=> SetVolumeSettings(e );
        document.onmouseup= MouseUp;
    }

    function SetVolumeSettings(e ){
        let x = e.clientX - barOffsetLeft;
        let diff;
        if( x <= 0){
            diff = 0;
            vol.current.setAttribute("data-state","muted");
        }
        else if( x >= volBarWidth ){
            diff = volBarWidth;
        }else{
            diff = x;
        }
        Vol_Colors_Gain(diff );
        volPin.current.style.left = diff + "px";
    }
    function Vol_Colors_Gain( diff ){
        let normBarsCol;
        let extBarsCol;
        let upperHalf = diff - volHalfBarWidth;
        if( upperHalf > 0 ){
            vol.current.setAttribute("data-state","extreme");
            gain.current = ( upperHalf / volHalfBarWidth ) * maxGain.current;

            gain.current++; // adding the 1 for the normal volume
            normBarsCol = 50;
            extBarsCol = ( upperHalf * 100) / volBarWidth ;
            volIndic.current.innerHTML = Math.round(
                1.20314*Math.pow(10,-7)*Math.pow(gain.current,7)
            +0.00000148274*Math.pow(gain.current,6)
            -0.000589567*Math.pow(gain.current,5)
            +0.018608244*Math.pow(gain.current,4)
            -0.135460067*Math.pow(gain.current,3)
            -1.973545971*Math.pow(gain.current,2)
            +55.65688507*Math.pow(gain.current,1)
            +46.43410069
        ) +"%"; 
        }else{
            if(diff > volHalfBarWidth/2 ){
                vol.current.setAttribute("data-state","full");
            } else if( diff > 0 ){
                vol.current.setAttribute("data-state","half");
            }
            gain.current = diff / volHalfBarWidth;
            volIndic.current.innerHTML = Math.round( gain.current * 100 ) + "%";
            normBarsCol = diff;
            extBarsCol = 0;
        }          
        AudioGainNode.current.gain.value = gain.current;
        Show_Hide_VolIndic();
        volBar.current.style.setProperty("--vol-Normal", normBarsCol + "%");
        volBar.current.style.setProperty("--vol-Extreme",extBarsCol  + "%");
    }

    function Show_Hide_VolIndic() {
        showIndicator.current = !showIndicator.current;
        if (showIndicator.current){
            volIndic.current.style.display = "block";
            clearTimeout(indicatorTimeout.current);
            indicatorTimeout.current = setTimeout(() => {
                volIndic.current.style.display = "none";
                showIndicator.current = false;
            }, 1000);
        }else{
            clearTimeout(indicatorTimeout.current);
            indicatorTimeout.current = setTimeout(() => {
                volIndic.current.style.display = "none";
                showIndicator.current = false;
            }, 1000);
        }
    }
    function MouseUp(e) {
        document.onmousemove= null;
        document.onmouseup= null;
    }

    function AudioGain(audioCtx){
        let source = audioCtx.current.createMediaElementSource(video.current);
        let gainNode = audioCtx.current.createGain();
        source.connect(gainNode);
        gainNode.connect(audioCtx.current.destination);
        return gainNode;
    }
    //#endregion 

    //#region Settings Panels
    function SettingsButClick(){
        videoContainer.current.querySelectorAll(".panel:not(#settingsPanel)").forEach(item=>{
            item.classList.remove("show");
        });
        settingsPanel.current.classList.toggle("show");
    }

    function FullScrHandler(e){
        if( document.fullscreenElement === videoContainer.current){
            document.exitFullscreen();
        } 
        else if( !document.fullscreenElement){
            videoContainer.current.requestFullscreen();
        }
    }

    // Picture-in-Picture
    function PipHandler(){
        if(document.pictureInPictureElement === null && document.pictureInPictureEnabled){
            pip.current.setAttribute("data-state","enabled");
            video.current.requestPictureInPicture();
        } else if(document.pictureInPictureElement === video.current){
            pip.current.setAttribute("data-state","disabled");
            document.exitPictureInPicture();
        }
    }

    // show - hide controls
    function VideoContainerMouseMove(){
    if(delayCtrlTimeout?.current !== undefined){
        videoControls.current.classList.remove("hideControls");
        videoContainer.current.classList.remove("hideCursor");
        clearTimeout(delayCtrlTimeout.current);
    }
    delayCtrlTimeout.current = setTimeout(() => {
        if( !video.current?.paused ){
            videoControls.current?.classList.add("hideControls");
            videoContainer.current?.classList.add("hideCursor");
        }
        delayCtrlTimeout.current = undefined;
    }, 2000);  
    }
    function SettingsItemsClick(e){
        settingsPanel.current.classList.toggle("show");
        const dataButForPanel = e.target.getAttribute("data-but") || e.target.parentElement.getAttribute("data-but");
        videoContainer.current.querySelector(`[data-panel='${dataButForPanel}']` ).classList.toggle("show");
    }
    function VideoCtrlPanelsHead(e){
        e.target.closest(".show").classList.remove("show");
        settingsPanel.current.classList.toggle("show");
    }
    function ClosePanels(e){
        console.log(e.target.tagName);
        if( e.target.tagName == 'DIV' || e.target.tagName == 'SPAN')
        videoContainer.current.querySelectorAll(".panel").forEach(item=>{
            item.classList.remove("show");
        });
    }
    // Speed Panel
    function SpeedPanelValues(e){
        videoContainer.current.querySelector("#speedPanel .values .selectedValue")?.classList.remove("selectedValue");
        const rate = parseFloat(e.target.innerText).toFixed(2);;
        speedValue.current.value = rate;
        video.current.playbackRate = rate;
        e.target.classList.add("selectedValue");
        videoContainer.current.querySelector("[data-but='speed'] .itemChoice").innerHTML=rate;
    }
    function SpeedRangeArrows(e){
        let rate = parseFloat(speedValue.current.value);
        rate = (rate + parseFloat(e.target.getAttribute("data-step")) ).toFixed(2);
        if( rate < 0.1 || isNaN(rate) ) rate = "0.10";
        speedValue.current.value = rate;
        video.current.playbackRate = rate;
        ChangeSelectedValue(rate,"speed");
    }
    function SpeedPanelInput(e){
        let rate = parseFloat(e.target.value.replace(/[^0-9.]/g,'')).toFixed(2);
        if( rate < 0.1 || isNaN(rate) ) rate = "0.10";
        e.target.value = rate;
        ChangeSelectedValue(rate,"speed");
    }
    // subtitles
    function ToggleSubsPanel(){
        videoContainer.current.querySelectorAll(".panel:not(#subtitles)").forEach(item=>{
            item.classList.remove("show");
        });
        subtitlesPanel.current.classList.toggle('show');
    }
    function SelectSub(url){
        setSubtitles(previous=>{
            console.log("previous",previous,"name ",name)
            return {table: { ...previous.table}, current: url};
        })
    }
    function RemoveSub(name,url,isoLang){
        socket.current.emit("removeSub",{room: room, name: name, isoLang: isoLang});
        setSubtitles(previous=>{
            delete previous.table[url];
            if( previous.current === url || !Object.keys(previous.table).length ) previous.current = 'off';
            return {table: { ...previous.table}, current: previous.current};
        })
    }
    function SubsSettingsHandler(e,item){
        switch (item){
            case 'fontFamily':
                video.current.style.setProperty("--fontFamily", e.target.value);
                break;
            case 'fontSize':
                video.current.style.setProperty("--fontSize", e.target.value + "%");
                break;
            case 'fontOpacity':
                video.current.style.setProperty("--fontOpacity", e.target.value);
                break;
            case 'fontColor':
                video.current.style.setProperty("--fontColor", e.target.value);
                break;
            case 'backOpacity':
                video.current.style.setProperty("--backOpacity", e.target.value);
                break;
            case 'backColor':
                const r = parseInt(e.target.value.substr(1,2), 16)
                const g = parseInt(e.target.value.substr(3,2), 16)
                const b = parseInt(e.target.value.substr(5,2), 16)
                video.current.style.setProperty("--backColor", `${r},${g},${b}`);
                break;
            case 'vertical':
                video.current.style.setProperty("--vertical", e.target.value + "%");
                video.current.style.setProperty("--position", "relative");
                break;
            case 'horizontal':
                video.current.style.setProperty("--horizontal", e.target.value + "%");
                video.current.style.setProperty("--position", "relative");
                break;
            case 'reset':
                document.querySelector("#fontFamily select").value = 'Arial';
                document.querySelector("#fontSize input").value = '100';
                document.querySelector("#fontOpacity input").value = '1';
                document.querySelector("#fontColor input").value = '#FFFFFF';
                document.querySelector("#backgroundOpacity input").value = '0';
                document.querySelector("#backgroundColor input").value = '#000000';
                document.querySelector("#vertical input").value = '87.6094';
                document.querySelector("#horizontal input").value = '0';
                video.current.style.setProperty("--fontFamily", 'Arial');
                video.current.style.setProperty("--fontSize", "100%");
                video.current.style.setProperty("--fontOpacity", '1');
                video.current.style.setProperty("--fontColor", '#FFFFFF');
                video.current.style.setProperty("--backOpacity", '0');
                video.current.style.setProperty("--backColor", `0,0,0`);
                video.current.style.setProperty("--vertical", "87.6094%");
                video.current.style.setProperty("--horizontal", "0%");
                video.current.style.setProperty("--position", "absolute");
                break;
        }
    }

    // RatioPanel
    function RationPanelInput(e){
        videoContainer.current.querySelector("#ratioPanel input").reportValidity();
        let value = e.target.value;
        value = value.replace(/[^0-9:.]/g,'');
        const ratio = { ...(/(?<first>[0-9.]+\s?)[:/](?<second>\s?[0-9.]+)/g).exec( value )?.groups };
        e.target.value = (ratio.first)? `${ratio.first}:${ratio.second}` : value;
        ChangeSelectedValue(`${ratio.first}:${ratio.second}`,"ratio");
        video.current.style.setProperty("--ratio",`${ratio.first} / ${ratio.second}`);
    }
    function RationPanelValues(e){
        videoContainer.current.querySelector("#ratioPanel .values .selectedValue")?.classList.remove("selectedValue");
        let value = e.target.getAttribute("data-value");
        e.target.classList.add("selectedValue");
        video.current.style.setProperty("--ratio", value);
        value = value.replace("/",':');
        videoContainer.current.querySelector("#ratioPanel input").value = value;
        videoContainer.current.querySelector("[data-but='ratio'] .itemChoice").innerHTML = value;
    }
    function ChangeSelectedValue(value,panel){
        videoContainer.current.querySelector(`[data-but='${panel}']` ).querySelector(".itemChoice").innerHTML=value;
        videoContainer.current.querySelector(`#${panel}Panel .values .selectedValue`)?.classList.remove("selectedValue");
        const items = [...videoContainer.current.querySelectorAll(`#${panel}Panel .values .value`)];
        for(let item of items){
            if(item.innerText == value) {
                item.classList.add("selectedValue");
                break;
            }
        };
    }
    //#endregion

    //#region Chat
    function ChatButClick(e){
        console.log(e)
        chatInput.current.classList.toggle('show');
        chatBut.current.classList.toggle('sendBut');
    }
    function SendMessage(e){
        if(e.key !== "Enter") return;
        socket.current.emit("newMessage",{room: room, user: user, text: chatInput.current.value });
        chatInput.current.value = '';
    }
    function ChatSettingsHandler(e,item){
        switch (item){
            case 'fontFamily':
                messagesCont.current.style.setProperty("--fontFamily", e.target.value);
                break;
            case 'fontSize':
                messagesCont.current.style.setProperty("--fontSize", e.target.value + "em");
                break;
            case 'fontOpacity':
                messagesCont.current.style.setProperty("--fontOpacity", e.target.value);
                break;
            case 'fontColor':
                messagesCont.current.style.setProperty("--fontColor", e.target.value);
                break;
            case 'backOpacity':
                messagesCont.current.style.setProperty("--backOpacity", e.target.value);
                break;
            case 'backColor':
                const r = parseInt(e.target.value.substr(1,2), 16)
                const g = parseInt(e.target.value.substr(3,2), 16)
                const b = parseInt(e.target.value.substr(5,2), 16)
                messagesCont.current.style.setProperty("--backColor", `${r},${g},${b}`);
                break;
            case 'vertical':
                messagesCont.current.style.setProperty("--vertical", e.target.value + "%");
                messagesCont.current.style.setProperty("--position", "relative");
                break;
            case 'horizontal':
                messagesCont.current.style.setProperty("--horizontal", e.target.value + "%");
                messagesCont.current.style.setProperty("--position", "relative");
                break;
            case 'reset':
                document.querySelector("chat_fontFamily select").value = 'Arial';
                document.querySelector("chat_fontSize input").value = '1.5';
                document.querySelector("chat_fontOpacity input").value = '1';
                document.querySelector("chat_fontColor input").value = '#FFFFFF';
                document.querySelector("chat_backgroundOpacity input").value = '0';
                document.querySelector("chat_backgroundColor input").value = '#000000';
                document.querySelector("chat_vertical input").value = '87.6094';
                document.querySelector("chat_horizontal input").value = '0';
                messagesCont.current.style.setProperty("--fontFamily", 'Arial');
                messagesCont.current.style.setProperty("--fontSize", "100%");
                messagesCont.current.style.setProperty("--fontOpacity", '1');
                messagesCont.current.style.setProperty("--fontColor", '#FFFFFF');
                messagesCont.current.style.setProperty("--backOpacity", '0');
                messagesCont.current.style.setProperty("--backColor", `0,0,0`);
                messagesCont.current.style.setProperty("--vertical", "87.6094%");
                messagesCont.current.style.setProperty("--horizontal", "0%");
                messagesCont.current.style.setProperty("--position", "absolute");
                break;
        }
    }

    //#endregion

    return <>
    <div id="videoContainer" className={css.videoContainer} ref={videoContainer} onMouseMove={()=>VideoContainerMouseMove()}>
        <div id="videoWrapper" className={css.videoWrapper} ref={videoWrapper} onClick={(e)=>PlayHandler(e )}>
            <video id="videoPlayer" crossOrigin='anonymous' className={css.videoPlayer} ref={video} onLoadedMetadata={(e)=> LoadedMetaData(e )} onPlay={OnVideoStart} onCanPlayThrough={(e)=> CanPlayThrough(e)} onTimeUpdate={(e)=> TimeUpdate(e)} onEnded={(e)=> VideoEnded()} >
                Sorry, your browser doesn&apos;t support embedded videos.
                {Object.keys(subsTable).length >0 && Object.keys(subsTable).map(sub=> 
                    <track key={subsTable[sub].url} kind='subtitles' label={subsTable[sub].name} srcLang={subsTable[sub].isoLang} src={subsTable[sub].url} id={subsTable[sub].url} ></track>
                )}
            </video>
        </div>
        <div id="video-controls" className={css.video_controls} ref={videoControls}>
            <div id="vol-Indicator" className={css.vol_Indicator} ref={volIndic}>100%</div>
            <div id="subtitles" className={`${css.panel} ${css.subtitles} panel`} ref={subtitlesPanel}>
                <div className={`${css.subtitlesHead} ${css.disFlex} head`}>
                    <svg onClick={()=> subtitlesPanel.current.classList.toggle('show') } className={`${css.arrowSVG} ${css.subtitlesX}`}  viewBox="0 0 460.775 460.775">
                        <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"/>
                    </svg>
                    <span onClick={()=> { subtitlesPanel.current.classList.toggle('show'); subsSetPanel.current.classList.add('show');}} className={css.subtitlesSet}>Settings</span>
                </div>
                <div id='subtitleBody' className={`${css.subtitleBody} `} ref={subtitlesBody}>
                    <div className={`${css.subtitlesItem} ${ current === 'off' ? css.currentSub: ''}`}>
                        <span onClick={()=>SelectSub( 'off')} className={css.subtitlesName} data-label='off'>off</span>
                    </div>
                    {Object.keys(subsTable).length >0 && Object.keys(subsTable).map(sub=> 
                        <div key={subsTable[sub].name + subsTable[sub].url} className={`${css.subtitlesItem} ${ current === subsTable[sub].url ? css.currentSub: ''}`}>
                            <span onClick={()=>SelectSub(subsTable[sub].url)} className={`${css.subtitlesName}`} data-language={subsTable[sub].isoLang}>{subsTable[sub].isoLang} | {subsTable[sub].name}</span>
                            <svg onClick={(e)=>RemoveSub( subsTable[sub].name, subsTable[sub].url, subsTable[sub].isoLang )} 
                                className={`${css.arrowSVG} ${css.subtitlesX}`} viewBox="0 0 460.775 460.775">
                                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55  c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55  c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505  c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55  l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719  c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"/>
                            </svg>
                        </div>
                    )}
                </div>
            </div>
            <div className={`${css.panel} ${css.settingsPanel} panel`} id="settingsPanel" ref={settingsPanel}>
                <div id="speed" data-but="speed" className={css.settingsItem} onClick={(e)=>SettingsItemsClick(e)}>
                    <svg viewBox="0 0 24 24" className={css.itemSVG}>
                        <path d="M10,8v8l6-4L10,8L10,8z M6.3,5L5.7,4.2C7.2,3,9,2.2,11,2l0.1,1C9.3,3.2,7.7,3.9,6.3,5z            M5,6.3L4.2,5.7C3,7.2,2.2,9,2,11 l1,.1C3.2,9.3,3.9,7.7,5,6.3z            M5,17.7c-1.1-1.4-1.8-3.1-2-4.8L2,13c0.2,2,1,3.8,2.2,5.4L5,17.7z            M11.1,21c-1.8-0.2-3.4-0.9-4.8-2 l-0.6,.8C7.2,21,9,21.8,11,22L11.1,21z            M22,12c0-5.2-3.9-9.4-9-10l-0.1,1c4.6,.5,8.1,4.3,8.1,9s-3.5,8.5-8.1,9l0.1,1 C18.2,21.5,22,17.2,22,12z" fill="white"></path>
                    </svg>
                    <span className={css.itemText}>Speed</span>
                    <span className={`${css.itemChoice} itemChoice`}>1.00</span> 
                    <svg viewBox="0 0 300.000000 300.000000" className={css.arrowSVG}>
                        <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none">
                            <path d="M775 2981 c-48 -22 -87 -60 -109 -105 -21 -44 -20 -128 1 -174 10 -24 230 -252 597 -620 l581 -582 -581 -583 c-367 -367 -587 -595 -597 -619 -21 -46 -22 -130 -1 -174 34 -71 114 -124 189 -124 89 0 95 6 778 688 357 356 663 667 680 692 29 41 32 52 32 120 0 68 -3 79 -32 120 -17 25 -323 336 -680 692 -496 495 -659 652 -693 667 -56 25 -113 26 -165 2z"/>
                        </g>
                    </svg>
                </div>
                <div id="subs-settings" data-but="subs-settings" className={css.settingsItem} onClick={(e)=>SettingsItemsClick(e)}>
                    <svg viewBox="0 0 24 24" className={css.itemSVG}>
                        <path d="M6,14v-4c0-0.55,.45-1,1-1h3c0.55,0,1,.45,1,1v1H9.5v-0.5h-2v3h2V13H11v1c0,.55-0.45,1-1,1H7C6.45,15,6,14.55,6,14z            M14,15h3c0.55,0,1-0.45,1-1v-1h-1.5v0.5h-2v-3h2V11H18v-1c0-0.55-0.45-1-1-1h-3c-0.55,0-1,.45-1,1v4C13,14.55,13.45,15,14,15z            M20,4H4v16h16V4 M21,3v18H3V3.01C3,3,3,3,3.01,3H21L21,3z" fill="white"></path>
                    </svg>
                    <span className={css.itemText}>Subtitles</span>
                    <span className={`${css.itemChoice} itemChoice`}>Settings</span> 
                    <svg viewBox="0 0 300.000000 300.000000" className={css.arrowSVG}>
                        <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none">
                            <path d="M775 2981 c-48 -22 -87 -60 -109 -105 -21 -44 -20 -128 1 -174 10 -24 230 -252 597 -620 l581 -582 -581 -583 c-367 -367 -587 -595 -597 -619 -21 -46 -22 -130 -1 -174 34 -71 114 -124 189 -124 89 0 95 6 778 688 357 356 663 667 680 692 29 41 32 52 32 120 0 68 -3 79 -32 120 -17 25 -323 336 -680 692 -496 495 -659 652 -693 667 -56 25 -113 26 -165 2z"/>
                        </g>
                    </svg>
                </div>
                <div id="ratio" data-but="ratio" className={css.settingsItem} onClick={(e)=>SettingsItemsClick(e)}>
                    <svg viewBox="0 0 876.000000 660.000000" className={css.itemSVG}>
                        <g transform="translate(0.000000,660.000000) scale(0.100000,-0.100000)">
                        <path d="M1209 6196 c-2 -2 -35 -11 -74 -19 -102 -22 -162 -47 -313 -126 -35 -19 -215 -198 -233 -233 -91 -174 -102 -201 -134 -340 -13 -59 -15 -315 -15 -2169 0 -1890 2 -2108 16 -2173 16 -69 32 -119 59 -181 7 -16 16 -37 19 -45 53 -124 262 -327 386 -376 8 -3 23 -10 33 -15 33 -18 113 -42 201 -60 86 -18 199 -19 3144 -19 3279 0 3105 -2 3235 46 86 32 123 49 138 61 8 7 19 13 23 13 12 0 118 80 164 124 53 50 146 176 168 226 3 8 12 29 19 45 27 62 43 112 59 181 14 65 16 282 16 2166 0 2008 -1 2099 -19 2184 -18 88 -42 168 -60 201 -5 10 -12 25 -15 33 -15 38 -66 114 -116 175 -58 70 -205 189 -260 211 -8 3 -28 12 -45 19 -62 27 -112 43 -181 59 -65 14 -363 16 -3141 16 -1688 0 -3072 -2 -3074 -4z m6161 -495 c30 -11 70 -27 89 -37 39 -19 151 -129 151 -148 0 -7 5 -17 11 -23 7 -7 20 -36 30 -65 18 -50 19 -132 19 -2123 0 -1930 -1 -2073 -17 -2120 -45 -131 -144 -230 -278 -277 -46 -17 -219 -18 -3080 -18 -2926 0 -3033 1 -3083 19 -29 10 -58 23 -65 30 -6 6 -16 11 -23 11 -17 0 -131 116 -149 153 -9 18 -25 57 -36 87 -19 53 -19 103 -19 2115 0 2008 0 2062 19 2115 30 84 46 110 108 173 55 55 89 77 178 111 36 13 374 15 3065 15 2967 1 3027 1 3080 -18z"/>
                        <path d="M5970 4353 c-135 -47 -244 -128 -308 -226 -84 -132 -97 -180 -96 -377 0 -170 4 -197 53 -300 45 -96 164 -217 256 -258 22 -10 58 -27 80 -37 32 -14 76 -18 225 -22 102 -3 191 -10 198 -15 7 -7 12 -36 12 -78 0 -101 -8 -127 -45 -150 -30 -19 -50 -20 -317 -20 -261 0 -289 -2 -329 -19 -93 -41 -133 -110 -133 -231 0 -96 18 -140 76 -192 74 -66 89 -68 422 -68 288 0 305 1 372 23 202 66 325 203 410 457 18 51 19 94 19 570 0 575 3 550 -74 684 -36 62 -131 164 -174 187 -157 84 -183 89 -407 88 -150 0 -205 -4 -240 -16z m385 -578 c28 -23 29 -28 33 -117 3 -76 1 -96 -11 -107 -12 -9 -49 -12 -141 -9 -108 3 -128 6 -153 24 -34 25 -49 82 -39 148 11 70 43 86 176 85 96 0 108 -2 135 -24z"/>
                        <path d="M1692 4253 c-59 -29 -103 -79 -120 -139 -9 -30 -12 -242 -12 -788 0 -840 -2 -811 72 -886 118 -118 281 -105 378 30 l25 35 0 815 c0 805 0 815 -21 851 -11 20 -29 45 -39 55 -59 59 -191 72 -283 27z"/>
                        <path d="M2805 4265 c-22 -8 -46 -15 -53 -15 -27 0 -143 -65 -191 -107 -56 -49 -127 -139 -152 -193 -49 -103 -50 -115 -46 -635 4 -550 2 -537 83 -688 20 -35 149 -165 177 -178 12 -5 29 -13 37 -18 29 -17 85 -39 141 -55 78 -22 345 -22 420 0 209 62 365 207 437 404 34 92 12 287 -46 410 -47 102 -161 215 -262 262 -112 51 -109 51 -310 57 l-195 6 -3 93 -3 94 36 34 36 34 275 0 c272 0 275 0 323 25 139 70 176 276 74 403 -66 81 -70 82 -425 82 -247 -1 -322 -4 -353 -15z m318 -1179 c50 -20 67 -54 67 -131 0 -70 -10 -98 -44 -127 -17 -14 -41 -17 -131 -18 l-109 0 -33 32 c-33 32 -33 32 -33 129 0 54 3 104 6 113 5 13 26 16 125 16 78 0 131 -5 152 -14z"/>
                        <path d="M4520 4273 c-101 -39 -167 -95 -209 -177 -22 -43 -26 -64 -26 -136 0 -100 24 -159 90 -226 65 -65 125 -88 225 -88 101 0 160 23 225 89 66 65 89 124 89 225 0 100 -23 160 -88 225 -61 61 -126 88 -216 92 -41 1 -82 0 -90 -4z"/>
                        <path d="M4530 2991 c-91 -18 -176 -86 -220 -176 -21 -41 -25 -65 -25 -135 0 -72 4 -93 26 -136 56 -109 156 -175 272 -182 132 -8 241 58 310 187 14 27 19 58 20 126 1 76 -2 98 -23 140 -30 62 -92 124 -150 153 -49 23 -153 35 -210 23z"/>
                        </g>
                    </svg>
                    <span className={css.itemText}>Aspect Ratio</span>
                    <span className={`${css.itemChoice} itemChoice`}>Default</span> 
                    <svg viewBox="0 0 300.000000 300.000000" className={css.arrowSVG}>
                        <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none">
                            <path d="M775 2981 c-48 -22 -87 -60 -109 -105 -21 -44 -20 -128 1 -174 10 -24 230 -252 597 -620 l581 -582 -581 -583 c-367 -367 -587 -595 -597 -619 -21 -46 -22 -130 -1 -174 34 -71 114 -124 189 -124 89 0 95 6 778 688 357 356 663 667 680 692 29 41 32 52 32 120 0 68 -3 79 -32 120 -17 25 -323 336 -680 692 -496 495 -659 652 -693 667 -56 25 -113 26 -165 2z"/>
                        </g>
                    </svg>
                </div>
                <div id="chat" data-but="chat-settings" className={css.settingsItem} onClick={(e)=>SettingsItemsClick(e)}>
                    <svg xmlns="http://www.w3.org/2000/svg" version="1.0" className={css.itemSVG} viewBox="0 0 100.000000 100.000000" preserveAspectRatio="xMidYMid meet">
                                <g transform="translate(0.000000,100.000000) scale(0.100000,-0.100000)">
                                <path d="M376 904 c-130 -32 -250 -127 -304 -241 -23 -49 -27 -72 -27 -143 0 -71 4 -94 27 -143 77 -164 264 -267 461 -254 75 5 79 4 128 -29 27 -18 67 -38 87 -44 39 -10 102 -14 102 -5 0 3 -11 22 -24 43 -13 20 -29 54 -36 75 l-12 37 56 51 c37 33 67 73 88 117 29 59 33 76 33 152 0 71 -4 94 -27 143 -90 192 -327 296 -552 241z m237 -39 c129 -33 227 -109 275 -213 38 -80 38 -184 1 -262 -23 -50 -94 -130 -133 -152 -20 -11 -20 -35 0 -94 8 -25 13 -48 10 -52 -10 -9 -83 29 -110 57 -25 26 -28 27 -91 17 -134 -20 -291 29 -380 119 -135 134 -135 335 -2 469 106 105 280 150 430 111z"/>
                                {/* <path className='chatArrow' d="M315 600 l-80 -80 82 -82 c65 -65 85 -80 95 -70 10 10 0 25 -47 72 l-59 60 215 2 c182 3 214 5 214 18 0 13 -32 15 -214 18 l-215 2 58 59 c50 51 64 81 38 81 -4 0 -43 -36 -87 -80z"/> */}
                                </g>
                            </svg>
                    <span className={css.itemText}>Chat</span>
                    <span className={`${css.itemChoice} itemChoice`}>Settings</span> 
                    <svg viewBox="0 0 300.000000 300.000000" className={css.arrowSVG}>
                        <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none">
                            <path d="M775 2981 c-48 -22 -87 -60 -109 -105 -21 -44 -20 -128 1 -174 10 -24 230 -252 597 -620 l581 -582 -581 -583 c-367 -367 -587 -595 -597 -619 -21 -46 -22 -130 -1 -174 34 -71 114 -124 189 -124 89 0 95 6 778 688 357 356 663 667 680 692 29 41 32 52 32 120 0 68 -3 79 -32 120 -17 25 -323 336 -680 692 -496 495 -659 652 -693 667 -56 25 -113 26 -165 2z"/>
                        </g>
                    </svg>
                </div>
            </div>
            <div className={`${css.panel} panel`} id="speedPanel" data-panel="speed" ref={speedPanel}>
                <div className={`${css.head} ${css.disFlex} head`} onClick={(e)=>VideoCtrlPanelsHead(e)}>
                    <svg viewBox="0 0 300.000000 300" className={css.arrowSVG}>
                        <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)">
                        <path d="M2054 2975 c-66 -33 -1365 -1331 -1389 -1387 -19 -48 -19 -128 0 -176 24 -56 1323 -1354 1389 -1387 64 -32 118 -32 183 0 69 35 106 88 111 165 8 111 32 82 -606 723 l-586 587 586 588 c638 640 614 611 606 722 -5 77 -42 130 -111 165 -65 32 -119 32 -183 0z"/>
                        </g>
                    </svg>
                    <span className={css.itemText}>Speed</span>
                </div>
                <div id="speedRange" className={`${css.disFlex}`}>
                    <div className={css.arrows}>
                        <svg className={css.arrowSVG} onClick={(e)=>SpeedRangeArrows(e)} data-step="-0.5" viewBox="0 0 300.000000 300.000000">
                            <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)">
                                <path d="M1410 2983 c-39 -13 -136 -107 -703 -672 -471 -470 -664 -668 -679 -700 -30 -61 -34 -127 -13 -192 16 -51 53 -90 674 -712 470 -471 668 -664 700 -679 160 -77 342 25 358 202 11 119 32 94 -586 713 l-556 557 556 558 c618 618 597 593 586 712 -15 167 -176 268 -337 213z"/>
                                <path d="M2687 2866 c-67 -18 -100 -45 -244 -197 -1014 -1067 -898 -941 -924 -1009 -26 -68 -22 -155 10 -218 19 -38 168 -201 490 -537 53 -55 204 -214 335 -352 246 -260 276 -285 362 -299 54 -8 138 17 184 55 20 16 49 53 65 82 26 46 30 65 30 129 0 104 -22 139 -213 341 -86 91 -271 285 -410 432 -170 178 -251 271 -246 279 4 7 128 139 274 293 616 648 586 611 597 717 11 109 -45 214 -137 260 -70 34 -113 40 -173 24z"/>
                            </g>
                        </svg>
                        <svg className={css.arrowSVG} onClick={(e)=>SpeedRangeArrows(e)} data-step="-0.1" viewBox="0 0 300.000000 300">
                            <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)">
                            <path d="M2054 2975 c-66 -33 -1365 -1331 -1389 -1387 -19 -48 -19 -128 0 -176 24 -56 1323 -1354 1389 -1387 64 -32 118 -32 183 0 69 35 106 88 111 165 8 111 32 82 -606 723 l-586 587 586 588 c638 640 614 611 606 722 -5 77 -42 130 -111 165 -65 32 -119 32 -183 0z"/>
                            </g>
                        </svg>
                    </div>
                    <input id="speedValue" onChange={(e)=>SpeedPanelInput(e)} type="text" defaultValue="1.00" ref={speedValue}/>
                    <div className={css.arrows}>
                        <svg className={css.arrowSVG} data-step="0.1" viewBox="0 0 300.000000 300.000000">
                            <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)" fill="#ffffff" stroke="none">
                                <path d="M775 2981 c-48 -22 -87 -60 -109 -105 -21 -44 -20 -128 1 -174 10 -24 230 -252 597 -620 l581 -582 -581 -583 c-367 -367 -587 -595 -597 -619 -21 -46 -22 -130 -1 -174 34 -71 114 -124 189 -124 89 0 95 6 778 688 357 356 663 667 680 692 29 41 32 52 32 120 0 68 -3 79 -32 120 -17 25 -323 336 -680 692 -496 495 -659 652 -693 667 -56 25 -113 26 -165 2z"/>
                            </g>
                        </svg>
                        <svg className={css.arrowSVG} data-step="0.5" viewBox="0 0 300.000000 300.000000">
                            <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)">
                                <path d="M1410 2981 c-51 -21 -110 -74 -137 -123 -25 -46 -24 -170 1 -218 10 -19 266 -284 569 -587 l552 -553 -552 -553 c-303 -303 -559 -568 -569 -587 -25 -48 -26 -172 -1 -218 43 -80 143 -142 227 -142 19 0 58 8 85 17 45 15 111 77 716 682 607 606 668 670 683 715 21 63 20 108 -1 171 -15 45 -77 110 -682 716 -606 605 -671 667 -716 682 -63 22 -118 21 -175 -2z"/>
                                <path d="M154 2851 c-96 -44 -160 -155 -151 -262 6 -70 36 -128 101 -200 76 -84 555 -589 674 -711 57 -58 103 -111 101 -116 -4 -10 -41 -49 -553 -587 -284 -299 -316 -342 -324 -439 -3 -36 2 -68 17 -106 43 -114 124 -174 236 -174 104 0 126 16 386 292 129 136 322 339 429 452 107 113 238 251 291 307 75 78 102 114 118 158 39 105 19 206 -60 293 -55 61 -343 365 -479 507 -59 61 -189 198 -289 305 -220 234 -245 257 -296 281 -53 25 -147 25 -201 0z"/>
                            </g>
                        </svg>
                    </div>
                </div>
                <div className={`${css.values} values ${css.disFlex}`}>
                    <div className={`${css.value} value`} onClick={(e)=>SpeedPanelValues(e)}>
                        0.25
                    </div>
                    <div className={`${css.value} value`} onClick={(e)=>SpeedPanelValues(e)}>
                        0.50
                    </div>
                    <div className={`${css.value} value`} onClick={(e)=>SpeedPanelValues(e)}>
                        0.75
                    </div>
                    <div className={`${css.value} value selectedValue`} onClick={(e)=>SpeedPanelValues(e)}>
                        1.00
                    </div>
                    <div className={`${css.value} value`} onClick={(e)=>SpeedPanelValues(e)}>
                        1.25
                    </div>
                    <div className={`${css.value} value`} onClick={(e)=>SpeedPanelValues(e)}>
                        1.50
                    </div>
                    <div className={`${css.value} value`} onClick={(e)=>SpeedPanelValues(e)}>
                        1.75
                    </div>
                    <div className={`${css.value} value`} onClick={(e)=>SpeedPanelValues(e)}>
                        2.00
                    </div>
                </div>
            </div>
            <div className={`${css.panel} panel`} ref={subsSetPanel} id="subsSetPanel" data-panel="subs-settings">
                <div className={`${css.head} ${css.disFlex} head`} onClick={(e)=>VideoCtrlPanelsHead(e)}>
                    <svg viewBox="0 0 300.000000 300" className={css.arrowSVG}>
                        <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)">
                        <path d="M2054 2975 c-66 -33 -1365 -1331 -1389 -1387 -19 -48 -19 -128 0 -176 24 -56 1323 -1354 1389 -1387 64 -32 118 -32 183 0 69 35 106 88 111 165 8 111 32 82 -606 723 l-586 587 586 588 c638 640 614 611 606 722 -5 77 -42 130 -111 165 -65 32 -119 32 -183 0z"/>
                        </g>
                    </svg>
                    <span className={css.itemText}>Subtitles Settings</span>
                </div>
                <div id="subsSettings" className={`${css.optionSettings}`}>
                    <div className={`${css.field}`}>
                        <button onClick={(e)=>SubsSettingsHandler(e,'reset')}>reset</button>
                    </div>
                    <div id="fontFamily" className={`${css.field}`}>
                        <span>Font-Family</span>
                        <select onChange={(e)=>SubsSettingsHandler(e,'fontFamily')} defaultValue={'Arial'} name="fontFamily" className={`${css.input}`}>
                            <option value={'Arial'}>Arial</option>
                            <option value={'Verdana'}>Verdana</option>
                            <option value={'Helvetica'}>Helvetica</option>
                            <option value={'Tahoma'}>Tahoma</option>
                            <option value={'Trebuchet MS'}>Trebuchet MS</option>
                            <option value={'Times New Roman'}>Times New Roman</option>
                            <option value={'Georgia'}>Georgia</option>
                            <option value={'Garamond'}>Garamond</option>
                            <option value={'Courier New'}>Courier New</option>
                            <option value={'Brush Script MT'}>Brush Script MT</option>
                        </select>
                    </div>
                    <div id="fontSize" className={`${css.field}`}>
                        <span>Font-Size</span>
                        <div><input onChange={(e)=>SubsSettingsHandler(e,'fontSize')} min="0" defaultValue={100} type="number" className={`${css.input}`}></input>%</div>
                    </div>
                    <div id="fontColor" className={`${css.field}`}>
                        <span>Font-Color</span>
                        <input onChange={(e)=>SubsSettingsHandler(e,'fontColor')} type="color" defaultValue={"#FFFFFF"} className={`${css.input}`}></input>
                    </div>
                    <div id="fontOpacity" className={`${css.field}`}>
                        <span>Font-Opacity</span>
                        <input onChange={(e)=>SubsSettingsHandler(e,'fontOpacity')} min="0" max="1" step={0.05} defaultValue={1} type="number" className={`${css.input}`}></input>
                    </div>
                    <div id="backgroundColor" className={`${css.field}`}>
                        <span>Background Color</span>
                        <input onChange={(e)=>SubsSettingsHandler(e,'backColor')} type="color" defaultValue={"#000000"} className={`${css.input}`}></input>
                    </div>
                    <div id="backgroundOpacity" className={`${css.field}`}>
                        <span>Background Opacity</span>
                        <input onChange={(e)=>SubsSettingsHandler(e,'backOpacity')} min="0" max="1" step={0.05} defaultValue={0} type="number" className={`${css.input}`}></input>
                    </div>
                    <div id="vertical" className={`${css.field}`}>
                        <span>Vertical Position</span>
                        <div><input onChange={(e)=>SubsSettingsHandler(e,'vertical')} step={1} defaultValue={87} type="number" className={`${css.input}`}></input>%</div>
                    </div>
                    <div id="horizontal" className={`${css.field}`}>
                        <span>Horizontal Position</span>
                        <div><input onChange={(e)=>SubsSettingsHandler(e,'horizontal')} step={1} defaultValue={0} type="number" className={`${css.input}`}></input>%</div>
                    </div>
                </div>
            </div>
            <div className={`${css.panel} panel`} ref={chatSetPanel} id="chatSetPanel" data-panel="chat-settings">
                <div className={`${css.head} ${css.disFlex} head`} onClick={(e)=>VideoCtrlPanelsHead(e)}>
                    <svg viewBox="0 0 300.000000 300" className={css.arrowSVG}>
                        <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)">
                        <path d="M2054 2975 c-66 -33 -1365 -1331 -1389 -1387 -19 -48 -19 -128 0 -176 24 -56 1323 -1354 1389 -1387 64 -32 118 -32 183 0 69 35 106 88 111 165 8 111 32 82 -606 723 l-586 587 586 588 c638 640 614 611 606 722 -5 77 -42 130 -111 165 -65 32 -119 32 -183 0z"/>
                        </g>
                    </svg>
                    <span className={css.itemText}>Chat Settings</span>
                </div>
                <div id="chatSettings" className={`${css.optionSettings}`}>
                    <div className={`${css.field}`}>
                        <button onClick={(e)=>ChatSettingsHandler(e,'reset')}>reset</button>
                    </div>
                    <div id="chat_fontFamily" className={`${css.field}`}>
                        <span>Font-Family</span>
                        <select onChange={(e)=>ChatSettingsHandler(e,'fontFamily')} defaultValue={'Arial'} name="fontFamily" className={`${css.input}`}>
                            <option value={'Arial'}>Arial</option>
                            <option value={'Verdana'}>Verdana</option>
                            <option value={'Helvetica'}>Helvetica</option>
                            <option value={'Tahoma'}>Tahoma</option>
                            <option value={'Trebuchet MS'}>Trebuchet MS</option>
                            <option value={'Times New Roman'}>Times New Roman</option>
                            <option value={'Georgia'}>Georgia</option>
                            <option value={'Garamond'}>Garamond</option>
                            <option value={'Courier New'}>Courier New</option>
                            <option value={'Brush Script MT'}>Brush Script MT</option>
                        </select>
                    </div>
                    <div id="chat_fontSize" className={`${css.field}`}>
                        <span>Font-Size</span>
                        <div><input onChange={(e)=>ChatSettingsHandler(e,'fontSize')} min="0" defaultValue={1.5} max='5' step={0.1} type="number" className={`${css.input}`}></input>em</div>
                    </div>
                    <div id="chat_fontColor" className={`${css.field}`}>
                        <span>Font-Color</span>
                        <input onChange={(e)=>ChatSettingsHandler(e,'fontColor')} type="color" defaultValue={"#FFFFFF"} className={`${css.input}`}></input>
                    </div>
                    <div id="chat_fontOpacity" className={`${css.field}`}>
                        <span>Font-Opacity</span>
                        <input onChange={(e)=>ChatSettingsHandler(e,'fontOpacity')} min="0" max="1" step={0.05} defaultValue={1} type="number" className={`${css.input}`}></input>
                    </div>
                    <div id="chat_backgroundColor" className={`${css.field}`}>
                        <span>Background Color</span>
                        <input onChange={(e)=>ChatSettingsHandler(e,'backColor')} type="color" defaultValue={"#000000"} className={`${css.input}`}></input>
                    </div>
                    <div id="chat_backgroundOpacity" className={`${css.field}`}>
                        <span>Background Opacity</span>
                        <input onChange={(e)=>ChatSettingsHandler(e,'backOpacity')} min="0" max="1" step={0.05} defaultValue={0} type="number" className={`${css.input}`}></input>
                    </div>
                    <div id="chat_all_messages" className={`${css.field}`}>
                        <span>View older messages</span>
                        <div><input onChange={(e)=>ChatSettingsHandler(e,'vertical')} type="checkbox" className={`${css.input}`}></input></div>
                    </div>
                    <div id="chat_all_messages" className={`${css.field}`}>
                        <span>View older messages</span>
                        <div><input onChange={(e)=>ChatSettingsHandler(e,'vertical')} type="checkbox" className={`${css.input}`}></input></div>
                    </div>
                </div>
            </div>
            <div className={`${css.panel} panel`} id="ratioPanel" data-panel="ratio">
                <div className={`${css.head} ${css.disFlex} head`} onClick={(e)=>VideoCtrlPanelsHead(e)}>
                    <svg viewBox="0 0 300.000000 300" className={css.arrowSVG}>
                        <g transform="translate(0.000000,300.000000) scale(0.100000,-0.100000)">
                        <path d="M2054 2975 c-66 -33 -1365 -1331 -1389 -1387 -19 -48 -19 -128 0 -176 24 -56 1323 -1354 1389 -1387 64 -32 118 -32 183 0 69 35 106 88 111 165 8 111 32 82 -606 723 l-586 587 586 588 c638 640 614 611 606 722 -5 77 -42 130 -111 165 -65 32 -119 32 -183 0z"/>
                        </g>
                    </svg>
                    <span className={css.itemText}>Aspect Ratio</span>
                </div>
                <div id="ratioRange" className={`${css.range} ${css.disFlex}`}>
                    <input onChange={(e)=>RationPanelInput(e)} id="ratioValue" pattern="[0-9.]+\s?:\s?[0-9.]+" type="text" defaultValue="auto"/>
                </div>
                <div className={`${css.values} ${css.disFlex} values`}>
                    <div className={`${css.value} value`} data-value="16 / 9" onClick={(e)=>RationPanelValues(e)}>
                        16 : 9
                    </div>
                    <div className={`${css.value} value`} data-value="16 / 10" onClick={(e)=>RationPanelValues(e)}>
                        16 : 10
                    </div>
                    <div className={`${css.value} value`} data-value="1 / 1" onClick={(e)=>RationPanelValues(e)}>
                        1 : 1
                    </div>
                    <div className={`${css.value} value`} data-value="3 / 2" onClick={(e)=>RationPanelValues(e)}>
                        3 : 2
                    </div>
                    <div className={`${css.value} value`} data-value="4 / 3" onClick={(e)=>RationPanelValues(e)}>
                        4 : 3
                    </div>
                    <div className={`${css.value} value`} data-value="9 / 16" onClick={(e)=>RationPanelValues(e)}>
                        9 : 16
                    </div>
                    <div className={`${css.value} value selectedValue`} data-value="auto" onClick={(e)=>RationPanelValues(e)}>
                        Default
                    </div>
                </div>
            </div>
            <div id="top-bar" className={css.top_bar} ref={topBar} onClick={ClosePanels}>

            </div>
            <div ref={messagesCont} className={css.messagesCont}>
                {messages.length >0 && messages.map((message,index)=> 
                    <div key={message.sender+message.value+index} className={`${css.message} message`} >
                        <span className={`sender`}>{`<${message.user}>`} </span>
                        <span className={`messageText`}>{message.text}</span>
                    </div>
                )}
            </div>
            <div id="bot-bar" className={css.bot_bar} ref={botBar} onClick={ClosePanels}>
                <div id="buttons-bar" className={css.buttons_bar}>
                    <button className={`${css.button} ${css.playpause}`} id="playpause" onClick={(e)=> PlayHandler(e, singleClick, dbClickTimeout, playBut, audioCtx, BarTimer, video, dbDelay, videoContainer, video, progress )} ref={playBut} data-state="play" aria-label="Play" title="play (k)" type="button">
                        <svg viewBox="0 0 36 36" className={css.svg}>
                            <path id="play" d="M 12,26 18.5,22 18.5,14 12,10 z M 18.5,22 25,18 25,18 18.5,14 z"></path>
                        </svg>
                    </button>
                    <div id="volume" className={css.volume} ref={vol} aria-label="Sound" title="Sound">
                        <button className={css.button} id="vol-but" onClick={(e)=>VolButClick(e)} ref={volBut}>
                            <svg viewBox="0 0 36 36" className={css.svg}>
                                <path d="M8,21 L12,21 L17,26 L17,10 L12,15 L8,15 L8,21 Z M19,14 L19,22 C20.48,21.32 21.5,19.77 21.5,18 C21.5,16.26 20.48,14.74 19,14 ZM19,11.29 C21.89,12.15 24,14.83 24,18 C24,21.17 21.89,23.85 19,24.71 L19,26.77 C23.01,25.86 26,22.28 26,18 C26,13.72 23.01,10.14 19,9.23 L19,11.29 Z" fill="#fff"></path>
                                <path id="vol-muted" className={css.vol_muted} d="M 9.25,9 7.98,10.27 24.71,27 l 1.27,-1.27 Z" fill="#fff"></path>
                            </svg>
                        </button>
                        <div id="vol-percent-bar" className={css.vol_percent_bar} onMouseDown={(e)=>VolBarMouseDown(e)} ref={volBar}>
                            <div id="vol-value-normal" className={css.vol_value}></div>
                            <div id="vol-value-extreme" className={`${css.vol_value} ${css.vol_value_extreme}`}></div>
                            <div id="vol-pin" className={css.vol_pin} ref={volPin}></div>
                        </div>
                    </div>
                    <div id="timer" className={css.timer}>
                        <span id="currentTime" ref={currentTimeSpan}>0:00</span>
                        <span> / </span>
                        <span id="totalTime" ref={totalTime}>0:00</span>
                    </div>
                    <div className={`${css.chatButCont} chatButCont`} ref={chatButCont} aria-label="Show Chat Input" title="Chat Input">
                        <button className={`${css.chatBut} chatBut`} onClick={ChatButClick} ref={chatBut}>
                            <svg xmlns="http://www.w3.org/2000/svg" version="1.0" className={css.svg} viewBox="-25 -25 150.000000 150.000000" preserveAspectRatio="xMidYMid meet">
                                <g transform="translate(0.000000,100.000000) scale(0.100000,-0.100000)">
                                <path d="M376 904 c-130 -32 -250 -127 -304 -241 -23 -49 -27 -72 -27 -143 0 -71 4 -94 27 -143 77 -164 264 -267 461 -254 75 5 79 4 128 -29 27 -18 67 -38 87 -44 39 -10 102 -14 102 -5 0 3 -11 22 -24 43 -13 20 -29 54 -36 75 l-12 37 56 51 c37 33 67 73 88 117 29 59 33 76 33 152 0 71 -4 94 -27 143 -90 192 -327 296 -552 241z m237 -39 c129 -33 227 -109 275 -213 38 -80 38 -184 1 -262 -23 -50 -94 -130 -133 -152 -20 -11 -20 -35 0 -94 8 -25 13 -48 10 -52 -10 -9 -83 29 -110 57 -25 26 -28 27 -91 17 -134 -20 -291 29 -380 119 -135 134 -135 335 -2 469 106 105 280 150 430 111z"/>
                                <path className='chatArrow' d="M315 600 l-80 -80 82 -82 c65 -65 85 -80 95 -70 10 10 0 25 -47 72 l-59 60 215 2 c182 3 214 5 214 18 0 13 -32 15 -214 18 l-215 2 58 59 c50 51 64 81 38 81 -4 0 -43 -36 -87 -80z"/>
                                </g>
                            </svg>
                        </button>
                        <input ref={chatInput} onKeyDown={SendMessage} type='text' className={`chatInput ${css.chatInput}`} placeholder='Egw otan...'/>
                    </div>
                    <button className={css.button} id="subs" onClick={()=>ToggleSubsPanel()} ref={subs} title={`${ current !== 'off' ? subsTable[current].isoLang : "no subs"}`}>
                        <svg viewBox="0 0 36 36" fillOpacity={0.5} className={`${css.svg} ${ current !== 'off' ? css.enabledSVG: ''}`}>
                            <path d="M11,11 C9.9,11 9,11.9 9,13 L9,23 C9,24.1 9.9,25 11,25 L25,25 C26.1,25 27,24.1 27,23 L27,13 C27,11.9 26.1,11 25,11 L11,11 Z M11,17 L14,17 L14,19 L11,19 L11,17 L11,17 Z M20,23 L11,23 L11,21 L20,21 L20,23 L20,23 Z M25,23 L22,23 L22,21 L25,21 L25,23 L25,23 Z M25,19 L16,19 L16,17 L25,17 L25,19 L25,19 Z" fill="#fff"></path>
                        </svg>
                    </button>
                    <button className={css.button} id="settings" ref={settingsBut} onClick={SettingsButClick} aria-label="settings" title="settings">
                        <svg viewBox="0 0 36 36" className={css.svg}>
                            <path d="m 23.94,18.78 c .03,-0.25 .05,-0.51 .05,-0.78 0,-0.27 -0.02,-0.52 -0.05,-0.78 l 1.68,-1.32 c .15,-0.12 .19,-0.33 .09,-0.51 l -1.6,-2.76 c -0.09,-0.17 -0.31,-0.24 -0.48,-0.17 l -1.99,.8 c -0.41,-0.32 -0.86,-0.58 -1.35,-0.78 l -0.30,-2.12 c -0.02,-0.19 -0.19,-0.33 -0.39,-0.33 l -3.2,0 c -0.2,0 -0.36,.14 -0.39,.33 l -0.30,2.12 c -0.48,.2 -0.93,.47 -1.35,.78 l -1.99,-0.8 c -0.18,-0.07 -0.39,0 -0.48,.17 l -1.6,2.76 c -0.10,.17 -0.05,.39 .09,.51 l 1.68,1.32 c -0.03,.25 -0.05,.52 -0.05,.78 0,.26 .02,.52 .05,.78 l -1.68,1.32 c -0.15,.12 -0.19,.33 -0.09,.51 l 1.6,2.76 c .09,.17 .31,.24 .48,.17 l 1.99,-0.8 c .41,.32 .86,.58 1.35,.78 l .30,2.12 c .02,.19 .19,.33 .39,.33 l 3.2,0 c .2,0 .36,-0.14 .39,-0.33 l .30,-2.12 c .48,-0.2 .93,-0.47 1.35,-0.78 l 1.99,.8 c .18,.07 .39,0 .48,-0.17 l 1.6,-2.76 c .09,-0.17 .05,-0.39 -0.09,-0.51 l -1.68,-1.32 0,0 z m -5.94,2.01 c -1.54,0 -2.8,-1.25 -2.8,-2.8 0,-1.54 1.25,-2.8 2.8,-2.8 1.54,0 2.8,1.25 2.8,2.8 0,1.54 -1.25,2.8 -2.8,2.8 l 0,0 z" fill="#fff"></path>
                        </svg>
                    </button>
                    <button className={css.button} id="pip" onClick={(e)=>PipHandler()} ref={pip} data-state="disabled" aria-label="Picture-in-picture" title="picture-in-picture">
                        <svg viewBox="0 0 36 36" className={css.svg}>
                            <path
                                d="M25,17 L17,17 L17,23 L25,23 L25,17 L25,17 Z M29,25 L29,10.98 C29,9.88 28.1,9 27,9 L9,9 C7.9,9 7,9.88 7,10.98 L7,25 C7,26.1 7.9,27 9,27 L27,27 C28.1,27 29,26.1 29,25 L29,25 Z M27,25.02 L9,25.02 L9,10.97 L27,10.97 L27,25.02 L27,25.02 Z"
                                fill="#fff"></path>
                        </svg>
                    </button>
                    <button className={`${css.button} ${css.fullscreen}`} id="fullscreen" onClick={(e)=>FullScrHandler(e)} ref={fsBut} data-state="nofull" aria-label="Fullscreen (f)" title="Fullscreen (f)">
                        <svg viewBox="0 0 36 36" className={css.svg}>
                            <g id="fullscreen-off">
                                <path id="p0" d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z" fill="#fff"></path>
                                <path id="p1" d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z" fill="#fff"></path>
                                <path id="p2" d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z" fill="#fff"></path>
                                <path id="p3" d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z" fill="#fff"></path>
                            </g>
                        </svg>
                    </button>
                </div>
                <div id="progress" className={css.progress} ref={progress} onMouseMove={(e)=> MouseMove(e)} onMouseDown={(e)=> MouseDown( )} onMouseLeave={()=> MouseLeave( )}>
                    <span id="prog-bar-label" className={css.prog_bar_label} ref={progBarLabel}>0:00</span>
                    <div id="prog-bar" className={css.prog_bar} ref={progBar}>
                        <span id="bar-hover" className={css.bar_hover}></span>
                        <div id="bar-value" className={css.bar_value}>
                            <span id="prog-bar-pin" className={css.prog_bar_pin}></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
}