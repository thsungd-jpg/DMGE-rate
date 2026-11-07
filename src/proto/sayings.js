// What the black screen says after the hero: a pair of lines that read as one calm thought. The first is a familiar saying about money, the second is
// an original turn that lands it on pricing creative work. One pair is picked at random on load (never the one you saw last time), and each time you scroll
// back up to the top the next visit to the message shows a different pair, so it changes from time to time.
//
// Keep a pair to about 15 words so it fits the screen at full size. Put *stars* round the word or words that should glow yellow, the way "work" does in
// the headline (one per pair is plenty). The first lines are adages and the turns are originals, so there is nothing to credit.
export const SAYINGS = [
  ["Every craft carries a different price.", "Yours deserves to be *priced* like it."],        // the original line, as a pair
  ["Pay yourself first.", "Your rate is where that *starts*."],                             // the classic saving rule
  ["Save for a rainy day.", "*Price* for one, too."],                                       // slow months are part of the price
  ["A penny saved is a penny earned.", "So is a discount *refused*."],
  ["You get what you pay for.", "So do your *clients*."],
  ["Compound interest rewards the patient.", "So does a *fair* rate."],
  ["Always leave a margin of safety.", "In your schedule. In your *rate*."],                // the investing idea, applied to time and price
  ["Price is what you charge.", "*Value* is what they get."],                               // a turn on the old line about price and value
  ["Know your number.", "Then say it *calmly*."],
  ["Don't put all your eggs in one basket.", "Or all your hours with one *client*."],
  ["Nothing ventured, nothing gained.", "Quote the number you *believe*."],
  ["Invest in yourself.", "Then *invoice* for it."],
  ["There is no such thing as a free lunch.", "Or a free *revision*."],
];
