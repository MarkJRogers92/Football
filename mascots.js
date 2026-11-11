// v0.20 — a nickname for each of the 120 fictional programs, keyed by school id. Every one is invented for this game
// and chosen from local history, industry or wildlife; none is the nickname of a real team in that city or state.
// A team object may carry its own `nickname` (it wins); otherwise the table answers, so older saves get nicknames too.
(function(root){
  const NICKNAMES={
    1:'Skyliners',2:'Freighters',3:'Timberjacks',4:'Lakehawks',5:'Ironwoods',6:'Forgemen',7:'Gales',8:'Marshhawks',9:'Quarrymen',10:'Generals',11:'Northmen',12:'Herons',
    13:'Harbormasters',14:'Baymen',15:'Patroons',16:'Gothams',17:'Sandpipers',18:'Oaks',19:'Schooners',20:'Sugarmakers',21:'Granite',22:'Lobstermen',23:'Ferrymen',24:'Breakers',
    25:'Skipjacks',26:'Statesmen',27:'Ironclads',28:'Shipwrights',29:'Ridgebacks',30:'Regulators',31:'Foxes',32:'Corsairs',33:'Swamp Foxes',34:'Pilots',35:'Hellbenders',36:'Ridge Runners',
    37:'Firebirds',38:'Egrets',39:'Thunderheads',40:'Barracudas',41:'Tarpons',42:'Vulcans',43:'Mystics',44:'Rivermen',45:'Engineers',46:'Paddlewheelers',47:'Longleafs',48:'Thoroughbreds',
    49:'Kingfish',50:'Brass',51:'Trappers',52:'Shrimpers',53:'Wildcatters',54:'Derricks',55:'Diamonds',56:'Hillmen',57:'Bluesmen',58:'Steamers',59:'Stingrays',60:'Spoonbills',
    61:'Pathfinders',62:'Archers',63:'Aviators',64:'Threshers',65:'Plainsmen',66:'Stockmen',67:'Harvesters',68:'Badlanders',69:'Blizzard',70:'Gushers',71:'Travelers',72:'Sodbusters',
    73:'Marshals',74:'Wranglers',75:'Drovers',76:'Defenders',77:'Dusters',78:'Scorpions',79:'Thunderbirds',80:'Outlaws',81:'Coyotes',82:'Trailblazers',83:'Sidewinders',84:'Javelinas',
    85:'Prospectors',86:'Bighorns',87:'Pioneers',88:'Snowcats',89:'Smokejumpers',90:'Copper Kings',91:'Outriders',92:'Pronghorns',93:'Comstocks',94:'High Rollers',95:'Sawyers',96:'Canyoneers',
    97:'Condors',98:'Meteors',99:'Sea Lions',100:'Fog',101:'Goldpanners',102:'Growers',103:'Bridgemen',104:'Sasquatch',105:'Orcas',106:'Steelheads',107:'Voyagers',108:'Mushers',
    109:'Bellringers',110:'Ironmasters',111:'Clippers',112:'Flying Pigs',113:'Sluggers',114:'Pickers',115:'Speedsters',116:'Navigators',117:'Icebreakers',118:'Riveters',119:'Rapids',120:'Voyageurs'
  };
  const clean=value=>String(value??'').replace(/[<>&"']/g,'').trim().slice(0,28);
  function nickname(team){
    if(team==null)return'';
    if(typeof team==='object'){const own=clean(team.nickname);return own||NICKNAMES[Number(team.id)]||''}
    return NICKNAMES[Number(team)]||'';
  }
  function fullName(team){const nick=nickname(team),name=typeof team==='object'?String(team?.name??''):'';return nick&&name?`${name} ${nick}`:name}
  const api={NICKNAMES,nickname,fullName};
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.DynastyMascots=api;
})(typeof globalThis!=='undefined'?globalThis:this);
