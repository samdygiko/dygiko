// Shop-to-shop canvassing areas. High streets with a dense run of independent
// trade/retail businesses you can walk end to end in a session — not shopping
// centres or chain-heavy pitches, where there's no owner on site to talk to.

export type Area = { name: string; zone: string; note: string };

export const AREAS: Area[] = [
  // ---- North & North West ----
  { name: "Kilburn High Road", zone: "NW", note: "Long unbroken run of independents — barbers, cafés, phone shops" },
  { name: "Queens Park", zone: "NW", note: "Salamanca/Lonsdale Rd — delis, salons, higher spend" },
  { name: "Kensal Rise", zone: "NW", note: "Chamberlayne Rd — boutiques, cafés, young owners" },
  { name: "Cricklewood Broadway", zone: "NW", note: "Trades, garages, builders' merchants" },
  { name: "West Hampstead", zone: "NW", note: "West End Lane — affluent, salons and clinics" },
  { name: "Willesden Green", zone: "NW", note: "High Rd — mixed retail, lots of small landlords" },
  { name: "Harlesden", zone: "NW", note: "High St — barbers, food, money transfer, very dense" },
  { name: "Golders Green", zone: "NW", note: "Bakeries, opticians, dentists, family businesses" },
  { name: "Hendon Central", zone: "NW", note: "Brent St + Watford Way — trades and services" },
  { name: "Finchley (Ballards Lane)", zone: "N", note: "Affluent, professional services and clinics" },
  { name: "East Finchley", zone: "N", note: "High Rd — small independents, easy walk" },
  { name: "Muswell Hill Broadway", zone: "N", note: "High spend, boutiques and salons" },
  { name: "Crouch End Broadway", zone: "N", note: "Independent-heavy, creative owners" },
  { name: "Archway / Junction Rd", zone: "N", note: "Cheap rents, lots of new small businesses" },
  { name: "Holloway Road", zone: "N", note: "Very long — split it over two visits" },
  { name: "Camden High Street", zone: "NW", note: "Dense but busy owners; go weekday morning" },
  { name: "Kentish Town Road", zone: "NW", note: "Independents, garages off the main road" },
  { name: "Stoke Newington Church St", zone: "N", note: "Boutiques, cafés, design-conscious owners" },
  { name: "Green Lanes (Harringay)", zone: "N", note: "Huge run of Turkish businesses, restaurants, garages" },
  { name: "Wood Green High Rd", zone: "N", note: "Dense retail, plenty of independents off-mall" },
  { name: "Turnpike Lane / Ducketts", zone: "N", note: "Trades, takeaways, barbers" },
  { name: "Palmers Green", zone: "N", note: "Green Lanes north — family businesses" },
  { name: "Southgate / Winchmore Hill", zone: "N", note: "Affluent, clinics and salons" },
  { name: "Enfield Town", zone: "N", note: "Church St — good mix, quieter footfall" },
  { name: "Barnet High Street", zone: "N", note: "Independents, estate agents, trades" },
  { name: "Edgware Station Rd", zone: "NW", note: "Retail run plus trade units behind" },
  { name: "Colindale / Burnt Oak", zone: "NW", note: "Watling Ave — very dense small shops" },
  { name: "Wembley High Road", zone: "NW", note: "Long run, mostly independents" },
  { name: "Harrow (St Ann's / College Rd)", zone: "NW", note: "Big catchment, services and clinics" },
  { name: "Pinner / Rayners Lane", zone: "NW", note: "Village feel, loyal local businesses" },
  { name: "Ruislip High Street", zone: "NW", note: "Quiet but high conversion, trades nearby" },

  // ---- West & South West ----
  { name: "Portobello / Notting Hill", zone: "W", note: "Boutiques and galleries — high budget" },
  { name: "Shepherd's Bush (Uxbridge Rd)", zone: "W", note: "Very dense, fast walk, lots of trades" },
  { name: "Hammersmith King Street", zone: "W", note: "Mixed, plenty of services" },
  { name: "Chiswick High Road", zone: "W", note: "Affluent independents, restaurants, salons" },
  { name: "Acton High Street", zone: "W", note: "Trades, garages, workshops behind the strip" },
  { name: "Ealing Broadway + The Mall", zone: "W", note: "Professional services, dentists, clinics" },
  { name: "West Ealing (Broadway)", zone: "W", note: "Cheaper rents, hungry owners" },
  { name: "Southall Broadway", zone: "W", note: "Extremely dense — full day on its own" },
  { name: "Hanwell / Greenford", zone: "W", note: "Trades and light industrial units" },
  { name: "Northolt / Yeading", zone: "W", note: "Trade counters, builders, garages" },
  { name: "Uxbridge High Street", zone: "W", note: "Big catchment, good for services" },
  { name: "Hayes Town", zone: "W", note: "Station Rd — independents and trades" },
  { name: "Fulham (North End Rd)", zone: "SW", note: "Market plus shops, high spend nearby" },
  { name: "Putney High Street", zone: "SW", note: "Affluent, salons, clinics, estate agents" },
  { name: "Wimbledon (The Broadway)", zone: "SW", note: "High budget, professional services" },
  { name: "Richmond (George St / Hill St)", zone: "SW", note: "Premium independents" },
  { name: "Twickenham King Street", zone: "SW", note: "Compact, friendly, quick to cover" },
  { name: "Kingston (Old London Rd)", zone: "SW", note: "Skip the mall — work the side streets" },
  { name: "Surbiton Victoria Rd", zone: "SW", note: "Small but high conversion" },
  { name: "Hounslow High Street", zone: "W", note: "Dense, lots of independents" },
  { name: "Brentford High Street", zone: "W", note: "Trades, workshops, garages" },

  // ---- Central ----
  { name: "Marylebone High Street", zone: "C", note: "Premium clinics, salons, boutiques" },
  { name: "Edgware Road", zone: "C", note: "Restaurants and shisha cafés, long run" },
  { name: "Angel / Upper Street", zone: "C", note: "Restaurants, salons, design studios" },
  { name: "Clerkenwell / Exmouth Market", zone: "C", note: "Studios, agencies, food — creative owners" },
  { name: "Old Street / Shoreditch", zone: "C", note: "Barbers, studios, food — young businesses" },
  { name: "Soho (Berwick / Old Compton)", zone: "C", note: "Hospitality-heavy, go before 11am" },

  // ---- East ----
  { name: "Bethnal Green Road", zone: "E", note: "Dense independents, cheap rents" },
  { name: "Roman Road", zone: "E", note: "Market street, very walkable" },
  { name: "Hackney (Mare Street)", zone: "E", note: "Long run, mixed businesses" },
  { name: "Dalston (Kingsland High St)", zone: "E", note: "Barbers, food, salons — busy" },
  { name: "Walthamstow High Street", zone: "E", note: "Longest market in Europe — full day" },
  { name: "Leyton High Road", zone: "E", note: "Trades, garages, takeaways" },
  { name: "Leytonstone High Rd", zone: "E", note: "Independents, quieter, easy chats" },
  { name: "Stratford (Broadway)", zone: "E", note: "Avoid Westfield — work the Broadway" },
  { name: "Green Street (Upton Park)", zone: "E", note: "Extremely dense retail run" },
  { name: "East Ham High St North", zone: "E", note: "Very dense, family-owned" },
  { name: "Ilford Lane", zone: "E", note: "Long run of independents" },
  { name: "Romford Market / South St", zone: "E", note: "Big catchment, trades and services" },
  { name: "Barking Town Centre", zone: "E", note: "East St — dense small shops" },
  { name: "Poplar / Chrisp Street", zone: "E", note: "Compact market area" },
  { name: "Canning Town / Rathbone Mkt", zone: "E", note: "Trades and light industrial nearby" },

  // ---- South ----
  { name: "Brixton (Electric Ave)", zone: "S", note: "Market plus shops, creative owners" },
  { name: "Clapham High Street", zone: "S", note: "Hospitality and salons, high spend" },
  { name: "Balham High Road", zone: "S", note: "Independents, clinics, cafés" },
  { name: "Tooting High Street", zone: "S", note: "Very dense — markets plus street" },
  { name: "Streatham High Road", zone: "S", note: "Long run, trades and takeaways" },
  { name: "Peckham (Rye Lane)", zone: "S", note: "Dense, young independent owners" },
  { name: "Camberwell Church St", zone: "S", note: "Compact, quick to cover" },
  { name: "Walworth Road", zone: "S", note: "Very dense small shops" },
  { name: "Deptford High Street", zone: "S", note: "Independents, market days busiest" },
  { name: "New Cross Road", zone: "S", note: "Cheap rents, new businesses" },
  { name: "Lewisham High Street", zone: "S", note: "Big catchment, mixed" },
  { name: "Catford (Rushey Green)", zone: "S", note: "Trades, garages, takeaways" },
  { name: "Greenwich (Church St)", zone: "S", note: "Tourist-facing independents" },
  { name: "Woolwich (Powis St)", zone: "S", note: "Dense retail run" },
  { name: "Eltham High Street", zone: "S", note: "Quiet, high conversion" },
  { name: "Bromley High Street", zone: "S", note: "Affluent, services and clinics" },
  { name: "Beckenham High Street", zone: "S", note: "Small but wealthy catchment" },
  { name: "Croydon (North End / Surrey St)", zone: "S", note: "Huge — split over two visits" },
  { name: "Thornton Heath / Norbury", zone: "S", note: "Trades, barbers, takeaways" },
  { name: "Sutton High Street", zone: "S", note: "Long pedestrianised run" },
  { name: "Northcote Rd (Battersea)", zone: "SW", note: "Affluent boutiques and cafés" },
  { name: "Wandsworth (Old York Rd)", zone: "SW", note: "Small, premium, fast walk" },
  { name: "Earlsfield (Garratt Lane)", zone: "SW", note: "Independents, trades nearby" },
  { name: "Colliers Wood / Morden", zone: "SW", note: "Trade units and garages" },

  // ---- North West England (Manchester, Liverpool, Preston) ----
  { name: "Manchester — Oldham St (NQ)", zone: "NW-UK", note: "Dense independents in the Northern Quarter — barbers, cafés, studios" },
  { name: "Manchester — Wilmslow Rd (Rusholme)", zone: "NW-UK", note: "The Curry Mile — restaurants, salons, phone shops, mostly owner-run" },
  { name: "Manchester — Cheetham Hill Rd", zone: "NW-UK", note: "Wholesale + retail run, tons of family businesses" },
  { name: "Manchester — Chorlton (Beech Rd + Barlow Moor Rd)", zone: "NW-UK", note: "Boutiques, delis, cafés — creative owners" },
  { name: "Manchester — Levenshulme (Stockport Rd)", zone: "NW-UK", note: "Long stretch of independents, antique shops, food" },
  { name: "Salford — Chapel St / Eccles New Rd", zone: "NW-UK", note: "Trades, garages, small services" },
  { name: "Stockport — Little Underbank + Underbanks", zone: "NW-UK", note: "Restored independent quarter — cafés, gifts, jewellers" },
  { name: "Bolton — Bradshawgate / Deansgate", zone: "NW-UK", note: "Retail run, family businesses, easy walk" },
  { name: "Oldham — Yorkshire St", zone: "NW-UK", note: "Compact, cheap rents, hungry new owners" },
  { name: "Liverpool — Bold St", zone: "NW-UK", note: "Independent restaurants, boutiques — creative owners" },
  { name: "Liverpool — Smithdown Rd", zone: "NW-UK", note: "Long run of takeaways, salons, barbers, student-facing shops" },
  { name: "Liverpool — Lark Lane (Aigburth)", zone: "NW-UK", note: "Village feel, cafés, delis, high owner engagement" },
  { name: "Birkenhead — Grange Rd", zone: "NW-UK", note: "Working retail run, quieter but responsive" },
  { name: "Preston — Friargate + Fishergate", zone: "NW-UK", note: "Independents mixed with chains, plenty behind the main drag" },
  { name: "Warrington — Bridge St", zone: "NW-UK", note: "Compact town centre, trades and services" },

  // ---- North East (Newcastle, Sunderland, Middlesbrough) ----
  { name: "Newcastle — Grainger St / Grey St", zone: "NE-UK", note: "Grade-I retail run, but wander the side streets for owner-run shops" },
  { name: "Newcastle — Chillingham Rd (Heaton)", zone: "NE-UK", note: "Dense independents — cafés, salons, bike shops" },
  { name: "Newcastle — Shields Rd (Byker)", zone: "NE-UK", note: "Working-class retail run, trades and barbers" },
  { name: "Gateshead — High St + Jackson St", zone: "NE-UK", note: "Small but compact, quick to cover" },
  { name: "Sunderland — High St West + Fawcett St", zone: "NE-UK", note: "Long pedestrianised run, mixed independents" },
  { name: "Middlesbrough — Linthorpe Rd", zone: "NE-UK", note: "Independent-heavy, student-facing shops and salons" },

  // ---- Yorkshire & Humber (Leeds, Sheffield, Bradford, Hull, York) ----
  { name: "Leeds — Kirkgate + Vicar Lane", zone: "YRK", note: "Market plus independents, dense retail" },
  { name: "Leeds — Chapel Allerton (Harrogate Rd)", zone: "YRK", note: "Affluent, delis, salons, professionals" },
  { name: "Leeds — Headingley (Otley Rd)", zone: "YRK", note: "Student-facing but plenty of family businesses" },
  { name: "Bradford — Great Horton Rd", zone: "YRK", note: "Very dense — restaurants, barbers, phone shops" },
  { name: "Sheffield — West St + Division St", zone: "YRK", note: "Independents, bars, salons, creative owners" },
  { name: "Sheffield — Ecclesall Rd", zone: "YRK", note: "Long run of cafés, boutiques, salons — steady walk" },
  { name: "Sheffield — London Rd (Sharrow)", zone: "YRK", note: "Very dense, restaurants, food shops, high owner presence" },
  { name: "Huddersfield — New St + King St", zone: "YRK", note: "Compact centre, independents and clinics" },
  { name: "York — Micklegate + Fossgate", zone: "YRK", note: "Tourist-facing but with real independents behind" },
  { name: "Hull — Newland Ave", zone: "YRK", note: "Long independent run — bakeries, cafés, vinyl shops" },

  // ---- West Midlands (Birmingham, Wolverhampton, Coventry, Solihull) ----
  { name: "Birmingham — Digbeth", zone: "WMID", note: "Creative industrial quarter — studios, garages, workshops" },
  { name: "Birmingham — Coventry Rd (Small Heath)", zone: "WMID", note: "Very dense, restaurants, jewellers, salons" },
  { name: "Birmingham — Stratford Rd (Sparkbrook / Sparkhill)", zone: "WMID", note: "Family businesses along a long strip" },
  { name: "Birmingham — Kings Heath High St", zone: "WMID", note: "Independent-heavy, cafés, boutiques, easy walk" },
  { name: "Birmingham — Moseley (St Mary's Row / Alcester Rd)", zone: "WMID", note: "Affluent, salons, delis, small clinics" },
  { name: "Wolverhampton — Dudley St + Queen St", zone: "WMID", note: "Compact retail run, mixed independents" },
  { name: "Coventry — Far Gosford St", zone: "WMID", note: "Restored independent quarter, cafés and salons" },
  { name: "West Bromwich — High St", zone: "WMID", note: "Long retail run, family businesses" },
  { name: "Solihull — Warwick Rd + Poplar Rd", zone: "WMID", note: "Affluent, professional services and clinics" },

  // ---- East Midlands (Nottingham, Leicester, Derby) ----
  { name: "Nottingham — Hockley (Broad St + Goose Gate)", zone: "EMID", note: "Independent quarter, creative owners" },
  { name: "Nottingham — Alfreton Rd (Radford)", zone: "EMID", note: "Long run of takeaways, garages, small trades" },
  { name: "Leicester — Belgrave Rd (Golden Mile)", zone: "EMID", note: "Very dense, jewellers, restaurants, saris" },
  { name: "Leicester — Narborough Rd", zone: "EMID", note: "'Most diverse street in UK' — restaurants, groceries, salons" },
  { name: "Derby — Sadler Gate + Iron Gate", zone: "EMID", note: "Compact independent quarter, cafés and boutiques" },
  { name: "Loughborough — Market Place + High St", zone: "EMID", note: "Small town centre, independents and services" },

  // ---- South West England (Bristol, Bath, Exeter, Plymouth) ----
  { name: "Bristol — Gloucester Rd", zone: "SW-UK", note: "One of UK's longest independent runs — cafés, delis, trades" },
  { name: "Bristol — Stokes Croft + Cheltenham Rd", zone: "SW-UK", note: "Creative, indie-heavy, young owners" },
  { name: "Bristol — North St (Bedminster)", zone: "SW-UK", note: "Boutiques, cafés, family businesses" },
  { name: "Bath — Walcot St", zone: "SW-UK", note: "Independent-only quarter, antiques and design" },
  { name: "Exeter — Fore St + Sidwell St", zone: "SW-UK", note: "Compact centre, independents and services" },
  { name: "Plymouth — Mutley Plain", zone: "SW-UK", note: "Long retail run, student-facing plus family businesses" },
  { name: "Bournemouth — Old Christchurch Rd", zone: "SW-UK", note: "Boutiques, salons, cafés, easy walk" },
  { name: "Poole — High St + Ashley Rd (Parkstone)", zone: "SW-UK", note: "Independent-heavy, seaside towns" },

  // ---- South East (Brighton, Reading, Southampton, Oxford, Portsmouth) ----
  { name: "Brighton — North Laine (Kensington Gardens + Sydney St)", zone: "SE-UK", note: "Dense independent quarter, creative owners" },
  { name: "Brighton — London Rd", zone: "SE-UK", note: "Longer, cheaper, plenty of new small businesses" },
  { name: "Hove — Church Rd + Blatchington Rd", zone: "SE-UK", note: "Affluent, salons, delis, clinics" },
  { name: "Worthing — Montague St + Rowlands Rd", zone: "SE-UK", note: "Compact seaside centre, independents" },
  { name: "Southampton — Bedford Place + Portswood Rd", zone: "SE-UK", note: "Long student-facing run, cafés, salons, takeaways" },
  { name: "Portsmouth — Albert Rd (Southsea)", zone: "SE-UK", note: "Independent-only run, creative and food" },
  { name: "Reading — Oxford Rd", zone: "SE-UK", note: "Very dense, family businesses, restaurants, salons" },
  { name: "Slough — Farnham Rd + High St", zone: "SE-UK", note: "Working retail, phone shops, takeaways, salons" },
  { name: "Oxford — Cowley Rd", zone: "SE-UK", note: "Independent-only strip, restaurants, salons, bookshops" },
  { name: "Milton Keynes — Wolverton High St", zone: "SE-UK", note: "Old-town independents, cafés and antiques" },

  // ---- East of England (Cambridge, Norwich, Ipswich, Luton) ----
  { name: "Cambridge — Mill Rd", zone: "EAST", note: "Very dense independent run, restaurants, groceries, salons" },
  { name: "Norwich — St Benedicts St + Magdalen St", zone: "EAST", note: "Independent quarters, creative and food owners" },
  { name: "Ipswich — St Peter's St + Upper Brook St", zone: "EAST", note: "Compact town centre, independents and services" },
  { name: "Colchester — High St + Head St", zone: "EAST", note: "Long pedestrianised run, mixed independents" },
  { name: "Luton — Bury Park Rd + Dunstable Rd", zone: "EAST", note: "Very dense, family businesses, restaurants, garages" },

  // ---- Wales (Cardiff, Swansea, Newport) ----
  { name: "Cardiff — City Rd + Albany Rd", zone: "WAL", note: "Long independent run, restaurants, salons, takeaways" },
  { name: "Cardiff — Cowbridge Rd (Canton)", zone: "WAL", note: "Family businesses, cafés, small services" },
  { name: "Newport — Commercial St + High St", zone: "WAL", note: "Compact centre, independents and trades" },
  { name: "Swansea — St Helen's Rd + Mumbles Rd", zone: "WAL", note: "Long runs, restaurants and services" },

  // ---- Scotland (Glasgow, Edinburgh, Dundee, Aberdeen) ----
  { name: "Glasgow — Byres Rd (West End)", zone: "SCO", note: "Affluent, cafés, boutiques, salons" },
  { name: "Glasgow — Victoria Rd (Southside)", zone: "SCO", note: "Independent-heavy, food and creative" },
  { name: "Glasgow — Kilmarnock Rd (Shawlands)", zone: "SCO", note: "Family businesses along a long strip" },
  { name: "Edinburgh — Leith Walk", zone: "SCO", note: "Massive run — barbers, cafés, phone shops, takeaways" },
  { name: "Edinburgh — Bruntsfield Place + Morningside Rd", zone: "SCO", note: "Affluent, salons, delis, clinics" },
  { name: "Dundee — Perth Rd", zone: "SCO", note: "Student-facing plus family businesses, cafés and shops" },
  { name: "Aberdeen — Rosemount Place + George St", zone: "SCO", note: "Compact independent runs, services and food" },

  // ---- Northern Ireland (Belfast) ----
  { name: "Belfast — Ormeau Rd (South)", zone: "NI", note: "Independent quarter, cafés, salons, boutiques" },
  { name: "Belfast — Lisburn Rd", zone: "NI", note: "Affluent, salons, delis, clinics, professional services" },
];

export const ZONES = [
  // London
  "N", "NW", "W", "SW", "C", "E", "S",
  // Rest of UK
  "NW-UK", "NE-UK", "YRK", "WMID", "EMID", "SW-UK", "SE-UK", "EAST", "WAL", "SCO", "NI",
] as const;

export const ZONE_LABELS: Record<string, string> = {
  // London
  N: "North (London)", NW: "North West (London)", W: "West (London)", SW: "South West (London)",
  C: "Central (London)", E: "East (London)", S: "South (London)",
  // Rest of UK
  "NW-UK": "North West England",
  "NE-UK": "North East England",
  YRK: "Yorkshire",
  WMID: "West Midlands",
  EMID: "East Midlands",
  "SW-UK": "South West England",
  "SE-UK": "South East England",
  EAST: "East of England",
  WAL: "Wales",
  SCO: "Scotland",
  NI: "Northern Ireland",
};

// Already walked — seeded as done so the tab starts from where things stand.
export const ALREADY_DONE = [
  "Kilburn High Road", "Queens Park", "Kensal Rise", "Cricklewood Broadway",
];

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
