import React, { useEffect, useRef, useState } from 'react';
import TorrentScript from '../../components/torrentsScript';
// import WebTorrent from 'webtorrent-hybrid';

export default function Entry({data,torrentHTML,id,film}){
    useEffect(()=>{
        if(document.querySelector("script.custom")) {
            document.querySelector("script.custom").remove(); 
            return;
        }
        const script = document.createElement("script");
        script.classList.add("custom");
        script.innerHTML = TorrentScript(film);
        document.body.appendChild(script);
    });
    
    return (
        <>
        <div className="SectionTitle"></div>
        <div className="popup">
            <div className="info">
                <span className='det'>Seeds: </span><span id='seeds'></span>
                <span className='det'>Peers: </span><span id='peers'></span>
            </div>
            <input type="text" id="link" readOnly/>
            <div className="buttons">
                <button>Download</button>
                <button>Watch</button>
            </div>
        </div>
        <div className="wrapper">
            <div className="title">
                <h2 >{data.Title}</h2>
                {/* {data[2] && <span className="aka">-Also known as: "{data[2]}"</span>} */}
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
                        <svg data-rating={data.imdbRating} focusable="false">
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
async function GetMagnet(movie,torrent){
    const res = await fetch(`https://watchsomuch.to/Movies/ajTorrentDetails.aspx?movie=${movie}&key=${torrent}`);
    const text = await res.text();
    const regex = new RegExp(/magnet:\?xt=urn.+(?=")/i);
    return regex.exec(text)[0];
}

export async function getServerSideProps(context) {
    const { film, entry } = context.params;
    const res = await Promise.all( [fetch(`https://watchsomuch.to/Movies/aj${film === "movie"? "Movie":"Tv"}Torrents.aspx?mid=${entry}`), fetch(`http://omdbapi.com/?apikey=81c50141&plot=full&i=tt${entry}`), GetMagnet("019265480","2269854" )]);
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