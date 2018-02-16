import Component from '@ember/component';
import { inject as service } from '@ember/service';

import PDFDocument from 'npm:pdfkit';
import blobStream from 'npm:blob-stream';

const characters = {
  A:
` ...
 .. ..
 .. ..
 .. ..
 .....
 .. ..
 .. ..
`,
  B:
`
....
.. ..
....
.. ..
.. ..
.. ..
....
`,
  'C':
`
 .....
..
..
..
..
..
 .....
`,
  'D':
`
....
.. ..
.. ..
.. ..
.. ..
.. ..
....
`,
  I:
`
..
..
..
..
..
..
..
`,
  'M':
`
.     .
..   ..
... ...
.......
.. . ..
..   ..
..   ..
`,
  N:
`
.   ..
..  ..
... ..
......
.. ...
..  ..
..   .
`,
  U:
`
.. ..
.. ..
.. ..
.. ..
.. ..
.. ..
 ...
`,
  X:
`
..  ..
..  ..
 ....
  ..
 ....
..  ..
..  ..
`,
  'a':
`


 ...
   ..
 ....
.. ..
 ....
`,
  'b':
`
..
..
....
.. ..
.. ..
.. ..
....
`,
  c:
`


 ...
..
..
..
 ...
`,
  'd':
`
   ..
   ..
 ....
.. ..
.. ..
.. ..
 ....
`,
  'e':
`


 ...
.. ..
.....
..
 ....
`,
  'f':
`
 ..
..
...
..
..
..
..
`,
  g:
`


 ....
.. ..
.. ..
 ....
   ..
 ...
`,
  'h':
`
..
..
....
.. ..
.. ..
.. ..
.. ..
`,
  i:
`
..

..
..
..
..
..
`,
  'l':
`
..
..
..
..
..
..
..
`,
m:
`


.......
.. .. ..
.. .. ..
.. .. ..
.. .. ..
`,
  'n':
`


....
.. ..
.. ..
.. ..
.. ..
`,
  'o':
`


 ...
.. ..
.. ..
.. ..
 ...
`,
  'p':
`


....
.. ..
.. ..
....
..
..
`,
  r:
`


.. .
....
..
..
..
`,
  't':
`
..
..
...
..
..
..
 ..
`,
  u:
`


.. ..
.. ..
.. ..
.. ..
 ....
`,
  v:
`


.. ..
.. ..
 ...
 ...
  .
`,
  'w':
`


..   ..
.. . ..
.. . ..
 .....
 .. ..
`,
  y:
`


.. ..
.. ..
.. ..
 ....
   ..
 ...
`,
  '0':
`
 ...
.. ..
.. ..
.. ..
.. ..
.. ..
 ...
`,
  '1':
`
 ..
...
 ..
 ..
 ..
 ..
 ..
`,
  '2':
`
....
   ..
   ..
 ...
..
..
.....
`,
  '4':
`
   ..
  ...
 . ..
.  ..
.....
   ..
   ..
`,
  '5':
`
....
.
....
   ..
   ..
   ..
....
`,
  '8':
`
 ...
.. ..
.. ..
 ...
.. ..
.. ..
 ...
`,
  '9':
`
 ...
.. ..
.. ..
.. ..
 ....
   ..
 ...
`,
  ' ':
`

`
};

const characterWidths = Object.keys(characters).reduce((widths, character) => {
  widths[character] = Math.max(...characters[character].split('\n').map(line => line.length));
  return widths;
}, {});

function wordWidth(word) {
  return word.split('').reduce((width, character) => {
    return width + (characterWidths[character] || 0) + 1;
  }, 0);
}

export default Component.extend({
  tagName: 'span',

  rendering: true,

  txtbeyond: service(),

  didInsertElement() {
    const debug = this.get('debug');

    const doc = new PDFDocument({layout: 'portrait'});
    const stream = doc.pipe(blobStream());

    const header = this.get('assets.header');
    const bold = this.get('assets.bold');
    const regular = this.get('assets.regular');

    // const pageWidth = 8.5*72;
    // const pageHeight = 11*72;

    this.get('teams').forEach(team => {
      team.get('meetings').forEach((meeting, index) => {
        doc.font(header);
        doc.text(`team ${team.get('name')}, meeting ${index}`);

        doc.font(regular);
        doc.text(`description: ${meeting.get('destination.description')}`);

        const pixelLength = 5;
        const pixelMargin = 0.5;
        const drawnLength = pixelLength - pixelMargin;

        doc.save();
        doc.translate(50, 0);

        this.get('txtbeyond').descriptionMasks(meeting.get('destination.description')).forEach(mask => {
          let leftOffset = 0;
          doc.translate(0, 200);

          const fontSize = 12;
          const lineGap = 8;
          const margin = 8;

          doc.rect(0, 0, wordWidth(mask)*pixelLength + margin*2, 8*pixelLength + fontSize + lineGap + margin*2);
          doc.stroke();

          doc.save();
          doc.translate(margin, margin);

          doc.fontSize(fontSize);
          doc.lineGap(lineGap);
          doc.font(header);
          doc.text(`@${this.get('txtbeyond').twitterName(team.get('name'))}`, 0, 0);

          mask.split('').forEach(character => {
            const characterMap = characters[character];

            if (characterMap) {
              const allLines = characterMap.split('\n');
              const lines = allLines.splice(1, allLines.length - 1);

              lines.forEach((line, row) => {
                line.split('').forEach((c, col) => {
                  if (c === '.') {
                    doc.rect(leftOffset*pixelLength + col*pixelLength, fontSize + lineGap + row*pixelLength, drawnLength, drawnLength);
                    doc.fill();
                  }
                });
              });

              leftOffset += characterWidths[character] + 1;
            } else {
              throw Error(`Couldn’t find character map for '${character}'`);
            }
          });
        });

        doc.restore();

        doc.restore();
        doc.addPage();
      });
    });

    doc.end();

    stream.on('finish', () => {
      this.$('iframe').attr('src', stream.toBlobURL('application/pdf'));
      this.set('rendering', false);
    });
  },

});
