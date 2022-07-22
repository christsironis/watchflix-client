// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

export let subsToken = null;

export default async function handler(req, res) {
    const { id,season,episode,download } = req.query;

    if( download ){
      const subData = await DownloadSub( download );
      res.status(200).send(subData);
      return;
    }
    const data = await GetSubsData( id,season,episode );
    res.status(200).send(data);
  }
  
  async function DownloadSub(download){
    const request = await fetch(`https://api.opensubtitles.com/api/v1/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env['api-key']
      },
      body: `{"file_id":${download}, "sub_format": "webvtt" }`
    });
    const res = await request.json();
    return {link: res.link, name: res.file_name};
}
  async function GetSubsData(id,season,episode){
    let serie = "";
    if(!isNaN(season) && !isNaN(episode) ) {
      serie = `&season_number=${season}&episode_number=${episode}`;
    }
    const request = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?imdb_id=${id}${serie}&order_by=upload_date`, {
    "headers": {
        "accept": "*/*",
        "accept-language": "en,el;q=0.9",
        "api-key": process.env["api-key"],
    },
        "method": "GET"
    });
    const json = (await request.json()).data;
    let sortedJson = {};
    for(let item of json){
      if( !sortedJson.hasOwnProperty(item.attributes.language) ){
        sortedJson[item.attributes.language] = [];
      }
      item.langName = isoLangs[item.attributes.language];
      sortedJson[item.attributes.language].push(item);
    };
    return sortedJson;
}
  async function LoginOpenSubs(){
    const res = await fetch('https://api.opensubtitles.com/api/v1/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': process.env['api-key'],
      },
      body: `{"username":"${process.env['subsUser']}","password":"${process.env['subsPass']}"}`
    });
    const json = await res.json();
    return json.token;
  }

  const isoLangs = {
    "ab":"Abkhaz",
    "aa":"Afar",
    "af":"Afrikaans",
    "ak":"Akan",
    "sq":"Albanian",
    "am":"Amharic",
    "ar":"Arabic",
    "an":"Aragonese",
    "hy":"Armenian",
    "as":"Assamese",
    "av":"Avaric",
    "ae":"Avestan",
    "ay":"Aymara",
    "az":"Azerbaijani",
    "bm":"Bambara",
    "ba":"Bashkir",
    "eu":"Basque",
    "be":"Belarusian",
    "bn":"Bengali",
    "bh":"Bihari",
    "bi":"Bislama",
    "bs":"Bosnian",
    "br":"Breton",
    "bg":"Bulgarian",
    "my":"Burmese",
    "ca":"Catalan",
    "ch":"Chamorro",
    "ce":"Chechen",
    "ny":"Chichewa",
    "zh":"Chinese",
    "cv":"Chuvash",
    "kw":"Cornish",
    "co":"Corsican",
    "cr":"Cree",
    "hr":"Croatian",
    "cs":"Czech",
    "da":"Danish",
    "dv":"Dhivehi",
    "nl":"Dutch",
    "en":"English",
    "eo":"Esperanto",
    "et":"Estonian",
    "ee":"Ewe",
    "fo":"Faroese",
    "fj":"Fijian",
    "fi":"Finnish",
    "fr":"French",
    "ff":"Fulah",
    "gl":"Galician",
    "ka":"Georgian",
    "de":"German",
    "el":"Greek",
    "gn":"Guaraní",
    "gu":"Gujarati",
    "ht":"Haitian",
    "ha":"Hausa",
    "he":"Hebrew",
    "hz":"Herero",
    "hi":"Hindi",
    "ho":"Hiri Motu",
    "hu":"Hungarian",
    "ia":"Interlingua",
    "id":"Indonesian",
    "ie":"Interlingue",
    "ga":"Irish",
    "ig":"Igbo",
    "ik":"Inupiaq",
    "io":"Ido",
    "is":"Icelandic",
    "it":"Italian",
    "iu":"Inuktitut",
    "ja":"Japanese",
    "jv":"Javanese",
    "kl":"Kalaallisut",
    "kn":"Kannada",
    "kr":"Kanuri",
    "ks":"Kashmiri",
    "kk":"Kazakh",
    "km":"Khmer",
    "ki":"Kikuyu",
    "rw":"Kinyarwanda",
    "ky":"Kirghiz",
    "kv":"Komi",
    "kg":"Kongo",
    "ko":"Korean",
    "ku":"Kurdish",
    "kj":"Kwanyama",
    "la":"Latin",
    "lb":"Luxembourgish",
    "lg":"Luganda",
    "li":"Limburgish",
    "ln":"Lingala",
    "lo":"Lao",
    "lt":"Lithuanian",
    "lu":"Luba-Katanga",
    "lv":"Latvian",
    "gv":"Manx",
    "mk":"Macedonian",
    "mg":"Malagasy",
    "ms":"Malay",
    "ml":"Malayalam",
    "mt":"Maltese",
    "mi":"Māori",
    "mr":"Marathi",
    "mh":"Marshallese",
    "mn":"Mongolian",
    "na":"Nauru",
    "nv":"Navajo",
    "nb":"Norwegian Bokmål",
    "nd":"North Ndebele",
    "ne":"Nepali",
    "ng":"Ndonga",
    "nn":"Norwegian Nynorsk",
    "no":"Norwegian",
    "ii":"Nuosu",
    "nr":"South Ndebele",
    "oc":"Occitan",
    "oj":"Ojibwe",
    "cu":"Church Slavic",
    "om":"Oromo",
    "or":"Oriya",
    "os":"Ossetian",
    "pa":"Punjabi",
    "pi":"Pāli",
    "fa":"Persian",
    "pl":"Polish",
    "ps":"Pashto",
    "pt":"Portuguese",
    "qu":"Quechua",
    "rm":"Romansh",
    "rn":"Kirundi",
    "ro":"Romanian",
    "ru":"Russian",
    "sa":"Sanskrit",
    "sc":"Sardinian",
    "sd":"Sindhi",
    "se":"Northern Sami",
    "sm":"Samoan",
    "sg":"Sango",
    "sr":"Serbian",
    "gd":"Gaelic",
    "sn":"Shona",
    "si":"Sinhala",
    "sk":"Slovak",
    "sl":"Slovene",
    "so":"Somali",
    "st":"Southern Sotho",
    "es":"Spanish",
    "su":"Sundanese",
    "sw":"Swahili",
    "ss":"Swati",
    "sv":"Swedish",
    "ta":"Tamil",
    "te":"Telugu",
    "tg":"Tajik",
    "th":"Thai",
    "ti":"Tigrinya",
    "bo":"Tibetan",
    "tk":"Turkmen",
    "tl":"Tagalog",
    "tn":"Tswana",
    "to":"Tonga",
    "tr":"Turkish",
    "ts":"Tsonga",
    "tt":"Tatar",
    "tw":"Twi",
    "ty":"Tahitian",
    "ug":"Uighur",
    "uk":"Ukrainian",
    "ur":"Urdu",
    "uz":"Uzbek",
    "ve":"Venda",
    "vi":"Vietnamese",
    "vo":"Volapük",
    "wa":"Walloon",
    "cy":"Welsh",
    "wo":"Wolof",
    "fy":"Western Frisian",
    "xh":"Xhosa",
    "yi":"Yiddish",
    "yo":"Yoruba",
    "za":"Zhuang, Chuang"
}