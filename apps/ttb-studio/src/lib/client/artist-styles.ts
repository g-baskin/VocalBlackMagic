/**
 * Finds real artist names in a song prompt and suggests a description of the sound instead.
 * Song models (Google Lyria in particular) refuse prompts that name real artists, and the project
 * does not imitate a recognisable person's identity. Musical style itself is fair to describe.
 * Descriptions below are our own wording; tags all come from the style tag catalogue.
 */
import { MAX_STYLE_TAGS, hasTag, parseTags } from './style-tags';

export type StylePreset = {
  /** Inline replacement for a bare name, e.g. "an Adele song" -> "a soulful pop song". */
  short: string;
  /** Appended when the name came with "like ...", "in the style of ..." or "... vibes". */
  description: string;
  tags: readonly string[];
};

const P = {
  soulBallad: {
    short: 'soulful pop',
    description: 'a soulful pop ballad with powerful, rich vocals, piano and swelling strings',
    tags: ['soul', 'pop', 'ballad', 'piano', 'strings', 'heartfelt', 'powerful vocal', 'rich vocal']
  },
  retroSoul: {
    short: 'retro soul',
    description: 'retro 60s soul with a punchy horn section, swing and a smoky, raspy vocal',
    tags: ['soul', '60s', 'retro', 'horns', 'swing', 'raspy vocal']
  },
  classicSoul: {
    short: 'classic soul',
    description: 'classic soul with warm organ, tight horns and a powerful, soulful vocal',
    tags: ['soul', '60s', 'organ', 'horns', 'soulful vocal', 'powerful vocal', 'vintage']
  },
  powerBallad: {
    short: 'big pop',
    description:
      'a dramatic pop power ballad with soaring vocals, vocal runs and a huge final chorus',
    tags: ['pop', 'ballad', 'powerful vocal', 'vocal runs', 'epic', 'strings', 'dramatic']
  },
  dancePop: {
    short: 'upbeat dance pop',
    description: 'upbeat dance pop with punchy synths, four-on-the-floor drums and a catchy hook',
    tags: [
      'dance pop',
      'synthesizer',
      'four on the floor',
      'upbeat',
      'danceable',
      'polished production'
    ]
  },
  retroPop: {
    short: 'playful retro pop',
    description: 'playful retro pop with bouncy bass, disco touches and a breathy, cheeky vocal',
    tags: ['pop', 'disco', 'funky bass', 'playful', 'breathy vocal', 'retro']
  },
  theatricalSynthPop: {
    short: 'theatrical synth pop',
    description: 'theatrical 80s synth pop with big synths, celebratory energy and soaring vocals',
    tags: ['synthpop', '80s', 'synthesizer', 'celebratory', 'powerful vocal', 'playful']
  },
  clubPop: {
    short: 'brash club pop',
    description: 'brash club pop with distorted synths, pounding beats and confident vocals',
    tags: ['hyperpop', 'electropop', 'synthesizer', 'four on the floor', 'confident', 'energetic']
  },
  popRnb: {
    short: 'smooth pop r&b',
    description: 'smooth pop r&b with airy vocals, vocal runs, finger snaps and 808 bass',
    tags: ['r&b', 'pop', 'airy vocal', 'vocal runs', '808 bass', 'sensual']
  },
  darkSynthRnb: {
    short: 'moody synth r&b',
    description:
      'moody 80s-tinged synth r&b with falsetto vocals, reverb and a driving drum machine',
    tags: ['r&b', 'synthwave', '80s', 'falsetto', 'reverb vocal', 'drum machine', 'dark']
  },
  altRnb: {
    short: 'dreamy alternative r&b',
    description: 'dreamy, minimal alternative r&b with soft vocals, warm keys and lo-fi texture',
    tags: ['r&b', 'neo soul', 'lo-fi', 'soft vocal', 'electric piano', 'dreamy', 'introspective']
  },
  neoSoul: {
    short: 'neo soul',
    description: 'warm neo soul with live bass, electric piano and a laid-back groove',
    tags: ['neo soul', 'funky bass', 'electric piano', 'groovy', 'warm vocal']
  },
  confessionalPop: {
    short: 'confessional pop',
    description:
      'intimate singer-songwriter pop with storytelling lyrics and acoustic guitar building to a big chorus',
    tags: ['pop', 'singer-songwriter', 'acoustic guitar', 'heartfelt', 'nostalgic', 'clear vocal']
  },
  acousticPop: {
    short: 'acoustic pop',
    description: 'warm acoustic pop with strummed guitar, hand claps and a clear, heartfelt vocal',
    tags: ['pop', 'singer-songwriter', 'acoustic guitar', 'hand claps', 'heartfelt', 'clear vocal']
  },
  angstyPopRock: {
    short: 'angsty pop rock',
    description:
      'angsty pop rock with crunchy electric guitars, punchy drums and a shout-along chorus',
    tags: ['pop rock', 'pop punk', 'electric guitar', 'drums', 'rebellious', 'emotional']
  },
  darkMinimalPop: {
    short: 'dark minimal pop',
    description: 'dark, minimal electro-pop with whispery vocals, heavy sub bass and sparse beats',
    tags: ['electropop', 'whispery vocal', '808 bass', 'minimal', 'dark', 'mysterious']
  },
  cinematicDreamPop: {
    short: 'cinematic dream pop',
    description:
      'lush, cinematic dream pop with sultry vocals, sweeping strings and a vintage haze',
    tags: ['cinematic', 'strings', 'sultry vocal', 'vintage', 'dreamy', 'melancholic']
  },
  bedroomPop: {
    short: 'bedroom pop',
    description: 'hazy bedroom pop with soft vocals, jangly guitar and lo-fi warmth',
    tags: ['indie pop', 'lo-fi', 'soft vocal', 'electric guitar', 'dreamy', 'nostalgic']
  },
  retroPopRock: {
    short: '70s-inspired pop rock',
    description: 'warm 70s-inspired pop rock with groovy bass, horns and a smooth vocal',
    tags: ['pop rock', '70s', 'funky bass', 'horns', 'groovy', 'smooth vocal']
  },
  kpop: {
    short: 'k-pop',
    description: 'high-energy k-pop with genre-switching sections, punchy synths and group vocals',
    tags: ['k-pop', 'dance pop', 'synthesizer', 'harmonies', 'energetic', 'polished production']
  },
  melodicTrap: {
    short: 'melodic trap',
    description: 'melodic trap with rolling hi-hats, heavy 808s and auto-tuned hooks',
    tags: ['trap', 'hip-hop', '808 bass', 'drum machine', 'confident']
  },
  lyricalRap: {
    short: 'lyrical hip-hop',
    description:
      'lyrical, storytelling hip-hop with soulful samples, boom bap drums and sharp flows',
    tags: ['hip-hop', 'rap', 'boom bap', 'soul', 'introspective']
  },
  moodyRap: {
    short: 'moody late-night hip-hop',
    description:
      'moody, late-night hip-hop and r&b with atmospheric pads, sung hooks and laid-back flows',
    tags: ['hip-hop', 'r&b', 'atmospheric', 'introspective', 'confident']
  },
  aggressiveRap: {
    short: 'aggressive rap',
    description: 'aggressive, fast-paced rap with hard-hitting drums and an intense delivery',
    tags: ['rap', 'hip-hop', 'aggressive', 'intense', 'fast tempo']
  },
  confidentRap: {
    short: 'bold rap',
    description: 'bold, confident rap with bouncy 808s and punchy, playful flows',
    tags: ['rap', 'trap', '808 bass', 'confident', 'playful']
  },
  altHipHop: {
    short: 'alternative hip-hop',
    description: 'colourful alternative hip-hop with jazzy chords, warm synths and playful flows',
    tags: ['hip-hop', 'experimental', 'electric piano', 'synthesizer', 'playful']
  },
  drill: {
    short: 'drill',
    description: 'dark drill with sliding 808s, sparse piano and gritty flows',
    tags: ['drill', '808 bass', 'piano', 'dark', 'aggressive']
  },
  stadiumRock: {
    short: 'anthemic stadium rock',
    description:
      'anthemic stadium rock with big electric guitars, pounding drums and a sing-along chorus',
    tags: ['rock', 'classic rock', 'electric guitar', 'drums', 'anthemic', 'energetic']
  },
  sixtiesRock: {
    short: '60s pop rock',
    description: 'jangly 60s pop rock with vocal harmonies, bright guitars and a melodic hook',
    tags: ['60s', 'pop rock', 'harmonies', 'electric guitar', 'retro', 'upbeat']
  },
  hardRock: {
    short: 'hard rock',
    description:
      'hard rock with crunchy riffs, screaming guitar solos and a swaggering, gritty vocal',
    tags: ['hard rock', 'electric guitar', 'drums', '80s', 'gritty vocal', 'rebellious']
  },
  atmosphericRock: {
    short: 'atmospheric pop rock',
    description:
      'uplifting, atmospheric pop rock with shimmering guitars, piano and a soaring chorus',
    tags: ['pop rock', 'piano', 'electric guitar', 'uplifting', 'anthemic', 'atmospheric']
  },
  nineties: {
    short: '90s alternative rock',
    description:
      'raw 90s alternative rock with distorted guitars, loud-quiet dynamics and a gritty vocal',
    tags: ['alternative rock', 'grunge', '90s', 'electric guitar', 'gritty vocal', 'rebellious']
  },
  artRock: {
    short: 'experimental alternative rock',
    description:
      'experimental alternative rock with atmospheric guitars, electronic textures and a fragile falsetto',
    tags: ['alternative rock', 'experimental', 'atmospheric', 'falsetto', 'melancholic']
  },
  indieRock: {
    short: 'swaggering indie rock',
    description: 'swaggering indie rock with tight guitar riffs, groovy bass and witty lyrics',
    tags: ['indie rock', 'electric guitar', 'funky bass', 'groovy', 'confident']
  },
  softRock: {
    short: '70s soft rock',
    description: 'dreamy 70s soft rock with layered harmonies, warm guitars and a nostalgic feel',
    tags: ['rock', '70s', 'harmonies', 'acoustic guitar', 'dreamy', 'nostalgic']
  },
  pianoRock: {
    short: 'piano-led pop rock',
    description: 'piano-led 70s pop rock with a big, anthemic chorus and heartfelt storytelling',
    tags: ['pop rock', 'piano', '70s', 'anthemic', 'heartfelt']
  },
  progRock: {
    short: 'progressive rock',
    description:
      'spacious progressive rock with long guitar solos, synth textures and introspective lyrics',
    tags: [
      'progressive rock',
      'atmospheric',
      'synthesizer',
      'electric guitar',
      '70s',
      'introspective'
    ]
  },
  glamRock: {
    short: 'glam art rock',
    description: 'theatrical 70s glam art rock with bold guitars, strings and dramatic vocals',
    tags: ['glam rock', '70s', 'experimental', 'strings', 'dramatic']
  },
  metal: {
    short: 'heavy metal',
    description: 'heavy metal with fast, chugging riffs, double-kick drums and a powerful vocal',
    tags: ['heavy metal', 'metal', 'electric guitar', 'drums', 'aggressive', 'intense']
  },
  numetal: {
    short: 'nu metal',
    description:
      'emotional nu metal with heavy guitars, electronic textures, rapped verses and screamed choruses',
    tags: ['metal', 'alternative rock', 'rapping', 'electric guitar', 'emotional', 'aggressive']
  },
  punk: {
    short: 'pop punk',
    description: 'fast pop punk with buzzing guitars, driving drums and a shout-along chorus',
    tags: ['punk', 'pop punk', 'electric guitar', 'fast tempo', 'rebellious', 'energetic']
  },
  emo: {
    short: 'emo rock',
    description: 'theatrical emo rock with soaring guitars, dramatic builds and an urgent vocal',
    tags: ['emo', 'alternative rock', 'electric guitar', 'dramatic', 'emotional']
  },
  countryPop: {
    short: 'country pop',
    description:
      'polished country pop with acoustic guitar, pedal steel and a big singalong chorus',
    tags: ['country', 'pop', 'acoustic guitar', 'pedal steel guitar', 'upbeat', 'heartfelt']
  },
  modernCountry: {
    short: 'modern country',
    description:
      'modern country with twangy guitars, a steady backbeat and a warm, gravelly lead vocal',
    tags: [
      'country',
      'country rock',
      'electric guitar',
      'pedal steel guitar',
      'gravelly vocal',
      'nostalgic'
    ]
  },
  classicCountry: {
    short: 'classic country',
    description: 'classic country with a boom-chick rhythm, twangy guitar and storytelling lyrics',
    tags: ['country', 'americana', 'acoustic guitar', 'vintage', 'nostalgic']
  },
  indieFolk: {
    short: 'indie folk',
    description:
      'intimate indie folk with fingerpicked acoustic guitar, soft harmonies and reflective lyrics',
    tags: ['indie folk', 'folk', 'acoustic guitar', 'harmonies', 'soft vocal', 'reflective']
  },
  folkRock: {
    short: 'stomping folk rock',
    description: 'foot-stomping folk rock with banjo, acoustic guitar and gang vocals',
    tags: ['folk', 'banjo', 'acoustic guitar', 'anthemic', 'energetic', 'harmonies']
  },
  reggaeton: {
    short: 'reggaeton',
    description: 'reggaeton with a dembow beat, deep bass and smooth Spanish-language hooks',
    tags: ['reggaeton', 'latin pop', '808 bass', 'danceable', 'sensual']
  },
  latinPop: {
    short: 'latin pop',
    description: 'latin pop with tropical percussion, guitar and an infectious dance groove',
    tags: ['latin pop', 'percussion', 'acoustic guitar', 'danceable', 'festive']
  },
  flamencoPop: {
    short: 'experimental flamenco pop',
    description:
      'experimental flamenco pop with hand claps, nylon-string guitar and bold electronic beats',
    tags: ['latin pop', 'experimental', 'hand claps', 'nylon string guitar', 'confident']
  },
  afrobeats: {
    short: 'afrobeats',
    description: 'smooth afrobeats with bouncy syncopated percussion, warm bass and melodic hooks',
    tags: ['afrobeats', 'percussion', 'groovy', 'danceable', 'summer']
  },
  amapiano: {
    short: 'amapiano',
    description: 'amapiano with deep log-drum bass, shakers and airy vocals',
    tags: ['amapiano', 'percussion', 'airy vocal', 'groovy', 'danceable']
  },
  festivalEdm: {
    short: 'festival EDM',
    description:
      'euphoric festival EDM with big synth leads, a building drop and a four-on-the-floor kick',
    tags: ['edm', 'house', 'synthesizer', 'four on the floor', 'energetic', '128 bpm']
  },
  melodicHouse: {
    short: 'melodic house',
    description:
      'uplifting melodic house with piano chords, acoustic guitar and a soaring vocal drop',
    tags: ['house', 'piano', 'uplifting', 'summer', 'danceable']
  },
  frenchHouse: {
    short: 'funky french house',
    description:
      'funky french house with filtered disco loops, robotic vocals and a four-on-the-floor groove',
    tags: ['house', 'disco', 'funky bass', 'four on the floor', 'groovy', 'retro']
  },
  dubstep: {
    short: 'dubstep',
    description: 'aggressive dubstep with growling synth bass, half-time drums and huge drops',
    tags: ['dubstep', 'synth bass', 'half-time', 'aggressive', 'intense', '140 bpm']
  },
  funkPop: {
    short: 'funky retro pop',
    description:
      'funky retro pop with slap bass, tight horns, crisp drums and a falsetto-laced vocal',
    tags: ['funk', 'disco', 'funky bass', 'horns', 'groovy', 'falsetto']
  },
  psychPop: {
    short: 'dreamy synth pop',
    description:
      'dreamy, phased synth pop with groovy bass, washed-out guitars and a soft falsetto',
    tags: ['indie pop', 'synthesizer', 'funky bass', 'dreamy', 'falsetto', '70s']
  },
  jazz: {
    short: 'classic jazz',
    description: 'smoky classic jazz with swing, brushed drums, piano and a smooth crooning vocal',
    tags: ['jazz', 'swing', 'piano', 'saxophone', 'smooth vocal', 'vintage', 'romantic']
  },
  jazzPop: {
    short: 'mellow jazz pop',
    description: 'mellow jazz-pop with soft piano, brushed drums and an intimate, soft vocal',
    tags: ['jazz', 'piano', 'soft vocal', 'calm', 'intimate']
  },
  orchestral: {
    short: 'cinematic orchestral',
    description: 'epic cinematic orchestral music with soaring strings, brass and big percussion',
    tags: ['cinematic', 'orchestral', 'strings', 'brass', 'epic', 'dramatic']
  },
  minimalPiano: {
    short: 'minimal piano',
    description: 'minimal contemporary piano with gentle, repeating patterns and soft strings',
    tags: ['classical', 'piano', 'minimal', 'calm', 'reflective']
  },
  reggae: {
    short: 'roots reggae',
    description: 'roots reggae with an offbeat guitar skank, deep bass, organ and a relaxed groove',
    tags: ['reggae', 'bass guitar', 'organ', 'relaxing', 'hopeful']
  },
  gospel: {
    short: 'gospel',
    description:
      'uplifting gospel with a full choir, organ, hand claps and call-and-response vocals',
    tags: ['gospel', 'choir', 'organ', 'hand claps', 'uplifting', 'spiritual']
  },
  blues: {
    short: 'electric blues',
    description: 'electric blues with expressive guitar bends, organ and a gritty, soulful vocal',
    tags: ['blues', 'electric guitar', 'organ', 'soulful vocal', 'gritty vocal']
  },
  ambientPop: {
    short: 'ethereal ambient pop',
    description: 'ethereal ambient pop with layered airy vocals, reverb and sweeping synth pads',
    tags: ['ambient', 'new age', 'airy vocal', 'reverb vocal', 'synth pads', 'atmospheric']
  }
} satisfies Record<string, StylePreset>;

type Entry = { name: string; aliases?: string[]; preset: StylePreset; ambiguous?: boolean };

/**
 * Well-known artists people commonly name in prompts. `ambiguous` names are also everyday words,
 * so they only count when capitalised and written as "like X", "in the style of X" or "X-style"
 * ("X type beat" counts in any case).
 */
export const artistEntries: readonly Entry[] = [
  { name: 'Adele', preset: P.soulBallad },
  { name: 'Sam Smith', preset: P.soulBallad },
  { name: 'Lewis Capaldi', preset: P.soulBallad },
  { name: 'John Legend', preset: P.soulBallad },
  { name: 'Amy Winehouse', preset: P.retroSoul },
  { name: 'Duffy', preset: P.retroSoul },
  { name: 'Leon Bridges', preset: P.retroSoul },
  { name: 'Aretha Franklin', aliases: ['Aretha'], preset: P.classicSoul },
  { name: 'Otis Redding', preset: P.classicSoul },
  { name: 'Marvin Gaye', preset: P.classicSoul },
  { name: 'Sam Cooke', preset: P.classicSoul },
  { name: 'Etta James', preset: P.classicSoul },
  { name: 'Al Green', preset: P.classicSoul },
  { name: 'Whitney Houston', aliases: ['Whitney'], preset: P.powerBallad },
  { name: 'Celine Dion', preset: P.powerBallad },
  { name: 'Mariah Carey', aliases: ['Mariah'], preset: P.powerBallad },
  { name: 'Christina Aguilera', preset: P.powerBallad },
  { name: 'Kelly Clarkson', preset: P.powerBallad },
  { name: 'Jennifer Hudson', preset: P.powerBallad },
  { name: 'Dua Lipa', preset: P.dancePop },
  { name: 'Lady Gaga', preset: P.dancePop },
  { name: 'Katy Perry', preset: P.dancePop },
  { name: 'Britney Spears', aliases: ['Britney'], preset: P.dancePop },
  { name: 'Madonna', preset: P.dancePop, ambiguous: true },
  { name: 'Kylie Minogue', preset: P.dancePop },
  { name: 'Ava Max', preset: P.dancePop },
  { name: 'Sabrina Carpenter', preset: P.retroPop },
  { name: 'Meghan Trainor', preset: P.retroPop },
  { name: 'Chappell Roan', preset: P.theatricalSynthPop },
  { name: 'Charli XCX', aliases: ['Charli'], preset: P.clubPop },
  { name: 'Ariana Grande', aliases: ['Ariana'], preset: P.popRnb },
  { name: 'Beyonce', aliases: ['Beyoncé'], preset: P.popRnb },
  { name: 'Rihanna', preset: P.popRnb },
  { name: 'SZA', preset: P.popRnb },
  { name: 'Jhene Aiko', aliases: ['Jhené Aiko'], preset: P.popRnb },
  { name: 'Summer Walker', preset: P.popRnb },
  { name: 'Aaliyah', preset: P.popRnb },
  { name: 'Brandy', preset: P.popRnb, ambiguous: true },
  { name: 'Usher', preset: P.popRnb, ambiguous: true },
  { name: 'Chris Brown', preset: P.popRnb },
  { name: 'Tinashe', preset: P.popRnb },
  { name: 'The Weeknd', aliases: ['Weeknd'], preset: P.darkSynthRnb },
  { name: 'Frank Ocean', preset: P.altRnb },
  { name: 'Daniel Caesar', preset: P.altRnb },
  { name: 'Steve Lacy', preset: P.altRnb },
  { name: 'Giveon', preset: P.altRnb },
  { name: 'H.E.R.', aliases: ['H.E.R'], preset: P.altRnb, ambiguous: true },
  { name: 'Erykah Badu', preset: P.neoSoul },
  { name: "D'Angelo", aliases: ['DAngelo'], preset: P.neoSoul },
  { name: 'Jill Scott', preset: P.neoSoul },
  { name: 'Lauryn Hill', preset: P.neoSoul },
  { name: 'Alicia Keys', preset: P.neoSoul },
  { name: 'Taylor Swift', aliases: ['T Swift'], preset: P.confessionalPop },
  { name: 'Gracie Abrams', preset: P.confessionalPop },
  { name: 'Ed Sheeran', preset: P.acousticPop },
  { name: 'Shawn Mendes', preset: P.acousticPop },
  { name: 'Olivia Rodrigo', preset: P.angstyPopRock },
  { name: 'Avril Lavigne', preset: P.angstyPopRock },
  { name: 'Paramore', preset: P.angstyPopRock },
  { name: 'Billie Eilish', preset: P.darkMinimalPop },
  { name: 'Lorde', preset: P.darkMinimalPop },
  { name: 'Halsey', preset: P.darkMinimalPop },
  { name: 'Lana Del Rey', preset: P.cinematicDreamPop },
  { name: 'Clairo', preset: P.bedroomPop },
  { name: 'Beabadoobee', preset: P.bedroomPop },
  { name: 'Mac DeMarco', preset: P.bedroomPop },
  { name: 'Rex Orange County', preset: P.bedroomPop },
  { name: 'Harry Styles', preset: P.retroPopRock },
  { name: 'BTS', preset: P.kpop, ambiguous: true },
  { name: 'Blackpink', aliases: ['Black Pink'], preset: P.kpop },
  { name: 'NewJeans', aliases: ['New Jeans'], preset: P.kpop },
  { name: 'Stray Kids', preset: P.kpop },
  { name: 'Twice', preset: P.kpop, ambiguous: true },
  { name: 'Travis Scott', preset: P.melodicTrap },
  { name: 'Future', preset: P.melodicTrap, ambiguous: true },
  { name: 'Lil Baby', preset: P.melodicTrap },
  { name: 'Young Thug', preset: P.melodicTrap },
  { name: 'Gunna', preset: P.melodicTrap },
  { name: 'Playboi Carti', preset: P.melodicTrap },
  { name: 'Lil Uzi Vert', preset: P.melodicTrap },
  { name: '21 Savage', preset: P.melodicTrap },
  { name: 'Juice WRLD', preset: P.melodicTrap },
  { name: 'Post Malone', preset: P.melodicTrap },
  { name: 'Kendrick Lamar', aliases: ['Kendrick'], preset: P.lyricalRap },
  { name: 'J. Cole', aliases: ['J Cole'], preset: P.lyricalRap },
  { name: 'Nas', preset: P.lyricalRap, ambiguous: true },
  { name: 'Jay-Z', aliases: ['Jay Z'], preset: P.lyricalRap },
  { name: 'Tupac', aliases: ['2Pac'], preset: P.lyricalRap },
  { name: 'Biggie', aliases: ['Notorious B.I.G.', 'Biggie Smalls'], preset: P.lyricalRap },
  { name: 'Kanye West', aliases: ['Kanye'], preset: P.lyricalRap },
  { name: 'Drake', preset: P.moodyRap, ambiguous: true },
  { name: 'PartyNextDoor', preset: P.moodyRap },
  { name: 'Bryson Tiller', preset: P.moodyRap },
  { name: 'Eminem', preset: P.aggressiveRap },
  { name: 'DMX', preset: P.aggressiveRap },
  { name: 'Busta Rhymes', preset: P.aggressiveRap },
  { name: 'Nicki Minaj', preset: P.confidentRap },
  { name: 'Cardi B', preset: P.confidentRap },
  { name: 'Megan Thee Stallion', preset: P.confidentRap },
  { name: 'Doja Cat', preset: P.confidentRap },
  { name: 'Latto', preset: P.confidentRap },
  { name: 'Tyler, The Creator', aliases: ['Tyler the Creator'], preset: P.altHipHop },
  { name: 'Childish Gambino', preset: P.altHipHop },
  { name: 'Pop Smoke', preset: P.drill },
  { name: 'Central Cee', preset: P.drill },
  { name: 'Ice Spice', preset: P.drill },
  { name: 'Queen', preset: P.stadiumRock, ambiguous: true },
  { name: 'U2', preset: P.stadiumRock },
  { name: 'Bon Jovi', preset: P.stadiumRock },
  { name: 'Bruce Springsteen', aliases: ['Springsteen'], preset: P.stadiumRock },
  { name: 'Foo Fighters', preset: P.stadiumRock },
  { name: 'Kings of Leon', preset: P.stadiumRock },
  { name: 'The Beatles', aliases: ['Beatles'], preset: P.sixtiesRock },
  { name: 'The Beach Boys', aliases: ['Beach Boys'], preset: P.sixtiesRock },
  { name: 'The Rolling Stones', aliases: ['Rolling Stones'], preset: P.sixtiesRock },
  { name: 'AC/DC', preset: P.hardRock },
  { name: "Guns N' Roses", aliases: ['Guns N Roses', 'Guns and Roses'], preset: P.hardRock },
  { name: 'Led Zeppelin', preset: P.hardRock },
  { name: 'Aerosmith', preset: P.hardRock },
  { name: 'Van Halen', preset: P.hardRock },
  { name: 'Coldplay', preset: P.atmosphericRock },
  { name: 'Imagine Dragons', preset: P.atmosphericRock },
  { name: 'OneRepublic', aliases: ['One Republic'], preset: P.atmosphericRock },
  { name: 'The Killers', preset: P.atmosphericRock },
  { name: 'Nirvana', preset: P.nineties },
  { name: 'Pearl Jam', preset: P.nineties },
  { name: 'Smashing Pumpkins', preset: P.nineties },
  { name: 'Radiohead', preset: P.artRock },
  { name: 'Arctic Monkeys', preset: P.indieRock },
  { name: 'The Strokes', preset: P.indieRock },
  { name: 'Fleetwood Mac', preset: P.softRock },
  { name: 'Stevie Nicks', preset: P.softRock },
  { name: 'Eagles', preset: P.softRock, ambiguous: true },
  { name: 'Elton John', preset: P.pianoRock },
  { name: 'Billy Joel', preset: P.pianoRock },
  { name: 'Pink Floyd', preset: P.progRock },
  { name: 'David Bowie', aliases: ['Bowie'], preset: P.glamRock },
  { name: 'Metallica', preset: P.metal },
  { name: 'Iron Maiden', preset: P.metal },
  { name: 'Black Sabbath', preset: P.metal },
  { name: 'Slipknot', preset: P.metal },
  { name: 'Linkin Park', preset: P.numetal },
  { name: 'Green Day', preset: P.punk },
  { name: 'Blink-182', aliases: ['Blink 182'], preset: P.punk },
  { name: 'Ramones', preset: P.punk },
  { name: 'My Chemical Romance', aliases: ['MCR'], preset: P.emo },
  { name: 'Muse', preset: P.artRock, ambiguous: true },
  { name: 'Shania Twain', preset: P.countryPop },
  { name: 'Carrie Underwood', preset: P.countryPop },
  { name: 'Kacey Musgraves', preset: P.countryPop },
  { name: 'Morgan Wallen', preset: P.modernCountry },
  { name: 'Luke Combs', preset: P.modernCountry },
  { name: 'Chris Stapleton', preset: P.modernCountry },
  { name: 'Zach Bryan', preset: P.modernCountry },
  { name: 'Johnny Cash', preset: P.classicCountry },
  { name: 'Dolly Parton', aliases: ['Dolly'], preset: P.classicCountry },
  { name: 'Willie Nelson', preset: P.classicCountry },
  { name: 'Patsy Cline', preset: P.classicCountry },
  { name: 'Bon Iver', preset: P.indieFolk },
  { name: 'Fleet Foxes', preset: P.indieFolk },
  { name: 'Phoebe Bridgers', preset: P.indieFolk },
  { name: 'Hozier', preset: P.indieFolk },
  { name: 'Noah Kahan', preset: P.indieFolk },
  { name: 'The Lumineers', aliases: ['Lumineers'], preset: P.folkRock },
  { name: 'Mumford & Sons', aliases: ['Mumford and Sons'], preset: P.folkRock },
  { name: 'Bob Dylan', preset: P.indieFolk },
  { name: 'Joni Mitchell', preset: P.indieFolk },
  { name: 'Bad Bunny', preset: P.reggaeton },
  { name: 'J Balvin', preset: P.reggaeton },
  { name: 'Daddy Yankee', preset: P.reggaeton },
  { name: 'Karol G', preset: P.reggaeton },
  { name: 'Ozuna', preset: P.reggaeton },
  { name: 'Maluma', preset: P.reggaeton },
  { name: 'Shakira', preset: P.latinPop },
  { name: 'Enrique Iglesias', preset: P.latinPop },
  { name: 'Ricky Martin', preset: P.latinPop },
  { name: 'Rosalia', aliases: ['Rosalía'], preset: P.flamencoPop },
  { name: 'Burna Boy', preset: P.afrobeats },
  { name: 'Wizkid', preset: P.afrobeats },
  { name: 'Davido', preset: P.afrobeats },
  { name: 'Tems', preset: P.afrobeats },
  { name: 'Rema', preset: P.afrobeats },
  { name: 'Tyla', preset: P.amapiano },
  { name: 'Calvin Harris', preset: P.festivalEdm },
  { name: 'David Guetta', preset: P.festivalEdm },
  { name: 'Martin Garrix', preset: P.festivalEdm },
  { name: 'Marshmello', preset: P.festivalEdm },
  { name: 'Swedish House Mafia', preset: P.festivalEdm },
  { name: 'Zedd', preset: P.festivalEdm },
  { name: 'Avicii', preset: P.melodicHouse },
  { name: 'Kygo', preset: P.melodicHouse },
  { name: 'Fred again..', aliases: ['Fred again'], preset: P.melodicHouse },
  { name: 'Daft Punk', preset: P.frenchHouse },
  { name: 'Skrillex', preset: P.dubstep },
  { name: 'Bruno Mars', preset: P.funkPop },
  { name: 'Michael Jackson', preset: P.funkPop },
  { name: 'Prince', preset: P.funkPop, ambiguous: true },
  { name: 'Stevie Wonder', preset: P.funkPop },
  {
    name: 'Earth, Wind & Fire',
    aliases: ['Earth Wind and Fire', 'Earth Wind & Fire'],
    preset: P.funkPop
  },
  { name: 'Silk Sonic', preset: P.funkPop },
  { name: 'Lizzo', preset: P.funkPop },
  { name: 'Tame Impala', preset: P.psychPop },
  { name: 'MGMT', preset: P.psychPop },
  { name: 'The 1975', preset: P.psychPop },
  { name: 'Frank Sinatra', aliases: ['Sinatra'], preset: P.jazz },
  { name: 'Ella Fitzgerald', preset: P.jazz },
  { name: 'Billie Holiday', preset: P.jazz },
  { name: 'Louis Armstrong', preset: P.jazz },
  { name: 'Nat King Cole', preset: P.jazz },
  { name: 'Michael Buble', aliases: ['Michael Bublé', 'Buble', 'Bublé'], preset: P.jazz },
  { name: 'Norah Jones', preset: P.jazzPop },
  { name: 'Hans Zimmer', preset: P.orchestral },
  { name: 'John Williams', preset: P.orchestral },
  { name: 'Ludovico Einaudi', aliases: ['Einaudi'], preset: P.minimalPiano },
  { name: 'Bob Marley', preset: P.reggae },
  { name: 'Kirk Franklin', preset: P.gospel },
  { name: 'B.B. King', aliases: ['BB King'], preset: P.blues },
  { name: 'Stevie Ray Vaughan', preset: P.blues },
  { name: 'Enya', preset: P.ambientPop },
  { name: 'Bjork', aliases: ['Björk'], preset: P.ambientPop }
];

export type ArtistHit = { name: string; preset: StylePreset };
export type ArtistFix = { text: string; hits: ArtistHit[] };

/** Lower case without accents, same length as the input so match offsets map back to it. */
function fold(text: string): string {
  return text
    .split('')
    .map((c) => (c.normalize('NFD')[0] ?? c).toLowerCase()[0] ?? c)
    .join('');
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Name tokens joined so "AC/DC", "ac dc" and "acdc" all match. */
function namePattern(name: string): string {
  const tokens = fold(name)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return tokens.map(escape).join('[^a-z0-9]{0,3}');
}

const LEAD =
  '(?:(?:just|exactly|kind of|kinda|a bit)\\s+)?(?:similar to|in the style of|in the vein of|inspired by|reminiscent of|a la|like)\\s+(?:the\\s+)?';
const TAIL = "(?:['’]s)?(?:\\s+(?:voice|vocals?|style|sound|songs?|music|vibes?|type beat))?";
const SUFFIX = "(?:['’]s)?[\\s-]+(?:style|inspired|esque|type beat|type|vibes?|like)(?![a-z0-9])";

type Match = { start: number; end: number; kind: 'lead' | 'suffix' | 'bare'; entry: Entry };

const compiled = artistEntries.map((entry) => {
  const names = [entry.name, ...(entry.aliases ?? [])].map(namePattern);
  const name = `(?:${[...new Set(names)].sort((a, b) => b.length - a.length).join('|')})`;
  return {
    entry,
    lead: new RegExp(`(?<![a-z0-9])${LEAD}(${name})${TAIL}(?![a-z0-9])`, 'g'),
    suffix: new RegExp(`(?<![a-z0-9])(${name})${SUFFIX}`, 'g'),
    bare: new RegExp(`(?<![a-z0-9])(${name})(?:['’]s)?(?![a-z0-9])`, 'g')
  };
});

function nameStart(folded: string, match: RegExpExecArray): number {
  return match.index + match[0].indexOf(match[1]);
}

function findMatches(text: string): Match[] {
  const folded = fold(text);
  const found: Match[] = [];
  for (const { entry, lead, suffix, bare } of compiled) {
    const forms: [RegExp, Match['kind']][] = [
      [lead, 'lead'],
      [suffix, 'suffix']
    ];
    if (!entry.ambiguous) forms.push([bare, 'bare']);
    for (const [re, kind] of forms) {
      re.lastIndex = 0;
      for (let m = re.exec(folded); m; m = re.exec(folded)) {
        // Everyday words ("the queen", "the future") only count when written as a capitalised name.
        const typeBeat = kind === 'suffix' && m[0].endsWith('type beat');
        if (entry.ambiguous && !typeBeat && !/[A-Z0-9]/.test(text[nameStart(folded, m)] ?? ''))
          continue;
        found.push({ start: m.index, end: m.index + m[0].length, kind, entry });
      }
    }
  }
  // Prefer the longest match where they overlap ("like Adele's voice" over "Adele").
  found.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const kept: Match[] = [];
  for (const match of found) {
    const last = kept[kept.length - 1];
    if (last && match.start < last.end) continue;
    kept.push(match);
  }
  return kept;
}

function uniqueHits(matches: Match[]): ArtistHit[] {
  const out: ArtistHit[] = [];
  for (const { entry } of matches)
    if (!out.some((h) => h.name === entry.name))
      out.push({ name: entry.name, preset: entry.preset });
  return out;
}

export function findArtists(text: string): ArtistHit[] {
  return uniqueHits(findMatches(text));
}

function tidy(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ +([,.;:!?])/g, '$1')
    .replace(/([,;:])(?:\s*[,;:])+/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/^[\s,;:]+|[\s,;:]+$/g, '')
    .trim();
}

/** Rewrites a prompt without artist names: "like X" parts are removed and described at the end. */
export function rewritePrompt(text: string): ArtistFix {
  const matches = findMatches(text);
  if (matches.length === 0) return { text, hits: [] };
  let out = '';
  let at = 0;
  const appended: string[] = [];
  for (const match of matches) {
    let before = text.slice(at, match.start);
    // "sounds like X" keeps its verb: "sounds like moody synth r&b" reads better than a removal.
    const afterVerb = /\b(?:sound|sounds|sounding|feel|feels|feeling)\s+$/i.test(before);
    if (match.kind === 'lead' && afterVerb) {
      out += before + 'like ' + match.entry.preset.short;
    } else if (match.kind === 'bare') {
      const short = match.entry.preset.short;
      before = before.replace(/\b(an?)(\s+)$/i, (_all, article: string, space: string) => {
        const an = /^[aeiou]/i.test(short) ? 'an' : 'a';
        return (article[0] === 'A' ? an[0].toUpperCase() + an.slice(1) : an) + space;
      });
      out += before + short;
    } else {
      out += before;
      if (!appended.includes(match.entry.preset.description))
        appended.push(match.entry.preset.description);
    }
    at = match.end;
  }
  out += text.slice(at);
  let result = tidy(out);
  if (appended.length) result = result ? `${result}, ${appended.join(', ')}` : appended.join(', ');
  result = result.charAt(0).toUpperCase() + result.slice(1);
  return { text: result, hits: uniqueHits(matches) };
}

/** Drops tags that name an artist and adds the matching style tags, within the tag limit. */
export function rewriteTagText(tagText: string, extraHits: ArtistHit[] = []): ArtistFix {
  const hits: ArtistHit[] = [...extraHits];
  const kept: string[] = [];
  for (const tag of parseTags(tagText)) {
    const found = findArtists(tag);
    if (found.length === 0) kept.push(tag);
    for (const hit of found) if (!hits.some((h) => h.name === hit.name)) hits.push(hit);
  }
  let text = kept.join(', ');
  for (const hit of hits)
    for (const tag of hit.preset.tags) {
      if (parseTags(text).length >= MAX_STYLE_TAGS) break;
      if (!hasTag(text, tag)) text = text ? `${text}, ${tag}` : tag;
    }
  return { text, hits };
}
