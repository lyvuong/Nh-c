import type { DBSong } from './db';

export const SAMPLE_SONGS: Omit<DBSong, 'id'>[] = [
  {
    title: 'Hotel California',
    artist: 'Eagles',
    key: 'Bm',
    originalKey: 'Bm',
    capo: 0,
    tempo: '75',
    timeSignature: '4/4',
    folderName: 'Classic Rock',
    fileName: 'Hotel California.cho',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isFavorite: true,
    content: `{title: Hotel California}
{artist: Eagles}
{key: Bm}
{capo: 0}
{tempo: 75}
{time: 4/4}

{comment: Intro (12-string Guitar)}
[Bm]   [F#7]   [A]   [E7]   [G]   [D]   [Em]   [F#7]

{start_of_verse}
[Bm]On a dark desert highway, [F#7]cool wind in my hair
[A]Warm smell of colitas, [E7]rising up through the air
[G]Up ahead in the distance, [D]I saw a shimmering light
[Em]My head grew heavy and my sight grew dim, [F#7]I had to stop for the night
{end_of_verse}

{start_of_verse}
[Bm]There she stood in the doorway, [F#7]I heard the mission bell
[A]And I was thinking to myself, this could be [E7]Heaven or this could be Hell
[G]Then she lit up a candle, [D]and she showed me the way
[Em]There were voices down the corridor, [F#7]I thought I heard them say...
{end_of_verse}

{start_of_chorus}
[G]Welcome to the Hotel Cali[D]fornia
Such a [F#7]lovely place (such a lovely place), such a [Bm]lovely face
[G]Plenty of room at the Hotel Cali[D]fornia
Any [Em]time of year (any time of year), you can [F#7]find it here
{end_of_chorus}

{start_of_verse}
[Bm]Her mind is Tiffany-twisted, [F#7]she got the Mercedes bends
[A]She got a lot of pretty, pretty boys, [E7]that she calls friends
[G]How they dance in the courtyard, [D]sweet summer sweat
[Em]Some dance to remember, [F#7]some dance to forget
{end_of_verse}

{start_of_chorus}
[G]Welcome to the Hotel Cali[D]fornia
Such a [F#7]lovely place (such a lovely place), such a [Bm]lovely face
They're [G]livin' it up at the Hotel Cali[D]fornia
What a [Em]nice surprise (what a nice surprise), bring your [F#7]alibis
{end_of_chorus}

{comment: Guitar Solo}
[Bm]   [F#7]   [A]   [E7]   [G]   [D]   [Em]   [F#7]`
  },
  {
    title: 'Stand by Me',
    artist: 'Ben E. King',
    key: 'A',
    originalKey: 'A',
    capo: 2,
    tempo: '118',
    timeSignature: '4/4',
    folderName: 'Soul & Motown',
    fileName: 'Stand by Me.cho',
    createdAt: Date.now() - 1000,
    updatedAt: Date.now() - 1000,
    isFavorite: true,
    content: `{title: Stand by Me}
{artist: Ben E. King}
{key: A}
{capo: 2}
{tempo: 118}
{time: 4/4}

{comment: Bass Riff: A - F#m - D - E - A}

{start_of_verse}
When the [A]night has come [F#m]and the land is dark
And the [D]moon is the [E]only light we'll [A]see
No I [A]won't be afraid, no I [F#m]won't be afraid
Just as [D]long as you [E]stand, stand by [A]me
{end_of_verse}

{start_of_chorus}
So darling, darling, [A]stand by me, oh [F#m]stand by me
Oh [D]stand, [E]stand by me, [A]stand by me
{end_of_chorus}

{start_of_verse}
If the [A]sky that we look upon [F#m]should tumble and fall
Or the [D]mountain should [E]crumble to the [A]sea
I won't [A]cry, I won't cry, no I [F#m]won't shed a tear
Just as [D]long as you [E]stand, stand by [A]me
{end_of_verse}

{start_of_chorus}
And darling, darling, [A]stand by me, oh [F#m]stand by me
Oh [D]stand, [E]stand by me, [A]stand by me
{end_of_chorus}

{comment: Strings & Guitar Solo}
[A]    [F#m]    [D]  [E]  [A]`
  },
  {
    title: 'Hallelujah',
    artist: 'Leonard Cohen',
    key: 'C',
    originalKey: 'C',
    capo: 0,
    tempo: '55',
    timeSignature: '6/8',
    folderName: 'Acoustic & Folk',
    fileName: 'Hallelujah.cho',
    createdAt: Date.now() - 2000,
    updatedAt: Date.now() - 2000,
    isFavorite: false,
    content: `{title: Hallelujah}
{artist: Leonard Cohen}
{key: C}
{capo: 0}
{tempo: 55}
{time: 6/8}

{start_of_verse}
I've [C]heard there was a [Am]secret chord
That [C]David played, and it [Am]pleased the Lord
But [F]you don't really [G]care for music, [C]do you? [G]
It [C]goes like this, the [F]fourth, the [G]fifth
The [Am]minor fall, the [F]major lift
The [G]baffled king com[E7]posing Halle[Am]lujah
{end_of_verse}

{start_of_chorus}
Halle[F]lujah, Halle[Am]lujah
Halle[F]lujah, Halle[C]lu---[G]--[C]jah [G]
{end_of_chorus}

{start_of_verse}
Your [C]faith was strong but you [Am]needed proof
You [C]saw her bathing [Am]on the roof
Her [F]beauty and the [G]moonlight over[C]threw you [G]
She [C]tied you to a [F]kitchen [G]chair
She [Am]broke your throne, and she [F]cut your hair
And [G]from your lips she [E7]drew the Halle[Am]lujah
{end_of_verse}

{start_of_chorus}
Halle[F]lujah, Halle[Am]lujah
Halle[F]lujah, Halle[C]lu---[G]--[C]jah
{end_of_chorus}`
  },
  {
    title: 'Let It Be',
    artist: 'The Beatles',
    key: 'C',
    originalKey: 'C',
    capo: 0,
    tempo: '72',
    timeSignature: '4/4',
    folderName: 'Classic Rock',
    fileName: 'Let It Be.cho',
    createdAt: Date.now() - 3000,
    updatedAt: Date.now() - 3000,
    isFavorite: true,
    content: `{title: Let It Be}
{artist: The Beatles}
{key: C}
{tempo: 72}
{time: 4/4}

{comment: Piano Intro}
[C]  [G]  [Am]  [F]  [C]  [G]  [F]  [C/E]  [Dm7]  [C]

{start_of_verse}
When I [C]find myself in [G]times of trouble, [Am]Mother Mary [F]comes to me
[C]Speaking words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]
And [C]in my hour of [G]darkness she is [Am]standing right in [F]front of me
[C]Speaking words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]
{end_of_verse}

{start_of_chorus}
Let it [Am]be, let it [G]be, let it [F]be, let it [C]be
[C]Whisper words of [G]wisdom, let it [F]be [C/E] [Dm7] [C]
{end_of_chorus}

{start_of_verse}
And [C]when the broken [G]hearted people [Am]living in the [F]world agree
[C]There will be an [G]answer, let it [F]be [C/E] [Dm7] [C]
For [C]though they may be [G]parted, there is [Am]still a chance that [F]they will see
[C]There will be an [G]answer, let it [F]be [C/E] [Dm7] [C]
{end_of_verse}

{start_of_chorus}
Let it [Am]be, let it [G]be, let it [F]be, let it [C]be
[C]There will be an [G]answer, let it [F]be [C/E] [Dm7] [C]
{end_of_chorus}`
  }
];

export async function initDefaultData(dbInstance: typeof import('./db').db) {
  const count = await dbInstance.songs.count();
  if (count === 0) {
    await dbInstance.songs.bulkAdd(SAMPLE_SONGS as DBSong[]);
    
    // Also create a sample Setlist
    const allSongs = await dbInstance.songs.toArray();
    await dbInstance.setlists.add({
      name: 'Saturday Gig @ Downtown Lounge',
      description: 'First set - Acoustic / Warmup',
      gigDate: new Date().toISOString().split('T')[0],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      songs: allSongs.map(s => ({ songId: s.id! })),
    });
  }
}
