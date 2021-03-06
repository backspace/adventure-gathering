import { hash, all } from 'rsvp';
import { inject as service } from '@ember/service';
import Route from '@ember/routing/route';

export default Route.extend({
  queryParams: {
    debug: {
      refreshModel: true
    }
  },

  map: service(),
  features: service(),

  txtbeyond: service(),

  model() {
    let fontPaths;

    if (this.get('features.clandestineRendezvous')) {
      fontPaths = [
        fetch('/fonts/blackout.ttf'),
        fetch('/fonts/Oswald-Bold.ttf'),
        fetch('/fonts/Oswald-Regular.ttf')
      ];
    } else if (this.get('features.txtbeyond')) {
      fontPaths = [
        fetch('/fonts/nokiafc22.ttf'),
        fetch('/fonts/Arvo-Bold.ttf'),
        fetch('/fonts/Arvo-Regular.ttf')
      ];
    }
    return hash({
      teams: this.store.findAll('team'),
      meetings: this.store.findAll('meeting'),
      destinations: this.store.findAll('destination'),
      regions: this.store.findAll('region'),

      settings: this.store.findRecord('settings', 'settings'),

      assets: all(fontPaths).then(responses => {
        return all(responses.map(response => response.arrayBuffer()));
      }).then(([header, bold, regular]) => {
        return hash({
          header, bold, regular,
          map: this.get('map').getBase64String('high')
        });
      })
    });
  },

  afterModel(model) {
    if (model.settings.get('txtbeyond')) {
      return this.get('txtbeyond').assignMeetingPhones(model.teams, model.meetings);
    }
  }
});
