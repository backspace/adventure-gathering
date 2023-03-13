import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

import blobStream from 'blob-stream';
import PDFDocument from 'pdfkit';

const pageMargin = 0.5 * 72;
const pagePadding = 0.25 * 72;

export default class EmbeddedUnmnemonicDevicesOverlaysComponent extends Component {
  @tracked src;

  @service('unmnemonic-devices') devices;

  constructor() {
    super(...arguments);

    let regular = this.args.assets.regular;

    let doc = new PDFDocument({ layout: 'portrait', font: regular });
    let stream = doc.pipe(blobStream());

    this.args.waypoints.filterBy('isComplete').forEach((waypoint, index) => {
      if (index > 0) {
        doc.addPage();
      }

      doc.save();

      doc.translate(pageMargin, pageMargin);

      let [width, height] = this.devices.parsedDimensions(waypoint.dimensions);

      doc.rect(0, 0, width, height).fillAndStroke('#ccc', 'black');

      doc
        .fillColor('black')
        .strokeColor('white')
        .lineWidth(3)
        .text(waypoint.get('name'), pagePadding, pagePadding, {
          fill: true,
          stroke: true,
        });

      doc
        .fillColor('black')
        .lineWidth(1)
        .text(waypoint.get('name'), pagePadding, pagePadding);

      doc.strokeColor('black');

      let [[startX, startY], outlinePoints] = this.devices.parsedOutline(
        waypoint.outline
      );

      doc.moveTo(startX, startY);

      outlinePoints.forEach(([displacementX, displacementY]) => {
        doc.lineTo(displacementX, displacementY);
      });

      doc.stroke();

      if (this.args.debug) {
        doc.text(waypoint.dimensions, 0, height);
        doc.text(waypoint.outline);
        doc.text(waypoint.excerpt);
      }

      doc.restore();
    });

    doc.end();

    stream.on('finish', () => {
      this.rendering = false;
      this.src = stream.toBlobURL('application/pdf');
    });
  }

  get iframeSrc() {}

  <template>
    FIXME these should be team-specific, not all waypoints
    {{#if this.rendering}}
      …
    {{else}}
      <iframe title='embedded-unmnemonic-devices-overlays' src={{this.src}}>
      </iframe>
    {{/if}}
  </template>
}
