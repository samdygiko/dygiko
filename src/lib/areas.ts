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
];

export const ZONES = ["N", "NW", "W", "SW", "C", "E", "S"] as const;

export const ZONE_LABELS: Record<string, string> = {
  N: "North", NW: "North West", W: "West", SW: "South West",
  C: "Central", E: "East", S: "South",
};

// Already walked — seeded as done so the tab starts from where things stand.
export const ALREADY_DONE = [
  "Kilburn High Road", "Queens Park", "Kensal Rise", "Cricklewood Broadway",
];

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
