import Link from 'next/link';
import Router from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import TorrentScript from '../../components/torrentsScript';
// import WebTorrent from 'webtorrent-hybrid';

export default function Entry({data,torrentHTML,id,film}){
    useEffect(()=>{
        if(document.querySelector("script.custom")) {
            document.querySelector("script.custom").remove(); 
            // return;
        } 
        // console.log();
        const script = document.createElement("script");
        script.classList.add("custom");
        script.innerHTML = TorrentScript(film);
        document.body.appendChild(script);
        // open popup for each torrent
        document.querySelectorAll(".torrents .torrent:not(.header)").forEach((torrent)=>{
            torrent.addEventListener("click",async ()=>{ 
                document.querySelector(".popup .name").innerHTML = torrent.getAttribute("data-title");
                document.querySelector(".popup input").value = await GetMagnet( id, torrent.getAttribute("data-torrent") );
                document.querySelector(".popup").classList.add("openPopup");
            });
        });
        // popup
        const popup = document.querySelector("#closeIcon");
        popup.addEventListener("click",ClosePopup);
        const copy = document.querySelector("#copy");
        copy.addEventListener("click",CopyFun);
        const download = document.querySelector(".popup .buttons #download");
        download.addEventListener("click",DownloadFun);
        const watch = document.querySelector(".popup .buttons #watch");
        watch.addEventListener("click", WatchFun);
        return ()=>{
            popup.removeEventListener("click",ClosePopup);
            copy.removeEventListener("click",CopyFun);
            download.removeEventListener("click",DownloadFun);
            watch.removeEventListener("click", WatchFun);
        }
    });
    async function WatchFun(){
        const seasonRegex = new RegExp(/(?<=s)\d\d/i);
        const episRegex = new RegExp(/(?<=e)\d\d/i);
        let season = null;
        let episode = null;
        if( film === "serie"){
            const title = document.querySelector(".popup .name").innerHTML;
            season = parseInt(seasonRegex.exec(title)[0]);
            episode = parseInt(episRegex.exec(title)[0]);
        }
        const title = document.querySelector(".wrapper .title h2").innerHTML;
        const url = document.querySelector(".popup .input #link").value;
        const regex = new RegExp(/(?<=:btih:)[^&"]+/i);
        const oldStorage = await JSON.parse(localStorage.getItem("watchflix"));
        localStorage.setItem("watchflix", JSON.stringify({...oldStorage, title: title, magnet: url, hash: regex.exec(url)[0], imdbID: id, type: film, season: season, episode: episode }));
        Router.push("/lobby");
    }

    return (
        <>
        <div className="SectionTitle"></div>
        <div className="popup">
        <svg id="closeIcon" viewBox="0 0 512 512">
            <path d="M289.94,256l95-95A24,24,0,0,0,351,127l-95,95-95-95A24,24,0,0,0,127,161l95,95-95,95A24,24,0,1,0,161,385l95-95,95,95A24,24,0,0,0,385,351Z"/>
        </svg>
            <div className="name">
            </div>
            <div className="input">
                <svg id="copy" viewBox="0 0 64 64" enableBackground="new 0 0 64 64">
                    <g id="Text-files">
                        <path d="M53.9791489,9.1429005H50.010849c-0.0826988,0-0.1562004,0.0283995-0.2331009,0.0469999V5.0228   C49.7777481,2.253,47.4731483,0,44.6398468,0h-34.422596C7.3839517,0,5.0793519,2.253,5.0793519,5.0228v46.8432999   c0,2.7697983,2.3045998,5.0228004,5.1378999,5.0228004h6.0367002v2.2678986C16.253952,61.8274002,18.4702511,64,21.1954517,64   h32.783699c2.7252007,0,4.9414978-2.1725998,4.9414978-4.8432007V13.9861002   C58.9206467,11.3155003,56.7043495,9.1429005,53.9791489,9.1429005z M7.1110516,51.8661003V5.0228   c0-1.6487999,1.3938999-2.9909999,3.1062002-2.9909999h34.422596c1.7123032,0,3.1062012,1.3422,3.1062012,2.9909999v46.8432999   c0,1.6487999-1.393898,2.9911003-3.1062012,2.9911003h-34.422596C8.5049515,54.8572006,7.1110516,53.5149002,7.1110516,51.8661003z    M56.8888474,59.1567993c0,1.550602-1.3055,2.8115005-2.9096985,2.8115005h-32.783699   c-1.6042004,0-2.9097996-1.2608986-2.9097996-2.8115005v-2.2678986h26.3541946   c2.8333015,0,5.1379013-2.2530022,5.1379013-5.0228004V11.1275997c0.0769005,0.0186005,0.1504021,0.0469999,0.2331009,0.0469999   h3.9682999c1.6041985,0,2.9096985,1.2609005,2.9096985,2.8115005V59.1567993z"/>
                        <path d="M38.6031494,13.2063999H16.253952c-0.5615005,0-1.0159006,0.4542999-1.0159006,1.0158005   c0,0.5615997,0.4544001,1.0158997,1.0159006,1.0158997h22.3491974c0.5615005,0,1.0158997-0.4542999,1.0158997-1.0158997   C39.6190491,13.6606998,39.16465,13.2063999,38.6031494,13.2063999z"/>
                        <path d="M38.6031494,21.3334007H16.253952c-0.5615005,0-1.0159006,0.4542999-1.0159006,1.0157986   c0,0.5615005,0.4544001,1.0159016,1.0159006,1.0159016h22.3491974c0.5615005,0,1.0158997-0.454401,1.0158997-1.0159016   C39.6190491,21.7877007,39.16465,21.3334007,38.6031494,21.3334007z"/>
                        <path d="M38.6031494,29.4603004H16.253952c-0.5615005,0-1.0159006,0.4543991-1.0159006,1.0158997   s0.4544001,1.0158997,1.0159006,1.0158997h22.3491974c0.5615005,0,1.0158997-0.4543991,1.0158997-1.0158997   S39.16465,29.4603004,38.6031494,29.4603004z"/>
                        <path d="M28.4444485,37.5872993H16.253952c-0.5615005,0-1.0159006,0.4543991-1.0159006,1.0158997   s0.4544001,1.0158997,1.0159006,1.0158997h12.1904964c0.5615025,0,1.0158005-0.4543991,1.0158005-1.0158997   S29.0059509,37.5872993,28.4444485,37.5872993z"/>
                    </g>
                </svg>
                <input type="text" id="link" readOnly/>
            </div>
            <div className="buttons">
                <button id='download'>Download</button>
                <button id='watch'>Watch</button>
            </div>
        </div>
        <div className="wrapper">
            <div className="title">
                <h2 >{data.Title}</h2>
            </div>
            <div className="img">
                <img  src={`https://media.watchsomuch.to/PosterL/${ GetImg(id) }_Full.jpg`} alt="" />
            </div>
            <div className="info">
                <div className="details">
                    <span className="released">Released: {data.Released}</span>
                    <span className="duration">Duration: {data.Runtime}</span>
                    <span className="genre">Genre: {data.Genre}</span>
                    <span className="lang">Language: {data.Language}</span>
                    <span className="cast">Cast: {data.Actors}</span>
                    <a href={`https://www.imdb.com/title/tt${id}`} className="rating" target={"_blank"} rel="noreferrer">
                        <svg id="imdb" viewBox="0 0 64 32"><g fill="#F5C518"><rect x="0" y="0" width="100%" height="100%" rx="4"></rect></g><g transform="translate(8.000000, 7.000000)" fill="#000000" fillRule="nonzero"><polygon points="0 18 5 18 5 0 0 0"></polygon><path d="M15.6725178,0 L14.5534833,8.40846934 L13.8582008,3.83502426 C13.65661,2.37009263 13.4632474,1.09175121 13.278113,0 L7,0 L7,18 L11.2416347,18 L11.2580911,6.11380679 L13.0436094,18 L16.0633571,18 L17.7583653,5.8517865 L17.7707076,18 L22,18 L22,0 L15.6725178,0 Z"></path><path d="M24,18 L24,0 L31.8045586,0 C33.5693522,0 35,1.41994415 35,3.17660424 L35,14.8233958 C35,16.5777858 33.5716617,18 31.8045586,18 L24,18 Z M29.8322479,3.2395236 C29.6339219,3.13233348 29.2545158,3.08072342 28.7026524,3.08072342 L28.7026524,14.8914865 C29.4312846,14.8914865 29.8796736,14.7604764 30.0478195,14.4865461 C30.2159654,14.2165858 30.3021941,13.486105 30.3021941,12.2871637 L30.3021941,5.3078959 C30.3021941,4.49404499 30.272014,3.97397442 30.2159654,3.74371416 C30.1599168,3.5134539 30.0348852,3.34671372 29.8322479,3.2395236 Z"></path><path d="M44.4299079,4.50685823 L44.749518,4.50685823 C46.5447098,4.50685823 48,5.91267586 48,7.64486762 L48,14.8619906 C48,16.5950653 46.5451816,18 44.749518,18 L44.4299079,18 C43.3314617,18 42.3602746,17.4736618 41.7718697,16.6682739 L41.4838962,17.7687785 L37,17.7687785 L37,0 L41.7843263,0 L41.7843263,5.78053556 C42.4024982,5.01015739 43.3551514,4.50685823 44.4299079,4.50685823 Z M43.4055679,13.2842155 L43.4055679,9.01907814 C43.4055679,8.31433946 43.3603268,7.85185468 43.2660746,7.63896485 C43.1718224,7.42607505 42.7955881,7.2893916 42.5316822,7.2893916 C42.267776,7.2893916 41.8607934,7.40047379 41.7816216,7.58767002 L41.7816216,9.01907814 L41.7816216,13.4207851 L41.7816216,14.8074788 C41.8721037,15.0130276 42.2602358,15.1274059 42.5316822,15.1274059 C42.8031285,15.1274059 43.1982131,15.0166981 43.281155,14.8074788 C43.3640968,14.5982595 43.4055679,14.0880581 43.4055679,13.2842155 Z"></path></g></svg>
                        <svg data-rating={data.imdbRating || ""} focusable="false">
                            { GetStars(data.imdbRating).map((star,index)=> <use key={index} xlinkHref={star}></use> )}
                        </svg>
                    </a>
                </div>
                <div className="desc">
                    {data.Plot}
                </div>
            </div>
            <div className="torrents" dangerouslySetInnerHTML={{ __html:torrentHTML}}>
            </div>
        </div>
        <svg id="stars" style={{display: "none"}} version="1.1">
            <symbol id="stars-empty-star" viewBox="0 0 102 18" fill="#F1E8CA">
                <path
                d="M9.5 14.25l-5.584 2.936 1.066-6.218L.465 6.564l6.243-.907L9.5 0l2.792 5.657 6.243.907-4.517 4.404 1.066 6.218"
                />
            </symbol>
            <symbol id="stars-full-star" viewBox="0 0 102 18" fill="#D3A81E">
                <path
                d="M9.5 14.25l-5.584 2.936 1.066-6.218L.465 6.564l6.243-.907L9.5 0l2.792 5.657 6.243.907-4.517 4.404 1.066 6.218"
                />
            </symbol>
            <symbol id="stars-half-star" viewBox="0 0 102 18" fill="#D3A81E">
                <use href="#stars-empty-star" />
                <path
                d="M9.5 14.25l-5.584 2.936 1.066-6.218L.465 6.564l6.243-.907L9.5 0l2.792 907z"
                />
            </symbol>
        </svg>
        </>
    );
}

export async function getServerSideProps(context) {
    const { film, entry } = context.params;
    const res = await Promise.all( [fetch(`https://watchsomuch.to/Movies/aj${film === "movie"? "Movie":"Tv"}Torrents.aspx?mid=${entry}`), fetch(`http://omdbapi.com/?apikey=81c50141&plot=full&i=tt${entry}`)]);
    const json = await Promise.all( [res[0].text(), res[1].json()] );
	const regexMainDiv = new RegExp(/<div[.\S\W]+(?=<script>)/i);
    const regexHref = new RegExp(/href="[^"]+"/ig);
    const regexClick = new RegExp(/onclick="[^"]+"/ig);
	const regexTagA = new RegExp(/(?<=<)a|(?<=<\/)a(?=>)/ig);
	json[0] = regexMainDiv.exec(json[0])[0].replace(regexHref,"").replace(regexTagA,"div").replace(regexClick,"");
    return {
        props: {
            torrentHTML: json[0],
            data: json[1],
            id: entry,
            film: film
        },
    }
  }

function DownloadFun(){

}

function ClosePopup(){
    document.querySelector(".popup").classList.remove("openPopup");
}
function CopyFun(){
    const input = document.querySelector(".popup .input input");
    /* Select the text field */
    input.select();
    input.setSelectionRange(0, 99999); /* For mobile devices */
    /* Copy the text inside the text field */
    navigator.clipboard.writeText(input.value);
}
  async function GetMagnet(movie,torrent){
    const res = await fetch(`/api/magnet?movie=${movie}&key=${torrent}`);
    const text = await res.text();
    return text;
  }

  function GetStars(rating){
    let stars = rating / 2;
    const starsID = [];
    for(let x=0; x<5; x++){
        if(stars > 1){
            starsID.push("#stars-full-star");
        }else if( stars > 0.5){
            starsID.push("#stars-half-star");
        }else{
            starsID.push("#stars-empty-star");
        }
        stars--;
    }
    return starsID;
}
function GetImg(id){
    return id.toString().replace(/\d+/g, (m)=>{
        return "000000000".substr(m.length) + m;
    });
}