import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import CopyButton from 'ember-cli-clipboard/components/copy-button';
import knex from 'knex';
import { concat } from '@ember/helper';

export default class TeamOverviewsComponent extends Component {
  @tracked src;

  @service('unmnemonic-devices') devices;

  getterNames = ['books', 'regions', 'destinations', 'meetings'];

  get allQueries() {
    return (
      this.getterNames
        .map((getterName) => this[getterName].toString())
        .join(';\n\n') + ';\n'
    );
  }

  get outputs() {
    return this.getterNames.map((getterName) => ({
      name: getterName,
      query: this[getterName].toString(),
    }));
  }

  get regions() {
    return knex({ client: 'pg' })('unmnemonic_devices.regions')
      .insert(
        this.args.regions.filterBy('isComplete').map((region) => ({
          id: region.get('id'),
          name: this.stripString(region.get('name')),
        }))
      )
      .onConflict('id')
      .merge();
  }

  get destinations() {
    return knex({ client: 'pg' })('unmnemonic_devices.destinations')
      .insert(
        this.args.destinations.filterBy('isComplete').map((destination) => ({
          id: destination.get('id'),
          description: this.stripString(destination.get('description')),
          region_id: this.stripString(destination.get('region.id')),
          answer: this.devices.extractAnswer(
            destination.answer,
            destination.mask
          ),
        }))
      )
      .onConflict('id')
      .merge();
  }

  get books() {
    return knex({ client: 'pg' })('unmnemonic_devices.books')
      .insert(
        this.args.waypoints.filterBy('isComplete').map((waypoint) => ({
          id: waypoint.get('id'),
          title: this.stripString(waypoint.get('name')),
          excerpt: this.stripString(
            this.devices.trimmedInnerExcerpt(waypoint.get('excerpt'))
          ),
        }))
      )
      .onConflict('id')
      .merge();
  }

  get meetings() {
    return knex({ client: 'pg' })('unmnemonic_devices.meetings')
      .insert(
        this.args.meetings.map((meeting) => ({
          id: meeting.get('id'),
          team_id: meeting.get('teams.firstObject.id'),
          book_id: meeting.get('waypoint.id'),
          destination_id: meeting.get('destination.id'),
        }))
      )
      .onConflict(['id'])
      .merge();
  }

  stripString(s) {
    return s.replace(/’/g, "'").replace(/[”“]/g, '"');
  }

  <template>
    <table>
      <tbody>
        <tr>
          <td colspan='2'><CopyButton
              class='button'
              @text={{this.allQueries}}
            >Copy all</CopyButton></td>
        </tr>
      </tbody>
      <tbody>
        {{#each this.outputs as |output|}}
          <tr>
            <td>{{output.name}}</td>
            <td>
              <CopyButton
                class='button'
                @text={{output.query}}
              >Copy</CopyButton>

              <textarea
                rows='10'
                aria-label={{concat 'VRS SQL: ' output.name}}
                disabled
              >{{output.query}}</textarea>
            </td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  </template>
}
