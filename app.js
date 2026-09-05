(() => {
'use strict';
const EMBEDDED_SCHOOLS=[{"id":1,"name":"Chicago Metropolitan","conference":"Great Lakes","prestige":92,"resources":93,"development":81,"nil":86,"academics":81,"fan_support":92,"facilities":94,"admin_patience":25,"program_ceiling":100,"city":"Chicago","state":"IL","lat":41.8781,"lon":-87.6298},{"id":2,"name":"Great Lakes University","conference":"Great Lakes","prestige":60,"resources":62,"development":58,"nil":59,"academics":63,"fan_support":68,"facilities":60,"admin_patience":78,"program_ceiling":67,"city":"Evanston","state":"IL","lat":42.0451,"lon":-87.6877},{"id":3,"name":"Wisconsin Commonwealth","conference":"Great Lakes","prestige":89,"resources":88,"development":84,"nil":98,"academics":61,"fan_support":83,"facilities":85,"admin_patience":61,"program_ceiling":100,"city":"Madison","state":"WI","lat":43.0731,"lon":-89.4012},{"id":4,"name":"Milwaukee State","conference":"Great Lakes","prestige":59,"resources":70,"development":55,"nil":70,"academics":60,"fan_support":67,"facilities":62,"admin_patience":66,"program_ceiling":74,"city":"Milwaukee","state":"WI","lat":43.0389,"lon":-87.9065},{"id":5,"name":"Michigan Commonwealth","conference":"Great Lakes","prestige":94,"resources":97,"development":82,"nil":94,"academics":66,"fan_support":75,"facilities":99,"admin_patience":50,"program_ceiling":100,"city":"Lansing","state":"MI","lat":42.7325,"lon":-84.5555},{"id":6,"name":"Detroit Metropolitan","conference":"Great Lakes","prestige":75,"resources":93,"development":47,"nil":90,"academics":37,"fan_support":76,"facilities":85,"admin_patience":42,"program_ceiling":90,"city":"Detroit","state":"MI","lat":42.3314,"lon":-83.0458},{"id":7,"name":"Lake Erie University","conference":"Great Lakes","prestige":62,"resources":63,"development":67,"nil":66,"academics":70,"fan_support":63,"facilities":62,"admin_patience":87,"program_ceiling":71,"city":"Cleveland","state":"OH","lat":41.4993,"lon":-81.6944},{"id":8,"name":"Ohio Western","conference":"Great Lakes","prestige":49,"resources":62,"development":40,"nil":62,"academics":58,"fan_support":82,"facilities":54,"admin_patience":63,"program_ceiling":54,"city":"Toledo","state":"OH","lat":41.6528,"lon":-83.5379},{"id":9,"name":"Indiana Commonwealth","conference":"Great Lakes","prestige":65,"resources":57,"development":53,"nil":50,"academics":78,"fan_support":67,"facilities":57,"admin_patience":58,"program_ceiling":70,"city":"Indianapolis","state":"IN","lat":39.7684,"lon":-86.1581},{"id":10,"name":"Fort Wayne State","conference":"Great Lakes","prestige":59,"resources":40,"development":62,"nil":47,"academics":66,"fan_support":47,"facilities":47,"admin_patience":65,"program_ceiling":66,"city":"Fort Wayne","state":"IN","lat":41.0793,"lon":-85.1394},{"id":11,"name":"Twin Cities University","conference":"Great Lakes","prestige":84,"resources":84,"development":65,"nil":79,"academics":76,"fan_support":73,"facilities":79,"admin_patience":63,"program_ceiling":97,"city":"Minneapolis","state":"MN","lat":44.9778,"lon":-93.265},{"id":12,"name":"Iowa Lakes University","conference":"Great Lakes","prestige":41,"resources":38,"development":58,"nil":29,"academics":72,"fan_support":39,"facilities":35,"admin_patience":81,"program_ceiling":51,"city":"Cedar Rapids","state":"IA","lat":41.9779,"lon":-91.6656},{"id":13,"name":"New England Commonwealth","conference":"Northeast","prestige":82,"resources":85,"development":57,"nil":99,"academics":42,"fan_support":72,"facilities":77,"admin_patience":46,"program_ceiling":91,"city":"Boston","state":"MA","lat":42.3601,"lon":-71.0589},{"id":14,"name":"Massachusetts Bay University","conference":"Northeast","prestige":58,"resources":58,"development":49,"nil":63,"academics":79,"fan_support":48,"facilities":46,"admin_patience":68,"program_ceiling":66,"city":"Worcester","state":"MA","lat":42.2626,"lon":-71.8023},{"id":15,"name":"Hudson University","conference":"Northeast","prestige":47,"resources":45,"development":43,"nil":38,"academics":60,"fan_support":38,"facilities":44,"admin_patience":65,"program_ceiling":59,"city":"Albany","state":"NY","lat":42.6526,"lon":-73.7562},{"id":16,"name":"New York Metropolitan","conference":"Northeast","prestige":80,"resources":75,"development":72,"nil":76,"academics":81,"fan_support":78,"facilities":76,"admin_patience":66,"program_ceiling":90,"city":"New York","state":"NY","lat":40.7128,"lon":-74.006},{"id":17,"name":"Long Island State","conference":"Northeast","prestige":58,"resources":53,"development":59,"nil":40,"academics":64,"fan_support":72,"facilities":61,"admin_patience":48,"program_ceiling":74,"city":"Hempstead","state":"NY","lat":40.7062,"lon":-73.6187},{"id":18,"name":"Connecticut Commonwealth","conference":"Northeast","prestige":47,"resources":48,"development":37,"nil":48,"academics":77,"fan_support":44,"facilities":49,"admin_patience":43,"program_ceiling":56,"city":"Hartford","state":"CT","lat":41.7658,"lon":-72.6734},{"id":19,"name":"Rhode Island Maritime","conference":"Northeast","prestige":57,"resources":55,"development":62,"nil":51,"academics":97,"fan_support":61,"facilities":58,"admin_patience":44,"program_ceiling":74,"city":"Providence","state":"RI","lat":41.824,"lon":-71.4128},{"id":20,"name":"Vermont State","conference":"Northeast","prestige":28,"resources":27,"development":57,"nil":29,"academics":77,"fan_support":36,"facilities":35,"admin_patience":70,"program_ceiling":38,"city":"Burlington","state":"VT","lat":44.4759,"lon":-73.2121},{"id":21,"name":"New Hampshire Tech","conference":"Northeast","prestige":60,"resources":58,"development":48,"nil":30,"academics":73,"fan_support":64,"facilities":63,"admin_patience":43,"program_ceiling":69,"city":"Manchester","state":"NH","lat":42.9956,"lon":-71.4548},{"id":22,"name":"Maine Commonwealth","conference":"Northeast","prestige":47,"resources":40,"development":52,"nil":29,"academics":72,"fan_support":50,"facilities":39,"admin_patience":74,"program_ceiling":55,"city":"Portland","state":"ME","lat":43.6591,"lon":-70.2568},{"id":23,"name":"Delaware Valley University","conference":"Northeast","prestige":41,"resources":33,"development":44,"nil":35,"academics":56,"fan_support":53,"facilities":28,"admin_patience":75,"program_ceiling":54,"city":"Wilmington","state":"DE","lat":39.7391,"lon":-75.5398},{"id":24,"name":"Jersey Coastal University","conference":"Northeast","prestige":32,"resources":36,"development":65,"nil":29,"academics":57,"fan_support":28,"facilities":34,"admin_patience":68,"program_ceiling":79,"city":"Newark","state":"NJ","lat":40.7357,"lon":-74.1724},{"id":25,"name":"Chesapeake University","conference":"Atlantic","prestige":82,"resources":96,"development":53,"nil":89,"academics":69,"fan_support":99,"facilities":84,"admin_patience":50,"program_ceiling":90,"city":"Baltimore","state":"MD","lat":39.2904,"lon":-76.6122},{"id":26,"name":"Potomac Commonwealth","conference":"Atlantic","prestige":53,"resources":46,"development":46,"nil":67,"academics":78,"fan_support":50,"facilities":47,"admin_patience":67,"program_ceiling":63,"city":"Washington","state":"DC","lat":38.9072,"lon":-77.0369},{"id":27,"name":"Virginia Commonwealth Tech","conference":"Atlantic","prestige":84,"resources":93,"development":72,"nil":99,"academics":59,"fan_support":75,"facilities":85,"admin_patience":53,"program_ceiling":100,"city":"Richmond","state":"VA","lat":37.5407,"lon":-77.436},{"id":28,"name":"Tidewater State","conference":"Atlantic","prestige":62,"resources":72,"development":57,"nil":62,"academics":85,"fan_support":58,"facilities":71,"admin_patience":61,"program_ceiling":75,"city":"Norfolk","state":"VA","lat":36.8508,"lon":-76.2859},{"id":29,"name":"Blue Ridge University","conference":"Atlantic","prestige":49,"resources":55,"development":83,"nil":50,"academics":62,"fan_support":62,"facilities":56,"admin_patience":56,"program_ceiling":63,"city":"Roanoke","state":"VA","lat":37.2709,"lon":-79.9414},{"id":30,"name":"Carolina Commonwealth","conference":"Atlantic","prestige":88,"resources":88,"development":64,"nil":99,"academics":69,"fan_support":98,"facilities":93,"admin_patience":57,"program_ceiling":100,"city":"Charlotte","state":"NC","lat":35.2271,"lon":-80.8431},{"id":31,"name":"Piedmont University","conference":"Atlantic","prestige":69,"resources":67,"development":55,"nil":64,"academics":95,"fan_support":73,"facilities":72,"admin_patience":56,"program_ceiling":81,"city":"Raleigh","state":"NC","lat":35.7796,"lon":-78.6382},{"id":32,"name":"Cape Fear State","conference":"Atlantic","prestige":67,"resources":53,"development":68,"nil":47,"academics":66,"fan_support":69,"facilities":56,"admin_patience":78,"program_ceiling":76,"city":"Wilmington","state":"NC","lat":34.2257,"lon":-77.9447},{"id":33,"name":"Palmetto University","conference":"Atlantic","prestige":70,"resources":67,"development":68,"nil":65,"academics":81,"fan_support":62,"facilities":65,"admin_patience":52,"program_ceiling":86,"city":"Columbia","state":"SC","lat":34.0007,"lon":-81.0348},{"id":34,"name":"Charleston Maritime","conference":"Atlantic","prestige":60,"resources":68,"development":73,"nil":56,"academics":70,"fan_support":49,"facilities":60,"admin_patience":52,"program_ceiling":77,"city":"Charleston","state":"SC","lat":32.7765,"lon":-79.9311},{"id":35,"name":"Appalachian Commonwealth","conference":"Atlantic","prestige":48,"resources":49,"development":63,"nil":45,"academics":58,"fan_support":44,"facilities":47,"admin_patience":78,"program_ceiling":54,"city":"Asheville","state":"NC","lat":35.5951,"lon":-82.5515},{"id":36,"name":"Shenandoah University","conference":"Atlantic","prestige":71,"resources":72,"development":53,"nil":75,"academics":67,"fan_support":81,"facilities":62,"admin_patience":85,"program_ceiling":78,"city":"Charlottesville","state":"VA","lat":38.0293,"lon":-78.4767},{"id":37,"name":"Georgia Commonwealth","conference":"Southeastern","prestige":96,"resources":99,"development":73,"nil":99,"academics":83,"fan_support":99,"facilities":98,"admin_patience":51,"program_ceiling":100,"city":"Atlanta","state":"GA","lat":33.749,"lon":-84.388},{"id":38,"name":"Georgia Coastal","conference":"Southeastern","prestige":84,"resources":85,"development":63,"nil":84,"academics":74,"fan_support":95,"facilities":86,"admin_patience":38,"program_ceiling":95,"city":"Savannah","state":"GA","lat":32.0809,"lon":-81.0912},{"id":39,"name":"Florida Commonwealth","conference":"Southeastern","prestige":92,"resources":94,"development":90,"nil":84,"academics":72,"fan_support":91,"facilities":92,"admin_patience":54,"program_ceiling":97,"city":"Orlando","state":"FL","lat":28.5383,"lon":-81.3792},{"id":40,"name":"South Florida Metropolitan","conference":"Southeastern","prestige":52,"resources":51,"development":48,"nil":48,"academics":59,"fan_support":40,"facilities":55,"admin_patience":71,"program_ceiling":90,"city":"Miami","state":"FL","lat":25.7617,"lon":-80.1918},{"id":41,"name":"Florida Gulf University","conference":"Southeastern","prestige":69,"resources":73,"development":59,"nil":91,"academics":44,"fan_support":71,"facilities":75,"admin_patience":53,"program_ceiling":78,"city":"Tampa","state":"FL","lat":27.9506,"lon":-82.4572},{"id":42,"name":"Alabama Commonwealth","conference":"Southeastern","prestige":97,"resources":91,"development":86,"nil":88,"academics":61,"fan_support":85,"facilities":99,"admin_patience":16,"program_ceiling":100,"city":"Birmingham","state":"AL","lat":33.5186,"lon":-86.8104},{"id":43,"name":"Mobile State","conference":"Southeastern","prestige":40,"resources":35,"development":42,"nil":33,"academics":62,"fan_support":34,"facilities":29,"admin_patience":68,"program_ceiling":56,"city":"Mobile","state":"AL","lat":30.6954,"lon":-88.0399},{"id":44,"name":"Tennessee Commonwealth","conference":"Southeastern","prestige":85,"resources":78,"development":74,"nil":84,"academics":75,"fan_support":66,"facilities":88,"admin_patience":30,"program_ceiling":100,"city":"Nashville","state":"TN","lat":36.1627,"lon":-86.7816},{"id":45,"name":"Knoxville Tech","conference":"Southeastern","prestige":48,"resources":45,"development":54,"nil":50,"academics":72,"fan_support":53,"facilities":44,"admin_patience":65,"program_ceiling":65,"city":"Knoxville","state":"TN","lat":35.9606,"lon":-83.9207},{"id":46,"name":"Mississippi Commonwealth","conference":"Southeastern","prestige":54,"resources":53,"development":64,"nil":63,"academics":77,"fan_support":59,"facilities":65,"admin_patience":41,"program_ceiling":66,"city":"Jackson","state":"MS","lat":32.2988,"lon":-90.1848},{"id":47,"name":"Magnolia State","conference":"Southeastern","prestige":52,"resources":54,"development":71,"nil":34,"academics":82,"fan_support":63,"facilities":53,"admin_patience":67,"program_ceiling":60,"city":"Hattiesburg","state":"MS","lat":31.3271,"lon":-89.2903},{"id":48,"name":"Kentucky Commonwealth","conference":"Southeastern","prestige":65,"resources":76,"development":65,"nil":75,"academics":79,"fan_support":43,"facilities":73,"admin_patience":50,"program_ceiling":80,"city":"Lexington","state":"KY","lat":38.0406,"lon":-84.5037},{"id":49,"name":"Louisiana Commonwealth","conference":"Gulf","prestige":91,"resources":99,"development":66,"nil":96,"academics":79,"fan_support":96,"facilities":92,"admin_patience":61,"program_ceiling":100,"city":"Baton Rouge","state":"LA","lat":30.4515,"lon":-91.1871},{"id":50,"name":"New Orleans University","conference":"Gulf","prestige":83,"resources":64,"development":57,"nil":66,"academics":67,"fan_support":80,"facilities":73,"admin_patience":40,"program_ceiling":93,"city":"New Orleans","state":"LA","lat":29.9511,"lon":-90.0715},{"id":51,"name":"Acadiana State","conference":"Gulf","prestige":66,"resources":57,"development":44,"nil":50,"academics":72,"fan_support":81,"facilities":68,"admin_patience":78,"program_ceiling":72,"city":"Lafayette","state":"LA","lat":30.2241,"lon":-92.0198},{"id":52,"name":"Gulf Coast Tech","conference":"Gulf","prestige":67,"resources":78,"development":83,"nil":77,"academics":57,"fan_support":77,"facilities":67,"admin_patience":31,"program_ceiling":79,"city":"Biloxi","state":"MS","lat":30.396,"lon":-88.8853},{"id":53,"name":"Houston Metropolitan","conference":"Gulf","prestige":84,"resources":94,"development":59,"nil":84,"academics":77,"fan_support":86,"facilities":99,"admin_patience":53,"program_ceiling":99,"city":"Houston","state":"TX","lat":29.7604,"lon":-95.3698},{"id":54,"name":"East Texas University","conference":"Gulf","prestige":67,"resources":54,"development":57,"nil":53,"academics":64,"fan_support":56,"facilities":68,"admin_patience":51,"program_ceiling":84,"city":"Beaumont","state":"TX","lat":30.0802,"lon":-94.1266},{"id":55,"name":"Arkansas Delta","conference":"Gulf","prestige":68,"resources":62,"development":50,"nil":63,"academics":57,"fan_support":56,"facilities":72,"admin_patience":66,"program_ceiling":85,"city":"Little Rock","state":"AR","lat":34.7465,"lon":-92.2896},{"id":56,"name":"Ozark Commonwealth","conference":"Gulf","prestige":67,"resources":79,"development":71,"nil":88,"academics":57,"fan_support":53,"facilities":70,"admin_patience":57,"program_ceiling":75,"city":"Fayetteville","state":"AR","lat":36.0822,"lon":-94.1719},{"id":57,"name":"Memphis Metropolitan","conference":"Gulf","prestige":64,"resources":65,"development":67,"nil":75,"academics":68,"fan_support":60,"facilities":55,"admin_patience":58,"program_ceiling":77,"city":"Memphis","state":"TN","lat":35.1495,"lon":-90.049},{"id":58,"name":"Red River University","conference":"Gulf","prestige":77,"resources":75,"development":60,"nil":76,"academics":78,"fan_support":81,"facilities":88,"admin_patience":52,"program_ceiling":90,"city":"Shreveport","state":"LA","lat":32.5252,"lon":-93.7502},{"id":59,"name":"Coastal Bend State","conference":"Gulf","prestige":63,"resources":70,"development":57,"nil":74,"academics":47,"fan_support":59,"facilities":69,"admin_patience":42,"program_ceiling":72,"city":"Corpus Christi","state":"TX","lat":27.8006,"lon":-97.3964},{"id":60,"name":"Gulf Plains University","conference":"Gulf","prestige":31,"resources":28,"development":60,"nil":22,"academics":73,"fan_support":29,"facilities":25,"admin_patience":60,"program_ceiling":44,"city":"Lake Charles","state":"LA","lat":30.2266,"lon":-93.2174},{"id":61,"name":"Missouri Commonwealth","conference":"Heartland","prestige":82,"resources":83,"development":85,"nil":65,"academics":69,"fan_support":99,"facilities":85,"admin_patience":59,"program_ceiling":98,"city":"Columbia","state":"MO","lat":38.9517,"lon":-92.3341},{"id":62,"name":"St. Louis Metropolitan","conference":"Heartland","prestige":65,"resources":74,"development":50,"nil":67,"academics":69,"fan_support":54,"facilities":72,"admin_patience":67,"program_ceiling":76,"city":"St. Louis","state":"MO","lat":38.627,"lon":-90.1994},{"id":63,"name":"Kansas Commonwealth","conference":"Heartland","prestige":81,"resources":91,"development":74,"nil":91,"academics":75,"fan_support":84,"facilities":82,"admin_patience":81,"program_ceiling":86,"city":"Wichita","state":"KS","lat":37.6872,"lon":-97.3301},{"id":64,"name":"Prairie Tech","conference":"Heartland","prestige":65,"resources":65,"development":64,"nil":77,"academics":72,"fan_support":73,"facilities":64,"admin_patience":48,"program_ceiling":82,"city":"Manhattan","state":"KS","lat":39.1836,"lon":-96.5717},{"id":65,"name":"Nebraska Commonwealth","conference":"Heartland","prestige":87,"resources":94,"development":65,"nil":83,"academics":95,"fan_support":61,"facilities":87,"admin_patience":54,"program_ceiling":97,"city":"Lincoln","state":"NE","lat":40.8136,"lon":-96.7026},{"id":66,"name":"Omaha State","conference":"Heartland","prestige":73,"resources":75,"development":64,"nil":76,"academics":74,"fan_support":63,"facilities":70,"admin_patience":58,"program_ceiling":84,"city":"Omaha","state":"NE","lat":41.2565,"lon":-95.9345},{"id":67,"name":"Iowa Commonwealth","conference":"Heartland","prestige":69,"resources":75,"development":51,"nil":73,"academics":64,"fan_support":70,"facilities":73,"admin_patience":57,"program_ceiling":77,"city":"Des Moines","state":"IA","lat":41.5868,"lon":-93.625},{"id":68,"name":"Dakota University","conference":"Heartland","prestige":79,"resources":89,"development":68,"nil":82,"academics":70,"fan_support":82,"facilities":80,"admin_patience":58,"program_ceiling":94,"city":"Sioux Falls","state":"SD","lat":43.5446,"lon":-96.7311},{"id":69,"name":"North Dakota Commonwealth","conference":"Heartland","prestige":66,"resources":73,"development":63,"nil":73,"academics":82,"fan_support":73,"facilities":68,"admin_patience":62,"program_ceiling":77,"city":"Fargo","state":"ND","lat":46.8772,"lon":-96.7898},{"id":70,"name":"Oklahoma Northern","conference":"Heartland","prestige":60,"resources":47,"development":74,"nil":59,"academics":75,"fan_support":59,"facilities":47,"admin_patience":55,"program_ceiling":77,"city":"Tulsa","state":"OK","lat":36.154,"lon":-95.9928},{"id":71,"name":"Springfield State","conference":"Heartland","prestige":51,"resources":64,"development":51,"nil":64,"academics":58,"fan_support":35,"facilities":57,"admin_patience":78,"program_ceiling":68,"city":"Springfield","state":"MO","lat":37.209,"lon":-93.2923},{"id":72,"name":"Central Plains University","conference":"Heartland","prestige":71,"resources":70,"development":73,"nil":65,"academics":85,"fan_support":61,"facilities":67,"admin_patience":65,"program_ceiling":78,"city":"Topeka","state":"KS","lat":39.0473,"lon":-95.6752},{"id":73,"name":"Texas Republic University","conference":"Southwest","prestige":98,"resources":99,"development":73,"nil":99,"academics":71,"fan_support":78,"facilities":83,"admin_patience":46,"program_ceiling":100,"city":"Austin","state":"TX","lat":30.2672,"lon":-97.7431},{"id":74,"name":"Lone Star Tech","conference":"Southwest","prestige":90,"resources":79,"development":65,"nil":73,"academics":73,"fan_support":83,"facilities":83,"admin_patience":58,"program_ceiling":100,"city":"Dallas","state":"TX","lat":32.7767,"lon":-96.797},{"id":75,"name":"Fort Worth State","conference":"Southwest","prestige":70,"resources":62,"development":75,"nil":60,"academics":84,"fan_support":71,"facilities":64,"admin_patience":79,"program_ceiling":83,"city":"Fort Worth","state":"TX","lat":32.7555,"lon":-97.3308},{"id":76,"name":"San Antonio Commonwealth","conference":"Southwest","prestige":69,"resources":91,"development":74,"nil":92,"academics":66,"fan_support":52,"facilities":82,"admin_patience":62,"program_ceiling":81,"city":"San Antonio","state":"TX","lat":29.4241,"lon":-98.4936},{"id":77,"name":"West Texas University","conference":"Southwest","prestige":56,"resources":40,"development":60,"nil":50,"academics":75,"fan_support":68,"facilities":41,"admin_patience":50,"program_ceiling":61,"city":"Lubbock","state":"TX","lat":33.5779,"lon":-101.8552},{"id":78,"name":"Rio Grande State","conference":"Southwest","prestige":68,"resources":67,"development":74,"nil":70,"academics":88,"fan_support":74,"facilities":61,"admin_patience":45,"program_ceiling":74,"city":"El Paso","state":"TX","lat":31.7619,"lon":-106.485},{"id":79,"name":"Oklahoma Commonwealth","conference":"Southwest","prestige":87,"resources":87,"development":69,"nil":85,"academics":60,"fan_support":88,"facilities":84,"admin_patience":52,"program_ceiling":94,"city":"Oklahoma City","state":"OK","lat":35.4676,"lon":-97.5164},{"id":80,"name":"Red Dirt University","conference":"Southwest","prestige":65,"resources":60,"development":76,"nil":71,"academics":73,"fan_support":73,"facilities":59,"admin_patience":44,"program_ceiling":73,"city":"Norman","state":"OK","lat":35.2226,"lon":-97.4395},{"id":81,"name":"New Mexico Commonwealth","conference":"Southwest","prestige":60,"resources":51,"development":50,"nil":63,"academics":76,"fan_support":64,"facilities":64,"admin_patience":65,"program_ceiling":72,"city":"Albuquerque","state":"NM","lat":35.0844,"lon":-106.6504},{"id":82,"name":"Santa Fe Tech","conference":"Southwest","prestige":53,"resources":51,"development":73,"nil":54,"academics":57,"fan_support":61,"facilities":53,"admin_patience":70,"program_ceiling":60,"city":"Santa Fe","state":"NM","lat":35.687,"lon":-105.9378},{"id":83,"name":"Arizona Commonwealth","conference":"Southwest","prestige":82,"resources":91,"development":65,"nil":81,"academics":72,"fan_support":99,"facilities":85,"admin_patience":64,"program_ceiling":90,"city":"Phoenix","state":"AZ","lat":33.4484,"lon":-112.074},{"id":84,"name":"Desert State University","conference":"Southwest","prestige":56,"resources":68,"development":36,"nil":54,"academics":46,"fan_support":46,"facilities":62,"admin_patience":68,"program_ceiling":67,"city":"Tucson","state":"AZ","lat":32.2226,"lon":-110.9747},{"id":85,"name":"Colorado Commonwealth","conference":"Mountain","prestige":82,"resources":86,"development":67,"nil":81,"academics":57,"fan_support":73,"facilities":85,"admin_patience":40,"program_ceiling":100,"city":"Denver","state":"CO","lat":39.7392,"lon":-104.9903},{"id":86,"name":"Front Range University","conference":"Mountain","prestige":56,"resources":59,"development":56,"nil":69,"academics":65,"fan_support":71,"facilities":55,"admin_patience":66,"program_ceiling":60,"city":"Colorado Springs","state":"CO","lat":38.8339,"lon":-104.8214},{"id":87,"name":"Utah Commonwealth","conference":"Mountain","prestige":84,"resources":88,"development":71,"nil":89,"academics":65,"fan_support":89,"facilities":89,"admin_patience":48,"program_ceiling":92,"city":"Salt Lake City","state":"UT","lat":40.7608,"lon":-111.891},{"id":88,"name":"Wasatch Tech","conference":"Mountain","prestige":82,"resources":74,"development":60,"nil":79,"academics":74,"fan_support":82,"facilities":88,"admin_patience":57,"program_ceiling":91,"city":"Provo","state":"UT","lat":40.2338,"lon":-111.6585},{"id":89,"name":"Boise Commonwealth","conference":"Mountain","prestige":81,"resources":87,"development":80,"nil":93,"academics":65,"fan_support":79,"facilities":84,"admin_patience":63,"program_ceiling":95,"city":"Boise","state":"ID","lat":43.615,"lon":-116.2023},{"id":90,"name":"Montana Commonwealth","conference":"Mountain","prestige":55,"resources":62,"development":45,"nil":54,"academics":55,"fan_support":59,"facilities":68,"admin_patience":68,"program_ceiling":68,"city":"Missoula","state":"MT","lat":46.8721,"lon":-113.994},{"id":91,"name":"Big Sky State","conference":"Mountain","prestige":76,"resources":67,"development":67,"nil":44,"academics":79,"fan_support":98,"facilities":74,"admin_patience":53,"program_ceiling":88,"city":"Bozeman","state":"MT","lat":45.677,"lon":-111.0429},{"id":92,"name":"Wyoming State","conference":"Mountain","prestige":35,"resources":45,"development":39,"nil":36,"academics":51,"fan_support":43,"facilities":36,"admin_patience":76,"program_ceiling":46,"city":"Cheyenne","state":"WY","lat":41.14,"lon":-104.8202},{"id":93,"name":"Nevada Commonwealth","conference":"Mountain","prestige":38,"resources":44,"development":58,"nil":48,"academics":53,"fan_support":26,"facilities":50,"admin_patience":57,"program_ceiling":42,"city":"Reno","state":"NV","lat":39.5296,"lon":-119.8138},{"id":94,"name":"Las Vegas Metropolitan","conference":"Mountain","prestige":78,"resources":69,"development":78,"nil":74,"academics":76,"fan_support":76,"facilities":74,"admin_patience":79,"program_ceiling":90,"city":"Las Vegas","state":"NV","lat":36.1699,"lon":-115.1398},{"id":95,"name":"Idaho Northern","conference":"Mountain","prestige":61,"resources":56,"development":63,"nil":53,"academics":66,"fan_support":60,"facilities":59,"admin_patience":59,"program_ceiling":69,"city":"Coeur d'Alene","state":"ID","lat":47.6777,"lon":-116.7805},{"id":96,"name":"Rocky Mountain University","conference":"Mountain","prestige":49,"resources":49,"development":47,"nil":39,"academics":84,"fan_support":52,"facilities":51,"admin_patience":48,"program_ceiling":65,"city":"Grand Junction","state":"CO","lat":39.0639,"lon":-108.5506},{"id":97,"name":"Southern California Commonwealth","conference":"Pacific","prestige":95,"resources":99,"development":70,"nil":92,"academics":64,"fan_support":95,"facilities":99,"admin_patience":38,"program_ceiling":100,"city":"Los Angeles","state":"CA","lat":34.0522,"lon":-118.2437},{"id":98,"name":"Los Angeles Metropolitan","conference":"Pacific","prestige":54,"resources":67,"development":56,"nil":55,"academics":45,"fan_support":54,"facilities":68,"admin_patience":52,"program_ceiling":69,"city":"Los Angeles","state":"CA","lat":34.0522,"lon":-118.2437},{"id":99,"name":"California Pacific","conference":"Pacific","prestige":75,"resources":79,"development":72,"nil":70,"academics":79,"fan_support":57,"facilities":81,"admin_patience":74,"program_ceiling":83,"city":"San Diego","state":"CA","lat":32.7157,"lon":-117.1611},{"id":100,"name":"Bay Area University","conference":"Pacific","prestige":84,"resources":79,"development":68,"nil":71,"academics":72,"fan_support":78,"facilities":76,"admin_patience":35,"program_ceiling":91,"city":"San Francisco","state":"CA","lat":37.7749,"lon":-122.4194},{"id":101,"name":"Sacramento State College","conference":"Pacific","prestige":74,"resources":82,"development":73,"nil":88,"academics":83,"fan_support":74,"facilities":85,"admin_patience":73,"program_ceiling":80,"city":"Sacramento","state":"CA","lat":38.5816,"lon":-121.4944},{"id":102,"name":"Central California Tech","conference":"Pacific","prestige":48,"resources":46,"development":65,"nil":34,"academics":62,"fan_support":35,"facilities":45,"admin_patience":63,"program_ceiling":64,"city":"Fresno","state":"CA","lat":36.7378,"lon":-119.7871},{"id":103,"name":"Oregon Commonwealth","conference":"Pacific","prestige":87,"resources":92,"development":81,"nil":98,"academics":82,"fan_support":89,"facilities":85,"admin_patience":68,"program_ceiling":96,"city":"Portland","state":"OR","lat":45.5152,"lon":-122.6784},{"id":104,"name":"Cascade University","conference":"Pacific","prestige":48,"resources":58,"development":54,"nil":58,"academics":55,"fan_support":37,"facilities":46,"admin_patience":52,"program_ceiling":58,"city":"Eugene","state":"OR","lat":44.0521,"lon":-123.0868},{"id":105,"name":"Washington Commonwealth","conference":"Pacific","prestige":90,"resources":88,"development":82,"nil":93,"academics":81,"fan_support":68,"facilities":81,"admin_patience":46,"program_ceiling":100,"city":"Seattle","state":"WA","lat":47.6062,"lon":-122.3321},{"id":106,"name":"Puget Sound State","conference":"Pacific","prestige":62,"resources":60,"development":56,"nil":57,"academics":59,"fan_support":63,"facilities":64,"admin_patience":72,"program_ceiling":75,"city":"Tacoma","state":"WA","lat":47.2529,"lon":-122.4443},{"id":107,"name":"Hawaii Commonwealth","conference":"Pacific","prestige":53,"resources":56,"development":55,"nil":63,"academics":61,"fan_support":47,"facilities":54,"admin_patience":60,"program_ceiling":65,"city":"Honolulu","state":"HI","lat":21.3069,"lon":-157.8583},{"id":108,"name":"Alaska Pacific","conference":"Pacific","prestige":22,"resources":21,"development":49,"nil":39,"academics":90,"fan_support":25,"facilities":25,"admin_patience":50,"program_ceiling":36,"city":"Anchorage","state":"AK","lat":61.2181,"lon":-149.9003},{"id":109,"name":"Philadelphia Metropolitan","conference":"Metro","prestige":80,"resources":93,"development":68,"nil":99,"academics":63,"fan_support":92,"facilities":92,"admin_patience":48,"program_ceiling":94,"city":"Philadelphia","state":"PA","lat":39.9526,"lon":-75.1652},{"id":110,"name":"Pittsburgh Commonwealth","conference":"Metro","prestige":82,"resources":71,"development":81,"nil":52,"academics":60,"fan_support":73,"facilities":85,"admin_patience":49,"program_ceiling":89,"city":"Pittsburgh","state":"PA","lat":40.4406,"lon":-79.9959},{"id":111,"name":"Baltimore Metropolitan","conference":"Metro","prestige":43,"resources":39,"development":62,"nil":41,"academics":75,"fan_support":39,"facilities":36,"admin_patience":67,"program_ceiling":60,"city":"Baltimore","state":"MD","lat":39.2904,"lon":-76.6122},{"id":112,"name":"Cincinnati Commonwealth","conference":"Metro","prestige":79,"resources":60,"development":66,"nil":61,"academics":54,"fan_support":72,"facilities":63,"admin_patience":77,"program_ceiling":87,"city":"Cincinnati","state":"OH","lat":39.1031,"lon":-84.512},{"id":113,"name":"Louisville Metropolitan","conference":"Metro","prestige":77,"resources":68,"development":73,"nil":87,"academics":76,"fan_support":84,"facilities":82,"admin_patience":66,"program_ceiling":82,"city":"Louisville","state":"KY","lat":38.2527,"lon":-85.7585},{"id":114,"name":"Nashville Tech","conference":"Metro","prestige":51,"resources":41,"development":52,"nil":24,"academics":63,"fan_support":48,"facilities":41,"admin_patience":62,"program_ceiling":69,"city":"Nashville","state":"TN","lat":36.1627,"lon":-86.7816},{"id":115,"name":"Indianapolis Metropolitan","conference":"Metro","prestige":60,"resources":63,"development":49,"nil":58,"academics":54,"fan_support":56,"facilities":74,"admin_patience":64,"program_ceiling":75,"city":"Indianapolis","state":"IN","lat":39.7684,"lon":-86.1581},{"id":116,"name":"Columbus Metropolitan","conference":"Metro","prestige":78,"resources":67,"development":62,"nil":68,"academics":77,"fan_support":60,"facilities":76,"admin_patience":44,"program_ceiling":91,"city":"Columbus","state":"OH","lat":39.9612,"lon":-82.9988},{"id":117,"name":"Buffalo State University","conference":"Metro","prestige":46,"resources":47,"development":71,"nil":41,"academics":77,"fan_support":30,"facilities":47,"admin_patience":65,"program_ceiling":55,"city":"Buffalo","state":"NY","lat":42.8864,"lon":-78.8784},{"id":118,"name":"Pittsburgh Tech","conference":"Metro","prestige":42,"resources":28,"development":54,"nil":27,"academics":49,"fan_support":33,"facilities":29,"admin_patience":56,"program_ceiling":59,"city":"Pittsburgh","state":"PA","lat":40.4406,"lon":-79.9959},{"id":119,"name":"Richmond Metropolitan","conference":"Metro","prestige":69,"resources":62,"development":61,"nil":51,"academics":62,"fan_support":70,"facilities":68,"admin_patience":65,"program_ceiling":85,"city":"Richmond","state":"VA","lat":37.5407,"lon":-77.436},{"id":120,"name":"Toronto International University","conference":"Metro","prestige":62,"resources":49,"development":49,"nil":56,"academics":53,"fan_support":67,"facilities":39,"admin_patience":67,"program_ceiling":72,"city":"Toronto","state":"ON","lat":43.6532,"lon":-79.3832}];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const APP_VERSION='0.9.39';
const POS=['QB','RB','WR','TE','OT','OG','C','EDGE','DT','LB','CB','S','K','P'];
const POS_COUNTS={QB:4,RB:5,WR:10,TE:5,OT:7,OG:6,C:3,EDGE:7,DT:7,LB:8,CB:8,S:7,K:2,P:2};
const FIRST=['Marcus','Darius','Eli','Jordan','Devin','Trevor','Mason','Jamal','Evan','Aaron','Tyler','Carter','Malik','Isaiah','Noah','Caleb','Andre','Micah','Dante','Logan','Xavier','Bryce','Miles','Cole','Jaylen','Cam','Roman','Nico','Zion','Trey','Dominic','Rashad','Gavin','Khalil','Luke','Jalen','Emmett','Malachi'];
const LAST=['Grant','Brooks','Coleman','Hayes','Wallace','Kemp','Voss','Rourke','Price','Banks','Foster','Bell','Crawford','Morris','King','Lewis','Dawson','Cross','Reed','Marsh','Holloway','Cole','Harper','Bennett','Rivers','Stone','Woods','Bryant','Knox','Mercer','Hawkins','Maddox','Sutton','Parker','Monroe','Whitaker'];
const STYLES={
 QB:['Rhythm Distributor','Field Architect','Off-Script Creator','Vertical Hunter','Power Creator','Run-First Weapon','Toolsy Project','Backyard Magician'],
 RB:['Gap Hammer','Space Cutter','Contact Glider','Third-Down Weapon','One-Cut Burner','Patient Slasher'],
 WR:['Boundary Bully','Space Hunter','Route Sculptor','Vertical Glider','Catch-Point Ace','YAC Creator','Motion Weapon'],
 TE:['Seam Hunter','Inline Mauler','Move Chesspiece','Red-Zone Tower','Backfield Hybrid'],
 OT:['Island Protector','Movement Tackle','Power Edge','Long-Frame Project'],OG:['Drive Blocker','Phone-Booth Anchor','Pulling Guard','Interior Technician'],C:['Protection Quarterback','Leverage Center','Movement Pivot','Power Pivot'],
 EDGE:['Pocket Wrecker','Speed Bender','Power Setter','Chaos Rusher','Run-Side Anchor'],DT:['Pocket Crusher','Gap Eater','Penetrator','Two-Gap Anchor','Interior Disruptor'],LB:['Range Hunter','Box Enforcer','Coverage Rover','Pressure Backer','Traffic Director'],
 CB:['Mirror Corner','Press Eraser','Ball Hunter','Boundary Fighter','Slot Shadow'],S:['Centerfielder','Box Hammer','Coverage Eraser','Hybrid Rover','Trigger Safety'],K:['Pressure Leg','Range Kicker','Placement Specialist'],P:['Field Flipper','Hang-Time Specialist','Directional Punter']
};
const BODY={QB:[[70,78],[185,245]],RB:[[66,73],[175,235]],WR:[[67,78],[165,230]],TE:[[73,80],[220,275]],OT:[[75,81],[275,350]],OG:[[72,78],[280,350]],C:[[71,77],[275,335]],EDGE:[[72,79],[215,285]],DT:[[71,78],[270,350]],LB:[[70,77],[205,255]],CB:[[67,75],[165,215]],S:[[68,77],[180,225]],K:[[68,76],[165,225]],P:[[70,78],[175,230]]};
const OFF_SCHEMES={
 'Tempo Spread':{pass:.61,pace:91,traits:['speed','iq','technique'],qb:['Rhythm Distributor','Off-Script Creator','Run-First Weapon']},
 'Vertical Strike':{pass:.66,pace:73,traits:['speed','power','composure'],qb:['Vertical Hunter','Power Creator','Backyard Magician']},
 'Rhythm Control':{pass:.58,pace:67,traits:['iq','technique','composure'],qb:['Rhythm Distributor','Field Architect']},
 'Ground Pressure':{pass:.37,pace:58,traits:['power','technique','durability'],qb:['Power Creator','Field Architect']},
 'Option Motion':{pass:.35,pace:82,traits:['speed','versatility','iq'],qb:['Run-First Weapon','Off-Script Creator']},
 'Heavy Play Action':{pass:.46,pace:55,traits:['power','iq','technique'],qb:['Field Architect','Vertical Hunter','Power Creator']},
 'Multiple':{pass:.51,pace:68,traits:['versatility','iq','technique'],qb:['Field Architect','Off-Script Creator','Rhythm Distributor']}
};
const DEF_SCHEMES={
 'Pressure Multiple':{pressure:88,coverage:66,run:73,traits:['speed','technique','versatility']},
 'Odd Front Control':{pressure:70,coverage:68,run:88,traits:['power','technique','iq']},
 'Four-Down Attack':{pressure:82,coverage:65,run:80,traits:['power','speed','technique']},
 'Match Quarters':{pressure:66,coverage:91,run:69,traits:['iq','speed','technique']},
 'Aggressive Man':{pressure:79,coverage:86,run:65,traits:['speed','technique','composure']},
 'Split-Safety Control':{pressure:61,coverage:88,run:76,traits:['iq','technique','versatility']},
 'Contain & Rally':{pressure:57,coverage:78,run:86,traits:['iq','power','durability']}
};
const PRIORITIES=['Prestige','NIL','Development','Early Role','Coaching','Academics','Scheme Fit','Winning','Stay Close','Campus Life'];
const PROMISES=['None','Early Role','Position Lock','No Redshirt','Development Plan','NIL Priority'];
const INJURIES=['Ankle sprain','Hamstring strain','Shoulder sprain','Knee sprain','Hand injury','Concussion protocol','Back strain'];
const TEAM_TRAINING={
 'Balanced':{desc:'Broad development with no major tradeoff.',attrs:{}},
 'Strength & Mass':{desc:'More strength and healthy weight gain; modest speed-retention risk.',attrs:{power:1.5,durability:.4}},
 'Speed & Explosion':{desc:'Prioritizes movement skills; less mass gain and more soft-tissue exposure.',attrs:{speed:1.4,versatility:.4}},
 'Fundamentals':{desc:'Technique-heavy offseason with reliable floor improvement.',attrs:{technique:1.4,iq:.4}},
 'Conditioning':{desc:'Durability, recovery and late-game readiness over raw skill growth.',attrs:{durability:1.2,composure:.5}},
 'Scheme Installation':{desc:'Accelerates system mastery and position familiarity.',attrs:{iq:.9,technique:.4,versatility:.4}}
};
const INDIVIDUAL_TRAINING=['Balanced','Technique','Athleticism','Strength','Football IQ','Conditioning','Rehab','Position Transition'];
const GROWTH_PROFILE_KEYS=['early','steady','steady','steady','late','volatile','physical','near'];
const GROWTH_CURVES={early:[1.35,1.10,.72,.45],steady:[1.02,1.00,.90,.70],late:[.55,.82,1.25,1.38],volatile:[1,1,1,1],physical:[1.18,1.08,.82,.58],near:[.52,.43,.34,.25]};
const SCOUT_DOMAIN_GROUPS={
 QB:[['arm','Arm Strength',{power:.7,technique:.3}],['accuracy','Accuracy',{technique:.7,composure:.3}],['processing','Processing',{iq:.7,composure:.3}],['mobility','Mobility',{speed:.7,versatility:.3}]],
 RB:[['athleticism','Athleticism',{speed:.65,versatility:.35}],['vision','Vision',{iq:.55,technique:.45}],['contact','Contact Ability',{power:.65,durability:.35}],['receiving','Receiving',{technique:.55,versatility:.45}]],
 WR:[['athleticism','Athleticism',{speed:.7,power:.3}],['route','Route Skill',{technique:.65,iq:.35}],['hands','Hands',{technique:.6,composure:.4}],['separation','Separation',{speed:.55,technique:.45}]],
 TE:[['athleticism','Athleticism',{speed:.55,power:.45}],['receiving','Receiving',{technique:.55,composure:.25,iq:.2}],['blocking','Blocking',{power:.55,technique:.45}],['processing','Processing',{iq:.65,versatility:.35}]],
 OL:[['power','Power',{power:.75,durability:.25}],['technique','Technique',{technique:.75,iq:.25}],['protection','Pass Protection',{technique:.55,iq:.3,composure:.15}],['mobility','Mobility',{speed:.5,versatility:.5}]],
 EDGE:[['burst','Burst',{speed:.65,versatility:.35}],['power','Power',{power:.7,durability:.3}],['rush','Rush Skill',{technique:.65,iq:.35}],['discipline','Run Discipline',{iq:.5,technique:.3,power:.2}]],
 DT:[['power','Power',{power:.75,durability:.25}],['getoff','Get-off',{speed:.45,technique:.4,composure:.15}],['technique','Technique',{technique:.7,iq:.3}],['anchor','Run Anchor',{power:.55,durability:.3,iq:.15}]],
 LB:[['range','Range',{speed:.55,versatility:.45}],['processing','Processing',{iq:.7,composure:.3}],['tackling','Tackling',{technique:.5,power:.3,durability:.2}],['coverage','Coverage',{speed:.4,technique:.35,iq:.25}]],
 DB:[['athleticism','Athleticism',{speed:.7,versatility:.3}],['coverage','Coverage',{technique:.55,speed:.3,iq:.15}],['ball','Ball Skills',{technique:.5,composure:.3,iq:.2}],['processing','Processing',{iq:.65,composure:.35}]],
 ST:[['leg','Leg Strength',{power:.8,durability:.2}],['control','Control',{technique:.75,iq:.25}],['pressure','Pressure',{composure:.75,iq:.25}],['athleticism','Athleticism',{speed:.55,versatility:.45}]]
};
const POSITION_TRANSITIONS={QB:['WR','RB'],RB:['WR','S'],WR:['TE','RB','CB'],TE:['WR','OT'],OT:['OG','TE'],OG:['C','OT'],C:['OG'],EDGE:['LB','DT'],DT:['EDGE'],LB:['EDGE','S'],CB:['S','WR'],S:['CB','LB'],K:['P'],P:['K']};
const CLASS_NAMES=['FR','SO','JR','SR'];
const ROLE_DEFS=[
 {id:'QB1',label:'Starting QB',side:'Offense',eligible:['QB'],base:true,weights:{iq:.30,technique:.28,composure:.22,speed:.10,power:.10}},
 {id:'RB1',label:'Lead Back',side:'Offense',eligible:['RB'],base:true,weights:{speed:.25,power:.25,technique:.24,iq:.14,durability:.12}},
 {id:'3DRB',label:'Third-Down Back',side:'Offense',eligible:['RB'],weights:{speed:.28,technique:.26,iq:.24,versatility:.22}},
 {id:'PWRB',label:'Power / Goal-Line Back',side:'Offense',eligible:['RB','TE'],weights:{power:.42,durability:.25,technique:.18,composure:.15}},
 {id:'X',label:'X Receiver',side:'Offense',eligible:['WR','TE'],base:true,weights:{power:.26,technique:.28,speed:.20,composure:.16,iq:.10}},
 {id:'Z',label:'Z Receiver',side:'Offense',eligible:['WR'],base:true,weights:{speed:.34,technique:.28,iq:.18,composure:.12,versatility:.08}},
 {id:'SLOT',label:'Slot Receiver',side:'Offense',eligible:['WR','TE','RB'],base:true,weights:{speed:.23,technique:.27,iq:.26,versatility:.24}},
 {id:'TE1',label:'Inline Tight End',side:'Offense',eligible:['TE'],base:true,weights:{power:.30,technique:.30,iq:.18,durability:.14,versatility:.08}},
 {id:'MOVETE',label:'Move TE / H-Back',side:'Offense',eligible:['TE','WR','RB'],weights:{versatility:.31,speed:.20,iq:.22,technique:.17,power:.10}},
 {id:'LT',label:'Left Tackle',side:'Offense',eligible:['OT'],base:true,weights:{technique:.38,power:.25,iq:.19,speed:.10,durability:.08}},
 {id:'LG',label:'Left Guard',side:'Offense',eligible:['OG'],base:true,weights:{power:.34,technique:.34,iq:.16,durability:.10,versatility:.06}},
 {id:'C1',label:'Center',side:'Offense',eligible:['C'],base:true,weights:{iq:.31,technique:.31,power:.22,composure:.10,versatility:.06}},
 {id:'RG',label:'Right Guard',side:'Offense',eligible:['OG'],base:true,weights:{power:.36,technique:.31,iq:.15,durability:.12,versatility:.06}},
 {id:'RT',label:'Right Tackle',side:'Offense',eligible:['OT'],base:true,weights:{power:.30,technique:.31,iq:.17,durability:.12,speed:.10}},
 {id:'RUSH',label:'Rush EDGE',side:'Defense',eligible:['EDGE','LB'],base:true,weights:{speed:.29,technique:.30,power:.23,iq:.10,composure:.08}},
 {id:'SETEDGE',label:'Strong-Side EDGE',side:'Defense',eligible:['EDGE','LB'],base:true,weights:{power:.34,technique:.28,durability:.16,iq:.14,speed:.08}},
 {id:'NT',label:'Nose / One-Tech',side:'Defense',eligible:['DT'],base:true,weights:{power:.42,durability:.22,technique:.22,iq:.09,composure:.05}},
 {id:'3TECH',label:'3-Tech / Interior Rush',side:'Defense',eligible:['DT','EDGE'],base:true,weights:{technique:.31,power:.27,speed:.18,iq:.14,durability:.10}},
 {id:'MIKE',label:'MIKE Linebacker',side:'Defense',eligible:['LB'],base:true,weights:{iq:.31,power:.22,technique:.22,speed:.13,composure:.12}},
 {id:'WILL',label:'WILL / Range Backer',side:'Defense',eligible:['LB','S'],base:true,weights:{speed:.28,iq:.27,technique:.23,versatility:.14,composure:.08}},
 {id:'NICKEL',label:'Nickel Defender',side:'Defense',eligible:['CB','S','LB'],weights:{speed:.28,technique:.28,iq:.24,versatility:.20}},
 {id:'BCB',label:'Boundary Corner',side:'Defense',eligible:['CB'],base:true,weights:{technique:.31,power:.19,speed:.25,composure:.15,iq:.10}},
 {id:'FCB',label:'Field Corner',side:'Defense',eligible:['CB'],base:true,weights:{speed:.34,technique:.29,iq:.17,composure:.12,versatility:.08}},
 {id:'SLOTCB',label:'Slot Corner',side:'Defense',eligible:['CB','S'],weights:{speed:.27,technique:.28,iq:.25,versatility:.20}},
 {id:'FS',label:'Deep Safety',side:'Defense',eligible:['S','CB'],base:true,weights:{iq:.31,speed:.26,technique:.23,composure:.12,versatility:.08}},
 {id:'BOXS',label:'Box Safety',side:'Defense',eligible:['S','LB'],base:true,weights:{power:.27,iq:.25,technique:.23,speed:.13,durability:.12}},
 {id:'K1',label:'Kicker',side:'Special Teams',eligible:['K'],base:true,weights:{technique:.45,composure:.35,power:.20}},
 {id:'P1',label:'Punter',side:'Special Teams',eligible:['P'],base:true,weights:{power:.35,technique:.37,composure:.28}},
 {id:'KR',label:'Kick Returner',side:'Special Teams',eligible:['WR','RB','CB'],weights:{speed:.48,versatility:.24,composure:.16,technique:.12}},
 {id:'PR',label:'Punt Returner',side:'Special Teams',eligible:['WR','RB','CB'],weights:{speed:.37,technique:.25,iq:.18,versatility:.20}}
];
const ROLE_BY_ID=Object.fromEntries(ROLE_DEFS.map(r=>[r.id,r]));
const POS_ROLE={QB:'QB1',RB:'RB1',WR:'X',TE:'TE1',OT:'LT',OG:'LG',C:'C1',EDGE:'RUSH',DT:'3TECH',LB:'MIKE',CB:'BCB',S:'FS',K:'K1',P:'P1'};
const RECORD_CATS={passYds:'Passing Yards',passTD:'Passing TD',rushYds:'Rushing Yards',rushTD:'Rushing TD',recYds:'Receiving Yards',recTD:'Receiving TD',receptions:'Receptions',tackles:'Tackles',tfl:'Tackles for Loss',sacks:'Sacks',pressures:'Pressures',intDef:'Interceptions'};
const OFF_POS=new Set(['QB','RB','WR','TE','OT','OG','C','K','P']);
let schools=[],universe=null;

const rng=(a,b)=>Math.random()*(b-a)+a, gi=(a,b)=>Math.floor(rng(a,b+1)), pick=a=>a[gi(0,a.length-1)], clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function gauss(){let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}
function uid(){return (crypto&&crypto.randomUUID)?crypto.randomUUID():`${Date.now()}-${Math.random()}`}
function grade(v){return v>=94?'A+':v>=90?'A':v>=86?'A-':v>=82?'B+':v>=78?'B':v>=74?'B-':v>=70?'C+':v>=66?'C':v>=62?'C-':v>=57?'D+':v>=52?'D':'F'}
function stars(v){return v>=91?5:v>=82?4:v>=70?3:v>=58?2:1}
// Recruit star bands are calibrated against the generator's own distribution so
// the pool resembles a real signing class. The generic stars() thresholds put
// half of every class at one star and produced seven five-stars nationally.
function recruitStars(v){return v>=86?5:v>=72?4:v>=55?3:v>=41?2:1}
function heightStr(i){return `${Math.floor(i/12)}'${i%12}"`}
function avg(a){return a.length?a.reduce((x,y)=>x+y,0)/a.length:55}
function staffEval(t){return Math.round(avg([t.staff?.HC?.evaluation||65,t.staff?.OC?.evaluation||65,t.staff?.DC?.evaluation||65]))}
function scoutingDefs(s){let g=s.pos==='QB'?'QB':s.pos==='RB'?'RB':s.pos==='WR'?'WR':s.pos==='TE'?'TE':['OT','OG','C'].includes(s.pos)?'OL':s.pos==='EDGE'?'EDGE':s.pos==='DT'?'DT':s.pos==='LB'?'LB':['CB','S'].includes(s.pos)?'DB':'ST';return [...SCOUT_DOMAIN_GROUPS[g],['upside','Upside',null]]}
function scoutHash(s,key,salt=''){return (Math.abs(hashString(`${s.id}|${key}|${salt}`))%2001)/1000-1}
function scoutingVolatility(s){let v=/Project|Creator|Weapon|Hunter/.test(s.style||'')?8:0;if(/Architect|Distributor|Sculptor|Technician|Specialist|Anchor/.test(s.style||''))v-=5;if(s.growthProfile==='volatile')v+=8;else if(s.growthProfile==='near')v-=4;return v}
function scoutingTruth(s,d,recruit=false){if(d[0]==='upside')return s.upside??s.scoutUp??s.trueNow;const weights=d[2];if(recruit)return clamp(Math.round((s.trueNow??s.scout)+scoutHash(s,d[0],'profile')*7),25,99);let n=0,w=0;for(const [k,x] of Object.entries(weights)){n+=(s[k]??s.trueNow)*x;w+=x}return clamp(Math.round(n/(w||1)),20,99)}
function scoutingConfidence(s,t,d,recruit=false){let mental=['processing','vision','coverage','upside'].includes(d[0]),v=scoutingVolatility(s),c;if(recruit)c=25+staffEval(t)*.18+(s.targeted?6:0)+(s.relationship||0)*.09+(s.visitWeek?6:0)+(s.committed?5:0);else{let rel=Math.max(20,...Object.values(s.coachRelationships||{}));c=(s.scoutConfidence??48)+Math.min(9,(s.stats?.games||0)*.7)+Math.min(6,(s.stats?.starts||0)*.6)+Math.min(5,(s.stats?.snaps||0)/180)+(s.transferHistory?.length?7:0)+(rel-20)*.06}if(mental)c-=recruit?5:eligibilityBase(s)===0?5:2;return clamp(Math.round(c-v),20,96)}
function normalizeScoutingRecord(s){s.scoutingHistory??=[];if(s.scoutingDomains&&typeof s.scoutingDomains!=='object')delete s.scoutingDomains;return s}
function ensureScoutingIntel(s,t,recruit=false){normalizeScoutingRecord(s);s.scoutingDomains??={};for(const d of scoutingDefs(s)){if(s.scoutingDomains[d[0]])continue;let truth=scoutingTruth(s,d,recruit),base=recruit?(d[0]==='upside'?s.scoutUp:s.scout):(d[0]==='upside'?s.perceivedUpside:s.perceived),confidence=scoutingConfidence(s,t,d,recruit),width=(100-confidence)/5;s.scoutingDomains[d[0]]={estimate:clamp(Math.round(base+(truth-(recruit?s.trueNow:s.trueNow))*.45+scoutHash(s,d[0],'estimate')*width),25,99),confidence}}return s.scoutingDomains}
function scoutingDomainView(s,t,recruit=false){let domains=ensureScoutingIntel(s,t,recruit);return scoutingDefs(s).map(d=>{let x=domains[d[0]],confidence=Math.max(x.confidence,scoutingConfidence(s,t,d,recruit)),width=clamp(Math.round((100-confidence)/6+scoutingVolatility(s)/12+(d[0]==='upside'?2:0)),2,16),low=clamp(x.estimate-width,20,99),high=clamp(x.estimate+width,20,99);return{key:d[0],label:d[1],low,high:Math.max(low+1,high),confidence}})}
function scoutingConfidenceLabel(c){return c>=85?'Very High':c>=70?'High':c>=50?'Medium':c>=35?'Low':'Very Low'}
function refreshScoutingIntel(s,t,gain,source,recruit=false){let domains=ensureScoutingIntel(s,t,recruit);for(const d of scoutingDefs(s)){let x=domains[d[0]],before=Math.max(x.confidence,scoutingConfidence(s,t,d,recruit)),step=d[0]==='upside'?Math.ceil(gain*.65):gain;x.confidence=clamp(before+step,20,96);let truth=scoutingTruth(s,d,recruit),move=clamp(Math.round((truth-x.estimate)*Math.min(.28,gain/28)),-3,3);x.estimate=clamp(x.estimate+move,20,99)}if(!recruit)s.scoutConfidence=clamp(Math.max(s.scoutConfidence||0,Math.round(avg(Object.values(domains).map(x=>x.confidence)))),25,98);else s.scoutConfidence=Math.round(avg(Object.values(domains).map(x=>x.confidence)));return domains}
function snapshotScouting(s,t,phase,source,recruit=false,major=false){let history=(normalizeScoutingRecord(s).scoutingHistory),rows=scoutingDomainView(s,t,recruit),confidence=Math.round(avg(rows.map(x=>x.confidence))),currentEstimate=recruit?s.scout:s.perceived,upsideEstimate=recruit?s.scoutUp:s.perceivedUpside,last=history.at(-1);if(history.some(h=>(phase==='FIRST_FALL_CAMP'?h.phase===phase:h.season===universe.year&&h.phase===phase)))return false;if(major&&(!last||(Math.abs(currentEstimate-last.currentEstimate)<4&&Math.abs(confidence-last.confidence)<12)))return false;history.push({season:universe.year,week:universe.week,phase,source,currentEstimate,upsideEstimate,confidence,domains:Object.fromEntries(rows.map(x=>[x.key,{low:x.low,high:x.high,confidence:x.confidence}]))});return true}
function firstRecruitEvaluation(r,t){ensureScoutingIntel(r,t,true);if(snapshotScouting(r,t,'FIRST_EVALUATION','RECRUITING',true))refreshScoutingIntel(r,t,5,'RECRUITING',true)}
function scoutingPanelHTML(s,t,recruit=false){let rows=scoutingDomainView(s,t,recruit);return `<h3 class="scouting-heading">Scouting Intelligence</h3><div class="scouting-domains">${rows.map(x=>`<div class="scouting-domain"><span>${x.label}</span><strong>${x.low}–${x.high}</strong><small>${scoutingConfidenceLabel(x.confidence)} confidence</small></div>`).join('')}</div>`}
function scoutingHistoryHTML(s){let h=(s.scoutingHistory||[]).slice().reverse();return `<h3 class="scouting-heading">Scouting History</h3><div class="scouting-history">${h.length?h.map(x=>`<div class="timeline-row"><strong>${x.season} · ${String(x.phase).replaceAll('_',' ')}</strong><div class="muted">${x.currentEstimate} current · ${x.upsideEstimate} upside · ${scoutingConfidenceLabel(x.confidence)} confidence</div><div class="small scouting-snapshot">${Object.entries(x.domains||{}).map(([k,d])=>`${k.replaceAll('_',' ')} ${d.low}–${d.high}`).join(' · ')}</div></div>`).join(''):'<div class="muted">No meaningful scouting checkpoint recorded yet.</div>'}</div>`}
function ensureTeamDevelopment(t){t.trainingFocus??='Balanced';t.developmentNotes??=[]}
function ensurePlayerDevelopment(p,t){ensurePortrait(p);
 p.growthProfile??=pick(GROWTH_PROFILE_KEYS);p.devFraction??=0;p.growthVolatility??=clamp(Math.round(45+gauss()*22),10,95);p.framePotential??=clamp(Math.round(58+gauss()*20),10,98);p.speedRetention??=clamp(Math.round(70+gauss()*16),20,99);p.heightGrowthRemaining??=(eligibilityBase(p)===0&&Math.random()<.24?1:0);p.trainingFocus??='Balanced';p.positionFamiliarity??={[p.pos]:100};p.positionFamiliarity[p.pos]??=100;p.formerPositions??=[];p.scoutConfidence??=clamp(Math.round(38+eligibilityBase(p)*13+(t?staffEval(t)*.18:12)+gauss()*5),28,94);p.lastDevelopmentDelta??=0;p.lastPhysicalChange??='';p.campGrade??=null;p.campHistory??=[];normalizeScoutingRecord(p);
}
function growthFactor(p){ensurePlayerDevelopment(p);let idx=Math.min(3,eligibilityBase(p)),base=GROWTH_CURVES[p.growthProfile]?.[idx]??1;if(p.growthProfile==='volatile')base*=clamp(1+gauss()*(p.growthVolatility/170),.35,1.8);return base}
function scoutRange(p,t,potential=false){ensurePlayerDevelopment(p,t);let center=potential?p.perceivedUpside:p.perceived,evalAdj=(100-staffEval(t))/28,width=(100-p.scoutConfidence)/7+evalAdj+(potential?2.5:0);width=clamp(Math.round(width),2,potential?15:12);let lo=clamp(center-width,25,99),hi=clamp(center+width,25,99);if(potential)lo=Math.max(lo,scoutRange(p,t,false)[0]);return [Math.min(lo,hi),hi]}
function scoutRangeText(p,t,potential=false){let [lo,hi]=scoutRange(p,t,potential),mid=Math.round((lo+hi)/2);return `<span class="scout-range"><strong>${grade(mid)}</strong> <span class="muted">${lo}–${hi}</span></span>`}
function confidenceText(p){let c=clamp(Math.round(p.scoutConfidence||50),1,100);return `<span class="dev-confidence"><span class="confidence-meter"><i style="width:${c}%"></i></span>${c}%</span>`}
function familiarity(p,pos=p.pos){let v=p.positionFamiliarity?.[pos];if(v==null){ensurePlayerDevelopment(p);v=p.positionFamiliarity?.[pos]}return clamp(v??(pos===p.pos?100:25),0,100)}
function devStaffNote(p,t){ensurePlayerDevelopment(p,t);let notes=[];if(p.scoutConfidence<55)notes.push('Evaluation still wide');else if(p.scoutConfidence>82)notes.push('Staff has a firm read');if(p.framePotential>78&&eligibilityBase(p)<2)notes.push('Frame can still add size');if(p.speedRetention<50&&p.weight>230)notes.push('Watch speed as mass increases');if(familiarity(p,p.pos)<80)notes.push('Still learning new position');if(p.lastDevelopmentDelta>=4)notes.push('Strong recent growth');if(p.lastDevelopmentDelta<=-1)notes.push('Disappointing camp');return notes.slice(0,2).join(' · ')||'Normal developmental track'}
function trainingAttrBoost(p,teamFocus,individual,phase){let m={speed:0,power:0,technique:0,iq:0,composure:0,durability:0,versatility:0},scale=phase==='spring'?1:.55;for(const [k,v] of Object.entries(TEAM_TRAINING[teamFocus]?.attrs||{}))m[k]+=v*scale;let add=(k,v)=>m[k]+=v*scale;switch(individual){case'Technique':add('technique',1.8);break;case'Athleticism':add('speed',1.3);add('versatility',.7);break;case'Strength':add('power',1.8);add('durability',.4);break;case'Football IQ':add('iq',1.7);add('composure',.5);break;case'Conditioning':add('durability',1.5);add('composure',.4);break;case'Rehab':add('durability',.8);break;case'Position Transition':add('versatility',.9);add('iq',.7);break;default:add('technique',.35);add('iq',.25)}return m}
function applyPhysicalGrowth(p,t){ensurePlayerDevelopment(p,t);let oldH=p.height,oldW=p.weight,elig=eligibilityBase(p),skill=['QB','RB','WR','CB','S','K','P'].includes(p.pos),line=['OT','OG','C','DT'].includes(p.pos);let baseGain=(line?rng(4,12):skill?rng(0,5):rng(2,8))*(p.framePotential/75)*(elig===0?1.15:elig===1?1:.65);if(t.trainingFocus==='Strength & Mass')baseGain*=1.35;if(t.trainingFocus==='Speed & Explosion')baseGain*=.65;let gain=Math.max(0,Math.round(baseGain+gauss()*1.5));p.weight=clamp(p.weight+gain,BODY[p.pos]?.[1]?.[0]||150,(BODY[p.pos]?.[1]?.[1]||360)+15);if(p.heightGrowthRemaining>0&&elig===0&&Math.random()<.55){p.height+=1;p.heightGrowthRemaining=0}let excess=Math.max(0,gain-5),lossChance=excess*(100-p.speedRetention)/260;if(Math.random()<lossChance)p.speed=clamp(p.speed-gi(1,2),20,99);p.lastPhysicalChange=`${p.height>oldH?'+1 in, ':''}${p.weight-oldW>=0?'+':''}${p.weight-oldW} lb`}
function applyDevelopmentPhase(p,t,phase){ensurePlayerDevelopment(p,t);recordPromiseTraining(p,phase);let curve=growthFactor(p),staff=OFF_POS.has(p.pos)?t.staff.OC.development:t.staff.DC.development,base=(p.dev*.27+p.work*.22+p.coach*.10+t.development*.16+t.facilities*.09+t.staff.SC.development*.08+staff*.08-52)/9,vol=phase==='spring'?1.45:.85,raw=base*curve*(phase==='spring'?1:.5)+gauss()*vol*(.65+p.growthVolatility/150),carried=(p.devFraction||0)+raw,delta=clamp(Math.round(carried),-3,phase==='spring'?7:4),ceiling=p.upside+(p.growthProfile==='volatile'?2:0);p.devFraction=clamp(carried-delta,-2.5,2.5);p.trueNow=clamp(p.trueNow+delta,30,Math.min(99,ceiling));let mods=trainingAttrBoost(p,t.trainingFocus,p.trainingFocus,phase);for(const k of Object.keys(mods)){let chance=clamp(.35+mods[k]*.28+(p.work-50)/180,.15,.92);if(Math.random()<chance)p[k]=clamp(Math.round((p[k]||p.trueNow)+Math.max(0,mods[k]+gauss()*.6)),20,99)}if(p.trainingFocus==='Rehab'){p.health=clamp((p.health??100)+gi(5,12),40,100);p.wear=clamp((p.wear||0)-gi(8,18),0,100)}let famGain=phase==='spring'?gi(8,18):gi(5,12);if(p.trainingFocus==='Position Transition'||t.trainingFocus==='Scheme Installation')famGain+=gi(4,9);p.positionFamiliarity[p.pos]=clamp(familiarity(p,p.pos)+famGain,0,100);p.scoutConfidence=clamp(p.scoutConfidence+(phase==='spring'?gi(8,15):gi(6,12))+((p.stats?.games||0)>6?3:0),25,98);let err=gauss()*Math.max(1,(100-p.scoutConfidence)/12);p.perceived=clamp(Math.round(p.trueNow+err),30,99);p.perceivedUpside=clamp(Math.round(p.upside+gauss()*Math.max(1,(100-p.scoutConfidence)/10)),p.perceived,99);p.lastDevelopmentDelta=(p.lastDevelopmentDelta||0)+delta;if(phase==='spring')applyPhysicalGrowth(p,t);return delta}
function campScore(p,t,role,phase){let base=roleFit(p,t,role,false),practice=p.work*.10+p.composure*.08+p.iq*.07,noise=gauss()*(phase==='fall'?5:7);return Math.round(base*.75+practice*.25+noise)}
function buildCampBattles(t,phase){ensureRoleDepth(t);let out=[];for(const role of ROLE_DEFS.filter(r=>r.base||['3DRB','SLOT','NICKEL','KR','PR'].includes(r.id))){let cand=rolePlayers(t,role.id).filter(p=>(p.injuryWeeks||0)===0).slice(0,3);if(cand.length<2)continue;let rows=cand.map(p=>({id:p.id,name:p.name,pos:p.pos,score:campScore(p,t,role,phase)})).sort((a,b)=>b.score-a.score),gap=rows[0].score-rows[1].score;if(gap<=10||phase==='fall'){out.push({roleId:role.id,label:role.label,candidates:rows,recommended:rows[0].id,gap})}}return out.sort((a,b)=>a.gap-b.gap).slice(0,phase==='fall'?10:7)}
function ensureDevelopmentState(){universe.campHistory??={};if(!universe.developmentState||universe.developmentState.year!==universe.year)universe.developmentState={year:universe.year,springRun:false,fallRun:false,springReport:[],fallReport:[],battles:[]};return universe.developmentState}
function runSpringCamp(){if(universe.phase!=='complete'){setStatus('Finish the season before spring development.');return}let ds=ensureDevelopmentState();if(ds.springRun){setStatus('Spring development has already been completed.');return}for(const t of universe.teams)advanceSchemeInstall(t,'spring');let u=selected(),report=[];for(const t of universe.teams){for(const p of t.roster){p.lastDevelopmentDelta=0;let d=applyDevelopmentPhase(p,t,'spring');if(t===u){refreshScoutingIntel(p,t,9,'CAMP');snapshotScouting(p,t,'MAJOR_REVISION','CAMP',false,true);report.push({id:p.id,name:p.name,pos:p.pos,delta:d,physical:p.lastPhysicalChange})}}if(t!==u&&Math.random()<.35)t.trainingFocus=pick(Object.keys(TEAM_TRAINING));autoRoleDepth(t,false)}ds.springRun=true;ds.springReport=report.sort((a,b)=>b.delta-a.delta);ds.battles=buildCampBattles(u,'spring');setStatus('Spring development complete. Staff evaluations have tightened.');render()}
function runFallCamp(){if(universe.phase!=='complete'){setStatus('Finish the season before fall camp.');return}let ds=ensureDevelopmentState();if(!ds.springRun){setStatus('Run spring development first.');return}for(const t of universe.teams)advanceSchemeInstall(t,'fall');if(ds.fallRun){setStatus('Fall camp has already been completed.');return}let u=selected(),report=[];for(const t of universe.teams){for(const p of t.roster){let before=p.trueNow,d=applyDevelopmentPhase(p,t,'fall');p.campGrade=grade(clamp(Math.round(p.perceived+p.work*.08+p.composure*.05+gauss()*5),25,99));p.campHistory.push({year:universe.year,phase:'Fall',grade:p.campGrade,delta:p.trueNow-before});if(t===u){refreshScoutingIntel(p,t,7,'CAMP');snapshotScouting(p,t,'FIRST_FALL_CAMP','CAMP');report.push({id:p.id,name:p.name,pos:p.pos,delta:d,grade:p.campGrade})}}if(t!==u)autoRoleDepth(t,false)}ds.fallRun=true;ds.fallReport=report.sort((a,b)=>b.delta-a.delta);ds.battles=buildCampBattles(u,'fall');setStatus('Fall camp complete. Position battles are ready for decisions.');render()}
function applyCampRecommendations(){let ds=ensureDevelopmentState(),u=selected();if(!ds.battles?.length){setStatus('No camp recommendations are available yet.');return}ensureRoleDepth(u);for(const b of ds.battles){let arr=u.roleDepth[b.roleId]||[],id=b.recommended;u.roleDepth[b.roleId]=[id,...arr.filter(x=>x!==id)]}setStatus('Staff camp recommendations applied to the role depth chart.');render()}
function positionOptions(p){return (POSITION_TRANSITIONS[p.pos]||[]).filter(x=>BODY[x])}
function positionTransitionFit(p,pos){if(!BODY[pos])return 0;let [hr,wr]=BODY[pos],heightFit=p.height>=hr[0]-1&&p.height<=hr[1]+1?90:60,weightMid=(wr[0]+wr[1])/2,weightFit=clamp(100-Math.abs(p.weight-weightMid)*1.25,35,100),skill=pos==='WR'||pos==='CB'||pos==='S'?p.speed:pos==='OT'||pos==='OG'||pos==='C'||pos==='DT'?p.power:avg([p.speed,p.power,p.technique]);return Math.round(heightFit*.20+weightFit*.25+skill*.35+p.versatility*.20)}
// --- v0.9.10: position change agency ----------------------------------------
// A move is a conversation, not an order. Body fit, playing time, trust and a
// standing Position Lock all shape whether a player will actually do it.
const POSITION_WILLINGNESS=['REFUSES','RELUCTANT','OPEN','EAGER'];
function positionChangeWillingness(p,t,to){
 if(!p||!to||to===p.pos)return{state:'OPEN',score:60,reasons:[]};
 const reasons=[];let score=52;
 const fit=positionTransitionFit(p,to);
 score+=Math.round((fit-60)*.55);
 if(fit>=72)reasons.push('the frame and skill set carry over');else if(fit<=48)reasons.push('he does not see the physical fit');
 // Buried players want a path; established starters do not.
 if(p.role==='Development'){score+=16;reasons.push('he is buried on the depth chart')}
 else if(p.role==='Redshirt candidate'){score+=11;reasons.push('he is looking for a role')}
 else if(p.role==='Starter'||p.role==='Starter mix'){score-=18;reasons.push('he already starts where he is')}
 const trust=clamp(p.staffTrust??70,0,100);
 score+=Math.round((trust-70)*.45);
 if(trust>=85)reasons.push('he trusts the staff');else if(trust<=45)reasons.push('he does not trust the staff right now');
 score+=Math.round(((p.versatility??60)-60)*.35);
 if((p.versatility??60)>=78)reasons.push('he has played multiple spots before');
 // A live Position Lock promise is close to a veto.
 const lock=(p.promises||[]).find(q=>q.status==='ACTIVE'&&q.type==='POSITION_LOCK'&&q.targetPosition&&q.targetPosition!==to);
 if(lock){score-=42;reasons.push(`he was promised he would stay at ${lock.targetPosition}`)}
 if(transferRisk(p)>=55){score-=12;reasons.push('he already has one foot out the door')}
 score=clamp(Math.round(score),0,100);
 const state=score>=74?'EAGER':score>=50?'OPEN':score>=28?'RELUCTANT':'REFUSES';
 return{state,score,reasons,lock:!!lock};
}
function positionWillingnessLabel(state){return{EAGER:'Eager',OPEN:'Open to it',RELUCTANT:'Reluctant',REFUSES:'Refuses'}[state]||state}
// Pushing a reluctant player through the move costs morale and trust.
function applyPositionChangeCost(p,state){
 if(state==='RELUCTANT'){p.morale=clamp((p.morale||60)-gi(6,12),5,99);p.staffTrust=clamp((p.staffTrust??70)-gi(8,15),0,100);return true}
 if(state==='EAGER')p.morale=clamp((p.morale||60)+gi(1,4),5,99);
 return false;
}
function applyPositionChange(){if(universe.phase!=='complete'){setStatus('Position changes are available during the offseason.');return}let u=selected(),p=u.roster.find(x=>x.id===$('#positionChangePlayer').value),to=$('#positionChangeTarget').value;if(!p||!to||to===p.pos)return;
 const will=positionChangeWillingness(p,u,to);
 if(will.state==='REFUSES'){setStatus(`${p.name} refuses the move to ${to}${will.reasons.length?`: ${will.reasons[0]}`:'.'}`);return}
 const forced=applyPositionChangeCost(p,will.state);
 recordPromisePositionChange(p,to);let old=p.pos;p.formerPositions??=[];p.formerPositions.push({pos:old,year:universe.year});p.positionFamiliarity??={[old]:100};p.positionFamiliarity[to]=Math.max(p.positionFamiliarity[to]||0,38+Math.round(p.versatility*.25));p.pos=to;p.trainingFocus='Position Transition';p.role='Development';autoRoleDepth(u,true);setStatus(`${p.name} moved from ${old} to ${to}.${forced?' He was not sold on it — morale and staff trust took a hit.':''} Expect a temporary familiarity penalty.`);render()}
function eligibilityBase(p){return clamp(Number.isFinite(p.eligibilityUsed)?p.eligibilityUsed:({FR:0,SO:1,JR:2,SR:3}[p.year]??0),0,4)}
function eligibilityLabel(p){let n=eligibilityBase(p),base=CLASS_NAMES[Math.min(3,n)]||'EXH';if(p.redshirtUsed)base='RS '+base;if(p.redshirtActive)base+=' • RS';return base}
function canRedshirt(p){return !p.redshirtUsed&&eligibilityBase(p)<4&&(p.stats?.games||0)<=4}
function weeklyPlayerPlan(p){const x=p?.weeklyAvailability;return x&&x.season===universe.year&&x.week===universe.week?x:null}
function gameAvailable(p){return !!p&&(p.injuryWeeks||0)===0&&!p.redshirtActive&&!academicallyIneligible(p)&&weeklyPlayerPlan(p)?.role!=='sit'}
function roleFit(p,t,role,useScout=false){if(!p||!role.eligible.includes(p.pos))return 0;ensurePlayerDevelopment(p,t);let base=useScout?p.perceived:conditionRating(p),w=0,total=0;for(const [k,x] of Object.entries(role.weights||{})){w+=(p[k]??p.trueNow)*x;total+=x}let attr=total?w/total:base,scheme=playerSchemeFit(p,t),fam=familiarity(p,p.pos),pen=(100-fam)*.12;return clamp(Math.round(base*.43+attr*.40+scheme*.17-pen),20,99)}
function makeRoleDepth(t,useScout=false){let out={},used=new Set();for(const role of ROLE_DEFS){let a=t.roster.filter(p=>role.eligible.includes(p.pos)).map(p=>({p,f:roleFit(p,t,role,useScout)})).sort((x,y)=>y.f-x.f).map(x=>x.p);if(role.base){let fresh=a.filter(p=>!used.has(p.id)),rest=a.filter(p=>used.has(p.id));a=[...fresh,...rest];if(a[0])used.add(a[0].id)}out[role.id]=a.map(p=>p.id)}return out}
function ensureRoleDepth(t){t.roleDepth??=makeRoleDepth(t,false);for(const role of ROLE_DEFS){let valid=new Set(t.roster.filter(p=>role.eligible.includes(p.pos)).map(p=>p.id)),arr=(t.roleDepth[role.id]||[]).filter(id=>valid.has(id));for(const p of t.roster.filter(p=>role.eligible.includes(p.pos)))if(!arr.includes(p.id))arr.push(p.id);t.roleDepth[role.id]=arr}}
function rolePlayers(t,id){if(!t.roleDepth||!t.roleDepth[id])ensureRoleDepth(t);let role=ROLE_BY_ID[id],by=new Map(t.roster.filter(p=>role?.eligible.includes(p.pos)).map(p=>[p.id,p]));return (t.roleDepth[id]||[]).map(x=>by.get(x)).filter(Boolean)}
function roleStarter(t,id){let a=rolePlayers(t,id),ready=a.filter(gameAvailable);return ready.find(p=>weeklyPlayerPlan(p)?.role!=='limited')||ready[0]||a[0]||null}
function autoRoleDepth(t,useScout=false){t.roleDepth=makeRoleDepth(t,useScout)}
function autoRedshirts(t){for(const p of t.roster){p.redshirtActive??=false;if(canRedshirt(p)&&eligibilityBase(p)===0&&(p.role==='Redshirt candidate'||p.perceived<68))p.redshirtActive=true}}
function toggleRedshirt(id){let f=findPlayer(id);if(!f?.active)return;let p=f.p;if(p.redshirtActive){p.redshirtActive=false;render();return}if(!canRedshirt(p)){setStatus(`${p.name} is no longer redshirt-eligible this season.`);return}p.redshirtActive=true;render()}
function makePipelines(s){let o={};for(const c of [...new Set(schools.map(x=>x.conference))])o[c]=clamp(Math.round((c===s.conference?76:28)+gauss()*(c===s.conference?8:10)),5,95);return o}
function pipelineStrength(t,region){return clamp(Math.round((t.pipelines&&t.pipelines[region])??(t.conference===region?72:25)),0,100)}
function conditionRating(p){if(!p||(p.injuryWeeks||0)>0)return 0;return clamp(p.trueNow-(p.wear||0)*.08-(100-(p.health??100))*.12,20,99)}
function healthText(p){if((p.injuryWeeks||0)>0)return `${p.injury||'Injured'} · ${p.injuryWeeks} wk`;if((p.health??100)<78)return `Limited · ${p.health}%`;return `Ready · ${p.health??100}%`}
function depthUtility(p,t,useScout=false){const base=useScout?p.perceived:conditionRating(p);return base*.82+playerSchemeFit(p,t)*.18}
function makeDepthChart(t,useScout=false){let d={};for(const pos of POS)d[pos]=t.roster.filter(p=>p.pos===pos).sort((a,b)=>depthUtility(b,t,useScout)-depthUtility(a,t,useScout)).map(p=>p.id);return d}
function ensureDepth(t){t.depthChart??=makeDepthChart(t,false);for(const pos of POS){let valid=new Set(t.roster.filter(p=>p.pos===pos).map(p=>p.id));t.depthChart[pos]=(t.depthChart[pos]||[]).filter(id=>valid.has(id));for(const p of t.roster.filter(p=>p.pos===pos))if(!t.depthChart[pos].includes(p.id))t.depthChart[pos].push(p.id)}}
function orderedAt(t,pos){if(!t.depthChart||!t.depthChart[pos])ensureDepth(t);let by=new Map(t.roster.filter(p=>p.pos===pos).map(p=>[p.id,p]));return (t.depthChart[pos]||[]).map(id=>by.get(id)).filter(Boolean)}
function rotationAt(t,pos,n){let a=orderedAt(t,pos).filter(gameAvailable);return a[n]||null}
function autoDepthTeam(t,useScout=false){t.depthChart=makeDepthChart(t,useScout);autoRoleDepth(t,useScout)}
// v0.9.0: promises are first-season obligations, resolved once before rollover.
const PROMISE_TYPES={'Early Role':'EARLY_ROLE','Position Lock':'POSITION_LOCK','No Redshirt':'NO_REDSHIRT','Development Plan':'DEVELOPMENT_PLAN','NIL Priority':'NIL_PRIORITY'};
function promiseLabel(type){return Object.keys(PROMISE_TYPES).find(k=>PROMISE_TYPES[k]===type)||type}
function promiseState(){universe.events??=[];universe.transferPortal??=[];universe.coachArchive??=[];universe.nextPromiseId??=1;universe.nextEventId??=1;universe.nextCoachId??=1}
function normalizePromiseState(){
 promiseState();
 const coaches=[...universe.teams.flatMap(t=>Object.values(t.staff||{})),...universe.coachArchive],ids=new Set(coaches.map(c=>c.id).filter(Boolean));
 for(const t of universe.teams){for(const c of Object.values(t.staff||{})){if(!c.id){do{c.id=`C${universe.nextCoachId++}`}while(ids.has(c.id));ids.add(c.id)}c.schoolId=t.id}
  for(const p of t.roster){p.promises??=[];p.transferHistory??=[];p.currentSchoolId=t.id;p.staffTrust??=70;p.coachRelationships??={};let rm=p.recruitingMemory;if(rm?.recruiterCoachId&&p.coachRelationships[rm.recruiterCoachId]==null)p.coachRelationships[rm.recruiterCoachId]=clamp(rm.relationship||50,20,100);p.primaryRecruiterCoachId??=rm?.primaryRecruiterCoachId||rm?.recruiterCoachId||null;
   // Old saves did not retain terms, ownership or dates. Preserve the label,
   // but never invent a breach (or a coach) from missing historical evidence.
   if(p.promise&&p.promise!=='None'&&!p.promises.length)p.promises.push({id:uid(),type:PROMISE_TYPES[p.promise]||p.promise,status:'LEGACY',notes:['Legacy promise: original terms were not recorded; no retroactive penalty.']});
  }
 }
 // Counters may be absent in imported snapshots; existing IDs always win.
 for(const p of universe.teams.flatMap(t=>t.roster))for(const q of p.promises||[]){const n=/^PR_(\d+)$/.exec(q.id);if(n)universe.nextPromiseId=Math.max(universe.nextPromiseId,+n[1]+1)}
 for(const e of universe.events){const pr=/^PR_(\d+)$/.exec(e.metadata?.promiseId);if(pr)universe.nextPromiseId=Math.max(universe.nextPromiseId,+pr[1]+1);const n=/^EVT_(\d+)$/.exec(e.id);if(n)universe.nextEventId=Math.max(universe.nextEventId,+n[1]+1)}
 normalizeCoachState();
}
function addDynastyEvent(type,p,t,q,metadata={}){
 promiseState();const order=universe.nextEventId++;
 const e={id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,type,importance:type==='PROMISE_BROKEN'?70:35,schoolIds:[t.id],playerIds:[p.id],coachIds:q.coachId?[q.coachId]:[],recruitIds:q.recruitId?[q.recruitId]:[],gameIds:[],summary:`${p.name}: ${promiseLabel(q.type)} — ${q.status.toLowerCase()}.`,metadata:{promiseId:q.id,...metadata}};
 universe.events.push(e);return e;
}
function setRecruitPromise(r,label,t=selected()){
 if(r.committed)return;
 r.promise=label;
 r.promiseOffer=label==='None'?null:{type:PROMISE_TYPES[label],schoolId:t.id,coachId:t.staff.RC.id,coachName:t.staff.RC.name,seasonMade:universe.year,madeWeek:universe.week,targetPosition:r.pos,expectedGames:8,expectedFocus:'Technique'};
}
function recruitPromiseBoost(r,t){const q=r.promiseOffer;return q?.schoolId===t.id?(r.priority===r.promise?8:4):0}
function signPlayerPromise(p,r,t){
 p.promises=[];p.currentSchoolId=t.id;p.staffTrust=70;
 const offer=r.signedPromise;if(!offer||offer.schoolId!==t.id){p.promise=null;return}
 promiseState();const q={...offer,id:`PR_${universe.nextPromiseId++}`,recruitId:r.id,firstSeason:universe.year+1,status:offer.type==='NIL_PRIORITY'?'PASSIVE':'ACTIVE',resolvedSeason:null,result:null,severity:0,notes:[],trainingPhases:[]};
 p.promises.push(q);p.promise=promiseLabel(q.type);addDynastyEvent('PROMISE_MADE',p,t,q);
}
function recordPromiseTraining(p,phase){for(const q of p.promises||[])if(q.status==='ACTIVE'&&q.type==='DEVELOPMENT_PLAN'&&q.firstSeason===universe.year&&p.trainingFocus===q.expectedFocus&&!(q.trainingPhases??=[]).includes(phase))q.trainingPhases.push(phase)}
function recordPromisePositionChange(p,to,requested=false){for(const q of p.promises||[])if(q.status==='ACTIVE'&&q.type==='POSITION_LOCK'&&q.firstSeason<=universe.year&&to!==q.targetPosition){if(requested)q.playerRequestedChange=true;else q.positionChanged=true}}
function promiseInjuryWeeks(p,year){const missed=new Set();for(const i of p.injuryHistory||[])if(i.year===year)for(let w=i.week+1;w<=Math.min(12,i.week+i.weeks);w++)missed.add(w);return missed.size}
function auditPlayerPromises(p,t){
 for(const q of p.promises||[]){
  if(q.status!=='ACTIVE'||q.firstSeason!==universe.year||q.schoolId!==t.id)continue;
  const games=p.stats?.games||0,missed=promiseInjuryWeeks(p,universe.year);let status='FULFILLED',severity=0,result='';
  if(q.type==='EARLY_ROLE'){
   const expected=Math.min(q.expectedGames,Math.max(0,12-missed));
   status=games>=expected?'FULFILLED':games>=Math.ceil(expected/2)?'PARTIAL':'BROKEN';
   severity=status==='FULFILLED'?0:1-games/Math.max(1,expected);
   result=`${games} appearances; ${expected} required${missed?` after ${missed} injury weeks`:''}.`;
  }else if(q.type==='NO_REDSHIRT'){
   const redshirt=p.redshirtActive&&canRedshirt(p)&&games<=4;
   status=redshirt&&missed<4?'BROKEN':'FULFILLED';severity=status==='BROKEN'?1:0;
   result=redshirt?(missed>=4?'Injury exception: at least four regular-season weeks missed.':'Redshirt taken despite the promise.'):'No redshirt taken.';
  }else if(q.type==='POSITION_LOCK'){
   status=!q.playerRequestedChange&&(q.positionChanged||p.pos!==q.targetPosition)?'BROKEN':'FULFILLED';severity=status==='BROKEN'?1:0;
   result=q.playerRequestedChange?'Player-requested change honored.':`Promised ${q.targetPosition}; current position ${p.pos}${q.positionChanged?'; position was changed':''}.`;
  }else if(q.type==='DEVELOPMENT_PLAN'){
   const n=(q.trainingPhases||[]).length;status=n===2?'FULFILLED':n===1?'PARTIAL':'BROKEN';severity=1-n/2;
   result=`${q.expectedFocus} provided in ${n}/2 development camps.`;
  }else continue;
  q.status=status;q.resolvedSeason=universe.year;q.result=result;q.severity=severity;
  const reaction=Math.round(18*severity*(.8+(100-(p.composure??65))/200));
  p.morale=clamp(p.morale+(severity?-reaction:2),15,99);p.staffTrust=clamp((p.staffTrust??70)+(severity?-reaction:2),0,100);
  q.transferPenalty=Math.round(18*severity);addDynastyEvent(`PROMISE_${status}`,p,t,q,{games,missedInjuryWeeks:missed,result});
 }
}
function auditPromises(){for(const t of universe.teams)for(const p of t.roster)auditPlayerPromises(p,t)}
const COACH_SLOT_ROLES={HC:'Head Coach',OC:'Offensive Coordinator',DC:'Defensive Coordinator',RC:'Recruiting Coordinator',SC:'Strength & Performance'};
function coachSlot(t,c){return Object.entries(t?.staff||{}).find(([,x])=>x?.id===c?.id)?.[0]||Object.keys(COACH_SLOT_ROLES).find(k=>COACH_SLOT_ROLES[k]===c?.role)||null}
function coachSchemeIdentity(role,t){if(!t)return'Unknown';if(role==='Offensive Coordinator')return t.offScheme||'Unknown offense';if(role==='Defensive Coordinator')return t.defScheme||'Unknown defense';if(role==='Head Coach')return `${t.offScheme||'Unknown offense'} / ${t.defScheme||'Unknown defense'}`;if(role==='Recruiting Coordinator')return `${t.conference||'National'} recruiting`;return'Performance program'}
function coachSpecialties(c){const rows=[['Recruiting',c.recruiting],['Development',c.development],['Evaluation',c.evaluation],['Play calling',c.playCall],['Adaptability',c.adaptability]].sort((a,b)=>(b[1]||0)-(a[1]||0));return rows.slice(0,2).map(x=>`${x[0]} specialist`)}
function coachTraitText(c){let out=[];if((c.ambition||0)>=82)out.push('Highly ambitious');else if((c.ambition||0)<=45)out.push('Content in role');if((c.loyalty||0)>=82)out.push('Program loyalist');else if((c.loyalty||0)<=42)out.push('Open to movement');if((c.adaptability||0)>=84)out.push('Flexible tactician');return out.slice(0,2).join(' · ')||'Steady career profile'}
function coachById(id){if(!id)return null;for(const t of universe.teams||[])for(const [slot,c] of Object.entries(t.staff||{}))if(c?.id===id)return{coach:c,team:t,slot,active:true};const c=(universe.coachArchive||[]).find(x=>x.id===id);return c?{coach:c,team:null,slot:null,active:false}:null}
function ensureCoachCareer(c,t=null,slot=null){if(!c)return c;c.careerHistory??=[];c.seasons??=[];c.specialties=(c.specialties?.length?c.specialties:coachSpecialties(c));const role=COACH_SLOT_ROLES[slot]||c.role||'Coach',archived=c.status==='RETIRED'||c.status==='DEPARTED'||c.leftSeason!=null;if(t){c.schoolId=t.id;c.schoolName=t.name}c.status??=archived?'DEPARTED':'ACTIVE';if(!c.careerHistory.length){const end=archived?(c.leftSeason??universe.year):null,start=Math.max(2027,(end??universe.year)-Math.max(0,c.years||0));c.careerHistory.push({schoolId:c.schoolId??t?.id??null,schoolName:c.schoolName??t?.name??'Unknown',role,startSeason:start,endSeason:end,reasonEnded:archived?(c.departureReason||'Legacy departure'):null,scheme:coachSchemeIdentity(role,t),wins:0,losses:0,conferenceTitles:0,nationalTitles:0,awards:[],legacy:true})}if(t&&!archived){let cur=c.careerHistory.findLast?.(s=>s.endSeason==null)||c.careerHistory.slice().reverse().find(s=>s.endSeason==null);if(!cur){cur={schoolId:t.id,schoolName:t.name,role,startSeason:universe.year,endSeason:null,reasonEnded:null,scheme:coachSchemeIdentity(role,t),wins:0,losses:0,conferenceTitles:0,nationalTitles:0,awards:[]};c.careerHistory.push(cur)}c.status='ACTIVE';c.role=role;c.schoolId=t.id;c.schoolName=t.name}return c}
function normalizeCoachState(){promiseState();universe.openings??=[];universe.candidateMarket??={};
 for(const t of universe.teams){t.schemeTransition??={off:null,def:null};for(const [slot,c] of Object.entries(t.staff||{}))ensureCoachScheme(c,slot,t)}let used=new Set([...universe.teams.flatMap(t=>Object.values(t.staff||{})),...(universe.coachArchive||[])].map(c=>c?.id).filter(Boolean)),nextId=()=>{let id;do{id=`C${universe.nextCoachId++}`}while(used.has(id));used.add(id);return id};for(const t of universe.teams)for(const [slot,c] of Object.entries(t.staff||{})){if(!c.id)c.id=nextId();c.status='ACTIVE';delete c.leftSeason;delete c.departureReason;ensureCoachCareer(c,t,slot)}const active=new Set(universe.teams.flatMap(t=>Object.values(t.staff||{}).map(c=>c.id))),unique=new Map();for(const c of universe.coachArchive||[]){if(!c.id)c.id=nextId();if(active.has(c.id))continue;c.status=c.status==='RETIRED'?'RETIRED':'DEPARTED';const t=universe.teams.find(x=>x.id===c.schoolId)||universe.teams.find(x=>x.name===c.schoolName)||null;ensureCoachCareer(c,t,coachSlot(t,c));let cur=c.careerHistory?.find(s=>s.endSeason==null);if(cur){cur.endSeason=c.leftSeason??universe.year;cur.reasonEnded=c.departureReason||'Departed program'}unique.set(c.id,c)}universe.coachArchive=[...unique.values()]}
function recordCoachSeason(t){const year=universe.year,coy=(universe.awards?.[year]||[]).find(a=>a.name==='Coach of the Year')?.playerName;for(const [slot,c] of Object.entries(t.staff||{})){ensureCoachCareer(c,t,slot);if(c.seasons.some(s=>s.year===year&&s.schoolId===t.id&&s.role===c.role))continue;const row={year,schoolId:t.id,schoolName:t.name,role:c.role,scheme:coachSchemeIdentity(c.role,t),wins:t.w,losses:t.l,conferenceTitle:!!t.champ,nationalTitle:universe.champion===t.name,coachOfYear:slot==='HC'&&coy===c.name};c.seasons.push(row);const st=c.careerHistory.slice().reverse().find(s=>s.endSeason==null);if(st){st.wins=(st.wins||0)+t.w;st.losses=(st.losses||0)+t.l;st.conferenceTitles=(st.conferenceTitles||0)+(row.conferenceTitle?1:0);st.nationalTitles=(st.nationalTitles||0)+(row.nationalTitle?1:0);if(row.coachOfYear&&!st.awards.includes('Coach of the Year'))st.awards.push('Coach of the Year');st.scheme=row.scheme}}}
function closeCoachStint(c,t,endSeason=universe.year,reason='Departed program'){ensureCoachCareer(c,t,coachSlot(t,c));const st=c.careerHistory.slice().reverse().find(s=>s.endSeason==null);if(st){st.endSeason=Math.max(st.startSeason,endSeason);st.reasonEnded=reason}return st}
function openCoachStint(c,t,slot,startSeason=universe.year,reason='New job'){c.careerHistory??=[];const open=c.careerHistory.slice().reverse().find(s=>s.endSeason==null);if(open)closeCoachStint(c,t,startSeason-1,reason);c.role=COACH_SLOT_ROLES[slot]||c.role;c.schoolId=t.id;c.schoolName=t.name;c.status='ACTIVE';delete c.leftSeason;delete c.departureReason;c.careerHistory.push({schoolId:t.id,schoolName:t.name,role:c.role,startSeason,endSeason:null,reasonStarted:reason,reasonEnded:null,scheme:coachSchemeIdentity(c.role,t),wins:0,losses:0,conferenceTitles:0,nationalTitles:0,awards:[]});c.specialties=coachSpecialties(c);return c}
function archiveCoach(c,t,reason='Departed program',status='DEPARTED',endSeason=universe.year){if(!c)return null;ensureCoachCareer(c,t,coachSlot(t,c));closeCoachStint(c,t,endSeason,reason);c.status=status;c.leftSeason=endSeason;c.departureReason=reason;c.schoolId=t.id;c.schoolName=t.name;const copy=JSON.parse(JSON.stringify(c)),i=(universe.coachArchive||[]).findIndex(x=>x.id===c.id);if(i>=0)universe.coachArchive[i]=copy;else universe.coachArchive.push(copy);return copy}
function rememberCoach(c,t){promiseState();ensureCoachCareer(c,t,coachSlot(t,c));if(!universe.coachArchive.some(x=>x.id===c.id))universe.coachArchive.push({...JSON.parse(JSON.stringify(c)),schoolId:t.id,schoolName:t.name,leftSeason:universe.year})}
function addCoachEvent(type,c,fromTeam=null,toTeam=null,metadata={},summary=null){promiseState();const order=universe.nextEventId++,schools=[...new Set([fromTeam?.id,toTeam?.id].filter(x=>x!=null))],e={id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,type,importance:['COACH_FIRED','COACH_RETIRED','COACH_MOVED','COACH_PROMOTED'].includes(type)?65:45,schoolIds:schools,playerIds:[],coachIds:[c.id],recruitIds:[],gameIds:[],summary:summary||`${c.name}: ${type.replaceAll('_',' ').toLowerCase()}.`,metadata};universe.events.push(e);return e}
function applyCoachRelationshipChange(c,from,to=null,reason='Coach departure'){
 promiseState();if(!c||!from)return{recruitsAffected:0,playersAffected:0,strongestRelationship:0};
 const key=`${c.id}|${universe.year}|${from.id}|${to?.id??'none'}`,existing=(universe.events||[]).find(e=>e.type==='COACH_RELATIONSHIP_FALLOUT'&&e.metadata?.key===key);if(existing)return existing.metadata;
 let recruitsAffected=0,playersAffected=0,strongestRelationship=0,maxPressure=0;
 for(const r of universe.recruits||[]){ensureRecruitRelationships(r);if(r.committed&&r.committed!==from.name)continue;const primary=r.primaryRecruiterCoachId===c.id;let rel=coachRelationshipValue(r,c.id,0);if(primary)rel=Math.max(rel,50);if(!primary&&rel<55)continue;const strength=clamp(Math.round(Math.max(0,rel-20)*coachRelationshipPortability(c,r)),0,70);if(!strength)continue;strongestRelationship=Math.max(strongestRelationship,rel);maxPressure=Math.max(maxPressure,strength);if(to){r.coachMovePressure??={};r.coachMovePressure[to.id]=Math.max(r.coachMovePressure[to.id]||0,strength)}if(r.committed===from.name)r.coachDeparturePressure={coachId:c.id,coachName:c.name,fromSchoolId:from.id,fromSchoolName:from.name,toSchoolId:to?.id??null,toSchoolName:to?.name??null,season:universe.year,strength,reason};recruitsAffected++}
 for(const p of from.roster||[]){p.coachRelationships??={};const primary=p.primaryRecruiterCoachId===c.id||p.recruitingMemory?.recruiterCoachId===c.id;let rel=coachRelationshipValue(p,c.id,0);if(primary)rel=Math.max(rel,p.recruitingMemory?.relationship||50);if(!primary&&rel<50)continue;const strength=clamp(Math.round(Math.max(0,rel-20)*coachRelationshipPortability(c,p)),0,70);if(!strength)continue;strongestRelationship=Math.max(strongestRelationship,rel);maxPressure=Math.max(maxPressure,strength);if(!p.coachDeparturePressure||strength>=(p.coachDeparturePressure.strength||0))p.coachDeparturePressure={coachId:c.id,coachName:c.name,fromSchoolId:from.id,fromSchoolName:from.name,toSchoolId:to?.id??null,toSchoolName:to?.name??null,season:universe.year,strength,reason};playersAffected++}
 const order=universe.nextEventId++,metadata={key,coachId:c.id,coachName:c.name,fromSchoolId:from.id,fromSchoolName:from.name,toSchoolId:to?.id??null,toSchoolName:to?.name??null,recruitsAffected,playersAffected,strongestRelationship,maxPressure,reason};
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,type:'COACH_RELATIONSHIP_FALLOUT',importance:Math.min(80,45+recruitsAffected*2+playersAffected),schoolIds:[...new Set([from.id,to?.id].filter(x=>x!=null))],playerIds:[],coachIds:[c.id],recruitIds:[],gameIds:[],summary:`${c.name} relationship fallout after leaving ${from.name}${to?` for ${to.name}`:''}.`,metadata});return metadata
}
function coachFalloutHubItems(t){if(!t)return[];return (universe.events||[]).filter(e=>e.type==='COACH_RELATIONSHIP_FALLOUT'&&e.schoolIds.includes(t.id)&&e.season>=universe.year-1&&((e.metadata?.recruitsAffected||0)+(e.metadata?.playersAffected||0)>0)&&(universe.week<=2||e.season===universe.year)).slice(-2).reverse().map(e=>{const m=e.metadata||{},source=m.fromSchoolId===t.id;return{type:'alert',tab:'staff',kicker:source?'RECRUITING FALLOUT':'COACH ARRIVAL',importance:e.importance,main:source?`${m.coachName} left ${m.fromSchoolName}`:`${m.coachName} arrived with existing relationships`,sub:`${m.recruitsAffected||0} recruit/incoming ties · ${m.playersAffected||0} current-player ties${m.toSchoolName?` · ${m.toSchoolName} gains pressure`:''}`}})}
function startGeneratedCoach(t,slot,startSeason=universe.year+1,reason='Staff replacement'){const c=generateCoach(COACH_SLOT_ROLES[slot],t,0);openCoachStint(c,t,slot,startSeason,reason);t.staff[slot]=c;applyCoachScheme(c,slot,t,reason);return c}
function replaceStaffCoach(t,slot,reason='Staff change',status='DEPARTED',startSeason=universe.year+1){const old=t.staff[slot];applyCoachRelationshipChange(old,t,null,reason);archiveCoach(old,t,reason,status,universe.year);const fresh=startGeneratedCoach(t,slot,startSeason,reason);t.staff[slot]=fresh;const type=status==='RETIRED'?'COACH_RETIRED':status==='FIRED'?'COACH_FIRED':'COACH_DEPARTED';addCoachEvent(type,old,t,null,{role:old.role,replacementCoachId:fresh.id,reason},`${old.name} ${status==='FIRED'?'was fired by':status==='RETIRED'?'retired from':'left'} ${t.name}; ${fresh.name} takes over as ${fresh.role}.`);return{old,fresh}}
function promoteCoachWithinTeam(t,fromSlot,toSlot='HC',reason='Internal promotion',displacedStatus='DEPARTED'){const promoted=t.staff[fromSlot],displaced=t.staff[toSlot],next=universe.year+1;applyCoachRelationshipChange(displaced,t,null,reason);archiveCoach(displaced,t,reason,displacedStatus,universe.year);addCoachEvent(displacedStatus==='RETIRED'?'COACH_RETIRED':displacedStatus==='FIRED'?'COACH_FIRED':'COACH_DEPARTED',displaced,t,null,{role:displaced.role,reason});closeCoachStint(promoted,t,universe.year,'Promoted internally');t.staff[toSlot]=promoted;openCoachStint(promoted,t,toSlot,next,reason);t.staff[fromSlot]=startGeneratedCoach(t,fromSlot,next,'Vacancy after internal promotion');addCoachEvent('COACH_PROMOTED',promoted,t,t,{fromRole:COACH_SLOT_ROLES[fromSlot],toRole:COACH_SLOT_ROLES[toSlot],reason},`${promoted.name} promoted from ${COACH_SLOT_ROLES[fromSlot]} to ${COACH_SLOT_ROLES[toSlot]} at ${t.name}.`);return promoted}
function moveCoach(c,from,to,toSlot,reason='Accepted new job'){const fromSlot=coachSlot(from,c);if(!fromSlot||!to?.staff?.[toSlot])return null;const displaced=to.staff[toSlot],next=universe.year+1;applyCoachRelationshipChange(displaced,to,null,`Replaced by ${c.name}`);applyCoachRelationshipChange(c,from,to,reason);archiveCoach(displaced,to,`Replaced by ${c.name}`,'DEPARTED',universe.year);addCoachEvent('COACH_DEPARTED',displaced,to,null,{role:displaced.role,reason:'Replaced'});closeCoachStint(c,from,universe.year,reason);from.staff[fromSlot]=startGeneratedCoach(from,fromSlot,next,'Vacancy after coach departure');to.staff[toSlot]=c;openCoachStint(c,to,toSlot,next,reason);applyCoachScheme(c,toSlot,to,reason);addCoachEvent('COACH_MOVED',c,from,to,{fromRole:COACH_SLOT_ROLES[fromSlot],toRole:COACH_SLOT_ROLES[toSlot],reason},`${c.name}: ${from.name} ${COACH_SLOT_ROLES[fromSlot]} → ${to.name} ${COACH_SLOT_ROLES[toSlot]}.`);return c}
function retireCoach(t,slot,reason='Retired from coaching'){const c=t.staff[slot];replaceStaffCoach(t,slot,reason,'RETIRED',universe.year+1);return c}
function coachRetirementChance(c){const a=c?.age||0;return a>=72?.18:a>=68?.07:a>=65?.025:0}
function coachCareerTotals(c){const seasons=c.seasons||[];return{wins:seasons.reduce((n,s)=>n+(s.wins||0),0),losses:seasons.reduce((n,s)=>n+(s.losses||0),0),conferenceTitles:seasons.filter(s=>s.conferenceTitle).length,nationalTitles:seasons.filter(s=>s.nationalTitle).length,coachAwards:seasons.filter(s=>s.coachOfYear).length,seasons:seasons.length}}
const coachEscape=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function coachProfileHTML(c){const totals=coachCareerTotals(c),stints=(c.careerHistory||[]).slice().reverse(),seasons=(c.seasons||[]).slice().reverse().slice(0,12);return `<div class="profile-grid"><div class="profile-stat"><div class="small muted">Career record</div><div class="v">${totals.wins}–${totals.losses}</div></div><div class="profile-stat"><div class="small muted">Seasons tracked</div><div class="v">${totals.seasons}</div></div><div class="profile-stat"><div class="small muted">Conference titles</div><div class="v">${totals.conferenceTitles}</div></div><div class="profile-stat"><div class="small muted">National titles</div><div class="v">${totals.nationalTitles}</div></div></div><div class="two-col"><div><h3>Career profile</h3><div class="lineitem"><span>Specialties</span><strong>${coachEscape((c.specialties||coachSpecialties(c)).join(' · '))}</strong></div><div class="lineitem"><span>Career traits</span><strong>${coachEscape(coachTraitText(c))}</strong></div><div class="lineitem"><span>Coach of the Year</span><strong>${totals.coachAwards}</strong></div></div><div><h3>Recent seasons</h3>${seasons.length?seasons.map(s=>`<div class="lineitem"><span>${s.year} · ${coachEscape(s.schoolName)} · ${coachEscape(s.role)}</span><strong>${s.wins}–${s.losses}${s.nationalTitle?' · National title':s.conferenceTitle?' · Conf title':''}</strong></div>`).join(''):'<div class="muted">No completed seasons tracked yet.</div>'}</div></div><h3 style="margin-top:14px">Career timeline</h3><div class="timeline">${stints.map(s=>`<div class="timeline-row"><strong>${coachEscape(s.startSeason)}${s.endSeason?`–${coachEscape(s.endSeason)}`:'–present'} · ${coachEscape(s.schoolName)} · ${coachEscape(s.role)}</strong><div>${s.wins||0}–${s.losses||0}${s.nationalTitles?` · ${s.nationalTitles} national title${s.nationalTitles===1?'':'s'}`:''}${s.conferenceTitles?` · ${s.conferenceTitles} conference title${s.conferenceTitles===1?'':'s'}`:''}</div><div class="small muted">${coachEscape(s.scheme||'Scheme not recorded')}${s.reasonEnded?` · ${coachEscape(s.reasonEnded)}`:''}${s.legacy?' · legacy tenure begins at dynasty start':''}</div></div>`).join('')}</div>`}
function showCoachProfile(id){const found=coachById(id);if(!found)return;const c=found.coach,t=found.team;$('#coachDialogName').textContent=c.name;$('#coachDialogMeta').textContent=`Age ${c.age} · ${c.role} · ${found.active?(t?.name||c.schoolName):c.status==='RETIRED'?'Retired':`Formerly ${c.schoolName||'in the dynasty'}`}`;$('#coachDialogBody').innerHTML=coachProfileHTML(c);const d=$('#coachDialog');if(d.showModal)d.showModal();else d.setAttribute('open','')}
function renderCoachHistory(t){const current=new Set(Object.values(t.staff||{}).map(c=>c.id)),rows=(universe.coachArchive||[]).filter(c=>!current.has(c.id)&&(c.careerHistory||[]).some(s=>s.schoolId===t.id)).sort((a,b)=>Math.max(...(b.careerHistory||[]).map(s=>s.endSeason||9999))-Math.max(...(a.careerHistory||[]).map(s=>s.endSeason||9999))).slice(0,12);$('#coachHistoryList').innerHTML=rows.length?rows.map(c=>{const last=(c.careerHistory||[]).filter(s=>s.schoolId===t.id).at(-1),tot=coachCareerTotals(c);return `<div class="lineitem"><span><button class="player-button" data-coach="${coachEscape(c.id)}">${coachEscape(c.name)}</button> · ${coachEscape(last?.role||c.role)}</span><span>${tot.wins}–${tot.losses} career · ${coachEscape(c.status||'Departed')}</span></div>`}).join(''):'<span class="muted">Former coaches will appear as the carousel develops.</span>'}
function attachCoachLinks(){$$('[data-coach]').forEach(b=>{const open=()=>showCoachProfile(b.dataset.coach);b.onclick=open;b.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open()}}})}
// v0.9.6: coaching market. AI teams still auto-fill instantly (unchanged carousel behavior);
// only the controlled team's vacancies become an Opening the user works through.
function teamStaffBaseline(t){return ['Head Coach','Offensive Coordinator','Defensive Coordinator','Recruiting Coordinator','Strength & Performance'].reduce((s,role)=>s+(0.35+t.resources/35+t.prestige/45+(role==='Head Coach'?2.4:role.includes('Coordinator')?0.9:0)),0)}
function teamStaffBudget(t){return Math.round(teamStaffBaseline(t)*1.15*10)/10}
function teamStaffSpend(t){return Math.round(Object.values(t.staff||{}).reduce((s,c)=>s+(c.salary||0),0)*10)/10}
function candidateAskSalary(base,ambition){return Math.round(base*(0.85+(ambition||60)/500)*10)/10}
function candidateFitScore(t,slot,c){const base=c.recruiting*.22+c.development*.22+c.evaluation*.18+c.playCall*.20+c.adaptability*.18,need=slot==='RC'?t.nil*.05:slot==='HC'?t.prestige*.04:t.development*.04;return Math.round(base+need)}
function freshCandidate(t,slot){const c=generateCoach(COACH_SLOT_ROLES[slot],t,gi(0,9));return {candidateId:`CAND_${c.id}`,source:'fresh',coachId:null,name:c.name,age:c.age,recruiting:c.recruiting,development:c.development,evaluation:c.evaluation,playCall:c.playCall,adaptability:c.adaptability,ambition:c.ambition,loyalty:c.loyalty,specialties:c.specialties||coachSpecialties(c),askSalary:candidateAskSalary(c.salary,c.ambition),askYears:gi(2,5),wantsAuthority:c.ambition>=70?'full':'shared',fitScore:candidateFitScore(t,slot,c)}}
function internalCandidates(t,slot){if(slot!=='HC')return[];return ['OC','DC'].map(s=>t.staff[s]).filter(Boolean).map(c=>({candidateId:`CAND_${c.id}`,source:'internal',coachId:c.id,fromSlot:coachSlot(t,c),name:c.name,age:c.age,recruiting:c.recruiting,development:c.development,evaluation:c.evaluation,playCall:c.playCall,adaptability:c.adaptability,ambition:c.ambition,loyalty:c.loyalty,specialties:c.specialties||coachSpecialties(c),askSalary:Math.round(candidateAskSalary(c.salary,c.ambition)*1.15*10)/10,askYears:gi(3,5),wantsAuthority:'full',fitScore:candidateFitScore(t,'HC',c)+8}))}
function externalCandidates(t,slot,n=2){const eligibleRoles=slot==='HC'?['HC','OC','DC']:[slot];let pool=[];for(const other of universe.teams){if(other.id===t.id)continue;for(const [oslot,c] of Object.entries(other.staff||{})){if(!eligibleRoles.includes(oslot)||c.interim||(c.ambition||0)<58)continue;pool.push({c,other,oslot})}}pool=pool.map(x=>({...x,score:candidateFitScore(t,slot,x.c)+((x.c.ambition||60)-60)*.3+gauss()*4})).sort((a,b)=>b.score-a.score).slice(0,Math.max(n*3,6));return sample(pool,n).map(x=>{const c=x.c;return {candidateId:`CAND_${c.id}`,source:'external',coachId:c.id,fromSlot:x.oslot,fromSchoolId:x.other.id,fromSchoolName:x.other.name,name:c.name,age:c.age,recruiting:c.recruiting,development:c.development,evaluation:c.evaluation,playCall:c.playCall,adaptability:c.adaptability,ambition:c.ambition,loyalty:c.loyalty,specialties:c.specialties||coachSpecialties(c),askSalary:candidateAskSalary(c.salary,c.ambition),askYears:gi(2,4),wantsAuthority:c.ambition>=70?'full':'shared',fitScore:candidateFitScore(t,slot,c)}})}
function generateCandidatePool(t,slot){return [freshCandidate(t,slot),freshCandidate(t,slot),...internalCandidates(t,slot),...externalCandidates(t,slot,2)].map(c=>({...c,interviewed:false,status:'AVAILABLE'}))}
function createOpening(t,slot,reason,status='DEPARTED'){
 universe.openings??=[];universe.candidateMarket??={};
 const current=t.staff[slot],existing=universe.openings.find(o=>o.schoolId===t.id&&o.slot===slot&&o.status==='OPEN');
 if(current&&!current.interim){applyCoachRelationshipChange(current,t,null,reason);archiveCoach(current,t,reason,status,universe.year);addCoachEvent(status==='RETIRED'?'COACH_RETIRED':status==='FIRED'?'COACH_FIRED':'COACH_DEPARTED',current,t,null,{role:current.role,reason})}
 const interim=generateCoach(COACH_SLOT_ROLES[slot],t,0);interim.interim=true;
 for(const k of ['recruiting','development','evaluation','playCall','adaptability'])interim[k]=clamp(Math.round(interim[k]*.82),20,90);
 interim.salary=Math.round((interim.salary||1.2)*.5*10)/10;
 openCoachStint(interim,t,slot,universe.year,'Interim appointment');
 t.staff[slot]=interim;
 if(existing){existing.reason=reason;existing.seasonOpened=universe.year;existing.interimCoachId=interim.id;universe.candidateMarket[existing.id]=generateCandidatePool(t,slot);return existing}
 const id=`OPEN_${t.id}_${slot}_${universe.year}`,o={id,schoolId:t.id,schoolName:t.name,slot,role:COACH_SLOT_ROLES[slot],reason,seasonOpened:universe.year,status:'OPEN',interimCoachId:interim.id};
 universe.openings.push(o);universe.candidateMarket[id]=generateCandidatePool(t,slot);return o
}
function interviewCandidate(openingId,candidateId){const cand=(universe.candidateMarket?.[openingId]||[]).find(c=>c.candidateId===candidateId);if(!cand||cand.status!=='AVAILABLE')return null;cand.interviewed=true;return cand}
function candidateAcceptChance(cand,offer){let chance=.35+((cand.fitScore||60)-55)/140;chance+=cand.interviewed?.12:0;const salaryRatio=offer.salary/(cand.askSalary||1);chance+=clamp((salaryRatio-1)*.6,-.35,.35);if(offer.years<Math.min(2,cand.askYears||2))chance-=.15;if(offer.authority==='full'&&cand.wantsAuthority==='full')chance+=.08;if(offer.authority==='shared'&&cand.wantsAuthority==='full')chance-=.12;if(cand.source==='internal')chance+=.20;if(cand.source==='external')chance-=((cand.loyalty||60)-50)/300;return clamp(chance,.05,.95)}
function materializeCandidateCoach(t,slot,cand){const c=generateCoach(COACH_SLOT_ROLES[slot],t,gi(0,4));c.name=cand.name;c.age=cand.age;c.recruiting=cand.recruiting;c.development=cand.development;c.evaluation=cand.evaluation;c.playCall=cand.playCall;c.adaptability=cand.adaptability;c.loyalty=cand.loyalty;c.ambition=cand.ambition;c.specialties=cand.specialties;return c}
function hireCandidate(o,cand,offer){
 const t=T(o.schoolName),slot=o.slot,year=universe.year,next=year+1,interim=t.staff[slot];
 let coach=null,originTeam=null,originSlot=null;
 if(cand.source!=='fresh'){const found=coachById(cand.coachId);if(found?.active){coach=found.coach;originTeam=found.team;originSlot=found.slot}}
 if(!coach)coach=materializeCandidateCoach(t,slot,cand);
 if(interim){archiveCoach(interim,t,'Interim tenure ended','DEPARTED',year);addCoachEvent('COACH_DEPARTED',interim,t,null,{role:interim.role,reason:'Interim tenure ended'})}
 if(originTeam&&originTeam!==t){applyCoachRelationshipChange(coach,originTeam,t,'Accepted a new job');closeCoachStint(coach,originTeam,year,'Accepted a new job');originTeam.staff[originSlot]=startGeneratedCoach(originTeam,originSlot,next,'Vacancy after coach departure');addCoachEvent('COACH_DEPARTED',coach,originTeam,t,{role:COACH_SLOT_ROLES[originSlot],reason:'Hired away'},`${coach.name} leaves ${originTeam.name} to join ${t.name}.`)}else if(originTeam){closeCoachStint(coach,t,year,'Promoted internally');t.staff[originSlot]=null}
 coach.salary=offer.salary;coach.contractYears=offer.years;coach.playCallAuthority=offer.authority;
 t.staff[slot]=coach;
 openCoachStint(coach,t,slot,next,cand.source==='internal'?'Promoted internally':'Hired');
 addCoachEvent(cand.source==='internal'?'COACH_PROMOTED':'COACH_HIRED',coach,originTeam,t,{role:slot,source:cand.source,salary:offer.salary,years:offer.years,authority:offer.authority},`${t.name} hires ${coach.name} as ${COACH_SLOT_ROLES[slot]}${cand.source==='internal'?' (internal promotion)':''}.`);
 o.status='FILLED';o.filledSeason=year;o.filledCandidateId=cand.candidateId;o.hiredCoachId=coach.id;cand.status='HIRED';
 for(const other of universe.candidateMarket[o.id]||[])if(other!==cand&&other.status==='AVAILABLE')other.status='WITHDRAWN';
 applyCoachScheme(coach,slot,t,`${coach.name} hired`);
 if(cand.source==='internal')createOpening(t,cand.fromSlot,'Vacancy after internal promotion');
 return coach
}
// A new coordinator installs the system he wants to run, which starts the
// transition the roster then has to absorb.
function applyCoachScheme(coach,slot,t,reason){
 const side=SCHEME_SIDE[slot];if(!side||!coach)return null;
 ensureCoachScheme(coach,slot,t);
 return setTeamScheme(t,side,coach.preferredScheme,reason);
}
function extendOffer(openingId,candidateId,offer){
 const o=(universe.openings||[]).find(x=>x.id===openingId);if(!o||o.status!=='OPEN')return{ok:false,accepted:false,reason:'Opening is no longer available.'};
 const t=T(o.schoolName);if(!t)return{ok:false,accepted:false,reason:'Team not found.'};
 const cand=(universe.candidateMarket?.[openingId]||[]).find(c=>c.candidateId===candidateId);
 if(!cand||cand.status!=='AVAILABLE')return{ok:false,accepted:false,reason:'Candidate is no longer available.'};
 if(!cand.interviewed)return{ok:false,accepted:false,reason:'Interview the candidate before extending an offer.'};
 const salary=clamp(Math.round((+offer.salary||0)*10)/10,0.4,9.9),years=clamp(Math.round(+offer.years||1),1,6),authority=offer.authority==='full'?'full':'shared';
 const headroom=teamStaffBudget(t)-teamStaffSpend(t)+(t.staff[o.slot]?.salary||0);
 if(salary>headroom+0.05)return{ok:false,accepted:false,reason:'That salary exceeds the athletic department budget.'};
 const chance=candidateAcceptChance(cand,{salary,years,authority}),accepted=Math.random()<chance;
 if(!accepted){cand.status='DECLINED';cand.declineReason=salary<cand.askSalary*.85?'Turned down the offer: salary too low.':years<2?'Turned down the offer: wanted more security.':'Turned down the offer for a different opportunity.';return{ok:true,accepted:false,reason:cand.declineReason}}
 hireCandidate(o,cand,{salary,years,authority});
 return{ok:true,accepted:true}
}
function coachOpeningHubItems(t){if(!t)return[];return (universe.openings||[]).filter(o=>o.schoolId===t.id&&o.status==='OPEN').map(o=>({type:'action',tab:'staff',kicker:'COACHING SEARCH',importance:62,main:`${o.role} opening`,sub:'Interview and hire from the candidate market on the Staff tab.'}))}
function promiseHubItems(t){return (universe.events||[]).filter(e=>e.type==='PROMISE_BROKEN'&&e.schoolIds.includes(t?.id)&&e.season>=universe.year-1).slice(-3).reverse().map(e=>({type:'bad-news',tab:'roster',player:e.playerIds[0],kicker:'PROMISE BROKEN',importance:e.importance,main:e.summary,sub:e.metadata.result}))}
// A record nobody is near is trivia. A record somebody is two hundred yards from is a storyline,
// and the wire should say so while he can still get there. Season records are only rewritten at
// year end (finalizeSeasonHonors), so through the season these are last year's marks to chase.
function recordChaseHubItems(t){
 if(!t||universe.week<2)return[];
 const out=[];
 for(const p of t.roster){
  if(p.redshirtActive)continue;
  let best=null;
  for(const [k,label] of Object.entries(RECORD_CATS)){
   const v=p.stats?.[k]||0;if(v<=0)continue;
   for(const [nat,rec] of [[true,universe.records?.nationalSeason?.[k]],[false,t.records?.[k]]]){
    if(!rec?.value)continue;
    if(rec.playerId===p.id&&rec.year===universe.year)continue;
    const broke=v>rec.value;
    if(!broke&&v<rec.value*.8)continue;
    const importance=broke?(nat?88:72):(nat?60:50);
    if(best&&best.importance>=importance)continue;
    const held=`${rec.playerName}, ${rec.year}`;
    best={type:'good-news',tab:'roster',player:p.id,importance,
     kicker:broke?(nat?'NATIONAL RECORD':'SCHOOL RECORD'):'RECORD WATCH',
     main:broke?`${p.name} passed the ${nat?'national':t.name} single-season ${label.toLowerCase()} record`
      :`${p.name} is closing on the ${nat?'national':t.name} ${label.toLowerCase()} record`,
     sub:broke?`${Math.round(v)} · previous mark ${Math.round(rec.value)} by ${held}`
      :`${Math.round(v)} of ${Math.round(rec.value)} · held by ${held}`};
   }
  }
  if(best)out.push(best);
 }
 return out.sort((a,b)=>b.importance-a.importance).slice(0,2);
}
function promiseHTML(p){const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return '<h3 style="margin-top:14px">Promises</h3>'+((p.promises||[]).map(q=>{
  const terms=q.type==='EARLY_ROLE'?`${q.expectedGames} appearances in the first season`:q.type==='DEVELOPMENT_PLAN'?`${q.expectedFocus} in both spring and fall camp`:q.type==='POSITION_LOCK'?`Keep position: ${q.targetPosition}`:q.type==='NO_REDSHIRT'?'No first-season redshirt (major injury exception)':'NIL priority recorded; not yet assessed';
  return `<div class="timeline-row"><strong>${esc(promiseLabel(q.type))} · ${esc(q.status)}</strong><div>${esc(q.status==='LEGACY'?q.notes?.[0]:q.result||terms)}</div><div class="small muted">${q.firstSeason?`First season: ${esc(q.firstSeason)} · `:''}${q.coachName?`Promised by ${esc(q.coachName)}`:''}${q.resolvedSeason?` · Assessed ${esc(q.resolvedSeason)}`:''}</div></div>`;
 }).join('')||'<div class="muted">No recruiting promises recorded.</div>');
}

function promisePenalty(p){return Math.min(30,(p.promises||[]).filter(q=>q.schoolId===p.currentSchoolId&&q.resolvedSeason>=universe.year-1).reduce((n,q)=>n+(q.transferPenalty||0),0))}
function archivePlayerSeason(p,team,year){p.seasonHistory??=[];if(p.seasonHistory.some(s=>s.year===year&&s.team===team.name))return;let s={year,team:team.name,pos:p.pos,style:p.style,eligibility:eligibilityLabel(p),rating:p.perceived,...packStats(p.stats)};p.seasonHistory.push(s);p.career??=newStats();for(const k of Object.keys(newStats()))p.career[k]=(p.career[k]||0)+(p.stats?.[k]||0)}
const PORTRAIT_VERSION=1;
function hsl2hex(h,sPct,lPct){
 const sN=sPct/100,lN=lPct/100,c=(1-Math.abs(2*lN-1))*sN,x=c*(1-Math.abs((h/60)%2-1)),m=lN-c/2;
 let r=0,g=0,b=0;
 if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}
 else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
 const to=v=>Math.round((v+m)*255).toString(16).padStart(2,'0');
 return `#${to(r)}${to(g)}${to(b)}`;
}
function schoolColors(school){
 const id=Number(school?.id)||Math.abs(hashString(String(school?.name||'school')));
 const hue=(id*137.508)%360, band=id%4;
 const primary=hsl2hex(hue,band===3?52:58,band===1?26:31);
 const secondary=band===0?hsl2hex((hue+42)%360,68,62)
   :band===1?'#f2ede3'
   :band===2?'#c9d2d8'
   :hsl2hex((hue+168)%360,55,58);
 return {primary,secondary};
}
function hashString(str){let h=0;for(let i=0;i<str.length;i++)h=(h*31+str.charCodeAt(i))|0;return h}
function ensureSchoolColors(t){if(!t)return t;const c=schoolColors(t);t.primary??=c.primary;t.secondary??=c.secondary;return t}
function portraitSeedFor(){return `p${Date.now().toString(36)}${Math.floor(Math.random()*1e9).toString(36)}`}
function jerseyFor(pos,seed){
 const bands={QB:[1,19],RB:[20,49],WR:[1,19],TE:[80,89],OT:[70,79],OG:[60,69],C:[50,59],EDGE:[40,59],DT:[90,99],LB:[40,59],CB:[20,39],S:[20,39],K:[1,19],P:[1,19]};
 const [lo,hi]=bands[pos]||[1,99];let h=0,str=String(seed);
 for(let i=0;i<str.length;i++){h=(h*31+str.charCodeAt(i))>>>0}
 return lo+(h%(hi-lo+1));
}
function portraitTag(p,size,frame,kind='player'){if(!p)return '';return `<canvas class="portrait portrait-${frame}" width="${size}" height="${size}" data-portrait="${p.id}" data-portrait-size="${size}" data-portrait-frame="${frame}" data-portrait-kind="${kind}" aria-label="Portrait of ${String(p.name||'player').replace(/"/g,'&quot;')}"></canvas>`}
const RECRUIT_PORTRAIT_SCHOOL={id:'recruit-neutral',name:'National Prospect',primary:'#283747',secondary:'#b8c2cf'};
function paintPortraits(scope){
 if(typeof DynastyPortraits==='undefined')return;
 const root=scope||document,nodes=[...(root.matches?.('canvas[data-portrait]')?[root]:[]),...(root.querySelectorAll?.('canvas[data-portrait]')||[])];
 for(const c of nodes){
  if(c.dataset.portraitPainted==='1')continue;
  const isRecruit=c.dataset.portraitKind==='recruit';let p=null,team=null;
  if(isRecruit){p=(universe.recruits||[]).find(r=>String(r.id)===String(c.dataset.portrait));if(!p)continue;p.portraitSeed??=`recruit-${p.id}`;p.portraitVersion??=PORTRAIT_VERSION;if(p.committed)team=T(p.committed)||null}
  else{const f=findPlayer(c.dataset.portrait);if(!f?.p)continue;p=f.p;team=f.team&&f.team.primary?f.team:null;if(!team){const nm=f.team?.name||f.p.lastTeam;if(nm)team=T(nm)||null}}
  const school=team?ensureSchoolColors(team):(isRecruit?RECRUIT_PORTRAIT_SCHOOL:schoolColors({id:0,name:p.lastTeam||'archive'}));
  const subject=isRecruit?{...p,jerseyNumber:p.jerseyNumber??jerseyFor(p.pos,p.portraitSeed)}:ensurePortrait(p);
  try{
   DynastyPortraits.renderPlayerPortrait(subject,school||{},c,{
    size:Number(c.dataset.portraitSize)||64,
    pixelRatio:Math.min(2,globalThis.devicePixelRatio||1),
    frame:c.dataset.portraitFrame||'list'
   });
   c.dataset.portraitPainted='1';
  }catch(e){c.dataset.portraitPainted='error'}
 }
}
globalThis.DynastyLabPortraits={paint:paintPortraits};
function ensurePortrait(p){if(!p)return p;p.portraitSeed??=portraitSeedFor();p.portraitVersion??=PORTRAIT_VERSION;p.jerseyNumber??=jerseyFor(p.pos,p.portraitSeed);return p}
const ARCHIVE_FIELDS=['id','name','pos','style','portraitSeed','portraitVersion','jerseyNumber','height','weight','year','eligibilityUsed','redshirtUsed','redshirtSeason','perceived','perceivedUpside','speed','power','technique','iq','health','wear','origin','recruitingMemory','primaryRecruiterCoachId','coachRelationships','coachDeparturePressure','transferHistory','promise','promises','staffTrust','currentSchoolId','trainingFocus','scoutConfidence','scoutingDomains','scoutingHistory','positionFamiliarity','requestedPositionChange','seasonHistory','injuryHistory','awards'];
function archiveRecord(p,team,reason){let out={lastTeam:team.name,retiredYear:universe.year,exitReason:reason,redshirtActive:false,injury:null,injuryWeeks:0,stats:packStats(p.stats),career:packStats(p.career)};for(const k of ARCHIVE_FIELDS)if(p[k]!==undefined)out[k]=p[k];if(p.draftResult)out.draftResult={year:p.draftResult.year,label:p.draftResult.label,round:p.draftResult.round,pick:p.draftResult.pick};return out}
function addToArchive(p,team,reason){if(reason==='Roster cut')releasePlayerPromises(p,team,'Released from the roster before the obligation could be completed.');universe.playerArchive??=[];universe.playerArchive.push(archiveRecord(p,team,reason))}
function participants(t){ensureRoleDepth(t);let out=[];for(const role of ROLE_DEFS){let p=roleStarter(t,role.id);if(p)out.push(p)}for(const [pos,n] of Object.entries({QB:2,RB:3,WR:6,TE:3,OT:4,OG:4,C:2,EDGE:4,DT:4,LB:5,CB:5,S:4,K:1,P:1}))out.push(...orderedAt(t,pos).filter(gameAvailable).slice(0,n));return [...new Map(out.map(p=>[p.id,p])).values()]}
function postGameCondition(t){for(const p of participants(t)){ensurePlayerDevelopment(p,t);const plan=weeklyPlayerPlan(p),limited=plan?.role==='limited',full=plan?.role==='full';p.scoutConfidence=clamp(p.scoutConfidence+gi(0,2),25,98);p.wear=clamp((p.wear||0)+gi(limited?1:3,limited?5:9)+(full?3:0),0,100);p.health=clamp((p.health??100)-gi(0,limited?2:3),40,100);let risk=.006+(p.wear||0)/4200+(100-(p.durability??70))/9000+(full?.012:0);if(limited)risk*=.65;if(Math.random()<risk){let r=Math.random(),weeks=r<.56?1:r<.82?2:r<.94?gi(3,4):gi(5,7),type=pick(INJURIES);p.injury=type;p.injuryWeeks=weeks;p.health=clamp((p.health??100)-gi(8,22),35,92);p.injuryHistory??=[];p.injuryHistory.push({year:universe.year,week:universe.week+1,type,weeks})}}}
function recoverWeek(){if(universe.recoveredWeek===universe.week)return;for(const t of universe.teams)for(const p of t.roster){if((p.injuryWeeks||0)>0){p.injuryWeeks=Math.max(0,p.injuryWeeks-1);p.health=clamp((p.health??70)+gi(7,14),35,100);if(p.injuryWeeks===0)p.injury=null}else p.health=clamp((p.health??100)+gi(2,6),40,100);p.wear=clamp((p.wear||0)-gi(3,7),0,100)}universe.recoveredWeek=universe.week}

const STATE_TALENT={TX:1.55,FL:1.50,GA:1.38,CA:1.35,OH:1.22,PA:1.17,NC:1.20,LA:1.24,AL:1.20,TN:1.14,MI:1.10,IL:1.12,NJ:1.08,VA:1.12,MD:1.10,SC:1.12,MS:1.13,AZ:1.05,MO:1.03,WA:1.03,IN:1.02,WI:1.00,NY:1.00};
const HS_WORDS=['Central','North','South','West','East','Memorial','Union','Catholic','Academy','Tech','Prep','Roosevelt','Lincoln','Jefferson','Washington'];
function haversineMiles(aLat,aLon,bLat,bLon){const R=3958.8,dLat=(bLat-aLat)*Math.PI/180,dLon=(bLon-aLon)*Math.PI/180,x=Math.sin(dLat/2)**2+Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLon/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function generateHighSchools(){let seen=new Map(),out=[],id=1;for(const s of schools){let k=`${s.city}|${s.state}`;if(!seen.has(k))seen.set(k,{city:s.city,state:s.state,lat:s.lat,lon:s.lon,region:s.conference})}for(const m of seen.values()){let n=(STATE_TALENT[m.state]||.90)>=1.2?5:3;for(let i=0;i<n;i++){let word=HS_WORDS[(i+Math.abs(Math.round(m.lat*10)))%HS_WORDS.length],name=i===0?`${m.city} Central High`:`${m.city} ${word} ${i%3===0?'Prep':'High'}`;out.push({id:`HS${id++}`,name,city:m.city,state:m.state,lat:m.lat+gauss()*.045,lon:m.lon+gauss()*.055,region:m.region,talent:(STATE_TALENT[m.state]||.90)*rng(.82,1.18),d1Signees:0})}}return out}
function weightedHighSchool(pool){let total=pool.reduce((a,h)=>a+h.talent,0),r=Math.random()*total;for(const h of pool){r-=h.talent;if(r<=0)return h}return pool.at(-1)}
function assignRecruitRanks(pool){pool.sort((a,b)=>(b.scoutUp+b.scout*.55+b.trueNow*.25)-(a.scoutUp+a.scout*.55+a.trueNow*.25));let pos={},state={};pool.forEach((r,i)=>{r.nationalRank=i+1;pos[r.pos]=(pos[r.pos]||0)+1;r.positionRank=pos[r.pos];state[r.homeState]=(state[r.homeState]||0)+1;r.stateRank=state[r.homeState]});return pool}
let distCache=new Map();
function recruitDistance(t,r){let k=r.id+'|'+t.name,v=distCache.get(k);if(v===undefined){v=Math.round(haversineMiles(t.lat||0,t.lon||0,r.lat||0,r.lon||0));distCache.set(k,v)}return v}
function distancePitch(t,r){let d=recruitDistance(t,r),importance=r.distanceImportance??50,tol=r.distanceTolerance??500;if(importance<20)return 0;if(d<=75)return importance*.11;if(d<=tol)return importance*.04*(1-d/Math.max(100,tol));return -Math.min(18,(d-tol)/150)*(importance/100)}
function recruitPitchBreakdown(t,r){let items=[['Program prestige',t.prestige*.32],['NIL resources',t.nil*.16],['Development',t.development*.15],['Facilities',t.facilities*.07],['Recruiting staff',t.staff.RC.recruiting*.10],['Head coach',t.staff.HC.recruiting*.05],['Coach relationship',recruitCoachRelationshipBoost(t,r)],['Pipeline',pipelineStrength(t,r.homeRegion)*.10],['Distance',distancePitch(t,r)],['NIL deal',nilDealActive(r,t)?nilDealActive(r,t).amount*3:0]];let pri=0;switch(r.priority){case'Prestige':pri=t.prestige*.18;break;case'NIL':pri=t.nil*.20;break;case'Development':pri=t.development*.18;break;case'Early Role':pri=Math.max(0,90-unitCached(t,r.pos))*.20;break;case'Coaching':pri=(t.staff.HC.loyalty+t.staff.RC.recruiting)*.08;break;case'Academics':pri=t.academics*.18;break;case'Scheme Fit':pri=t.offScheme==='Multiple'?8:5;break;case'Winning':pri=(t.w/Math.max(1,t.w+t.l))*18;break;case'Stay Close':pri=Math.max(-12,12-recruitDistance(t,r)/80);break;case'Campus Life':pri=(t.fan_support+t.facilities)*.06;break}items.push([`${r.priority} priority`,pri]);return items}
function sample(arr,n){if(arr.length<=n)return arr.slice();let seen=new Set(),out=[];while(out.length<n){let j=gi(0,arr.length-1);if(seen.has(j))continue;seen.add(j);out.push(arr[j])}return out}
function recruitTopSchools(r,n=5){return universe.teams.map(t=>({t,score:recruitPitch(t,r)+(t.name===selected()?.name&&r.targeted?10+r.relationship*.12:0)})).sort((a,b)=>b.score-a.score).slice(0,n)}
function normalizeRecruitGeography(r,hsPool=universe.highSchools||[]){if(!r.highSchoolId){let h=weightedHighSchool(hsPool);Object.assign(r,{highSchoolId:h.id,highSchool:h.name,homeCity:h.city,homeState:h.state,lat:h.lat,lon:h.lon,homeRegion:h.region,distanceImportance:gi(5,100),distanceTolerance:pick([100,150,250,400,600,900,1500,2500])})}r.prevInterest??=r.interest;r.trend??=0;ensureRecruitRelationships(r)}
function recruitHash(value){let h=2166136261>>>0;for(const ch of String(value??'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function ensureRecruitRelationships(r){if(!r)return r;r.coachRelationships??={};r.primaryRecruiterCoachId??=r.recruitingMemory?.primaryRecruiterCoachId||r.recruitingMemory?.recruiterCoachId||null;return r}
function primaryRecruiterFor(t,r){if(!t||!r)return null;ensureRecruitRelationships(r);let existing=r.primaryRecruiterCoachId&&Object.values(t.staff||{}).find(c=>c?.id===r.primaryRecruiterCoachId);if(existing)return existing;const side=OFF_POS.has(r.pos)&&!['K','P'].includes(r.pos)?t.staff?.OC:(!OFF_POS.has(r.pos)?t.staff?.DC:null),roll=recruitHash(`${r.id}|${t.id}|primary`)%100;return roll<45?t.staff?.RC:roll<85?(side||t.staff?.RC):t.staff?.HC}
function deterministicRecruitRelationship(r,t,c){const wiggle=(recruitHash(`${r.id}|${t.id}|${c.id}|rel`)%17)-8;return clamp(Math.round(38+(r.stars||3)*4+(c.recruiting||60)*.10+wiggle),28,90)}
function assignPrimaryRecruiter(r,t,relationship=null){ensureRecruitRelationships(r);const c=primaryRecruiterFor(t,r);if(!c)return null;r.primaryRecruiterCoachId=c.id;const base=relationship==null?deterministicRecruitRelationship(r,t,c):clamp(Math.round(relationship),0,100);r.coachRelationships[c.id]=Math.max(r.coachRelationships[c.id]??0,base);return c}
function growRecruiterRelationship(r,t,gain){ensureRecruitRelationships(r);let c=primaryRecruiterFor(t,r);if(!c)return null;r.primaryRecruiterCoachId=c.id;const start=r.coachRelationships[c.id]??clamp(r.relationship??45,20,85);r.coachRelationships[c.id]=clamp(start+Math.max(0,gain||0),0,100);return c}
function coachRelationshipValue(person,coachId,fallback=20){if(!person||!coachId)return fallback;return clamp(person.coachRelationships?.[coachId]??fallback,0,100)}
function recruitCoachRelationshipBoost(t,r){if(!t||!r)return 0;ensureRecruitRelationships(r);let best=20;for(const c of Object.values(t.staff||{}))best=Math.max(best,coachRelationshipValue(r,c.id,20));return clamp((best-20)*.10,0,8)}
function coachRelationshipPortability(c,person){let factor=.50+(c?.recruiting||60)/260;if(person?.priority==='Coaching')factor*=1.12;else if(person?.priority==='Stay Close')factor*=.88;else if(person?.composure!=null)factor*=1+(70-person.composure)/300;return clamp(factor,.35,.95)}
function coachTransferPressure(p){const x=p?.coachDeparturePressure;if(!x||x.fromSchoolId!==p.currentSchoolId)return 0;const age=universe.year-(x.season??universe.year);if(age<0||age>1)return 0;const factor=x.toSchoolId?(age===0?.28:.20):(age===0?.16:.11);return clamp(Math.round((x.strength||0)*factor),0,20)}
function mergeShares(parts,cap=Infinity){let out=new Map();for(const x of parts){if(!x||!x.p)continue;let cur=out.get(x.p.id);if(cur)cur.weight+=x.weight;else out.set(x.p.id,{p:x.p,weight:x.weight})}let a=[...out.values()];for(const x of a)x.weight=Math.min(x.weight,cap);return a}
function splitInteger(total,parts){if(!parts.length||total<=0)return new Map();let sum=parts.reduce((a,x)=>a+Math.max(.01,x.weight),0),raw=parts.map(x=>({p:x.p,v:total*Math.max(.01,x.weight)/sum})),out=new Map(raw.map(x=>[x.p,Math.floor(x.v)])),left=total-[...out.values()].reduce((a,b)=>a+b,0);raw.sort((a,b)=>(b.v-Math.floor(b.v))-(a.v-Math.floor(a.v)));for(let i=0;i<left;i++)out.set(raw[i%raw.length].p,(out.get(raw[i%raw.length].p)||0)+1);return out}
function addGameAppearance(p,start=false){if(!p)return;p.stats.games=(p.stats.games||0)+1;if(start)p.stats.starts=(p.stats.starts||0)+1}
function applyGameStats(team,s,opp){const scheme=OFF_SCHEMES[team.offScheme],q=roleStarter(team,'QB1')||starter(team,'QB');let core=[q,roleStarter(team,'RB1'),roleStarter(team,'X'),roleStarter(team,'Z'),roleStarter(team,'SLOT'),roleStarter(team,'TE1'),roleStarter(team,'LT'),roleStarter(team,'LG'),roleStarter(team,'C1'),roleStarter(team,'RG'),roleStarter(team,'RT'),roleStarter(team,'RUSH'),roleStarter(team,'SETEDGE'),roleStarter(team,'NT'),roleStarter(team,'3TECH'),roleStarter(team,'MIKE'),roleStarter(team,'WILL'),roleStarter(team,'NICKEL'),roleStarter(team,'BCB'),roleStarter(team,'FCB'),roleStarter(team,'FS'),roleStarter(team,'BOXS')].filter(Boolean);const starters=new Set();for(const p of [...new Map(core.map(p=>[p.id,p])).values()]){addGameAppearance(p,true);starters.add(p.id)}
 const qb2=rotationAt(team,'QB',1),margin=(s.pts||0)-(opp?.pts||0),qb2Share=!qb2?0:margin>=35?.32:margin>=21?.20:0;let qbs=qb2Share?[{p:q,weight:1-qb2Share},{p:qb2,weight:qb2Share}]:[{p:q,weight:1}];qbs=mergeShares(qbs.filter(x=>x.p));if(qbs.length){for(const k of ['passAtt','passComp','passYds','passTD','int','sacksTaken']){let split=splitInteger(s[k]||0,qbs);for(const x of qbs)x.p.stats[k]+=(split.get(x.p)||0)}}
 let qbRun=scheme.qb?.some(x=>x.includes('Run-First'))?.15:(team.offScheme==='Option Motion'?.18:.06);let rushers=mergeShares([{p:roleStarter(team,'RB1'),weight:.46},{p:rotationAt(team,'RB',1),weight:.19},{p:roleStarter(team,'3DRB'),weight:.11},{p:roleStarter(team,'PWRB'),weight:.10},{p:rotationAt(team,'RB',2),weight:.06},{p:q,weight:qbRun}],.62);let att=splitInteger(s.rushAtt||0,rushers),yds=splitInteger(Math.max(0,s.rushYds||0),rushers.map(x=>({p:x.p,weight:x.weight*(x.p.speed*.45+x.p.power*.35+x.p.iq*.20)}))),td=splitInteger(s.rushTD||0,rushers.map(x=>({p:x.p,weight:x.weight*(x.p.power*.6+x.p.composure*.4)})));for(const x of rushers){x.p.stats.rushAtt+=(att.get(x.p)||0);x.p.stats.rushYds+=(yds.get(x.p)||0);x.p.stats.rushTD+=(td.get(x.p)||0)}
 let recs=mergeShares([{p:roleStarter(team,'X'),weight:.21},{p:roleStarter(team,'Z'),weight:.19},{p:roleStarter(team,'SLOT'),weight:.18},{p:roleStarter(team,'TE1'),weight:.14},{p:roleStarter(team,'3DRB'),weight:.08},{p:roleStarter(team,'MOVETE'),weight:.05},{p:rotationAt(team,'WR',3),weight:.07},{p:rotationAt(team,'WR',4),weight:.04},{p:rotationAt(team,'TE',1),weight:.04}],.36);let catches=splitInteger(s.passComp||0,recs),extraTargets=splitInteger(Math.max(0,(s.passAtt||0)-(s.passComp||0)),recs.map(x=>({p:x.p,weight:x.weight*(x.p.technique*.5+x.p.speed*.3+x.p.iq*.2)}))),ryds=splitInteger(Math.max(0,s.passYds||0),recs.map(x=>({p:x.p,weight:x.weight*(x.p.speed*.42+x.p.technique*.38+x.p.power*.2)}))),rtd=splitInteger(s.passTD||0,recs);for(const x of recs){let c=catches.get(x.p)||0,tg=c+(extraTargets.get(x.p)||0);x.p.stats.targets+=tg;x.p.stats.receptions+=c;x.p.stats.recYds+=(ryds.get(x.p)||0);x.p.stats.recTD+=(rtd.get(x.p)||0);x.p.stats.yac+=Math.round((ryds.get(x.p)||0)*rng(.25,.48));x.p.stats.drops+=Math.max(0,Math.round((tg-c)*clamp((90-x.p.technique)/250,0,.15)))}
 let defShares=mergeShares([...['MIKE','WILL','BOXS','FS','BCB','FCB','NICKEL','RUSH','SETEDGE','3TECH','NT'].map(id=>({p:roleStarter(team,id),weight:1})),...[['DT',.52],['EDGE',.44],['LB',.34],['CB',.28],['S',.26]].flatMap(([pos,w])=>[{p:rotationAt(team,pos,2),weight:w},{p:rotationAt(team,pos,3),weight:w*.45}])],1.35);let def=defShares.map(x=>x.p),posWeight=p=>(p.pos==='LB'?1.25:p.pos==='S'?1.05:p.pos==='DT'?.8:1),tackleTotal=Math.max(35,Math.round((opp?.plays||65)*.72)),tacks=splitInteger(tackleTotal,defShares.map(x=>({p:x.p,weight:x.weight*posWeight(x.p)*(x.p.iq*.5+x.p.technique*.5)})));for(const p of def)p.stats.tackles+=(tacks.get(p)||0);let front=defShares.filter(x=>['EDGE','DT','LB'].includes(x.p.pos)),sacks=splitInteger(opp?.sacksTaken||0,front.map(x=>({p:x.p,weight:x.weight*(x.p.technique*.55+x.p.speed*.25+x.p.power*.2)}))),press=splitInteger(Math.max(opp?.sacksTaken||0,Math.round((opp?.passAtt||30)*.14)),front.map(x=>({p:x.p,weight:x.weight*(x.p.technique*.45+x.p.speed*.35+x.p.power*.2)})));for(const {p} of front){p.stats.sacks+=(sacks.get(p)||0);p.stats.pressures+=(press.get(p)||0);p.stats.tfl+=Math.round((tacks.get(p)||0)*rng(.08,.25))}let db=defShares.filter(x=>['CB','S','LB'].includes(x.p.pos)),ints=splitInteger(opp?.int||0,db.map(x=>({p:x.p,weight:x.weight*(x.p.iq*.4+x.p.technique*.35+x.p.speed*.25)}))),pbus=splitInteger(Math.max(0,Math.round(((opp?.passAtt||0)-(opp?.passComp||0)-(opp?.int||0))*0.24)),db.map(x=>({p:x.p,weight:x.weight*(x.p.technique*.5+x.p.speed*.3+x.p.iq*.2)})));for(const {p} of db){p.stats.intDef+=(ints.get(p)||0);p.stats.passBreakups+=(pbus.get(p)||0)}
 let ol=[...new Map(['LT','LG','C1','RG','RT'].map(id=>roleStarter(team,id)).filter(Boolean).map(p=>[p.id,p])).values()],snaps=(s.plays||((s.passAtt||0)+(s.rushAtt||0)+(s.sacksTaken||0)));for(const p of ol)p.stats.snaps+=snaps;let sa=splitInteger(s.sacksTaken||0,ol.map(p=>({p,weight:110-p.technique}))),pa=splitInteger(Math.max(s.sacksTaken||0,Math.round((s.passAtt||30)*.07)),ol.map(p=>({p,weight:110-p.technique})));for(const p of ol){p.stats.sacksAllowed+=(sa.get(p)||0);p.stats.pressuresAllowed+=(pa.get(p)||0)}
 let k=roleStarter(team,'K1'),pu=roleStarter(team,'P1');if(k){k.stats.fgMade+=s.fgMade||0;k.stats.fgAtt+=s.fgAtt||0}if(pu){pu.stats.punts+=s.punts||0;pu.stats.puntYds+=Math.round((s.punts||0)*clamp(41+(pu.power-70)*.16+rng(-2,2),33,52))}
 for(const x of [...qbs,...rushers,...recs,...defShares,{p:k},{p:pu}])if(x.p&&!starters.has(x.p.id)){addGameAppearance(x.p,false);starters.add(x.p.id)}}

async function loadSchools(){schools=EMBEDDED_SCHOOLS}
function staffRating(base=65){return clamp(Math.round(base+gauss()*12),25,99)}
function generateCoach(role,school,tenure=null){
 const base=56+school.prestige*.16+school.resources*.08;
 const c={id:uid(),name:`${pick(FIRST)} ${pick(LAST)}`,role,age:gi(31,66),recruiting:staffRating(base),development:staffRating(base),evaluation:staffRating(base),playCall:staffRating(base),adaptability:staffRating(base),loyalty:staffRating(63),ambition:staffRating(68),years:tenure==null?gi(0,6):tenure,contractYears:gi(2,5),salary:Math.round((0.35+school.resources/35+school.prestige/45+(role==='Head Coach'?2.4:role.includes('Coordinator')?0.9:0))*10)/10,schoolId:school.id,schoolName:school.name,status:'ACTIVE',careerHistory:[],seasons:[]};
 c.specialties=coachSpecialties(c);
 // Coordinators arrive with a system of their own; ambitious ones are likelier
 // to want to install it rather than inherit what the program already runs.
 if(role==='Offensive Coordinator')c.preferredScheme=c.ambition>=62?pick(Object.keys(OFF_SCHEMES)):(school.offScheme||pick(Object.keys(OFF_SCHEMES)));
 else if(role==='Defensive Coordinator')c.preferredScheme=c.ambition>=62?pick(Object.keys(DEF_SCHEMES)):(school.defScheme||pick(Object.keys(DEF_SCHEMES)));
 return c;
}
function generateStaff(s){return {HC:generateCoach('Head Coach',s),OC:generateCoach('Offensive Coordinator',s),DC:generateCoach('Defensive Coordinator',s),RC:generateCoach('Recruiting Coordinator',s),SC:generateCoach('Strength & Performance',s)}}
function generatePlayer(school,pos,idx){
 const [hr,wr]=BODY[pos],h=gi(hr[0],hr[1]),w=gi(wr[0],wr[1]),classYr=pick(['FR','FR','SO','SO','JR','JR','SR']);
 const program=school.prestige*.48+school.resources*.16+school.development*.22+school.facilities*.14;
 const trueNow=clamp(Math.round(42+program*.38+gauss()*8+(classYr==='FR'?-5:classYr==='SO'?-2:classYr==='SR'?3:1)),38,97);
 const attrs={speed:clamp(Math.round(trueNow+gauss()*10+(['WR','CB','RB','S'].includes(pos)?7:['DT','OG','C'].includes(pos)?-11:0)),25,99),power:clamp(Math.round(trueNow+gauss()*9+(['DT','OG','C','OT','EDGE','TE'].includes(pos)?6:['CB','WR'].includes(pos)?-8:0)),25,99),technique:clamp(Math.round(trueNow+gauss()*9),25,99),iq:clamp(Math.round(trueNow+gauss()*11),20,99),composure:clamp(Math.round(66+gauss()*15),15,99),durability:clamp(Math.round(72+gauss()*14),20,99),versatility:clamp(Math.round(64+gauss()*17),15,99)};
 const dev=clamp(Math.round(61+school.development*.18+gauss()*16),20,99),work=clamp(Math.round(65+gauss()*18),15,99),coach=clamp(Math.round(68+gauss()*16),15,99),upside=clamp(Math.round(trueNow+(100-trueNow)*(dev/100)*rng(.34,.92)),trueNow,99);
 const scoutErr=gauss()*((100-school.development)/18+2.2),perceived=clamp(Math.round(trueNow+scoutErr),35,99),perceivedUpside=clamp(Math.round(upside+gauss()*6),perceived,99),morale=clamp(Math.round(72+gauss()*13),20,99);
 let role=idx<Math.ceil((POS_COUNTS[pos]||4)*.35)?'Starter mix':idx<Math.ceil((POS_COUNTS[pos]||4)*.7)?'Rotation':'Development';if(classYr==='FR'&&role==='Development')role='Redshirt candidate';let eligibilityUsed={FR:0,SO:1,JR:2,SR:3}[classYr],redshirtUsed=eligibilityUsed>0&&Math.random()<.28;
 let growthProfile=pick(GROWTH_PROFILE_KEYS),growthVolatility=clamp(Math.round(45+gauss()*22),10,95),framePotential=clamp(Math.round(58+gauss()*20),10,98),speedRetention=clamp(Math.round(70+gauss()*16),20,99),scoutConfidence=clamp(Math.round(38+eligibilityUsed*13+school.development*.18+gauss()*5),28,94);return {id:uid(),name:`${pick(FIRST)} ${pick(LAST)}`,pos,year:classYr,eligibilityUsed,redshirtUsed,redshirtActive:false,redshirtSeason:null,height:h,weight:w,style:pick(STYLES[pos]),trueNow,upside,perceived,perceivedUpside,dev,work,coach,morale,role,...attrs,health:100,wear:gi(0,8),injury:null,injuryWeeks:0,injuryHistory:[],seasonHistory:[],awards:[],draftResult:null,promise:null,promiseBaseline:perceived,growthProfile,growthVolatility,framePotential,speedRetention,heightGrowthRemaining:eligibilityUsed===0&&Math.random()<.24?1:0,trainingFocus:'Balanced',positionFamiliarity:{[pos]:100},formerPositions:[],scoutConfidence,lastDevelopmentDelta:0,lastPhysicalChange:'',campGrade:null,campHistory:[],stats:newStats(),career:newStats(),origin:'Initial roster',portraitSeed:portraitSeedFor(),portraitVersion:PORTRAIT_VERSION};
}
function packStats(o){if(!o)return{};let out={};for(const k in o)if(o[k])out[k]=o[k];return out}
function newStats(){return {games:0,starts:0,snaps:0,passAtt:0,passComp:0,passYds:0,passTD:0,int:0,sacksTaken:0,rushAtt:0,rushYds:0,rushTD:0,fumbles:0,targets:0,receptions:0,recYds:0,recTD:0,drops:0,yac:0,tackles:0,tfl:0,sacks:0,pressures:0,intDef:0,passBreakups:0,forcedFumbles:0,sacksAllowed:0,pressuresAllowed:0,penalties:0,fgMade:0,fgAtt:0,punts:0,puntYds:0}}
function generateRoster(s){let r=[];Object.entries(POS_COUNTS).forEach(([p,n])=>{for(let i=0;i<n;i++)r.push(generatePlayer(s,p,i))});while(r.length<93)r.push(generatePlayer(s,pick(POS),99));return r}
function generateFreshman(s,pos,origin='Walk-on / late addition'){let p=generatePlayer(s,pos,99);p.year='FR';p.eligibilityUsed=0;p.redshirtUsed=false;p.redshirtActive=false;p.redshirtSeason=null;p.origin=origin;return p}
function generateRecruitPool(n,hsPool=universe?.highSchools||generateHighSchools()){let out=[];for(let i=0;i<n;i++){let pos=pick(POS.filter(x=>!['K','P'].includes(x))),raw=clamp(Math.round(58+gauss()*12),38,97),st=recruitStars(raw),up=clamp(Math.round(raw+rng(4,22)+gauss()*5),raw,99),h=weightedHighSchool(hsPool);out.push({id:uid(),name:`${pick(FIRST)} ${pick(LAST)}`,pos,stars:st,style:pick(STYLES[pos]),trueNow:raw,upside:up,scout:clamp(Math.round(raw+gauss()*6),35,99),scoutUp:clamp(Math.round(up+gauss()*8),40,99),highSchoolId:h.id,highSchool:h.name,homeCity:h.city,homeState:h.state,lat:h.lat,lon:h.lon,homeRegion:h.region,distanceImportance:gi(5,100),distanceTolerance:pick([100,150,250,400,600,900,1500,2500]),priority:pick(PRIORITIES),portraitSeed:portraitSeedFor(),portraitVersion:PORTRAIT_VERSION,targeted:false,interest:gi(5,45),prevInterest:0,trend:0,relationship:gi(0,20),leader:null,committed:null,commitWeek:null,visit:false,visitWeek:null,promise:'None',work:clamp(Math.round(65+gauss()*18),15,99),dev:clamp(Math.round(68+gauss()*18),15,99)});out.at(-1).prevInterest=out.at(-1).interest}return assignRecruitRanks(out)}
function initUniverse(){IDX.teams=null;IDX.players=null;const os=Object.keys(OFF_SCHEMES),ds=Object.keys(DEF_SCHEMES),highSchools=generateHighSchools();const teams=schools.map(s=>({...s,nickname:'',staff:generateStaff(s),offScheme:pick(os),defScheme:pick(ds),roster:generateRoster(s),...schoolColors(s),w:0,l:0,cw:0,cl:0,pf:0,pa:0,sos:0,rank:null,champ:false,schedule:[],history:[],commits:[],records:{}}));for(const t of teams){t.schemeTransition={off:null,def:null};t.staff.OC.preferredScheme=t.offScheme;t.staff.DC.preferredScheme=t.defScheme;t.pipelines=makePipelines(t);autoRedshirts(t);autoDepthTeam(t,false);autoRoleDepth(t,false)}universe={version:APP_VERSION,year:2027,week:0,recoveredWeek:-1,phase:'regular',teams,highSchools,recruits:generateRecruitPool(2800,highSchools),history:[],playerArchive:[],awards:{},records:{nationalSeason:{},nationalCareer:{}},draftHistory:{},latest:[],weeklyHub:[],weeklyDecisions:[],bowls:[],confChamps:[],champion:null,lastDetailedGame:null,movementLog:[],recruitClassCounts:{},campHistory:{},developmentState:{year:2027,springRun:false,fallRun:false,springReport:[],fallReport:[],battles:[]},offseasonDone:false,openings:[],candidateMarket:{}};for(const t of teams){ensureTeamDevelopment(t);for(const p of t.roster){ensurePlayerDevelopment(p,t);ensureAcademics(p,t)}}normalizePromiseState();buildSchedule();deriveRivalries();universe.teams.forEach(t=>{ensureAdminState(t);ensureNilState(t)});ranked();buildPreseasonHub()}
const IDX={teams:null,players:null,archive:null,archived:0,pop:-1,miss:null};
function rosterPopulation(){let n=0;for(const t of universe.teams)n+=t.roster.length;return n}
function rebuildIndexes(){IDX.teams=new Map();IDX.players=new Map();universe.teams.forEach((t,i)=>{IDX.teams.set(t.name,{t,i});for(const p of t.roster)IDX.players.set(p.id,{p,t,i})});IDX.pop=rosterPopulation();IDX.archive=new Map();IDX.archived=0;IDX.miss=null;indexArchive()}
function indexArchive(){const a=universe.playerArchive||[];for(;IDX.archived<a.length;IDX.archived++)IDX.archive.set(a[IDX.archived].id,a[IDX.archived])}
function T(name){if(!IDX.teams)rebuildIndexes();let h=IDX.teams.get(name);if(h&&universe.teams[h.i]===h.t)return h.t;let t=universe.teams.find(t=>t.name===name);if(t)rebuildIndexes();return t}
function selected(){return T($('#userTeam').value)}
function allConfs(){return [...new Set(universe.teams.map(t=>t.conference))]}
function starter(team,pos){let rid=POS_ROLE[pos],rp=rid?roleStarter(team,rid):null;if(rp&&gameAvailable(rp))return rp;const healthy=orderedAt(team,pos).filter(gameAvailable);return healthy[0]||orderedAt(team,pos)[0]||team.roster[0]}
let unitCache=null;
function clearUnitCache(){unitCache=null;if(distCache.size>200000)distCache.clear()}
function unitCached(team,pos){unitCache??=new Map();let k=team.name+'|'+pos,v=unitCache.get(k);if(v===undefined){v=unit(team,[pos]);unitCache.set(k,v)}return v}
function unit(team,positions){let ids=[];let key=positions.slice().sort().join(',');if(key==='QB')ids=['QB1'];else if(key==='RB,TE,WR')ids=['RB1','X','Z','SLOT','TE1'];else if(key==='C,OG,OT')ids=['LT','LG','C1','RG','RT'];else if(key==='DT,EDGE,LB')ids=['RUSH','SETEDGE','NT','3TECH','MIKE','WILL'];else if(key==='CB,S')ids=['BCB','FCB','NICKEL','FS','BOXS'];if(ids.length){let v=ids.map(id=>roleStarter(team,id)).filter(gameAvailable).map(conditionRating);return avg(v)}let v=[];positions.forEach(pos=>{const a=orderedAt(team,pos).filter(gameAvailable);const n=(pos==='WR'||pos==='CB')?3:['OT','OG','EDGE','DT','LB','S'].includes(pos)?2:1;v.push(...a.slice(0,n).map(conditionRating))});return avg(v)}
// --- v0.9.10: scheme transitions -------------------------------------------
// A coordinator brings a system with him. Installing it costs a season or two
// of fit rather than a blunt rating penalty: while familiarity is low the
// roster still plays partly like the old scheme, plus a small install friction.
const SCHEME_SIDE={OC:'off',DC:'def'};
function schemeListFor(side){return Object.keys(side==='off'?OFF_SCHEMES:DEF_SCHEMES)}
function schemeDefFor(side,name){return (side==='off'?OFF_SCHEMES:DEF_SCHEMES)[name]}
function coachPreferredScheme(c,slot,t){
 const side=SCHEME_SIDE[slot];if(!side)return null;
 if(c.preferredScheme&&schemeDefFor(side,c.preferredScheme))return c.preferredScheme;
 return side==='off'?t?.offScheme||schemeListFor('off')[0]:t?.defScheme||schemeListFor('def')[0];
}
function ensureCoachScheme(c,slot,t){
 const side=SCHEME_SIDE[slot];if(!side||!c)return c;
 // Old saves get the scheme they are already running, so loading a v0.9.9
 // dynasty never starts a transition nobody asked for.
 c.preferredScheme??=(side==='off'?t?.offScheme:t?.defScheme)||schemeListFor(side)[0];
 return c;
}
function schemeTransition(t,side){const tr=t?.schemeTransition?.[side];return tr&&tr.familiarity<100?tr:null}
function schemeFamiliarity(t,side){return schemeTransition(t,side)?.familiarity??100}
function setTeamScheme(t,side,to,reason='Staff change'){
 if(!t||!schemeDefFor(side,to))return null;
 const from=side==='off'?t.offScheme:t.defScheme;
 if(from===to){if(t.schemeTransition)t.schemeTransition[side]=null;return null}
 const coach=side==='off'?t.staff?.OC:t.staff?.DC;
 // A veteran roster and an adaptable coordinator start further along.
 const returning=(t.roster||[]).filter(p=>p.year!=='FR').length,depth=clamp(Math.round(returning/Math.max(1,(t.roster||[]).length)*100),0,100);
 const start=clamp(Math.round(18+(coach?.adaptability||60)*.18+depth*.10),20,55);
 if(side==='off')t.offScheme=to;else t.defScheme=to;
 t.schemeTransition??={off:null,def:null};
 t.schemeTransition[side]={from,to,side,startSeason:universe.year,familiarity:start,reason};
 return t.schemeTransition[side];
}
function advanceSchemeInstall(t,phase){
 t.schemeTransition??={off:null,def:null};
 for(const side of ['off','def']){
  const tr=schemeTransition(t,side);if(!tr)continue;
  const coach=side==='off'?t.staff?.OC:t.staff?.DC;
  const teach=((coach?.playCall||60)+(coach?.adaptability||60))/2;
  const gain=(phase==='spring'?20:phase==='fall'?14:7)+Math.round((teach-60)*.22)+Math.round(((t.development||60)-60)*.10);
  tr.familiarity=clamp(tr.familiarity+Math.max(3,gain),0,100);
  if(tr.familiarity>=100)t.schemeTransition[side]=null;
 }
}
function schemeFitFor(p,def){if(!def)return null;const vals=def.traits.map(k=>p[k]||p.trueNow);let fit=avg(vals);if(p.pos==='QB'&&def.qb&&def.qb.includes(p.style))fit+=8;return fit}
function schemeInstallNote(t,side){
 const tr=schemeTransition(t,side);if(!tr)return '';
 const yr=universe.year-tr.startSeason;
 return `Installing ${tr.to} (from ${tr.from}) · ${tr.familiarity}% installed · ${yr<=0?'first offseason':`year ${yr+1}`}`;
}
function playerSchemeFit(p,t){
 const off=OFF_POS.has(p.pos),side=off?'off':'def';
 let fit=schemeFitFor(p,off?OFF_SCHEMES[t.offScheme]:DEF_SCHEMES[t.defScheme]);
 const tr=schemeTransition(t,side);
 if(tr){
  // Installing costs most in year one and eases as the system goes in. A player
  // who was well suited to the old scheme has the most to unlearn, so he pays
  // the steepest transitional price on top of already fitting the new one less.
  const prev=schemeFitFor(p,schemeDefFor(side,tr.from));
  const drag=(100-clamp(tr.familiarity,0,100))/100;
  const relearn=prev==null?1:clamp(1+Math.max(0,prev-fit)/50,1,1.8);
  fit-=drag*7*relearn;
 }
 return clamp(Math.round(fit),35,99);
}
function profiles(t){
 const qb=unit(t,['QB']),skill=unit(t,['RB','WR','TE']),ol=unit(t,['OT','OG','C']),front=unit(t,['EDGE','DT','LB']),coverage=unit(t,['CB','S']);
 const offPlayers=t.roster.filter(p=>OFF_POS.has(p.pos)&&(p.injuryWeeks||0)===0).sort((a,b)=>conditionRating(b)-conditionRating(a)).slice(0,22),defPlayers=t.roster.filter(p=>!OFF_POS.has(p.pos)&&(p.injuryWeeks||0)===0).sort((a,b)=>conditionRating(b)-conditionRating(a)).slice(0,22);
 const offFit=avg(offPlayers.map(p=>playerSchemeFit(p,t))),defFit=avg(defPlayers.map(p=>playerSchemeFit(p,t))),oc=t.staff.OC,dc=t.staff.DC;
 const offense=clamp(qb*.29+skill*.27+ol*.22+offFit*.08+oc.playCall*.07+oc.development*.03+t.facilities*.04,35,99),defense=clamp(front*.39+coverage*.32+defFit*.09+dc.playCall*.08+dc.development*.04+t.facilities*.04+DEF_SCHEMES[t.defScheme].run*.02+DEF_SCHEMES[t.defScheme].coverage*.02,35,99);
 return {qb,skill,ol,front,coverage,offFit,defFit,offense,defense,overall:(offense+defense)/2};
}
function circlePair(arr,round){let a=[...arr],fixed=a[0],rest=a.slice(1);for(let r=0;r<round;r++)rest=[rest.at(-1),...rest.slice(0,-1)];a=[fixed,...rest];let o=[];for(let i=0;i<a.length/2;i++)o.push([a[i],a[a.length-1-i]]);return o}
function buildSchedule(){universe.teams.forEach(t=>t.schedule=[]);universe.schedule=Array.from({length:12},()=>[]);const cn=allConfs();for(let w=0;w<4;w++)circlePair(cn,w).forEach(([ca,cb])=>{const A=universe.teams.filter(t=>t.conference===ca),B=universe.teams.filter(t=>t.conference===cb);for(let i=0;i<Math.min(A.length,B.length);i++){let j=(i+w)%B.length,home=(i+w)%2===0?A[i]:B[j],away=home===A[i]?B[j]:A[i];universe.schedule[w].push({week:w+1,home:home.name,away:away.name,conf:false,played:false})}});allConfs().forEach(c=>{let arr=universe.teams.filter(t=>t.conference===c);if(arr.length%2)return;for(let r=0;r<8;r++)circlePair(arr,r).forEach(([a,b],k)=>{let home=(r+k)%2===0?a:b,away=home===a?b:a;universe.schedule[4+r].push({week:r+5,home:home.name,away:away.name,conf:true,played:false})})});universe.schedule.flat().forEach(g=>{T(g.home)?.schedule.push(g);T(g.away)?.schedule.push(g)})}
// Immutable game snapshots. Sparse player deltas retain only actual game production.
function beginGame(home,away,neutral,context={}){
 // All simulation paths enter here after weekly recovery. Charge preparation once,
 // before profiles are measured, so rest cannot erase its cost before kickoff.
 applyGameplanWear(home,away.name);applyGameplanWear(away,home.name);
 const side=(t,opp)=>({id:t.id,name:t.name,rank:t.rank,record:`${t.w}-${t.l}`,gameplan:gameplanSnapshot(t,opp.name),players:new Map(t.roster.map(p=>[p.id,{stats:{...p.stats},injuries:p.injuryHistory?.length||0}]))});
 return {season:universe.year,week:context.week??universe.week+1,phase:universe.phase,label:context.label||'Regular season',venue:neutral?'Neutral site':`${home.name} · ${home.city||''}`,home:side(home,away),away:side(away,home)};
}
function finishGame(before,home,away,result){
 universe.gameArchive??=[];universe.gameArchiveVersion??=1;universe.gameCounter=(universe.gameCounter||0)+1;
 const id=`G${before.season}_${universe.gameCounter}`,players={},injuries=[];
 for(const [side,t] of [['home',home],['away',away]]){
  players[side]=[];
  for(const p of t.roster){const old=before[side].players.get(p.id),stats={};if(!old)continue;
   for(const k of Object.keys(p.stats)){const delta=(p.stats[k]||0)-(old.stats[k]||0);if(delta)stats[k]=delta}
   if(Object.keys(stats).length)players[side].push({id:p.id,name:p.name,pos:p.pos,stats});
   for(const injury of (p.injuryHistory||[]).slice(old.injuries))injuries.push({playerId:p.id,name:p.name,school:t.name,type:injury.type,weeks:injury.weeks});
  }
  delete before[side].players;
 }
 const record={id,...before,final:true,score:{home:result.hp,away:result.ap},teamStats:JSON.parse(JSON.stringify(result.box)),playerStats:players,injuries,drives:result.drives||[],detailed:!!result.detailed};
 record.scoreAdjustment={};for(const s of ['home','away']){const b=record.teamStats[s];record.scoreAdjustment[s]=record.score[s]-((b.passTD+b.rushTD)*7+b.fgMade*3)}
 record.formerPlayers=[];for(const [side,t,opp] of [['home',home,away],['away',away,home]])for(const p of t.roster)if(record.playerStats[side].some(x=>x.id===p.id)&&(p.transferHistory||[]).some(x=>x.fromSchoolId===opp.id))record.formerPlayers.push({id:p.id,name:p.name,school:t.name,formerSchool:opp.name});
 universe.gameArchive.push(record);result.gameId=id;
 // Compact ledger reference; boxes, names and scores have one canonical snapshot.
 universe.events??=[];universe.events.push({id:`EVT_${id}`,type:before.label==='National Championship'?'CHAMPIONSHIP_WON':'GAME_COMPLETED',season:before.season,week:before.week,schoolIds:[home.id,away.id],playerIds:record.formerPlayers.map(p=>p.id),coachIds:[],gameIds:[id],importance:before.label==='National Championship'?95:30,summary:`${result.away} ${result.ap} – ${result.hp} ${result.home}`});
 return result;
}
const gameEscape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function gameLink(id,label='Open Game Center'){return id?`<button type="button" class="game-link" data-game="${gameEscape(id)}">${gameEscape(label)}</button>`:'<span class="muted">Box score unavailable (older save)</span>'}
function gameTable(headers,rows){return `<div class="table-wrap game-table"><table><thead><tr>${headers.map(x=>`<th>${gameEscape(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(x=>`<td>${gameEscape(x??'—')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
// --- v0.9.7: deterministic game recaps -------------------------------------
// Prose is derived from the archived box score on demand and never stored, so
// recaps appear for every game already in an old save and cost nothing to keep.
// Wording is picked from a seeded stream keyed to the game id: the same game
// always reads the same way, and generating a recap never touches Math.random,
// so reading history can never perturb the simulation.
function recapHash(value){let h=2166136261>>>0;const s=String(value??'');for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function recapPicker(seed){let s=recapHash(seed)||1;return arr=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return arr[s%arr.length]}}
function recapLeader(g,side,key,min=1){const p=(g.playerStats?.[side]||[]).slice().sort((a,b)=>(b.stats[key]||0)-(a.stats[key]||0))[0];return p&&(p.stats[key]||0)>=min?p:null}
function recapStopper(g,side){
 // Deliberately high bars: one sack or one interception happens in nearly
 // every game, so mentioning those would make every recap read the same.
 const rows=(g.playerStats?.[side]||[]);
 const top=key=>rows.slice().sort((a,b)=>(b.stats[key]||0)-(a.stats[key]||0))[0];
 const bySack=top('sacks');if((bySack?.stats.sacks||0)>=2)return{p:bySack,kind:'sacks'};
 const byInt=top('intDef');if((byInt?.stats.intDef||0)>=2)return{p:byInt,kind:'int'};
 const byTackle=top('tackles');if((byTackle?.stats.tackles||0)>=11)return{p:byTackle,kind:'tackles'};
 if((byInt?.stats.intDef||0)>=1&&(byInt?.stats.tackles||0)>=7)return{p:byInt,kind:'int'};
 return null;
}
function recapFacts(g){
 const homeWon=g.score.home>=g.score.away,w=homeWon?'home':'away',l=homeWon?'away':'home';
 const ws=g.teamStats[w],ls=g.teamStats[l];
 const wYds=(ws.passYds||0)+(ws.rushYds||0),lYds=(ls.passYds||0)+(ls.rushYds||0);
 const wRank=Number(g[w].rank)||null,lRank=Number(g[l].rank)||null;
 const ranked=r=>r!=null&&r<=25;
 return {
  win:g[w],lose:g[l],winSide:w,loseSide:l,ws,ls,
  wPts:g.score[w],lPts:g.score[l],margin:g.score[w]-g.score[l],
  wYds,lYds,yardEdge:wYds-lYds,
  toMargin:(ls.turnovers||0)-(ws.turnovers||0),
  sacksBy:ls.sacksTaken||0,           // the winner's defense produced these
  neutral:g.venue==='Neutral site',winnerAtHome:w==='home',
  wRank,lRank,rankedWinner:ranked(wRank),rankedLoser:ranked(lRank),
  // An upset is the unranked (or clearly lower-ranked) side winning.
  upset:ranked(lRank)&&(!ranked(wRank)||(wRank-lRank)>=8),
  outgained:wYds<lYds,
  fgMade:ws.fgMade||0,shutout:g.score[l]===0,
  title:g.label&&g.label!=='Regular season'?g.label:null,
 };
}
function recapResultLine(g,f,pick){
 const w=gameEscape(f.win.name),l=gameEscape(f.lose.name),score=`${f.wPts}–${f.lPts}`;
 const where=f.neutral?' at a neutral site':f.winnerAtHome?' at home':' on the road';
 const winName=f.upset&&!f.rankedWinner?`Unranked ${w}`:f.rankedWinner?`No. ${f.wRank} ${w}`:w;
 const loseName=f.rankedLoser?`No. ${f.lRank} ${l}`:l;
 const verb=f.upset?pick(['knocked off','upset','took down','stunned'])
  :f.shutout?pick(['shut out','blanked'])
  :f.margin>=24?pick(['ran away from','buried','overwhelmed','rolled past'])
  :f.margin>=14?pick(['handled','pulled away from','beat','controlled'])
  :f.margin>=9?pick(['beat','got past','took care of'])
  :f.margin>=4?pick(['held off','edged','beat'])
  :pick(['survived','slipped past','outlasted','edged']);
 const tail=f.title?` in the ${gameEscape(f.title)}`:where;
 return `${winName} ${verb} ${loseName} ${score}${tail}.`;
}
function recapHowLine(g,f,pick){
 if(f.outgained&&f.toMargin>0)
  return `${gameEscape(f.win.name)} was outgained ${f.lYds}–${f.wYds} and won anyway, ${pick(['cashing in','turning the game'])} on a ${f.toMargin > 1 ? `plus-${f.toMargin}` : 'plus-one'} turnover margin.`;
 if(f.outgained)
  return `${gameEscape(f.win.name)} won without the better day on offense, outgained ${f.lYds}–${f.wYds}.`;
 if(f.toMargin>=2)
  return `The difference was the ball: ${gameEscape(f.lose.name)} gave it away ${f.ls.turnovers} time${f.ls.turnovers===1?'':'s'} to ${gameEscape(f.win.name)}'s ${f.ws.turnovers}.`;
 if((f.ws.rushYds||0)>=200)
  return `${gameEscape(f.win.name)} ${pick(['leaned on the run','pounded the ball','ground it out'])} for ${f.ws.rushYds} rushing yards on the way to ${f.wYds} total.`;
 if((f.ws.passYds||0)>=300)
  return `${gameEscape(f.win.name)} threw for ${f.ws.passYds} yards and finished with ${f.wYds} total.`;
 if(f.sacksBy>=4)
  return `${gameEscape(f.win.name)}'s front wrecked the pocket, sacking ${gameEscape(f.lose.name)} ${f.sacksBy} times.`;
 if(f.yardEdge>=150)
  return `${gameEscape(f.win.name)} controlled the game statistically, ${f.wYds} yards to ${f.lYds}.`;
 if(Math.abs(f.yardEdge)<=60)
  return pick([
   `The teams were even on the stat sheet, ${f.wYds} yards to ${f.lYds}.`,
   `Neither offense separated: ${f.wYds} yards to ${f.lYds}.`,
   `There was nothing between them statistically — ${f.wYds} yards to ${f.lYds} — and ${gameEscape(f.win.name)} made the plays that counted.`,
   `${gameEscape(f.win.name)} won an evenly played game, ${f.wYds} yards to ${f.lYds}.`]);
 return `${gameEscape(f.win.name)} finished with ${f.wYds} total yards to ${f.lYds} for ${gameEscape(f.lose.name)}.`;
}
function recapStarLine(g,f,pick){
 const bits=[],side=f.winSide;
 const passer=recapLeader(g,side,'passYds',150),rusher=recapLeader(g,side,'rushYds',75),receiver=recapLeader(g,side,'recYds',70);
 if(passer){const s=passer.stats,td=s.passTD||0,int=s.int||0;
  bits.push(`${gameEscape(passer.name)} threw for ${s.passYds} yards${s.passComp?` on ${s.passComp}-of-${s.passAtt||s.passComp}`:''}${td?` with ${td} touchdown${td===1?'':'s'}`:''}${int?` and ${int} interception${int===1?'':'s'}`:''}`)}
 if(rusher){const s=rusher.stats;
  bits.push(`${gameEscape(rusher.name)} ran for ${s.rushYds} yards${s.rushAtt?` on ${s.rushAtt} carries`:''}${s.rushTD?` and ${s.rushTD===1?'a score':`${s.rushTD} scores`}`:''}`)}
 if(receiver&&bits.length<3){const s=receiver.stats;
  bits.push(`${gameEscape(receiver.name)} caught ${s.receptions||0} passes for ${s.recYds} yards${s.recTD?' and a score':''}`)}
 if(!bits.length){
  const stop=recapStopper(g,side);
  if(!stop)return '';
  return `${gameEscape(stop.p.name)} led the defense${stop.kind==='sacks'?` with ${stop.p.stats.sacks} sack${stop.p.stats.sacks===1?'':'s'}`:stop.kind==='int'?` with an interception`:` with ${stop.p.stats.tackles} tackles`}.`;
 }
 let out=`${bits.join('; ')}.`;
 // In a tight game the losing side's best performance is part of the story.
 if(f.margin<=10){
  const lp=recapLeader(g,f.loseSide,'passYds',260)||recapLeader(g,f.loseSide,'rushYds',110);
  if(lp)out+=` ${gameEscape(lp.name)} ${lp.stats.passYds>=260?`threw for ${lp.stats.passYds}`:`ran for ${lp.stats.rushYds}`} yards in the loss.`;
 }
 return out;
}
function recapColorLine(g,f,pick){
 const lines=[];
 const stop=recapStopper(g,f.winSide);
 if(stop&&stop.kind==='sacks')
  lines.push(`${gameEscape(stop.p.name)} got home ${stop.p.stats.sacks} times.`);
 else if(stop&&stop.kind==='int')
  lines.push(`${gameEscape(stop.p.name)} intercepted ${stop.p.stats.intDef>1?`${stop.p.stats.intDef} passes`:'a pass'}.`);
 else if(stop&&stop.kind==='tackles')
  lines.push(`${gameEscape(stop.p.name)} finished with ${stop.p.stats.tackles} tackles.`);
 const returning=(g.formerPlayers||[]).filter(p=>(g.playerStats[f.winSide]||[]).some(x=>x.id===p.id)||(g.playerStats[f.loseSide]||[]).some(x=>x.id===p.id));
 for(const p of returning.slice(0,1))
  lines.push(`${gameEscape(p.name)} played against ${gameEscape(p.formerSchool)}, his former school.`);
 // A one-week knock is not news; only a real absence is.
 const hurt=(g.injuries||[]).filter(x=>(x.weeks||0)>=3).slice(0,1);
 for(const inj of hurt)
  lines.push(`${gameEscape(inj.school)} lost ${gameEscape(inj.name)} to injury (${gameEscape(inj.type)}${inj.weeks?`, ${inj.weeks} week${inj.weeks===1?'':'s'}`:''}).`);
 if(!lines.length&&f.fgMade>=3)
  lines.push(`${gameEscape(f.win.name)} made ${f.fgMade} field goals.`);
 return lines.join(' ');
}
// Returns plain text sentences; callers escape nothing further because the
// team/player names are escaped as they are interpolated above.
function gameRecap(g,{short=false}={}){
 if(!g||!g.teamStats||!g.score)return {headline:'',body:''};
 const f=recapFacts(g),pick=recapPicker(g.id||`${g.season}_${g.week}_${g.home?.name}`);
 const result=recapResultLine(g,f,pick);
 if(short)return {headline:result,body:result};
 const body=[result,recapHowLine(g,f,pick),recapStarLine(g,f,pick),recapColorLine(g,f,pick)].filter(Boolean).join(' ');
 return {headline:result,body};
}
// --- v0.9.7: weekly newsletter ---------------------------------------------
// A week's archived games, ranked by how much they mattered, turned into a
// lead story plus short items. Everything is derived at render time from the
// same immutable game records the Game Center reads.
function newsWeeks(){const out=new Map();for(const g of universe.gameArchive||[])out.set(`${g.season}|${g.week}`,{season:g.season,week:g.week,label:g.label});return [...out.values()].sort((a,b)=>b.season-a.season||b.week-a.week)}
function newsGames(season,week,scope,teamName){
 const conf=T(teamName)?.conference;
 return (universe.gameArchive||[]).filter(g=>{
  if(g.season!==season||g.week!==week)return false;
  if(scope==='team')return g.home.name===teamName||g.away.name===teamName;
  if(scope==='conference')return [g.home.name,g.away.name].some(n=>T(n)?.conference===conf);
  return true;
 });
}
// Newsworthiness: ranked teams, upsets, close finishes and blowouts all rate.
function newsWeight(g){
 const f=recapFacts(g);let w=0;
 if(f.rankedWinner)w+=Math.max(0,30-f.wRank);
 if(f.rankedLoser)w+=Math.max(0,30-f.lRank);
 if(f.upset)w+=45;
 if(f.title)w+=60;
 if(f.margin<=3)w+=14;else if(f.margin<=7)w+=8;
 if(f.shutout)w+=10;
 if(f.margin>=35)w+=8;
 if((g.formerPlayers||[]).length)w+=6;
 return w;
}
function newsStandingsNote(season,week,teamName){
 const t=T(teamName);if(!t)return '';
 const played=(universe.gameArchive||[]).filter(g=>g.season===season&&(g.home.name===teamName||g.away.name===teamName));
 if(!played.length)return '';
 const last=played[played.length-1],side=last.home.name===teamName?'home':'away';
 const won=last.score[side]>last.score[side==='home'?'away':'home'];
 return `${gameEscape(teamName)} is ${t.w}-${t.l} (${t.cw}-${t.cl} ${gameEscape(t.conference)})${t.rank&&t.rank<=25?`, ranked No. ${t.rank}`:''} after ${won?'the win':'the loss'}.`;
}
function weeklyNewsletter(season,week,scope,teamName){
 const games=newsGames(season,week,scope,teamName).slice().sort((a,b)=>newsWeight(b)-newsWeight(a));
 if(!games.length)return null;
 const [lead,...rest]=games;
 return {
  season,week,scope,
  title:scope==='team'?`${teamName} · Week ${week}`:scope==='conference'?`${T(teamName)?.conference||'Conference'} · Week ${week}`:`National · Week ${week}`,
  lead:{game:lead,recap:gameRecap(lead)},
  items:rest.slice(0,scope==='national'?12:24).map(g=>({game:g,recap:gameRecap(g,{short:true})})),
  more:Math.max(0,rest.length-(scope==='national'?12:24)),
  note:newsStandingsNote(season,week,teamName),
 };
}
function gameBoxHTML(g){
 const fields=[['First downs','firstDowns'],['Plays','plays'],['Passing yards','passYds'],['Rushing yards','rushYds'],['Turnovers','turnovers'],['Sacks taken','sacksTaken'],['Field goals made','fgMade'],['Field goal attempts','fgAtt'],['Punts','punts']];
 let rows=[['Total yards',...['away','home'].map(s=>g.teamStats[s].passYds+g.teamStats[s].rushYds)],...fields.map(([n,k])=>[n,g.teamStats.away[k],g.teamStats.home[k]])];
 let html='<h3>Team statistics</h3>'+gameTable(['Statistic',g.away.name,g.home.name],rows)+'<p class="muted">Quarter scores, possession, third/fourth downs, penalties and long gains are not tracked. Player totals are allocated by the simulation from team production.</p>';
 const groups=[['Passing',['Cmp','Att','Yds','TD','INT','Sacks'],['passComp','passAtt','passYds','passTD','int','sacksTaken'],'passAtt'],['Rushing',['Car','Yds','Avg','TD'],['rushAtt','rushYds','rushAvg','rushTD'],'rushAtt'],['Receiving',['Rec','Targets','Yds','Avg','TD'],['receptions','targets','recYds','recAvg','recTD'],'targets'],['Defense',['Tkl','TFL','Sack','INT','PD','Pressures'],['tackles','tfl','sacks','intDef','passBreakups','pressures'],'tackles'],['Kicking',['FGM','FGA'],['fgMade','fgAtt'],'fgAtt'],['Punting',['Punts','Yds','Avg'],['punts','puntYds','puntAvg'],'punts']];
 for(const side of ['away','home']){html+=`<h3>${gameEscape(g[side].name)}</h3>`;for(const [title,cols,keys,filter] of groups){const list=g.playerStats[side].filter(p=>p.stats[filter]||keys.some(k=>p.stats[k]));if(!list.length)continue;html+=`<h4>${title}</h4>`+gameTable(['Player','Pos',...cols],list.map(p=>[p.name,p.pos,...keys.map(k=>{const s=p.stats;if(k==='rushAvg')return s.rushAtt?((s.rushYds||0)/s.rushAtt).toFixed(1):'—';if(k==='recAvg')return s.receptions?((s.recYds||0)/s.receptions).toFixed(1):'—';if(k==='puntAvg')return s.punts?((s.puntYds||0)/s.punts).toFixed(1):'—';return s[k]||0})]))}}
 return html;
}
// Derived from immutable game records: no new report text or live roster lookup.
function coachingReportHTML(g){
 const sections=['away','home'].map(side=>{
  const other=side==='home'?'away':'home',s=g.teamStats?.[side],o=g.teamStats?.[other];
  if(!s||!o)return `<section><h4>${gameEscape(g[side]?.name)}</h4><p>Coaching report unavailable: no recorded box score.</p></section>`;
  const known=x=>Number.isFinite(x),n=x=>known(x)?String(x):'unavailable';
  const ypc=known(o.rushYds)&&o.rushAtt>0?(o.rushYds/o.rushAtt).toFixed(1):'unavailable';
  const plan=g[side]?.gameplan,planText=plan?plan.label:'Not recorded for this older game';
  let next='Keep the balanced approach available; choose the next plan from the next opponent’s tendencies.';
  if(known(s.turnovers)&&s.turnovers>=2)next='Review ball security and quarterback decisions before chasing a more aggressive plan.';
  else if(known(s.sacksTaken)&&s.sacksTaken>=3)next='Review protection and your offensive-line depth chart before next week.';
  else if(o.rushAtt>=15&&o.rushYds/o.rushAtt>=5)next='Consider a stronger run front against a similar opponent; expect to give up some coverage.';
  else if(o.passAtt>=15&&o.passYds/o.passAtt>=8)next='Consider tighter pass coverage against a similar opponent; expect a softer run front.';
  const injuries=(g.injuries||[]).filter(i=>i.school===g[side]?.name);
  return `<section class="profile-section"><h4>${gameEscape(g[side]?.name)}</h4><p><strong>Plan:</strong> ${gameEscape(planText)}</p><p>Turnovers: ${n(s.turnovers)} committed / ${n(o.turnovers)} forced. Sacks: ${n(s.sacksTaken)} allowed / ${n(o.sacksTaken)} made.</p><p>Defense allowed ${n(o.rushYds)} rushing yards (${ypc} per carry) and ${n(o.passYds)} passing yards.</p><p><strong>Next practice:</strong> ${gameEscape(next)}</p>${injuries.length?`<p><strong>Availability:</strong> Review ${injuries.map(i=>gameEscape(i.name)).join(', ')} before setting next week’s lineup.</p>`:''}</section>`;
 });
 return `<section class="coaching-report"><h3>Postgame coaching report</h3><p class="muted">Recorded results and suggestions for next week. These numbers do not isolate the effect of a gameplan.</p><div class="profile-sections">${sections.join('')}</div></section>`;
}
function gameSummaryHTML(g){
 const winner=g.score.home>g.score.away?g.home:g.away;
 let html=`<p class="recap">${gameRecap(g).body}</p><p><strong>${gameEscape(winner.name)} wins by ${Math.abs(g.score.home-g.score.away)}.</strong> Total offense: ${gameEscape(g.away.name)} ${g.teamStats.away.passYds+g.teamStats.away.rushYds} yards; ${gameEscape(g.home.name)} ${g.teamStats.home.passYds+g.teamStats.home.rushYds} yards.</p><p class="muted">The recap above is written from this box score. Quarter-by-quarter scores, attendance and game clock are unavailable.</p>${coachingReportHTML(g)}<h3>Game leaders</h3>`;
 for(const side of ['away','home']){html+=`<h4>${gameEscape(g[side].name)}</h4>`;for(const [label,key] of [['Passing','passYds'],['Rushing','rushYds'],['Receiving','recYds'],['Tackles','tackles']]){const p=g.playerStats[side].slice().sort((a,b)=>(b.stats[key]||0)-(a.stats[key]||0))[0];if(p?.stats[key])html+=`<div class="lineitem"><span>${label} · ${gameEscape(p.name)}</span><strong>${p.stats[key]}${key==='tackles'?'':' yds'}</strong></div>`}}
 html+='<h3>Scoring summary</h3>';const scoring=(g.drives||[]).filter(d=>d.points);html+=scoring.length?scoring.map(d=>`<div class="lineitem"><span>${gameEscape(d.label)} · ${gameEscape(g[d.side].name)}</span><strong>${gameEscape(d.result)} +${d.points}</strong></div>`).join(''):'<p class="muted">Individual scoring plays were not retained for this simulation.</p>';
 for(const s of ['away','home'])if(g.scoreAdjustment?.[s])html+=`<p class="muted">${gameEscape(g[s].name)}: ${g.scoreAdjustment[s]} additional simulation points (home-field/tiebreak adjustment; no scoring play recorded).</p>`;
 if(g.formerPlayers?.length)html+='<h3>Familiar faces</h3>'+g.formerPlayers.map(p=>`<p>${gameEscape(p.name)} appeared for ${gameEscape(p.school)} against former school ${gameEscape(p.formerSchool)}.</p>`).join('');
 html+='<h3>Injuries recorded in this game</h3>'+(g.injuries?.length?g.injuries.map(i=>`<p>${gameEscape(i.name)} · ${gameEscape(i.school)} · ${gameEscape(i.type)}, ${i.weeks} week(s)</p>`).join(''):'<p class="muted">None recorded.</p>');return html;
}
function gameDrivesHTML(g){
 if(!g.drives?.length)return '<p>No drive detail recorded. Use Box Score for the permanent statistics.</p>';
 const score={away:0,home:0};
 const drives=g.drives.map((d,i)=>{
  score[d.side]=(score[d.side]||0)+(d.points||0);
  const team=g[d.side]?.name||d.side,result=d.result||'END';
  return `<button type="button" class="drive-step" data-drive-step="${i}" data-side="${gameEscape(d.side)}" data-result="${gameEscape(result)}" data-points="${Number(d.points)||0}" data-plays="${Number(d.plays)||0}" data-away-score="${score.away}" data-home-score="${score.home}" aria-label="Drive ${i+1}: ${gameEscape(team)}, ${gameEscape(result)}, ${Number(d.points)||0} points"><span>${gameEscape(d.label||`D${i+1}`)}</span><strong>${gameEscape(team)}</strong><small>${gameEscape(result)} · ${Number(d.plays)||0} plays${d.points?` · +${d.points}`:''}</small></button>`;
 }).join('');
 return `<section class="drive-replay" data-drive-replay data-away="${gameEscape(g.away.name)}" data-home="${gameEscape(g.home.name)}"><div class="drive-replay-head"><div><div class="eyebrow">POSSESSION REPLAY</div><h3>Drive sequence</h3></div><button type="button" data-drive-play aria-pressed="false">Play sequence</button></div><div class="drive-field" role="img" aria-label="Schematic field showing recorded drive outcomes; exact field position was not retained"><div class="drive-endzone away"><span>${gameEscape(g.away.name)}</span></div><div class="drive-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b class="drive-ball">🏈</b></div><div class="drive-endzone home"><span>${gameEscape(g.home.name)}</span></div></div><div class="drive-live" aria-live="polite"><div><span>${gameEscape(g.away.name)}</span><strong data-drive-away-score>0</strong></div><p data-drive-caption>Select a drive or play the recorded sequence.</p><div><span>${gameEscape(g.home.name)}</span><strong data-drive-home-score>0</strong></div></div><div class="drive-sequence" role="list" aria-label="Recorded drives">${drives}</div></section><p class="muted">This is a schematic outcome replay. Drives begin at the 25, but exact field position, clock and possession time were not retained. The final score can also include recorded home-field or tiebreak adjustments.</p>`;
}
function gameWatchHTML(g){
 if(!g.drives?.length)return '<section class="watch-unavailable"><h3>Watch Mode unavailable</h3><p>This game does not have recorded drive detail. Its permanent result and statistics are still available in Summary and Box Score.</p></section>';
 const score={away:0,home:0};
 const drives=g.drives.map((d,i)=>{score[d.side]=(score[d.side]||0)+(Number(d.points)||0);const team=g[d.side]?.name||d.side,result=d.result||'END',plays=Number(d.plays)||0,events=(d.playByPlay||[]).map((x,j)=>`<span data-watch-play-event="${j}">${gameEscape(x)}</span>`).join('');let recap;if(result==='TD')recap=`${team} reaches the end zone`;else if(result==='FG')recap=`${team} converts a field goal`;else if(result==='MISS')recap=`${team} misses the field goal`;else if(result==='PUNT')recap=`${team} punts`;else if(result==='INT')recap=`${team}'s possession ends with an interception`;else recap=`${team}'s possession ends`;return `<article class="watch-drive" data-watch-drive="${i}" data-side="${gameEscape(d.side)}" data-result="${gameEscape(result)}" data-points="${Number(d.points)||0}" data-away-score="${score.away}" data-home-score="${score.home}" hidden><span>${gameEscape(d.label||`D${i+1}`)}</span><strong>${gameEscape(team)}</strong><small>${gameEscape(result)} · ${plays} plays${d.points?` · +${d.points}`:''}</small><p>${gameEscape(recap)} after ${plays} plays. Score: ${gameEscape(g.away.name)} ${score.away}, ${gameEscape(g.home.name)} ${score.home}.</p><div data-watch-play-events hidden>${events}</div></article>`}).join('');
 const adjustmentAway=Number(g.scoreAdjustment?.away)||0,adjustmentHome=Number(g.scoreAdjustment?.home)||0;
 return `<section class="watch-mode" data-watch-game data-away="${gameEscape(g.away.name)}" data-home="${gameEscape(g.home.name)}" data-final-away="${Number(g.score.away)||0}" data-final-home="${Number(g.score.home)||0}" data-adjust-away="${adjustmentAway}" data-adjust-home="${adjustmentHome}"><div class="watch-header"><div><div class="eyebrow">BROADCAST WATCH MODE</div><h3>${gameEscape(g.away.name)} at ${gameEscape(g.home.name)}</h3></div><div class="watch-controls"><button type="button" data-watch-play aria-pressed="false">Play</button><button type="button" data-watch-next>Next play</button><label>Speed<select data-watch-speed aria-label="Broadcast speed"><option value="1400">Slow</option><option value="850" selected>Normal</option><option value="400">Fast</option></select></label><button type="button" data-watch-skip>Skip to final</button></div></div><div class="drive-field watch-field" role="img" aria-label="Schematic broadcast field showing recorded drive outcomes; exact field position was not retained"><div class="drive-endzone away"><span>${gameEscape(g.away.name)}</span></div><div class="drive-grid" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><b class="drive-ball">🏈</b></div><div class="drive-endzone home"><span>${gameEscape(g.home.name)}</span></div></div><div class="drive-live watch-score" aria-live="polite"><div><span>${gameEscape(g.away.name)}</span><strong data-watch-away-score>0</strong></div><p data-watch-caption>Ready for kickoff. Press Play or reveal the next play.</p><div><span>${gameEscape(g.home.name)}</span><strong data-watch-home-score>0</strong></div></div><section class="watch-playboard"><div class="eyebrow" data-watch-play-kicker>LIVE PLAY-BY-PLAY</div><ol data-watch-play-log aria-live="polite"><li class="watch-play-empty">The opening play will appear here.</li></ol></section><div class="watch-progress"><span data-watch-progress>0 of ${g.drives.length} drives</span><i><b data-watch-progress-bar></b></i></div><div class="watch-feed" role="log" aria-live="polite" aria-label="Completed drive recaps">${drives}</div><div class="watch-final" data-watch-final-card hidden><div class="eyebrow">FINAL</div><strong data-watch-final-line></strong><p data-watch-adjustment hidden></p><button type="button" data-watch-summary>Open final summary</button></div><p class="muted watch-disclosure">The game is calculated once before this broadcast begins. New detailed games retain their generated play calls; older archives without them advance one drive at a time. Exact field position, clock and possession time are not retained or invented.</p></section>`;
}
let openedGameId=null;
let candidateOfferDraft=null;
function showGameCenter(id,tab='Summary'){
 if(gamesAreDeferred())return storageOperation(async()=>{await ensureGamesLoaded();showGameCenter(id,tab)});
 const g=(universe.gameArchive||[]).find(x=>x.id===id);if(!g)return;openedGameId=id;
 const watching=tab==='Watch';
 $('#gameDialogName').textContent=watching?`${g.away.name} at ${g.home.name}`:`${g.away.name} ${g.score.away} — ${g.score.home} ${g.home.name}`;
 $('#gameDialogMeta').textContent=`${watching?'WATCH MODE':'FINAL'} · ${g.season} · Week ${g.week} · ${g.label} · ${g.venue}`;
 $('#gamePregame').textContent=`Pregame: ${g.away.name} ${g.away.record} (#${g.away.rank??'—'}) · ${g.home.name} ${g.home.record} (#${g.home.rank??'—'})`;
 $$('#gameTabs button').forEach(b=>{b.classList.toggle('active',b.dataset.gameTab===tab);b.setAttribute('aria-pressed',String(b.dataset.gameTab===tab))});
 let html;if(tab==='Watch')html=gameWatchHTML(g);else if(tab==='Box Score')html=gameBoxHTML(g);else if(tab==='Drives')html=gameDrivesHTML(g);else if(tab==='Play-by-Play'){const archived=(g.drives||[]).flatMap(d=>(d.playByPlay||[]).map(x=>`${d.label}: ${x}`)),d=universe.lastDetailedGame,lines=archived.length?archived:(d?.gameId===id?d.log||[]:[]);html=lines.length?`<p class="muted">${archived.length?'Archived generated play log.':'Temporary simulation log (last 160 entries).'} The drive model names primary players; box scores allocate production across the rotation. Clock and exact field position are unavailable.</p>`+lines.map(x=>`<div class="playline">${gameEscape(x)}</div>`).join(''):'<p>Play-by-play is unavailable for this archived game. Box scores and recorded drive summaries remain permanent.</p>'}else html=gameSummaryHTML(g);
 $('#gameDialogBody').innerHTML=html;const dialog=$('#gameDialog');if(!dialog.open)dialog.showModal();
}
function renderGameArchive(){
 if(gamesAreDeferred())return storageOperation(async()=>{await ensureGamesLoaded();renderGameArchive()});
 const picker=$('#gameHistoryYear'),previous=picker.value,teamId=selected().id,games=(universe.gameArchive||[]).filter(g=>g.home.id===teamId||g.away.id===teamId),years=[...new Set(games.map(g=>g.season))].sort((a,b)=>b-a);
 picker.innerHTML=years.map(y=>`<option value="${y}">${y}</option>`).join('');picker.value=years.includes(+previous)?previous:String(years[0]||'');
 $('#gameHistoryList').innerHTML=games.filter(g=>g.season===+picker.value).map(g=>`<div class="resultrow"><span>Week ${g.week} · ${gameEscape(g.label)}</span>${gameLink(g.id,`${g.away.name} ${g.score.away} — ${g.score.home} ${g.home.name}`)}</div>`).join('')||'<p class="muted">Games completed in v0.9.2 and later appear here for the selected school.</p>';
}

function recordGame(home,away,hp,ap,conf,H=profiles(home),A=profiles(away)){const win=hp>ap?home:away,lose=win===home?away:home;win.w++;lose.l++;if(conf){win.cw++;lose.cl++}home.pf+=hp;home.pa+=ap;away.pf+=ap;away.pa+=hp;home.sos+=A.overall;away.sos+=H.overall;return win}
function applyStarterStats(team,s,opp=null){applyGameStats(team,s,opp||{})}
function gameSim(home,away,neutral=false,confOverride=null,context={}){const before=beginGame(home,away,neutral,context);const H=gameProfiles(home,away.name),A=gameProfiles(away,home.name),ha=neutral?0:homeFieldFor(home);function side(O,D,team,scheme){let plays=clamp(Math.round(60+(scheme.pace-68)*.10+gauss()*4),52,72),passRate=clamp(scheme.pass+(O.qb-D.coverage)*.0012,.25,.64),passAtt=Math.round(plays*passRate),pressure=clamp(.13+(D.front-O.ol)*.0035+(DEF_SCHEMES[(team===home?away:home).defScheme].pressure-70)*.001+(D.prepPressure||0),.06,.30),sacksTaken=Math.round(passAtt*pressure*rng(.18,.34)),intRate=clamp(.018+(D.coverage-O.qb)*.0008,.008,.052),ints=Math.min(4,Math.round(passAtt*intRate+rng(-.25,.65))),compPct=clamp(.61+(O.qb-D.coverage)*.0032+gauss()*.025,.43,.78),passComp=clamp(Math.round(passAtt*compPct),0,passAtt-ints),ypc=clamp(9.8+(O.skill-D.coverage)*.045+gauss()*.7,7.0,13.8),passYds=Math.max(40,Math.round(passComp*ypc)),rushAtt=Math.max(15,plays-passAtt-sacksTaken),ypcRush=clamp(4.15+(O.ol-D.front)*.035+(O.skill-D.front)*.015+gauss()*.35,2.5,7.0),rushYds=Math.max(25,Math.round(rushAtt*ypcRush)),totalYds=passYds+rushYds,edge=(O.offense-D.defense)/12,tds=clamp(Math.round(totalYds/128+edge*.16+gauss()*.75),0,7),passTD=clamp(Math.round(tds*clamp(passRate+rng(-.10,.10),.25,.82)),0,tds),rushTD=tds-passTD,fg=clamp(Math.round(1.15+(totalYds-300)/240+gauss()*.7),0,4),fumblesLost=Math.random()<clamp(.45+(D.front-O.skill)*.01,.18,.80)?1:0,pts=tds*7+fg*3,firstDowns=Math.round(totalYds/18+rng(-2,3)),fgAtt=fg+(Math.random()<.55?1:0),punts=clamp(Math.round(5.4-(tds+fg)*.42+gauss()*1.1),1,9);return {pts,plays,firstDowns,passAtt,passComp,passYds,passTD,int:ints,sacksTaken,rushAtt,rushYds,rushTD,fumblesLost,turnovers:ints+fumblesLost,recYds:passYds,recTD:passTD,fgMade:fg,fgAtt,punts}}const hs=side(H,A,home,OFF_SCHEMES[home.offScheme]),as=side(A,H,away,OFF_SCHEMES[away.offScheme]);let hp=hs.pts+homeFieldScoreBonus(home,neutral),ap=as.pts;if(hp===ap)(Math.random()<.5?()=>hp+=3:()=>ap+=3)();const conf=confOverride??home.conference===away.conference,win=recordGame(home,away,hp,ap,conf,H,A);applyGameStats(home,hs,as);applyGameStats(away,as,hs);postGameCondition(home);postGameCondition(away);return finishGame(before,home,away,{home:home.name,away:away.name,hp,ap,winner:win.name,box:{home:hs,away:as}})}
function detailedDriveCount(homeScheme,awayScheme,noise=gauss()){
 const averagePace=((homeScheme?.pace??68)+(awayScheme?.pace??68))/2;
 return clamp(Math.round(22+(averagePace-68)*.13+noise*2),18,30);
}
function detailedGame(home,away,neutral=false,confOverride=null,context={}){
 const before=beginGame(home,away,neutral,context),drives=[];
 const H=gameProfiles(home,away.name),A=gameProfiles(away,home.name),hScheme=OFF_SCHEMES[home.offScheme],aScheme=OFF_SCHEMES[away.offScheme],log=[];
 const totals={home:{plays:0,firstDowns:0,passAtt:0,passComp:0,passYds:0,passTD:0,int:0,rushAtt:0,rushYds:0,rushTD:0,recYds:0,recTD:0,sacksTaken:0,fumblesLost:0,turnovers:0,fgMade:0,fgAtt:0,punts:0},away:{plays:0,firstDowns:0,passAtt:0,passComp:0,passYds:0,passTD:0,int:0,rushAtt:0,rushYds:0,rushTD:0,recYds:0,recTD:0,sacksTaken:0,fumblesLost:0,turnovers:0,fgMade:0,fgAtt:0,punts:0}};
 function drive(off,def,O,D,scheme,out,label){let pos=25,down=1,toGo=10,plays=0;const qb=starter(off,'QB'),rb=starter(off,'RB'),wr=starter(off,'WR'),oc=off.staff.OC,dc=def.staff.DC;while(plays<16){plays++;out.plays++;let pass=scheme.pass+(down===3?.18:0)+(toGo>=8?.09:0)-(toGo<=2?.13:0),pen=Math.random()<.045;if(pen){if(Math.random()<.65){pos=Math.max(1,pos-5);toGo+=5;log.push(`${label}: ${off.name} false start; backed up five.`)}else{pos=Math.min(99,pos+5);toGo=Math.max(1,toGo-5);log.push(`${label}: defensive penalty gives ${off.name} five.`)}continue}
 if(Math.random()<pass){out.passAtt++;const pressure=clamp(.17+(D.front-O.ol)*.005+(DEF_SCHEMES[def.defScheme].pressure-70)*.0015+(dc.playCall-70)*.001-(oc.playCall-70)*.0008+(D.prepPressure||0),.08,.48);if(Math.random()<pressure*.28){let loss=gi(3,10);out.passAtt--;pos=Math.max(1,pos-loss);out.sacksTaken++;down++;toGo+=loss;log.push(`${label}: ${qb.name} sacked for ${loss}.`)}else{let intP=clamp(.027+(D.coverage-O.qb)*.0014+(75-qb.iq)*.0007+(pressure>.30?.009:0),.008,.09);if(Math.random()<intP){out.int++;out.turnovers++;log.push(`${label}: ${qb.name} intercepted near the ${Math.min(99,pos+gi(5,22))}.`);return {points:0,result:'INT',plays}}let comp=clamp(.61+(O.qb-D.coverage)*.004+(qb.technique-70)*.0015-(pressure>.28?.07:0),.38,.79);if(Math.random()<comp){let y=Math.round(clamp(7+(O.skill-D.coverage)/8+gauss()*6,0,38));if(Math.random()<.055+(qb.speed+wr.speed-140)*.0005)y+=gi(12,38);pos+=y;out.passComp++;out.passYds+=y;out.recYds+=y;if(y>=toGo){out.firstDowns++;down=1;toGo=Math.min(10,100-pos)}else{down++;toGo-=y}log.push(`${label}: ${qb.name} to ${wr.name} for ${y}.`)}else{down++;log.push(`${label}: ${qb.name} incomplete for ${wr.name}.`)}}}
 else{out.rushAtt++;let runEdge=(O.ol*.38+O.skill*.25+rb.power*.15+rb.speed*.12+oc.playCall*.10)-(D.front*.60+DEF_SCHEMES[def.defScheme].run*.20+dc.playCall*.20);let y=Math.round(clamp(3.7+runEdge/20+gauss()*3.2,-4,24));if(Math.random()<.045+Math.max(0,rb.speed-82)*.001)y+=gi(10,32);pos+=y;out.rushYds+=y;if(y>=toGo){out.firstDowns++;down=1;toGo=Math.min(10,100-pos)}else{down++;toGo=Math.max(1,toGo-y)}log.push(`${label}: ${rb.name} runs for ${y}.`)}
 if(pos>=100){if(Math.random()<pass){out.passTD++;out.recTD++}else out.rushTD++;log.push(`${label}: TOUCHDOWN ${off.name}.`);return {points:7,result:'TD',plays}}
 if(down>=4){if(pos>=62){let dist=117-pos,pct=clamp(.93-(dist-30)*.011+(starter(off,'K').trueNow-75)*.003,.25,.97);out.fgAtt++;if(Math.random()<pct){out.fgMade++;log.push(`${label}: ${off.name} field goal good from ${Math.round(dist)}.`);return {points:3,result:'FG',plays}}log.push(`${label}: ${off.name} misses the field goal.`);return {points:0,result:'MISS',plays}}out.punts++;log.push(`${label}: ${off.name} punts.`);return {points:0,result:'PUNT',plays}}
 }return {points:0,result:'END',plays}}
 let hp=0,ap=0;const driveCount=detailedDriveCount(hScheme,aScheme),openingSide=Math.random()<.5?'home':'away',sideCounts={home:0,away:0};for(let i=0;i<driveCount;i++){const side=i%2?(openingSide==='home'?'away':'home'):openingSide,isHome=side==='home',label=`${isHome?'H':'A'}${++sideCounts[side]}`,logStart=log.length,d=drive(isHome?home:away,isHome?away:home,isHome?H:A,isHome?A:H,isHome?hScheme:aScheme,totals[side],label);d.playByPlay=log.slice(logStart).map(x=>x.startsWith(label+': ')?x.slice(label.length+2):x);if(isHome)hp+=d.points;else ap+=d.points;drives.push({side,label,...d})}hp+=homeFieldScoreBonus(home,neutral);if(hp===ap){log.push('Overtime required.');if(Math.random()<.5)hp+=3;else ap+=3}const conf=confOverride??home.conference===away.conference,win=recordGame(home,away,hp,ap,conf,H,A);totals.home.pts=hp;totals.away.pts=ap;applyGameStats(home,totals.home,totals.away);applyGameStats(away,totals.away,totals.home);postGameCondition(home);postGameCondition(away);return finishGame(before,home,away,{home:home.name,away:away.name,hp,ap,winner:win.name,log:log.slice(-160),box:totals,detailed:true,drives});
}
function seasonScore(p,t){let s=p.stats||{},teamBonus=(t?.w||0)*1.5,base=p.perceived*.12;if(p.pos==='QB')return base+s.passYds*.010+s.passTD*2.4-s.int*1.4+(s.passAtt?((s.passComp/s.passAtt)-.58)*35:0)+teamBonus;if(p.pos==='RB')return base+s.rushYds*.026+s.rushTD*3+(s.receptions||0)*.22+teamBonus;if(['WR','TE'].includes(p.pos))return base+s.recYds*.028+s.recTD*3.1+(s.receptions||0)*.28-(s.drops||0)*.8+teamBonus;if(['EDGE','DT','LB','CB','S'].includes(p.pos))return base+s.tackles*.30+s.tfl*.65+s.sacks*4.7+s.pressures*.22+s.intDef*6.2+s.passBreakups*.45+teamBonus;if(['OT','OG','C'].includes(p.pos))return base+(s.snaps||0)*.012-(s.sacksAllowed||0)*2.8-(s.pressuresAllowed||0)*.32+playerSchemeFit(p,t)*.22+teamBonus;return base+playerSchemeFit(p,t)*.25+teamBonus}
function allActivePlayers(){let a=[];for(const t of universe.teams)for(const p of t.roster)a.push({p,t});return a}
function awardOne(name,list,scoreFn=x=>seasonScore(x.p,x.t)){let w=list.slice().sort((a,b)=>scoreFn(b)-scoreFn(a))[0];if(!w)return null;return {name,playerId:w.p.id,playerName:w.p.name,team:w.t.name,pos:w.p.pos}}
function projectedAwards(){let all=allActivePlayers(),off=all.filter(x=>OFF_POS.has(x.p.pos)&&!['K','P'].includes(x.p.pos)),def=all.filter(x=>!OFF_POS.has(x.p.pos));let awards=[];for(const x of [awardOne('National Player of the Year',all),awardOne('Offensive Player of the Year',off),awardOne('Defensive Player of the Year',def),awardOne('Quarterback of the Year',all.filter(x=>x.p.pos==='QB')),awardOne('Running Back of the Year',all.filter(x=>x.p.pos==='RB')),awardOne('Receiver of the Year',all.filter(x=>['WR','TE'].includes(x.p.pos))),awardOne('Lineman of the Year',all.filter(x=>['OT','OG','C'].includes(x.p.pos))),awardOne('Freshman of the Year',all.filter(x=>eligibilityBase(x.p)===0&&!x.p.redshirtActive))])if(x)awards.push(x);let coach=universe.teams.slice().sort((a,b)=>(b.w*7-b.prestige*.3)-(a.w*7-a.prestige*.3))[0];if(coach)awards.push({name:'Coach of the Year',playerId:null,playerName:coach.staff.HC.name,team:coach.name,pos:'HC'});return awards}
function finalizeSeasonHonors(){if(universe.awards[universe.year])return universe.awards[universe.year];let awards=projectedAwards();for(const a of awards){if(!a.playerId)continue;let f=findPlayer(a.playerId);if(f?.p){f.p.awards??=[];if(!f.p.awards.some(x=>x.year===universe.year&&x.name===a.name))f.p.awards.push({year:universe.year,name:a.name})}}universe.awards[universe.year]=awards;updateSeasonRecords();return awards}
function updateSeasonRecords(){universe.records??={nationalSeason:{},nationalCareer:{}};universe.records.nationalSeason??={};for(const t of universe.teams){t.records??={};for(const p of t.roster){for(const [k,label] of Object.entries(RECORD_CATS)){let v=p.stats?.[k]||0;if(v>(universe.records.nationalSeason[k]?.value||0))universe.records.nationalSeason[k]={label,value:v,playerId:p.id,playerName:p.name,team:t.name,year:universe.year};if(v>(t.records[k]?.value||0))t.records[k]={label,value:v,playerId:p.id,playerName:p.name,year:universe.year}}}}}
function updateCareerRecords(){universe.records??={nationalSeason:{},nationalCareer:{}};universe.records.nationalCareer??={};let all=[];for(const t of universe.teams)for(const p of t.roster)all.push({p,t:t.name});for(const p of universe.playerArchive||[])all.push({p,t:p.lastTeam||'—'});for(const x of all)for(const [k,label] of Object.entries(RECORD_CATS)){let v=x.p.career?.[k]||0;if(v>(universe.records.nationalCareer[k]?.value||0))universe.records.nationalCareer[k]={label,value:v,playerId:x.p.id,playerName:x.p.name,team:x.t,year:universe.year}}}
function productionRating(p){let c=p.career||p.stats||{},v=50;if(p.pos==='QB')v+=c.passYds/650+(c.passTD||0)*.35-(c.int||0)*.12;else if(p.pos==='RB')v+=(c.rushYds||0)/330+(c.rushTD||0)*.7;else if(['WR','TE'].includes(p.pos))v+=(c.recYds||0)/350+(c.recTD||0)*.75;else if(['EDGE','DT','LB','CB','S'].includes(p.pos))v+=(c.tackles||0)/16+(c.sacks||0)*1.8+(c.intDef||0)*2.3;else v+=p.perceived*.28;return clamp(v,35,99)}
function draftProjection(p,t){let athletic=avg([p.speed,p.power,p.technique]),score=p.trueNow*.72+athletic*.10+productionRating(p)*.12+t.prestige*.06+gauss()*2.2;let round=score>=92?1:score>=88?2:score>=85?3:score>=82?4:score>=79?5:score>=76?6:score>=72?7:null;return {score:Math.round(score),round,pick:round?gi(1,32):null,label:round?`Round ${round}, Pick ${gi(1,32)}`:'Undrafted Free Agent'}}
function draftPlayer(p,t,reason='Eligibility exhausted'){let d=draftProjection(p,t),r={year:universe.year,playerId:p.id,playerName:p.name,pos:p.pos,school:t.name,reason,...d};return r}
function runDraft(pool){let rankedPool=pool.slice().sort((a,b)=>b.score-a.score);universe.draftHistory[universe.year]=[];rankedPool.forEach((x,i)=>{let round=i<224?Math.floor(i/32)+1:null,pick=round?(i%32)+1:null,status=round?'Drafted':x.score>=66?'UDFA':'College Career Complete',label=round?`Round ${round}, Pick ${pick}`:status==='UDFA'?'Undrafted Free Agent':'No professional deal',r={year:universe.year,playerId:x.p.id,playerName:x.p.name,pos:x.p.pos,school:x.t.name,reason:x.reason,score:Math.round(x.score),round,pick,status,label};x.p.draftResult=r;universe.draftHistory[universe.year].push(r);addToArchive(x.p,x.t,x.reason)});return universe.draftHistory[universe.year]}
function earlyDeclaration(p,t){if(eligibilityBase(p)<2||eligibilityBase(p)>=3)return false;let d=draftProjection(p,t);return d.round&&d.round<=2&&Math.random()<(d.round===1?.52:.24)}
function rankingScore(t){const g=t.w+t.l,wp=g?t.w/g:0,sos=g?t.sos/g:60,margin=g?(t.pf-t.pa)/g:0,p=profiles(t).overall;return wp*60+p*.22+sos*.10+clamp(margin,-20,20)*.4}
function ranked(){let r=universe.teams.map(t=>({t,s:rankingScore(t)})).sort((a,b)=>b.s-a.s).map(x=>x.t);r.forEach((t,i)=>t.rank=i+1);return r}
function findUserGame(){if(universe.phase!=='regular'||universe.week>=12)return null;const n=$('#userTeam').value;return universe.schedule[universe.week].find(g=>!g.played&&(g.home===n||g.away===n))||null}

function userWeekResult(u){let w=universe.week;if(w<=0)return null;let g=u.schedule.find(g=>g.week===w&&g.played);if(!g)return null;let userHome=g.home===u.name,userPts=userHome?g.score?.[1]:g.score?.[0],oppPts=userHome?g.score?.[0]:g.score?.[1],opp=userHome?g.away:g.home;return {gameId:g.gameId,win:g.winner===u.name,opp,userPts,oppPts,loc:userHome?'vs':'@'}}
function buildPreseasonHub(){universe.weeklyHub=[...pulledOfferHubItems(selected()),...coachOpeningHubItems(selected()),...coachFalloutHubItems(selected()),...promiseHubItems(selected()),{type:'action',tab:'depth',kicker:'ROSTER',main:'Set your role depth chart',sub:'X/Z/slot, nickel, rush edge and special teams are live.'},{type:'action',tab:'recruiting',kicker:'RECRUITING',main:'Build an initial recruiting board',sub:'Auto-target 20 or manually chase players who fit the roster.'},{type:'action',tab:'roster',kicker:'REDSHIRTS',main:'Review freshman redshirts',sub:'Protected players can appear in no more than four games.'}]}
// Rivals are derived, never authored: the nearest school in your own conference. Weeks 4-11 are a
// conference round-robin, so a same-conference rival is guaranteed on the schedule every season
// without buildSchedule needing to know rivalries exist at all.
const TROPHY_NOUNS=['Bell','Axe','Boot','Jug','Barrel','Anvil','Lantern','Spade','Bucket','Cannon'];
function deriveRivalries(){
 const teams=universe.teams,prev=new Map(teams.map(t=>[t.id,t.rivalry]));
 for(const t of teams)t.rivalry=null;
 // Only opponents actually on the schedule qualify: the conference round-robin plays eight of
 // eleven, so the nearest school geographically is not necessarily one you ever meet. Pair the
 // globally closest eligible pair first — taking each team in turn strands the last two in a
 // conference when they happen not to play each other.
 const pairs=[];
 for(let i=0;i<teams.length;i++)for(let j=i+1;j<teams.length;j++){
  const t=teams[i],o=teams[j];
  if(t.conference!==o.conference)continue;
  if(!(t.schedule||[]).some(g=>g.home===o.name||g.away===o.name))continue;
  pairs.push({t,o,d:haversineMiles(t.lat||0,t.lon||0,o.lat||0,o.lon||0)});
 }
 pairs.sort((a,b)=>a.d-b.d||a.t.id-b.t.id);
 for(const {t,o,d} of pairs){
  if(t.rivalry||o.rivalry)continue;
  const noun=TROPHY_NOUNS[Math.abs(Math.min(t.id,o.id))%TROPHY_NOUNS.length],
   place=t.state===o.state?t.state:'Border',trophy=`The ${place} ${noun}`,miles=Math.round(d),
   keep=(me,them)=>{const p=prev.get(me.id);return p&&p.rivalId===them.id?{...p.series,miles}:{w:0,l:0,streak:0,lastYear:null,lastResult:null,miles}};
  t.rivalry={rivalId:o.id,trophy,series:keep(t,o)};
  o.rivalry={rivalId:t.id,trophy,series:keep(o,t)};
 }
}
function rivalOf(t){return t?.rivalry?universe.teams.find(x=>x.id===t.rivalry.rivalId)||null:null}
function isRivalryGame(t,g){const o=rivalOf(t);return !!(o&&g&&(g.home===o.name||g.away===o.name))}
function rivalryGameFor(t){const o=rivalOf(t);if(!o)return null;return (t.schedule||[]).find(g=>g.home===o.name||g.away===o.name)||null}
// One result, recorded once, from both sides.
function recordRivalryResult(t,won){
 const s=t.rivalry?.series;if(!s)return;
 if(s.lastYear===universe.year)return;
 s[won?'w':'l']++;s.lastYear=universe.year;s.lastResult=won?'W':'L';
 s.streak=won?(s.streak>0?s.streak+1:1):(s.streak<0?s.streak-1:-1);
}
function settleRivalryGame(g){
 if(!g?.played||g.winner==null)return;
 const home=T(g.home),away=T(g.away);
 if(!home?.rivalry||home.rivalry.rivalId!==away?.id)return;
 // Older saves already tracked the series. Use it as the durable once-only
 // guard for fan changes and the event too, not just the win/loss counters.
 if(home.rivalry.series.lastYear===universe.year&&away.rivalry?.series.lastYear===universe.year)return;
 const homeWon=g.winner===g.home;
 recordRivalryResult(home,homeWon);recordRivalryResult(away,!homeWon);
 const loser=homeWon?away:home,winner=homeWon?home:away;
 winner.fan_support=clamp((winner.fan_support||60)+2,0,100);
 loser.fan_support=clamp((loser.fan_support||60)-2,0,100);
 universe.events??=[];universe.nextEventId??=1;
 const order=universe.nextEventId++;
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'RIVALRY_RESULT',importance:76,schoolIds:[home.id,away.id],playerIds:[],coachIds:[],recruitIds:[],
  gameIds:g.gameId?[g.gameId]:[],summary:`${winner.name} keeps ${winner.rivalry.trophy}.`,
  metadata:{trophy:winner.rivalry.trophy,winnerId:winner.id,loserId:loser.id}});
}
function rivalrySeriesText(t){
 const s=t?.rivalry?.series;if(!s)return '';
 if(!s.w&&!s.l)return 'First meeting';
 const run=s.streak>0?`W${s.streak}`:s.streak<0?`L${Math.abs(s.streak)}`:'';
 return `${s.w}-${s.l}${run?` · ${run}`:''}`;
}
// The wire cares twice: when the game is next, and once it is settled.
function rivalryHubItems(t){
 if(!t?.rivalry)return[];
 const o=rivalOf(t),s=t.rivalry.series,out=[];
 if(!o)return[];
 const g=rivalryGameFor(t);
 if(g&&!g.played&&g.week===universe.week+1)out.push({type:'action',tab:'gamelab',importance:74,
  kicker:'RIVALRY WEEK',main:`${t.rivalry.trophy} is on the line vs ${o.name}`,
  sub:`${rivalrySeriesText(t)} all-time · ${s.miles} miles apart`});
 if(g?.played&&s.lastYear===universe.year)out.push({type:s.lastResult==='W'?'good-news':'bad-news',tab:'season',
  importance:s.lastResult==='W'?70:78,gameId:g.gameId,
  kicker:'RIVALRY',main:s.lastResult==='W'?`${t.rivalry.trophy} stays home`:`${o.name} takes ${t.rivalry.trophy}`,
  sub:`${rivalrySeriesText(t)} all-time`});
 return out;
}
// The administration. Every AI program already lives with consequences — carousel() fires coaches
// on admin_patience — while the controlled program never did. This is that same judgement, applied
// to the program you run, on the same expectation scale so you are held to the AI's standard.
function seasonExpectation(t){return clamp(Math.round(((t?.prestige??60)-30)/8),4,10)}
function ensureAdminState(t){
 if(!t)return null;
 t.adminConfidence??=clamp(Math.round(((t.admin_patience??60)*.6)+30),15,95);
 t.mandate??=null;
 return t;
}
function adminConfidenceLabel(c){return c>=80?'Secure':c>=60?'Backed':c>=40?'Watched':c>=20?'Hot seat':'Final warning'}
// Movement is dominated by wins against expectation. admin_patience decides how hard it swings:
// an impatient board (25) moves roughly twice as fast as a patient one (78).
function adminSeasonReview(t){
 ensureAdminState(t);
 const exp=seasonExpectation(t),diff=(t.w||0)-exp,
  swing=clamp(1.6-((t.admin_patience??60)/100),.7,1.5),
  rival=t.rivalry?.series,
  rivalBonus=rival&&rival.lastYear===universe.year?(rival.lastResult==='W'?4:-6):0,
  titleBonus=(t.champ?14:0)+((universe.confChamps||[]).some(c=>c?.name===t.name)?6:0),
  delta=Math.round((diff*6*swing)+rivalBonus+titleBonus);
 const before=t.adminConfidence;
 t.adminConfidence=clamp(before+delta,0,100);
 const review={year:universe.year,w:t.w||0,l:t.l||0,expected:exp,delta,before,after:t.adminConfidence,
  rival:rivalBonus,label:adminConfidenceLabel(t.adminConfidence)};
 t.mandate=t.adminConfidence<40?{year:universe.year+1,wins:exp,
  text:`The administration expects ${exp} wins in ${universe.year+1}.`}:null;
 return review;
}
// Applied to the controlled program only, and recorded so the tenure has a history.
function reviewControlledProgram(t){
 if(!t)return null;
 universe.tenure??={startYear:universe.year,school:t.name,seasons:[],ended:null,closed:false};
 // A closed tenure is waiting on the player to take a post; it must not keep accruing seasons.
 if(universe.tenure.closed&&(universe.jobOffers||[]).length)return null;
 // Switching the controlled program by hand is a new post, not a continuation of the old record.
 if(universe.tenure.school!==t.name){closeTenure('stepped away');universe.jobOffers=[];
  universe.tenure={startYear:universe.year,school:t.name,seasons:[],ended:null,closed:false}}
 const review=adminSeasonReview(t);
 universe.tenure.seasons.push(review);
 const order=universe.nextEventId++;
 universe.events??=[];
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'ADMIN_REVIEW',importance:review.after<40?78:52,schoolIds:[t.id],playerIds:[],coachIds:[],
  recruitIds:[],gameIds:[],
  summary:`${t.name} review: ${review.w}-${review.l} against ${review.expected} expected — confidence ${review.after} (${review.label}).`,
  metadata:{...review}});
 if(t.adminConfidence<=0&&!universe.tenure.ended){
  universe.tenure.ended={year:universe.year,record:`${review.w}-${review.l}`,
   seasons:universe.tenure.seasons.length};
  closeTenure('let go');
 }
 // Confidence is not only a scoreboard: it buys or costs the program real ground.
 if(review.after>=80){
  t.resources=clamp((t.resources||60)+1,0,100);
  t.facilities=clamp((t.facilities||60)+1,0,100);
 } else if(review.after<25){
  t.resources=clamp((t.resources||60)-2,0,100);
  t.fan_support=clamp((t.fan_support||60)-2,0,100);
 }
 return review;
}
// Mid-season the number must never be a surprise, so the wire tracks the mandate as it slips.
function adminHubItems(t){
 if(!t)return[];
 ensureAdminState(t);
 const exp=seasonExpectation(t),played=(t.w||0)+(t.l||0),left=12-played,
  reachable=(t.w||0)+left,conf=t.adminConfidence,out=[];
 if(universe.week<3)return[];
 if(reachable<exp)out.push({type:'bad-news',tab:'program',importance:82,
  kicker:'ADMINISTRATION',main:`${exp} wins is now out of reach`,
  sub:`${t.w}-${t.l} with ${left} to play · confidence ${conf} (${adminConfidenceLabel(conf)})`});
 else if(conf<40)out.push({type:'alert',tab:'program',importance:72,
  kicker:'ADMINISTRATION',main:t.mandate?t.mandate.text:`The administration expects ${exp} wins`,
  sub:`${t.w}-${t.l} · confidence ${conf} (${adminConfidenceLabel(conf)})`});
 return out;
}
// NIL. t.nil was a static number that only tilted recruitPitch; here it becomes a budget you spend.
// The point is that it is finite: holding the disgruntled starter and signing the blue-chip are the
// same pool of money, so the allocation is the decision.
function nilBudgetFor(t){return t?clamp(Math.round(((t.nil??60)*.7+(t.resources??60)*.3)/8),3,14):0}
function nilRemaining(t){return Math.max(0,nilBudgetFor(t)-(t?.nilSpent||0))}
function nilDealCost(x,isRecruit){return isRecruit?clamp((x.stars||2)-1,1,4):clamp(Math.round(((x.perceived||60)-50)/10),1,5)}
function nilDealActive(x,t){const d=x?.nilDeal;if(!d||d.year!==universe.year)return null;return (!t||d.schoolId==null||d.schoolId===t.id)?d:null}
// Retention pressure is the whole point of a player deal: it pushes back on everything transferRisk sums.
function nilRetentionRelief(p){const d=nilDealActive(p);return d?Math.min(30,d.amount*6):0}
function signNilDeal(t,x,isRecruit){
 if(!t||!x)return {ok:false,reason:'No target.'};
 ensureNilState(t);
 if(nilDealActive(x,t))return {ok:false,reason:'A deal is already in place this year.'};
 const cost=nilDealCost(x,isRecruit);
 if(cost>nilRemaining(t))return {ok:false,reason:`Not enough NIL left — ${nilRemaining(t)} of ${nilBudgetFor(t)} available, this costs ${cost}.`};
 x.nilDeal={amount:cost,year:universe.year,schoolId:t.id};
 t.nilSpent=(t.nilSpent||0)+cost;
 const order=universe.nextEventId++;universe.events??=[];
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'NIL_DEAL',importance:isRecruit?44:50,schoolIds:[t.id],playerIds:isRecruit?[]:[x.id],
  coachIds:[],recruitIds:isRecruit?[x.id]:[],gameIds:[],
  summary:`${x.name} signed a ${cost}-unit NIL deal with ${t.name}.`,metadata:{amount:cost,isRecruit:!!isRecruit}});
 return {ok:true,cost};
}
// Reversible while it is still the season it was signed in, so a misallocation is not permanent.
function cancelNilDeal(t,x){
 const d=nilDealActive(x,t);if(!d)return {ok:false,reason:'No active deal.'};
 t.nilSpent=Math.max(0,(t.nilSpent||0)-d.amount);x.nilDeal=null;
 return {ok:true,refund:d.amount};
}
function ensureNilState(t){if(!t)return null;t.nilSpent??=0;return t}
function resetNilSeason(){
 for(const t of universe.teams){t.nilSpent=0;for(const p of t.roster)if(p.nilDeal&&p.nilDeal.year<universe.year)p.nilDeal=null}
 for(const r of universe.recruits||[])if(r.nilDeal&&r.nilDeal.year<universe.year)r.nilDeal=null;
}
function nilSummaryText(t){return `${nilRemaining(t)} of ${nilBudgetFor(t)} available`}
function nilCellHTML(p,t){
 const d=nilDealActive(p,t),cost=nilDealCost(p,false),afford=cost<=nilRemaining(t);
 return d?`<button class="rs-button rs-active" data-nil-player="${p.id}" title="Release this deal">Held · ${d.amount}</button>`
  :`<button class="rs-button" data-nil-player="${p.id}" ${afford?'':'disabled'} title="${afford?`Costs ${cost}`:'Not enough NIL left'}">Offer · ${cost}</button>`;
}
function toggleNilPlayer(id){
 const t=selected(),p=t?.roster.find(x=>x.id===id);if(!p)return;
 const r=nilDealActive(p,t)?cancelNilDeal(t,p):signNilDeal(t,p,false);
 setStatus(r.ok?(r.refund!=null?`Released ${p.name}'s NIL deal — ${r.refund} back. ${nilSummaryText(t)}.`:`${p.name} signed for ${r.cost}. ${nilSummaryText(t)}.`):r.reason);
 render();
}
function toggleNilRecruit(id){
 const t=selected(),r=universe.recruits.find(x=>x.id===id);if(!r)return;
 const res=nilDealActive(r,t)?cancelNilDeal(t,r):signNilDeal(t,r,true);
 setStatus(res.ok?(res.refund!=null?`Pulled the NIL offer to ${r.name} — ${res.refund} back. ${nilSummaryText(t)}.`:`${r.name} offered ${res.cost} in NIL. ${nilSummaryText(t)}.`):res.reason);
 renderRecruiting();
}
// The career arc. v0.9.21 gave the hot seat an ending and nowhere to go; a dynasty that can only
// end is worse than one that never ends. A tenure that closes now becomes a line on a résumé, and
// the résumé is what the next job market reads.
function tenureRecord(t){
 const s=(universe.tenure?.seasons)||[];
 return s.reduce((a,x)=>({w:a.w+(x.w||0),l:a.l+(x.l||0)}),{w:0,l:0});
}
function careerTotals(){
 const past=(universe.careerHistory||[]).reduce((a,x)=>({w:a.w+x.w,l:a.l+x.l,seasons:a.seasons+x.seasons}),{w:0,l:0,seasons:0}),
  now=tenureRecord();
 return {w:past.w+now.w,l:past.l+now.l,seasons:past.seasons+((universe.tenure?.seasons)||[]).length,posts:(universe.careerHistory||[]).length+(universe.tenure?1:0)};
}
function careerWinPct(){const c=careerTotals(),g=c.w+c.l;return g?c.w/g:0}
// What a program will take a chance on: a résumé that got you fired does not get you a better job,
// but a good record at a bad school still counts for something.
function hiringCeiling(){
 const c=careerTotals(),pct=careerWinPct(),
  best=Math.max(0,...(universe.careerHistory||[]).map(x=>x.prestige||0),(universe.tenure?T(universe.tenure.school)?.prestige:0)||0);
 return clamp(Math.round(best*.72+pct*46+Math.min(10,c.seasons)),18,96);
}
function hiringMarket(){
 const ceiling=hiringCeiling(),current=universe.tenure?.school;
 return universe.teams
  .filter(t=>t.name!==current&&(t.prestige||0)<=ceiling)
  .sort((a,b)=>(b.prestige||0)-(a.prestige||0))
  .slice(0,3)
  .map(t=>({schoolId:t.id,name:t.name,conference:t.conference,prestige:t.prestige,
   why:`Prestige ${t.prestige} · ${t.conference} · expects ${seasonExpectation(t)} wins`}));
}
function closeTenure(reason){
 const tn=universe.tenure;if(!tn||tn.closed)return null;
 const rec=tenureRecord(),school=T(tn.school);
 universe.careerHistory??=[];
 universe.careerHistory.push({school:tn.school,prestige:school?.prestige??null,
  startYear:tn.startYear,endYear:universe.year,seasons:tn.seasons.length,w:rec.w,l:rec.l,reason});
 tn.closed=true;
 universe.jobOffers=hiringMarket();
 return universe.careerHistory[universe.careerHistory.length-1];
}
// Taking a post is the only thing that clears the offer list, so the run cannot silently continue
// at a school that already let you go.
function acceptPost(schoolId){
 const t=universe.teams.find(x=>x.id===schoolId);
 if(!t)return {ok:false,reason:'That job is not on the board.'};
 if(!(universe.jobOffers||[]).some(o=>o.schoolId===schoolId))return {ok:false,reason:'That job was not offered.'};
 universe.jobOffers=[];
 universe.tenure={startYear:universe.year,school:t.name,seasons:[],ended:null,closed:false};
 ensureAdminState(t);ensureNilState(t);
 t.adminConfidence=clamp(Math.round((t.admin_patience??60)*.6+30),15,95);
 t.mandate=null;
 const order=universe.nextEventId++;universe.events??=[];
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'TENURE_STARTED',importance:80,schoolIds:[t.id],playerIds:[],coachIds:[],recruitIds:[],gameIds:[],
  summary:`New post: ${t.name}.`,metadata:{schoolId:t.id,career:careerTotals()}});
 return {ok:true,team:t};
}
function careerSummaryText(){
 const c=careerTotals(),pct=(careerWinPct()*100).toFixed(1);
 return `${c.w}-${c.l} across ${c.seasons} season${c.seasons===1?'':'s'} at ${c.posts} program${c.posts===1?'':'s'} · ${pct}%`;
}
function careerHistoryHTML(){
 const rows=(universe.careerHistory||[]).slice().reverse().map(x=>
  `<div class="lineitem"><span>${x.startYear}–${x.endYear} · ${x.school}</span><strong>${x.w}-${x.l} · ${x.reason}</strong></div>`).join('');
 const tn=universe.tenure&&!universe.tenure.closed?(()=>{const r=tenureRecord();
  return `<div class="lineitem"><span>${tn.startYear}–present · ${tn.school}</span><strong>${r.w}-${r.l} · current</strong></div>`})():'';
 return (tn+rows)||'<div class="muted">No completed seasons yet.</div>';
}
function careerPostHTML(){
 const offers=universe.jobOffers||[];
 if(!offers.length)return '';
 const last=(universe.careerHistory||[])[universe.careerHistory.length-1];
 return `<div class="decision-card"><div class="decision-kicker">CAREER</div>
  <div class="decision-title">Your tenure at ${last?.school||'your program'} is over</div>
  <div class="decision-summary">${last?`${last.w}-${last.l} across ${last.seasons} season${last.seasons===1?'':'s'}. `:''}Career: ${careerSummaryText()}. These programs will have you.</div>
  <div class="decision-options">${offers.map(o=>
   `<button class="decision-option" data-post="${o.schoolId}"><strong>${o.name}</strong><small>${o.why}</small></button>`).join('')}</div></div>`;
}
function renderCareerPost(){
 const el=$('#careerPost');if(!el)return;
 el.innerHTML=careerPostHTML();
 $$('[data-post]').forEach(b=>b.onclick=()=>{
  const r=acceptPost(+b.dataset.post);
  if(!r.ok){setStatus(r.reason);return}
  $('#userTeam').value=r.team.name;
  setStatus(`Took the ${r.team.name} job. ${careerSummaryText()}.`);
  render();
 });
}
function careerHubItems(t){
 if(!(universe.jobOffers||[]).length)return[];
 return [{type:'action',tab:'program',importance:95,kicker:'CAREER',
  main:'Your tenure is over — choose your next post',
  sub:`${(universe.jobOffers||[]).length} programs will have you · ${careerSummaryText()}`}];
}
// Bowl season. Before this, the phase machine ran regular -> confReady -> playoffReady -> complete,
// so roughly 112 of 120 programs simply stopped playing. Six wins now earns a game, which gives a
// mediocre team something to chase in weeks nine through twelve.
const BOWL_NAMES=['Sunbelt','Liberty','Heritage','Frontier','Gateway','Coastal','Prairie','Summit','Cascade','Delta','Keystone','Ironwood'];
function bowlEligible(t){return (t.w||0)>=6}
function bowlField(){
 const inPlayoff=new Set(seedField().map(t=>t.name));
 return ranked().filter(t=>bowlEligible(t)&&!inPlayoff.has(t.name));
}
function bowlNameFor(i){return `${BOWL_NAMES[i%BOWL_NAMES.length]} Bowl`}
// Paired best-against-best down the rankings, which keeps the matchups sensible without a
// selection-committee model nobody would see.
function simBowls(){
 if(universe.phase!=='bowlReady')return [];
 const field=bowlField(),logs=[];
 universe.bowls=[];
 for(let i=0;i+1<field.length;i+=2){
  const a=field[i],b=field[i+1],label=bowlNameFor(i/2);
  const r=gameSim(a,b,true,false,{week:13,label});
  const w=T(r.winner),l=w===a?b:a;
  universe.bowls.push({label,winner:w.name,loser:l.name,score:[r.ap,r.hp],gameId:r.gameId});
  logs.push({...r,label});
  w.bowlResult={label,won:true,year:universe.year};l.bowlResult={label,won:false,year:universe.year};
  // Bowl practices are real development time, and a win is worth something to the fanbase.
  w.fan_support=clamp((w.fan_support||60)+2,0,100);
  l.fan_support=clamp((l.fan_support||60)+1,0,100);
  const order=universe.nextEventId++;universe.events??=[];
  universe.events.push({id:`EVT_${order}`,season:universe.year,week:13,timestampOrder:order,
   type:'BOWL_RESULT',importance:58,schoolIds:[w.id,l.id],playerIds:[],coachIds:[],recruitIds:[],
   gameIds:r.gameId?[r.gameId]:[],summary:`${w.name} wins the ${label}.`,metadata:{label,winnerId:w.id}});
 }
 universe.phase='playoffReady';
 if(universe.latest)universe.latest=logs.length?logs:universe.latest;
 ranked();render();
 return logs;
}
function bowlHubItems(t){
 if(!t)return[];
 const b=t.bowlResult;
 if(b&&b.year===universe.year)return [{type:b.won?'good-news':'bad-news',tab:'season',importance:b.won?66:60,
  kicker:'BOWL',main:b.won?`${t.name} wins the ${b.label}`:`${t.name} falls in the ${b.label}`,
  sub:`${t.w}-${t.l} on the season`}];
 // Six wins is the bar, and it is worth naming while it can still be reached.
 if(universe.phase==='regular'&&universe.week>=6&&!bowlEligible(t)){
  const left=12-((t.w||0)+(t.l||0)),need=6-(t.w||0);
  if(need>0&&need<=left)return [{type:'action',tab:'season',importance:54,
   kicker:'BOWL WATCH',main:`${need} more win${need===1?'':'s'} for bowl eligibility`,
   sub:`${t.w}-${t.l} with ${left} to play`}];
 }
 return [];
}
// Fan support was a static number feeding one recruiting pitch. It now answers to results and
// decays back toward the program's own baseline, so a single good year is not permanent.
function fanSupportTarget(t){
 const exp=seasonExpectation(t),diff=(t.w||0)-exp,base=t.fanBaseline??t.fan_support??60;
 return clamp(base+diff*4+(t.champ?6:0)+(universe.champion===t.name?10:0)+(t.bowlResult?.year===universe.year&&t.bowlResult.won?3:0),5,100);
}
function updateFanSupport(t){
 if(!t)return;
 t.fanBaseline??=t.fan_support??60;
 t.fan_support=clamp(Math.round((t.fan_support??60)*.6+fanSupportTarget(t)*.4),5,100);
}
// A full house is worth something. This was a flat 2.2 for every program in the country.
function homeFieldFor(t){return clamp(2.2+(((t?.fan_support??60)-60)*.03),.8,3.4)}
// Keep quick-sim score changes in football-sized increments while matching homeFieldFor() in expectation.
function homeFieldScoreBonus(t,neutral=false){
 if(neutral)return 0;
 const edge=homeFieldFor(t),base=Math.floor(edge/3)*3,remainder=edge-base;
 return base+(remainder>0&&Math.random()<remainder/3?3:0);
}
// Signing day. Wavering commitments — the ones already carrying a challenger and a pressure score —
// used to survive to signing day untouched, so the drama the engine had modelled all season simply
// evaporated. They now get one last resolution, and the player watches it land one name at a time.
//
// Everything is decided up front and stored; revealing is pure presentation. That matters because
// re-rolling on reveal would make the outcome depend on how fast someone clicks.
function signingDayOdds(r){
 // pressure is the challenger's pitch minus the hold, so it is already the right axis.
 const p=r.pressure||0,loyalty=(r.relationship||50)*.10,promise=r.signedPromise?8:0;
 return clamp(.06+(p+12)*.022-loyalty*.01-promise*.01,.02,.62);
}
function buildSigningDay(){
 const board=[],wavering=universe.recruits
  .filter(r=>r.committed&&r.challenger&&r.challenger!==r.committed&&(r.pressure||0)>-14)
  .sort((a,b)=>(b.pressure||0)-(a.pressure||0)||b.stars-a.stars)
  .slice(0,12);
 for(const r of wavering){
  const from=r.committed,to=r.challenger,odds=signingDayOdds(r),flips=Math.random()<odds&&canTakeCommit(to);
  const entry={recruitId:r.id,name:r.name,pos:r.pos,stars:r.stars,from,challenger:to,
   pressure:r.pressure||0,odds:Math.round(odds*100),flipped:false};
  if(flips&&decommitRecruit(r,'SIGNING_DAY_FLIP')){
   if(commitRecruit(r,to)){
    entry.flipped=true;
    universe.decommitLog[universe.decommitLog.length-1].to=to;
   } else {
    // The challenger could not actually take him; the original school keeps him.
    commitRecruit(r,from);
   }
  }
  board.push(entry);
 }
 universe.signingDay={year:universe.year,board,revealed:0};
 if(board.length){
  const order=universe.nextEventId++;universe.events??=[];
  universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
   type:'SIGNING_DAY',importance:72,schoolIds:[],playerIds:[],coachIds:[],
   recruitIds:board.map(x=>x.recruitId),gameIds:[],
   summary:`Signing day: ${board.filter(x=>x.flipped).length} of ${board.length} contested commitments flipped.`,
   metadata:{contested:board.length,flipped:board.filter(x=>x.flipped).length}});
 }
 return universe.signingDay;
}
function signingDayPending(){const s=universe.signingDay;return s&&s.year===universe.year?Math.max(0,s.board.length-s.revealed):0}
function revealNextSigning(){
 const s=universe.signingDay;
 if(!s||s.year!==universe.year||s.revealed>=s.board.length)return null;
 return s.board[s.revealed++];
}
function revealAllSigning(){const s=universe.signingDay;if(!s)return[];const rest=s.board.slice(s.revealed);s.revealed=s.board.length;return rest}
function signingDayHTML(){
 const s=universe.signingDay,u=selected();
 if(!s||s.year!==universe.year||!s.board.length)return '';
 const mine=x=>x.from===u?.name||x.challenger===u?.name;
 const rows=s.board.slice(0,s.revealed).map(x=>{
  const good=(x.flipped&&x.challenger===u?.name)||(!x.flipped&&x.from===u?.name);
  const tone=mine(x)?(good?'good':'bad'):'muted';
  return `<div class="lineitem signing-row signing-${tone}">
   <span>${'★'.repeat(x.stars)} ${x.pos} ${x.name}</span>
   <strong>${x.flipped?`flips to ${x.challenger}`:`stays with ${x.from}`}</strong></div>`;
 }).join('');
 const left=signingDayPending();
 return `<div class="decision-card"><div class="decision-kicker">SIGNING DAY</div>
  <div class="decision-title">${s.board.length} contested commitment${s.board.length===1?'':'s'}</div>
  <div class="decision-summary">${left?`${left} still to announce.`:`All ${s.board.length} announced — ${s.board.filter(x=>x.flipped).length} flipped.`}</div>
  <div class="signing-board">${rows||'<div class="muted">Nothing announced yet.</div>'}</div>
  ${left?`<div class="decision-options"><button class="decision-option" data-signing="next"><strong>Announce the next name</strong></button><button class="decision-option" data-signing="all"><strong>Announce the rest</strong></button></div>`:''}</div>`;
}
function renderSigningDay(){
 const el=$('#signingDay');if(!el)return;
 el.innerHTML=signingDayHTML();
 $$('[data-signing]').forEach(b=>b.onclick=()=>{
  if(b.dataset.signing==='all')revealAllSigning();else revealNextSigning();
  renderSigningDay();
 });
}
function signingDayHubItems(){
 const left=signingDayPending();
 if(!left)return[];
 return [{type:'action',tab:'recruiting',importance:84,kicker:'SIGNING DAY',
  main:`${left} contested commitment${left===1?'':'s'} still to announce`,
  sub:'Every wavering commit gets one last decision.'}];
}
// Academic eligibility. t.academics was a recruiting weight and nothing else, so a 3-star at a
// 90-academics school was mechanically identical to one at a 55. Standing now drifts toward what
// the program and the player can sustain, and falling far enough costs you the player.
const ACADEMIC_FLOOR=30,ACADEMIC_WATCH=48;
function academicTarget(p,t){
 // The program sets the support, the player's head does the rest, and a heavy season drags on both.
 return clamp(Math.round((((t?.academics??60)-50)*.5)+(((p.iq??60)-50)*.6)+55-((p.wear||0)*.08)),5,99);
}
function ensureAcademics(p,t){
 if(!p)return;
 p.academicStanding??=clamp(Math.round(academicTarget(p,t)+gi(-9,9)),5,99);
 p.academicPlan??=null;
 p.academicHold??=0;
}
function academicRisk(p){return (p.academicStanding??70)<ACADEMIC_WATCH}
function academicallyIneligible(p){return (p.academicHold||0)>0}
function academicStatusText(p){
 if(academicallyIneligible(p))return `Ineligible · ${p.academicHold} wk`;
 const s=p.academicStanding??70;
 return s<ACADEMIC_FLOOR?`At risk · ${s}`:s<ACADEMIC_WATCH?`Watch · ${s}`:`Clear · ${s}`;
}
// Called once a week for the controlled program's roster. Drift is slow on purpose: this should be
// a problem you see coming for a month, not a coin flip that takes a starter away on Saturday.
function advanceAcademics(t){
 if(!t)return [];
 const newHolds=[];
 for(const p of t.roster){
  ensureAcademics(p,t);
  if((p.academicHold||0)>0){p.academicHold--;if(p.academicHold===0)p.academicStanding=Math.max(p.academicStanding,ACADEMIC_FLOOR+6);continue}
  const target=academicTarget(p,t),plan=p.academicPlan?.season===universe.year&&p.academicPlan?.week===universe.week-1?p.academicPlan.id:null,
   lift=plan==='study'?6:plan==='balance'?2:0;
  p.academicStanding=clamp(Math.round(p.academicStanding+(target-p.academicStanding)*.12+lift-1),5,99);
  if(p.academicStanding<ACADEMIC_FLOOR&&!p.redshirtActive){
   p.academicHold=2;newHolds.push(p);
   const order=universe.nextEventId++;universe.events??=[];
   universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
    type:'ACADEMIC_INELIGIBLE',importance:68,schoolIds:[t.id],playerIds:[p.id],coachIds:[],recruitIds:[],
    gameIds:[],summary:`${p.name} is academically ineligible for two weeks.`,
    metadata:{standing:p.academicStanding}});
  }
 }
 return newHolds;
}
// The trade-off the Coach's Desk was missing: every option here costs something real.
function academicDecision(t,taken){
 const p=t.roster
  .filter(x=>!x.redshirtActive&&!academicallyIneligible(x)&&academicRisk(x)&&!taken.has(x.id)&&!decisionRecent('ACADEMIC_WATCH',x.id))
  .sort((a,b)=>(a.academicStanding??70)-(b.academicStanding??70))[0];
 if(!p)return null;
 return decisionRecord('ACADEMIC_WATCH',t,p.id,`${p.name} — academic standing`,
  `Standing ${p.academicStanding} against a ${ACADEMIC_FLOOR} floor. ${t.academics>=75?'Academic support here is strong':t.academics<=45?'Academic support here is thin':'Academic support here is ordinary'} (${t.academics}). Below the floor he sits two weeks.`,
  [decisionOption('study','Study table','Six points of standing a week. He loses practice reps and some scheme familiarity.'),
   decisionOption('balance','Split the week','Two points a week and a smaller practice cost.',true),
   decisionOption('practice','Keep him at practice','No academic help. Standing keeps drifting toward what the program supports.')],
  {playerId:p.id},88);
}
function applyAcademicDecision(p,t,optionId){
 if(!p)return;
 p.academicPlan={id:optionId,season:universe.year,week:universe.week};
 const cost=n=>{ensurePlayerDevelopment(p);p.positionFamiliarity??={};p.positionFamiliarity[p.pos]=clamp(familiarity(p,p.pos)-n,0,100)};
 if(optionId==='study'){p.academicStanding=clamp((p.academicStanding??70)+6,5,99);cost(6)}
 else if(optionId==='balance'){p.academicStanding=clamp((p.academicStanding??70)+2,5,99);cost(2)}
}
function academicHubItems(t){
 if(!t)return[];
 const out=[],held=t.roster.filter(p=>academicallyIneligible(p));
 if(held.length)out.push({type:'bad-news',tab:'roster',player:held[0].id,importance:74,
  kicker:'ACADEMICS',main:held.length===1?`${held[0].name} is academically ineligible`:`${held.length} players academically ineligible`,
  sub:`${held[0].pos} ${held[0].name} sits ${held[0].academicHold} more week${held[0].academicHold===1?'':'s'}`});
 else {
  const risk=t.roster.filter(p=>!p.redshirtActive&&academicRisk(p)).sort((a,b)=>(a.academicStanding??70)-(b.academicStanding??70))[0];
  if(risk)out.push({type:'alert',tab:'roster',player:risk.id,importance:56,
   kicker:'ACADEMIC WATCH',main:`${risk.name} is close to the floor`,
   sub:`Standing ${risk.academicStanding} · ${ACADEMIC_FLOOR} is ineligibility`});
 }
 return out;
}
// The coaching tree. Career stints and the coach archive already recorded everything needed; nothing
// showed where the people who worked for you ended up. A program that produces head coaches should
// get credit for it, because that is what recruits and candidates hear about.
function allKnownCoaches(){
 const seen=new Map();
 for(const t of universe.teams||[])for(const c of Object.values(t.staff||{}))if(c?.id)seen.set(c.id,c);
 for(const c of universe.coachArchive||[])if(c?.id&&!seen.has(c.id))seen.set(c.id,c);
 return [...seen.values()];
}
// A branch is someone who worked for you in any role and later held a job somewhere else. The
// "later" matters: a coach who was a head coach elsewhere first and then joined your staff is not
// something your program produced.
function coachingTree(t){
 if(!t)return [];
 const out=[];
 for(const c of allKnownCoaches()){
  const hist=(c.careerHistory||[]).filter(s=>s.schoolId!=null);
  const here=hist.filter(s=>s.schoolId===t.id).sort((a,b)=>a.startSeason-b.startSeason)[0];
  if(!here)continue;
  const after=hist.filter(s=>s.schoolId!==t.id&&s.startSeason>=(here.endSeason??here.startSeason))
   .sort((a,b)=>a.startSeason-b.startSeason);
  if(!after.length)continue;
  const hc=after.find(s=>s.role==='Head Coach')||null;
  const now=after[after.length-1];
  out.push({coachId:c.id,name:c.name,under:{role:here.role,startSeason:here.startSeason,endSeason:here.endSeason},
   headCoach:hc?{schoolName:hc.schoolName,startSeason:hc.startSeason}:null,
   latest:{schoolName:now.schoolName,role:now.role,startSeason:now.startSeason},
   totals:coachCareerTotals(c)});
 }
 return out.sort((a,b)=>(b.headCoach?1:0)-(a.headCoach?1:0)||b.under.startSeason-a.under.startSeason);
}
function treeHeadCoaches(t){return coachingTree(t).filter(x=>x.headCoach)}
// Credited once per coach, so a long-tenured branch does not pay out every season forever.
function creditCoachingTree(t){
 if(!t)return 0;
 t.coachTreeCredited??=[];
 const fresh=treeHeadCoaches(t).filter(x=>!t.coachTreeCredited.includes(x.coachId));
 if(!fresh.length)return 0;
 const gain=Math.min(2,fresh.length);
 for(const x of fresh)t.coachTreeCredited.push(x.coachId);
 t.prestige=clamp((t.prestige||60)+gain,10,t.program_ceiling??100);
 const order=universe.nextEventId++;universe.events??=[];
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,
  type:'COACH_TREE',importance:64,schoolIds:[t.id],playerIds:[],coachIds:fresh.map(x=>x.coachId),
  recruitIds:[],gameIds:[],
  summary:`${fresh.map(x=>x.name).join(', ')} now running ${fresh.length===1?'a program':'programs'} of their own.`,
  metadata:{gain,coaches:fresh.map(x=>({id:x.coachId,name:x.name,school:x.headCoach?.schoolName}))}});
 return gain;
}
function coachingTreeHTML(t){
 const tree=coachingTree(t);
 if(!tree.length)return '<div class="muted">Nobody who has worked here has moved on yet.</div>';
 const hcs=tree.filter(x=>x.headCoach).length;
 const rows=tree.slice(0,12).map(x=>{
  const w=x.totals.wins,l=x.totals.losses;
  return `<div class="lineitem"><span>${x.name}<div class="small muted">${x.under.role} here, ${x.under.startSeason}${x.under.endSeason&&x.under.endSeason!==x.under.startSeason?`–${x.under.endSeason}`:''}</div></span>
   <strong>${x.headCoach?`HC · ${x.headCoach.schoolName}`:`${x.latest.role} · ${x.latest.schoolName}`}<div class="small muted">${w}-${l} career${x.totals.nationalTitles?` · ${x.totals.nationalTitles}×NC`:''}</div></strong></div>`;
 }).join('');
 return `<div class="muted" style="margin-bottom:8px">${hcs} head coach${hcs===1?'':'es'} produced · ${tree.length} former staff placed elsewhere.</div>${rows}`;
}
function coachTreeHubItems(t){
 if(!t)return[];
 const recent=treeHeadCoaches(t).filter(x=>x.headCoach.startSeason>=universe.year-1);
 if(!recent.length)return[];
 const x=recent[0];
 return [{type:'good-news',tab:'staff',importance:62,kicker:'COACHING TREE',
  main:`${x.name} is a head coach at ${x.headCoach.schoolName}`,
  sub:`${x.under.role} here in ${x.under.startSeason} · ${recent.length} produced in the last two years`}];
}
// Program history. Nothing tracked an all-time record for any of the 120 programs — t.w/t.l reset
// every season and nothing archived it. Tracking begins now, additively, from this version forward;
// a program's history before this release is not retroactively known, and the page says so.
function ensureAllTimeRecord(t){
 if(!t)return null;
 t.allTimeRecord??={w:0,l:0,confTitles:0,natTitles:0,seasons:0};
 return t.allTimeRecord;
}
function recordSeasonInHistory(t,w,l,wonConf,wonNational){
 const r=ensureAllTimeRecord(t);
 r.w+=w;r.l+=l;r.seasons++;
 if(wonConf)r.confTitles++;
 if(wonNational)r.natTitles++;
}
// Every coach who has ever held a stint at this school, in order — works for any program, not just
// the one the player runs, because it reads the same careerHistory the coaching tree already reads.
function programCoachingLineage(t){
 if(!t)return [];
 const rows=[];
 for(const c of allKnownCoaches()){
  for(const s of (c.careerHistory||[]).filter(s=>s.schoolId===t.id))
   rows.push({coachId:c.id,name:c.name,role:s.role,startSeason:s.startSeason,endSeason:s.endSeason,reasonEnded:s.reasonEnded});
 }
 return rows.sort((a,b)=>b.startSeason-a.startSeason||(b.endSeason??9999)-(a.endSeason??9999));
}
function programHistoryHTML(t){
 if(!t)return '';
 const r=ensureAllTimeRecord(t),pct=r.w+r.l?((r.w/(r.w+r.l))*100).toFixed(1):'—';
 const lineage=programCoachingLineage(t).slice(0,12).map(s=>
  `<div class="lineitem"><span>${s.name}<div class="small muted">${s.role}</div></span><strong>${s.startSeason}${s.endSeason&&s.endSeason!==s.startSeason?`–${s.endSeason}`:s.endSeason?'':'–present'}${s.reasonEnded?`<div class="small muted">${s.reasonEnded}</div>`:''}</strong></div>`
 ).join('');
 return `<div class="muted" style="margin-bottom:8px">${r.w}-${r.l} (${pct}%) over ${r.seasons} tracked season${r.seasons===1?'':'s'} · ${r.confTitles} conference title${r.confTitles===1?'':'s'} · ${r.natTitles} national title${r.natTitles===1?'':'s'}. Tracking began at v0.9.33; earlier seasons are not included.</div>${lineage||'<div class="muted">No coaching stints on record yet.</div>'}`;
}
// One opponent, one week. Old full-scout saves still work; new plans expose
// component tradeoffs used by both quick simulation and the drive model.
const GAMEPLAN_TIERS={
 scout:{label:'Full scout',off:1.2,def:1.8,famCost:8,wearCost:3},
 balance:{label:'Balanced prep',off:.6,def:.9,famCost:3,wearCost:1},
 standard:{label:'Standard week',off:0,def:0,famCost:0,wearCost:0},
 stop_run:{label:'Stop the run',off:0,def:0,front:6,coverage:-4,famCost:8,wearCost:3},
 protect_pass:{label:'Protect against the pass',off:0,def:0,front:-4,coverage:6,famCost:8,wearCost:3},
 pressure:{label:'Pressure the QB',off:0,def:0,front:0,coverage:-3,pressure:.035,famCost:8,wearCost:3}
};
function teamGameplanFor(t,opponentName){
 const g=t?.gameplan;
 return (g&&g.year===universe.year&&g.week===universe.week&&g.opponent===opponentName)?g:null;
}
function applyGameplanEdge(profile,prep){
 const tier=GAMEPLAN_TIERS[prep];if(!tier||!profile)return profile;
 profile.offense=clamp(profile.offense+tier.off,35,99);
 profile.defense=clamp(profile.defense+tier.def,35,99);
 // Detailed drives use components rather than aggregate offense/defense.
 for(const [key,delta] of Object.entries({qb:tier.off,skill:tier.off,ol:tier.off,front:(tier.front||0)+tier.def,coverage:(tier.coverage||0)+tier.def})){
  if(Number.isFinite(profile[key]))profile[key]=clamp(profile[key]+delta,20,99);
 }
 profile.prepPressure=tier.pressure||0;
 return profile;
}
function gameProfiles(t,opponentName){const p=profiles(t),g=teamGameplanFor(t,opponentName);return g?applyGameplanEdge(p,g.prep):p}
function applyGameplanWear(t,opponentName){
 const g=teamGameplanFor(t,opponentName),tier=GAMEPLAN_TIERS[g?.prep];
 if(!tier||!Array.isArray(g.wearPending)||g.wearApplied)return;
 for(const id of g.wearPending){const p=t.roster.find(p=>p.id===id);if(p)p.wear=clamp((p.wear||0)+tier.wearCost,0,100)}
 g.wearApplied=true;
}
function gameplanSnapshot(t,opponentName){
 const g=teamGameplanFor(t,opponentName),tier=GAMEPLAN_TIERS[g?.prep];
 return {prep:tier?g.prep:'standard',label:tier?.label||'Standard week'};
}
function weeklyGameplanDecision(t){
 const g=universe.schedule[universe.week]?.find(x=>!x.played&&(x.home===t.name||x.away===t.name));
 if(!g)return null;
 const oppName=g.home===t.name?g.away:g.home,opp=T(oppName);
 if(!opp||decisionRecent('WEEKLY_GAMEPLAN',`${t.name}_${oppName}_${g.week}`,0))return null;
 const installing=!!(schemeTransition(t,'off')||schemeTransition(t,'def'));
 const passShare=OFF_SCHEMES[opp.offScheme].pass,staffPick=passShare>=.54?'protect_pass':passShare<=.46?'stop_run':'balance';
 const cost=`3 wear for five key starters at kickoff${installing?'; costs 8 scheme-install familiarity':''}.`;
 return decisionRecord('WEEKLY_GAMEPLAN',t,null,`Gameplan for ${opp.name}`,
  `${opp.offScheme} / ${opp.defScheme} · ${opp.w}-${opp.l}. Scheme tendency: about ${Math.round(passShare*100)}% pass. Pick one plan for this opponent; the staff recommendation follows that tendency.`,
  [decisionOption('stop_run','Stop the run',`Stronger run front, weaker pass coverage. ${cost}`,staffPick==='stop_run'),
   decisionOption('protect_pass','Protect against the pass',`Tighter coverage, softer run front. ${cost}`,staffPick==='protect_pass'),
   decisionOption('pressure','Pressure the QB',`More pass pressure, weaker coverage if the throw gets away. ${cost}`),
   decisionOption('balance','Balanced prep',`Small all-around edge; 1 wear for five key starters at kickoff${installing?'; costs 3 scheme-install familiarity':''}.`,staffPick==='balance'),
   decisionOption('standard','Standard week','No special adjustment or extra wear.')],
  {},58);
}
function applyGameplanDecision(t,option){
 const g=universe.schedule[universe.week]?.find(x=>!x.played&&(x.home===t.name||x.away===t.name));
 if(!g||teamGameplanFor(t,g.home===t.name?g.away:g.home))return false;
 const oppName=g.home===t.name?g.away:g.home,tier=GAMEPLAN_TIERS[option.id];
 if(!tier)return false;
 t.gameplan={year:universe.year,week:universe.week,opponent:oppName,prep:option.id,wearPending:importantStarters(t).slice(0,5).map(p=>p.id),wearApplied:false};
 if(tier?.famCost){
  for(const side of ['off','def']){
   const tr=schemeTransition(t,side);
   if(tr)tr.familiarity=clamp(tr.familiarity-tier.famCost,0,100);
  }
 }
 return true;
}
function buildWeeklyHub(beforeRank=selected()?.rank||null){const u=selected(),items=[...pulledOfferHubItems(u),...coachOpeningHubItems(u),...coachFalloutHubItems(u),...promiseHubItems(u),...recordChaseHubItems(u),...rivalryHubItems(u),...adminHubItems(u),...careerHubItems(u),...bowlHubItems(u),...signingDayHubItems(),...academicHubItems(u),...coachTreeHubItems(u)],res=userWeekResult(u);if(res)items.push({type:res.win?'good-news':'bad-news',tab:'season',kicker:'FINAL',importance:res.win?50:60,gameId:res.gameId,main:`${res.win?'Win':'Loss'} ${res.userPts}–${res.oppPts} ${res.loc} ${res.opp}`,sub:`${u.w}-${u.l} overall · ${u.cw}-${u.cl} conference`});if(beforeRank&&u.rank!==beforeRank)items.push({type:u.rank<beforeRank?'good-news':'alert',tab:'season',kicker:'RANKINGS',importance:45,main:`${u.rank<beforeRank?'Up':'Down'} to #${u.rank}`,sub:`Previous ranking: #${beforeRank}`});let inj=u.roster.filter(p=>(p.injuryHistory||[]).some(x=>x.year===universe.year&&x.week===universe.week)).slice(0,2);for(const p of inj)items.push({type:'bad-news',tab:'roster',player:p.id,kicker:'MEDICAL',importance:55,main:`${p.name}: ${p.injury}`,sub:`Expected absence: ${p.injuryWeeks} week${p.injuryWeeks===1?'':'s'}`});let commits=universe.recruits.filter(r=>r.committed===u.name&&r.commitWeek===universe.week).slice(0,3);for(const r of commits)items.push({type:'good-news',tab:'recruiting',recruit:r.id,kicker:'COMMITMENT',importance:40+r.stars*3,main:`${'★'.repeat(r.stars)} ${r.pos} ${r.name}`,sub:`#${r.nationalRank} nationally · ${r.homeCity}, ${r.homeState}`});let next=findUserGame();if(next){let opp=T(next.home===u.name?next.away:next.home);items.push({type:'action',tab:'gamelab',kicker:'NEXT UP',importance:48,main:`Week ${universe.week+1}: ${next.home===u.name?'vs':'@'} ${opp.name}`,sub:`${opp.w}-${opp.l} · #${opp.rank<=25?opp.rank:'—'} · ${opp.offScheme}`})}let risk=u.roster.map(p=>({p,r:transferRisk(p)})).sort((a,b)=>b.r-a.r)[0];if(risk?.r>=42)items.push({type:'alert',tab:'roster',player:risk.p.id,kicker:'LOCKER ROOM',importance:Math.min(80,Math.round(risk.r)),main:`${risk.p.name} transfer risk: ${Math.round(risk.r)}`,sub:`${risk.p.role} · morale ${risk.p.morale}`});for(const e of (universe.decommitLog||[]).filter(e=>e.year===universe.year&&e.week===universe.week&&(e.from===u.name||e.to===u.name)).slice(0,3))items.push(e.from===u.name?{type:'bad-news',tab:'recruiting',recruit:e.id,kicker:'DECOMMIT',importance:50+e.stars*3,main:`${'★'.repeat(e.stars)} ${e.pos} ${e.name}`,sub:e.to?`Flipped to ${e.to}`:'Reopened his recruitment'}:{type:'good-news',tab:'recruiting',recruit:e.id,kicker:'FLIP',importance:45+e.stars*3,main:`${'★'.repeat(e.stars)} ${e.pos} ${e.name}`,sub:`Flipped from ${e.from}`});let waver=universe.recruits.filter(r=>r.committed===u.name&&r.challenger&&r.pressure>0).sort((a,b)=>b.pressure-a.pressure)[0];if(waver)items.push({type:'alert',tab:'recruiting',recruit:waver.id,kicker:'WAVERING',importance:52,main:`${waver.name} hearing from ${waver.challenger}`,sub:`${'★'.repeat(waver.stars)} ${waver.pos} commit · target, visit or promise to hold him`});let hot=universe.recruits.filter(r=>r.targeted&&!r.committed).sort((a,b)=>b.interest-a.interest)[0];if(hot)items.push({type:'action',tab:'recruiting',recruit:hot.id,kicker:'TOP TARGET',importance:35,main:`${hot.name} · ${hot.interest}%`,sub:`#${hot.nationalRank} ${hot.pos} · ${hot.trend>0?'↑ '+hot.trend:hot.trend<0?'↓ '+Math.abs(hot.trend):'steady'}`});universe.weeklyHub=items.sort((a,b)=>(b.importance??40)-(a.importance??40)).slice(0,9)}

function simulateUserDetailed(){const g=findUserGame();if(!g)return;if(hasPendingCareerChoice()){setStatus('Choose your next job before advancing the week.');return}if(hasPendingWeeklyDecisions()){setStatus('Resolve the Coach’s Desk decisions before playing this week.');return}recoverWeek();const r=detailedGame(T(g.home),T(g.away),false,g.conf);completeScheduledGame(g,r,true);universe.lastDetailedGame={...r,season:universe.year,week:g.week};universe.latest=[r];ranked();render()}
function completeScheduledGame(g,r,detailed=false){
 if(g.played)return;
 g.gameId=r.gameId;g.played=true;g.score=[r.ap,r.hp];g.winner=r.winner;
 if(detailed)g.detailed=true;
 settleRivalryGame(g);
}
function watchUserDetailed(){const before=universe.lastDetailedGame?.gameId;simulateUserDetailed();const id=universe.lastDetailedGame?.gameId;if(id&&id!==before)showGameCenter(id,'Watch')}
function hasPendingCareerChoice(){return !!(universe.jobOffers||[]).length}
function simWeek(skipDecisions=false){if(universe.phase!=='regular'||universe.week>=12)return;if(hasPendingCareerChoice()){setStatus('Choose your next job before advancing the week.');return}if(skipDecisions!==true&&hasPendingWeeklyDecisions()){setStatus('Resolve the Coach’s Desk decisions before advancing the week.');return}recoverWeek();const u=selected(),beforeRank=u.rank;advanceAcademics(u);let results=[];for(const g of universe.schedule[universe.week]){if(g.played){settleRivalryGame(g);continue;}let r=gameSim(T(g.home),T(g.away),false,g.conf);completeScheduledGame(g,r);results.push(r);if(g.home===u.name||g.away===u.name)universe.lastDetailedGame=null}universe.week++;if(results.length)universe.latest=results;ranked();advanceRecruiting();buildWeeklyHub(beforeRank);if(universe.week===12)universe.phase='confReady';render()}
function simSeason(){if(hasPendingCareerChoice()){setStatus('Choose your next job before advancing the week.');return}while(universe.phase==='regular'){delegateWeeklyDecisions(selected());simWeek(true)}render()}
function confStand(c){return universe.teams.filter(t=>t.conference===c).map(t=>({t,s:rankingScore(t)})).sort((a,b)=>b.t.cw-a.t.cw||b.t.w-a.t.w||b.s-a.s).map(x=>x.t)}
function simConferenceChampionships(){if(universe.phase!=='confReady')return;universe.latest=[];universe.confChamps=[];allConfs().forEach(c=>{let s=confStand(c);if(s.length<2)return;let r=gameSim(s[0],s[1],true,false,{week:13,label:c+' Championship'}),w=T(r.winner);w.champ=true;universe.confChamps.push(w);universe.latest.push({...r,label:c+' Championship'})});universe.phase='bowlReady';ranked();render()}
function seedField(){let r=ranked(),set=new Set(universe.confChamps.map(t=>t.name)),ats=r.filter(t=>!set.has(t.name)).slice(0,6);return [...universe.confChamps,...ats].map(t=>({t,s:rankingScore(t)})).sort((a,b)=>b.s-a.s).map(x=>x.t).slice(0,16)}
function simPlayoff(){if(universe.phase==='bowlReady')simBowls();if(universe.phase!=='playoffReady')return;let field=seedField();field.forEach((t,i)=>t.seed=i+1);let logs=[];function round(arr,label){let out=[];for(let i=0;i<arr.length/2;i++){let a=arr[i],b=arr[arr.length-1-i],r=gameSim(a,b,true,false,{week:14+['Round of 16','Quarterfinal','Semifinal','National Championship'].indexOf(label),label});logs.push({...r,label});out.push(T(r.winner))}return out}let r16=round(field,'Round of 16'),q=round(r16,'Quarterfinal'),s=round(q,'Semifinal'),f=round(s,'National Championship');universe.champion=f[0].name;universe.phase='complete';universe.latest=logs;finalizeRecruiting();finalizeSeasonHonors();archiveSeason();ranked();render()}
function archiveSeason(){if(universe.history.some(h=>h.year===universe.year&&h.type==='season'))return;let awards=universe.awards?.[universe.year]||projectedAwards();universe.history.unshift({type:'season',year:universe.year,champion:universe.champion,top10:ranked().slice(0,10).map(t=>({name:t.name,record:`${t.w}-${t.l}`})),records:universe.teams.map(t=>({name:t.name,w:t.w,l:t.l,cw:t.cw,cl:t.cl,pf:t.pf,pa:t.pa,prestige:t.prestige})),awards,userTeam:$('#userTeam').value})}
function recruitPitch(t,r){if(recruitBlocked(t,r))return -1e6;let v=t.prestige*.32+t.nil*.16+t.development*.15+t.academics*.06+t.facilities*.07+t.staff.RC.recruiting*.10+t.staff.HC.recruiting*.05+(t.w-t.l)*.7+pipelineStrength(t,r.homeRegion)*.10+distancePitch(t,r)+recruitCoachRelationshipBoost(t,r)+(nilDealActive(r,t)?nilDealActive(r,t).amount*3:0);switch(r.priority){case'Prestige':v+=t.prestige*.18;break;case'NIL':v+=t.nil*.20;break;case'Development':v+=t.development*.18;break;case'Early Role':v+=Math.max(0,90-unitCached(t,r.pos))*.20;break;case'Coaching':v+=(t.staff.HC.loyalty+t.staff.RC.recruiting)*.08;break;case'Academics':v+=t.academics*.18;break;case'Scheme Fit':v+=t.offScheme==='Multiple'?8:5;break;case'Winning':v+=(t.w/Math.max(1,t.w+t.l))*18;break;case'Stay Close':v+=Math.max(-12,12-recruitDistance(t,r)/80);break;case'Campus Life':v+=(t.fan_support+t.facilities)*.06;break}return v}
function scheduleVisit(r){const u=selected();if(r.visitWeek){r.visitWeek=null;r.visit=false;return}let g=u.schedule.find(g=>!g.played&&g.home===u.name&&g.week>=universe.week+1);r.visitWeek=g?g.week:Math.min(12,universe.week+1);r.visit=true;firstRecruitEvaluation(r,u);refreshScoutingIntel(r,u,5,'VISIT',true)}
function decommitRecruit(r,reason){if(!r.committed)return false;let from=r.committed,t=T(from);r.committed=null;r.commitWeek=null;r.flippedFrom=from;universe.recruitClassCounts[from]=Math.max(0,classCommitCount(from)-1);if(t?.commits)t.commits=t.commits.filter(x=>x.id!==r.id);universe.decommitLog??=[];universe.decommitLog.push({year:universe.year,week:universe.week,id:r.id,name:r.name,pos:r.pos,stars:r.stars,from,to:null,reason});if(universe.decommitLog.length>80)universe.decommitLog.splice(0,universe.decommitLog.length-80);return true}
function pressureCommit(r,u){if(universe.week<6||(r.commitWeek??0)+2>universe.week)return;let home=T(r.committed);if(!home)return;let mine=r.committed===u.name,boost=(r.targeted?10:0)+r.relationship*.12+recruitPromiseBoost(r,u)+(r.visitWeek===universe.week?7:0);if(r.visitWeek===universe.week)r.visit=false;let hold=recruitPitch(home,r)+(mine?boost:0)+6;let best=null,bestPitch=-1e9;for(const t of sample(universe.teams,12)){if(t.name===r.committed||!canTakeCommit(t.name))continue;let v=recruitPitch(t,r)+(t.name===u.name?(r.targeted?boost:-1e9):0);if(v>bestPitch){bestPitch=v;best=t}}if(!best)return;let gap=bestPitch-hold;r.pressure=Math.round(gap);r.challenger=gap>-14?best.name:null;if(gap<-30)return;if(Math.random()<.07/(1+Math.exp(-(gap+11)/4))){let from=r.committed;decommitRecruit(r,'flip');r.interest=clamp(Math.round(best.name===u.name?Math.max(r.interest,70):40+gauss()*8),1,100);if(commitRecruit(r,best.name)){let e=universe.decommitLog[universe.decommitLog.length-1];if(e&&e.id===r.id)e.to=best.name}r.trend=0}}
// --- v0.9.11: scholarship scarcity ------------------------------------------
// A class is bounded by the room the roster actually leaves, so every offer
// costs a spot and attrition becomes a recruiting resource.
const SCHOLARSHIP_LIMIT=85;
function projectedDepartures(t){return (t.roster||[]).filter(p=>eligibilityBase(p)>=3).length}
function projectedReturning(t){
 const roster=t.roster||[],departing=projectedDepartures(t);
 // Programs plan for a little churn they cannot name yet: early declarations,
 // the portal, medical. Without it every class would be cut a few short.
 const attrition=Math.round((roster.length-departing)*.06);
 return Math.max(0,roster.length-departing-attrition);
}
function scholarshipCapacity(t){
 // Programs sign toward a steady roster rather than exactly replacing a lumpy
 // senior class, and initial counters are capped besides. The floor keeps a
 // thin-attrition year from making recruiting pointless; the ceiling is what
 // stops a big graduating class from becoming a 38-man haul.
 return clamp(SCHOLARSHIP_LIMIT-projectedReturning(t),12,25);
}
function scholarshipRoom(t){return t?clamp(scholarshipCapacity(t)-classCommitCount(t.name),0,40):0}
function scholarshipSummary(t){
 const cap=scholarshipCapacity(t),used=classCommitCount(t.name);
 return {capacity:cap,committed:used,room:Math.max(0,cap-used),over:Math.max(0,used-cap),
  returning:projectedReturning(t),departing:projectedDepartures(t)};
}
// --- pulled offers ----------------------------------------------------------
// Pulling a commitment is allowed and sometimes necessary, but it is never
// free: the recruit will not come back, and the pipeline he came from notices.
function pullOffer(r,teamName,reason='Roster space'){
 if(!r||r.committed!==teamName)return false;
 const t=T(teamName);if(!t)return false;
 decommitRecruit(r,'pulled');
 r.pulledBy??=[];if(!r.pulledBy.includes(teamName))r.pulledBy.push(teamName);
 r.pulledSeason=universe.year;r.interest=clamp(Math.round((r.interest||50)*.45),1,60);
 const e=(universe.decommitLog||[])[universe.decommitLog.length-1];
 if(e&&e.id===r.id)e.reason='pulled';
 if(r.homeRegion)t.pipelines[r.homeRegion]=clamp(pipelineStrength(t,r.homeRegion)-gi(4,9),5,100);
 promiseState();
 const order=universe.nextEventId++;
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,type:'OFFER_PULLED',
  importance:58,schoolIds:[t.id],playerIds:[],coachIds:[],recruitIds:[r.id],gameIds:[],
  summary:`${t.name} pulled its offer to ${'★'.repeat(r.stars||3)} ${r.pos} ${r.name}.`,
  metadata:{recruitId:r.id,recruitName:r.name,pos:r.pos,stars:r.stars,region:r.homeRegion,reason}});
 return true;
}
function pulledOfferHubItems(t){
 if(!t)return[];
 return (universe.events||[]).filter(e=>e.type==='OFFER_PULLED'&&e.schoolIds.includes(t.id)&&e.season===universe.year).slice(-2).reverse()
  .map(e=>({type:'bad-news',tab:'recruiting',kicker:'OFFER PULLED',importance:e.importance,main:e.summary,
   sub:`${e.metadata.region||'His region'} pipeline took a hit. He will not consider ${t.name} again.`}));
}
// A recruit does not forget who pulled his offer.
function recruitBlocked(t,r){return !!(r.pulledBy||[]).includes(t?.name)}
// Any program that ends signing day over its limit has to let people go.
function enforceScholarshipLimits(){
 for(const t of universe.teams){
  let guard=0;
  while(classCommitCount(t.name)>scholarshipCapacity(t)&&guard++<40){
   const commits=universe.recruits.filter(r=>r.committed===t.name);
   if(!commits.length)break;
   const weakest=commits.slice().sort((a,b)=>(a.scoutUp+a.scout*.55)-(b.scoutUp+b.scout*.55))[0];
   if(!pullOffer(weakest,t.name,'Over the scholarship limit'))break;
  }
 }
}
function classCommitCount(name){return universe.recruitClassCounts?.[name]||0}
// Some programs over-sign on purpose, betting on attrition they cannot name
// yet; signing day settles the bet. Appetite is stable per program per class,
// and impatient, high-profile programs are the ones that push the limit.
function oversignAppetite(t){
 if(!t)return 0;
 const h=Math.abs(hashString(`${t.id}|${universe.year}|oversign`));
 const nerve=clamp(((100-(t.admin_patience??60))+(t.prestige??60))/5,4,38);
 return h%100<nerve?1+(h>>7&1):0;
}
function canTakeCommit(name){const t=T(name);return t?classCommitCount(name)<scholarshipCapacity(t)+oversignAppetite(t):false}
function commitRecruit(r,name){if(r.committed||!canTakeCommit(name))return false;let t=T(name);if(recruitBlocked(t,r))return false;assignPrimaryRecruiter(r,t,t.name===selected()?.name?r.relationship:null);r.committed=name;r.commitWeek=universe.week;r.challenger=null;r.pressure=0;r.signedPromise=r.promiseOffer?.schoolId===t.id?{...r.promiseOffer}:null;universe.recruitClassCounts??={};universe.recruitClassCounts[name]=classCommitCount(name)+1;t.commits??=[];t.commits.push(r);r.recruitingMemory=captureRecruitment(r,t);return true}
function advanceRecruiting(){const u=selected();clearUnitCache();universe.recruits.forEach(r=>{ensureRecruitRelationships(r);if(r.committed){pressureCommit(r,u);return}r.prevInterest=r.interest;let pool=sample(universe.teams,20).sort((a,b)=>recruitPitch(b,r)-recruitPitch(a,r)),top=pool.find(t=>canTakeCommit(t.name))||pool[0];r.leader=top.name;let promiseBoost=recruitPromiseBoost(r,u),visitBoost=0;if(r.visitWeek===universe.week){let g=u.schedule.find(g=>g.week===universe.week&&g.home===u.name);visitBoost=g&&g.played?(g.winner===u.name?13:5):7;r.visit=false}let us=recruitPitch(u,r)+(r.targeted?10:0)+r.relationship*.12+visitBoost+promiseBoost,ais=recruitPitch(top,r);if(r.targeted){firstRecruitEvaluation(r,u);refreshScoutingIntel(r,u,2+(visitBoost?4:0),'RECRUITING',true);let gain=gi(2,6);r.relationship=clamp(r.relationship+gain,0,100);growRecruiterRelationship(r,u,gain);r.interest=clamp(Math.round(r.interest+(us-ais)*.065+gi(1,5)+gauss()*2),1,100)}else r.interest=clamp(Math.round(r.interest+(us-ais)*.018+gauss()*2),1,100);r.trend=r.interest-r.prevInterest;if(universe.week>=5&&Math.random()<.028+universe.week*.009){if(r.targeted&&r.interest>=72&&us>=ais-4&&canTakeCommit(u.name))commitRecruit(r,u.name);else{let dest=pool.find(t=>canTakeCommit(t.name));if(dest)commitRecruit(r,dest.name)}}})}
function finalizeRecruiting(){const u=selected();clearUnitCache();buildSigningDay();universe.recruitCycle={year:universe.year,seasonCommits:universe.recruits.filter(r=>r.commitWeek).length,decommits:(universe.decommitLog||[]).filter(e=>e.year===universe.year).length,flips:(universe.decommitLog||[]).filter(e=>e.year===universe.year&&e.to).length};let remaining=universe.recruits.filter(r=>!r.committed);while(remaining.length){let needy=universe.teams.filter(t=>scholarshipRoom(t)>0&&classCommitCount(t.name)<15);if(!needy.length)break;let r=remaining.shift();if(r.targeted&&r.interest>=68&&canTakeCommit(u.name)&&classCommitCount(u.name)<15){commitRecruit(r,u.name);continue}let top=sample(needy,16).sort((a,b)=>recruitPitch(b,r)-recruitPitch(a,r))[0]||needy[0];commitRecruit(r,top.name)}for(const r of remaining){if(r.committed)continue;if(r.targeted&&r.interest>=68&&canTakeCommit(u.name)){let available=universe.teams.filter(t=>canTakeCommit(t.name)),top=sample(available,24).sort((a,b)=>recruitPitch(b,r)-recruitPitch(a,r))[0];if(!top||recruitPitch(u,r)+10+r.relationship*.12>=recruitPitch(top,r)-3){commitRecruit(r,u.name);continue}}let available=universe.teams.filter(t=>canTakeCommit(t.name));if(!available.length)break;let top=sample(available,28).sort((a,b)=>recruitPitch(b,r)-recruitPitch(a,r))[0]||available[0];commitRecruit(r,top.name)}enforceScholarshipLimits();universe.recruitCycle.signeesByTeam=Object.fromEntries(universe.teams.map(t=>[t.name,universe.recruits.filter(r=>r.committed===t.name).length]));}
function autoTarget(){const u=selected();universe.recruits.forEach(r=>r.targeted=false);let needs={};POS.forEach(p=>needs[p]=(POS_COUNTS[p]||4)-u.roster.filter(x=>x.pos===p&&x.year!=='SR').length*.55);universe.recruits.filter(r=>!r.committed).sort((a,b)=>(b.scoutUp+(needs[b.pos]||0)*5)-(a.scoutUp+(needs[a.pos]||0)*5)).slice(0,20).forEach(r=>{r.targeted=true;firstRecruitEvaluation(r,u)});renderRecruiting()}
function chooseCoachMoveDestination(c,from,slot,changed,moved){
 const user=selected()?.name,candidates=universe.teams.filter(t=>t.id!==from.id&&t.name!==user&&!changed.get(t.id)?.has(slot)&&!moved.has(t.staff?.[slot]?.id)&&t.prestige>=from.prestige-5);
 if(!candidates.length)return null;const scored=candidates.map(t=>({t,score:(t.prestige-from.prestige)*1.1+t.resources*.14+(slot==='RC'?t.nil*.10:t.development*.09)+(c.ambition||60)*.05+gauss()*3})).sort((a,b)=>b.score-a.score),short=scored.slice(0,6),best=short[0]?.score??0;let total=0;for(const x of short){x.weight=Math.exp((x.score-best)/6);total+=x.weight}let roll=Math.random()*total;for(const x of short){roll-=x.weight;if(roll<=0)return x.t}return short.at(-1)?.t||null
}
function carousel(){
 let log=[],trackedMoves=0,next=universe.year+1,moved=new Set(),changed=new Map(universe.teams.map(t=>[t.id,new Set()])),mark=(t,slot)=>changed.get(t.id).add(slot),did=(t,slot)=>changed.get(t.id).has(slot),controlled=$('#userTeam').value;
 for(const t of universe.teams){recordCoachSeason(t);for(const c of Object.values(t.staff)){c.age=(c.age||40)+1;c.years=(c.years||0)+1;c.contractYears=Math.max(0,(c.contractYears??2)-1)}}
 for(const t of universe.teams){const hc=t.staff.HC,expected=clamp(Math.round((t.prestige-30)/8),4,10),bad=t.w<expected-2,fire=bad&&Math.random()>(t.admin_patience/100),hcRetire=Math.random()<coachRetirementChance(hc);if(!(fire||hcRetire))continue;const status=hcRetire?'RETIRED':'FIRED',reason=hcRetire?'Retired after the season':`Fired after ${t.w}-${t.l}`;if(t.name===controlled){createOpening(t,'HC',reason,status);mark(t,'HC');log.push(`${t.name}: ${hc.name} ${status==='FIRED'?'was fired':'retired'}. The Head Coach job is open — interview and hire from the Staff tab.`);continue}const candidates=['OC','DC'].filter(slot=>!did(t,slot)).map(slot=>({slot,c:t.staff[slot],score:(t.staff[slot].ambition||60)+(t.staff[slot].playCall||60)*.35+(t.staff[slot].development||60)*.2})).sort((a,b)=>b.score-a.score),promote=Math.random()<.32&&candidates[0]?.c;if(promote){const who=candidates[0],oldName=hc.name;promoteCoachWithinTeam(t,who.slot,'HC',reason,status);mark(t,'HC');mark(t,who.slot);moved.add(who.c.id);log.push(`${t.name}: ${oldName} ${status==='FIRED'?'was fired':'retired'}; ${who.c.name} promoted from ${COACH_SLOT_ROLES[who.slot]} to Head Coach.`)}else{const x=replaceStaffCoach(t,'HC',reason,status,next);mark(t,'HC');log.push(`${t.name}: ${x.old.name} ${status==='FIRED'?'was fired':'retired'}; ${x.fresh.name} hired as Head Coach.`)}}
 for(const t of universe.teams)for(const slot of ['OC','DC']){if(did(t,slot))continue;const c=t.staff[slot];if(moved.has(c.id))continue;const retire=Math.random()<coachRetirementChance(c),turn=!retire&&Math.random()<(slot==='OC'?.07+c.ambition/900:.06+c.ambition/1000);if(!retire&&!turn)continue;if(t.name===controlled){createOpening(t,slot,retire?'Retired after the season':'Left for another opportunity',retire?'RETIRED':'DEPARTED');mark(t,slot);log.push(`${t.name}: ${c.name} ${retire?'retired':'left for another opportunity'} as ${COACH_SLOT_ROLES[slot]}. The job is open — interview and hire from the Staff tab.`);continue}if(retire){const x=replaceStaffCoach(t,slot,'Retired after the season','RETIRED',next);mark(t,slot);log.push(`${t.name}: ${x.old.name} retired; ${x.fresh.name} takes over as ${COACH_SLOT_ROLES[slot]}.`);continue}const dest=trackedMoves<6?chooseCoachMoveDestination(c,t,slot,changed,moved):null;if(dest){const destOld=dest.staff[slot].name;moveCoach(c,t,dest,slot,'Accepted a new coordinator job');mark(t,slot);mark(dest,slot);moved.add(c.id);trackedMoves++;log.push(`${c.name}: ${t.name} ${COACH_SLOT_ROLES[slot]} → ${dest.name} ${COACH_SLOT_ROLES[slot]}; ${destOld} departs.`)}else{const x=replaceStaffCoach(t,slot,'Left for another opportunity','DEPARTED',next);mark(t,slot);log.push(`${t.name}: ${x.old.name} left as ${COACH_SLOT_ROLES[slot]}; ${x.fresh.name} takes over.`)}}
 for(const t of universe.teams){if(!did(t,'RC')){const c=t.staff.RC,retire=Math.random()<coachRetirementChance(c),turn=!retire&&Math.random()<.018+(c.ambition||60)/2200;if(t.name===controlled){if(retire||turn){createOpening(t,'RC',retire?'Retired after the season':'Left for another opportunity',retire?'RETIRED':'DEPARTED');mark(t,'RC');log.push(`${t.name}: ${c.name} ${retire?'retired':'left for another opportunity'} as Recruiting Coordinator. The job is open — interview and hire from the Staff tab.`)}}else if(retire){const x=replaceStaffCoach(t,'RC','Retired after the season','RETIRED',next);mark(t,'RC');log.push(`${t.name}: ${x.old.name} retired; ${x.fresh.name} takes over as Recruiting Coordinator.`)}else if(turn){const dest=trackedMoves<8?chooseCoachMoveDestination(c,t,'RC',changed,moved):null;if(dest){const destOld=dest.staff.RC.name;moveCoach(c,t,dest,'RC','Accepted a new recruiting coordinator job');mark(t,'RC');mark(dest,'RC');moved.add(c.id);trackedMoves++;log.push(`${c.name}: ${t.name} Recruiting Coordinator → ${dest.name}; ${destOld} departs.`)}else{const x=replaceStaffCoach(t,'RC','Left for another opportunity','DEPARTED',next);mark(t,'RC');log.push(`${t.name}: ${x.old.name} left as Recruiting Coordinator; ${x.fresh.name} takes over.`)}}}if(!did(t,'SC')){const c=t.staff.SC;if(Math.random()<coachRetirementChance(c)){if(t.name===controlled){createOpening(t,'SC','Retired after the season','RETIRED');mark(t,'SC');log.push(`${t.name}: ${c.name} retired as Strength & Performance. The job is open — interview and hire from the Staff tab.`)}else{const x=replaceStaffCoach(t,'SC','Retired after the season','RETIRED',next);mark(t,'SC');log.push(`${t.name}: ${x.old.name} retired; ${x.fresh.name} takes over as Strength & Performance.`)}}}}
 return log
}
function runOffseason(){if(universe.phase!=='complete'||universe.offseasonDone)return;if(archiveIsDeferred())return storageOperation(async()=>{await ensureArchiveLoaded();runOffseason()});let devState=ensureDevelopmentState();if(!devState.springRun||!devState.fallRun){setStatus('Complete spring development and fall camp before finalizing the offseason.');return}auditPromises();universe.campHistory[universe.year]=JSON.parse(JSON.stringify(devState));finalizeSeasonHonors();archiveSeason();reviewControlledProgram(selected());creditCoachingTree(selected());for(const t of universe.teams)updateFanSupport(t);const carouselLog=carousel();let move=[],portal=[...(universe.transferPortal||[])],draftPool=[];universe.transferPortal=[];const controlled=$('#userTeam').value;const meanPrestige=avg(universe.teams.map(t=>t.prestige)),meanWins=avg(universe.teams.map(t=>t.w));universe.teams.forEach(t=>{ensureAllTimeRecord(t);recordSeasonInHistory(t,t.w,t.l,universe.confChamps.some(c=>c.name===t.name),universe.champion===t.name);let prevW=t.w,exits=[];for(const p of t.roster)archivePlayerSeason(p,t,universe.year);for(const p of t.roster){if(t.name===controlled&&eligibilityBase(p)===0)snapshotScouting(p,t,'FRESHMAN_YEAR_END','SEASON');let preserved=p.redshirtActive&&canRedshirt(p)&&(p.stats?.games||0)<=4;if(preserved){p.redshirtUsed=true;p.redshirtSeason=universe.year;p.redshirtActive=false}else{p.redshirtActive=false;p.eligibilityUsed=eligibilityBase(p)+1}let exhausted=p.eligibilityUsed>=4,early=!exhausted&&earlyDeclaration(p,t);if(exhausted||early){let reason=early?'Declared early for draft':'Eligibility exhausted';draftPool.push({p,t,reason,score:draftProjection(p,t).score});exits.push(p)}}t.roster=t.roster.filter(p=>!exits.includes(p));let keep=[];for(const p of t.roster){let risk=transferRisk(p);if(Math.random()<risk/360)portal.push({p,from:t.name,fromSchoolId:t.id,reason:transferReason(p),enteredSeason:universe.year,wasStarter:(p.stats?.starts||0)>=6});else keep.push(p)}t.roster=keep;t.roster.forEach(p=>{ensurePlayerDevelopment(p,t);let old=p.perceived;p.morale=clamp(p.morale+gi(-5,9),15,99);p.promiseBaseline??=old;p.year=CLASS_NAMES[Math.min(3,eligibilityBase(p))]||'SR';p.positionFamiliarity[p.pos]=clamp(familiarity(p,p.pos)+gi(2,6),0,100);p.stats=newStats();p.campGrade=null});let signed=universe.recruits.filter(r=>r.committed===t.name).slice(0,Math.max(0,105-t.roster.length));signed.forEach(r=>{if(t.name===controlled){firstRecruitEvaluation(r,t);snapshotScouting(r,t,'SIGNING_DAY','RECRUITING',true)}let p=generatePlayer(t,r.pos,99);Object.assign(p,{name:r.name,style:r.style,trueNow:r.trueNow,upside:r.upside,perceived:r.scout,perceivedUpside:r.scoutUp,year:'FR',eligibilityUsed:0,redshirtUsed:false,redshirtActive:false,origin:`${r.stars}-star recruit from ${r.highSchool||r.homeRegion} (${r.homeCity||r.homeRegion}, ${r.homeState||''})${r.flippedFrom?` · flipped from ${r.flippedFrom}`:''}`,promise:r.promise&&r.promise!=='None'?r.promise:null,promiseBaseline:r.scout,portraitSeed:r.portraitSeed||p.portraitSeed,portraitVersion:r.portraitVersion||PORTRAIT_VERSION,scoutConfidence:r.scoutConfidence??p.scoutConfidence,scoutingDomains:r.scoutingDomains?JSON.parse(JSON.stringify(r.scoutingDomains)):undefined,scoutingHistory:r.scoutingHistory?JSON.parse(JSON.stringify(r.scoutingHistory)):[]});p.jerseyNumber=jerseyFor(p.pos,p.portraitSeed);signPlayerPromise(p,r,t);p.recruitingMemory=r.recruitingMemory;p.primaryRecruiterCoachId=r.primaryRecruiterCoachId||r.recruitingMemory?.primaryRecruiterCoachId||r.recruitingMemory?.recruiterCoachId||null;p.coachRelationships={...(r.coachRelationships||r.recruitingMemory?.coachRelationships||{})};p.coachDeparturePressure=r.coachDeparturePressure?{...r.coachDeparturePressure}:null;p.transferHistory=[];ensurePlayerDevelopment(p,t);t.roster.push(p);let hs=(universe.highSchools||[]).find(h=>h.id===r.highSchoolId);if(hs)hs.d1Signees=(hs.d1Signees||0)+1;t.pipelines[r.homeRegion]=clamp(pipelineStrength(t,r.homeRegion)+gi(1,3),0,100)});for(const c of Object.keys(t.pipelines))if(!signed.some(r=>r.homeRegion===c))t.pipelines[c]=clamp(t.pipelines[c]-1,5,100);let target=meanWins+(t.prestige-meanPrestige)/9,deltaPrestige=clamp(Math.round((prevW-target)*.35),-3,3);t.prestige=clamp(t.prestige+deltaPrestige,10,t.program_ceiling);t.commits=[];if(t.name===controlled)move.push(`${exits.length} players left for the draft/eligibility; ${signed.length} signees joined; ${deltaPrestige>=0?'+':''}${deltaPrestige} prestige.`)});
 runDraft(draftPool);portal.forEach(x=>{x.p.stats=newStats();x.p.year=CLASS_NAMES[Math.min(3,eligibilityBase(x.p))]||'SR';const dest=placeTransfer(x);if(dest){if(x.from===controlled||dest.name===controlled)move.push(`${x.p.pos} ${x.p.name}: ${x.from} → ${dest.name} (${transferReasonLabel(x.reason)})`)}else universe.transferPortal.push(x)});updateCareerRecords();move.push(...carouselLog.filter(x=>x.includes(controlled)));universe.movementLog=move.slice(0,100);universe.year++;universe.week=0;resetNilSeason();universe.recoveredWeek=-1;universe.phase='regular';universe.latest=[];universe.confChamps=[];universe.champion=null;universe.lastDetailedGame=null;universe.recruits=generateRecruitPool(2800,universe.highSchools);universe.recruitClassCounts={};universe.teams.forEach(t=>{t.w=t.l=t.cw=t.cl=t.pf=t.pa=t.sos=0;t.rank=null;t.champ=false;while(t.roster.length<85)t.roster.push(generateFreshman(t,pick(POS)));if(t.roster.length>105){let keep=t.roster.sort((a,b)=>b.trueNow-a.trueNow).slice(0,105),cut=t.roster.filter(p=>!keep.includes(p));for(const p of cut)addToArchive(p,t,'Roster cut');t.roster=keep}autoRedshirts(t);autoDepthTeam(t,false);autoRoleDepth(t,false)});normalizePromiseState();universe.developmentState={year:universe.year,springRun:false,fallRun:false,springReport:[],fallReport:[],battles:[]};universe.offseasonDone=false;buildSchedule();ranked();buildPreseasonHub();render()}
// v0.9.1: move the same player object; preserve the reasons and relationships.
function captureRecruitment(r,t){
 const topFive=universe.teams.map(team=>({id:team.id,score:recruitPitch(team,r)})).sort((a,b)=>b.score-a.score).slice(0,5).map(x=>x.id);
 const recruiter=assignPrimaryRecruiter(r,t,r.coachRelationships?.[r.primaryRecruiterCoachId]),recruiterId=recruiter?.id||t.staff.RC.id;return {season:universe.year,schoolId:t.id,topFiveSchoolIds:topFive,offerSchoolIds:[...new Set([t.id,r.promiseOffer?.schoolId].filter(x=>x!=null))],recruiterCoachId:recruiterId,primaryRecruiterCoachId:recruiterId,relationship:coachRelationshipValue(r,recruiterId,50),coachRelationships:{...(r.coachRelationships||{})},stars:r.stars,homeRegion:r.homeRegion,lat:r.lat,lon:r.lon};
}
function transferReason(p){return promisePenalty(p)>0?'BROKEN_PROMISE':(p.stats?.starts||0)<4?'PLAYING_TIME':'FRESH_START'}
function transferReasonLabel(reason){return {BROKEN_PROMISE:'Broken promise',PLAYING_TIME:'Playing opportunity',FRESH_START:'Fresh start',ROSTER_RELEASE:'Roster release'}[reason]||reason}
function transferFit(p,t,from,reason){
 const m=p.recruitingMemory||{},rank=(m.topFiveSchoolIds||[]).indexOf(t.id);
 const prior=clamp((rank<0?20:100-rank*10)+((m.offerSchoolIds||[]).includes(t.id)?15:0),0,100);
 const depth=t.roster.filter(x=>x.pos===p.pos),best=Math.max(50,...depth.map(x=>x.trueNow));
 const opportunity=clamp(65+(p.trueNow-best)*2-Math.max(0,depth.length-2)*6,0,100);
 let relationship=20,coachId=null;
 for(const c of Object.values(t.staff||{})){
  let value=p.coachRelationships?.[c.id]??(m.recruiterCoachId===c.id?m.relationship||50:20);
  if((p.promises||[]).some(q=>q.coachId===c.id&&q.status==='BROKEN'))value=Math.max(0,value-40);
  if(value>relationship){relationship=value;coachId=c.id}
 }
 const lat=Number.isFinite(m.lat)?m.lat:from.lat,lon=Number.isFinite(m.lon)?m.lon:from.lon;
 const proximity=Number.isFinite(lat)&&Number.isFinite(lon)?clamp(100-haversineMiles(lat,lon,t.lat,t.lon)/20,0,100):50;
 const pipeline=pipelineStrength(t,m.homeRegion||from.conference);
 const follow=p.coachDeparturePressure?.toSchoolId===t.id?clamp(p.coachDeparturePressure.strength||0,0,70):0;
 const score=prior*.20+opportunity*(reason==='BROKEN_PROMISE'?.30:.25)+playerSchemeFit(p,t)*.15+relationship*.15+follow*.08+proximity*.10+t.prestige*(reason==='BROKEN_PROMISE'?.05:.10)+pipeline*.05;
 return {score,prior,opportunity,relationship,coachId,follow};
}
function chooseTransferDestination(p,from,reason){
 const candidates=universe.teams.filter(t=>t.id!==from.id&&t.roster.length<105).map(t=>({t,...transferFit(p,t,from,reason)}));
 if(!candidates.length)return null;
 const best=Math.max(...candidates.map(x=>x.score));let total=0;
 for(const x of candidates){x.weight=Math.exp((x.score-best)/7);total+=x.weight}
 let roll=Math.random()*total;for(const x of candidates){roll-=x.weight;if(roll<=0)return x}return candidates.at(-1);
}
function releasePlayerPromises(p,t,reason){for(const q of p.promises||[])if(q.status==='ACTIVE'&&q.schoolId===t.id){q.status='RELEASED';q.resolvedSeason=universe.year;q.result=reason;q.severity=0;q.transferPenalty=0;addDynastyEvent('PROMISE_RELEASED',p,t,q,{result:reason})}}
function placeTransfer(entry){
 const {p,reason}=entry,from=universe.teams.find(t=>t.id===entry.fromSchoolId)||T(entry.from);
 if(!from)throw new Error('Transfer origin is missing.');
 p.transferHistory??=[];
 // Defensive replay guard: never duplicate a transfer or a roster entry.
 if(p.transferHistory.some(h=>h.season===universe.year))return null;
 const match=chooseTransferDestination(p,from,reason);if(!match)return null;
 const dest=match.t;
 releasePlayerPromises(p,from,'Player left through the transfer portal; remaining obligation released.');
 const history={season:universe.year,fromSchoolId:from.id,toSchoolId:dest.id,fromSchool:from.name,toSchool:dest.name,reason,priorRelationship:match.relationship,coachId:match.coachId,recruiterCoachId:p.recruitingMemory?.recruiterCoachId||null,wasStarter:entry.wasStarter||false};
 p.transferHistory.push(history);p.currentSchoolId=dest.id;p.origin=`Transfer from ${from.name}`;p.morale=clamp(70+gi(-5,12),30,95);p.staffTrust=70;p.promise=null;p.stats=newStats();p.campGrade=null;p.year=CLASS_NAMES[Math.min(3,eligibilityBase(p))]||'SR';
 from.roster=from.roster.filter(x=>x.id!==p.id);dest.roster.push(p);
 promiseState();const order=universe.nextEventId++;
 universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,type:'TRANSFER_COMPLETED',importance:reason==='BROKEN_PROMISE'?65:50,schoolIds:[from.id,dest.id],playerIds:[p.id],coachIds:[history.coachId,history.recruiterCoachId].filter(Boolean),recruitIds:[],gameIds:[],summary:`${p.name}: ${from.name} → ${dest.name}.`,metadata:history});
 return dest;
}
function familiarFaceItems(t){
 if(!t)return [];const game=findUserGame();if(!game)return [];
 const opponent=T(game.home===t.name?game.away:game.home);if(!opponent)return [];
 const items=[];
 for(const [team,former] of [[opponent,t],[t,opponent]])for(const p of team.roster){
  const history=(p.transferHistory||[]).filter(h=>h.fromSchoolId===former.id).at(-1);if(!history)continue;
  const importance=55+(history.wasStarter?10:0)+((p.recruitingMemory?.stars||0)>=4?5:0)+(history.reason==='BROKEN_PROMISE'?10:0);
  items.push({type:'alert',tab:'roster',player:p.id,kicker:'FAMILIAR FACE',importance,main:`Former ${former.name} ${p.pos} ${p.name} now plays for ${team.name}`,sub:`Week ${universe.week+1} matchup · ${transferReasonLabel(history.reason)} · moved after ${history.season}`});
 }
 return items.sort((a,b)=>b.importance-a.importance).slice(0,2);
}
// A career reads as one list, not four: where he came from, what he did, what it cost him,
// where he went. Everything here is already stored — this only puts it in order.
function careerChronologyHTML(p){
 const rows=[],m=p.recruitingMemory;
 if(m?.season)rows.push({year:m.season,rank:0,kicker:'SIGNED',
  main:`${m.stars?'★'.repeat(m.stars):'Unrated'} · ${universe.teams.find(t=>t.id===m.schoolId)?.name||p.seasonHistory?.[0]?.team||'—'}`,
  sub:m.homeRegion?`Out of the ${m.homeRegion}`:''});
 for(const s of p.seasonHistory||[])rows.push({year:s.year,rank:1,kicker:'SEASON',
  main:`${s.team} · ${s.eligibility||s.pos}`,sub:`${s.pos} · ${statLine(s)}`});
 for(const a of p.awards||[])rows.push({year:a.year,rank:2,kicker:'HONOR',main:a.name,sub:''});
 for(const h of p.transferHistory||[])rows.push({year:h.season,rank:3,kicker:'TRANSFER',
  main:`${h.fromSchool} → ${h.toSchool}`,sub:transferReasonLabel(h.reason)});
 for(const i of p.injuryHistory||[])rows.push({year:i.year,rank:4,kicker:'INJURY',
  main:i.type,sub:`Week ${i.week} · ${i.weeks} week${i.weeks===1?'':'s'} out`});
 if(p.draftResult)rows.push({year:p.draftResult.year,rank:5,kicker:'DRAFT',main:p.draftResult.label,sub:''});
 if(!rows.length)return '<div class="muted">No career history recorded yet.</div>';
 return rows.sort((a,b)=>b.year-a.year||a.rank-b.rank).map(r=>
  `<div class="timeline-row"><div class="small muted">${r.year} · ${r.kicker}</div><strong>${r.main}</strong>${r.sub?`<div class="muted">${r.sub}</div>`:''}</div>`).join('');
}
function transferHistoryHTML(p){const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));return '<h3 style="margin-top:14px">Transfer History</h3>'+((p.transferHistory||[]).map(h=>`<div class="timeline-row"><strong>${esc(h.season)} · ${esc(h.fromSchool)} → ${esc(h.toSchool)}</strong><div>${esc(transferReasonLabel(h.reason))}</div></div>`).join('')||'<div class="muted">No transfers recorded.</div>')}

function transferRisk(p){return clamp((58-p.morale)+(p.role==='Development'?12:0)+(p.role==='Redshirt candidate'?8:0)+promisePenalty(p)+coachTransferPressure(p)+schemeFitPressure(p)+(p.injuryWeeks>3?3:0)-nilRetentionRelief(p),0,100)}
// A player who fit the old system and not the new one has a reason to leave.
function schemeFitPressure(p){const t=T(p.currentSchoolId?universe.teams.find(x=>x.id===p.currentSchoolId)?.name:null)||universe.teams.find(x=>x.roster?.includes(p));if(!t)return 0;const side=OFF_POS.has(p.pos)?'off':'def',tr=schemeTransition(t,side);if(!tr)return 0;const now=schemeFitFor(p,schemeDefFor(side,tr.to)),was=schemeFitFor(p,schemeDefFor(side,tr.from));if(now==null||was==null)return 0;return clamp(Math.round((was-now)*.45),0,14)}
function playerGrade(p){return grade(p.perceived)}
function upsideLabel(p){let g=p.perceivedUpside-p.perceived;return g>=18?'Huge':g>=11?'High':g>=6?'Moderate':'Limited'}
function newsScoreLine(g){
 const f=recapFacts(g);
 return `${gameEscape(f.win.name)} ${f.wPts}, ${gameEscape(f.lose.name)} ${f.lPts}`;
}
function renderNewsletter(){
 if(gamesAreDeferred())return storageOperation(async()=>{await ensureGamesLoaded();renderNewsletter()});
 const sel=$('#newsWeek'),scopeSel=$('#newsScope'),weeks=newsWeeks();
 if(!weeks.length){$('#newsletterBody').innerHTML='<div class="card"><span class="muted">No games have been played yet. Simulate a week and the newsletter fills in.</span></div>';sel.innerHTML='';return}
 const wanted=sel.value||`${weeks[0].season}|${weeks[0].week}`;
 sel.innerHTML=weeks.slice(0,60).map(w=>`<option value="${w.season}|${w.week}"${`${w.season}|${w.week}`===wanted?' selected':''}>${w.season} · ${w.label&&w.label!=='Regular season'?gameEscape(w.label):`Week ${w.week}`}</option>`).join('');
 const [season,week]=(sel.value||wanted).split('|').map(Number);
 const letter=weeklyNewsletter(season,week,scopeSel.value,$('#userTeam').value);
 if(!letter){$('#newsletterBody').innerHTML='<div class="card"><span class="muted">No games in that week for this coverage setting.</span></div>';return}
 let html=`<div class="card news-lead"><div class="eyebrow">${gameEscape(letter.title)}</div><h3>${gameEscape(newsScoreLine(letter.lead.game))}</h3><p class="recap">${letter.lead.recap.body}</p>${gameLink(letter.lead.game.id,'Open Game Center')}</div>`;
 if(letter.note)html+=`<div class="card"><div class="small muted">${letter.note}</div></div>`;
 if(letter.items.length)html+=`<div class="card"><h3>Around the ${letter.scope==='national'?'country':letter.scope==='conference'?'conference':'schedule'}</h3>${letter.items.map(x=>`<div class="news-item"><div class="strong">${gameEscape(newsScoreLine(x.game))}</div><div class="compact muted">${x.recap.body}</div><div>${gameLink(x.game.id,'Box score')}</div></div>`).join('')}${letter.more?`<div class="small muted">${letter.more} more game${letter.more===1?'':'s'} not shown.</div>`:''}</div>`;
 $('#newsletterBody').innerHTML=html;
}
const TAB_RENDERERS={dashboard:()=>{},roster:renderRoster,depth:renderDepth,staff:renderStaff,gamelab:renderGameLab,season:renderSeason,newsletter:renderNewsletter,stats:renderStats,recruiting:renderRecruiting,program:renderProgram,development:renderDevelopment,offseason:renderOffseason,records:renderRecords,history:()=>{renderHistory();if(($('#archiveSearch')?.value||'').length>=2)renderArchiveSearch()}};
let activeTab='dashboard';
function renderActiveTab(){(TAB_RENDERERS[activeTab]||(()=>{}))()}
const TAB_GROUPS=[
 {id:'program',label:'Program',tabs:['dashboard','program','history']},
 {id:'team',label:'Team',tabs:['roster','depth','development']},
 {id:'recruiting',label:'Recruiting',tabs:['recruiting']},
 {id:'games',label:'Games',tabs:['gamelab','season','stats','newsletter']},
 {id:'staff',label:'Staff & Offseason',tabs:['staff','offseason','records']}];
function groupOf(tab){return TAB_GROUPS.find(g=>g.tabs.includes(tab))||TAB_GROUPS[0]}
// Selecting a group reveals its tabs and nothing else. A single-tab group is just that tab.
function showTabGroup(id,{activate=true}={}){
 const g=TAB_GROUPS.find(x=>x.id===id)||TAB_GROUPS[0];
 $$('.tab-groups button').forEach(b=>b.classList.toggle('active',b.dataset.group===g.id));
 $$('.tabs button').forEach(b=>{b.hidden=!g.tabs.includes(b.dataset.tab)});
 if(activate&&!g.tabs.includes(activeTab))$(`.tabs button[data-tab="${g.tabs[0]}"]`)?.click();
 return g;
}
// Anything that activates a tab — a hub tile, the weekly plan, go() — must bring its group with it,
// or the tab would open with the wrong group highlighted and its siblings hidden.
function syncTabGroup(tab){showTabGroup(groupOf(tab).id,{activate:false})}
function setActiveTab(id){activeTab=id;syncTabGroup(id);renderActiveTab()}
function goToTab(id){if(!$('#'+id))return;$$('.tabs button').forEach(x=>x.classList.toggle('active',x.dataset.tab===id));$$('.tab').forEach(x=>x.classList.toggle('active',x.id===id));setActiveTab(id);$('#'+id).scrollIntoView?.({block:'start'})}
function render(){const order=ranked();const u=selected();if(!u)return;const p=profiles(u);$('#teamName').textContent=u.name;$('#teamMeta').textContent=`${u.conference} · ${u.offScheme} / ${u.defScheme} · Prestige ${u.prestige} · Ceiling ${u.program_ceiling}`;$('#teamMetrics').innerHTML=[['Offense',grade(p.offense)],['Defense',grade(p.defense)],['Scheme Fit',grade((p.offFit+p.defFit)/2)],['Development',grade(u.development)]].map(x=>`<div class="metric"><div class="small muted">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('');$('#recordBig').textContent=`${u.w}–${u.l}`;$('#rankLine').textContent=u.rank<=25?`#${u.rank} nationally`:`#${u.rank} nationally · outside the top 25`;$('#weekLine').textContent=`${universe.year} · Week ${universe.week}`;$('#top15').innerHTML=order.slice(0,15).map((t,i)=>`<div class="rankrow${t.name===u.name?' target':''}"><div><span class="rank">${i+1}.</span> ${t.name}</div><div>${t.w}-${t.l}</div></div>`).join('');const leaders=u.roster.slice().sort((a,b)=>b.perceived-a.perceived).slice(0,5);$('#snapshot').innerHTML=`<div class="lineitem"><span>Roster</span><strong>${u.roster.length}</strong></div><div class="lineitem"><span>Protected redshirts</span><strong>${u.roster.filter(p=>p.redshirtActive).length}</strong></div><div class="lineitem"><span>Commits</span><strong>${u.commits.length}</strong></div><div class="lineitem"><span>Head Coach</span><strong>${u.staff.HC.name}</strong></div><div class="lineitem"><span>PF / PA</span><strong>${u.pf} / ${u.pa}</strong></div>`+leaders.map(x=>`<div class="lineitem compact"><span>${x.pos} ${x.name}</span><span>${playerGrade(x)} · ${x.style}</span></div>`).join('');renderWeeklyPlan();renderWeeklyHub();renderActiveTab();$('#simConf').disabled=universe.phase!=='confReady';$('#simPlayoff').disabled=!['bowlReady','playoffReady'].includes(universe.phase);let devState=ensureDevelopmentState();$('#runOffseason').disabled=universe.phase!=='complete'||!devState.springRun||!devState.fallRun;const noGame=!findUserGame();$('#simDetailedGame').disabled=noGame;$('#watchDetailedGame').disabled=noGame}
function attachPlayerLinks(){$$('[data-player]').forEach(b=>b.onclick=()=>showPlayerProfile(b.dataset.player));paintPortraits()}

// --- v0.9.14: the coach's desk --------------------------------------------
// A few state-backed choices sit above the existing weekly checklist. They
// persist with the universe, resolve through mechanics the game already owns,
// and write one ordinary event so the choice is auditable after the week ends.
function decisionOption(id,label,description,recommended=false){return{id,label,description,recommended}}
function decisionRecent(type,subjectId,weeks=3){return (universe.weeklyDecisions||[]).some(d=>d.type===type&&d.season===universe.year&&d.subjectId===subjectId&&universe.week-d.week>0&&universe.week-d.week<=weeks)}
function decisionRecord(type,t,subjectId,title,summary,options,links={},priority=50){return{id:`WD_${universe.year}_${universe.week}_${t.id}_${type}_${subjectId}`,season:universe.year,week:universe.week,teamId:t.id,type,source:'STAFF',subjectId,title,summary,playerId:null,recruitId:null,coachId:null,...links,options,resolved:false,resolvedOptionId:null,resolvedSeason:null,resolvedWeek:null,priority}}
function importantStarters(t){ensureRoleDepth(t);const seen=new Set(),out=[];for(const role of ROLE_DEFS.filter(r=>r.base)){const p=rolePlayers(t,role.id)[0];if(p&&!seen.has(p.id)){seen.add(p.id);out.push(p)}}return out.sort((a,b)=>b.perceived-a.perceived)}
function activePromise(p,type){return (p.promises||[]).find(q=>q.type===type&&q.status==='ACTIVE'&&q.schoolId===p.currentSchoolId)}
function playerInteractionRecent(p,weeks=4){return (universe.weeklyDecisions||[]).some(d=>d.source==='PLAYER'&&d.season===universe.year&&d.playerId===p.id&&universe.week-d.week>=0&&universe.week-d.week<weeks)}
function playerInteractionWindow(t,weeks=4){return (universe.weeklyDecisions||[]).filter(d=>d.source==='PLAYER'&&d.teamId===t.id&&d.season===universe.year&&universe.week-d.week>=0&&universe.week-d.week<weeks).length}
function playerAgencyDecision(t,excluded=new Set()){
 if(!t||universe.week<1||playerInteractionWindow(t)>=3)return null;
 const available=t.roster.filter(p=>!excluded.has(p.id)&&!playerInteractionRecent(p)&&(p.injuryWeeks||0)<3),urgent=available.some(p=>transferRisk(p)>=78);
 if(universe.week%2===0&&!urgent)return null;
 const choices=[];
 const transfer=available.map(p=>({p,risk:transferRisk(p)})).filter(x=>x.risk>=70).sort((a,b)=>b.risk-a.risk)[0];
 if(transfer)choices.push(decisionRecord('PLAYER_TRANSFER_CONCERN',t,transfer.p.id,`${transfer.p.name} is weighing his future`,`${transfer.p.role} · ${transfer.p.stats?.games||0} appearances · transfer risk ${Math.round(transfer.risk)}. He wants to know whether there is still a path here.`,[
  decisionOption('reassure','Reassure him','Repair some morale and trust without guaranteeing a role.',true),
  decisionOption('opportunity','Promise an opportunity','Create or reaffirm a bounded Early Role obligation.'),
  decisionOption('no_guarantees','Make no guarantees','Be direct, accepting a modest morale cost.')],{source:'PLAYER',playerId:transfer.p.id},94));
 const complaint=available.map(p=>({p,risk:transferRisk(p),q:activePromise(p,'EARLY_ROLE')})).filter(x=>x.risk<70&&!x.p.redshirtActive&&['Development','Redshirt candidate','Rotation'].includes(x.p.role)&&(x.p.stats?.games||0)<=Math.max(1,Math.floor(universe.week/2))&&((x.p.morale??60)<=55||x.q)).sort((a,b)=>(a.p.morale??60)-(b.p.morale??60))[0];
 if(complaint)choices.push(decisionRecord('PLAYER_PLAYING_TIME_COMPLAINT',t,complaint.p.id,`${complaint.p.name} wants more snaps`,`${complaint.p.role} · ${complaint.p.stats?.games||0} appearances through week ${universe.week}. He is asking for a clearer path into the rotation.`,[
  decisionOption('keep','Keep current role','Explain that the depth chart is not changing.'),
  decisionOption('rotation','Increase rotation','Move him one step closer to the field now.',true),
  decisionOption('opportunity','Set a clear opportunity','Create or reaffirm a bounded Early Role obligation.')],{source:'PLAYER',playerId:complaint.p.id},88));
 const redshirt=available.filter(p=>canRedshirt(p)&&((p.redshirtActive&&((p.morale??60)<=62||activePromise(p,'NO_REDSHIRT')))||(!p.redshirtActive&&(p.stats?.games||0)>=2&&(p.stats?.games||0)<=3))).sort((a,b)=>(b.stats?.games||0)-(a.stats?.games||0))[0];
 if(redshirt){const noRs=activePromise(redshirt,'NO_REDSHIRT');choices.push(decisionRecord('PLAYER_REDSHIRT_DISCUSSION',t,redshirt.id,`${redshirt.name} asks about his redshirt`,`${redshirt.stats?.games||0} appearances used. ${noRs?'He also has an active No Redshirt promise.':'He wants clarity before the four-game threshold is gone.'}`,[
  decisionOption('preserve','Preserve the redshirt',noRs?'Protect the year, putting the existing promise at risk.':'Protect the year and remove him from weekly availability.',!noRs),
  decisionOption('continue','Keep playing',noRs?'Honor the existing promise and keep him available.':'Keep him in the rotation and accept the eligibility risk.',!!noRs),
  decisionOption('revisit','Revisit next week','Make no change; a small trust cost comes with delaying the answer.')],{source:'PLAYER',playerId:redshirt.id},noRs?92:84))}
 const role=available.map(p=>{const depth=orderedAt(t,p.pos),i=depth.indexOf(p);return{p,i,top:depth[0]}}).filter(x=>x.i>=1&&x.i<=2&&x.top&&x.p.perceived>=x.top.perceived-5&&(x.p.morale??60)<=65&&(x.p.stats?.games||0)<universe.week).sort((a,b)=>a.i-b.i||b.p.perceived-a.p.perceived)[0];
 if(role)choices.push(decisionRecord('PLAYER_ROLE_REQUEST',t,role.p.id,`${role.p.name} asks for a larger role`,`${role.p.pos} depth position ${role.i+1} · ${role.p.stats?.games||0} appearances. His current evaluation is close to the player ahead of him.`,[
  decisionOption('grant','Grant the larger role','Move him up the depth structure and into the starter mix.'),
  decisionOption('rotation','Offer more rotation','Move him up one step without promising a start.',true),
  decisionOption('decline','Decline the request','Keep the current role, with a modest morale and trust cost.')],{source:'PLAYER',playerId:role.p.id},82));
 const position=available.map(p=>{const current=positionTransitionFit(p,p.pos),best=positionOptions(p).map(to=>({to,fit:positionTransitionFit(p,to)})).sort((a,b)=>b.fit-a.fit)[0];return{p,current,best}}).filter(x=>x.best&&x.best.fit>=70&&x.best.fit>=x.current+7&&(['Development','Redshirt candidate'].includes(x.p.role)||playerSchemeFit(x.p,t)<60)).sort((a,b)=>(b.best.fit-b.current)-(a.best.fit-a.current))[0];
 if(position)choices.push(decisionRecord('PLAYER_POSITION_CHANGE_REQUEST',t,position.p.id,`${position.p.name} asks to move to ${position.best.to}`,`${position.p.role} at ${position.p.pos}. The staff sees a workable physical and role fit at ${position.best.to}.`,[
  decisionOption('approve','Approve the move','Change his position now and begin the existing familiarity process.',true),
  decisionOption('defer','Defer to the offseason','Record the request without changing his current position.'),
  decisionOption('decline','Decline the move','Keep him at his current position, with a modest trust cost.')],{source:'PLAYER',playerId:position.p.id,requestedPosition:position.best.to},78));
 return choices.sort((a,b)=>b.priority-a.priority)[0]||null;
}
function ensureWeeklyDecisions(t){
 universe.weeklyDecisions??=[];
 if(!t||universe.phase!=='regular'||universe.week>=12)return [];
 const current=universe.weeklyDecisions.filter(d=>d.season===universe.year&&d.week===universe.week&&d.teamId===t.id);
 if(current.length)return current;
 const candidates=[];
 const hurt=importantStarters(t).find(p=>!p.redshirtActive&&(p.injuryWeeks||0)<=1&&((p.injuryWeeks||0)===1||(p.health??100)<=84||(p.wear||0)>=68)&&!decisionRecent('INJURED_STARTER',p.id));
 if(hurt)candidates.push(decisionRecord('INJURED_STARTER',t,hurt.id,`${hurt.name} — ${hurt.pos}`,`${hurt.health??100}% healthy with ${hurt.wear||0}/100 wear entering the next game. Medical staff recommends a limited role.`,[
  decisionOption('full','Full role','Keep him atop every package; adds a small workload risk.'),
  decisionOption('limited','Limited role','Use the rotation and reduce his workload.',true),
  decisionOption('sit','Sit','Make him unavailable for this week.')],{playerId:hurt.id},100));
 const redshirt=t.roster.filter(p=>canRedshirt(p)&&!p.redshirtUsed&&(p.stats?.games||0)>=3&&!decisionRecent('REDSHIRT_DECISION',p.id)).sort((a,b)=>(b.stats?.games||0)-(a.stats?.games||0)||b.perceivedUpside-a.perceivedUpside)[0];
 if(redshirt){const noRs=activePromise(redshirt,'NO_REDSHIRT');candidates.push(decisionRecord('REDSHIRT_DECISION',t,redshirt.id,`${redshirt.name} — redshirt threshold`,`${redshirt.stats.games} appearances used. ${noRs?'An active No Redshirt promise is part of this choice.':'One more appearance may exhaust the four-game cushion.'}`,[
  decisionOption('preserve','Preserve redshirt',noRs?'Protect him, putting the No Redshirt promise at risk.':'Protect him from further appearances.',!noRs),
  decisionOption('continue','Continue playing',noRs?'Honor the No Redshirt promise and keep him available.':'Keep him available, accepting the eligibility risk.',!!noRs)],{playerId:redshirt.id},95))}
 const concern=t.roster.map(p=>({p,risk:transferRisk(p),promise:activePromise(p,'EARLY_ROLE')})).filter(x=>!x.p.redshirtActive&&!decisionRecent('PLAYING_TIME_CONCERN',x.p.id)&&((x.risk>=48&&['Development','Redshirt candidate'].includes(x.p.role))||(x.promise&&(x.p.stats?.games||0)<Math.min(x.promise.expectedGames||8,universe.week)))).sort((a,b)=>b.risk-a.risk)[0];
 if(concern)candidates.push(decisionRecord('PLAYING_TIME_CONCERN',t,concern.p.id,`${concern.p.name} wants clarity`,`${concern.p.role} · ${concern.p.stats?.games||0} appearances · transfer risk ${Math.round(concern.risk)}.`,[
  decisionOption('keep','Keep current role','Be honest that the rotation is not changing.'),
  decisionOption('rotation','Increase rotation','Move him one step closer to the field now.',true),
  decisionOption('promise','Promise an opportunity',concern.promise?'Reaffirm the existing Early Role promise.':'Create a bounded Early Role obligation for this season.')],{playerId:concern.p.id},80));
 const recruitPool=universe.recruits.filter(r=>r.targeted&&!r.committed&&!r.visitWeek).sort((a,b)=>(b.stars-a.stars)||(b.interest-a.interest)||(a.nationalRank-b.nationalRank));
 if(universe.week<=9&&recruitPool.length>=2){const pair=recruitPool.slice(0,2),key=pair.map(r=>r.id).sort().join('_');if(!decisionRecent('RECRUITING_PRIORITY',key,2))candidates.push(decisionRecord('RECRUITING_PRIORITY',t,key,'Choose this week’s recruiting priority',`${pair[0].name} and ${pair[1].name} are both important targets. Staff has time to make one the visit priority.`,[
  decisionOption(`prioritize_${pair[0].id}`,`Prioritize ${pair[0].name}`,`Schedule his visit and give his coach relationship a small boost.`,pair[0].nationalRank<pair[1].nationalRank),
  decisionOption(`prioritize_${pair[1].id}`,`Prioritize ${pair[1].name}`,`Schedule his visit and give his coach relationship a small boost.`,pair[1].nationalRank<pair[0].nationalRank),
  decisionOption('hold','Hold the resource','Keep both recruitments unchanged.')],{recruitId:pair[0].id,recruitIds:pair.map(r=>r.id)},60))}
 const acad=academicDecision(t,new Set(candidates.map(d=>d.playerId).filter(Boolean)));if(acad)candidates.push(acad);
 const gameplan=weeklyGameplanDecision(t);if(gameplan)candidates.push(gameplan);
 const agency=playerAgencyDecision(t,new Set(candidates.map(d=>d.playerId).filter(Boolean)));if(agency)candidates.push(agency);
 const used=new Set(),made=candidates.sort((a,b)=>b.priority-a.priority).filter(d=>!d.playerId||(!used.has(d.playerId)&&used.add(d.playerId))).slice(0,3);universe.weeklyDecisions.push(...made);return made;
}
function currentWeeklyDecisions(t=selected()){return ensureWeeklyDecisions(t).filter(d=>!d.resolved)}
function hasPendingWeeklyDecisions(t=selected()){return !!t&&(universe.weeklyDecisions||[]).some(d=>d.season===universe.year&&d.week===universe.week&&d.teamId===t.id&&!d.resolved&&d.type!=='WEEKLY_GAMEPLAN')}
function promoteRotationPlayer(t,p){ensureDepth(t);ensureRoleDepth(t);const bump=arr=>{const i=arr.indexOf(p.id);if(i>0)[arr[i-1],arr[i]]=[arr[i],arr[i-1]]};bump(t.depthChart[p.pos]||[]);for(const role of ROLE_DEFS)if(role.eligible.includes(p.pos))bump(t.roleDepth[role.id]||[])}
function promisePlayerOpportunity(t,p,note){let q=activePromise(p,'EARLY_ROLE');if(q)return q;promiseState();q={id:`PR_${universe.nextPromiseId++}`,type:'EARLY_ROLE',schoolId:t.id,coachId:t.staff.HC.id,coachName:t.staff.HC.name,seasonMade:universe.year,madeWeek:universe.week,firstSeason:universe.year,expectedGames:Math.min(4,(p.stats?.games||0)+Math.max(1,12-universe.week)),status:'ACTIVE',resolvedSeason:null,result:null,severity:0,notes:[note],trainingPhases:[]};p.promises??=[];p.promises.push(q);p.promise='Early Role';addDynastyEvent('PROMISE_MADE',p,t,q);return q}
function applyRequestedPositionChange(t,p,to){if(!to||to===p.pos||!positionOptions(p).includes(to))return false;recordPromisePositionChange(p,to,true);const old=p.pos;p.formerPositions??=[];p.formerPositions.push({pos:old,year:universe.year});p.positionFamiliarity??={[old]:100};p.positionFamiliarity[to]=Math.max(p.positionFamiliarity[to]||0,38+Math.round((p.versatility??60)*.25));p.pos=to;p.trainingFocus='Position Transition';p.role='Development';p.requestedPositionChange={season:universe.year,week:universe.week,from:old,to,status:'APPROVED'};ensureDepth(t);autoRoleDepth(t,true);return true}
function addWeeklyDecisionEvent(d,option,t){promiseState();const order=universe.nextEventId++;universe.events.push({id:`EVT_${order}`,season:universe.year,week:universe.week,timestampOrder:order,type:'WEEKLY_DECISION_RESOLVED',importance:d.source==='PLAYER'?55:45,schoolIds:[t.id],playerIds:d.playerId?[d.playerId]:[],coachIds:d.coachId?[d.coachId]:[],recruitIds:d.recruitIds||[d.recruitId].filter(Boolean),gameIds:[],summary:`${d.title} — ${option.label}.`,metadata:{decisionId:d.id,decisionType:d.type,decisionSource:d.source||'STAFF',optionId:option.id,optionLabel:option.label}})}
function delegateWeeklyDecisions(t=selected()){for(const d of ensureWeeklyDecisions(t).filter(x=>!x.resolved)){const option={id:'delegate',label:'Delegated to staff'};d.resolved=true;d.resolvedOptionId=option.id;d.resolvedSeason=universe.year;d.resolvedWeek=universe.week;addWeeklyDecisionEvent(d,option,t)}}
function resolveWeeklyDecision(id,optionId){const d=(universe.weeklyDecisions||[]).find(x=>x.id===id),t=d&&universe.teams.find(x=>x.id===d.teamId),option=d?.options.find(x=>x.id===optionId);if(!d||d.resolved||!t||!option)return false;const p=d.playerId?t.roster.find(x=>x.id===d.playerId):null;
 if(d.type==='ACADEMIC_WATCH'&&p)applyAcademicDecision(p,t,option.id);
 else if(d.type==='WEEKLY_GAMEPLAN'&&t)applyGameplanDecision(t,option);
 else if(d.type==='INJURED_STARTER'&&p)p.weeklyAvailability={season:d.season,week:d.week,role:option.id};
 else if(d.type==='REDSHIRT_DECISION'&&p)p.redshirtActive=option.id==='preserve';
 else if(d.type==='PLAYING_TIME_CONCERN'&&p){if(option.id==='keep'){p.morale=clamp(p.morale-1,15,99);p.staffTrust=clamp((p.staffTrust??70)-1,0,100)}else if(option.id==='rotation'){p.role='Rotation';p.morale=clamp(p.morale+5,15,99);p.staffTrust=clamp((p.staffTrust??70)+3,0,100);promoteRotationPlayer(t,p)}else if(option.id==='promise'){promisePlayerOpportunity(t,p,'Made at the Coach\'s Desk after a playing-time concern.');p.morale=clamp(p.morale+3,15,99);p.staffTrust=clamp((p.staffTrust??70)+4,0,100)}}
 else if(d.type==='PLAYER_PLAYING_TIME_COMPLAINT'&&p){if(option.id==='keep'){p.morale=clamp(p.morale-4,15,99);p.staffTrust=clamp((p.staffTrust??70)-3,0,100)}else if(option.id==='rotation'){p.role='Rotation';promoteRotationPlayer(t,p);p.morale=clamp(p.morale+4,15,99);p.staffTrust=clamp((p.staffTrust??70)+3,0,100)}else{promisePlayerOpportunity(t,p,'Made after the player requested a clearer path to playing time.');p.morale=clamp(p.morale+3,15,99);p.staffTrust=clamp((p.staffTrust??70)+4,0,100)}}
 else if(d.type==='PLAYER_TRANSFER_CONCERN'&&p){if(option.id==='reassure'){p.morale=clamp(p.morale+5,15,99);p.staffTrust=clamp((p.staffTrust??70)+6,0,100)}else if(option.id==='opportunity'){promisePlayerOpportunity(t,p,'Made after the player raised a transfer concern.');p.morale=clamp(p.morale+4,15,99);p.staffTrust=clamp((p.staffTrust??70)+4,0,100)}else{p.morale=clamp(p.morale-3,15,99);p.staffTrust=clamp((p.staffTrust??70)+1,0,100)}}
 else if(d.type==='PLAYER_ROLE_REQUEST'&&p){if(option.id==='grant'){p.role='Starter mix';promoteRotationPlayer(t,p);promoteRotationPlayer(t,p);p.morale=clamp(p.morale+4,15,99);p.staffTrust=clamp((p.staffTrust??70)+2,0,100)}else if(option.id==='rotation'){p.role='Rotation';promoteRotationPlayer(t,p);p.morale=clamp(p.morale+3,15,99);p.staffTrust=clamp((p.staffTrust??70)+2,0,100)}else{p.morale=clamp(p.morale-3,15,99);p.staffTrust=clamp((p.staffTrust??70)-2,0,100)}}
 else if(d.type==='PLAYER_REDSHIRT_DISCUSSION'&&p){if(option.id==='preserve'){p.redshirtActive=true;p.staffTrust=clamp((p.staffTrust??70)+2,0,100)}else if(option.id==='continue'){p.redshirtActive=false;p.morale=clamp(p.morale+2,15,99)}else p.staffTrust=clamp((p.staffTrust??70)-2,0,100)}
 else if(d.type==='PLAYER_POSITION_CHANGE_REQUEST'&&p){if(option.id==='approve'&&applyRequestedPositionChange(t,p,d.requestedPosition)){p.morale=clamp(p.morale+4,15,99);p.staffTrust=clamp((p.staffTrust??70)+3,0,100)}else if(option.id==='defer')p.requestedPositionChange={season:universe.year,week:universe.week,from:p.pos,to:d.requestedPosition,status:'DEFERRED'};else if(option.id==='decline'){p.requestedPositionChange={season:universe.year,week:universe.week,from:p.pos,to:d.requestedPosition,status:'DECLINED'};p.morale=clamp(p.morale-4,15,99);p.staffTrust=clamp((p.staffTrust??70)-3,0,100)}}
 else if(d.type==='RECRUITING_PRIORITY'&&option.id.startsWith('prioritize_')){const rid=option.id.slice(11),r=universe.recruits.find(x=>String(x.id)===rid);if(r){scheduleVisit(r);growRecruiterRelationship(r,t,3)}}
 d.resolved=true;d.resolvedOptionId=option.id;d.resolvedSeason=universe.year;d.resolvedWeek=universe.week;addWeeklyDecisionEvent(d,option,t);setStatus(`Decision recorded: ${option.label}.`);render();return true}
function renderWeeklyDecisions(){const host=$('#weeklyDecisions'),t=selected();if(!host||!t)return;const all=ensureWeeklyDecisions(t),open=all.filter(d=>!d.resolved),blocked=open.some(d=>d.type!=='WEEKLY_GAMEPLAN');host.innerHTML=open.map(d=>`<div class="decision-card${d.source==='PLAYER'?' player-request':''}"><div class="decision-kicker">${d.source==='PLAYER'?'PLAYER REQUEST':'DECISION REQUIRED'}</div><div class="decision-title">${gameEscape(d.title)}</div><div class="decision-summary">${gameEscape(d.summary)}</div><div class="decision-options">${d.options.map(o=>`<button class="decision-option" data-decision="${gameEscape(d.id)}" data-choice="${gameEscape(o.id)}">${gameEscape(o.label)}${o.recommended?' · Staff pick':''}<small>${gameEscape(o.description)}</small></button>`).join('')}</div></div>`).join('');for(const id of ['#simWeek','#hubAdvance','#seasonWeek'])$(id).disabled=blocked;$$('[data-decision]').forEach(b=>b.onclick=()=>resolveWeeklyDecision(b.dataset.decision,b.dataset.choice))}

// --- v0.9.13: the weekly plan ----------------------------------------------
// Fourteen tabs and no signposting: the sequence that actually advances a
// dynasty (season → spring → fall camp → offseason) was invisible until you
// got stuck. This derives a short, ordered list of what is worth doing now,
// with the steps you have already cleared shown as done so the run of play
// reads like a checklist rather than a guess.
function planStep(key,label,detail,tab,done=false,priority=50){return {key,label,detail,tab,done,priority}}
function weeklyPlan(u){
 if(!u)return {items:[],remaining:0,heading:''};
 const out=[],ds=ensureDevelopmentState(),phase=universe.phase;
 // 1. The gate that moves the calendar. There is always exactly one.
 if(phase==='regular'&&universe.week<12)
  out.push(planStep('sim',`Play week ${universe.week+1}`,'Simulate the week, or take the game yourself in Game Lab.','dashboard',false,100));
 else if(phase==='confReady')
  out.push(planStep('conf','Play the conference championships','The regular season is over.','season',false,100));
 else if(phase==='bowlReady')
  out.push(planStep('bowls','Play the bowl games','Every team with six wins has one more.','season',false,100));
 else if(phase==='playoffReady')
  out.push(planStep('playoff','Play the playoff','Conference titles are settled.','season',false,100));
 else if(phase==='complete'){
  // The offseason is a strict sequence, so show all of it with progress.
  out.push(planStep('spring','Run spring development','Develop the roster and open position battles.','development',!!ds.springRun,100));
  out.push(planStep('fall','Run fall camp','Second development window; sets the depth chart.','development',!!ds.fallRun,99));
  out.push(planStep('offseason','Finalize the offseason',ds.springRun&&ds.fallRun?'Graduations, the draft, the portal, the carousel and signing day.':'Available once both camps are done.','offseason',false,98));
 }
 // 2. Anything blocking the program.
 for(const o of (universe.openings||[]).filter(o=>o.schoolId===u.id&&o.status==='OPEN'))
  out.push(planStep(`hire_${o.slot}`,`Hire a ${o.role}`,'An interim is holding the job and your staff is weaker for it.','staff',false,95));
 const sch=scholarshipSummary(u);
 if(sch.over)
  out.push(planStep('over','Get under the scholarship limit',`${sch.over} over. Signing day will pull your weakest commitments for you.`,'recruiting',false,92));
 // 3. Recruiting work that is actually available this week.
 const targets=universe.recruits.filter(r=>r.targeted&&!r.committed).length;
 if(sch.room>0&&phase==='regular')
  out.push(planStep('target',targets?`Work your ${targets} recruiting target${targets===1?'':'s'}`:'Build a recruiting board',
   `${sch.room} scholarship${sch.room===1?'':'s'} open. Auto-target fills the board in one click.`,'recruiting',targets>=Math.min(8,sch.room),70));
 const waver=universe.recruits.find(r=>r.committed===u.name&&r.challenger&&r.pressure>0);
 if(waver)out.push(planStep('waver',`Hold ${waver.name}`,`${waver.challenger} is making a push. Target him, schedule a visit or make a promise.`,'recruiting',false,85));
 // 4. The locker room.
 const risk=u.roster.map(p=>({p,r:transferRisk(p)})).sort((a,b)=>b.r-a.r)[0];
 if(risk&&risk.r>=50)
  out.push(planStep('risk',`Check in on ${risk.p.name}`,`Transfer risk ${Math.round(risk.r)}. Playing time, a broken promise or a scheme change is behind it.`,'roster',false,60));
 out.sort((a,b)=>(a.done-b.done)||(b.priority-a.priority));
 const items=out.slice(0,6);
 return {items,remaining:items.filter(x=>!x.done).length,
  heading:phase==='complete'?'Offseason checklist'
   :phase==='confReady'||phase==='playoffReady'?'Postseason'
   :universe.week===0?'Before the season':`Week ${universe.week+1}`};
}
function renderWeeklyPlan(){
 const u=selected();if(!u||!$('#weeklyPlan'))return;
 renderWeeklyDecisions();
 const plan=weeklyPlan(u);
 $('#planCount').textContent=plan.remaining?`${plan.remaining} thing${plan.remaining===1?'':'s'} worth doing`:'Nothing pending';
 $('#planHeading').textContent=plan.heading;
 $('#weeklyPlan').innerHTML=plan.items.map((x,i)=>
  `<div class="plan-item${x.done?' plan-done':''}" data-plan="${i}" data-tab="${gameEscape(x.tab)}" role="button" tabindex="0">
   <span class="plan-mark">${x.done?'✓':'○'}</span>
   <span class="plan-text"><span class="plan-label">${gameEscape(x.label)}</span><span class="plan-detail">${gameEscape(x.detail)}</span></span>
  </div>`).join('')||'<div class="muted small">Nothing pending.</div>';
 $$('#weeklyPlan [data-plan]').forEach(el=>{
  const go=()=>{const b=$(`.tabs button[data-tab="${el.dataset.tab}"]`);if(b)b.click()};
  el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}};
 });
}
function renderWeeklyHub(){universe.weeklyHub=[...familiarFaceItems(selected()),...(universe.weeklyHub||[]).filter(x=>x.kicker!=='FAMILIAR FACE')].slice(0,9);let hub=universe.weeklyHub||[];$('#hubTitle').textContent=universe.week===0?'Preseason Briefing':`Week ${universe.week} Briefing`;if(!hub.length)buildPreseasonHub();$('#weeklyHub').innerHTML=(universe.weeklyHub||[]).map((x,i)=>`<div class="hub-item ${x.type||''}${x.tab?' hub-link':''}"${x.tab?` data-hub="${i}" data-tab="${x.tab}" role="button" tabindex="0"`:''}><div class="hub-kicker">${x.kicker}</div><div class="hub-main">${x.main}</div><div class="hub-sub">${x.sub||''}</div></div>`).join('');$$('[data-hub]').forEach(el=>{const go=()=>openHubItem((universe.weeklyHub||[])[+el.dataset.hub]);el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}}})}
function openHubItem(x){if(!x?.tab)return;goToTab(x.tab);if(x.gameId){showGameCenter(x.gameId);return}if(x.player&&findPlayer(x.player))showPlayerProfile(x.player);else if(x.recruit&&universe.recruits.find(r=>r.id===x.recruit))showRecruitProfile(x.recruit)}
function statLeaderRows(list,key,fmt=v=>v,n=8){return list.filter(x=>(x.p.stats?.[key]||0)>0).sort((a,b)=>(b.p.stats?.[key]||0)-(a.p.stats?.[key]||0)).slice(0,n).map((x,i)=>`<div class="leader-row"><span>${i+1}</span><span><button class="player-button" data-player="${x.p.id}">${x.p.name}</button><div class="small muted">${x.p.pos} · ${x.t.name}</div></span><span class="leader-val">${fmt(x.p.stats?.[key]||0,x.p.stats)}</span></div>`).join('')||'<span class="muted">No qualifying statistics yet.</span>'}
function renderStats(){const u=selected(),scope=$('#statsScope')?.value||'national',all=scope==='team'?u.roster.map(p=>({p,t:u})):allActivePlayers();$('#passingLeaders').innerHTML=statLeaderRows(all.filter(x=>x.p.pos==='QB'),'passYds');$('#rushingLeaders').innerHTML=statLeaderRows(all.filter(x=>['RB','QB'].includes(x.p.pos)),'rushYds');$('#receivingLeaders').innerHTML=statLeaderRows(all.filter(x=>['WR','TE','RB'].includes(x.p.pos)),'recYds');let def=all.filter(x=>['EDGE','DT','LB','CB','S'].includes(x.p.pos)).sort((a,b)=>((b.p.stats?.sacks||0)*5+(b.p.stats?.intDef||0)*7+(b.p.stats?.tackles||0)*.25)-((a.p.stats?.sacks||0)*5+(a.p.stats?.intDef||0)*7+(a.p.stats?.tackles||0)*.25)).slice(0,8);$('#defensiveLeaders').innerHTML=def.map((x,i)=>`<div class="leader-row"><span>${i+1}</span><span><button class="player-button" data-player="${x.p.id}">${x.p.name}</button><div class="small muted">${x.p.pos} · ${x.t.name}</div></span><span class="leader-val">${x.p.stats.sacks||0} SCK · ${x.p.stats.intDef||0} INT</span></div>`).join('')||'<span class="muted">No defensive statistics yet.</span>';$('#teamStatHeading').textContent=`${u.name} Production`;let rows=u.roster.filter(p=>(p.stats.games||0)>0).sort((a,b)=>seasonScore(b,u)-seasonScore(a,u)).slice(0,25);$('#teamStatTable').innerHTML=rows.map(p=>`<div class="lineitem"><span><button class="player-button" data-player="${p.id}">${p.name}</button> · ${p.pos}</span><span>${statLine(p.stats)}</span></div>`).join('')||'<span class="muted">No games played yet.</span>';attachPlayerLinks()}
function recruitingClassScore(t){let c=universe.recruits.filter(r=>r.committed===t.name);return c.reduce((a,r)=>a+r.scoutUp*(r.stars*.25+.45),0)}
function recruitingClassRank(t){if(classCommitCount(t.name)===0)return null;let ranked=universe.teams.filter(x=>classCommitCount(x.name)>0).sort((a,b)=>recruitingClassScore(b)-recruitingClassScore(a));return ranked.findIndex(x=>x.name===t.name)+1}
function renderRecruitBattles(){const u=selected(),targets=universe.recruits.filter(r=>r.targeted&&!r.committed).sort((a,b)=>b.interest-a.interest).slice(0,6);$('#recruitBattleBoard').innerHTML=targets.map(r=>{let top=recruitTopSchools(r,3);return `<div class="battle-card"><div><button class="player-button" data-recruit="${r.id}">${r.name}</button> · ${r.pos} · #${r.nationalRank} · ${'★'.repeat(r.stars)}</div><div class="small muted">${r.highSchool} · ${r.homeCity}, ${r.homeState} · ${recruitDistance(u,r)} mi · priority: ${r.priority}</div><div class="battle-schools">${top.map((x,i)=>`<span class="battle-school">${i+1}. ${x.t.name}</span>`).join('')}</div></div>`}).join('')||'<span class="muted">Target recruits to create active battles.</span>';attachRecruitLinks();attachRecruitSort()}
function attachRecruitLinks(){$$('[data-recruit]').forEach(b=>b.onclick=()=>showRecruitProfile(b.dataset.recruit))}
function showRecruitProfile(id){let r=universe.recruits.find(x=>x.id===id);if(!r)return;const u=selected(),top=recruitTopSchools(r,5),primary=coachById(r.primaryRecruiterCoachId)?.coach;ensureScoutingIntel(r,u,true);$('#recruitDialogName').textContent=r.name;$('#recruitDialogMeta').textContent=`${r.pos} · ${'★'.repeat(r.stars)} · #${r.nationalRank} national / #${r.positionRank} ${r.pos} / #${r.stateRank} ${r.homeState}`;let reasons=recruitPitchBreakdown(u,r).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,8);$('#recruitDialogBody').innerHTML=`${scoutingPanelHTML(r,u,true)}<div class="profile-grid"><div class="profile-stat"><div class="small muted">Hometown</div><div class="v">${r.homeCity}, ${r.homeState}</div></div><div class="profile-stat"><div class="small muted">High School</div><div class="v">${r.highSchool}</div></div><div class="profile-stat"><div class="small muted">Distance</div><div class="v">${recruitDistance(u,r)} mi</div></div><div class="profile-stat"><div class="small muted">Interest</div><div class="v">${r.interest}%</div></div></div><div class="profile-sections"><section class="profile-section"><h3>Recruiting Race</h3>${top.map((x,i)=>`<div class="lineitem"><span>${i+1}. ${x.t.name}</span><strong>${Math.round(x.score)}</strong></div>`).join('')}</section><section class="profile-section"><h3>Your Pitch</h3>${reasons.map(x=>`<div class="lineitem"><span>${x[0]}</span><strong class="${x[1]>5?'pitch-positive':x[1]<0?'pitch-negative':'pitch-neutral'}">${x[1]>=0?'+':''}${Math.round(x[1])}</strong></div>`).join('')}</section><section class="profile-section profile-section--wide"><h3>Recruitment</h3><div class="lineitem"><span>Distance preference</span><strong>${r.distanceImportance}/100 · comfort about ${r.distanceTolerance} mi</strong></div><div class="lineitem"><span>Primary recruiter</span><strong>${primary?coachEscape(primary.name):'Not established'}</strong></div><div class="lineitem"><span>Current promise</span><strong>${r.promise||'None'}</strong></div>${scoutingHistoryHTML(r)}</section></div>`;$('#recruitDialog').showModal()}

function renderRoster(){const u=selected(),f=$('#positionFilter').value||'ALL';let rows=u.roster.filter(p=>f==='ALL'||p.pos===f).sort((a,b)=>POS.indexOf(a.pos)-POS.indexOf(b.pos)||b.perceived-a.perceived);$('#rosterBody').innerHTML=rows.map(p=>`<tr><td data-label="Player"><div class="player-cell">${portraitTag(p,64,'list')}<div class="player-cell-text"><button class="player-button" data-player="${p.id}">${p.name}</button><div class="small muted">#${p.jerseyNumber??0} · ${p.origin}</div></div></div></td><td data-label="Pos">${p.pos}</td><td data-label="Elig">${eligibilityLabel(p)}</td><td data-label="Redshirt">${p.redshirtUsed?'<span class="pill rs-used">Used</span>':`<button class="rs-button ${p.redshirtActive?'rs-active':''}" data-redshirt="${p.id}" ${canRedshirt(p)?'':'disabled'}>${p.redshirtActive?'Protecting':'Available'}</button>`}</td><td data-label="Ht/Wt">${heightStr(p.height)} / ${p.weight}</td><td data-label="Style"><span class="pill">${p.style}</span></td><td data-label="Current">${scoutRangeText(p,u,false)}</td><td data-label="Upside">${scoutRangeText(p,u,true)}</td><td data-label="Scheme Fit">${grade(playerSchemeFit(p,u))}</td><td data-label="Health" class="${p.injuryWeeks?'health-out':p.health<78?'health-warn':'health-ok'}">${healthText(p)}</td><td data-label="Morale">${p.morale}</td><td data-label="NIL">${nilCellHTML(p,u)}</td><td data-label="Academics" class="${academicallyIneligible(p)?'health-out':academicRisk(p)?'health-warn':'health-ok'}">${academicStatusText(p)}</td></tr>`).join('');$$('[data-redshirt]').forEach(b=>b.onclick=()=>toggleRedshirt(b.dataset.redshirt));$$('[data-nil-player]').forEach(b=>b.onclick=()=>toggleNilPlayer(b.dataset.nilPlayer));attachPlayerLinks()}
function renderDepth(){const u=selected();ensureRoleDepth(u);const off=OFF_SCHEMES[u.offScheme],def=DEF_SCHEMES[u.defScheme];$('#offPackages').innerHTML=`<div class="scheme-badge">${u.offScheme}</div><div class="lineitem"><span>Base pass rate</span><strong>${Math.round(off.pass*100)}%</strong></div><div class="lineitem"><span>Primary skill package</span><strong>${off.pass>.60?'X / Z / Slot':off.pass<.42?'Lead back / TE / Power':'Multiple personnel'}</strong></div><div class="lineitem"><span>Protected redshirts</span><strong>${u.roster.filter(p=>p.redshirtActive).length}</strong></div>`;$('#defPackages').innerHTML=`<div class="scheme-badge">${u.defScheme}</div><div class="lineitem"><span>Pressure</span><strong>${def.pressure}</strong></div><div class="lineitem"><span>Coverage</span><strong>${def.coverage}</strong></div><div class="lineitem"><span>Sub package</span><strong>Nickel / Slot / Rush roles</strong></div>`;$('#depthGrid').innerHTML=ROLE_DEFS.map(role=>{let a=rolePlayers(u,role.id),top=a.slice(0,4),active=roleStarter(u,role.id);return `<div class="depth-card role-card"><div class="role-side">${role.side}</div><div class="strong">${role.label}</div><select data-role="${role.id}">${a.map(p=>`<option value="${p.id}" ${a[0]?.id===p.id?'selected':''}>${p.name} · ${grade(p.perceived)} · ${grade(roleFit(p,u,role,true))}${p.injuryWeeks?' · OUT':p.redshirtActive?' · RS':''}</option>`).join('')}</select><div class="role-note">Role fit uses traits + scheme, not universal OVR.</div><div class="depth-list">${top.map((p,i)=>`<div>${i+1}. <button class="player-button" data-player="${p.id}">${p.name}</button> · ${grade(roleFit(p,u,role,true))} fit ${p===active?'<span class="good">• active</span>':''}${p.injuryWeeks?` · <span class="health-out">${p.injuryWeeks} wk</span>`:p.redshirtActive?' · <span class="warn">RS protected</span>':''}</div>`).join('')}</div></div>`}).join('');$$('[data-role]').forEach(s=>s.onchange=()=>{let id=s.dataset.role,pid=s.value,arr=u.roleDepth[id]||[];u.roleDepth[id]=[pid,...arr.filter(x=>x!==pid)];render()});attachPlayerLinks()}
function renderStaff(){const u=selected();$('#staffList').innerHTML=Object.values(u.staff).map(c=>{ensureCoachCareer(c,u,coachSlot(u,c));return `<div class="coach-card"><div class="strong"><button class="player-button" data-coach="${coachEscape(c.id)}">${coachEscape(c.name)}</button> <span class="pill">${coachEscape(c.role)}</span>${c.interim?' <span class="pill bad">INTERIM</span>':''}</div><div class="compact muted">Age ${c.age} · Year ${c.years+1} · ${c.contractYears??2} yr contract · $${c.salary??1.2}M${c.playCallAuthority?` · ${c.playCallAuthority==='full'?'Full play-calling':'Shared authority'}`:''}</div><div class="compact">Recruit ${grade(c.recruiting)} · Develop ${grade(c.development)} · Evaluate ${grade(c.evaluation)} · Call ${grade(c.playCall)} · Adapt ${grade(c.adaptability)}</div><div class="small muted">${coachEscape((c.specialties||coachSpecialties(c)).join(' · '))} · ${coachEscape(coachTraitText(c))}${c.preferredScheme?` · runs ${coachEscape(c.preferredScheme)}`:''}</div></div>`}).join('');const o=OFF_SCHEMES[u.offScheme],d=DEF_SCHEMES[u.defScheme];const bar=side=>{const tr=schemeTransition(u,side);return tr?`<div class="compact warn">${gameEscape(schemeInstallNote(u,side))}</div><div class="bar"><span style="width:${tr.familiarity}%"></span></div>`:'<div class="small muted">Fully installed.</div>'};
 $('#schemeCard').innerHTML=`<div class="scheme-badge">OFF: ${u.offScheme}</div><div class="compact muted">Pass tendency ${Math.round(o.pass*100)}% · Pace ${o.pace}/100 · Core traits: ${o.traits.join(', ')}</div>${bar('off')}<br><div class="scheme-badge">DEF: ${u.defScheme}</div><div class="compact muted">Pressure ${d.pressure} · Coverage ${d.coverage} · Run control ${d.run} · Core traits: ${d.traits.join(', ')}</div>${bar('def')}`;$('#coachingTree')&&($('#coachingTree').innerHTML=coachingTreeHTML(selected()));$('#schemeFitLeaders').innerHTML=u.roster.slice().sort((a,b)=>playerSchemeFit(b,u)-playerSchemeFit(a,u)).slice(0,10).map(p=>`<div class="lineitem"><span>${p.pos} ${p.name} · ${p.style}</span><strong>${grade(playerSchemeFit(p,u))} (${playerSchemeFit(p,u)})</strong></div>`).join('');renderCoachHistory(u);attachCoachLinks();$('#coachMarket').innerHTML=coachMarketHTML(u);attachCoachMarketLinks()}
function candidateSourceLabel(c){return c.source==='internal'?'Internal promotion':c.source==='external'?`From ${coachEscape(c.fromSchoolName)}`:'Free agent'}
function candidateCardHTML(o,c){const declined=c.status==='DECLINED',draft=candidateOfferDraft&&candidateOfferDraft.candidateId===c.candidateId&&candidateOfferDraft.openingId===o.id?candidateOfferDraft:null;
 return `<div class="coach-card candidate-card${declined?' declined':''}"><div class="strong">${coachEscape(c.name)} <span class="pill">${candidateSourceLabel(c)}</span>${declined?' <span class="pill bad">DECLINED</span>':c.interviewed?' <span class="pill">INTERVIEWED</span>':''}</div>`+
 `<div class="compact muted">Age ${c.age} · Fit ${c.fitScore} · Wants $${c.askSalary}M · ${c.askYears}yr · ${c.wantsAuthority==='full'?'full play-calling':'shared authority'}</div>`+
 `<div class="compact">Recruit ${grade(c.recruiting)} · Develop ${grade(c.development)} · Evaluate ${grade(c.evaluation)} · Call ${grade(c.playCall)} · Adapt ${grade(c.adaptability)}</div>`+
 `<div class="small muted">${coachEscape((c.specialties||[]).join(' · '))}</div>`+
 (()=>{const side=SCHEME_SIDE[o.slot];if(!side||!c.preferredScheme)return '';
  const cur=side==='off'?T(o.schoolName)?.offScheme:T(o.schoolName)?.defScheme;
  return c.preferredScheme===cur?`<div class="small muted">Runs your current ${coachEscape(c.preferredScheme)}.</div>`
   :`<div class="small warn">Runs ${coachEscape(c.preferredScheme)} — hiring him replaces ${coachEscape(cur)} and starts a scheme installation.</div>`})()+
 (declined?`<div class="small muted">${coachEscape(c.declineReason||'Declined the opportunity.')}</div>`:
  draft?`<div class="offer-form"><label>Salary $<input type="number" step="0.1" min="0.4" max="9.9" data-offer-salary value="${draft.salary}"></label><label>Years<input type="number" min="1" max="6" data-offer-years value="${draft.years}"></label><label>Authority<select data-offer-authority><option value="shared"${draft.authority==='shared'?' selected':''}>Shared</option><option value="full"${draft.authority==='full'?' selected':''}>Full play-calling</option></select></label><div class="offer-actions"><button type="button" data-send-offer="${o.id}|${c.candidateId}">Send Offer</button> <button type="button" data-cancel-offer>Cancel</button></div></div>`:
  `<div class="offer-actions"><button type="button" data-interview="${o.id}|${c.candidateId}" ${c.interviewed?'disabled':''}>${c.interviewed?'Interviewed':'Interview'}</button> <button type="button" data-start-offer="${o.id}|${c.candidateId}" ${c.interviewed?'':'disabled'}>Make Offer</button></div>`)+
 '</div>'}
function coachMarketHTML(t){const openings=(universe.openings||[]).filter(o=>o.schoolId===t.id&&o.status==='OPEN');if(!openings.length)return '';const budget=teamStaffBudget(t),spend=teamStaffSpend(t);
 return `<div class="card"><h3>Coaching Search</h3><div class="small muted">Athletic department budget: $${spend.toFixed(1)}M / $${budget.toFixed(1)}M spent</div>`+
 openings.map(o=>{const cands=(universe.candidateMarket?.[o.id]||[]).filter(c=>c.status!=='WITHDRAWN'&&c.status!=='HIRED');return `<h4 style="margin-top:12px">${coachEscape(o.role)} opening${o.reason?` · ${coachEscape(o.reason)}`:''}</h4>`+cands.map(c=>candidateCardHTML(o,c)).join('')}).join('')+'</div>'}
function attachCoachMarketLinks(){
 $$('[data-interview]').forEach(b=>b.onclick=()=>{const [oid,cid]=b.dataset.interview.split('|');interviewCandidate(oid,cid);renderStaff()});
 $$('[data-start-offer]').forEach(b=>b.onclick=()=>{const [oid,cid]=b.dataset.startOffer.split('|'),c=(universe.candidateMarket[oid]||[]).find(x=>x.candidateId===cid);if(!c)return;candidateOfferDraft={openingId:oid,candidateId:cid,salary:c.askSalary,years:c.askYears,authority:c.wantsAuthority};renderStaff()});
 $$('[data-cancel-offer]').forEach(b=>b.onclick=()=>{candidateOfferDraft=null;renderStaff()});
 $$('[data-send-offer]').forEach(b=>b.onclick=()=>{const [oid,cid]=b.dataset.sendOffer.split('|'),card=b.closest('.offer-form'),salary=+card.querySelector('[data-offer-salary]').value,years=+card.querySelector('[data-offer-years]').value,authority=card.querySelector('[data-offer-authority]').value,res=extendOffer(oid,cid,{salary,years,authority});candidateOfferDraft=null;setStatus(res.accepted?'Hired! The new coach is in place.':(res.reason||'Offer declined.'));renderStaff();render()});
}
function renderGameLab(){const u=selected(),g=findUserGame();if(g){const opp=T(g.home===u.name?g.away:g.home),P=profiles(u),O=profiles(opp);$('#nextGameCard').innerHTML=`<strong>Week ${universe.week+1}: ${g.home===u.name?'vs':'@'} ${opp.name}</strong><div class="muted">${u.name}: O ${grade(P.offense)} / D ${grade(P.defense)} · ${opp.name}: O ${grade(O.offense)} / D ${grade(O.defense)}</div>`;$('#keyMatchups').innerHTML=`<div class="lineitem"><span>Your QB vs their coverage</span><strong>${grade(P.qb)} vs ${grade(O.coverage)}</strong></div><div class="lineitem"><span>Your OL vs their front</span><strong>${grade(P.ol)} vs ${grade(O.front)}</strong></div><div class="lineitem"><span>Your scheme fit</span><strong>${grade(P.offFit)}</strong></div><div class="lineitem"><span>Their scheme fit</span><strong>${grade(O.offFit)}</strong></div>`}else $('#nextGameCard').innerHTML='<span class="muted">No unsimulated user game in the current regular-season week.</span>';const d=universe.lastDetailedGame;if(d){$('#detailedBox').innerHTML=`${gameLink(d.gameId)}${d.season?`<div class="small muted">${d.season} · Week ${d.week}</div>`:''}<div class="big">${d.away} ${d.ap} – ${d.hp} ${d.home}</div><div class="lineitem"><span>${d.away} total offense</span><strong>${d.box.away.passYds+d.box.away.rushYds}</strong></div><div class="lineitem"><span>${d.home} total offense</span><strong>${d.box.home.passYds+d.box.home.rushYds}</strong></div><div class="lineitem"><span>Turnovers</span><strong>${d.box.away.turnovers} – ${d.box.home.turnovers}</strong></div>`;$('#detailedLog').innerHTML=d.log.slice().reverse().map(x=>`<div class="playline">${x}</div>`).join('')}else{$('#detailedBox').textContent='No detailed game simulated yet.';$('#detailedLog').textContent='No detailed game simulated yet.'}}
function renderSeason(){const u=selected();$('#seasonPhase').textContent=`${universe.year} · ${universe.phase} · Week ${universe.week}`;$('#confStandings').innerHTML=confStand(u.conference).map((t,i)=>`<div class="rankrow ${t.name===u.name?'strong':''}"><div>${i+1}. ${t.name}</div><div>${t.cw}-${t.cl} · ${t.w}-${t.l}</div></div>`).join('');$('#latestResults').innerHTML=universe.latest.length?universe.latest.slice(-12).reverse().map(r=>`<div class="resultrow ${r.label?'champ':''}"><div>${r.label?`<span class="small muted">${r.label}</span><br>`:''}${r.away}</div><div><strong>${r.ap}</strong> – <strong>${r.hp}</strong> ${r.home} ${gameLink(r.gameId)}</div></div>`).join(''):'<div class="muted">No results yet.</div>';$('#teamSchedule').innerHTML=u.schedule.map(g=>{let opp=g.home===u.name?g.away:g.home,loc=g.home===u.name?'vs':'@',score=g.played?`${g.score[0]}-${g.score[1]}`:'—';return `<div class="resultrow"><div>Wk ${g.week} · ${loc} ${opp}${g.detailed?' <span class="pill">Detailed</span>':''}</div><div>${g.played?gameLink(g.gameId,`${g.winner===u.name?'W':'L'} ${g.home===u.name?g.score[1]:g.score[0]}–${g.home===u.name?g.score[0]:g.score[1]}`):score}</div></div>`}).join('')}
// v0.9.12: the recruiting board is long, so its headers sort it. Ascending on
// first click, descending on the second, and the whole pool is ordered before
// the visible slice is taken so sorting surfaces the real leaders.
let recruitSort={key:'rank',dir:1};
const RECRUIT_SORTS={
 name:r=>String(r.name||'').toLowerCase(),
 pos:r=>POS.indexOf(r.pos),
 rank:r=>r.nationalRank??9999,
 stars:r=>r.stars||0,
 home:r=>`${r.homeState||''} ${r.homeCity||''}`.toLowerCase(),
 miles:r=>recruitDistance(selected(),r),
 priority:r=>String(r.priority||'').toLowerCase(),
 scout:r=>r.scoutUp||0,
 interest:r=>r.interest||0,
 trend:r=>r.trend||0,
 leader:r=>String(r.leader||'~').toLowerCase(),
};
// Columns where the interesting end is the top: start them descending so the
// first click shows the best, and the arrow still tells the truth.
const RECRUIT_DESC=new Set(['stars','scout','interest','trend']);
function sortRecruits(list){
 const pick=RECRUIT_SORTS[recruitSort.key]||RECRUIT_SORTS.rank;
 return list.slice().sort((a,b)=>{
  const x=pick(a),y=pick(b);
  const cmp=typeof x==='string'?x.localeCompare(y):(x-y);
  // Ties always fall back to national rank, never reversed.
  return (cmp*recruitSort.dir)||((a.nationalRank??9999)-(b.nationalRank??9999));
 });
}
function attachRecruitSort(){
 $$('#recruiting th.sortable').forEach(th=>{
  const key=th.dataset.sort,active=recruitSort.key===key;
  th.setAttribute('aria-sort',active?(recruitSort.dir>0?'ascending':'descending'):'none');
  th.classList.toggle('sorted',active);
  th.dataset.dir=active?(recruitSort.dir>0?'asc':'desc'):'';
  th.onclick=()=>{
   recruitSort=recruitSort.key===key?{key,dir:-recruitSort.dir}:{key,dir:RECRUIT_DESC.has(key)?-1:1};
   renderRecruiting();
  };
 });
}
function renderRecruiting(){renderSigningDay();const u=selected(),rank=recruitingClassRank(u);const sch=scholarshipSummary(u);
 $('#classSummary').innerHTML=`<strong>${rank?'#'+rank:'Unranked'} recruiting class</strong> · <strong class="${sch.over?'bad':sch.room?'':'warn'}">${sch.committed}/${sch.capacity} scholarships</strong> ${sch.over?`· <span class="bad">${sch.over} over the limit — offers will be pulled on signing day</span>`:`· ${sch.room} spot${sch.room===1?'':'s'} left`} · ${u.commits.length} commitments · ${universe.recruits.filter(r=>r.targeted&&!r.committed).length} active targets · ${universe.recruits.filter(r=>r.committed===u.name&&r.stars>=4).length} blue chips · Best pipeline: ${Object.entries(u.pipelines||{}).sort((a,b)=>b[1]-a[1])[0]?.[0]||u.conference}`;$('#classSummary').innerHTML+='<div class="small muted">Promises are assessed when the player’s first offseason is finalized. Early Role: 8 appearances, adjusted for injury. Development Plan: Technique in both camps. NIL Priority is recorded only.</div>';renderRecruitBattles();$('#recruitBody').innerHTML=sortRecruits(universe.recruits).slice(0,220).map(r=>{let tr=r.trend||0,trend=tr>0?`<span class="trend-up">↑ ${tr}</span>`:tr<0?`<span class="trend-down">↓ ${Math.abs(tr)}</span>`:'<span class="trend-flat">—</span>';return `<tr class="${r.targeted?'target':''}"><td data-label="Player"><div class="player-cell">${portraitTag(r,64,'list','recruit')}<div class="player-cell-text"><button class="player-button" data-recruit="${r.id}">${r.name}</button><div class="small muted">${r.style}</div></div></div></td><td data-label="Pos">${r.pos}</td><td data-label="Rank">#${r.nationalRank}<div class="small muted">#${r.positionRank} ${r.pos}</div></td><td data-label="Stars"><span class="stars">${'★'.repeat(r.stars)}</span></td><td data-label="Hometown / HS">${r.homeCity}, ${r.homeState}<div class="small muted">${r.highSchool}</div></td><td data-label="Miles">${recruitDistance(u,r)}</td><td data-label="Priority">${r.priority}</td><td data-label="Scout">${grade(r.scout)} / ${grade(r.scoutUp)}</td><td data-label="Interest">${r.committed?(r.committed===u.name?(r.challenger?`<span class="pill pill--wavering">WAVERING</span>`:'<span class="pill pill--commit">COMMITTED</span>'):`<span class="muted">Committed</span><div class="small muted">${r.committed}</div>`):`<strong class="interest-val">${r.interest}%</strong>`}</td><td data-label="Trend">${trend}</td><td data-label="Leader">${r.leader||'—'}</td><td data-label="Visit">${r.committed===u.name?'—':`<button data-visit="${r.id}">${r.visitWeek?'Wk '+r.visitWeek:'Schedule'}</button>`}</td><td data-label="Promise">${r.committed?(r.committed===u.name?(r.signedPromise?promiseLabel(r.signedPromise.type):'None'):'—'):`<select data-promise="${r.id}">${PROMISES.map(x=>`<option ${x===(r.promiseOffer?.schoolId===u.id?r.promise:'None')?'selected':''}>${x}</option>`).join('')}</select>`}</td><td data-label="Target">${r.committed===u.name?`<button class="pull-offer" data-pull="${r.id}">Pull offer</button>`:`<button data-target="${r.id}">${r.targeted?'Remove':'Target'}</button>`}</td></tr>`}).join('');$$('[data-target]').forEach(b=>b.onclick=()=>{let r=universe.recruits.find(x=>x.id===b.dataset.target);r.targeted=!r.targeted;if(r.targeted)firstRecruitEvaluation(r,u);renderRecruiting()});$$('[data-visit]').forEach(b=>b.onclick=()=>{let r=universe.recruits.find(x=>x.id===b.dataset.visit);scheduleVisit(r);renderRecruiting()});
 $$('[data-pull]').forEach(b=>b.onclick=()=>{const r=universe.recruits.find(x=>x.id===b.dataset.pull);if(!r)return;
  if(!confirm(`Pull the offer to ${r.name}?\n\nHe reopens his recruitment, will not consider ${u.name} again, and the ${r.homeRegion||'local'} pipeline takes a hit.`))return;
  if(pullOffer(r,u.name,'Pulled by the staff')){setStatus(`Offer pulled: ${r.name} is no longer committed.`);render()}});$$('[data-promise]').forEach(s=>s.onchange=()=>{let r=universe.recruits.find(x=>x.id===s.dataset.promise);setRecruitPromise(r,s.value,u)});attachRecruitLinks()}
function renderProgram(){const u=selected();$('#editName').value=u.name;$('#editConference').value=u.conference;$('#editPrestige').value=u.prestige;$('#editResources').value=u.resources;$('#editNil').value=u.nil;$('#editDevelopment').value=u.development;$('#editFacilities').value=u.facilities;$('#editAcademics').value=u.academics;$('#careerHistory')&&($('#careerHistory').innerHTML=careerHistoryHTML());renderCareerPost();$('#programHistory')&&($('#programHistory').innerHTML=programHistoryHTML(selected()));$('#programDNA').innerHTML=[['Prestige',u.prestige],['Resources',u.resources],['NIL',u.nil],['Development',u.development],['Facilities',u.facilities],['Academics',u.academics],['Fan Support',u.fan_support],['Admin Patience',u.admin_patience],['Program Ceiling',u.program_ceiling],['Rivalry',u.rivalry?(rivalOf(u)?.name||'—'):'—'],['Trophy',u.rivalry?.trophy||'—'],['All-time series',rivalrySeriesText(u)||'—'],['Season expectation',seasonExpectation(u)+' wins'],['Admin confidence',(u.adminConfidence??'—')+' · '+adminConfidenceLabel(u.adminConfidence??50)],['Mandate',u.mandate?u.mandate.text:'None'],['NIL budget',nilSummaryText(u)],['Career',careerSummaryText()]].map(x=>`<div class="lineitem"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join('')}
function applyProgramEdit(){const u=selected(),old=u.name,newName=$('#editName').value.trim()||old;if(newName!==old&&T(newName)){alert('A program already uses that name.');return}u.name=newName;for(const [id,key] of [['editPrestige','prestige'],['editResources','resources'],['editNil','nil'],['editDevelopment','development'],['editFacilities','facilities'],['editAcademics','academics']])u[key]=clamp(parseInt($('#'+id).value||u[key],10),1,100);if(newName!==old){universe.schedule.flat().forEach(g=>{if(g.home===old)g.home=newName;if(g.away===old)g.away=newName});universe.teams.forEach(t=>t.schedule.forEach(g=>{if(g.home===old)g.home=newName;if(g.away===old)g.away=newName}));universe.recruits.forEach(r=>{if(r.leader===old)r.leader=newName;if(r.committed===old)r.committed=newName});let opt=[...$('#userTeam').options].find(o=>o.value===old);if(opt){opt.value=newName;opt.textContent=newName}$('#userTeam').value=newName}ranked();render();setStatus('Program changes applied. Conference schedule will fully rebalance next season.')}
function renderDevelopment(){const u=selected(),ds=ensureDevelopmentState();ensureTeamDevelopment(u);for(const p of u.roster)ensurePlayerDevelopment(p,u);let focus=$('#teamTrainingFocus');if(focus){if(!focus.options.length)Object.keys(TEAM_TRAINING).forEach(x=>focus.add(new Option(x,x)));focus.value=u.trainingFocus;$('#trainingImpact').textContent=TEAM_TRAINING[u.trainingFocus]?.desc||''}let complete=universe.phase==='complete';$('#runSpringCamp').disabled=!complete||ds.springRun;$('#runFallCamp').disabled=!complete||!ds.springRun||ds.fallRun;$('#applyCampWinners').disabled=!ds.battles?.length;$('#campPhaseCard').innerHTML=complete?`<strong>${universe.year} offseason</strong><div class="compact muted">Spring development: ${ds.springRun?'complete':'not run'} · Fall camp: ${ds.fallRun?'complete':'not run'}</div>`:`<strong>In season</strong><div class="compact muted">Development planning is visible now; camp actions unlock after the national championship.</div>`;let avgConf=Math.round(avg(u.roster.map(p=>{ensurePlayerDevelopment(p,u);return p.scoutConfidence}))),transition=u.roster.filter(p=>familiarity(p,p.pos)<80).length,young=u.roster.filter(p=>eligibilityBase(p)<=1).length;$('#developmentSummary').innerHTML=`<div class="lineitem"><span>Average scouting confidence</span><strong>${avgConf}%</strong></div><div class="lineitem"><span>Freshmen / sophomores</span><strong>${young}</strong></div><div class="lineitem"><span>Position-transition projects</span><strong>${transition}</strong></div><div class="lineitem"><span>Program development</span><strong>${grade(u.development)}</strong></div>`;
 let players=u.roster.slice().sort((a,b)=>eligibilityBase(a)-eligibilityBase(b)||b.perceivedUpside-a.perceivedUpside);$('#trainingBody').innerHTML=players.map(p=>`<tr><td data-label="Player"><button class="player-button" data-player="${p.id}">${p.name}</button><div class="small muted">${p.pos}${familiarity(p,p.pos)<80?` · <span class="transition-tag">${familiarity(p,p.pos)}% familiar</span>`:''}</div></td><td data-label="Elig">${eligibilityLabel(p)}</td><td data-label="Current Read">${scoutRangeText(p,u,false)}<div class="small muted">${confidenceText(p)}</div></td><td data-label="Potential Read">${scoutRangeText(p,u,true)}</td><td data-label="Body">${heightStr(p.height)} / ${p.weight}<div class="small muted">${p.lastPhysicalChange||'—'}</div></td><td data-label="Focus"><select class="training-focus" data-training="${p.id}">${INDIVIDUAL_TRAINING.map(x=>`<option ${x===p.trainingFocus?'selected':''}>${x}</option>`).join('')}</select></td><td class="staff-note" data-label="Staff Note">${devStaffNote(p,u)}</td></tr>`).join('');$$('[data-training]').forEach(s=>s.onchange=()=>{let p=u.roster.find(x=>x.id===s.dataset.training);if(p)p.trainingFocus=s.value});attachPlayerLinks();
 let pc=$('#positionChangePlayer'),old=pc.value;pc.innerHTML=u.roster.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(p=>`<option value="${p.id}">${p.pos} ${p.name}</option>`).join('');if(u.roster.some(p=>p.id===old))pc.value=old;renderPositionChangeOptions();let rep=ds.fallRun?ds.fallReport:ds.springReport;$('#campReport').innerHTML=rep?.length?rep.slice(0,7).map(x=>`<div class="lineitem"><span><button class="player-button" data-player="${x.id}">${x.pos} ${x.name}</button>${x.grade?` · ${x.grade} camp`:''}</span><strong class="${x.delta>1?'dev-rise':x.delta<0?'dev-fall':'dev-flat'}">${x.delta>0?'+':''}${x.delta}${x.physical?` · ${x.physical}`:''}</strong></div>`).join(''):'<span class="muted">No camp results yet.</span>';$('#campBattles').innerHTML=ds.battles?.length?ds.battles.map(b=>`<div class="camp-battle"><div class="battle-head"><strong>${b.label}</strong><span class="small muted">gap ${b.gap}</span></div><div class="battle-candidates">${b.candidates.slice(0,3).map((c,i)=>`<div class="battle-candidate"><span>${i+1}. <button class="player-button" data-player="${c.id}">${c.name}</button>${c.id===b.recommended?' <span class="staff-rec">• staff pick</span>':''}</span><strong>${c.score}</strong></div>`).join('')}</div></div>`).join(''):'<span class="muted">Fall camp will identify the closest competitions.</span>';attachPlayerLinks()}
function renderPositionChangeOptions(){let u=selected(),p=u.roster.find(x=>x.id===$('#positionChangePlayer').value),target=$('#positionChangeTarget');if(!p||!target)return;let opts=positionOptions(p);target.innerHTML=opts.map(x=>`<option value="${x}">${x}</option>`).join('');let to=target.value;if(!to){$('#positionChangePreview').textContent='No realistic transition available.';$('#applyPositionChange').disabled=true;return}const will=positionChangeWillingness(p,u,to);
 $('#applyPositionChange').disabled=universe.phase!=='complete'||will.state==='REFUSES';
 $('#positionChangePreview').innerHTML=`Projected transition fit: <strong>${positionTransitionFit(p,to)}/100</strong>. Current ${p.pos} familiarity: ${familiarity(p,p.pos)}%. Moving to ${to} starts with a learning penalty that camp can reduce.<br><span class="pill${will.state==='REFUSES'?' bad':''}">${positionWillingnessLabel(will.state)}</span> <span class="small muted">${gameEscape(will.reasons.slice(0,2).join('; ')||'no strong feelings either way')}${will.state==='RELUCTANT'?' — forcing it will cost morale and staff trust.':will.state==='REFUSES'?' — he will not agree to this move.':''}</span>`}
function renderOffseason(){const u=selected(),risks=u.roster.map(p=>({p,risk:transferRisk(p)})).sort((a,b)=>b.risk-a.risk).slice(0,8);$('#transferWatch').innerHTML=risks.map(x=>`<div class="lineitem"><span>${x.p.pos} ${x.p.name}</span><span class="${x.risk>45?'bad':x.risk>25?'warn':''}">${Math.round(x.risk)} risk</span></div>`).join('');const dev=u.roster.slice().sort((a,b)=>(b.dev+b.work)-(a.dev+a.work)).slice(0,8);$('#developmentWatch').innerHTML=dev.map(p=>`<div class="lineitem"><span>${p.pos} ${p.name}</span><span>${p.year} · ${p.style}</span></div>`).join('');let ds=ensureDevelopmentState();$('#offseasonReport').textContent=universe.phase==='complete'?(ds.fallRun?`Fall camp is complete. Finalize the offseason to advance to ${universe.year+1}.`:`Complete spring development and fall camp before advancing.`):'Complete the season first.';$('#movementLog').innerHTML=universe.movementLog.length?universe.movementLog.map(x=>`<div class="lineitem"><span>${x}</span></div>`).join(''):'<span class="muted">No offseason movement yet.</span>';for(const x of universe.transferPortal||[])if(x.fromSchoolId===u.id)$('#movementLog').innerHTML+=`<div class="lineitem"><button class="player-button" data-player="${x.p.id}">${x.p.name}</button><span>In portal — awaiting a roster opening</span></div>`;attachPlayerLinks()}

function findPlayer(id){const pending=(universe.transferPortal||[]).find(x=>x.p.id===id);if(pending)return {p:pending.p,team:null,active:false,portal:true};if(!IDX.players)rebuildIndexes();let h=IDX.players.get(id);if(h&&universe.teams[h.i]===h.t&&h.t.roster.includes(h.p))return {p:h.p,team:h.t,active:true};if(IDX.pop!==rosterPopulation()||(h&&!IDX.archive.has(id))){rebuildIndexes();h=IDX.players.get(id);if(h)return {p:h.p,team:h.t,active:true}}indexArchive();let p=IDX.archive.get(id);if(p)return {p,team:p.lastTeam?{name:p.lastTeam}:null,active:false};if(IDX.miss!==id){IDX.miss=id;rebuildIndexes();h=IDX.players.get(id);if(h)return {p:h.p,team:h.t,active:true}}return null}
function statLine(s){if(!s)return 'No recorded statistics.';let a=[];if(s.passAtt||s.passYds){let pct=s.passAtt?Math.round((s.passComp||0)/s.passAtt*1000)/10:0;a.push(`${s.passComp||0}/${s.passAtt||0} (${pct}%) · ${s.passYds||0} pass yds · ${s.passTD||0} TD · ${s.int||0} INT`)}if(s.rushAtt||s.rushYds)a.push(`${s.rushAtt||0} car · ${s.rushYds||0} rush yds · ${s.rushTD||0} TD`);if(s.targets||s.recYds)a.push(`${s.receptions||0}/${s.targets||0} rec · ${s.recYds||0} yds · ${s.recTD||0} TD`);if(s.tackles||s.sacks||s.intDef)a.push(`${s.tackles||0} tackles · ${s.tfl||0} TFL · ${s.sacks||0} sacks · ${s.pressures||0} pressures · ${s.intDef||0} INT`);if(s.snaps&&!(s.passYds||s.rushYds||s.recYds||s.tackles))a.push(`${s.snaps} snaps · ${s.sacksAllowed||0} sacks allowed · ${s.pressuresAllowed||0} pressures allowed`);return a.join(' · ')||`${s.games||0} games`}
function showPlayerProfile(id){let f=findPlayer(id);if(!f&&archiveIsDeferred()){const current=universe;return ensureArchiveLoaded().then(()=>{if(universe===current)showPlayerProfile(id)}).catch(e=>{if(universe===current)setStatus(e.message)})}if(!f)return;const p=f.p,t=f.team;{const ph=$('#playerDialogPortrait');if(ph){ph.innerHTML=portraitTag(p,192,'profile');}}
 $('#playerDialogName').textContent=p.name;$('#playerDialogMeta').textContent=`${p.pos} · ${eligibilityLabel(p)} · ${heightStr(p.height)} / ${p.weight} · ${p.style}${t?` · ${t.name}`:''}`;$('#playerDialogKicker').textContent=f.portal?'TRANSFER PORTAL':f.active?'ACTIVE PLAYER':'PLAYER ARCHIVE';if(f.active&&t)ensurePlayerDevelopment(p,t);let attrs=[['Current',f.active&&t?scoutRangeText(p,t,false):grade(p.perceived)],['Upside',f.active&&t?scoutRangeText(p,t,true):grade(p.perceivedUpside)],['Scout Confidence',f.active?`${Math.round(p.scoutConfidence||50)}%`:'Final'],['Health',p.health??100]];let injury=(p.injuryWeeks||0)>0?`<div class="injury-note"><strong>${p.injury}</strong> · expected ${p.injuryWeeks} more week${p.injuryWeeks===1?'':'s'}.</div>`:'';let hist=careerChronologyHTML(p),aw=(p.awards||[]).slice().reverse().map(a=>`<div class="lineitem"><span>${a.year}</span><strong>${a.name}</strong></div>`).join('')||'<div class="muted">No major awards.</div>',draft=p.draftResult?`<div class="lineitem"><span>${p.draftResult.year} Draft</span><strong>${p.draftResult.label}</strong></div>`:'';$('#playerDialogBody').innerHTML=`${injury}${f.active&&t?scoutingPanelHTML(p,t):''}<div class="profile-grid">${attrs.map(x=>`<div class="profile-stat"><div class="small muted">${x[0]}</div><div class="v">${x[1]}</div></div>`).join('')}</div><div class="profile-sections"><section class="profile-section"><h3>Season</h3><div class="profile-callout"><span class="eyebrow">Production</span><strong>${statLine(p.stats)}</strong></div><div class="lineitem"><span>Eligibility</span><strong>${eligibilityLabel(p)}</strong></div><div class="lineitem"><span>Redshirt</span><strong>${p.redshirtUsed?`Used${p.redshirtSeason?' in '+p.redshirtSeason:''}`:p.redshirtActive?'Protected this year':'Available'}</strong></div><div class="lineitem"><span>Origin</span><strong>${p.origin||'—'}</strong></div></section><section class="profile-section"><h3>Development</h3><div class="lineitem"><span>Training focus</span><strong>${p.trainingFocus||'Balanced'}</strong></div><div class="lineitem"><span>Position familiarity</span><strong>${familiarity(p,p.pos)}%</strong></div><div class="lineitem"><span>Wear</span><strong>${p.wear||0}/100</strong></div><div class="profile-note">${f.active&&t?devStaffNote(p,t):'Career complete'}</div></section><section class="profile-section"><h3>Health</h3><div class="lineitem"><span>Status</span><strong>${f.active?healthText(p):(f.portal?'Awaiting a destination':p.exitReason||'Career complete')}</strong></div><div class="lineitem"><span>Injuries recorded</span><strong>${p.injuryHistory?.length||0}</strong></div><div class="lineitem"><span>Promise</span><strong>${p.promise||'None'}</strong></div></section><section class="profile-section"><h3>Career</h3><div class="lineitem"><span>Career production</span><strong>${statLine(p.career)}</strong></div>${draft}<div class="profile-subhead">Honors</div>${aw}</section></div>${scoutingHistoryHTML(p)}${promiseHTML(p)}${transferHistoryHTML(p)}<section class="profile-section profile-section--wide"><h3>Career Chronology</h3><div class="timeline">${hist}</div></section>`;let d=$('#playerDialog');if(d.showModal)d.showModal();else d.setAttribute('open','');paintPortraits(d)}
function renderArchiveSearch(){const q=($('#archiveSearch').value||'').trim().toLowerCase();if(q.length>=2&&archiveIsDeferred()){const current=universe;$('#archiveResults').textContent='Loading archived careers…';return ensureArchiveLoaded().then(()=>{if(universe===current)renderArchiveSearch()}).catch(e=>{if(universe===current)$('#archiveResults').textContent=e.message})}if(q.length<2){$('#archiveResults').innerHTML='<span class="muted">Type at least 2 letters.</span>';return}let results=[];for(const x of universe.transferPortal||[])if(x.p.name.toLowerCase().includes(q))results.push({p:x.p,team:'Transfer portal',status:'Awaiting a destination'});for(const t of universe.teams)for(const p of t.roster)if(p.name.toLowerCase().includes(q))results.push({p,team:t.name,status:'Active'});for(const p of universe.playerArchive||[])if(p.name.toLowerCase().includes(q))results.push({p,team:p.lastTeam||'—',status:p.exitReason||'Archived'});$('#archiveResults').innerHTML=results.slice(0,30).map(x=>`<div class="lineitem"><span><button class="player-button" data-player="${x.p.id}">${x.p.name}</button> · ${x.p.pos}</span><span>${x.team} · ${x.status}</span></div>`).join('')||'<span class="muted">No players found.</span>';attachPlayerLinks()}

function renderRecords(){const u=selected(),final=universe.awards?.[universe.year],aw=final||projectedAwards();$('#awardsHeading').textContent=final?`${universe.year} Award Winners`:`${universe.year} Awards Watch`;$('#awardsBoard').innerHTML=aw.map(a=>`<div class="award-card"><div class="small muted">${a.name}</div><div><strong>${a.playerName}</strong> · ${a.team}${a.pos?` · ${a.pos}`:''}</div></div>`).join('')||'<span class="muted">No award data yet.</span>';let years=Object.keys(universe.draftHistory||{}).sort((a,b)=>b-a),draft=years.length?(universe.draftHistory[years[0]]||[]).filter(d=>d.status!=='College Career Complete'):[];$('#draftBoard').innerHTML=draft?.length?draft.slice().sort((a,b)=>(a.round||99)-(b.round||99)||(a.pick||99)-(b.pick||99)).slice(0,18).map(d=>`<div class="lineitem"><span><span class="draft-round">${d.round?'R'+d.round:'UDFA'}</span> ${d.playerName} · ${d.pos}</span><span>${d.school}</span></div>`).join(''):'<span class="muted">Draft results appear after the first offseason.</span>';let ns=universe.records?.nationalSeason||{},nc=universe.records?.nationalCareer||{};$('#nationalRecords').innerHTML=`<div class="record-group"><h4>Single Season</h4>${Object.entries(RECORD_CATS).map(([k,label])=>{let r=ns[k];return `<div class="lineitem"><span>${label}</span><span class="record-value">${r?`${r.value} · ${r.playerName} (${r.team}, ${r.year})`:'—'}</span></div>`}).join('')}</div><div class="record-group"><h4>Career</h4>${Object.entries(RECORD_CATS).map(([k,label])=>{let r=nc[k];return `<div class="lineitem"><span>${label}</span><span class="record-value">${r?`${r.value} · ${r.playerName} (${r.team})`:'—'}</span></div>`}).join('')}</div>`;$('#schoolRecordsHeading').textContent=`${u.name} Record Book`;$('#schoolRecords').innerHTML=Object.entries(RECORD_CATS).map(([k,label])=>{let r=u.records?.[k];return `<div class="lineitem"><span>${label}</span><span class="record-value">${r?`${r.value} · ${r.playerName} (${r.year})`:'—'}</span></div>`}).join('')}
function renderHistory(){renderGameArchive();let items=[];for(const h of universe.history){if(h.type==='season'){let np=h.awards?.find(a=>a.name==='National Player of the Year');items.push(`<div class="card"><div class="historyrow champ"><span>${h.year} National Champion</span><strong>${h.champion}</strong></div>${np?`<div class="historyrow"><span>National Player of the Year</span><span>${np.playerName} · ${np.team}</span></div>`:''}${h.top10.slice(0,5).map((t,i)=>`<div class="historyrow"><span>#${i+1} ${t.name}</span><span>${t.record}</span></div>`).join('')}</div>`)}else items.push(`<div class="historyrow"><span>${h.year} ${h.event||''}</span><span>${h.detail||''}</span></div>`)}$('#historyLog').innerHTML=items.join('')||'<div class="card muted">No completed seasons yet.</div>'}
function packPlayer(p){return {...p,stats:packStats(p.stats),career:packStats(p.career)}}
function packUniverse(u,includeArchive=true){if(includeArchive&&u===universe&&archiveIsDeferred())throw new Error("Load archived careers before exporting.");const {playerArchive,...core}=u;const out={...core,teams:u.teams.map(t=>({...t,roster:t.roster.map(packPlayer)}))};if(includeArchive)out.playerArchive=(playerArchive||[]).map(packPlayer);return out}
function normalizeUniverse(){universe.gameArchive??=[];universe.gameArchiveVersion??=1;universe.gameCounter=universe.gameArchive.reduce((n,g)=>Math.max(n,Number(g.id.split('_').pop())||0),universe.gameCounter||0);universe.version=APP_VERSION;IDX.teams=null;IDX.players=null;universe.movementLog??=[];universe.lastDetailedGame??=null;universe.playerArchive??=[];universe.recoveredWeek??=-1;universe.weeklyHub??=[];universe.highSchools??=generateHighSchools();universe.awards??={};universe.records??={nationalSeason:{},nationalCareer:{}};universe.records.nationalSeason??={};universe.records.nationalCareer??={};universe.draftHistory??={};universe.recruitClassCounts??={};universe.campHistory??={};universe.developmentState??={year:universe.year,springRun:false,fallRun:false,springReport:[],fallReport:[],battles:[]};if(!Object.keys(universe.recruitClassCounts).length)for(const r of universe.recruits||[])if(r.committed)universe.recruitClassCounts[r.committed]=(universe.recruitClassCounts[r.committed]||0)+1;universe.teams.forEach(t=>{let base=schools.find(s=>s.name===t.name);if(base){t.city??=base.city;t.state??=base.state;t.lat??=base.lat;t.lon??=base.lon}t.staff??=generateStaff(t);for(const c of Object.values(t.staff)){c.contractYears??=gi(1,4);c.salary??=1.2}t.offScheme??=pick(Object.keys(OFF_SCHEMES));t.defScheme??=pick(Object.keys(DEF_SCHEMES));t.nickname??='';t.commits??=[];t.pipelines??=makePipelines(t);t.records??={};ensureSchoolColors(t);ensureTeamDevelopment(t);t.roster.forEach(p=>{p.speed??=clamp(p.trueNow+gi(-8,8),25,99);p.power??=clamp(p.trueNow+gi(-8,8),25,99);p.technique??=clamp(p.trueNow+gi(-8,8),25,99);p.iq??=clamp(p.trueNow+gi(-10,10),20,99);p.composure??=65;p.durability??=70;p.versatility??=60;p.health??=100;p.wear??=0;p.injury??=null;p.injuryWeeks??=0;p.injuryHistory??=[];p.seasonHistory??=[];p.awards??=[];p.draftResult??=null;p.promise??=null;p.promiseBaseline??=p.perceived;p.eligibilityUsed??=({FR:0,SO:1,JR:2,SR:3}[p.year]??0);p.redshirtUsed??=false;p.redshirtActive??=false;p.redshirtSeason??=null;p.stats={...newStats(),...(p.stats||{})};p.career={...newStats(),...(p.career||{})};p.year=CLASS_NAMES[Math.min(3,eligibilityBase(p))]||'SR';ensurePlayerDevelopment(p,t)});ensureDepth(t);ensureRoleDepth(t)});universe.playerArchive.forEach(p=>{p.awards??=[];p.seasonHistory??=[];p.coachRelationships??={};p.primaryRecruiterCoachId??=p.recruitingMemory?.primaryRecruiterCoachId||p.recruitingMemory?.recruiterCoachId||null;p.career={...newStats(),...(p.career||{})};p.stats={...newStats(),...(p.stats||{})};p.eligibilityUsed??=3;p.redshirtUsed??=false;p.redshirtActive=false});if(Array.isArray(universe.schedule)){universe.teams.forEach(t=>t.schedule=[]);universe.schedule.flat().forEach(g=>{T(g.home)?.schedule.push(g);T(g.away)?.schedule.push(g)})}
 universe.weeklyDecisions??=[];if(!universe.teams.some(t=>t.rivalry))deriveRivalries();universe.careerHistory??=[];universe.jobOffers??=[];universe.bowls??=[];universe.signingDay??=null;for(const t of universe.teams){t.fanBaseline??=t.fan_support??60;for(const p of t.roster)ensureAcademics(p,t)}for(const t of universe.teams){ensureAdminState(t);ensureNilState(t)}for(const d of universe.weeklyDecisions)d.source??='STAFF';normalizePromiseState();for(const r of universe.recruits||[])normalizeRecruitGeography(r,universe.highSchools);assignRecruitRanks(universe.recruits||[]);if(!universe.weeklyHub.length)buildPreseasonHub();rebuildIndexes()}
function setStatus(x){if($('#saveStatus'))$('#saveStatus').textContent=x}
// Browser persistence state is deliberately outside the portable universe.
let browserArchive = null;
let storageBusy = false;
let titleBrowserSave = null;
const browserStore = DynastyStorage.create();
function currentArchiveState(){return browserArchive?.universe===universe?browserArchive:null}
function archiveIsDeferred(){const s=currentArchiveState();return !!s&&!s.loaded}
// v0.9.12: permanent box scores live in their own append-only chunks. They are
// immutable once written, so an ordinary save appends only the week just played
// instead of rewriting every season of history.
function gamesAreDeferred(){const s=currentArchiveState();return !!s&&!s.gamesLoaded}
async function ensureGamesLoaded(){
  const state=currentArchiveState();
  if(!state||state.gamesLoaded)return;
  if(!state.gamesLoading)state.gamesLoading=browserStore.readGames(state.gameRef).then(rows=>{
    if(currentArchiveState()!==state)return;
    const seen=new Set((universe.gameArchive||[]).map(g=>g.id));
    universe.gameArchive=rows.filter(g=>!seen.has(g.id)).concat(universe.gameArchive||[]);
    state.gamesLoaded=true;
  }).finally(()=>{state.gamesLoading=null});
  await state.gamesLoading;
}
function normalizeArchive(rows){for(const p of rows){p.awards??=[];p.seasonHistory??=[];p.career={...newStats(),...(p.career||{})};p.stats={...newStats(),...(p.stats||{})};p.eligibilityUsed??=3;p.redshirtUsed??=false;p.redshirtActive=false}return rows}
async function ensureArchiveLoaded(){
  const state=currentArchiveState();
  if(!state||state.loaded)return;
  if(!state.loading)state.loading=browserStore.readArchive(state.archiveRef).then(rows=>{
    // An import/new universe may have replaced the active game during a read.
    if(currentArchiveState()!==state)return;
    universe.playerArchive=normalizeArchive(rows).concat(universe.playerArchive||[]);
    state.loaded=true;rebuildIndexes();
  }).finally(()=>{state.loading=null});
  await state.loading;
}
async function storageOperation(action){
  if(storageBusy)return;
  storageBusy=true;
  const controls=$$('button,input,select'),disabled=controls.map(el=>el.disabled);
  controls.forEach(el=>el.disabled=true);
  try{return await action()}
  catch(e){setStatus(e.message||'Save operation failed. Your current dynasty is still open.');return false}
  finally{controls.forEach((el,i)=>el.disabled=disabled[i]);storageBusy=false;if(universe)render()}
}
function validateSave(d){
  const u=d?.universe||d;
  if(!u||!Array.isArray(u.teams)||u.teams.length!==120||!Number.isFinite(u.year)
    ||!Array.isArray(u.recruits)||!Array.isArray(u.schedule)
    ||u.teams.some(t=>!t||typeof t.name!=='string'||!Array.isArray(t.roster)))
    throw new Error('Invalid dynasty save. The current dynasty has not been replaced.');
  if(u.gameArchiveVersion!==undefined&&u.gameArchiveVersion!==1)throw new Error('This game archive needs a newer version of Dynasty Lab.');
  if(u.gameArchive!==undefined&&(!Array.isArray(u.gameArchive)||u.gameArchive.some(g=>!g||typeof g.id!=='string'||!g.home||!g.away||!g.score||!g.teamStats||!g.playerStats)))throw new Error('Invalid game archive.');
  if(u.playerArchive!==undefined&&!Array.isArray(u.playerArchive))throw new Error('Invalid player archive.');
  return u;
}
function installSave(d,state=null){
  const candidate=validateSave(d),previous=universe,previousArchive=browserArchive,previousTeam=$('#userTeam').value;
  try{
    universe=candidate;browserArchive=state?{...state,universe:candidate,loading:null,gamesLoading:null}:null;
    normalizeUniverse();refreshTeamOptions(d.userTeam||universe.teams[0].name);render();
  }catch(e){
    universe=previous;browserArchive=previousArchive;rebuildIndexes();refreshTeamOptions(previousTeam);throw e;
  }
}
function saveBrowser(){return storageOperation(async()=>{
  const state=currentArchiveState();
  const rows=universe.playerArchive||[];
  // Existing archive rows never change after retirement. Only append new rows.
  const start=state?.loaded?state.archiveRef?.count||0:0;
  if(start>rows.length)throw new Error('The archive changed unexpectedly. Export before saving.');
  const additions=rows.slice(start).map(packPlayer);
  // Box scores never change after the whistle, so only the ones written since
  // the last save are appended. A twelve-season dynasty stops rewriting itself.
  const games=universe.gameArchive||[];
  const gameStart=state?.gamesLoaded?state.gameRef?.count||0:0;
  if(gameStart>games.length)throw new Error('The game archive changed unexpectedly. Export before saving.');
  const gameAdditions=games.slice(gameStart);
  const snapshot={universe:packUniverse(universe,false),userTeam:$('#userTeam').value,savedAt:new Date().toISOString(),version:APP_VERSION};
  const saved=await browserStore.save(snapshot,{expectedRevision:state?.revision??null,archiveRef:state?.archiveRef||null,additions,
    gameRef:state?.gameRef||null,gameAdditions});
  browserArchive={universe,revision:saved.revision,archiveRef:saved.archiveRef,loaded:state?.loaded??true,loading:null,
    gameRef:saved.gameRef,gamesLoaded:state?.gamesLoaded??true,gamesLoading:null};
  // Committed box scores now live in storage; they must not also stay pending.
  if(!browserArchive.gamesLoaded)universe.gameArchive=[];
  // A deferred archive can have freshly appended rows; after committing them,
  // all of its rows now live in storage and must not also remain as pending rows.
  if(!browserArchive.loaded){universe.playerArchive=[];rebuildIndexes()}
  setStatus(`Saved ${universe.year}, Week ${universe.week} to browser storage.`);
  // Keep only title metadata, not a second complete league in memory.
  titleBrowserSave={userTeam:snapshot.userTeam,universe:{year:universe.year,week:universe.week,phase:universe.phase,teams:universe.teams.map(t=>({name:t.name,w:t.w,l:t.l}))}};
})}
function loadBrowser(){return storageOperation(async()=>{
  const d=await browserStore.load();
  if(!d){setStatus('No browser save found.');return false}
  // Careers are chunked from storage 2 on; box scores only from 3. Anything
  // older carried both inline and is already fully resident.
  installSave(d,{revision:DynastyStorage.revisionOf(d),archiveRef:d.archiveRef||null,loaded:!(d.storageVersion>=2),
    gameRef:d.gameRef||null,gamesLoaded:d.storageVersion!==3});
  titleBrowserSave=d;
  setStatus(`Loaded browser save from ${d.savedAt||'earlier session'}.`);
  return true;
})}
function exportSave(){return storageOperation(async()=>{
  await ensureArchiveLoaded();await ensureGamesLoaded();
  const blob=new Blob([JSON.stringify({version:APP_VERSION,userTeam:$('#userTeam').value,universe:packUniverse(universe)})],{type:'application/json'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`dynasty-lab-${universe.year}-week-${universe.week}.json`;a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);setStatus('Save exported as JSON.');
})}
function importSave(file){return storageOperation(async()=>{
  const text=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(new Error('Could not read the save file.'));r.onabort=()=>reject(new Error('Import cancelled.'));r.readAsText(file)});
  const d=JSON.parse(text);
  if(d.storageVersion||d.archiveRef)throw new Error('Import a complete exported JSON save, not a browser storage record.');
  installSave(d);setStatus('Imported save file successfully.');
  return true;
})}
function refreshTeamOptions(sel){$('#userTeam').innerHTML='';universe.teams.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(s=>{let o=document.createElement('option');o.value=s.name;o.textContent=s.name;$('#userTeam').appendChild(o)});$('#userTeam').value=T(sel)?sel:universe.teams[0].name}
function titlePreferences(){
 let prefs={motion:!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,watchSpeed:'850'};
 try{prefs={...prefs,...JSON.parse(localStorage.getItem('dynastyLabPreferences')||'{}')}}catch{}
 if(!['1400','850','400'].includes(String(prefs.watchSpeed)))prefs.watchSpeed='850';
 prefs.motion=prefs.motion!==false;return prefs;
}
function applyTitlePreferences(){const p=titlePreferences();document.body.classList.toggle('motion-reduced',!p.motion);$('#titleMotion').checked=p.motion;$('#titleWatchSpeed').value=String(p.watchSpeed)}
function saveTitlePreferences(){const p={motion:$('#titleMotion').checked,watchSpeed:$('#titleWatchSpeed').value};try{localStorage.setItem('dynastyLabPreferences',JSON.stringify(p))}catch{setTitleStatus('Options could not be saved. Check your browser storage settings.');return}applyTitlePreferences();setTitleStatus('Options saved on this device.');showTitlePanel()}
function setTitleStatus(x){if($('#titleStatus'))$('#titleStatus').textContent=x}
function titleSummary(d){
 const u=d?.universe;if(!u||!Array.isArray(u.teams))return'';const name=d.userTeam||u.teams[0]?.name||'Unknown program',t=u.teams.find(x=>x.name===name),stage=u.phase==='regular'?(u.week?`Week ${u.week}`:'Preseason'):u.phase==='complete'?'Season complete':'Postseason';return `${name} · ${u.year} · ${stage}${t?` · ${t.w}-${t.l}`:''}`;
}
function renderTitleState(){
 const current=universe?{universe,userTeam:$('#userTeam').value}:null,continuation=current||titleBrowserSave,summary=titleSummary(continuation),has=!!summary;
 $('#titleContinue').disabled=!has;$('#titleContinueMeta').textContent=has?summary:'No browser save found on this device';
 $('#titleLoadBrowser').disabled=!titleBrowserSave;$('#titleLoadMeta').textContent=titleBrowserSave?titleSummary(titleBrowserSave):'No browser save found on this device';
 $('#titleContinue').classList.toggle('title-action--primary',has);$('#titleNew').classList.toggle('title-action--primary',!has);
}
function showTitlePanel(id=null){
 $('#titleMainMenu').hidden=!!id;for(const panel of $$('.title-subpanel'))panel.hidden=panel.id!==id;
 const target=id?$('#'+id)?.querySelector('button,select,input'):($('#titleContinue').disabled?$('#titleNew'):$('#titleContinue'));target?.focus();
}
function showTitleScreen(){
 $('#app').hidden=true;$('#titleScreen').hidden=false;document.body.classList.remove('dynasty-open');renderTitleState();showTitlePanel();setTitleStatus(universe?'Current session is ready to resume.':titleBrowserSave?'Browser save ready.':'Choose New Dynasty or load a save.');window.scrollTo?.(0,0);
}
function enterDynasty(){if(!universe)return;$('#titleScreen').hidden=true;$('#app').hidden=false;document.body.classList.add('dynasty-open');render();window.scrollTo?.(0,0);$('#app .topbar')?.focus?.()}
function populateTitleTeams(){
 $('#titleTeam').innerHTML='';schools.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(s=>{const o=document.createElement('option');o.value=s.name;o.textContent=`${s.name} · ${s.conference}`;$('#titleTeam').appendChild(o)});$('#titleTeam').value='Chicago Metropolitan';
}
async function refreshTitleSave(){
 try{titleBrowserSave=await browserStore.load();renderTitleState();setTitleStatus(titleBrowserSave?'Browser save ready.':'No browser save found. Start a new dynasty when you are ready.')}
 catch(e){titleBrowserSave=null;renderTitleState();setTitleStatus(e.message||'The browser save could not be read. You can still import a backup.')}
}
function startTitleDynasty(){
 if(universe&&!confirm('Start a new dynasty? Save the current session first if you want to keep it.'))return;
 const program=$('#titleTeam').value||'Chicago Metropolitan';initUniverse();browserArchive=null;refreshTeamOptions(program);enterDynasty();setStatus(`New ${program} dynasty ready. Save to preserve it.`);
}
async function continueTitleDynasty(){if(universe){enterDynasty();return}setTitleStatus('Loading browser dynasty…');const ok=await loadBrowser();if(ok)enterDynasty();else setTitleStatus($('#saveStatus').textContent)}
async function loadTitleDynasty(){if(universe&&!confirm('Load the saved dynasty? Unsaved changes in the current session will be replaced.'))return;setTitleStatus('Loading browser dynasty…');const ok=await loadBrowser();if(ok)enterDynasty();else setTitleStatus($('#saveStatus').textContent)}
function bind(){
 document.addEventListener('click',e=>{const b=e.target.closest('[data-game]');if(b){e.preventDefault();showGameCenter(b.dataset.game)}});
 $$('#gameTabs button').forEach(b=>b.onclick=()=>showGameCenter(openedGameId,b.dataset.gameTab));
 $('#gameHistoryYear').onchange=renderGameArchive;

 $$('.tab-groups button').forEach(b=>b.onclick=()=>showTabGroup(b.dataset.group));
$$('.tabs button').forEach(b=>b.onclick=()=>{$$('.tabs button').forEach(x=>x.classList.remove('active'));$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#'+b.dataset.tab).classList.add('active');setActiveTab(b.dataset.tab)});
 $('#simWeek').onclick=simWeek;$('#hubAdvance').onclick=simWeek;$('#seasonWeek').onclick=simWeek;$('#simSeason').onclick=simSeason;$('#simConf').onclick=simConferenceChampionships;$('#simPlayoff').onclick=simPlayoff;$('#simDetailedGame').onclick=simulateUserDetailed;$('#autoTarget').onclick=autoTarget;$('#autoDepth').onclick=()=>{autoDepthTeam(selected(),true);render()};$('#archiveSearch').oninput=renderArchiveSearch;$('#runOffseason').onclick=runOffseason;$('#runSpringCamp').onclick=runSpringCamp;$('#runFallCamp').onclick=runFallCamp;$('#applyCampWinners').onclick=applyCampRecommendations;$('#teamTrainingFocus').onchange=e=>{selected().trainingFocus=e.target.value;renderDevelopment()};$('#positionChangePlayer').onchange=renderPositionChangeOptions;$('#positionChangeTarget').onchange=renderPositionChangeOptions;$('#applyPositionChange').onclick=applyPositionChange;$('#newsWeek').onchange=renderNewsletter;$('#newsScope').onchange=renderNewsletter;$('#statsScope').onchange=renderStats;$('#positionFilter').onchange=renderRoster;$('#userTeam').onchange=()=>{candidateOfferDraft=null;render()};$('#applyProgramEdit').onclick=applyProgramEdit;
 $('#watchDetailedGame').onclick=watchUserDetailed;
 $('#saveBrowser').onclick=saveBrowser;$('#loadBrowser').onclick=loadBrowser;$('#exportSave').onclick=exportSave;$('#importSave').onclick=()=>$('#importFile').click();$('#importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;const fromTitle=!$('#titleScreen').hidden,ok=await importSave(file);e.target.value='';if(ok&&fromTitle)enterDynasty();else if(!ok&&fromTitle)setTitleStatus($('#saveStatus').textContent)};
 $('#newUniverse').onclick=showTitleScreen;
 $('#titleContinue').onclick=continueTitleDynasty;$('#titleNew').onclick=()=>showTitlePanel('titleNewPanel');$('#titleLoad').onclick=()=>showTitlePanel('titleLoadPanel');$('#titleOptions').onclick=()=>showTitlePanel('titleOptionsPanel');$('#titleHowTo').onclick=()=>showTitlePanel('titleHowPanel');
 $('#titleStart').onclick=startTitleDynasty;$('#titleLoadBrowser').onclick=loadTitleDynasty;$('#titleImport').onclick=()=>$('#importFile').click();$('#titleSaveOptions').onclick=saveTitlePreferences;$$('[data-title-back]').forEach(b=>b.onclick=()=>showTitlePanel());
}
if(typeof window!=='undefined')window.__DL_TEST__={selected,createOpening,renderStaff,setTeamScheme,schemeTransition,positionChangeWillingness};
loadSchools().then(()=>{populateTitleTeams();POS.forEach(p=>{let o=document.createElement('option');o.value=p;o.textContent=p;$('#positionFilter').appendChild(o)});[...new Set(schools.map(t=>t.conference))].forEach(c=>{let o=document.createElement('option');o.value=c;o.textContent=c;$('#editConference').appendChild(o)});bind();applyTitlePreferences();showTitleScreen();refreshTitleSave();}).catch(e=>{$('#titleStatus').textContent='Could not initialize Dynasty Lab. '+e.message});
})();
