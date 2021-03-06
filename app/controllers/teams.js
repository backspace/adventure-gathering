import { all } from 'rsvp';
import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    save() {
      const {data: teams} = JSON.parse(this.get('teamsJSON'));

      all(this.get('model').map(model => {
        return model.reload().then(reloaded => reloaded.destroyRecord());
      })).then(() => {
        const teamRecords = teams.map(({attributes}) => {
          const teamRecord = this.store.createRecord('team');
          teamRecord.setProperties(attributes);

          return teamRecord.save();
        });

        return all(teamRecords);
      });
    }
  }
});
