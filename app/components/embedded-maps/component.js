import Ember from 'ember';

import PDFDocument from 'npm:pdfkit';
import blobStream from 'npm:blob-stream';

export default Ember.Component.extend({
  tagName: 'span',

  rendering: true,

  didInsertElement() {
    const doc = new PDFDocument({layout: 'landscape'});
    const stream = doc.pipe(blobStream());

    const header = this.get('assets.header');
    // const bold = this.get('assets.bold');
    // const regular = this.get('assets.regular');

    const map = this.get('assets.map');

    const mapOffsetX = 100;
    const mapOffsetY = 50;

    const mapMarkerFontSize = 12;
    const mapMarkerCircleRadius = 10;

    this.get('teams').forEach(team => {
      doc.image('data:image/png;base64,' + map, mapOffsetX, mapOffsetY, {scale: 0.125});

      doc.font(header);
      doc.fontSize(18);
      doc.text(team.get('name'));

      doc.fontSize(mapMarkerFontSize);

      team.hasMany('meetings').value().forEach((meeting, index) => {
        const destination = meeting.belongsTo('destination').value();
        const region = destination.belongsTo('region').value();

        const rendezvousLetter = String.fromCharCode(65 + index);

        const x = region.get('x')/2 + mapOffsetX;
        const y = region.get('y')/2 + mapOffsetY;

        doc.lineWidth(1);
        doc.circle(x, y, mapMarkerCircleRadius).stroke();

        doc.text(rendezvousLetter, x - mapMarkerCircleRadius, y - mapMarkerFontSize/2, {
          width: mapMarkerCircleRadius*2,
          align: 'center'
        });
      });

      doc.addPage();
    });

    doc.end();

    stream.on('finish', () => {
      this.$('iframe').attr('src', stream.toBlobURL('application/pdf'));
      this.set('rendering', false);
    });
  }
});
