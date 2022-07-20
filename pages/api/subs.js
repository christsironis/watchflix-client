// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async function handler(req, res) {
    const { id,season,episode,download } = req.query;
    if( download ){
      const file = await DownloadSub( download );
    }
    const data = await GetSubs( id,season,episode );
    res.status(200).send(data);
  }
  
  async function DownloadSub(download){
    const request = await fetch(`https://api.opensubtitles.com/api/v1/download`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Authorization: 'Bearer undefined'},
      body: `{"file_id":${download}}`
    });
    return await request.json();
}
  async function GetSubs(id,season,episode){
    let serie = "";
    if(!isNaN(season) && !isNaN(episode) ) {
      serie = `&season_number=${season}&episode_number=${episode}`;
    }
    const request = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?order_direction=asc&imdb_id=${id}${serie}&order_by=languages`, {
    "headers": {
        "accept": "*/*",
        "accept-language": "en,el;q=0.9",
        "api-key": process.env["api-key"],
    },
        "method": "GET"
    });
    return await request.json();
}