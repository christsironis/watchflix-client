// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default async function handler(req, res) {
  const { movie, key } = req.query;
  const url = await GetMagnet( movie, key );
  res.status(200).send(url);
}

async function GetMagnet(movie,torrent){
  const res = await fetch(`https://watchsomuch.to/Movies/ajTorrentDetails.aspx?movie=${movie}&key=${torrent}`);
  const text = await res.text();
  // console.log(res)
  const regex = new RegExp(/magnet:\?xt=urn.+(?=")/i);
  return regex.exec(text)[0];
}