import Link from 'next/link';
import Script from 'next/script';
import toWebVTT from "srt-webvtt";
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { setCookies, getCookie, removeCookies } from 'cookies-next';
import { io } from "socket.io-client";
import WebTorrent from 'webtorrent';
import Webplayer from '../../components/webplayer';

export default function Room({cookies}){
	const router = useRouter();
	const room = cookies.room;
	const username = cookies.username;
	let player;
	let socket;
	useEffect(()=>{
		socket = io(process.env.NEXT_PUBLIC_SERVER, { transports: ['websocket'] });
		// const webtorrent = new WebTorrent();
		document.addEventListener('dragenter', DragEnter, true);
		document.addEventListener('dragover', DragOver, true);
		document.addEventListener('dragleave', DragLeave, true);
		document.addEventListener("drop", Drop ,true);
		player = document.querySelector("video");
		setInterval(() => {
			socket.volatile.emit("timedifferencev1",new Date().toISOString().slice(0,-1));
		}, 5000);
		setInterval(() => {
			socket.volatile.emit("timedifferencev2",Date.now());
		}, 5000);

		setInterval(() => {
			const start =Date.now();

			socket.volatile.emit("ping", room ,(serverTime, dateEmited) => {
				const totalDelay = Date.now() - start;
				const serverDelay = Date.now() - dateEmited;
				console.log(" totalDelay= ",totalDelay," serverDelay= ", serverDelay, " mycustomTime ",new Date().toISOString().slice(0,-1));

				serverTime = ( serverTime  /1000).toFixed(3);
				// if( serverTime < 0){ serverTime = 0; }
				console.log("VideoTime= ",player.currentTime,"ServerTime= ",serverTime)
				document.querySelector("#ping").innerHTML = " \n VideoTime= <span style='color:red;'>"+player.currentTime+" </span> \nServerTime= <span style='color:red;'> "+serverTime+"</span>"+" <p>totalDelay= "+ totalDelay+"</p>";
				
				if( !player.paused && Math.abs(serverTime - player.currentTime) > 0.5 ){
					player.currentTime = serverTime;
					console.log("%csyncing with server","color:yellow;font-size:2rem;font-weight:bold");
				}
				// console.log(time - player.currentTime)
				console.log("delay =",totalDelay);
			});
		}, 5000);
		player.addEventListener("pause", SendPauseEvent );
		function SendPauseEvent(e){
			if( player.serverResp ) { player.serverResp = false; return; }
			socket.emit("pause",{ room: room, videoTime: player.currentTime*1000, user: username, dateEmited: Date.now()})
			console.log("%cpause at "+player.currentTime,"color:red;font-size:2rem;font-weight:bold");
		}
		player.addEventListener("play", SendPlayEvent );
		function SendPlayEvent(e){
			if( player.serverResp ) { player.serverResp = false; return; }
			socket.emit("play",{ room: room, videoTime: player.currentTime*1000, user: username, dateEmited: Date.now() })
			player.pause();
			player.serverResp = true;
			console.log("%cplay at "+player.currentTime,"color:green;font-size:2rem;font-weight:bold")
		}

		socket.on("pause", ({ videoTime, user }) =>{
			player.serverResp = true;
			player.currentTime = videoTime / 1000;
			player.pause();
		});
		socket.on("play", ({ videoTime, dateEmited, user }) =>{
			// const dateNow =Date.now();
			// const emitionDelay = dateNow - dateEmited;
			player.serverResp = true;
			player.currentTime = videoTime / 1000;
			player.play();
		});
		socket.on("addPlayer_room", ({ user, id, color }) => {
			console.log({ user, id, color })
			// let idExists = document.querySelector(`[socketID='${id}']`);
			// if (idExists) {
			// 	idExists.style.backgroundColor = color;
			// } else {
			// 	AddPlayer({ name: name, id: id, color: color });
			// }
		});
		socket.on("addSub", ({name,url,language,langIso}) => {
			AddSubTrack( player, name, url, langIso, true );
		});
		socket.emit("initialize_room", { room: cookies.room, user: username },({ users, subs}) => {
			console.log(users,subs);
			for (const code in subs) {
				for (const sub in subs[code]) {
					AddSubTrack( player, subs[code][sub].name, subs[code][sub].url, subs[code][sub].langIso );
				}
			}
			// console.log(webtorrent)
			// webtorrent.add(data.magnet, function (torrent) {
			// 	// Got torrent metadata!
			// 	console.log('Client is downloading:', torrent.infoHash)
			  
			// 	torrent.files.forEach(function (file) {
			// 	  // Display the file by appending it to the DOM. Supports video, audio, images, and
			// 	  // more. Specify a container element (CSS selector or reference to DOM node).
			// 	  file.appendTo('body')
			// 	})
			// })
			for (const [user, { id, color }] of Object.entries(users)) {
				if (!user) continue;
				// AddPlayer({ name: user, id: id, color: color });
			}
		});
		return ()=>{
			socket.emit("leave_room", { room: cookies.room, user: username});
			socket.disconnect();
			document.removeEventListener('dragenter', DragEnter, true);
			document.removeEventListener('dragover', DragOver, true);
			document.removeEventListener('dragleave', DragLeave, true);
			player.removeEventListener("pause", SendPauseEvent );
			player.removeEventListener("play", SendPlayEvent );
		}
	},[]);
    return (
        <>
		<div id="dragdropcont" className=''>
			<div id="dragdrop">Drop it here...</div>
		</div>
		<div id="ping"></div>
		<div>{router.asPath} asdlfkj</div>
		<div id="offset"></div>
		<video crossOrigin="anonymous" controls width="500px" height="500px" src="/video.mp4 "></video>
        <Webplayer/>
		<button id='subsbutton' onClick={()=>FindSubs(player,socket,room)}>Find Subs</button>
		<div className="subscontainer">

		</div>
		</>
    );
}
async function FindSubs(player,socket,room){
	const subsCont = document.querySelector(".subscontainer");
	subsCont.classList.toggle("showFlex");
	if(!subsCont.classList.contains("showFlex")) return;
	const storage = await JSON.parse(localStorage.getItem("watchflix"));
	let data = "";
	if( storage.type === "serie" ){
		data = `&season=${storage.season}&episode=${storage.episode}`;
	}
	const request = await fetch(`/api/subs?id=${storage.imdbID}${data}`);
	const json = await request.json();
	subsCont.innerHTML = "";

	for(let item of Object.keys(json).sort()){
		for(let sub of json[item]){
			subsCont.innerHTML += `<div class="sub" data-fileID="${sub.attributes.files[0].file_id}" language="${sub.langName}" language-iso="${sub.attributes.language}" data-url="${sub.attributes.url}"><span class="subLang">${sub.langName}</span><span class="subName">${sub.attributes.release}</span></div>` 
		}
	}
	for(let item of document.querySelectorAll(".subscontainer .sub")){
		item.addEventListener("click",async ()=>{
			const request = await fetch(`/api/subs?download=${item.getAttribute("data-fileid")}`);
			const json = await request.json();
			AddSubTrack(player,json.name,json.link, item.getAttribute("language-iso"));
			console.log("sub added from opensubs: ",json);
			socket.emit("addSub",{ room: room,name: json.name, url: json.link, language: item.getAttribute("language"), langIso: item.getAttribute("language-iso")});
		});
	}
}
function AddSubTrack( player, name, url, isoLang = "undefined", makeDefault = false){
	player = document.querySelector("#videoPlayer");
	const sameTrack = document.querySelector(`video track[label='${name}'][srclang='${isoLang}']`);
	const track = sameTrack ? sameTrack : document.createElement("track");
	track.kind = "subtitles"; 
	track.label = name;
	track.srclang = isoLang;
	track.src = url;
	player.append(track);
	if(makeDefault){
		const items = player.textTracks.length;
		for (let i = 0; i < items -1; i++) {
			player.textTracks[i].mode = 'hidden';
		}
		player.textTracks[ items - 1 ].mode = 'showing';
	}
}
function DragEnter(e) {
    e.stopPropagation();
	if (!e.relatedTarget) {
    	document.querySelector("#dragdropcont")?.classList.add("show");
	}
}
function DragOver(e) {
    e.stopPropagation();
    e.preventDefault();
}
function DragLeave(e) {
    e.stopPropagation();
	if (!e.relatedTarget) {
		document.querySelector("#dragdropcont")?.classList.remove("show");
	}
}
async function Drop(e) {
	e.preventDefault();
	document.querySelector("#dragdropcont")?.classList.remove("show");

	if (e.dataTransfer.items) {
	  for (let i = 0; i < e.dataTransfer.items.length; i++) {
		  const file = e.dataTransfer.items[i].getAsFile();
		  console.log('... file[' + i + '].name = ' + file.name + " "+ e.dataTransfer.items.type);
		if (file.type.match('^video/') ) {
			const link = URL.createObjectURL(file);
			player.src = link;
		}
		else if (file.name.match('.vtt$') ) {
			AddSubTrack( player, file.name, URL.createObjectURL(file) );
		}
		else if(file.name.match('.srt$') ){
			const textTrackUrl = await toWebVTT(file);
			AddSubTrack( player, file.name, textTrackUrl );
		}
		else{
			alert("Doesn't support file type!");
		}
	  }
	}
}

export async function getServerSideProps({req, params, res}) {
	const cookie = await JSON.parse(req.cookies["watchflix"] ?? null);
	let returnCookie = {...cookie , room: params.room, error: null};
	let returnObj = {	props: { cookies: returnCookie } };

	if( !cookie?.username ){ 
		returnCookie = {...cookie , room: params.room, error: "You did't fill the username."};
		returnObj = {
			redirect: {
				destination: '/lobby',
				permanent: true,
			},
		};
	}
	const roomExists = await fetch(process.env.NEXT_PUBLIC_SERVER+"/socket/roomExists",{
		method:'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({room: params.room, username: cookie?.username}),
	});
	if(!roomExists.ok){
		returnCookie = {...cookie , room: params.room, error: await roomExists.text() };
		returnObj = {
			redirect: {
				destination: '/lobby',
				permanent: true,
			},
		};
	}
	setCookies('watchflix', JSON.stringify( returnCookie ), { req, res, maxAge: 60 * 60 * 24 });
	return returnObj;
}

Room.getLayout = function getLayout(page) {
    return         <>
        <header id='header'>
            <div className="logo">
                <Link href="/">WatchFlix</Link>
            </div>
        </header>
        {page}
    </>
}
