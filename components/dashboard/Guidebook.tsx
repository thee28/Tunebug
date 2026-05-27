"use client";

import { motion } from "framer-motion";

const C = {
  primary: "#574eb1", primaryDim: "#c5c0ff",
  secondary: "#006c4e", secondaryDim: "#83f5c6",
  surfaceHigh: "#211F26", border: "#33313D",
  muted: "#938F99", text: "#f3eff5",
};

interface GlossaryTerm {
  term: string;
  definition: string;
  category: "Note" | "Interval" | "Chord" | "Concept" | "Symbol";
}

interface UnitGuide {
  icon: string;
  terms: GlossaryTerm[];
}

const CATEGORY_COLOR: Record<GlossaryTerm["category"], string> = {
  Note:     "#574eb1",
  Interval: "#006c4e",
  Chord:    "#7b3f00",
  Concept:  "#1a5c8a",
  Symbol:   "#6b2d7a",
};

const GLOSSARY: Record<string, UnitGuide> = {
  "beg-note-names": {
    icon: "music_note",
    terms: [
      { term: "Note",  definition: "A single musical sound with a specific pitch.", category: "Concept" },
      { term: "Pitch", definition: "How high or low a note sounds.", category: "Concept" },
      { term: "C",     definition: "First note of the musical alphabet — the 'home' tone of C major.", category: "Note" },
      { term: "D",     definition: "One whole step above C — slightly brighter in colour.", category: "Note" },
      { term: "E",     definition: "One whole step above D — bright and open-sounding.", category: "Note" },
      { term: "F",     definition: "Only a half step above E — the closest neighbour in this set.", category: "Note" },
    ],
  },
  "beg-c-major": {
    icon: "piano",
    terms: [
      { term: "Scale",     definition: "A sequence of notes arranged by pitch, going up or down.", category: "Concept" },
      { term: "C Major",   definition: "The most fundamental scale: C D E F G A B C — all white keys.", category: "Concept" },
      { term: "G",         definition: "Fifth note of the C major scale — stable and resonant.", category: "Note" },
      { term: "A",         definition: "Sixth note — used as the standard tuning reference (A440).", category: "Note" },
      { term: "B",         definition: "Seventh note — the leading tone that pulls back to C.", category: "Note" },
      { term: "Leading tone", definition: "The 7th note of a scale (B in C major) — creates tension that resolves to the octave.", category: "Concept" },
    ],
  },
  "beg-staff": {
    icon: "queue_music",
    terms: [
      { term: "Staff",        definition: "The five horizontal lines on which music is written.", category: "Symbol" },
      { term: "Treble Clef",  definition: "The curly symbol (𝄞) that marks the higher range — used for most melody instruments.", category: "Symbol" },
      { term: "Line notes",   definition: "Notes that sit on a line of the staff: E G B D F (Every Good Boy Does Fine).", category: "Concept" },
      { term: "Space notes",  definition: "Notes that sit in the spaces: F A C E — they spell 'FACE'.", category: "Concept" },
      { term: "Ledger line",  definition: "A short extra line above or below the staff for notes outside the five lines.", category: "Symbol" },
    ],
  },
  "beg-singing": {
    icon: "mic",
    terms: [
      { term: "Pitch match",  definition: "Adjusting your voice until it lands exactly on a target note.", category: "Concept" },
      { term: "Intonation",   definition: "How accurately you hit the intended pitch — 'good intonation' means in tune.", category: "Concept" },
      { term: "C (middle C)", definition: "C4 — the C nearest the middle of the piano, a comfortable starting point for singing.", category: "Note" },
      { term: "E",            definition: "A bright vowel-friendly note, 4 semitones above C.", category: "Note" },
      { term: "G",            definition: "7 semitones above C — the 'open fifth' feel that's easy to hold.", category: "Note" },
      { term: "A",            definition: "9 semitones above C — the standard tuning reference pitch.", category: "Note" },
    ],
  },
  "beg-octave": {
    icon: "unfold_more",
    terms: [
      { term: "Octave",     definition: "12 half steps — the same note name, but exactly twice the frequency.", category: "Interval" },
      { term: "C4",         definition: "Middle C — the C in the fourth octave, in the middle of the piano.", category: "Note" },
      { term: "C5",         definition: "The C one octave above middle C — same character, higher register.", category: "Note" },
      { term: "Frequency",  definition: "The number of vibrations per second — doubling it raises pitch by one octave.", category: "Concept" },
      { term: "Register",   definition: "The general high/low range of a note or voice.", category: "Concept" },
    ],
  },
  "elem-sharps-flats": {
    icon: "music_note",
    terms: [
      { term: "Sharp (♯)",   definition: "Raises a note by one half step — the black key just above a white key.", category: "Symbol" },
      { term: "Flat (♭)",    definition: "Lowers a note by one half step — the black key just below a white key.", category: "Symbol" },
      { term: "Half step",   definition: "The smallest interval in Western music — one key to the very next key on a piano.", category: "Interval" },
      { term: "Accidental",  definition: "A sharp, flat, or natural sign placed before a note to alter its pitch.", category: "Symbol" },
      { term: "C#",          definition: "One half step above C — the black key between C and D.", category: "Note" },
      { term: "F#",          definition: "One half step above F — the black key between F and G.", category: "Note" },
      { term: "A# / B♭",    definition: "Enharmonic pair — same pitch, different names depending on context.", category: "Note" },
      { term: "Enharmonic",  definition: "Two notes that sound identical but are spelled differently (e.g. F# and G♭).", category: "Concept" },
    ],
  },
  "elem-perfect-intervals": {
    icon: "compare_arrows",
    terms: [
      { term: "Interval",       definition: "The distance in pitch between two notes.", category: "Interval" },
      { term: "Perfect Fourth", definition: "5 half steps — sounds stable and open (e.g. C → F). Think 'Here Comes the Bride'.", category: "Interval" },
      { term: "Perfect Fifth",  definition: "7 half steps — very resonant and stable (e.g. C → G). The foundation of power chords.", category: "Interval" },
      { term: "Whole step",     definition: "Two half steps — the gap between most adjacent letter names (e.g. C→D).", category: "Interval" },
      { term: "Consonance",     definition: "Notes that sound stable and pleasant together — perfect intervals are highly consonant.", category: "Concept" },
    ],
  },
  "elem-chords": {
    icon: "library_music",
    terms: [
      { term: "Chord",        definition: "Two or more notes played at the same time.", category: "Chord" },
      { term: "Dyad",         definition: "A two-note chord — the simplest harmonic building block.", category: "Chord" },
      { term: "Power chord",  definition: "Root + Perfect 5th (e.g. C + G) — common in rock; has no 3rd so it's neither major nor minor.", category: "Chord" },
      { term: "Major triad",  definition: "Root + Major 3rd + Perfect 5th (e.g. C–E–G) — bright and happy-sounding.", category: "Chord" },
      { term: "Root",         definition: "The note a chord is built from and named after.", category: "Concept" },
      { term: "Third",        definition: "The second note in a triad — 3 or 4 half steps above the root; defines major/minor quality.", category: "Concept" },
    ],
  },
  "elem-sight-reading": {
    icon: "queue_music",
    terms: [
      { term: "Sight reading", definition: "Playing or singing music from a score without prior practice.", category: "Concept" },
      { term: "A",             definition: "Sits in the second space of the treble staff.", category: "Note" },
      { term: "B",             definition: "Sits on the middle line of the treble staff.", category: "Note" },
      { term: "C5",            definition: "One octave above middle C — sits on the third space of the treble staff.", category: "Note" },
      { term: "Natural (♮)",   definition: "Cancels a previous sharp or flat, returning the note to its unaltered pitch.", category: "Symbol" },
    ],
  },
  "elem-singing-steps": {
    icon: "mic",
    terms: [
      { term: "Step",          definition: "Moving to the next adjacent note — either a half step or whole step.", category: "Concept" },
      { term: "Skip",          definition: "Moving to a note more than a step away — jumping over at least one letter name.", category: "Concept" },
      { term: "D",             definition: "One whole step above C — requires a slight upward lift from C.", category: "Note" },
      { term: "F",             definition: "One whole step above E (or a half step above E) — F is a half step above E.", category: "Note" },
      { term: "B",             definition: "Leading tone of C major — naturally wants to resolve upward to C.", category: "Note" },
      { term: "D5",            definition: "D in the fifth octave — one octave above D4, requires good breath support.", category: "Note" },
    ],
  },
  "int-thirds": {
    icon: "compare_arrows",
    terms: [
      { term: "Major 3rd",  definition: "4 half steps — bright and happy (e.g. C → E). The defining interval of a major chord.", category: "Interval" },
      { term: "Minor 3rd",  definition: "3 half steps — darker, more introspective (e.g. D → F). Defines minor chords.", category: "Interval" },
      { term: "Major 6th",  definition: "9 half steps — warm and song-like (e.g. C → A). Think 'My Bonnie Lies Over the Ocean'.", category: "Interval" },
      { term: "Quality",    definition: "Whether an interval is major, minor, perfect, augmented, or diminished.", category: "Concept" },
    ],
  },
  "int-triads": {
    icon: "library_music",
    terms: [
      { term: "Triad",        definition: "A three-note chord built in thirds: Root–Third–Fifth.", category: "Chord" },
      { term: "Major triad",  definition: "Major 3rd + minor 3rd from the root (e.g. C–E–G) — bright quality.", category: "Chord" },
      { term: "Minor triad",  definition: "Minor 3rd + major 3rd from the root (e.g. D–F–A) — darker quality.", category: "Chord" },
      { term: "Fifth",        definition: "The top note of a triad — always a perfect 5th above the root in major/minor triads.", category: "Concept" },
      { term: "Harmony",      definition: "The sound of two or more notes together — chords are the building blocks of harmony.", category: "Concept" },
    ],
  },
  "int-tritone": {
    icon: "warning",
    terms: [
      { term: "Tritone",            definition: "6 half steps — exactly half an octave. The most dissonant interval in Western music.", category: "Interval" },
      { term: "Augmented 4th",      definition: "Another name for the tritone when spelled upward (e.g. C → F#).", category: "Interval" },
      { term: "Diminished 5th",     definition: "Another name for the tritone when spelled downward (e.g. B → F).", category: "Interval" },
      { term: "Dissonance",         definition: "A tense, unstable sound created by certain interval combinations.", category: "Concept" },
      { term: "Diabolus in musica", definition: "Latin for 'the devil in music' — the medieval nickname for the tritone due to its harsh sound.", category: "Concept" },
      { term: "F#",                 definition: "A half step above F — forms a tritone with C.", category: "Note" },
    ],
  },
  "int-sight-sharps": {
    icon: "queue_music",
    terms: [
      { term: "F# on staff", definition: "F# sits on the first line of the treble staff — same position as F but with a sharp sign.", category: "Note" },
      { term: "C# on staff", definition: "C# sits on the third space — same position as C but raised a half step.", category: "Note" },
      { term: "G# on staff", definition: "G# sits on the second line — just above the G space.", category: "Note" },
      { term: "Key signature", definition: "Sharps or flats listed at the start of each line, applying to those notes throughout.", category: "Symbol" },
    ],
  },
  "int-singing-intervals": {
    icon: "mic",
    terms: [
      { term: "Perfect 4th",  definition: "5 semitones — 'Here Comes the Bride'. Sing from do to fa in solfege.", category: "Interval" },
      { term: "Perfect 5th",  definition: "7 semitones — 'Twinkle Twinkle Little Star' opening jump.", category: "Interval" },
      { term: "Major 3rd",    definition: "4 semitones — 'When the Saints Go Marching In'. The happy-sounding skip.", category: "Interval" },
      { term: "Solfege",      definition: "A vocal system using syllables Do Re Mi Fa Sol La Ti to name scale degrees.", category: "Concept" },
      { term: "Intonation",   definition: "Accuracy of pitch — singing in tune means matching the target frequency precisely.", category: "Concept" },
    ],
  },
  "upper-all-intervals": {
    icon: "compare_arrows",
    terms: [
      { term: "Major 2nd",  definition: "2 half steps — a whole step (e.g. C → D). The building block of scales.", category: "Interval" },
      { term: "Minor 6th",  definition: "8 half steps — sombre and expressive (e.g. E → C).", category: "Interval" },
      { term: "Minor 7th",  definition: "10 half steps — bluesy and unresolved (e.g. C → A#). Core of dominant 7th chords.", category: "Interval" },
      { term: "Major 7th",  definition: "11 half steps — dreamy tension, one half step below the octave (e.g. C → B).", category: "Interval" },
    ],
  },
  "upper-seventh-chords": {
    icon: "library_music",
    terms: [
      { term: "Seventh chord",   definition: "A triad plus a 7th above the root — four notes total.", category: "Chord" },
      { term: "Major 7th chord", definition: "Major triad + major 7th (e.g. C–E–G–B) — lush and jazzy.", category: "Chord" },
      { term: "Dominant 7th",    definition: "Major triad + minor 7th (e.g. C–E–G–A#) — tense, strongly wants to resolve.", category: "Chord" },
      { term: "Minor 7th chord", definition: "Minor triad + minor 7th (e.g. D–F–A–C) — smooth and soulful.", category: "Chord" },
      { term: "Resolution",      definition: "The movement from a tense chord (like dominant 7th) to a stable one.", category: "Concept" },
    ],
  },
  "upper-compound-intervals": {
    icon: "compare_arrows",
    terms: [
      { term: "Minor 2nd", definition: "1 half step — the smallest interval; very dissonant (e.g. E → F).", category: "Interval" },
      { term: "Minor 3rd", definition: "3 half steps — darker than a major 3rd; the defining interval of minor chords.", category: "Interval" },
      { term: "Major 6th", definition: "9 half steps — warm and singable (e.g. C → A or D → B).", category: "Interval" },
      { term: "Minor 6th", definition: "8 half steps — melancholic colour (e.g. E → C).", category: "Interval" },
    ],
  },
  "upper-sight-high": {
    icon: "queue_music",
    terms: [
      { term: "D5", definition: "4th line of the treble staff — one octave above D4.", category: "Note" },
      { term: "F5", definition: "4th space of the treble staff — high and bright.", category: "Note" },
      { term: "A5", definition: "Sits on the first ledger line above the staff.", category: "Note" },
      { term: "G5", definition: "Sits just above the top line of the staff.", category: "Note" },
      { term: "High register", definition: "Notes above the staff requiring faster breath support and a raised soft palate when singing.", category: "Concept" },
    ],
  },
  "upper-chromatic-singing": {
    icon: "mic",
    terms: [
      { term: "Chromatic",  definition: "Using all 12 half steps — including the black keys (sharps and flats).", category: "Concept" },
      { term: "A# / B♭",   definition: "10 semitones above C — a flat, melancholy colour in most contexts.", category: "Note" },
      { term: "C#",         definition: "1 semitone above C — adds a bright tension to the C major environment.", category: "Note" },
      { term: "F#",         definition: "6 semitones above C — the tritone away from C, very distinctive.", category: "Note" },
      { term: "Microtonality", definition: "Precision in hitting exactly the right frequency — chromatic notes require fine ear control.", category: "Concept" },
    ],
  },
  "adv-all-intervals": {
    icon: "compare_arrows",
    terms: [
      { term: "Minor 6th",  definition: "8 half steps — 5 down is easier to hear (e.g. E → C going down is a major 3rd).", category: "Interval" },
      { term: "Minor 7th",  definition: "10 half steps — the blues interval; found in all dominant 7th chords.", category: "Interval" },
      { term: "Major 6th",  definition: "9 half steps — can be heard as a minor 3rd going down (C → A equals A → C descending).", category: "Interval" },
      { term: "Inversion",  definition: "Flipping an interval upside-down — a major 3rd inverts to a minor 6th (both sum to 9).", category: "Concept" },
    ],
  },
  "adv-complex-chords": {
    icon: "library_music",
    terms: [
      { term: "Diminished triad", definition: "Minor 3rd + minor 3rd (e.g. D–F–G#) — very tense and unstable.", category: "Chord" },
      { term: "Augmented triad",  definition: "Major 3rd + major 3rd (e.g. C–E–G#) — dreamlike and ambiguous.", category: "Chord" },
      { term: "Add 9 chord",      definition: "A triad with the 9th (2nd an octave up) added — lush without full 7th complexity.", category: "Chord" },
      { term: "Tension note",     definition: "A note added to a chord that creates harmonic colour and pull toward resolution.", category: "Concept" },
    ],
  },
  "adv-melodic-sight": {
    icon: "queue_music",
    terms: [
      { term: "E5",          definition: "Sits on the top line of the treble staff — very high and bright.", category: "Note" },
      { term: "F#5",         definition: "One space above the top line — requires a ledger-line-aware eye.", category: "Note" },
      { term: "G5",          definition: "One ledger line above the staff.", category: "Note" },
      { term: "A5",          definition: "First ledger line above — the highest commonly notated vocal note.", category: "Note" },
      { term: "Melodic reading", definition: "Sight-reading a single-voice melody — combining note identification with rhythm.", category: "Concept" },
    ],
  },
  "adv-chromatic-mastery": {
    icon: "mic",
    terms: [
      { term: "D#",         definition: "3 half steps above C — enharmonic with E♭, common in minor contexts.", category: "Note" },
      { term: "G#",         definition: "8 half steps above C — the 'blue note' feel; defines augmented chords with C.", category: "Note" },
      { term: "E5",         definition: "High E — requires excellent breath control and a relaxed open throat.", category: "Note" },
      { term: "G5",         definition: "Very high G — approaches the top of the classical soprano range.", category: "Note" },
      { term: "Vibrato",    definition: "A slight natural oscillation in pitch that adds warmth and expressiveness to sustained notes.", category: "Concept" },
    ],
  },
  "adv-expert-ear": {
    icon: "hearing",
    terms: [
      { term: "Relative pitch",  definition: "Identifying intervals by comparing two notes — the skill behind all ear training.", category: "Concept" },
      { term: "Absolute pitch",  definition: "Recognising a note's name without a reference tone — rare but trainable.", category: "Concept" },
      { term: "Interval sprint", definition: "Identifying intervals rapidly without extended listening time — the expert goal.", category: "Concept" },
      { term: "Ear training",    definition: "The practice of developing musical perception through repeated listening exercises.", category: "Concept" },
    ],
  },
};

const FALLBACK: UnitGuide = {
  icon: "menu_book",
  terms: [
    { term: "Note",     definition: "A single musical sound with a defined pitch.", category: "Concept" },
    { term: "Interval", definition: "The distance in pitch between two notes.", category: "Interval" },
    { term: "Chord",    definition: "Two or more notes played simultaneously.", category: "Chord" },
  ],
};

interface Props {
  unitSlug: string;
  unitTitle: string;
  stageTitle: string;
}

export default function Guidebook({ unitSlug, unitTitle, stageTitle }: Props) {
  const guide = GLOSSARY[unitSlug] ?? FALLBACK;

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 18, flexShrink: 0,
          backgroundColor: C.primary,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 30, color: "white", fontVariationSettings: "'FILL' 1" }}>
            {guide.icon}
          </span>
        </div>
        <div>
          <p style={{ color: C.muted, fontFamily: "'Nunito', sans-serif", fontSize: 12, fontWeight: 700, margin: "0 0 3px" }}>
            {stageTitle}
          </p>
          <h2 style={{ color: C.text, fontFamily: "'Nunito', sans-serif", fontSize: 20, fontWeight: 900, margin: 0 }}>
            {unitTitle} Guidebook
          </h2>
        </div>
      </div>

      <div style={{ height: 1, backgroundColor: C.border, marginBottom: 24 }} />

      {/* Category label */}
      <p style={{
        color: C.primaryDim, fontFamily: "'Nunito', sans-serif",
        fontSize: 11, fontWeight: 800, textTransform: "uppercase",
        letterSpacing: "0.1em", margin: "0 0 14px",
      }}>
        Key Terms
      </p>

      {/* Term cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {guide.terms.map((item, i) => (
          <motion.div
            key={item.term}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
          >
            <div style={{
              backgroundColor: C.surfaceHigh,
              border: `2px solid ${C.border}`,
              borderRadius: 14,
              padding: "14px 16px",
              display: "flex", alignItems: "flex-start", gap: 12,
            }}>
              <div style={{
                backgroundColor: CATEGORY_COLOR[item.category],
                borderRadius: 8,
                padding: "3px 10px",
                flexShrink: 0,
                alignSelf: "flex-start",
                marginTop: 1,
              }}>
                <span style={{
                  color: "white", fontFamily: "'Nunito', sans-serif",
                  fontSize: 13, fontWeight: 900,
                }}>
                  {item.term}
                </span>
              </div>
              <p style={{
                color: C.muted, fontFamily: "'Nunito', sans-serif",
                fontSize: 13, margin: 0, lineHeight: 1.55,
              }}>
                {item.definition}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
