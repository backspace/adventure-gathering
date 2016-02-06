import Ember from 'ember';

import blobUtil from 'npm:blob-util';

export default Ember.Service.extend({
  db: Ember.computed(function() {
    return Ember.getOwner(this).lookup('adapter:application').get('db');
  }),

  getAttachment(name) {
    return this.get('db').getAttachment('map', name);
  },

  getURL(name) {
    return this.getAttachment(name).then(attachment => {
      return URL.createObjectURL(attachment);
    }).catch(() => {
      return null;
    });
  },

  getArrayBuffer(name) {
    return this.getAttachment(name).then(attachment => {
      return blobUtil.blobToArrayBuffer(attachment);
    });
  },

  getBase64String(name) {
    return this.getAttachment(name).then(attachment => {
      return blobUtil.blobToBase64String(attachment);
    });
  },

  saveFile(file, name) {
    const db = this.get('db');

    db.get('map').then(map => {
      return db.putAttachment('map', name, map._rev, file, file.type);
    }).catch(() => {
      return db.putAttachment('map', name, file, file.type);
    });
  }
});
