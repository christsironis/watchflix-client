export default function TorrentScript(film){
    let torrentHTML;
    if(film==="movie"){
        torrentHTML= `
        var torrentListBtn = document.querySelector(".torrents #btnShowTorrents");
        var torrentList = document.querySelector(".torrents #TorrentsList");
        var reset = document.querySelector(".torrents #TorrentFilters .btn:not([data-flag])");
        var allTorrents = [...document.querySelectorAll(".torrents .torrent:not(div#TorrentListHeader)")];
        var allBtns = [...document.querySelectorAll(".torrents #TorrentFilters .btn[data-flag]")];
        var filters = [];

        reset.addEventListener("click", ()=>{
            filters = [];
            reset.classList.add("selected");
            allBtns.forEach(item=>{
                item.classList.remove("selected"); 
        });
            allTorrents.forEach(item=>{
                item.classList.remove("hide");
            });
        });
        allBtns.forEach((btn)=>{
            btn.addEventListener("click", ()=>{
                const flag = btn.getAttribute("data-flag");
        
                if(filters.includes("."+flag)){
                   filters.splice(filters.indexOf("."+flag),1);
                }else { 
                    filters.push("."+flag); 
                }
                allTorrents.forEach(item=>{
                    item.classList.add("hide");
                });

                const torrents = [...document.querySelectorAll(".torrents .torrent:not(div#TorrentListHeader)"+filters.join(""))];
                torrents.forEach(torrent =>{
                    torrent.classList.toggle("hide", torrent.classList.contains(filters.join("")));
                });
                btn.classList.toggle("selected"); 
                if(filters.length) reset.classList.remove("selected");
                else reset.classList.add("selected");
            });
        });

        torrentListBtn.setAttribute("onclick","null");
        torrentListBtn.addEventListener("click", ()=>{ torrentList.classList.toggle("show"); });
        reset.click();`
    }else{
        torrentHTML = `
        var seasonListBtn = [...document.querySelectorAll("#TorrentsList .season[data-season]")];
        seasonListBtn.forEach((season)=>{
            const list = season.querySelector(".episodesList");
            const btn = season.querySelector(".seasonTitle");

            btn.addEventListener("click", ()=>{
                list.classList.toggle("show");
                btn.classList.toggle("selected");
            });
            const episodeList = [...season.querySelectorAll(".episode")];

            episodeList.forEach((episode)=>{
                const reset = episode.querySelector(".episodeHeader .btn[data-flag='']");
                const allTorrents = [...episode.querySelectorAll(".torrent:not(div#TorrentListHeader)")];
                let allBtns = [...episode.querySelectorAll(".episodeHeader  .btn:not([data-flag=''])")];
                let filters = [];

                episode.querySelector(".episodeHeader .title").addEventListener("click", ()=>{
                    episode.querySelector(".torrentsList").classList.toggle("show");
                    episode.querySelector(".episodeHeader .title").classList.toggle("selected");
                    episode.querySelectorAll(".torrent:not(div.header)").forEach((torrent)=>{
                        torrent.classList.toggle("show",  episode.querySelector(".torrentsList").classList.contains("show"));
                    });
                });
                reset.addEventListener("click", ()=>{
                    filters = [];
                    reset.classList.add("selected");
                    allBtns.forEach(item=>{
                        item.classList.remove("selected"); 
                });
                    allTorrents.forEach(item=>{
                        item.classList.remove("hide");
                    });
                });
                allBtns.forEach((btn)=>{
                    btn.addEventListener("click", ()=>{
                        const flag = btn.getAttribute("data-flag");
                
                        if(filters.includes("."+flag)){
                        filters.splice(filters.indexOf("."+flag),1);
                        }else { 
                            filters.push("."+flag); 
                        }
                        allTorrents.forEach(item=>{
                            item.classList.add("hide");
                        });
        
                        const torrents = [...episode.querySelectorAll(".torrentsList .torrent:not(div#TorrentListHeader)"+filters.join(""))];
                        console.log(torrents)
                        torrents.forEach(torrent =>{
                            torrent.classList.toggle("hide", torrent.classList.contains(filters.join("")));
                        });
                        btn.classList.toggle("selected"); 
                        if(filters.length) reset.classList.remove("selected");
                        else reset.classList.add("selected");
                    });
                });
            });
        });
`
    }
    return torrentHTML;
}