import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    const db = this.container.lookup('adapter:application').get('db');

    return db.getAttachment('map', 'map.png').then(attachment => {
      return attachment;
    }).catch(() => {
      return null;
    });
  },

  setupController(controller, attachment) {
    this._super();

    controller.set('model', this.modelFor('regions'));

    if (attachment) {
      const src = URL.createObjectURL(attachment);
      controller.set('mapSrc', src);
    }
  }
});