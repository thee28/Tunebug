"use client";

import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";

const C = {
  primary: "#574eb1", primaryDim: "#c5c0ff",
  secondary: "#006c4e", secondaryDim: "#83f5c6",
  surfaceHigh: "var(--c-surface-high)", border: "var(--c-border)",
  muted: "var(--c-muted)", text: "var(--c-text)",
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
      { term: "C",     definition: "The first note of the musical alphabet and the home tone of C major.", category: "Note" },
      { term: "D",     definition: "One whole step above C, with a slightly brighter colour.", category: "Note" },
      { term: "E",     definition: "One whole step above D. Bright and open-sounding.", category: "Note" },
      { term: "F",     definition: "Only a half step above E, making it the closest neighbour in this set.", category: "Note" },
    ],
  },
  "beg-c-major": {
    icon: "piano",
    terms: [
      { term: "Scale",     definition: "A sequence of notes arranged by pitch, going up or down.", category: "Concept" },
      { term: "C Major",   definition: "The most fundamental scale: C D E F G A B C. All white keys on the piano.", category: "Concept" },
      { term: "G",         definition: "The fifth note of the C major scale. Stable and resonant.", category: "Note" },
      { term: "A",         definition: "The sixth note of the C major scale, used as the standard tuning reference (A440).", category: "Note" },
      { term: "B",         definition: "The seventh note and the leading tone that naturally pulls back to C.", category: "Note" },
      { term: "Leading tone", definition: "The 7th note of a scale (B in C major). It creates tension that resolves up to the octave.", category: "Concept" },
    ],
  },
  "beg-staff": {
    icon: "queue_music",
    terms: [
      { term: "Staff",        definition: "The five horizontal lines on which music is written.", category: "Symbol" },
      { term: "Treble Clef",  definition: "The curly symbol (𝄞) that marks the higher range. Used for most melody instruments.", category: "Symbol" },
      { term: "Line notes",   definition: "Notes that sit on a line of the staff: E G B D F (Every Good Boy Does Fine).", category: "Concept" },
      { term: "Space notes",  definition: "Notes that sit in the spaces: F A C E, which spell the word FACE.", category: "Concept" },
      { term: "Ledger line",  definition: "A short extra line above or below the staff for notes outside the five lines.", category: "Symbol" },
    ],
  },
  "beg-singing": {
    icon: "mic",
    terms: [
      { term: "Pitch match",  definition: "Adjusting your voice until it lands exactly on a target note.", category: "Concept" },
      { term: "Intonation",   definition: "How accurately you hit the intended pitch. Good intonation means being in tune.", category: "Concept" },
      { term: "C (middle C)", definition: "C4, the C nearest the middle of the piano and a comfortable starting point for singing.", category: "Note" },
      { term: "E",            definition: "A bright vowel-friendly note, 4 semitones above C.", category: "Note" },
      { term: "G",            definition: "7 semitones above C. The open fifth feel that is easy to hold.", category: "Note" },
      { term: "A",            definition: "9 semitones above C and the standard tuning reference pitch.", category: "Note" },
    ],
  },
  "beg-octave": {
    icon: "unfold_more",
    terms: [
      { term: "Octave",     definition: "12 half steps. The same note name but exactly twice the frequency.", category: "Interval" },
      { term: "C4",         definition: "Middle C, the C in the fourth octave, sitting in the middle of the piano.", category: "Note" },
      { term: "C5",         definition: "The C one octave above middle C. Same character, just a higher register.", category: "Note" },
      { term: "Frequency",  definition: "The number of vibrations per second. Doubling it raises the pitch by one octave.", category: "Concept" },
      { term: "Register",   definition: "The general high or low range of a note or voice.", category: "Concept" },
    ],
  },
  "elem-sharps-flats": {
    icon: "music_note",
    terms: [
      { term: "Sharp (♯)",   definition: "Raises a note by one half step. It is the black key just above a white key.", category: "Symbol" },
      { term: "Flat (♭)",    definition: "Lowers a note by one half step. It is the black key just below a white key.", category: "Symbol" },
      { term: "Half step",   definition: "The smallest interval in Western music, from one key to the very next key on a piano.", category: "Interval" },
      { term: "Accidental",  definition: "A sharp, flat, or natural sign placed before a note to alter its pitch.", category: "Symbol" },
      { term: "C#",          definition: "One half step above C. The black key between C and D.", category: "Note" },
      { term: "F#",          definition: "One half step above F. The black key between F and G.", category: "Note" },
      { term: "A# / B♭",    definition: "An enharmonic pair with the same pitch but different names depending on context.", category: "Note" },
      { term: "Enharmonic",  definition: "Two notes that sound identical but are spelled differently, like F# and G♭.", category: "Concept" },
    ],
  },
  "elem-perfect-intervals": {
    icon: "compare_arrows",
    terms: [
      { term: "Interval",       definition: "The distance in pitch between two notes.", category: "Interval" },
      { term: "Perfect Fourth", definition: "5 half steps. Sounds stable and open (e.g. C to F). Think 'Here Comes the Bride'.", category: "Interval" },
      { term: "Perfect Fifth",  definition: "7 half steps. Very resonant and stable (e.g. C to G). The foundation of power chords.", category: "Interval" },
      { term: "Whole step",     definition: "Two half steps, the gap between most adjacent letter names (e.g. C to D).", category: "Interval" },
      { term: "Consonance",     definition: "Notes that sound stable and pleasant together. Perfect intervals are highly consonant.", category: "Concept" },
    ],
  },
  "elem-chords": {
    icon: "library_music",
    terms: [
      { term: "Chord",        definition: "Two or more notes played at the same time.", category: "Chord" },
      { term: "Dyad",         definition: "A two-note chord, the simplest harmonic building block.", category: "Chord" },
      { term: "Power chord",  definition: "Root plus a Perfect 5th (e.g. C + G). Common in rock and has no 3rd, so it is neither major nor minor.", category: "Chord" },
      { term: "Major triad",  definition: "Root, Major 3rd, and Perfect 5th (e.g. C, E, G). Bright and happy-sounding.", category: "Chord" },
      { term: "Root",         definition: "The note a chord is built from and named after.", category: "Concept" },
      { term: "Third",        definition: "The second note in a triad, sitting 3 or 4 half steps above the root. It defines the major or minor quality.", category: "Concept" },
    ],
  },
  "elem-sight-reading": {
    icon: "queue_music",
    terms: [
      { term: "Sight reading", definition: "Playing or singing music from a score without prior practice.", category: "Concept" },
      { term: "A",             definition: "Sits in the second space of the treble staff.", category: "Note" },
      { term: "B",             definition: "Sits on the middle line of the treble staff.", category: "Note" },
      { term: "C5",            definition: "One octave above middle C, sitting on the third space of the treble staff.", category: "Note" },
      { term: "Natural (♮)",   definition: "Cancels a previous sharp or flat, returning the note to its unaltered pitch.", category: "Symbol" },
    ],
  },
  "elem-singing-steps": {
    icon: "mic",
    terms: [
      { term: "Step",          definition: "Moving to the next adjacent note, either a half step or whole step.", category: "Concept" },
      { term: "Skip",          definition: "Moving to a note more than a step away, jumping over at least one letter name.", category: "Concept" },
      { term: "D",             definition: "One whole step above C, requiring a slight upward lift from C.", category: "Note" },
      { term: "F",             definition: "A half step above E, the smallest possible move upward from E.", category: "Note" },
      { term: "B",             definition: "The leading tone of C major that naturally wants to resolve upward to C.", category: "Note" },
      { term: "D5",            definition: "D in the fifth octave, one octave above D4. Requires good breath support.", category: "Note" },
    ],
  },
  "int-thirds": {
    icon: "compare_arrows",
    terms: [
      { term: "Major 3rd",  definition: "4 half steps. Bright and happy-sounding (e.g. C to E) and the defining interval of a major chord.", category: "Interval" },
      { term: "Minor 3rd",  definition: "3 half steps. Darker and more introspective (e.g. D to F). Defines minor chords.", category: "Interval" },
      { term: "Major 6th",  definition: "9 half steps. Warm and song-like (e.g. C to A). Think 'My Bonnie Lies Over the Ocean'.", category: "Interval" },
      { term: "Quality",    definition: "Whether an interval is major, minor, perfect, augmented, or diminished.", category: "Concept" },
    ],
  },
  "int-triads": {
    icon: "library_music",
    terms: [
      { term: "Triad",        definition: "A three-note chord built in thirds: Root, Third, and Fifth.", category: "Chord" },
      { term: "Major triad",  definition: "Major 3rd plus minor 3rd from the root (e.g. C, E, G). Has a bright quality.", category: "Chord" },
      { term: "Minor triad",  definition: "Minor 3rd plus major 3rd from the root (e.g. D, F, A). Has a darker quality.", category: "Chord" },
      { term: "Fifth",        definition: "The top note of a triad. Always a perfect 5th above the root in major and minor triads.", category: "Concept" },
      { term: "Harmony",      definition: "The sound of two or more notes together. Chords are the building blocks of harmony.", category: "Concept" },
    ],
  },
  "int-tritone": {
    icon: "warning",
    terms: [
      { term: "Tritone",            definition: "6 half steps, exactly half an octave. The most dissonant interval in Western music.", category: "Interval" },
      { term: "Augmented 4th",      definition: "Another name for the tritone when spelled upward (e.g. C to F#).", category: "Interval" },
      { term: "Diminished 5th",     definition: "Another name for the tritone when spelled downward (e.g. B to F).", category: "Interval" },
      { term: "Dissonance",         definition: "A tense, unstable sound created by certain interval combinations.", category: "Concept" },
      { term: "Diabolus in musica", definition: "Latin for 'the devil in music.' The medieval nickname for the tritone, given because of its harsh sound.", category: "Concept" },
      { term: "F#",                 definition: "A half step above F. Forms a tritone with C.", category: "Note" },
    ],
  },
  "int-sight-sharps": {
    icon: "queue_music",
    terms: [
      { term: "F# on staff", definition: "F# sits on the first line of the treble staff, in the same position as F but with a sharp sign.", category: "Note" },
      { term: "C# on staff", definition: "C# sits on the third space, in the same position as C but raised a half step.", category: "Note" },
      { term: "G# on staff", definition: "G# sits on the second line, just above the G space.", category: "Note" },
      { term: "Key signature", definition: "Sharps or flats listed at the start of each line, applying to those notes throughout.", category: "Symbol" },
    ],
  },
  "int-singing-intervals": {
    icon: "mic",
    terms: [
      { term: "Perfect 4th",  definition: "5 semitones. Think 'Here Comes the Bride'. Sing from do to fa in solfege.", category: "Interval" },
      { term: "Perfect 5th",  definition: "7 semitones. Think the opening jump of 'Twinkle Twinkle Little Star'.", category: "Interval" },
      { term: "Major 3rd",    definition: "4 semitones. Think 'When the Saints Go Marching In'. The happy-sounding skip.", category: "Interval" },
      { term: "Solfege",      definition: "A vocal system using syllables Do Re Mi Fa Sol La Ti to name scale degrees.", category: "Concept" },
      { term: "Intonation",   definition: "Accuracy of pitch. Singing in tune means matching the target frequency precisely.", category: "Concept" },
    ],
  },
  "upper-all-intervals": {
    icon: "compare_arrows",
    terms: [
      { term: "Major 2nd",  definition: "2 half steps, a whole step (e.g. C to D). The building block of scales.", category: "Interval" },
      { term: "Minor 6th",  definition: "8 half steps. Sombre and expressive (e.g. E to C).", category: "Interval" },
      { term: "Minor 7th",  definition: "10 half steps. Bluesy and unresolved (e.g. C to A#). Core of dominant 7th chords.", category: "Interval" },
      { term: "Major 7th",  definition: "11 half steps. Creates a dreamy tension, sitting one half step below the octave (e.g. C to B).", category: "Interval" },
    ],
  },
  "upper-seventh-chords": {
    icon: "library_music",
    terms: [
      { term: "Seventh chord",   definition: "A triad plus a 7th above the root. Four notes total.", category: "Chord" },
      { term: "Major 7th chord", definition: "Major triad plus a major 7th (e.g. C, E, G, B). Lush and jazzy.", category: "Chord" },
      { term: "Dominant 7th",    definition: "Major triad plus a minor 7th (e.g. C, E, G, A#). Tense and strongly wants to resolve.", category: "Chord" },
      { term: "Minor 7th chord", definition: "Minor triad plus a minor 7th (e.g. D, F, A, C). Smooth and soulful.", category: "Chord" },
      { term: "Resolution",      definition: "The movement from a tense chord, like a dominant 7th, to a stable one.", category: "Concept" },
    ],
  },
  "upper-compound-intervals": {
    icon: "compare_arrows",
    terms: [
      { term: "Minor 2nd", definition: "1 half step, the smallest interval. Very dissonant (e.g. E to F).", category: "Interval" },
      { term: "Minor 3rd", definition: "3 half steps. Darker than a major 3rd and the defining interval of minor chords.", category: "Interval" },
      { term: "Major 6th", definition: "9 half steps. Warm and singable (e.g. C to A or D to B).", category: "Interval" },
      { term: "Minor 6th", definition: "8 half steps. Has a melancholic colour (e.g. E to C).", category: "Interval" },
    ],
  },
  "upper-sight-high": {
    icon: "queue_music",
    terms: [
      { term: "D5", definition: "On the 4th line of the treble staff, one octave above D4.", category: "Note" },
      { term: "F5", definition: "On the 4th space of the treble staff. High and bright.", category: "Note" },
      { term: "A5", definition: "Sits on the first ledger line above the staff.", category: "Note" },
      { term: "G5", definition: "Sits just above the top line of the staff.", category: "Note" },
      { term: "High register", definition: "Notes above the staff that require faster breath support and a raised soft palate when singing.", category: "Concept" },
    ],
  },
  "upper-chromatic-singing": {
    icon: "mic",
    terms: [
      { term: "Chromatic",  definition: "Using all 12 half steps, including the black keys (sharps and flats).", category: "Concept" },
      { term: "A# / B♭",   definition: "10 semitones above C. A flat, melancholy colour in most contexts.", category: "Note" },
      { term: "C#",         definition: "1 semitone above C. Adds a bright tension to the C major environment.", category: "Note" },
      { term: "F#",         definition: "6 semitones above C, the tritone away from C. Very distinctive.", category: "Note" },
      { term: "Microtonality", definition: "Precision in hitting exactly the right frequency. Chromatic notes require fine ear control.", category: "Concept" },
    ],
  },
  "adv-all-intervals": {
    icon: "compare_arrows",
    terms: [
      { term: "Minor 6th",  definition: "8 half steps. Easier to hear by going 5 down (e.g. E to C going down is a major 3rd).", category: "Interval" },
      { term: "Minor 7th",  definition: "10 half steps, the blues interval. Found in all dominant 7th chords.", category: "Interval" },
      { term: "Major 6th",  definition: "9 half steps. Can be heard as a minor 3rd going down (C to A equals A to C descending).", category: "Interval" },
      { term: "Inversion",  definition: "Flipping an interval upside-down. A major 3rd inverts to a minor 6th and both sum to 9.", category: "Concept" },
    ],
  },
  "adv-complex-chords": {
    icon: "library_music",
    terms: [
      { term: "Diminished triad", definition: "Minor 3rd plus minor 3rd (e.g. D, F, G#). Very tense and unstable.", category: "Chord" },
      { term: "Augmented triad",  definition: "Major 3rd plus major 3rd (e.g. C, E, G#). Dreamlike and ambiguous.", category: "Chord" },
      { term: "Add 9 chord",      definition: "A triad with the 9th added (the 2nd an octave up). Lush without the full complexity of a 7th chord.", category: "Chord" },
      { term: "Tension note",     definition: "A note added to a chord that creates harmonic colour and pull toward resolution.", category: "Concept" },
    ],
  },
  "adv-melodic-sight": {
    icon: "queue_music",
    terms: [
      { term: "E5",          definition: "Sits on the top line of the treble staff. Very high and bright.", category: "Note" },
      { term: "F#5",         definition: "One space above the top line. Requires a sharp eye for ledger lines.", category: "Note" },
      { term: "G5",          definition: "One ledger line above the staff.", category: "Note" },
      { term: "A5",          definition: "On the first ledger line above the staff and the highest commonly notated vocal note.", category: "Note" },
      { term: "Melodic reading", definition: "Sight-reading a single-voice melody, combining note identification with rhythm.", category: "Concept" },
    ],
  },
  "adv-chromatic-mastery": {
    icon: "mic",
    terms: [
      { term: "D#",         definition: "3 half steps above C. Enharmonic with E♭ and common in minor contexts.", category: "Note" },
      { term: "G#",         definition: "8 half steps above C. Has a blue note feel and defines augmented chords when paired with C.", category: "Note" },
      { term: "E5",         definition: "High E. Requires excellent breath control and a relaxed open throat.", category: "Note" },
      { term: "G5",         definition: "Very high G. Approaches the top of the classical soprano range.", category: "Note" },
      { term: "Vibrato",    definition: "A slight natural oscillation in pitch that adds warmth and expressiveness to sustained notes.", category: "Concept" },
    ],
  },
  "adv-expert-ear": {
    icon: "hearing",
    terms: [
      { term: "Relative pitch",  definition: "Identifying intervals by comparing two notes. The skill behind all ear training.", category: "Concept" },
      { term: "Absolute pitch",  definition: "Recognising a note's name without a reference tone. Rare but trainable.", category: "Concept" },
      { term: "Interval sprint", definition: "Identifying intervals rapidly without extended listening time. The expert goal.", category: "Concept" },
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

// Maps glossary term names to Tone.js-playable note strings
const NOTE_TERM_TO_TONE: Record<string, string> = {
  "C": "C4", "D": "D4", "E": "E4", "F": "F4", "G": "G4", "A": "A4", "B": "B4",
  "C#": "C#4", "F#": "F#4", "A# / B♭": "A#4", "D#": "D#4", "G#": "G#4",
  "C (middle C)": "C4",
  "C4": "C4", "C5": "C5",
  "D5": "D5", "E5": "E5", "F5": "F5", "F#5": "F#5", "G5": "G5", "A5": "A5",
};

interface Props {
  unitSlug: string;
  unitTitle: string;
  stageTitle: string;
}

export default function Guidebook({ unitSlug, unitTitle, stageTitle }: Props) {
  const guide = GLOSSARY[unitSlug] ?? FALLBACK;
  const [playingTerm, setPlayingTerm] = useState<string | null>(null);
  const synthRef = useRef<unknown>(null);

  const playNote = useCallback(async (toneNote: string, termKey: string) => {
    if (playingTerm) return;
    setPlayingTerm(termKey);
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (!synthRef.current) {
        synthRef.current = new Tone.Synth({ oscillator: { type: "triangle" } }).toDestination();
      }
      const synth = synthRef.current as InstanceType<typeof Tone.Synth>;
      synth.triggerAttackRelease(toneNote, "0.6");
      setTimeout(() => setPlayingTerm(null), 700);
    } catch {
      setPlayingTerm(null);
    }
  }, [playingTerm]);

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
        {guide.terms.map((item, i) => {
          const toneNote = item.category === "Note" ? NOTE_TERM_TO_TONE[item.term] : undefined;
          const isPlaying = playingTerm === item.term;
          return (
            <motion.div
              key={item.term}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.25 }}
            >
              <div
                onClick={toneNote ? () => playNote(toneNote, item.term) : undefined}
                className={toneNote ? "btn-ghost-hover" : undefined}
                style={{
                  backgroundColor: C.surfaceHigh,
                  border: `2px solid ${isPlaying ? CATEGORY_COLOR["Note"] : C.border}`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  display: "flex", alignItems: "flex-start", gap: 12,
                  cursor: toneNote ? "pointer" : "default",
                  transition: "border-color 0.15s, background-color 120ms ease",
                }}
              >
                <div style={{
                  backgroundColor: CATEGORY_COLOR[item.category],
                  borderRadius: 8,
                  padding: "3px 10px",
                  flexShrink: 0,
                  alignSelf: "flex-start",
                  marginTop: 1,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <span style={{
                    color: "white", fontFamily: "'Nunito', sans-serif",
                    fontSize: 13, fontWeight: 900,
                  }}>
                    {item.term}
                  </span>
                  {toneNote && (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}
                    >
                      {isPlaying ? "graphic_eq" : "volume_up"}
                    </span>
                  )}
                </div>
                <p style={{
                  color: C.muted, fontFamily: "'Nunito', sans-serif",
                  fontSize: 13, margin: 0, lineHeight: 1.55,
                }}>
                  {item.definition}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
