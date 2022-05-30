import Link from 'next/link';

export default function Item({id,title,film}){
    const imgId = id.toString().replace(/\d+/g, (m)=>{
        return "000000000".substr(m.length) + m;
    });
    return <>
        <div className={"item" }>
            <p className="itemTitle">{title}</p>
            <Link href={`/${film}/${id}`}>
                <div className="itemOverlay">
                    <img className="itemImg" src={`https://media.watchsomuch.to/PosterL/${imgId}_Full.jpg`} alt=""></img>
                    <div className="itemInfo"></div>
                </div>
            </Link>
        </div>
    </>;
}