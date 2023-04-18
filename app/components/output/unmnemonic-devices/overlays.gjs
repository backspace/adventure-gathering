import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import { trackedFunction } from 'ember-resources/util/function';
import { Input } from '@ember/component';

import {
  drawZigzagBackground,
  drawConcentricCirclesBackground,
  drawSpiralBackground,
  drawConcentricSquaresBackground,
  drawConcentricStarsBackground,
} from './overlay-backgrounds';

import blobStream from 'blob-stream';
import PDFDocument from 'pdfkit';

export const PAGE_MARGIN = 0.5 * 72;
export const PAGE_PADDING = 0.25 * 72;

export const BACKGROUND_COUNT = 5;
export const OUTLINE_WIDTH = 4;
export const TEAM_FONT_SIZE = 14;
export const TEAM_GAP_SIZE = PAGE_PADDING;
export const EXCERPT_HEIGHT = 10;
export const EXCERPT_GAP = 5;

let registrationPadding = PAGE_PADDING;
let registrationLength = PAGE_PADDING;
let registrationTotal = registrationPadding + registrationLength;

export default class UnmnemonicDevicesOverlaysComponent extends Component {
  @tracked allOverlays = true;

  @service('unmnemonic-devices') devices;

  generator = trackedFunction(this, async () => {
    let regular = this.args.assets.regular;

    let doc = new PDFDocument({ layout: 'portrait', font: regular });
    let stream = doc.pipe(blobStream());

    let waypointsToGenerate;

    if (this.allOverlays) {
      waypointsToGenerate = this.args.waypoints.filterBy('isComplete');
    } else {
      waypointsToGenerate = this.args.teams.reduce((waypoints, team) => {
        team.meetings.forEach((meeting) =>
          waypoints.push({ team, waypoint: meeting.get('waypoint') })
        );
        return waypoints;
      }, []);
    }

    waypointsToGenerate.forEach((maybeTeamAndWaypoint, index) => {
      let waypoint = maybeTeamAndWaypoint.waypoint || maybeTeamAndWaypoint;

      let dimensions = waypoint.get('dimensions');
      let regionAndCall = `${waypoint.get('region.name')}: ${waypoint.get(
        'call'
      )}`;
      let waypointName = waypoint.get('name');
      let excerpt = waypoint.get('excerpt');
      let outline = waypoint.get('outline');
      let page = waypoint.get('page');

      if (index > 0) {
        doc.addPage();
      }

      doc.save();
      doc.translate(PAGE_MARGIN, PAGE_MARGIN);

      let [width, height] = this.devices.parsedDimensions(dimensions);

      let team = maybeTeamAndWaypoint.team;

      doc.save();
      doc.translate(
        registrationLength + registrationPadding,
        registrationLength + registrationPadding
      );

      doc.lineWidth(0.25);

      // NW ver
      doc
        .moveTo(0, -registrationPadding)
        .lineTo(0, -registrationTotal)
        .stroke();

      // NW hor
      doc
        .moveTo(-registrationPadding, 0)
        .lineTo(-registrationTotal, 0)
        .stroke();

      // NE ver
      doc
        .moveTo(width, -registrationPadding)
        .lineTo(width, -registrationTotal)
        .stroke();

      // NE hor
      doc
        .moveTo(width + registrationPadding, 0)
        .lineTo(width + registrationTotal, 0)
        .stroke();

      let teamBottomMargin = team ? TEAM_FONT_SIZE + TEAM_GAP_SIZE : 0;

      doc.save();
      doc.translate(0, teamBottomMargin);

      // SW ver
      doc
        .moveTo(0, height + registrationPadding)
        .lineTo(0, height + registrationTotal)
        .stroke();

      // SW hor
      doc
        .moveTo(-registrationPadding, height)
        .lineTo(-registrationTotal, height)
        .stroke();

      // SE ver
      doc
        .moveTo(width, height + registrationPadding)
        .lineTo(width, height + registrationTotal)
        .stroke();

      // SE hor
      doc
        .moveTo(width + registrationPadding, height)
        .lineTo(width + registrationTotal, height)
        .stroke();

      // Maybe team margin
      doc.restore();

      doc.save();
      doc.rect(0, 0, width, height).clip();

      let backgroundIndex = index % BACKGROUND_COUNT;

      if (backgroundIndex === 0) {
        drawZigzagBackground(doc, width, height);
      } else if (backgroundIndex === 1) {
        drawConcentricCirclesBackground(doc, width, height);
      } else if (backgroundIndex === 2) {
        drawSpiralBackground(doc, width, height);
      } else if (backgroundIndex === 3) {
        drawConcentricSquaresBackground(doc, width, height);
      } else if (backgroundIndex === 4) {
        drawConcentricStarsBackground(doc, width, height);
      }

      doc.restore();

      doc.fontSize(14);

      let upperLeftText, upperRightText;

      if (page % 2 === 0) {
        upperLeftText = page;
        upperRightText = waypointName;
      } else {
        upperLeftText = waypointName;
        upperRightText = page;
      }

      doc
        .fillColor('black')
        .strokeColor('white')
        .lineWidth(OUTLINE_WIDTH)
        .text(upperLeftText, PAGE_PADDING, PAGE_PADDING, {
          fill: true,
          stroke: true,
        })
        .text(upperRightText, PAGE_PADDING, PAGE_PADDING, {
          width: width - PAGE_PADDING * 2,
          align: 'right',
          fill: true,
          stroke: true,
        })
        .text(
          regionAndCall,
          PAGE_PADDING,
          height - doc.currentLineHeight() - PAGE_PADDING,
          { stroke: true, fill: true }
        );

      doc
        .fillColor('black')
        .lineWidth(1)
        .text(upperLeftText, PAGE_PADDING, PAGE_PADDING)
        .text(upperRightText, PAGE_PADDING, PAGE_PADDING, {
          width: width - PAGE_PADDING * 2,
          align: 'right',
        })
        .text(
          regionAndCall,
          PAGE_PADDING,
          height - doc.currentLineHeight() - PAGE_PADDING
        );

      doc.strokeColor('black');

      let { end, points: outlinePoints } = this.devices.parsedOutline(outline);

      let [startX, startY] = outlinePoints.shift();

      doc.moveTo(startX, startY);

      outlinePoints.forEach(([displacementX, displacementY]) => {
        doc.lineTo(displacementX, displacementY);
      });

      doc.fillAndStroke('white', 'black');

      if (this.args.debug) {
        doc.text(dimensions, 0, height);
        doc.text(outline);
        doc.text(excerpt);
      }

      let preExcerpt = this.devices.preExcerpt(excerpt),
        postExcerpt = this.devices.postExcerpt(excerpt);

      doc.fontSize(EXCERPT_HEIGHT);

      let preExcerptWidth = doc.widthOfString(preExcerpt);
      let postExcerptWidth = doc.widthOfString(postExcerpt);

      let preExcerptX = 0,
        preExcerptY = startY,
        preExcerptAlign = 'right',
        preExcerptWidthObject = { width: startX - EXCERPT_GAP };

      if (startX - preExcerptWidth < PAGE_PADDING) {
        preExcerptX = 0;
        preExcerptY -= EXCERPT_HEIGHT;
        preExcerptAlign = 'right';
        preExcerptWidthObject = { width: width - PAGE_PADDING };
      }

      let postExcerptX = end[0] + EXCERPT_GAP,
        postExcerptY = end[1],
        postExcerptAlign = 'left';

      if (end[0] + postExcerptWidth > width - PAGE_PADDING) {
        postExcerptX = PAGE_PADDING;
        postExcerptY += EXCERPT_HEIGHT;
        postExcerptAlign = 'left';
      }

      // Print text outlines and then text atop them
      let excerptTextModifications = [
        { lineWidth: OUTLINE_WIDTH, textOptions: { fill: true, stroke: true } },
        { lineWidth: 1 },
      ];

      excerptTextModifications.forEach(({ lineWidth, textOptions }) => {
        doc
          .fillColor('black')
          .strokeColor('white')
          .lineWidth(lineWidth)
          .text(preExcerpt, preExcerptX, preExcerptY, {
            align: preExcerptAlign,
            ...preExcerptWidthObject,
            ...textOptions,
          })
          .text(postExcerpt, postExcerptX, postExcerptY, {
            align: postExcerptAlign,
            ...textOptions,
          });
      });

      if (team) {
        doc.fontSize(TEAM_FONT_SIZE);
        doc
          .fillColor('black')
          .text(
            team.name,
            PAGE_PADDING,
            height + TEAM_GAP_SIZE - TEAM_FONT_SIZE
          );
      }

      // Registration marks
      doc.restore();

      // Margins
      doc.restore();
    });

    doc.end();

    let blobUrl = await new Promise((resolve) => {
      stream.on('finish', () => {
        this.rendering = false;
        resolve(stream.toBlobURL('application/pdf'));
      });
    });

    return blobUrl;
  });

  get src() {
    return this.generator.value ?? undefined;
  }

  <template>
    <label>
      All overlays instead of per-team?
      <Input @type='checkbox' @checked={{this.allOverlays}} />
    </label>

    {{#if this.src}}
      <iframe title='embedded-unmnemonic-devices-overlays' src={{this.src}}>
      </iframe>
    {{else}}
      …
    {{/if}}
  </template>
}
