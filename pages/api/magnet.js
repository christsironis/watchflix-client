// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export default function handler(req, res) {
  req
  res.status(200).json({ name: 'John Doe' })
}

async function GetMagnet(movie,torrent){
  const res = await fetch(`https://watchsomuch.to/Movies/ajTorrentDetails.aspx?movie=${movie}&key=${torrent}`);
  const text = await res.text();
  const regex = new RegExp(/magnet:\?xt=urn.+(?=")/i);
  return regex.exec(text)[0];
}